#!/usr/bin/env python3
"""
Claude Text Editor Tool Example with Converse API

This example shows how to use Claude's built-in
text editor tool with the Amazon Bedrock Converse API.
"""
import boto3

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
    
    """
    Define tool_config in Converse API format. It's just a placeholder
    in this example as Converse expects the field present when using tools.
    We define the built-in text editor tool separately.
    This is where to configure additional, not built-in tools.
    """
    tool_config = {
        "tools": [
            {
                "toolSpec": {
                    "name": "get_weather",
                    "inputSchema": {
                        "json": {
                            "type": "object"
                        }
                    }
                }
            }
        ]
    }
    
    # Start conversation with Claude using the converse API
    request = {
        "modelId": "us.anthropic.claude-3-7-sonnet-20250219-v1:0",
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "text": "There's a syntax error in my buggy_code.py file. Can you help me fix it?"
                    }
                ]
            }
        ],
        "toolConfig": tool_config,
        # Configure Claude with text editor tool
        # This is for 3.7 Sonnet. For 3.5 Sonnet use "text_editor_20241022"
        "additionalModelRequestFields": {
            "tools": [
                {
                    "type": "text_editor_20250124",
                    "name": "str_replace_editor"
                }
            ]
        }
    }
    
    # Step 1: Call Claude with our prompt
    response = bedrock_runtime.converse(**request)
    
    # Process the initial response
    tool_use = None
    output = response.get("output", {})
    if output:
        message = output.get("message", {})
        content = message.get("content", [])
        
        for content_item in content:
            if isinstance(content_item, dict) and content_item.get("toolUse"):
                tool_use = content_item.get("toolUse")
                break
    
    if not tool_use:
        print("Claude did not request to use the text editor tool.")
        return
    
    # Step 2: If Claude asks to view the file, provide the file content
    if tool_use.get("input", {}).get("command") == "view":
        print("Claude requested to view the file. Providing file content...")
        tool_use_id = tool_use.get("toolUseId")
        
        # Create a new request with Claude's response in the conversation history
        request = {
            "modelId": "us.anthropic.claude-3-7-sonnet-20250219-v1:0",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "text": "There's a syntax error in my buggy_code.py file. Can you help me fix it?"
                        }
                    ]
                },
                {
                    "role": "assistant",
                    "content": content
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "toolResult": {
                                "toolUseId": tool_use_id,
                                "content": [
                                    {
                                        "text": file_content
                                    }
                                ]
                            }
                        }
                    ]
                }
            ],
            "toolConfig": tool_config,
            "additionalModelRequestFields": {
                "tools": [
                    {
                        "type": "text_editor_20250124",
                        "name": "str_replace_editor"
                    }
                ]
            }
        }
        
        # Step 3: Get Claude's response with the fix
        response = bedrock_runtime.converse(**request)
    
    # Process Claude's response to extract the fix
    fixed_content = None
    output = response.get("output", {})
    if output:
        message = output.get("message", {})
        content = message.get("content", [])
        
        for content_item in content:
            if isinstance(content_item, dict) and content_item.get("toolUse"):
                tool_use = content_item.get("toolUse")
                tool_input = tool_use.get("input", {})
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
