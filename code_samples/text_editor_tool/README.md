# Claude Text Editor Tool Example

This example demonstrates how to use Claude's built-in text editor tool. The sample shows how Claude can identify and fix a syntax error in Python code with the text editor tool through the Bedrock API.

## Files

- `buggy_code.py` - A Python file with a deliberate syntax error (missing colon after a for loop)
- `claude_text_editor_example.py` - The main script that calls Claude with the text editor tool to fix the bug
- `fixed_code.py` - This file will be generated when you run the example

## How It Works

1. The `claude_text_editor_example.py` script calls Claude through the Bedrock Messages API, asking to fix the syntax error
2. Alternatively, `claude_text_editor_example_converse.py` uses the Bedrock Converse API for the same functionality
3. Claude uses the text editor tool to read the file, and identify and fix the issue
4. The script processes Claude's response, applying the suggested fixes
5. The fixed code is saved to a new file

## The Built-in Text Editor Tool

Claude's text editor tool allows the model to in this scenario to:
- Identify specific sections of text to modify, by viewing the file
- Replace strings with corrected versions
- Apply multiple edits in sequence

In this example, Claude will identify the missing colon in the for loop and fix it.

## Requirements

- AWS account with access to Bedrock
- boto3 library
- Claude 3.5 or 3.7 Sonnet

## Running the Example

1. Configure your AWS credentials
2. Run: `python claude_text_editor_example.py` or `python claude_text_editor_example_converse.py`
3. View fixed_code.py and see the changes compared to buggy_code.py (`diff -u buggy_code.py fixed_code.py`)

## Documentation

See Anthropic's website: https://docs.anthropic.com/en/docs/build-with-claude/tool-use/text-editor-tool
