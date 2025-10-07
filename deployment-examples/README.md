# Deployment Examples

Advanced deployment patterns and specialized infrastructure for Claude on AWS.

## 🎯 Examples

### [Computer Use](computer-use/)
**ECS Fargate deployment for Claude's computer use capabilities**

- **Stack**: AWS CDK, ECS Fargate, ECR, VPC, Route 53 DNS Firewall
- **Purpose**: Sandboxed environment for Claude to interact with computers
- **Key Features**:
  - Containerized desktop environment with DCV
  - Network isolation with DNS firewall
  - Streamlit orchestration interface
  - Security controls and monitoring
- **Deploy Time**: ~15 minutes
- **Use Case**: Computer use automation, browser automation, UI testing

**Architecture**:
```
User → Streamlit (ECS) → Environment Container (ECS/DCV)
                       ↓
                  Bedrock Claude
```

### [Next.js Complex Schema](nextjs-complex-schema/)
**Next.js/TypeScript example for complex tool schemas**

- **Stack**: Next.js 14, TypeScript, Amazon Bedrock
- **Purpose**: Demonstrate tool use with complex nested JSON schemas
- **Key Features**:
  - TypeScript type safety
  - Complex schema validation
  - Modern React patterns
  - API route handlers
- **Deploy Time**: ~5 minutes (Vercel/Amplify)
- **Use Case**: Tool use patterns, schema design, TypeScript integration

## 🏗️ Architecture Patterns

### Container-Based Deployments
- **ECS Fargate**: Serverless containers for scalability
- **ECR**: Private container registry
- **VPC**: Network isolation and security
- **Load balancers**: High availability and routing

### Security Patterns
- **DNS Firewall**: Control outbound internet access
- **VPC isolation**: Network segmentation
- **IAM roles**: Least privilege access
- **Security groups**: Firewall rules

### Monitoring & Observability
- **CloudWatch Logs**: Centralized logging
- **CloudWatch Metrics**: Performance monitoring
- **VPC Flow Logs**: Network traffic analysis
- **X-Ray**: Distributed tracing

## 🚀 Getting Started

### Computer Use

```bash
cd computer-use

# Install dependencies
pip install -r requirements.txt

# Configure AWS region
export AWS_REGION=us-west-2

# Bootstrap CDK (first time only)
cdk bootstrap

# Deploy with your IP for access
cdk deploy --context deployer_ip=$(curl -s https://api.ipify.org)

# Get service URLs
./scripts/get_urls.sh
```

**Note**: Deployment takes ~15 minutes. Allow a few more minutes for containers to fully start.

### Next.js Complex Schema

```bash
cd nextjs-complex-schema

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your AWS credentials/region

# Run locally
npm run dev

# Visit http://localhost:3000
```

**Deployment options**:
- **Vercel**: `vercel deploy`
- **AWS Amplify**: Connect GitHub repo
- **Docker**: Build and deploy to ECS/Fargate

## 💡 When to Use Deployment Examples

**Use these patterns when you need**:
- ✅ Complex infrastructure requirements
- ✅ Container-based deployments
- ✅ Advanced security controls
- ✅ Network isolation and firewalls
- ✅ Custom compute environments
- ✅ Production-grade architectures

**Use simpler alternatives when**:
- ❌ Learning basics → [Code Samples](../code-samples/)
- ❌ Rapid prototyping → [Streamlit Applications](../streamlit-applications/)
- ❌ Standard serverless → [CDK Applications](../cdk-applications/)

## 🔐 Security Best Practices

### Network Security
- Use VPC with private subnets
- Implement DNS firewall for outbound control
- Configure security groups with least privilege
- Enable VPC Flow Logs for monitoring

### Container Security
- Scan images for vulnerabilities
- Use minimal base images
- Run containers as non-root users
- Keep images updated

### Access Control
- Use IAM roles (not access keys)
- Implement MFA for sensitive operations
- Rotate credentials regularly
- Audit CloudTrail logs

### Computer Use Specific
- **Isolate environment**: No access to sensitive data
- **Limit domains**: DNS firewall allowlist
- **Monitor activity**: CloudWatch and VPC logs
- **User confirmation**: For meaningful actions

## 📊 Cost Considerations

### Computer Use
- **ECS Fargate**: ~$50/month (running 24/7)
- **Data transfer**: Variable based on usage
- **CloudWatch Logs**: ~$5/month
- **Bedrock**: Pay per token

**Tip**: Stop when not in use to reduce costs

### Next.js
- **Vercel**: Free tier available
- **AWS Amplify**: Pay per build minute
- **Bedrock API**: Pay per token
- **Minimal hosting costs**

## 🎓 Advanced Topics

### Scaling Patterns
- Auto-scaling with ECS Service
- Load balancing across AZs
- Blue/green deployments
- Canary releases

### Disaster Recovery
- Multi-region deployments
- Backup and restore procedures
- RTO and RPO considerations
- Failover strategies

### CI/CD Integration
- GitHub Actions workflows
- CDK pipelines
- Automated testing
- Infrastructure validation

## 🔗 Related Resources

- **[CDK Applications](../cdk-applications/)** - Standard serverless patterns
- **[Workshops](../workshops/)** - Learn advanced concepts
- **[AWS Well-Architected](https://aws.amazon.com/architecture/well-architected/)** - Best practices
- **[Amazon ECS](https://docs.aws.amazon.com/ecs/)** - Container service docs
- **[Claude Computer Use](https://docs.anthropic.com/en/docs/build-with-claude/computer-use)** - Official docs

## ⚠️ Important Notes

### Computer Use
> **Security Warning**: Computer use poses unique risks. Follow all security best practices:
> - Use isolated environments
> - Implement DNS firewall controls
> - Monitor all activity
> - Require human confirmation for sensitive actions
> - Never give access to production systems

### Production Readiness
These examples demonstrate patterns but may need additional hardening for production:
- Implement comprehensive monitoring
- Add disaster recovery procedures
- Set up backup and restore
- Configure alerting and notifications
- Implement compliance controls

## 🤝 Contributing

To contribute a new deployment pattern:

1. Create a new directory with descriptive name
2. Include complete infrastructure code (CDK preferred)
3. Add comprehensive README with:
   - Architecture diagram
   - Prerequisites
   - Deployment instructions
   - Security considerations
   - Cost estimates
4. Test deployment in clean AWS account
5. Submit pull request

## 📄 License

MIT-0 - See LICENSE file in repository root
