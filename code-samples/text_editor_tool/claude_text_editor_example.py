#!/usr/bin/env python3
"""
Claude Text Editor Tool Example

Simple example of using Claude's text editor tool via Amazon Bedrock
"""
import boto3
import json

# File paths
buggy_file_path = "./buggy_code.py"
fixed_file_path = "./fixed_code.py"

# File manipulation functions - read file
def read_file(file_path):
    """Read file content."""
    with open(file_path, 'r') as file:
        return file.read()

# File manipulation functions - write file
def write_file(file_path, content):
    """Write content to file."""
    with open(file_path, 'w') as file:
        file.write(content)

def main():
    # Initialize Bedrock Runtime client
    bedrock_runtime = boto3.client(service_name="bedrock-runtime")
    
    # Read the buggy code
    file_content = read_file(buggy_file_path)
    
    # Start conversation with Claude
    messages = [
        {
            "role": "user", 
            "content": [
                {
                    "type": "text", 
                    "text": "There's a syntax error in my buggy_code.py file. Can you help me fix it?"
                }
            ]
        }
    ]
    
    # Configure Claude with text editor tool
    # This is for 3.7 Sonnet. For 3.5 Sonnet use "text_editor_20241022"
    payload = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 1024,
        "messages": messages,
        "tools": [
            {
                "type": "text_editor_20250124",
                "name": "str_replace_editor"
            }
        ]
    }
    
    # Step 1: Call Claude with our prompt
    response = bedrock_runtime.invoke_model(
        modelId="us.anthropic.claude-3-7-sonnet-20250219-v1:0",
        body=json.dumps(payload)
    )
    response_data = json.loads(response.get("body").read())
    
    # Process the initial response
    tool_use = None
    for content_item in response_data.get("content", []):
        if content_item.get("type") == "tool_use" and content_item.get("name") == "str_replace_editor":
            tool_use = content_item
            break
    
    if not tool_use:
        print("Claude did not request to use the text editor tool.")
        return
    
    # Step 2: If Claude asks to view the file, provide the file content
    if tool_use.get("input", {}).get("command") == "view":
        print("Claude requested to view the file. Providing file content...")
        tool_id = tool_use.get("id")
        
        # Add Claude's response to the conversation
        messages.append({
            "role": "assistant", 
            "content": response_data.get("content", [])
        })
        
        # Add our response with the tool result containing the file
        messages.append({
            "role": "user",
            "content": [
                {
                    "type": "tool_result",
                    "tool_use_id": tool_id,
                    "content": [
                        {
                            "type": "text",
                            "text": file_content
                        }
                    ]
                }
            ]
        })
        
        # Step 3: Get Claude's response with the fix
        payload["messages"] = messages
        response = bedrock_runtime.invoke_model(
            modelId="us.anthropic.claude-3-7-sonnet-20250219-v1:0",
            body=json.dumps(payload)
        )
        response_data = json.loads(response.get("body").read())
    
    # Process Claude's response to extract the fix
    fixed_content = None
    for content_item in response_data.get("content", []):
        if content_item.get("type") == "tool_use" and content_item.get("name") == "str_replace_editor":
            tool_input = content_item.get("input", {})
            command = tool_input.get("command")
            
            if command == "str_replace":
                old_str = tool_input.get("old_str", "")
                new_str = tool_input.get("new_str", "")
                fixed_content = file_content.replace(old_str, new_str)
                break
    
    # Save the fixed code
    if fixed_content:
        write_file(fixed_file_path, fixed_content)
        print(f"Fixed code saved to {fixed_file_path}")
    else:
        print("Could not extract a fix from Claude's response.")

if __name__ == "__main__":
    main()
