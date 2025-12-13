# ABOUTME: Demonstrates the Tool Search Tool on Amazon Bedrock with Claude.
# ABOUTME: Shows server-side regex and BM25 tool search patterns.

"""
Tool Search Tool Demo for Amazon Bedrock
=========================================

This script demonstrates how to use the Tool Search Tool to efficiently work with
large tool catalogs on Amazon Bedrock.

Key Concepts:
- Regex-based server-side tool search requires Opus 4.5 + invoke API
- BM25-based server-side tool search (not currently available on Bedrock)
- Tools with defer_loading: true are discovered via search
- Tools without defer_loading are always visible to Claude

Requirements:
    uv add boto3

Usage:
    uv run python tool_search_demo.py
"""

import json
import boto3

REGION = "us-west-2"
MODEL_ID = "global.anthropic.claude-opus-4-5-20251101-v1:0"
TOOL_SEARCH_BETA = "tool-search-tool-2025-10-19"


def demo_regex_search():
    print("DEMO 1: SERVER-SIDE REGEX SEARCH")

    client = boto3.client("bedrock-runtime", region_name=REGION)

    body = {
        "anthropic_version": "bedrock-2023-05-31",
        "anthropic_beta": [TOOL_SEARCH_BETA],
        "max_tokens": 1024,
        "system": "You have access to many tools. Use tool search to find them.",
        "messages": [
            {"role": "user", "content": "What's the weather in Seattle?"}
        ],
        "tools": [
            # The search tool itself
            {"type": "tool_search_tool_regex", "name": "tool_search_tool_regex"},
            # Deferred tools - discovered via search
            {
                "name": "get_weather",
                "description": "Get current weather for a location.",
                "input_schema": {
                    "type": "object",
                    "properties": {"location": {"type": "string"}},
                    "required": ["location"],
                },
                # This will cause the tool to be invisible to Claude until it is discovered via search
                "defer_loading": True,
            },
            {
                "name": "send_message",
                "description": "Send a message to a Slack channel.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "channel": {"type": "string"},
                        "message": {"type": "string"},
                    },
                    "required": ["channel", "message"],
                },
                # This will cause the tool to be invisible to Claude until it is discovered via search
                "defer_loading": True,
            },

            # Non-deferred tool - always visible to Claude
            {
                "name": "search_documents",
                "description": "Search through documents and files.",
                "input_schema": {
                    "type": "object",
                    "properties": {"query": {"type": "string"}},
                    "required": ["query"],
                },
            },
        ],
    }

    print("\n--- REQUEST BODY ---")
    print(json.dumps(body, indent=2))

    try:
        response = client.invoke_model(modelId=MODEL_ID, body=json.dumps(body))
        result = json.loads(response["body"].read())
        print("\n--- RAW RESPONSE ---")
        print(json.dumps(result, indent=2))
    except Exception as e:
        print("\n--- BEDROCK ERROR ---")
        print(f"{type(e).__name__}: {e}")


def demo_bm25_search():
    print("DEMO 2: SERVER-SIDE BM25 SEARCH")
    print("BM25 uses natural language queries instead of regex patterns.")

    client = boto3.client("bedrock-runtime", region_name=REGION)

    body = {
        "anthropic_version": "bedrock-2023-05-31",
        "anthropic_beta": [TOOL_SEARCH_BETA],
        "max_tokens": 1024,
        "system": "You have access to many tools. Use tool search to find them.",
        "messages": [
            {"role": "user", "content": "What's the weather in Seattle?"}
        ],
        "tools": [
            # BM25 search tool - not currently supported on Bedrock
            {"type": "tool_search_tool_bm25", "name": "tool_search_tool_bm25"},
            {
                "name": "search_documents",
                "description": "Search through documents and files.",
                "input_schema": {
                    "type": "object",
                    "properties": {"query": {"type": "string"}},
                    "required": ["query"],
                },
            },
            {
                "name": "get_weather",
                "description": "Get current weather conditions, temperature, humidity, and forecast for a city or location. Returns real-time meteorological data.",
                "input_schema": {
                    "type": "object",
                    "properties": {"location": {"type": "string"}},
                    "required": ["location"],
                },
                "defer_loading": True,
            },
            {
                "name": "send_message",
                "description": "Send a message to a Slack channel.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "channel": {"type": "string"},
                        "message": {"type": "string"},
                    },
                    "required": ["channel", "message"],
                },
                "defer_loading": True,
            },
        ],
    }

    print("\n--- REQUEST BODY ---")
    print(json.dumps(body, indent=2))

    try:
        response = client.invoke_model(modelId=MODEL_ID, body=json.dumps(body))
        result = json.loads(response["body"].read())
        print("\n--- RAW RESPONSE ---")
        print(json.dumps(result, indent=2))
    except Exception as e:
        print("\n--- BEDROCK ERROR ---")
        print(f"{type(e).__name__}: {e}")


def main():
    demo_regex_search()
    demo_bm25_search()


if __name__ == "__main__":
    main()
