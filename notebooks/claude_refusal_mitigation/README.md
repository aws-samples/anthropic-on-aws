# Identity Document Processing (IDP) Denial Mitigation Demo

This demo showcases techniques for overcoming Claude's denial behaviors when processing sensitive visual content, using identity document processing as an example.

## Contents

- [claude_refusal_mitigation.ipynb](./claude_refusal_mitigation.ipynb) - Main notebook demonstrating denial mitigation techniques
- `dataset/` - Sample synthetic identity documents for testing
  - Contains 10 different document types (IDs and passports)
  - All documents are synthetic/fake - no real personal information

## Requirements

To run this demo, you'll need:

```python
# Core requirements
pip install anthropic
pip install pillow
pip install jupyter
```

### Amazon Bedrock Setup
The notebook uses Claude models via AWS Bedrock. You'll need:
1. AWS credentials configured
2. Access to Claude models on Bedrock

## Key Findings

The notebook demonstrates:

1. **Traditional prompting fails 100%** for identity documents
2. **XML word-in-mouth can work** but has limitations
3. **Tool-based approaches achieve 0% denial** and are production-ready

## Running the Demo

1. Install requirements
2. Configure AWS credentials
3. Open `id_denial.ipynb` in Jupyter
4. Run cells sequentially to see different techniques

## Technique Comparison

| Technique | Denial Rate | Production Ready |
|-----------|-------------|------------------|
| Simple Prompts | 100% | ❌ |
| Advanced Prompts | 100% | ❌ |
| JSON Instructions | 100% | ❌ |
| XML Word-in-Mouth | 0% | ⚠️ Limited |
| **Tool-Based** | **0%** | **✅ Yes** |

## Best Practice

Always use tool-based approaches for production systems:

```python
tools = build_identity_extraction_tool()
response = client.messages.create(
    model="claude-4-sonnet",
    messages=messages,
    tools=tools,
    tool_choice={"type": "tool", "name": "IdentityDataExtraction"}
)
```

## Important Note

This demo uses synthetic documents exclusively. When implementing for real documents:
- Ensure legal compliance
- Follow privacy regulations (GDPR, CCPA)
- Implement proper security measures
- Maintain audit documentation
