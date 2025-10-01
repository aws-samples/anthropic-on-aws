# Claude Code Integration for Amazon Bedrock AgentCore

This integration enables Claude Code to run autonomously on Amazon Bedrock AgentCore, providing powerful AI-driven code generation capabilities without requiring an Anthropic API key.

## 🎯 Overview

Claude Code Headless Mode provides a complete implementation for deploying Claude Code as an autonomous agent on Amazon Bedrock AgentCore. This enables you to run coding tasks in the cloud with full automation capabilities.

**Key Features:**

- ✅ **No Anthropic API Key Required** - Uses Amazon Bedrock
- ✅ **Autonomous Operation** - Runs without human intervention
- ✅ **Cost Effective** - ~$0.30-0.50 per complex task
- ✅ **Scalable** - Leverages AgentCore's serverless architecture
- ✅ **Production Ready** - Complete with monitoring and logging

## 🚀 Quick Start

### Prerequisites

- **AWS Account** with Bedrock access
- **Python 3.10+**
- **AWS CLI** configured
- **Docker** installed (for local testing)
- **Bedrock Model Access** for Claude models
- **AgentCore Toolkit**: `pip install bedrock-agentcore-starter-toolkit`

### Quick Demo (3 Commands)

The fastest way to get started:

```bash
# 1. Deploy everything (one-time setup - creates IAM, S3, ECR, and AgentCore runtime)
cd headless-mode
./deploy.sh

# 2. Invoke the agent (files automatically uploaded to S3)
./invoke_claude_code.sh "Create a simple Python calculator app"

# 3. Download the generated files
./download_outputs.sh
```

**Bonus commands:**
```bash
# View deployment info
./show_agent_info.sh

# Clean up everything
aws cloudformation delete-stack --stack-name claude-code-agent-stack
```

### Full Deployment Guide

```bash
# Step 1: Clone and navigate
cd claude-code-on-agentcore/headless-mode

# Step 2: Deploy (creates CloudFormation stack with IAM, S3, ECR + AgentCore runtime)
chmod +x deploy.sh
./deploy.sh

# This single script:
# - Creates CloudFormation stack (IAM role, S3 bucket, ECR repository)
# - Builds Docker image for ARM64/Graviton
# - Pushes to ECR
# - Deploys/updates AgentCore runtime
# - Saves deployment info to deployment.json

# Step 3: Invoke the agent
./invoke_claude_code.sh "Create a REST API with FastAPI"

# Step 4: Download generated files
./download_outputs.sh
```

**What gets created:**
- **CloudFormation Stack**: `claude-code-agent-stack`
- **IAM Role**: With Bedrock, S3, CloudFront, ECR permissions
- **S3 Bucket**: `claude-code-agent-outputs-{account-id}` (for generated files)
- **ECR Repository**: `bedrock-agentcore-claude-code-agent`
- **AgentCore Runtime**: Running your custom Docker image

### Local Testing

You can test the agent locally before deploying:

```bash
# Build the Docker container
cd headless-mode
docker build -t claude-code-headless .

# Run with AWS credentials (choose one method):

# Method 1: Mount AWS credentials directory
docker run -d --name claude-code-headless -p 8080:8080 -v ~/.aws:/root/.aws:ro claude-code-headless

# Method 2: Pass AWS credentials as environment variables
docker run -d --name claude-code-headless -p 8080:8080 \
  -e AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID \
  -e AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY \
  -e AWS_SESSION_TOKEN=$AWS_SESSION_TOKEN \
  -e AWS_REGION=${AWS_REGION:-us-east-1} \
  -e AWS_DEFAULT_REGION=${AWS_REGION:-us-east-1} \
  claude-code-headless

# Optional: Mount a volume to persist generated files on your host
# This maps ./output on your host to /app/workspace in the container
docker run -d --name claude-code-headless -p 8080:8080 \
  -e AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID \
  -e AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY \
  -e AWS_SESSION_TOKEN=$AWS_SESSION_TOKEN \
  -e AWS_REGION=${AWS_REGION:-us-east-1} \
  -e AWS_DEFAULT_REGION=${AWS_REGION:-us-east-1} \
  -v $(pwd)/output:/app/workspace \
  claude-code-headless

# Test the agent
curl -X POST http://localhost:8080/invocations \
  -H "Content-Type: application/json" \
  -d '{"input": {"prompt": "Create a simple hello.py file that prints Hello, World!"}}' \
  | python3 -m json.tool

# View files in your local output directory
ls -la output/
cat output/hello.py

# Clean up
docker stop claude-code-headless
docker rm claude-code-headless
```

## 📚 Documentation

- [Headless Mode Documentation](headless-mode/README.md) - Detailed deployment guide
- [Example Prompts](headless-mode/examples/example_prompts.json) - Sample tasks for testing

## 🎯 Use Cases

- **Code Generation** - Create complete applications from descriptions
- **Code Refactoring** - Improve existing code quality and performance
- **Test Creation** - Generate comprehensive test suites
- **Documentation** - Auto-generate documentation for codebases
- **Migration** - Convert code between frameworks or languages
- **Analysis** - Review code for security, performance, and best practices
- **AWS Infrastructure** - Generate CloudFormation/CDK templates and deploy resources

## 📦 Project Structure

```
claude-code/
├── README.md                    # This file
├── requirements.txt             # Python dependencies
├── test_headless_mode.py        # Test script for headless mode
│
└── headless-mode/              # AgentCore deployment
    ├── agent.py                # Main agent implementation
    ├── deploy_claude_code.py   # Deployment script
    ├── Dockerfile              # Container configuration
    ├── pyproject.toml          # Python project configuration
    ├── uv.lock                 # Dependency lock file
    ├── README.md              # Detailed deployment guide
    ├── examples/              # Example prompts
    │   └── example_prompts.json
    └── iam/                   # IAM configuration
        ├── permissions-policy.json
        ├── trust-policy.json
        └── setup-iam-role.sh
```

## 🧪 Testing

Test script is provided in the root directory:

```bash
# Test headless mode deployment
python test_headless_mode.py
```

## 📊 Performance & Cost

- **Task Duration**: 10-30 seconds for typical tasks
- **Cost**: ~$0.30-0.50 per complex task
- **Concurrency**: Supports multiple simultaneous requests
- **Scaling**: Auto-scales based on demand

## 🔄 Coming Soon

- **Python SDK** - A Python wrapper for programmatic access to Claude Code will be added in a future update, enabling:
  - Integration into Python applications
  - Custom workflow development
  - Batch processing capabilities
  - Advanced session management

## 🤝 Contributing

Contributions are welcome! Please:

1. Test your changes locally
2. Update relevant documentation
3. Submit a pull request

## 📄 License

This integration is provided as-is for educational and experimental purposes. Ensure compliance with your organization's policies and AWS service terms.

## 🙏 Acknowledgments

- Claude Code by Anthropic
- Amazon Bedrock AgentCore team
- AWS SDK for Python (boto3)
