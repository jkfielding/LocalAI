# Auto-Scrolling Feature

LocalAI Chat now includes intelligent auto-scrolling that enhances the user experience during AI conversations.

## How It Works

### 🤖 Smart Following
- **Automatic Scrolling**: When the AI is generating text, the chat automatically scrolls to follow the streaming response
- **User Control**: When you scroll up to read previous messages, auto-scrolling pauses
- **Resume Following**: Scroll back to the bottom to resume automatic following

### 🎯 Key Features

#### Auto-Scroll Behavior
- ✅ **Follows Streaming**: Automatically scrolls during AI text generation
- ✅ **Respects User Intent**: Stops auto-scrolling when you scroll up
- ✅ **Smart Detection**: Detects when you're near the bottom (within 100px)
- ✅ **Smooth Resumption**: Returns to following when you scroll to bottom

#### Visual Indicators
- 🔵 **Scroll to Bottom Button**: Appears when you scroll up during generation
- 📍 **Live Indicator**: Small pulsing dot shows active generation
- ⬇️ **Quick Return**: One-click to jump back to following mode

#### Performance Optimized
- ⚡ **Instant Scrolling**: Uses instant scroll during streaming for smoothness
- 🎚️ **Smooth Transitions**: User-triggered scrolling uses smooth animation
- 🔄 **Efficient Updates**: Only scrolls when necessary

## User Experience

### Reading Long Responses
1. **AI starts generating** → Chat automatically scrolls to follow
2. **You scroll up to read** → Auto-scrolling pauses automatically
3. **Take your time reading** → Chat stays where you scrolled
4. **Ready to continue?** → Scroll to bottom or click the button
5. **Auto-scrolling resumes** → Follows new text generation

### Visual Feedback
- **Bottom of chat**: Auto-scrolling active, no button visible
- **Scrolled up**: "Scroll to bottom" button appears
- **During generation**: Button shows pulsing indicator
- **Manual scroll to bottom**: Button disappears, auto-scrolling resumes

## Technical Implementation

### Scroll Detection
```javascript
// Detects if user is within 100px of bottom
const isNearBottom = () => {
  const { scrollTop, scrollHeight, clientHeight } = chatArea;
  return scrollHeight - scrollTop - clientHeight <= 100;
}
```

### Auto-Scroll Logic
- **Triggered by**: New messages, streaming updates, loading states
- **Condition**: Only when `isAutoScrolling` is true
- **Type**: Instant scroll during streaming, smooth for user actions
- **Threshold**: 100px from bottom to resume auto-scrolling

### State Management
- `isAutoScrolling`: Boolean tracking if auto-scroll is active
- `showScrollToBottom`: Boolean controlling button visibility
- Updates based on scroll position and user interaction

## Benefits

### For Fast Readers
- Never miss new content
- Seamless reading experience
- No manual scrolling needed

### For Slow Readers
- Read at your own pace
- No forced scrolling
- Easy to catch up when ready

### For Long Responses
- Handle lengthy AI responses gracefully
- Review earlier parts without losing place
- Quick return to live generation

This feature makes LocalAI Chat feel more like a natural conversation, where you can read at your own pace while staying connected to the ongoing AI response!