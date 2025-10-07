# Streamlit Applications

Interactive demos and prototypes using Streamlit and Amazon Bedrock.

## 🎨 Applications

### [Claude Multimodal Playground](claude-multimodal-llm-playground/)
Interactive testing environment for Claude's multimodal capabilities
- **Purpose**: Feature exploration and testing
- **Features**: Vision, document analysis, prompt testing, parameter tuning
- **Setup Time**: < 5 minutes
- **Use Case**: Testing Claude features, rapid experimentation

### [Medical IDP](medical-idp/)
Intelligent document processing workflow for healthcare documents
- **Purpose**: Multi-page document analysis demonstration
- **Features**: Form extraction, handwriting recognition, multi-tool orchestration
- **Setup Time**: < 5 minutes
- **Use Case**: Document processing workflows, healthcare AI

### [Streamlit Python Example](streamlit-python-example/)
Tool use demonstration with complex JSON schemas
- **Purpose**: Show complex tool calling patterns
- **Features**: Schema validation, multi-tool orchestration, error handling
- **Setup Time**: < 5 minutes
- **Use Case**: Learning tool use patterns, API integration

### [Streamlit Step Functions Example](streamlit-stepfunction-example/)
AWS Step Functions integration with Claude tool use
- **Purpose**: Demonstrate async workflow orchestration
- **Features**: State machine integration, long-running workflows, error recovery
- **Setup Time**: < 10 minutes (requires AWS Step Functions setup)
- **Use Case**: Complex workflows, async processing

## ⚡ Quick Start

```bash
# Navigate to an application
cd claude-multimodal-llm-playground

# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up AWS credentials (if not already configured)
aws configure

# Run the application
streamlit run app.py

# Open browser to http://localhost:8501
```

## 💡 When to Use Streamlit Applications

**Choose Streamlit when you need**:
- ✅ Rapid prototyping (< 1 day development)
- ✅ Testing Claude features interactively
- ✅ Building internal demos
- ✅ Experimenting with prompts and parameters
- ✅ Quick proof-of-concepts
- ✅ Data science workflows

**Graduate to CDK Applications when you need**:
- ❌ Production deployment at scale
- ❌ Authentication and authorization
- ❌ Multi-user access with isolation
- ❌ Complex backend logic
- ❌ Integration with other AWS services

## 🎯 Key Features of Streamlit

- **Fast development**: Build UIs in pure Python
- **Interactive widgets**: Sliders, text inputs, file uploads
- **Real-time updates**: See changes immediately
- **Data visualization**: Built-in charting and plotting
- **Session state**: Maintain user state across interactions

## 🔧 Development Tips

### Local Development
```bash
# Auto-reload on file changes
streamlit run app.py --server.runOnSave true

# Custom port
streamlit run app.py --server.port 8502

# Debug mode
streamlit run app.py --logger.level debug
```

### Best Practices
- Use `st.cache_data` for expensive operations
- Store API keys in environment variables or AWS Secrets Manager
- Use session state for user-specific data
- Add loading indicators for long-running operations
- Handle errors gracefully with try/except blocks

## 📊 Common Patterns

### File Upload Processing
```python
uploaded_file = st.file_uploader("Upload a document", type=['pdf', 'txt'])
if uploaded_file:
    # Process file
    content = uploaded_file.read()
```

### Claude API Integration
```python
import boto3
bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')

response = bedrock.invoke_model(
    modelId='anthropic.claude-3-5-sonnet-20241022-v2:0',
    body=json.dumps({
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 4096,
        "messages": [{"role": "user", "content": prompt}]
    })
)
```

### Parameter Tuning Interface
```python
temperature = st.slider("Temperature", 0.0, 1.0, 0.7)
max_tokens = st.number_input("Max Tokens", 100, 4096, 1024)
```

## 🚀 Deployment Options

### Option 1: Local Development
- **Pros**: Fast iteration, easy debugging
- **Cons**: Only accessible on your machine
- **Use for**: Development, testing

### Option 2: Streamlit Community Cloud
- **Pros**: Free hosting, easy deployment
- **Cons**: Public access only, limited resources
- **Use for**: Public demos, open-source projects

### Option 3: AWS (Fargate/EC2)
- **Pros**: Private, scalable, full control
- **Cons**: Requires AWS setup and costs
- **Use for**: Internal tools, production demos
- **Tip**: See [Deployment Examples](../deployment-examples/) for patterns

### Option 4: Graduate to CDK
- **Pros**: Full production architecture
- **Cons**: More complex, longer development time
- **Use for**: Production applications
- **Tip**: See [CDK Applications](../cdk-applications/)

## 🔐 Security Considerations

### For Development
- Store AWS credentials in `~/.aws/credentials`
- Use IAM roles with minimum permissions
- Never commit API keys to git

### For Deployment
- Use AWS Secrets Manager for credentials
- Implement authentication (Cognito, OAuth)
- Set up VPC and security groups
- Enable HTTPS/TLS

## 🎓 Learning Path

1. **Start simple**: Run `claude-multimodal-llm-playground` locally
2. **Understand patterns**: Review code in each application
3. **Modify parameters**: Experiment with temperature, max tokens
4. **Add features**: Try adding new Streamlit widgets
5. **Integrate tools**: Practice tool use patterns
6. **Deploy**: Try Streamlit Community Cloud
7. **Scale up**: Graduate to [CDK Applications](../cdk-applications/)

## 🔗 Related Resources

- **[Streamlit Documentation](https://docs.streamlit.io/)** - Official Streamlit guide
- **[Amazon Bedrock Guide](https://docs.aws.amazon.com/bedrock/)** - Bedrock documentation
- **[Claude API Reference](https://docs.anthropic.com/)** - Anthropic API docs
- **[CDK Applications](../cdk-applications/)** - Production-ready alternatives
- **[Notebooks](../notebooks/)** - Jupyter experimentation environment
- **[Code Samples](../code-samples/)** - API usage examples

## 💰 Cost

Streamlit itself is free and open-source. Costs come from:

- **Amazon Bedrock**: Pay per token used
- **AWS hosting** (if deployed): EC2/Fargate costs
- **Storage**: S3 for uploaded files

**Local development**: Only Bedrock API costs
**Typical session cost**: $0.01 - $0.10 depending on usage

## 🤝 Contributing

Contributions welcome! To add a new Streamlit application:

1. Create a new directory with descriptive name
2. Add `app.py` (main Streamlit app)
3. Add `requirements.txt` (Python dependencies)
4. Add `README.md` (setup and usage instructions)
5. Submit a pull request

## 📄 License

MIT-0 - See LICENSE file in repository root
