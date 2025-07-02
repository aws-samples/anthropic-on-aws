# Native PDF Handling with Claude on Amazon Bedrock

## 🚀 Unlock the Full Power of PDF Analysis with Claude's Native Support

This repository contains a comprehensive Jupyter notebook ([claude_pdf_support.ipynb](./claude_pdf_support.ipynb)) that demonstrates how to leverage Claude's native PDF handling capabilities on Amazon Bedrock, enabling direct document analysis without preprocessing. Through comprehensive examples and performance comparisons, you'll discover why native PDF support is a game-changer for document intelligence applications.

## 📊 Key Findings from Our Analysis

Our [notebook](./claude_pdf_support.ipynb) demonstrates Claude's impressive native PDF handling capabilities on Amazon Bedrock through practical examples and real-world testing.

### Why Native PDF Handling Matters

Traditional PDF processing requires extracting text before analysis, losing crucial context. Claude's native approach preserves:

- **📈 Visual Understanding**: Interprets charts, graphs, and diagrams directly
- **📍 Precise Citations**: Provides exact page numbers and source attribution
- **🎯 Layout Preservation**: Maintains spatial relationships and formatting
- **⚡ Minimal Preprocessing**: Simply encode PDFs as base64 (InvokeModel) or pass as bytes (Converse), no complex parsing needed

## 🎯 Quick Start: Copy-Paste Ready Examples

### 1. Basic PDF Analysis with InvokeModel

```python
import json
import boto3
import base64

# Setup Bedrock client
bedrock_client = boto3.client('bedrock-runtime', region_name='us-east-1')

# Read and encode PDF
with open("your_document.pdf", "rb") as pdf_file:
    encoded_pdf = base64.b64encode(pdf_file.read()).decode("utf-8")

# Analyze the PDF
request_body = {
    "anthropic_version": "bedrock-2023-05-31",
    "messages": [{
        "role": "user",
        "content": [
            {
                "type": "document",
                "source": {
                    "type": "base64",
                    "media_type": "application/pdf",
                    "data": encoded_pdf
                },
                "title": "My Document"
            },
            {
                "type": "text",
                "text": "What are the key insights in this document?"
            }
        ]
    }],
    "max_tokens": 500
}

response = bedrock_client.invoke_model(
    modelId="us.anthropic.claude-sonnet-4-20250514-v1:0",
    body=json.dumps(request_body)
)

# Display results
result = json.loads(response['body'].read())
print(result['content'][0]['text'])
```

### 2. Extract Citations with Page Numbers

```python
# Enable citations for precise source attribution
request_body = {
    "anthropic_version": "bedrock-2023-05-31",
    "messages": [{
        "role": "user",
        "content": [
            {
                "type": "document",
                "source": {
                    "type": "base64",
                    "media_type": "application/pdf",
                    "data": encoded_pdf
                },
                "title": "Technical Report",
                "citations": {"enabled": True}  # Enable citations!
            },
            {
                "type": "text",
                "text": "What are the key findings? Cite specific numbers."
            }
        ]
    }],
    "max_tokens": 500
}

response = bedrock_client.invoke_model(
    modelId="us.anthropic.claude-sonnet-4-20250514-v1:0",
    body=json.dumps(request_body)
)

# Extract and display citations
result = json.loads(response['body'].read())
for block in result['content']:
    if block.get('citations'):
        for citation in block['citations']:
            print(f"📍 \"{citation['cited_text']}\"")
            print(f"   Pages {citation['start_page_number']}-{citation['end_page_number']}")
```

### 3. Using Converse API - Critical Requirements

⚠️ **Important**: The Converse API requires the `citations` flag to access Claude's native PDF support. Without this flag, Converse uses its own PDF handler which may not provide the same quality of analysis, particularly for visual elements like charts and graphs.

```python
# CRITICAL: Converse API requires citations flag for Claude's PDF support!

# Read PDF as raw bytes (NOT base64 for Converse!)
with open("your_document.pdf", "rb") as pdf_file:
    pdf_bytes = pdf_file.read()

messages = [{
    "role": "user",
    "content": [
        {
            "document": {
                "name": "My Document",
                "format": "pdf",
                "source": {
                    "bytes": pdf_bytes  # Raw bytes, not base64!
                },
                "citations": {"enabled": True}  # REQUIRED for Claude's PDF support!
            }
        },
        {"text": "Analyze this document"}
    ]
}]

response = bedrock_client.converse(
    modelId="us.anthropic.claude-sonnet-4-20250514-v1:0",
    messages=messages,
    inferenceConfig={"maxTokens": 500}
)
```

## 🔍 What the [Notebook](./claude_pdf_support.ipynb) Demonstrates

### Visual Content Analysis
The [notebook](./claude_pdf_support.ipynb) shows Claude accurately identifying and describing:
- **Bar charts** comparing model performance metrics
- **Line graphs** showing token usage patterns over time
- **Data tables** with precise value extraction
- **Complex layouts** with multiple columns and sections

### Real-World Performance Metrics

From our test document analysis:
- Claude correctly identified all visual elements
- Extracted exact data points from charts (e.g., "92% accuracy")
- Provided precise table data with proper formatting
- Maintained context across multi-page documents

### Prompt Caching Benefits

The [notebook](./claude_pdf_support.ipynb#prompt-caching) demonstrates how prompt caching reduces token usage:
```python
# First call: Creates cache
Cache created with 6,793 tokens

# Subsequent calls: Uses cached tokens
Cache hit! Read 6,793 tokens from cache
# Cached tokens are billed at a 90% discount, significantly reducing costs
```

## 💡 Key Implementation Insights

### 1. API Selection Guide

| Feature | InvokeModel | Converse |
|---------|-------------|----------|
| PDF Encoding | Base64 | Raw bytes |
| Citations Flag | Optional | **Required** |
| Prompt Caching | Direct support | Separate cache points |
| Best For | Full control | Conversational flow |

### 2. Common Pitfalls to Avoid

❌ **Don't** use base64 encoding with Converse API
❌ **Don't** forget citations flag in Converse API  
✅ **Do** enable prompt caching for repeated analyses
✅ **Do** use citations for compliance and verification

### 3. Performance Optimization Tips

- **Token Optimization**: Use prompt caching for repeated analyses (90% discount on cached tokens)
- **Prompt Caching**: Subsequent calls reuse cached document tokens
- **Multi-Query Analysis**: Ask multiple questions about a document in a single API call to maximize efficiency
- **Page Extraction**: Process only relevant pages for large documents

## 📈 Business Impact

Based on the examples in our [notebook](./claude_pdf_support.ipynb), implementing native PDF handling can deliver:

- **Time Savings**: Eliminate complex preprocessing pipelines
- **Enhanced Analysis**: Direct interpretation of visual elements and layouts
- **Cost Efficiency**: Reduce costs with prompt caching (90% discount on cached tokens)
- **Compliance Ready**: Built-in citation tracking with exact page numbers

## 🛠️ Getting Started

1. **Prerequisites**:
   ```bash
   pip install boto3 PyPDF2 PyMuPDF
   ```

2. **AWS Setup**:
   - Ensure AWS credentials are configured
   - Enable Bedrock access in your region
   - Request access to Claude models

3. **Run the Notebook**:
   - Clone this repository
   - Open [`claude_pdf_support.ipynb`](./claude_pdf_support.ipynb)
   - Follow along with the examples

## 🎓 What You'll Learn

By exploring the [notebook](./claude_pdf_support.ipynb), you'll learn how to:
- Analyze PDFs without complex preprocessing
- Extract precise citations with page numbers
- Understand visual content (charts, graphs, tables)
- Optimize performance with prompt caching
- Choose between InvokeModel and Converse APIs
- Handle errors and edge cases effectively

## 🚀 Next Steps

After exploring this notebook, you can:
- Build document Q&A systems with citation tracking
- Create compliance tools with source attribution
- Analyze financial reports with table extraction
- Process technical documentation with diagram understanding
- Develop research paper analyzers with comprehensive insights

## 📚 Resources

- [Amazon Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [Claude Model Cards](https://www.anthropic.com/claude)
- [Sample Technical Report](./sample_technical_report.pdf) used in demos

---

**Ready to revolutionize your PDF processing?** Dive into the [notebook](./claude_pdf_support.ipynb) and discover how Claude's native PDF support on Amazon Bedrock can transform your document intelligence applications! 🎯