#!/bin/bash

# Interactive Claude Code agent invoker with Memory Support
# Usage: ./invoke_claude_code.sh [initial_prompt] [actor_id] [session_id]

set -e

INFO_FILE="deployment.json"

# Check if deployment info exists
if [ ! -f "$INFO_FILE" ]; then
    echo "❌ Error: Deployment info file not found: $INFO_FILE"
    echo "Please run './deploy.sh' first to deploy the agent."
    exit 1
fi

# Function to invoke agent using Python
invoke_agent() {
    local prompt="$1"
    local actor_id="$2"
    local session_id="$3"
    
    python3 -c "
import json
import sys
import boto3
from datetime import datetime

def invoke_agent(prompt, actor_id, session_id):
    try:
        with open('deployment.json', 'r') as f:
            deployment = json.load(f)
        
        runtime_arn = deployment['runtime_arn']
        region = deployment['region']
        
        print('🚀 Invoking Claude Code Agent with Memory...')
        print(f'📝 Prompt: {prompt}')
        print(f'👤 Actor ID: {actor_id}')
        print(f'🔗 Session ID: {session_id}')
        print('🧠 Checking memory status...')
        print('⏳ This may take some time depending on your prompt...')
        print('')
        
        payload = {
            'input': {
                'prompt': prompt,
                'actor_id': actor_id,
                'session_id': session_id,
                'permission_mode': 'acceptEdits',
                'allowed_tools': 'Bash,Read,Write,Replace,Search,List,WebFetch,AskFollowup'
            }
        }
        
        # Create client with increased timeout (5 minutes for complex tasks)
        config = boto3.session.Config(
            read_timeout=300,
            connect_timeout=60,
            retries={'max_attempts': 3}
        )
        client = boto3.client('bedrock-agentcore', region_name=region, config=config)
        response = client.invoke_agent_runtime(
            agentRuntimeArn=runtime_arn,
            payload=json.dumps(payload)
        )
        
        print('✅ Invocation completed!')
        print('')
        
        response_body = response['response'].read().decode('utf-8')
        response_data = json.loads(response_body)
        output_data = response_data.get('output', response_data)
        
        print('📊 Results:')
        print(f'   Success: {output_data.get(\"success\", \"Unknown\")}')
        print(f'   Duration: {output_data.get(\"metadata\", {}).get(\"duration_ms\", 0)}ms')
        print(f'   Turns: {output_data.get(\"metadata\", {}).get(\"num_turns\", 0)}')
        print(f'   Memory: {output_data.get(\"metadata\", {}).get(\"memory_enabled\", False)}')
        print('')
        
        if output_data.get('success'):
            print('📝 Agent Response:')
            print(output_data.get('result', 'No result'))
            print('')
            
            uploaded_files = output_data.get('metadata', {}).get('uploaded_files')
            if uploaded_files:
                print('📁 Generated Files:')
                for file_info in uploaded_files:
                    print(f'   • {file_info.get(\"file_name\")} -> {file_info.get(\"s3_url\")}')
                print('')
                print('💡 Download files with: ./download_outputs.sh')
        else:
            error = output_data.get('error', 'Unknown error')
            print(f'❌ Task failed: {error}')
        
        return True
        
    except Exception as e:
        print(f'❌ Invocation failed: {e}')
        return False

invoke_agent('''$prompt''', '$actor_id', '$session_id')
"
}

# Get actor_id and session_id
ACTOR_ID="${2:-default_user}"
SESSION_ID="${3:-$(date +%s)_session}"

echo "🚀 Claude Code Agent with Memory - Interactive Mode"
echo "👤 Actor ID: $ACTOR_ID"
echo "🔗 Session ID: $SESSION_ID"
echo "💡 Type '/quit' to exit"
echo ""

# Handle initial prompt if provided
if [ -n "$1" ]; then
    echo "📝 Initial prompt: $1"
    invoke_agent "$1" "$ACTOR_ID" "$SESSION_ID"
    echo ""
fi

# Interactive loop
while true; do
    echo -n "💬 Enter your prompt (or /quit): "
    read -r PROMPT
    
    if [ "$PROMPT" = "/quit" ]; then
        echo "👋 Goodbye!"
        break
    fi
    
    if [ -n "$PROMPT" ]; then
        echo ""
        invoke_agent "$PROMPT" "$ACTOR_ID" "$SESSION_ID"
        echo ""
    fi
done
