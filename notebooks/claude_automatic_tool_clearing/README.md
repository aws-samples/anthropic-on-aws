# Claude Sonnet 4.5 Automatic Tool Clearing Demo

This directory contains a comprehensive tutorial demonstrating Claude Sonnet 4.5's automatic tool call clearing capabilities on Amazon Bedrock.

## Overview

Claude Sonnet 4.5 includes built-in context management functionality that allows the model to:
- Automatically remove old tool use/result pairs as conversations grow
- Reduce token usage in long conversations with multiple tool calls
- Maintain recent context while clearing older tool interactions
- Prevent hitting context window limits in multi-turn tool use scenarios
- Selectively exclude critical tools from automatic clearing

### Implementation Approach

This demo uses **automatic context management** where:
- Tool use/result pairs are automatically cleared based on configurable rules
- Recent tool interactions are preserved for context continuity
- Critical tools (like memory) can be excluded from clearing
- Token savings are tracked and reported in API responses

## Files

- **`automatic_tool_clearing_bedrock.ipynb`** - Interactive tutorial notebook with step-by-step learning (30 min)

## Key Features Demonstrated

1. **Automatic Tool Clearing** - Removing old tool interactions to manage context size
2. **Configurable Triggers** - Setting token thresholds for when clearing activates
3. **Selective Retention** - Keeping the most recent N tool use/result pairs
4. **Tool Exclusion** - Protecting critical tools (like memory) from clearing
5. **Token Optimization** - Tracking cleared tokens and context savings
6. **Multi-Turn Conversations** - Managing long conversations with repeated tool calls
7. **Applied Edits Tracking** - Monitoring when and how clearing occurs

## Prerequisites

- AWS account with Bedrock access
- Claude Sonnet 4.5 model access: `global.anthropic.claude-sonnet-4-5-20250929-v1:0`
- Python 3.8+ with `boto3` installed
- Configured AWS credentials with Bedrock permissions (`bedrock:InvokeModel`)
- Jupyter Lab or Jupyter Notebook (for interactive tutorial)

## Getting Started

### Interactive Tutorial (Recommended)

1. Open `automatic_tool_clearing_bedrock.ipynb` in Jupyter
2. Follow the step-by-step cells (~30 minutes)
3. Run the weather validation example to see clearing in action
4. Observe the `applied_edits` field in API responses

## Architecture

The implementation demonstrates context management with automatic tool clearing:

```
┌──────────────────────────────────────────────────────────────┐
│                     Your Application                         │
│                                                              │
│  ┌──────────────────┐    ┌──────────────────┐                │
│  │  run_            │───▶│  handle_tool_    │                │
│  │  conversation_   │◀───│  calls()         │                │
│  │  with_tools()    │    │                  │                │
│  │                  │    │ - get_weather    │                │
│  │ - Manages multi- │    │ - memory         │                │
│  │   turn loop      │    │ - Returns tool   │                │
│  │ - Tracks context │    │   results        │                │
│  │   management     │    │                  │                │
│  └──────────────────┘    └──────────────────┘                │
│           │                                                  │
│           ▼                                                  │
│  ┌──────────────────────────────────────────┐                │
│  │  AWS Bedrock Claude Sonnet 4.5           │                │
│  │                                          │                │
│  │  Context Management:                     │                │
│  │  - Trigger: 50 input_tokens              │                │
│  │  - Keep: 1 tool_uses                     │                │
│  │  - Clear at least: 50 input_tokens       │                │
│  │  - Exclude: ["memory"]                   │                │
│  └──────────────────────────────────────────┘                │
└──────────────────────────────────────────────────────────────┘
```

### Key Components

1. **Context Management Configuration**: Defines automatic clearing rules
   ```python
   "context_management": {
       "edits": [{
           "type": "clear_tool_uses_20250919",
           "trigger": {"type": "input_tokens", "value": 50},
           "keep": {"type": "tool_uses", "value": 1},
           "clear_at_least": {"type": "input_tokens", "value": 50},
           "exclude_tools": ["memory"]
       }]
   }
   ```

2. **Tool Handler**: Processes Claude's tool requests (weather, memory)
   - Executes tool calls and returns results
   - Supports multiple tools in a single turn
   - Handles both functional and memory tools

3. **Conversation Loop**: Manages multi-turn interactions with automatic clearing
   - Tracks applied edits in responses
   - Continues until task completion
   - Prevents infinite loops with iteration limits

### Client vs. Claude Roles

- **Client Role**:
  - Configures context management rules
  - Executes tool calls requested by Claude
  - Tracks conversation history and applied edits
  - Monitors token usage and clearing events

- **Claude Role**:
  - Requests tool calls as needed
  - Automatically clears old tool interactions based on rules
  - Maintains sufficient context for task completion
  - Reports clearing events via `applied_edits` field

## Usage Examples

### Basic Configuration
```python
response = bedrock.invoke_model(
    modelId="global.anthropic.claude-sonnet-4-5-20250929-v1:0",
    body=json.dumps({
        "anthropic_version": "bedrock-2023-05-31",
        "anthropic_beta": ["context-management-2025-06-27"],
        "context_management": {
            "edits": [{
                "type": "clear_tool_uses_20250919",
                "trigger": {"type": "input_tokens", "value": 100000},
                "keep": {"type": "tool_uses", "value": 3},
                "clear_at_least": {"type": "input_tokens", "value": 1000},
                "exclude_tools": ["memory"]
            }]
        }
    })
)
```

### Monitoring Clearing Events
```python
# Check if clearing occurred
if 'applied_edits' in response_body:
    edits = response_body['applied_edits']
    print(f"Cleared {edits['cleared_tool_uses']} tool uses")
    print(f"Freed {edits['cleared_input_tokens']} tokens")
```

## Configuration Best Practices

### Trigger Threshold
```python
"trigger": {
    "type": "input_tokens",
    "value": 100000  # Start clearing when approaching context limits
}
```
- Use higher values (50K-100K) for production
- Consider your model's context window size
- Balance between context preservation and token efficiency

### Keep Recent Tools
```python
"keep": {
    "type": "tool_uses",
    "value": 3  # Keep last 3 tool interactions
}
```
- Keep enough recent tools for Claude to maintain context
- Typical values: 1-5 depending on your use case

### Exclude Critical Tools
```python
"exclude_tools": ["memory", "database_query", "user_preferences"]
```
- Exclude tools that provide essential long-term context
- Examples: memory, user data, session information

### Clear Threshold
```python
"clear_at_least": {
    "type": "input_tokens",
    "value": 1000  # Only clear if we can free at least 1000 tokens
}
```
- Prevents clearing for minimal token savings
- Useful when using prompt caching (avoid breaking cache for small gains)

## Learning Resources

### Tutorial Notebook
- **Path**: `automatic_tool_clearing_bedrock.ipynb`
- **Format**: Interactive Jupyter notebook
- **Time**: 30 minutes
- **Best For**: Hands-on learning with step-by-step guidance

### What You'll Learn
- How automatic tool clearing works
- Configuring context management rules
- Setting trigger thresholds and retention policies
- Excluding critical tools from clearing
- Monitoring clearing events via `applied_edits`
- Optimizing token usage in long conversations
- Building efficient multi-turn tool use workflows

## Common Use Cases

This feature is particularly valuable for:

1. **Long-Running Conversations**
   - Customer support chatbots with extended interactions
   - Multi-step workflows requiring many tool calls
   - Iterative data analysis tasks

2. **Repetitive Tool Usage**
   - Monitoring systems that check status repeatedly
   - Data validation requiring multiple checks
   - Search operations with refinement iterations

3. **Resource-Intensive Applications**
   - Applications with large tool outputs
   - Systems processing many documents
   - Multi-agent systems with frequent tool interactions

4. **Cost Optimization**
   - Reducing token usage in high-volume applications
   - Extending conversation length without hitting limits
   - Maintaining performance while controlling costs

## Production Considerations

This demo is designed for learning and experimentation. For production use, consider:

- **Threshold Tuning**: Adjust trigger values based on your context window needs
- **Tool Exclusion Strategy**: Carefully select which tools to exclude from clearing
- **Monitoring**: Track `applied_edits` to understand clearing patterns
- **Error Handling**: Add comprehensive error handling for tool execution
- **Performance**: Balance clearing frequency with context preservation
- **Testing**: Validate clearing behavior with your specific tool set

## Technical Details

- **Model**: `global.anthropic.claude-sonnet-4-5-20250929-v1:0`
- **API Version**: `bedrock-2023-05-31`
- **Beta Feature**: `context-management-2025-06-27`
- **Edit Type**: `clear_tool_uses_20250919`
- **Trigger Type**: `input_tokens`
- **Keep Type**: `tool_uses`
- **Clear At Least Type**: `input_tokens`

## Troubleshooting

**Clearing not activating?**
- Check that trigger threshold is appropriate for your conversation length
- Verify `anthropic_beta` includes `context-management-2025-06-27`
- Ensure `clear_at_least` threshold can be met

**Too much context being cleared?**
- Increase the `keep` value to retain more recent tool uses
- Lower the `trigger` threshold to clear earlier
- Add more tools to `exclude_tools` list

**AWS errors?**
- Verify credentials with `aws configure`
- Check model access in Bedrock console
- Ensure correct region configuration

**Applied edits not showing?**
- Clearing only occurs when trigger threshold is exceeded
- Check that enough tokens can be cleared to meet `clear_at_least`
- Verify tool uses exist that aren't excluded

## Additional Documentation

### External Resources
- [Amazon Bedrock - Automatic Tool Call Clearing](https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-anthropic-claude-messages-tool-use.html#model-parameters-anthropic-claude-automatic-tool-call-clearing)
- [Bedrock Tool Use Documentation](https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-anthropic-claude-messages-tool-use.html)
- [AWS Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [Anthropic API Documentation](https://docs.anthropic.com/)
- [Context Management Guide](https://docs.anthropic.com/en/docs/build-with-claude/context-editing)

## License

MIT-0

---

**Note**: This implementation demonstrates Claude Sonnet 4.5's automatic context management capabilities with configurable clearing rules. The demo uses low trigger thresholds for demonstration purposes; production applications should use higher values appropriate for their use case.
