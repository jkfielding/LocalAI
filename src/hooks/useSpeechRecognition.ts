import { useState, useEffect, useCallback, useRef } from 'react';

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onerror: ((event: SpeechRecognitionHookErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  0: { transcript: string };
}

interface SpeechRecognitionResultEvent {
  resultIndex: number;
  results: SpeechRecognitionResult[];
}

interface SpeechRecognitionHookErrorEvent {
  error: string;
}

interface WindowWithSpeechRecognition extends Window {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

interface UseSpeechRecognitionProps {
  onResult: (transcript: string) => void;
  onError?: (error: string) => void;
  continuous?: boolean;
  language?: string;
}

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  transcript: string;
  error: string | null;
}

export const useSpeechRecognition = ({
  onResult,
  onError,
  continuous = false,
  language = 'en-US'
}: UseSpeechRecognitionProps): UseSpeechRecognitionReturn => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    const SpeechRecognition = (window as WindowWithSpeechRecognition).SpeechRecognition
      || (window as WindowWithSpeechRecognition).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = continuous;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = language;

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognitionRef.current.onresult = (event: SpeechRecognitionResultEvent) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(interimTranscript || finalTranscript);

        if (finalTranscript) {
          onResult(finalTranscript.trim());
          if (!continuous) {
            setTranscript('');
          }
        }
      };

      recognitionRef.current.onerror = (event: SpeechRecognitionHookErrorEvent) => {
        const errorMessage = `Speech recognition error: ${event.error}`;
        setError(errorMessage);
        setIsListening(false);
        
        if (onError) {
          onError(errorMessage);
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        setTranscript('');
      };
    } else {
      setIsSupported(false);
      setError('Speech recognition is not supported in this browser');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [continuous, language, onResult, onError]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        setError('Failed to start speech recognition');
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  return {
    isListening,
    isSupported,
    startListening,
    stopListening,
    transcript,
    error
  };
};
