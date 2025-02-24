# Claude 3.7 Sonnet Extended Thinking Notebooks

This repository contains a comprehensive set of notebooks and materials designed to teach you how to effectively use Claude 3.7 Sonnet's extended thinking capabilities. These tutorials were designed to be used with Claude 3.7 Sonnet in Amazon Bedrock, but many of the concepts can be applied to other deployment methods.

## Workshop Overview

Claude 3.7 Sonnet introduces a groundbreaking **extended thinking** capability that allows the model to work through complex problems methodically. These notebooks will guide you through understanding, configuring, and leveraging this powerful feature across various use cases.

## Prerequisites

- An AWS account with access to Amazon Bedrock
- Access to Claude 3.7 Sonnet in your region
- Basic understanding of Python and Jupyter notebooks
- Familiarity with LLM prompting concepts

## Setup Instructions

1. Clone this repository:
   ```bash
   git clone https://github.com/aws-samples/anthropic-on-aws.git
   cd claude_3_7_extended_thinking
   ```

2. Set up your Python environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Configure your AWS credentials for Bedrock access:
   ```bash
   aws configure
   ```

4. Start Jupyter to access the notebooks:
   ```bash
   jupyter lab
   ```

## Workshop Content

The workshop consists of 8 lessons that progressively build your understanding of Claude 3.7's extended thinking capability:

### Lesson 1: Introduction to Claude 3.7 and Extended Thinking
- Overview of Claude 3.7 Sonnet's capabilities
- Understanding extended thinking and how it differs from previous approaches
- Basic setup with the Bedrock API in Python
- Simple examples comparing standard mode vs. extended thinking mode

### Lesson 2: When and How to Use Extended Thinking
- Task complexity classification framework
- Decision tree for when to use extended thinking
- Examples of appropriate use cases vs. cases where it's unnecessary
- Performance benchmarking on different task types

### Lesson 3: Optimizing Reasoning Budget Allocation
- Building on the "Optimizing_Cost_vs_Performance" approach
- Implementing dynamic reasoning budget allocation
- Visualizing the tradeoffs between budget, time, and quality
- Creating a reusable Python class for adaptive reasoning

### Lesson 4: Effective Prompting Techniques for Extended Thinking
- General vs. step-by-step instruction patterns
- Implementing N-shot prompting with extended thinking
- Techniques to control reasoning depth and scope
- Creating a prompt template library for different use cases

### Lesson 5: Tool Use Integration with Extended Thinking
- Understanding the extended thinking + tool use pattern
- Implementing sequential reasoning then tool calling
- Building multi-step workflows that combine reasoning and tools
- Error handling and recovery strategies

### Lesson 6: Generating Comprehensive Content and Long-Form Output
- Techniques to generate longer, more detailed responses
- Using outlines and structured planning in extended thinking
- Generating detailed data sets and tables
- Managing and validating long outputs

### Lesson 7: Complex Problem-Solving with Claude 3.7
- Tackling constraint optimization problems
- Applying multiple analytical frameworks sequentially
- Building solutions for STEM problems (math, physics, computer science)
- Implementing approaches for handling complexity in different domains

### Lesson 8: Migrating Workloads to Claude 3.7
- Transitioning from previous Claude models
- Refactoring existing prompts for Claude 3.7
- Best practices for prompt simplification
- Removing chain-of-thought guidance when using extended thinking

## Utility Module

The repository includes a `claude_utils.py` module that provides helper functions for:
- Creating and managing Bedrock clients
- Invoking Claude with extended thinking
- Displaying and analyzing responses
- Working with tools
- Content validation and analysis

## Key Concepts

### The Extended Thinking Mental Model

Extended thinking can be thought of as giving Claude a "scratchpad" to work through complex problems step by step, similar to how you might use scratch paper when solving a difficult math problem. Instead of trying to respond immediately, Claude can:

1. First think through the problem methodically
2. Explore different approaches and possibilities
3. Validate intermediate results
4. Arrive at a well-reasoned final answer

### The Reasoning Budget

The "reasoning budget" is the amount of tokens allocated to Claude's extended thinking process:
- Minimum: 1,024 tokens
- Recommended for complex tasks: 4,096-8,192 tokens
- Maximum: Up to 128,000 tokens (in preview)

Think of the reasoning budget like allocating CPU time to a computational task. More complex problems benefit from larger budgets, but there are diminishing returns beyond a certain point.

## Contributing

We welcome contributions to improve these materials! Please submit issues or pull requests if you have suggestions, corrections, or enhancements.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- The Anthropic team for developing Claude 3.7 Sonnet
- The AWS Bedrock team for making Claude available through Bedrock
- All contributors to this workshop material

---

Happy exploring with Claude 3.7's extended thinking capabilities!