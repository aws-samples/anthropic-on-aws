#!/usr/bin/env python3
# ABOUTME: Simple demo of Claude Sonnet 4.5's clear_thinking feature on Amazon Bedrock
# ABOUTME: Shows how context management automatically clears old thinking blocks

import boto3
import json

def call_claude(client, model_id, messages, context_management):
    """Make non-streaming API call to Claude with context management and thinking enabled"""
    body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 4096,
        "messages": messages,
        # Enable extended thinking
        "thinking": {
            "type": "enabled",
            "budget_tokens": 1024
        },
        "anthropic_beta": ["context-management-2025-06-27"],
        "context_management": context_management
    }

    try:
        response = client.invoke_model(
            modelId=model_id,
            body=json.dumps(body)
        )
    except Exception as e:
        print(f"Error invoking model: {e}")
        return [], {}, None

    # Process response
    response_body = json.loads(response['body'].read())
    
    content_blocks = response_body.get("content", [])
    usage = response_body.get("usage", {})
    context_mgmt = response_body.get("context_management")

    return content_blocks, usage, context_mgmt


def main():
    """
    Demonstrates Claude's context management feature (clear_thinking_20251015).
    
    Configuration:
    - keep: 1 thinking turn - keep only the most recent thinking block
    """
    client = boto3.client("bedrock-runtime")
    # Use a model that supports thinking and context management
    model_id = "global.anthropic.claude-sonnet-4-5-20250929-v1:0"

    # Context management configuration
    context_management = {
        "edits": [{
            "type": "clear_thinking_20251015",
            "keep": {"type": "thinking_turns", "value": 1}  # Keep only the last turn's thinking
        }]
    }

    user_prompts = [
        "If I have 3 apples and eat one, how many do I have? Explain the logic.",
        "Now I buy 5 more. How many do I have total? Double check your math.",
        "If I share them equally with a friend, how many do we each get? Show your work."
    ]

    messages = []
    total_cleared_turns = 0
    total_saved_tokens = 0

    print("\n" + "="*70)
    print("Context Management Demo: clear_thinking_20251015")
    print("="*70)
    print(f"Config: Keep={context_management['edits'][0]['keep']['value']} thinking turn(s)\n")

    for turn, prompt in enumerate(user_prompts, 1):
        print(f"Turn {turn}: {prompt}")

        # Add user message
        messages.append({"role": "user", "content": prompt})

        # Call Claude
        content_blocks, usage, context_mgmt = call_claude(
            client, model_id, messages, context_management
        )

        # Add assistant response
        messages.append({"role": "assistant", "content": content_blocks})

        # Display token usage and thinking stats
        print(f"  📊 Token Usage:")
        print(f"     Input: {usage.get('input_tokens', 0)}")
        print(f"     Output: {usage.get('output_tokens', 0)}")

        # Check if thinking block is present
        thinking_block = next((b for b in content_blocks if b.get("type") == "thinking"), None)
        if thinking_block:
            print(f"  🧠 Thinking block found.")
            preview = thinking_block['thinking'][:100].replace('\n', ' ')
            print(f"  💭 Preview: {preview}...")

        # Check if any thinking was cleared
        if context_mgmt:
            print(f"\n  📋 Context Management Response:")
            print(json.dumps(context_mgmt, indent=4))
            
            edits = context_mgmt.get("applied_edits", [])
            for edit in edits:
                if edit.get("type") == "clear_thinking_20251015":
                    cleared = edit.get("cleared_thinking_turns", 0)
                    saved = edit.get("cleared_input_tokens", 0)
                    if cleared > 0:
                        total_cleared_turns += cleared
                        total_saved_tokens += saved
                        print(f"  ✅ CLEARED {cleared} thinking turn(s), saved {saved} tokens!")
        print()
        print(f"{'='*70}")

    print(f"SUMMARY")
    print(f"Conversation turns: {len(user_prompts)}")
    print(f"Thinking turns cleared: {total_cleared_turns}")
    print(f"Tokens saved: {total_saved_tokens}")
    print(f"{'='*70}\n")


if __name__ == "__main__":
    main()
