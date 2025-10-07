# Anthropic on AWS

A comprehensive collection of samples, applications, and examples for using Anthropic's Claude models on Amazon Web Services.

## 🔍 Browse by Technology

### [CDK Applications](cdk-applications/)
Production-ready full-stack applications using AWS CDK, Lambda, and managed services.
- **Stack**: AWS CDK, Lambda, AppSync, DynamoDB, React
- **4 applications**: Metaprompt Generator, Claude Tools Chatbot, PDF Knowledge Base, Classification with Intercom
- **Best for**: Production deployments, serverless architectures, scalable applications

### [Streamlit Applications](streamlit-applications/)
Interactive demos and prototypes using Streamlit and Amazon Bedrock.
- **Stack**: Streamlit, Python, Amazon Bedrock
- **4 applications**: Multimodal Playground, Medical IDP, Complex Schema examples
- **Best for**: Rapid prototyping, feature testing, internal demos, proof-of-concepts

### [Deployment Examples](deployment-examples/)
Advanced deployment patterns: ECS, Fargate, Next.js, and specialized infrastructure.
- **Stack**: ECS/Fargate, Next.js, advanced AWS services
- **2 examples**: Computer Use (containerized), Next.js Complex Schema
- **Best for**: Complex infrastructure, production deployments, advanced patterns

### [Notebooks](notebooks/)
Interactive Jupyter notebooks for experimentation and learning.
- **Stack**: Jupyter, Python, Amazon Bedrock SDK
- **8+ notebooks**: Claude features, prompt caching, memory, PDF support, token efficiency
- **Best for**: Learning, experimentation, quick tests, data science workflows

### [Workshops](workshops/)
Structured, multi-lesson learning experiences for deep understanding.
- **Format**: Jupyter notebooks + code
- **3 workshops**: Extended Thinking (8 lessons), Interleaved Thinking (advanced), Prompt Engineering
- **Best for**: Comprehensive learning, skill development, structured courses

### [Code Samples](code-samples/)
Small, focused examples in various languages demonstrating specific features.
- **Languages**: Python, Go
- **3 samples**: 1M Context Window, GO SDK Streaming, Text Editor Tool
- **Best for**: Quick reference, API integration, copy-paste solutions

### [Cookbooks](cookbooks/)
Anthropic cookbook examples converted for Amazon Bedrock.
- **Format**: Jupyter notebooks
- **Topics**: Patterns, multimodal, tool use, best practices
- **Best for**: Common patterns, proven solutions, best practices

---

## 🎓 Learning Paths

Choose your path based on your experience level and goals:

### 🆕 Complete Beginner to Claude on AWS
```
1. Start: Code Samples (quick wins with API)
   └─ Try: text-editor-tool, 1m-context-window

2. Experiment: Notebooks (interactive learning)
   └─ Try: claude_code_on_bedrock, claude_prompt_caching_on_bedrock

3. Deep Dive: Workshops (structured learning)
   └─ Start with: Prompt Engineering workshop
   └─ Then: Claude 3.7 Extended Thinking

4. Build: Streamlit Applications (first app)
   └─ Deploy: claude-multimodal-llm-playground

5. Production: CDK Applications (scalable apps)
   └─ Study: claude-tools-chatbot architecture
```

### 🏗️ Experienced Developer Building Production Apps
```
1. API Basics: Code Samples
   └─ Quick review of API patterns

2. Architecture: CDK Applications
   └─ Review: All 4 CDK app architectures
   └─ Clone and customize one for your use case

3. Advanced Patterns: Deployment Examples
   └─ Study: computer-use for containerization
   └─ Apply patterns to your architecture

4. Best Practices: Advanced Claude Code Patterns
   └─ Integrate: Production patterns and automation
```

### 🔬 Researcher or Prototyper
```
1. Quick Start: Streamlit Applications
   └─ Run: claude-multimodal-llm-playground
   └─ Experiment with parameters

2. Deep Exploration: Notebooks
   └─ Try: claude_memory_features, claude_refusal_mitigation
   └─ Modify and test hypotheses

3. Learn Advanced: Workshops
   └─ Deep dive: Extended Thinking or Interleaved Thinking

4. Productionize: CDK Applications
   └─ When ready: Graduate prototypes to production
```

### 🚀 Enterprise Developer
```
1. Infrastructure: Deployment Examples
   └─ Study: computer-use for advanced patterns
   └─ Review: security and networking

2. Production Apps: CDK Applications
   └─ Analyze: All architectures
   └─ Adapt: For enterprise requirements

3. Advanced Patterns: Advanced Claude Code Patterns
   └─ Implement: CI/CD, quality gates, automation

4. Specialized: Claude Code on AgentCore
   └─ Deploy: Autonomous agents on Bedrock
```

---

## 🌟 Featured Resources

### [Advanced Claude Code Patterns](advanced-claude-code-patterns/)
**55+ production-ready components for sophisticated AI development**

- **Components**: 25 custom agents, 10 hook configurations, 18 slash commands
- **Purpose**: Production workflows, CI/CD integration, enterprise development
- **Perfect for**: Teams deploying Claude in production, DevOps automation, quality assurance

### [Claude Code on AgentCore](claude-code-on-agentcore/)
**Deploy Claude Code as an autonomous agent on Amazon Bedrock AgentCore**

- **Stack**: AWS CDK, ECS Fargate, ECR, Amazon Bedrock AgentCore
- **Purpose**: Serverless AI agents, automated coding tasks, headless operation
- **Perfect for**: Autonomous workflows, CI/CD bots, automated code generation

---

## 🚀 Quick Start

### For Your First Hour

1. **Read this README** to understand the structure
2. **Pick your path** from Learning Paths above
3. **Set up AWS credentials**:
   ```bash
   aws configure
   # Ensure Bedrock access is enabled in your AWS account
   ```
4. **Try a simple example**:
   ```bash
   cd code-samples/text-editor-tool
   pip install boto3
   python claude_text_editor_example.py
   ```

### Essential Prerequisites

- **AWS Account** with Amazon Bedrock access
- **AWS CLI** configured ([setup guide](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html))
- **Bedrock Model Access**: Enable Claude models in [Bedrock console](https://console.aws.amazon.com/bedrock/)
- **Development tools**:
  - Python 3.8+ (for most examples)
  - Node.js 18+ (for CDK applications)
  - Jupyter (for notebooks and workshops)

### Model Access Setup

1. Go to [Amazon Bedrock Console](https://console.aws.amazon.com/bedrock/)
2. Navigate to "Model access" in the left sidebar
3. Click "Enable specific models"
4. Select Claude models (instant approval)
5. Wait 1-2 minutes for access to be enabled

---

## 📊 Repository Structure

```
anthropic-on-aws/
├── cdk-applications/              Production CDK apps (4)
├── streamlit-applications/        Streamlit demos (4)
├── deployment-examples/           Advanced infrastructure (2)
├── notebooks/                     Jupyter experiments (8+)
├── workshops/                     Structured learning (3)
├── code-samples/                  Quick examples (3)
├── cookbooks/                     Pattern library
├── advanced-claude-code-patterns/ Production patterns (55+ components)
├── claude-code-on-agentcore/     Autonomous agents
└── docs/                          Documentation site
```

**Total**: 7 functional categories + 2 featured resources + docs

---

## 💡 How to Navigate This Repository

### By Use Case

| I want to... | Go to... |
|--------------|----------|
| Learn Claude API basics | [Code Samples](code-samples/) |
| Build a prototype fast | [Streamlit Applications](streamlit-applications/) |
| Deploy to production | [CDK Applications](cdk-applications/) |
| Learn systematically | [Workshops](workshops/) |
| Experiment interactively | [Notebooks](notebooks/) |
| Find proven patterns | [Cookbooks](cookbooks/) |
| Deploy complex infrastructure | [Deployment Examples](deployment-examples/) |
| Integrate production tools | [Advanced Claude Code Patterns](advanced-claude-code-patterns/) |

### By Technology Stack

| Technology | Category |
|------------|----------|
| AWS CDK + Lambda | [CDK Applications](cdk-applications/) |
| Streamlit + Python | [Streamlit Applications](streamlit-applications/) |
| ECS/Fargate | [Deployment Examples](deployment-examples/) |
| Jupyter + Python | [Notebooks](notebooks/), [Workshops](workshops/) |
| Go | [Code Samples](code-samples/claude-3.7-go-sdk-converse-streaming/) |
| Next.js | [Deployment Examples](deployment-examples/nextjs-complex-schema/) |

### By Claude Feature

| Feature | Examples |
|---------|----------|
| Extended Thinking | [Workshop](workshops/claude-3.7-extended-thinking/) |
| Interleaved Thinking | [Workshop](workshops/claude-4-interleaved-thinking/) |
| Tool Use | [Text Editor Tool](code-samples/text-editor-tool/), [Claude Tools Chatbot](cdk-applications/claude-tools-chatbot/) |
| Large Context | [1M Context Window](code-samples/1m-context-window/) |
| Multimodal | [Multimodal Playground](streamlit-applications/claude-multimodal-llm-playground/) |
| Prompt Caching | [Notebooks](notebooks/claude_prompt_caching_on_bedrock/) |
| Memory | [Notebooks](notebooks/claude_memory_features/) |

---

## 🎯 What's in Each Category?

Click on any category name above to see detailed READMEs with:
- Complete project listings
- Technology stacks
- Setup instructions
- When to use each approach
- Cost considerations
- Related resources

---

## 📚 Documentation

Full documentation is available at our [GitHub Pages site](https://aws-samples.github.io/anthropic-on-aws/).

**Highlights**:
- Getting started guides
- Architecture diagrams
- Best practices
- API references
- Deployment tutorials

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### Adding New Content

1. **Determine category**: Where does your contribution fit?
   - CDK app? → `cdk-applications/`
   - Streamlit demo? → `streamlit-applications/`
   - Learning material? → `workshops/` or `notebooks/`
   - Simple example? → `code-samples/`

2. **Follow structure**:
   - Create dedicated directory
   - Include comprehensive README
   - Add requirements.txt or package.json
   - Test in clean environment

3. **Submit PR**:
   - Clear description of what you're adding
   - Link to related issue (if applicable)
   - Ensure all tests pass

### Guidelines

- Keep examples focused and minimal
- Document prerequisites and setup
- Include cost estimates where applicable
- Follow security best practices
- Test with latest Claude models

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## 🔐 Security

- Never commit AWS credentials or API keys
- Use IAM roles when possible
- Follow principle of least privilege
- Enable CloudTrail for audit logging
- Review [SECURITY.md](SECURITY.md) for best practices

---

## 💰 Cost Optimization Tips

- **Use Free Tiers**: AWS Free Tier covers many services for learning
- **Enable Bedrock access wisely**: Only in regions you'll use
- **Monitor costs**: Set up AWS Budgets and CloudWatch alarms
- **Use Prompt Caching**: For repeated prompts (see notebooks)
- **Clean up resources**: Delete CDK stacks when not in use
- **Start small**: Test with minimal data before scaling

**Typical costs for learning**:
- Notebooks/Code Samples: $1-5/month
- Streamlit prototypes: $5-10/month
- CDK applications (dev): $10-30/month

---

## 📞 Support & Community

- **Issues**: [GitHub Issues](https://github.com/aws-samples/anthropic-on-aws/issues)
- **Discussions**: [GitHub Discussions](https://github.com/aws-samples/anthropic-on-aws/discussions)
- **AWS Support**: [AWS Support Center](https://console.aws.amazon.com/support/)
- **Claude Documentation**: [Anthropic Docs](https://docs.anthropic.com/)
- **Amazon Bedrock**: [Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)

---

## 📄 License

This library is licensed under the MIT-0 License. See the [LICENSE](LICENSE) file.

---

## 🙏 Acknowledgments

Built with contributions from the AWS and Anthropic communities. Special thanks to all contributors who have made this repository a comprehensive resource for Claude on AWS.

---

**Ready to start building with Claude on AWS? Pick a learning path above and dive in!** 🚀
