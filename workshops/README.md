# Workshops

Structured, multi-lesson learning experiences for mastering Claude on AWS.

## 🎓 Available Workshops

### [Claude 3.7 Extended Thinking](claude-3.7-extended-thinking/)
**8-lesson workshop on Claude 3.7 Sonnet's extended thinking capabilities**

- **Format**: Jupyter notebooks
- **Duration**: 6-8 hours (self-paced)
- **Level**: Intermediate
- **Prerequisites**: Python, basic ML/LLM knowledge
- **What you'll learn**:
  - Extended thinking fundamentals
  - When and how to use extended thinking
  - Reasoning budget optimization
  - Effective prompting techniques
  - Tool use integration
  - Generating comprehensive outputs
  - Complex problem-solving
  - Migration from previous Claude models

**Lessons**:
1. Introduction to Claude 3.7 and Extended Thinking
2. When and How to Use Extended Thinking
3. Optimizing Reasoning Budget Allocation
4. Effective Prompting Techniques for Extended Thinking
5. Tool Use Integration with Extended Thinking
6. Generating Comprehensive Content and Long-Form Output
7. Complex Problem-Solving with Claude 3.7
8. Migrating Workloads to Claude 3.7

### [Claude 4 Interleaved Thinking](claude-4-interleaved-thinking/)
**Production-ready AI agents with Claude 4 and AWS Strands SDK**

- **Format**: Jupyter notebooks + Python code
- **Duration**: 8-10 hours (self-paced)
- **Level**: Advanced
- **Prerequisites**: Python, AWS knowledge, agent concepts
- **What you'll learn**:
  - Interleaved thinking patterns
  - Token budget management (up to 16K tokens)
  - Production agent patterns with Strands SDK
  - Multi-agent orchestration
  - Hierarchical delegation
  - Resource optimization strategies

**Components**:
- Basic and advanced notebooks on interleaved thinking
- Strands SDK agent implementations
- Multi-agent orchestration patterns
- Production-ready code examples

### [Prompt Engineering](prompt-engineering/)
**Comprehensive prompt engineering workshop** (External repository)

- **Format**: Multi-session workshop with notebooks
- **Duration**: 4-6 hours
- **Level**: Beginner to Intermediate
- **Prerequisites**: None
- **What you'll learn**:
  - Prompt engineering fundamentals
  - Best practices for Claude
  - Common patterns and anti-patterns
  - Systematic prompt development
  - Evaluation strategies

**Note**: This is a git submodule linking to the official [prompt-engineering-with-anthropic-claude-v-3](https://github.com/aws-samples/prompt-engineering-with-anthropic-claude-v-3) repository.

## 🚀 Getting Started

### Environment Setup

Most workshops use Jupyter notebooks. Setup options:

#### Option 1: Amazon SageMaker Studio Lab (Recommended)
```bash
# Free, no AWS account needed for notebooks
# Visit: https://studiolab.sagemaker.aws
# Clone this repository
# Run notebooks directly
```

#### Option 2: Amazon SageMaker Studio
```bash
# Requires AWS account
# Create SageMaker Domain
# Launch JupyterLab
# Clone repository
```

#### Option 3: Local Development
```bash
# Navigate to workshop directory
cd claude-3.7-extended-thinking

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Launch Jupyter
jupyter lab

# Open notebooks and start learning
```

## 📚 Learning Paths

### Path 1: Beginner → Intermediate
```
1. Prompt Engineering (basics)
   ↓
2. Claude 3.7 Extended Thinking (lessons 1-4)
   ↓
3. Claude 3.7 Extended Thinking (lessons 5-8)
   ↓
4. Practice with Code Samples and Notebooks
```

### Path 2: Intermediate → Advanced
```
1. Claude 3.7 Extended Thinking (complete)
   ↓
2. Claude 4 Interleaved Thinking (notebooks)
   ↓
3. Claude 4 Interleaved Thinking (Strands SDK)
   ↓
4. Build with CDK Applications or Deployment Examples
```

### Path 3: Hands-on Developer
```
1. Quick review: Prompt Engineering highlights
   ↓
2. Claude 3.7 Extended Thinking (lessons 2, 4, 5, 7)
   ↓
3. Claude 4 Interleaved Thinking (Strands SDK only)
   ↓
4. Deploy a real application
```

## 💡 Workshop Completion Tips

### Time Management
- **Block dedicated time**: Workshops are most effective with focused sessions
- **Take breaks**: Step away between complex lessons
- **Practice immediately**: Apply learnings to real problems
- **Review notebooks**: Code examples are reference material

### Active Learning
- Run all code cells yourself
- Experiment with parameters
- Try variations of prompts
- Compare results
- Take notes on insights

### Going Deeper
- Read referenced documentation
- Explore linked resources
- Join community discussions
- Build your own examples
- Share your learnings

## 🎯 After Completing Workshops

### Apply Your Knowledge
1. **Start a project**: Use [Streamlit Applications](../streamlit-applications/) for rapid prototyping
2. **Build production apps**: Deploy with [CDK Applications](../cdk-applications/)
3. **Explore patterns**: Check [Deployment Examples](../deployment-examples/)
4. **Reference code**: Use [Code Samples](../code-samples/) as snippets

### Continue Learning
- **Claude API docs**: https://docs.anthropic.com/
- **AWS Bedrock docs**: https://docs.aws.amazon.com/bedrock/
- **Anthropic Cookbook**: https://github.com/anthropics/anthropic-cookbook
- **Our Cookbooks**: [../cookbooks/](../cookbooks/)

### Share and Contribute
- Write blog posts about your experience
- Create your own notebooks
- Contribute improvements
- Help others in discussions

## 🔧 Troubleshooting

### Common Issues

**Jupyter Kernel Issues**
```bash
# Restart kernel
# Kernel → Restart Kernel and Clear All Outputs

# If persists, recreate environment
deactivate
rm -rf venv
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

**AWS Credentials**
```bash
# Configure AWS CLI
aws configure

# Or set environment variables
export AWS_ACCESS_KEY_ID=your_key
export AWS_SECRET_ACCESS_KEY=your_secret
export AWS_REGION=us-east-1
```

**Bedrock Access**
```bash
# Ensure model access enabled in AWS Console:
# Bedrock → Model access → Request access
# Wait for approval (usually instant for Claude models)
```

**Python Dependencies**
```bash
# Update pip first
pip install --upgrade pip

# Install with verbose output
pip install -r requirements.txt --verbose

# If specific package fails, install separately
pip install package-name
```

## 📊 Workshop Comparison

| Workshop | Duration | Level | Format | Best For |
|----------|----------|-------|--------|----------|
| Prompt Engineering | 4-6h | Beginner | Notebooks | Learning basics |
| Extended Thinking | 6-8h | Intermediate | Notebooks | Advanced prompting |
| Interleaved Thinking | 8-10h | Advanced | Notebooks + Code | Production agents |

## 🔗 Related Resources

- **[Notebooks](../notebooks/)** - Quick experiments and explorations
- **[Code Samples](../code-samples/)** - Focused examples
- **[Streamlit Applications](../streamlit-applications/)** - Interactive demos
- **[CDK Applications](../cdk-applications/)** - Production deployments
- **[Cookbooks](../cookbooks/)** - Pattern library

## 🤝 Contributing

To contribute a workshop:

1. Create a new directory with descriptive name
2. Include:
   - Comprehensive README
   - requirements.txt
   - Numbered lessons or modules
   - Working code examples
   - Practice exercises
   - Solutions (in separate directory)
3. Test all notebooks in clean environment
4. Submit pull request

## 📄 License

MIT-0 - See LICENSE file in repository root

---

**Ready to start learning? Pick a workshop and dive in!** 🚀
