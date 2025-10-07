# CDK Applications

Production-ready full-stack applications using AWS CDK, Lambda, and managed services.

## 🚀 Applications

### [Metaprompt Generator](metaprompt-generator/)
Generate optimized prompts using meta-prompting techniques
- **Stack**: AWS CDK, Lambda, AppSync (GraphQL), React
- **Key Features**: Prompt optimization, template library, real-time generation
- **Deploy Time**: ~15 minutes
- **Use Case**: Prompt engineering teams, AI application developers

### [Claude Tools Chatbot](claude-tools-chatbot/)
Multi-tool chatbot with function calling and tool orchestration
- **Stack**: AWS CDK, AppSync (GraphQL), DynamoDB, Lambda, React
- **Key Features**: Tool orchestration, conversation memory, complex workflows
- **Deploy Time**: ~20 minutes
- **Use Case**: Conversational AI, customer support, virtual assistants

### [PDF Knowledge Base with Citations](pdf-knowledge-base-with-citations/)
RAG (Retrieval Augmented Generation) system with source citations
- **Stack**: Amazon Bedrock Knowledge Bases, Lambda, S3, React
- **Key Features**: PDF ingestion, semantic search, citation tracking, RAG
- **Deploy Time**: ~15 minutes
- **Use Case**: Document Q&A, research assistants, knowledge management

### [Classification with Intercom](classification-with-intercom/)
Customer support classification and intelligent routing
- **Stack**: Intercom API integration, Lambda, EventBridge, CDK
- **Key Features**: Automated ticket routing, sentiment analysis, team assignment
- **Deploy Time**: ~10 minutes
- **Use Case**: Customer support automation, ticket triage

## 🏗️ Common Architecture Patterns

All applications in this category follow similar patterns:

- **Infrastructure as Code**: AWS CDK (TypeScript) for reproducible deployments
- **Serverless Compute**: AWS Lambda for cost-effective scaling
- **API Layer**: AppSync (GraphQL) or API Gateway (REST)
- **Frontend**: React or Next.js with modern UI frameworks
- **AI/ML**: Amazon Bedrock with Claude models
- **Data**: DynamoDB, S3, or Amazon Bedrock Knowledge Bases

## 🎯 Prerequisites

- **AWS Account** with Amazon Bedrock access enabled
- **AWS CLI** configured with appropriate credentials
- **Node.js 18+** and npm/yarn
- **AWS CDK CLI** installed: `npm install -g aws-cdk`
- **Basic CDK knowledge** recommended (but not required)

## 🚀 Quick Start

```bash
# Navigate to an application
cd claude-tools-chatbot

# Install dependencies
yarn install

# Bootstrap CDK (first time only)
cdk bootstrap

# Deploy to AWS
cdk deploy

# Note the outputs (API endpoints, URLs, etc.)
```

## 💡 When to Use CDK Applications

**Choose CDK applications when you need**:
- ✅ Production-ready infrastructure
- ✅ Reproducible deployments (IaC)
- ✅ AWS managed services integration
- ✅ Scalability and reliability
- ✅ Full-stack architecture
- ✅ Team collaboration with version control

**Consider alternatives when**:
- ❌ Rapid prototyping → Try [Streamlit Applications](../streamlit-applications/)
- ❌ Learning/experimenting → Try [Notebooks](../notebooks/)
- ❌ Quick demos → Try [Code Samples](../code-samples/)

## 📊 Cost Considerations

CDK applications use serverless services with pay-per-use pricing:

- **Lambda**: Free tier includes 1M requests/month
- **AppSync**: Free tier includes 250K queries/month
- **DynamoDB**: Free tier includes 25GB storage
- **Amazon Bedrock**: Pay per token (see Bedrock pricing)

**Typical monthly cost** (low usage): $5-20
**Production workload**: Scales with usage

## 🔧 Development Workflow

### 1. Local Development
```bash
# Install dependencies
yarn install

# Run tests
yarn test

# Check CDK synth
cdk synth
```

### 2. Deployment
```bash
# Deploy to dev
cdk deploy

# Deploy to prod (with different context)
cdk deploy --context environment=prod
```

### 3. Monitoring
- CloudWatch Logs for Lambda functions
- AppSync query logging
- X-Ray tracing for distributed requests

## 🎓 Learning Resources

- **[AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)** - Official CDK guide
- **[Amazon Bedrock Guide](https://docs.aws.amazon.com/bedrock/)** - Bedrock documentation
- **[Workshops](../workshops/)** - Structured learning for Claude on AWS

## 🔗 Related Resources

- **[Streamlit Applications](../streamlit-applications/)** - Rapid prototyping alternatives
- **[Deployment Examples](../deployment-examples/)** - Advanced infrastructure patterns
- **[Code Samples](../code-samples/)** - Quick reference examples

## 🤝 Contributing

Found a bug or want to improve these applications? Contributions welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT-0 - See LICENSE file in repository root
