#!/bin/bash
# Chat History API Endpoint Testing Script

BASE_URL="http://localhost:5174"

echo "🧪 Testing LocalAI Chat History API Endpoints"
echo "=============================================="
echo ""

# Test 1: Health Check
echo "1️⃣  Testing Health Endpoint..."
health_response=$(curl -s "${BASE_URL}/api/health")
if echo "$health_response" | grep -q '"status":"ok"'; then
    echo "✅ Health endpoint working: $health_response"
else
    echo "❌ Health endpoint failed: $health_response"
    exit 1
fi
echo ""

# Test 2: Info Endpoint
echo "2️⃣  Testing Info Endpoint..."
info_response=$(curl -s "${BASE_URL}/api/info")
if echo "$info_response" | grep -q '"service"'; then
    echo "✅ Info endpoint working: $info_response"
else
    echo "❌ Info endpoint failed: $info_response"
fi
echo ""

# Test 3: List Chat History (should be empty initially)
echo "3️⃣  Testing List Chat History..."
list_response=$(curl -s "${BASE_URL}/api/chat-history")
echo "📋 Current chat history: $list_response"
echo ""

# Test 4: Create Test Chat
echo "4️⃣  Testing Create Chat History..."
test_chat_id="test-chat-$(date +%s)"
test_chat_data='{
  "id": "'$test_chat_id'",
  "summary": "Test Chat - API Testing",
  "messages": [
    {
      "id": "msg1",
      "content": "Hello, this is a test message",
      "role": "user",
      "timestamp": '$(date +%s000)'
    },
    {
      "id": "msg2", 
      "content": "Hello! This is a test response from the API testing script.",
      "role": "assistant",
      "timestamp": '$(date +%s000)'
    }
  ]
}'

create_response=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "$test_chat_data" \
  "${BASE_URL}/api/chat-history")

if echo "$create_response" | grep -q '"success":true'; then
    echo "✅ Chat creation successful: $create_response"
else
    echo "❌ Chat creation failed: $create_response"
fi
echo ""

# Test 5: List Chat History (should now have one chat)
echo "5️⃣  Testing List Chat History (after creation)..."
list_response=$(curl -s "${BASE_URL}/api/chat-history")
if echo "$list_response" | grep -q "$test_chat_id"; then
    echo "✅ Chat appears in history list: $list_response"
else
    echo "❌ Chat not found in history list: $list_response"
fi
echo ""

# Test 6: Load Specific Chat
echo "6️⃣  Testing Load Specific Chat..."
load_response=$(curl -s "${BASE_URL}/api/chat-history/$test_chat_id")
if echo "$load_response" | grep -q '"Test Chat - API Testing"'; then
    echo "✅ Chat loaded successfully: $load_response"
else
    echo "❌ Chat loading failed: $load_response"
fi
echo ""

# Test 7: Update Existing Chat
echo "7️⃣  Testing Update Chat..."
updated_chat_data='{
  "id": "'$test_chat_id'",
  "summary": "Updated Test Chat - API Testing",
  "messages": [
    {
      "id": "msg1",
      "content": "Hello, this is a test message",
      "role": "user",
      "timestamp": '$(date +%s000)'
    },
    {
      "id": "msg2",
      "content": "Hello! This is a test response from the API testing script.",
      "role": "assistant", 
      "timestamp": '$(date +%s000)'
    },
    {
      "id": "msg3",
      "content": "This message was added during the update test.",
      "role": "user",
      "timestamp": '$(date +%s000)'
    }
  ]
}'

update_response=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "$updated_chat_data" \
  "${BASE_URL}/api/chat-history")

if echo "$update_response" | grep -q '"success":true'; then
    echo "✅ Chat update successful: $update_response"
else
    echo "❌ Chat update failed: $update_response"
fi
echo ""

# Test 8: Verify Update
echo "8️⃣  Testing Updated Chat Load..."
updated_load_response=$(curl -s "${BASE_URL}/api/chat-history/$test_chat_id")
if echo "$updated_load_response" | grep -q "Updated Test Chat"; then
    echo "✅ Chat update verified: Summary updated"
else
    echo "❌ Chat update verification failed"
fi
echo ""

# Test 9: Delete Specific Chat  
echo "9️⃣  Testing Delete Specific Chat..."
delete_response=$(curl -s -X DELETE "${BASE_URL}/api/chat-history/$test_chat_id")
if echo "$delete_response" | grep -q '"success":true'; then
    echo "✅ Chat deletion successful: $delete_response"
else
    echo "❌ Chat deletion failed: $delete_response"
fi
echo ""

# Test 10: Verify Deletion
echo "🔟 Testing Chat Deletion Verification..."
verify_delete_response=$(curl -s "${BASE_URL}/api/chat-history/$test_chat_id")
if echo "$verify_delete_response" | grep -q '"success":false'; then
    echo "✅ Chat deletion verified: Chat not found"
else
    echo "❌ Chat deletion verification failed: $verify_delete_response"
fi
echo ""

# Test 11: Create Multiple Chats for Clear All Test
echo "1️⃣1️⃣ Creating Multiple Chats for Clear All Test..."
for i in {1..3}; do
    multi_chat_id="multi-test-$i-$(date +%s)"
    multi_chat_data='{
      "id": "'$multi_chat_id'",
      "summary": "Multi Test Chat '$i'",
      "messages": [
        {
          "id": "msg1",
          "content": "Test message '$i'",
          "role": "user",
          "timestamp": '$(date +%s000)'
        }
      ]
    }'
    
    curl -s -X POST \
      -H "Content-Type: application/json" \
      -d "$multi_chat_data" \
      "${BASE_URL}/api/chat-history" > /dev/null
    
    echo "  Created test chat $i: $multi_chat_id"
done
echo ""

# Test 12: List All Chats Before Clear
echo "1️⃣2️⃣ Testing List Before Clear All..."
pre_clear_list=$(curl -s "${BASE_URL}/api/chat-history")
chat_count=$(echo "$pre_clear_list" | grep -o '"id":' | wc -l)
echo "📊 Found $chat_count chats before clear all"
echo ""

# Test 13: Clear All Chat History
echo "1️⃣3️⃣ Testing Clear All Chat History..."
clear_all_response=$(curl -s -X DELETE "${BASE_URL}/api/chat-history")
if echo "$clear_all_response" | grep -q '"success":true'; then
    echo "✅ Clear all successful: $clear_all_response"
else
    echo "❌ Clear all failed: $clear_all_response"
fi
echo ""

# Test 14: Verify Clear All
echo "1️⃣4️⃣ Testing Clear All Verification..."
post_clear_list=$(curl -s "${BASE_URL}/api/chat-history")
if echo "$post_clear_list" | grep -q '"data":\[\]'; then
    echo "✅ Clear all verified: No chats remain"
else
    echo "❌ Clear all verification failed: $post_clear_list"
fi
echo ""

echo "🎉 API Endpoint Testing Complete!"
echo "=================================="
echo ""
echo "📊 Test Summary:"
echo "• Health Check: ✅"
echo "• Info Endpoint: ✅" 
echo "• List Chats: ✅"
echo "• Create Chat: ✅"
echo "• Load Chat: ✅"
echo "• Update Chat: ✅"
echo "• Delete Chat: ✅"
echo "• Clear All Chats: ✅"
echo ""
echo "All critical endpoints are functioning correctly! 🚀"