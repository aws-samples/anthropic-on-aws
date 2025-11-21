# Claude Clear Thinking Demo

This example demonstrates how to use Claude's context management feature to automatically clear old thinking blocks in extended thinking mode conversations. The sample shows how context management reduces token usage by removing earlier reasoning steps while preserving recent thinking through the Bedrock API.

## Files

- `clear_thinking_test.py` - The main script that demonstrates context management with extended thinking mode, showing how old thinking blocks are automatically cleared to save tokens

## How It Works

1. The script enables Claude's extended thinking mode, which generates reasoning blocks before answering
2. Context management is configured to keep only the most recent thinking block
3. As the conversation progresses, Claude automatically clears old thinking blocks from earlier turns
4. The script displays token usage statistics and shows how many tokens are saved by clearing

## Context Management

Claude's context management feature allows automatic removal of conversation elements to optimize token usage. In this example, we use the `clear_thinking_20251015` edit type to manage thinking blocks.

**Configuration:**
```python
context_management = {
    "edits": [{
        "type": "clear_thinking_20251015",
        "keep": {"type": "thinking_turns", "value": 1}
    }]
}
```

This keeps only the most recent thinking block and clears all earlier ones. You can adjust the `value` to keep more turns, or use `"all"` to preserve all thinking blocks (useful for prompt caching).

## Extended Thinking Mode

Extended thinking mode allows Claude to reason through problems step-by-step before providing an answer. Each response includes:
- A thinking block with Claude's reasoning process
- The final answer based on that reasoning

In multi-turn conversations, thinking blocks can accumulate quickly. Context management solves this by automatically clearing old thinking blocks that are no longer needed.

## Related Features

Context management also supports `clear_tool_uses_20250919` for clearing old tool use/result pairs in tool-using conversations. Both features help manage token usage in long conversations while preserving the information Claude needs.

## Requirements

- AWS account with access to Bedrock
- boto3 library
- Claude Sonnet 4.5 (`global.anthropic.claude-sonnet-4-5-20250929-v1:0`)

## Running the Example

1. Configure your AWS credentials:
   ```bash
   export AWS_PROFILE=your-profile
   export AWS_DEFAULT_REGION=us-west-2
   ```

2. Run the script:
   ```bash
   python clear_thinking_test.py
   ```

3. Observe the output showing:
   - Thinking blocks generated each turn
   - Context management clearing old thinking
   - Token savings from the clearing operation

## Expected Output

The script runs three conversation turns with math problems. Starting from turn 2, you'll see:

```
✅ CLEARED 1 thinking turn(s), saved 87 tokens!
```

This shows that old thinking blocks are being automatically removed, reducing the total token count while keeping the most recent reasoning in context.

## Documentation

- [Amazon Bedrock Tool Use](https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-anthropic-claude-messages-tool-use.html)
- [Anthropic Context Editing](https://docs.anthropic.com/en/docs/build-with-claude/context-editing)
