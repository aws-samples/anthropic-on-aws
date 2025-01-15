# Building Effective Agents Cookbook
This is a direct bedrock refactoring of Anthropic [cookbook on agents](https://github.com/anthropics/anthropic-cookbook/tree/main/patterns/agents)

The main modifications focus on adapting the original agent patterns to work with Amazon Bedrock, primarily through changes in the `util.py` file.

## Key Changes

### API Integration
- Replaced Anthropic client with Bedrock Converse API
- Modified core utility functions to support Bedrock's interface

### Model Selection
- Default model: Haiku 3.5
- Chosen for:
  - Improved cost efficiency
  - Sufficient performance for agent scenarios

## Configuration

You can customize the model selection in `util.py` by modifying the `llm_call` function's model parameter.

### Switching Models
To use Sonnet instead of the default Haiku:
1. Locate the `llm_call` function in `util.py`
2. Update the model parameter to specify Sonnet

### Region Configuration
Default region: us-east-1

You can modify the region in the llm_call function

## Implementation Notes

The core agent patterns and behaviors remain consistent with the original examples, with changes primarily focused on the underlying API integration layer.

## Overview

Reference implementation for [Building Effective Agents](https://anthropic.com/research/building-effective-agents) by Erik Schluntz and Barry Zhang.

This repository contains example minimal implementations of common agent workflows discussed in the blog:

- Basic Building Blocks
  - Prompt Chaining
  - Routing
  - Multi-LLM Parallelization
- Advanced Workflows
  - Orchestrator-Subagents
  - Evaluator-Optimizer

## Getting Started
See the Jupyter notebooks for detailed examples:

- [Basic Workflows](basic_workflows.ipynb)
- [Evaluator-Optimizer Workflow](evaluator_optimizer.ipynb) 
- [Orchestrator-Workers Workflow](orchestrator_workers.ipynb)