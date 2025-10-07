# Code Samples

Small, focused examples demonstrating specific Claude features and API usage patterns.

## 📦 Samples

### [1M Context Window](1m-context-window/)
**Demonstrating Claude's massive context handling**

- **Language**: Python
- **Purpose**: Show how to work with Claude's 200K+ token context window
- **Key Concepts**:
  - Large text input handling
  - Context window management
  - Token counting
  - Response streaming
- **Use Case**: Document analysis, long-form content processing
- **Run Time**: < 1 minute

### [Claude 3.7 GO SDK - Converse Streaming](claude-3.7-go-sdk-converse-streaming/)
**Go SDK example with streaming responses**

- **Language**: Go (Golang)
- **Purpose**: Demonstrate AWS SDK for Go with Claude 3.7
- **Key Concepts**:
  - Bedrock Converse API in Go
  - Real-time response streaming
  - Error handling in Go
  - Command-line arguments
- **Use Case**: Go applications, CLI tools, backend services
- **Run Time**: < 30 seconds

### [Text Editor Tool](text-editor-tool/)
**Claude's built-in text editor tool usage**

- **Language**: Python
- **Purpose**: Show how Claude can edit files using the text editor tool
- **Key Concepts**:
  - Built-in tool usage
  - File manipulation
  - Syntax error detection and fixing
  - Tool response handling
- **Use Case**: Code editing, refactoring, automated fixes
- **Run Time**: < 1 minute
- **Includes**: Both Messages API and Converse API examples

## 🚀 Quick Start

### Python Samples

```bash
# Navigate to a Python sample
cd text-editor-tool

# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install boto3

# Configure AWS (if not already done)
aws configure

# Run the sample
python claude_text_editor_example.py

# Or try the Converse API version
python claude_text_editor_example_converse.py
```

### Go Samples

```bash
# Navigate to Go sample
cd claude-3.7-go-sdk-converse-streaming

# Ensure Go 1.24+ installed
go version

# Run with default arguments
go run main.go

# Run with custom parameters
go run main.go -region us-west-2 -file book.txt -max-chars 10000 -prompt "Analyze this text:"
```

## 💡 When to Use Code Samples

**Code samples are perfect for**:
- ✅ Learning specific Claude features
- ✅ Quick copy-paste reference
- ✅ Understanding API patterns
- ✅ Integrating into existing projects
- ✅ Language-specific examples
- ✅ Testing Claude capabilities

**For more complex needs, see**:
- Full applications → [CDK Applications](../cdk-applications/)
- Prototyping → [Streamlit Applications](../streamlit-applications/)
- Interactive learning → [Notebooks](../notebooks/)
- Structured courses → [Workshops](../workshops/)

## 📚 Learning Path

### Beginner Path
```
1. Start with text-editor-tool (simplest example)
2. Try 1m-context-window (understand limits)
3. Explore language-specific samples (Go, Python)
4. Modify samples for your use case
5. Graduate to Streamlit Applications or Notebooks
```

### Integration Path
```
1. Find sample matching your tech stack
2. Run sample locally
3. Understand the API calls
4. Copy relevant code to your project
5. Customize for your specific needs
```

## 🔧 Common Patterns

### Basic Claude API Call (Python)
```python
import boto3
import json

bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')

response = bedrock.invoke_model(
    modelId='anthropic.claude-3-5-sonnet-20241022-v2:0',
    body=json.dumps({
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 4096,
        "messages": [
            {"role": "user", "content": "Hello, Claude!"}
        ]
    })
)

result = json.loads(response['body'].read())
print(result['content'][0]['text'])
```

### Streaming Response (Python)
```python
response = bedrock.invoke_model_with_response_stream(
    modelId='anthropic.claude-3-5-sonnet-20241022-v2:0',
    body=json.dumps({...})
)

for event in response['body']:
    chunk = json.loads(event['chunk']['bytes'])
    if 'delta' in chunk:
        print(chunk['delta'].get('text', ''), end='')
```

### Tool Use (Python)
```python
tools = [{
    "name": "text_editor",
    "type": "text_editor_20241022",
    "text_editor": {
        "type": "str_replace",
        "path": "file.txt",
        "old_str": "old content",
        "new_str": "new content"
    }
}]

# Include tools in API call
response = bedrock.invoke_model(
    modelId='...',
    body=json.dumps({
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 4096,
        "messages": messages,
        "tools": tools
    })
)
```

## 🎯 Sample Features

### Messages API vs Converse API

**Messages API**:
- Anthropic's native API format
- Maximum flexibility
- All features available first
- Examples: Most Python samples

**Converse API**:
- AWS unified LLM API
- Cross-model compatibility
- Simpler interface
- Examples: Go sample, some Python samples

**Recommendation**: Use Messages API for Claude-specific features, Converse API for multi-model projects.

## 📊 Quick Reference

| Sample | Language | API | Features | Complexity |
|--------|----------|-----|----------|------------|
| Text Editor Tool | Python | Both | Tool use | Low |
| 1M Context | Python | Messages | Large context | Low |
| Go Streaming | Go | Converse | Streaming | Medium |

## 🔐 Security & Best Practices

### Credentials
```bash
# Never hardcode credentials
# Use AWS CLI configuration
aws configure

# Or IAM roles (recommended for AWS services)
# Or environment variables
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...
export AWS_REGION=us-east-1
```

### Error Handling
```python
try:
    response = bedrock.invoke_model(...)
except ClientError as e:
    print(f"Error: {e}")
    # Handle throttling, errors, etc.
```

### Rate Limiting
- Be mindful of API rate limits
- Implement exponential backoff
- Use streaming for long responses
- Cache responses when appropriate

## 💰 Cost Considerations

Code samples are designed for learning with minimal cost:

- **Small inputs**: Keep prompts concise for testing
- **Low iterations**: Run samples a few times
- **Free tier**: AWS Free Tier may cover testing
- **Estimated cost per run**: $0.001 - $0.01

**Tip**: Use shorter test inputs while learning

## 🔗 Related Resources

### Official Documentation
- **[Claude API Reference](https://docs.anthropic.com/)** - Anthropic docs
- **[Amazon Bedrock](https://docs.aws.amazon.com/bedrock/)** - Bedrock guide
- **[AWS SDK for Python](https://boto3.amazonaws.com/v1/documentation/api/latest/index.html)** - Boto3 docs
- **[AWS SDK for Go](https://aws.github.io/aws-sdk-go-v2/docs/)** - Go SDK docs

### More Examples
- **[Notebooks](../notebooks/)** - Interactive Jupyter examples
- **[Streamlit Applications](../streamlit-applications/)** - Full UI demos
- **[Cookbooks](../cookbooks/)** - Pattern library
- **[Workshops](../workshops/)** - Structured learning

## 🤝 Contributing

To contribute a code sample:

1. **Keep it focused**: One concept per sample
2. **Make it simple**: Minimal dependencies
3. **Document well**:
   - Clear README
   - Inline code comments
   - Usage examples
4. **Test thoroughly**: Run in clean environment
5. **Follow patterns**:
   - Use boto3 for Python
   - Follow language conventions
   - Include error handling

### Sample Template Structure
```
sample-name/
├── README.md          # Clear usage instructions
├── requirements.txt   # Python dependencies (if Python)
├── go.mod            # Go dependencies (if Go)
├── main.py           # Main code file
└── example_input.txt # Sample input (if applicable)
```

## 📄 License

MIT-0 - See LICENSE file in repository root

---

**Start with the simplest sample and experiment!** 🚀
