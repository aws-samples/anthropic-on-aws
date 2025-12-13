# Claude Tool Search Demo

This example demonstrates how to use Claude's Tool Search Tool on Amazon Bedrock to efficiently work with large tool catalogs. The sample shows how to use server-side regex search to dynamically discover tools instead of loading all tool definitions into context upfront.

## Files

- `tool_search_demo.py` - The main script that demonstrates server-side tool search with regex and BM25 patterns

## How It Works

1. Tools are defined with `defer_loading: true`, making them invisible to Claude initially
2. A search tool is provided to discover relevant tools
3. When Claude needs a tool, it searches using regex patterns
4. The API expands matched tools, making their schemas available to Claude
5. Claude can then use the discovered tools normally

## Tool Search Types

### Regex Search

Claude constructs regex patterns to search tool names and descriptions:

```python
{"type": "tool_search_tool_regex", "name": "tool_search_tool_regex"}
```

### BM25 Search

Uses natural language queries instead of regex patterns:

```python
{"type": "tool_search_tool_bm25", "name": "tool_search_tool_bm25"}
```
BM25 search is not currently (12-2025) available on Bedrock.

## Deferred Loading

Mark tools with `defer_loading: true` to hide them from Claude until discovered:

```python
{
    "name": "get_weather",
    "description": "Get current weather for a location.",
    "input_schema": {...},
    "defer_loading": True  # Tool is hidden until discovered via search
}
```

Tools without `defer_loading` (or with `defer_loading: false`) are always visible to Claude.

## Requirements

- AWS account with access to Bedrock
- boto3 library
- Claude Opus 4.5 (`global.anthropic.claude-opus-4-5-20251101-v1:0`)
- Beta header: `tool-search-tool-2025-10-19`

## Running the Example

1. Configure your AWS credentials:  

```bash
export AWS_PROFILE=your-profile
export AWS_DEFAULT_REGION=us-west-2
```

2. Run the script:
   ```
   python tool_search_demo.py
   ```

3. Observe the output showing:
   - The request body with tool definitions
   - Claude's response including tool search calls
   - Discovered tools being used

## Expected Output

The regex demo will show Claude using the search tool to find `get_weather`:

```json
{
  "type": "tool_use",
  "name": "tool_search_tool_regex",
  "input": {
    "regex": "weather"
  }
}
```

The BM25 demo will show an error since BM25 search is not currently available on Bedrock.

## Documentation

- [AWS Bedrock Tool Search tool](https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-anthropic-claude-messages-tool-use.html#model-parameters-anthropic-claude-tool-search-tool)

