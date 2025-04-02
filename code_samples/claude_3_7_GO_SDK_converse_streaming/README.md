# Claude 3.7 Sonnet on Amazon Bedrock - Go SDK Example

This example demonstrates how to use the AWS SDK for Go to interact with Claude 3.7 Sonnet on Amazon Bedrock, showcasing the model's advanced capabilities including extended context windows and streaming responses.

## Features

- Streams responses from Claude 3.7 Sonnet using the Bedrock Runtime API
- Demonstrates handling large context windows (up to 200K tokens)
- Configures maximum response length (128K tokens)
- Shows how to enable system parameters for enhanced reasoning
- Includes real-time response streaming with error handling

## Prerequisites

- Go 1.24 or later
- AWS account with Bedrock access enabled
- AWS credentials configured (`aws configure`)
- Access to Claude 3.7 Sonnet model in the region of your selection

## Usage

```bash
# Basic usage with defaults
go run main.go

# Custom parameters
go run main.go -region us-west-2 -file book.txt -max-chars 10000 -prompt "Analyze this text:"
```

### Command Line Arguments

- `-region`: AWS region (default: "us-east-1")
- `-file`: Input file path (default: "book.txt")
- `-max-chars`: Maximum characters to read from file (default: 5000)
- `-prompt`: Prompt to send to Claude (default: "Summarize this text:")

## Notes

- The program will read up to the specified number of characters from the input file