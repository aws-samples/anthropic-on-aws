# Claude Sonnet 4.5 Memory Features Demo

This directory contains examples demonstrating Claude Sonnet 4.5's native memory capabilities on Amazon Bedrock.

## Overview

Claude Sonnet 4.5 includes built-in memory functionality that allows the model to:
- Store persistent memories across conversations
- Recall information from previous interactions
- Provide personalized responses based on stored context
- Manage memory storage and retrieval autonomously

## Files

- `claude_memory_demo.ipynb` - Interactive Jupyter notebook demonstrating memory features

## Key Features Demonstrated

1. **Persistent Memory Storage** - How Claude stores information across sessions
2. **Memory Recall** - Retrieving stored information in new conversations
3. **Personalized Responses** - Using memories to provide tailored assistance
4. **Memory Updates** - Dynamically updating stored information
5. **Minimal Client Implementation** - Simple tool use/result exchange pattern

## Prerequisites

- AWS account with Bedrock access
- Claude Sonnet 4.5 model access in your AWS region
- Python environment with `boto3` installed
- Configured AWS credentials with Bedrock permissions

## Usage

1. Open `claude_memory_demo.ipynb` in Jupyter Lab or Jupyter Notebook
2. Update the AWS session configuration with your profile/region
3. Run cells sequentially to see memory features in action
4. Each session demonstrates different aspects of the memory system

## Architecture

The notebook shows a minimal client-side implementation:
- **Client Role**: Handle tool use/result exchange only
- **Claude Role**: Manages all memory operations (storage, retrieval, organization)
- **Memory Format**: Claude uses file-based memory storage with structured paths

This demonstrates how Claude Sonnet 4.5's memory system requires minimal client-side infrastructure while providing sophisticated memory management capabilities.