# Claude Agent SDK with Dynamic Skills on Amazon Bedrock AgentCore

This sample demonstrates **the architecture for dynamic skill management** using the Claude SDK with Amazon Bedrock on AgentCore Runtime. Skills are loaded dynamically from Amazon S3 at container startup, enabling centralized skill management and zero-downtime updates without container rebuilds.

## What Problem Does This Solve?

**AgentCore Runtime Challenge**: AgentCore does not provide persistent storage between container lifecycles. Traditional approaches require rebuilding containers to update agent capabilities.

This sample solves these limitations by:

- **Dynamic Skill Loading**: Skills loaded from S3 at container startup (once per container lifecycle, not per request)
- **Persistent Storage Workaround**: S3 acts as the persistent skill repository, bypassing AgentCore's ephemeral storage
- **Centralized Management**: Multiple agent instances share the same S3 skill repository
- **Zero-Downtime Updates**: Update skills in S3 → AgentCore spins up new containers → fresh skills loaded
- **Skill Modularity**: Reusable skills across different agent deployments

## Architecture

```
┌──────────┐     ┌─────────────────────┐     ┌─────────────────┐
│  User    │────▶│  AgentCore Runtime  │────▶│   Container     │
│  Request │     │  (Managed Service)  │     │   (HTTP:8080)   │
└──────────┘     └─────────────────────┘     └────────┬────────┘
                                                      │
                         ┌────────────────────────────┼────────────┐
                         │ Container Startup Process  │            │
                         │                            ▼            │
                         │  ┌─────────┐       ┌─────────────┐     │
                         │  │   S3    │◀──────│ Skill Loader│     │
                         │  │ Skills  │ load  │ downloads   │     │
                         │  │ Bucket  │       │ to .claude/ │     │
                         │  └─────────┘       └─────────────┘     │
                         │                            │            │
                         │                            ▼            │
                         │                   ┌─────────────┐      │
                         │                   │ Claude SDK  │      │
                         │                   │ discovers   │      │
                         │                   │ skills      │      │
                         │                   └─────────────┘      │
                         └─────────────────────────────────────────┘
```

**What This Sample Demonstrates:**
- **S3-Based Skill Loading**: Complete system for downloading skills from S3 into `.claude/skills/` directory
- **Dynamic Capability Updates**: Change agent capabilities by updating S3 without rebuilding containers
- **Skill Repository Management**: Centralized skill storage shared across multiple agent instances
- **Claude SDK Integration**: Native skill discovery and assembly using Claude Agent SDK

**Sample Skills Included:**
- **Code Analysis**: Demonstrates security analysis workflows (uses Claude's general knowledge + skill context)
- **Web Research**: Shows information synthesis patterns with citation tracking
- **Data Processing**: Illustrates multi-source data handling approaches

**Note**: The included skills provide **conceptual frameworks and prompting strategies** that guide Claude's responses. This architecture can be extended with custom implementations, APIs, and specialized tools to create production-ready agents.

**Skill Loading Process**:
1. Container starts → `startup.sh` executes (once per container lifecycle)
2. S3 skill loader downloads skills from S3 to `.claude/skills/`
3. Claude Agent SDK discovers skills in standard directory structure
4. Container serves multiple requests using the same loaded skills
5. When container is replaced → new container repeats steps 1-3 with fresh S3 download

**Important**: Skills are loaded **once per container lifecycle**, not per request. This means:
- ✅ Fast request handling (no S3 download per request)
- ✅ Minimal S3 API calls (one download per container startup)
- ✅ Skills persist across all requests handled by that container
- ✅ New containers automatically get updated skills from S3

## Prerequisites

* [AWS account](https://signin.aws.amazon.com/signin) with credentials configured (`aws configure`)
* [Python 3.10+](https://www.python.org/downloads/)
* [Docker](https://www.docker.com/) installed and running
* [AWS CLI](https://aws.amazon.com/cli/) configured
* Model Access: Claude model enabled in [Amazon Bedrock console](https://docs.aws.amazon.com/bedrock/latest/userguide/model-access-modify.html)

**Required AWS Permissions**:
* `BedrockAgentCoreFullAccess` managed policy
* `AmazonBedrockFullAccess` managed policy
* S3 access for skill repository (configured in setup steps)

## Quick Start

### Step 1: Create S3 Skills Repository

Create an S3 bucket and upload sample skills:

```bash
# Create S3 bucket (use a unique name)
export BUCKET_NAME="claude-agent-skills-$(date +%s)"
aws s3 mb s3://$BUCKET_NAME

# Create sample skills directory structure
mkdir -p skills/code-analysis skills/web-research skills/data-fetcher

# Create code-analysis skill
cat > skills/code-analysis/SKILL.md << 'EOF'
---
description: "Advanced code analysis for security vulnerabilities and best practices"
tags: ["security", "analysis", "code-review"]
---

# Code Analysis Skill

**What This Skill Does:**
- **Security Analysis**: Detects OWASP Top 10 vulnerabilities (SQL injection, XSS, CSRF, insecure authentication, etc.)
- **Performance Review**: Identifies N+1 queries, inefficient algorithms, memory leaks, and bottlenecks
- **Code Quality**: Checks naming conventions, code complexity, maintainability metrics
- **Dependency Audit**: Scans for known CVEs in third-party libraries

**Supported Languages:** Python, JavaScript/TypeScript, Java, Go, C/C++, Rust
EOF

# Create web-research skill
cat > skills/web-research/SKILL.md << 'EOF'
---
description: "Web research and information synthesis with citations"
tags: ["research", "web", "synthesis"]
---

# Web Research Skill

**What This Skill Does:**
- **Multi-Source Research**: Gathers information from documentation, forums, GitHub, Stack Overflow, and technical blogs
- **Fact Verification**: Cross-references information across multiple sources to ensure accuracy
- **Synthesis**: Combines information from different sources into coherent, comprehensive summaries
- **Citation Tracking**: Maintains source links and attribution for all research findings
EOF

# Create data-fetcher skill
cat > skills/data-fetcher/SKILL.md << 'EOF'
---
description: "Multi-source data retrieval and processing"
tags: ["data", "api", "database", "files"]
---

# Data Fetcher Skill

**What This Skill Does:**
- **API Integration**: Connects to REST APIs with OAuth, API keys, or basic auth
- **Database Queries**: Retrieves data from PostgreSQL, MySQL, MongoDB, DynamoDB
- **File Processing**: Parses CSV, JSON, XML, Excel files from local or cloud storage
- **Cloud Storage**: Accesses S3, Google Cloud Storage, Azure Blob for data files
EOF

# Upload skills to S3
aws s3 sync skills/ s3://$BUCKET_NAME/skills/

# Verify upload
aws s3 ls s3://$BUCKET_NAME/skills/ --recursive

# Save bucket name for later use
echo "export SKILLS_S3_BUCKET=$BUCKET_NAME" > .env
echo "S3 bucket created: $BUCKET_NAME"
```

### Step 2: Configure IAM Permissions

Add S3 permissions to your AgentCore execution role:

```bash
# Create IAM policy for S3 access
cat > s3-skills-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::$BUCKET_NAME",
        "arn:aws:s3:::$BUCKET_NAME/*"
      ]
    }
  ]
}
EOF

# Add this policy to your AgentCore execution role via AWS Console
echo "Add the above policy to your AgentCore execution role"
```

### Step 3: Install AgentCore CLI

```bash
pip install bedrock-agentcore anthropic boto3 pyyaml
```

### Step 4: Configure the Agent

```bash
# Set environment variable for S3 bucket
source .env  # Loads SKILLS_S3_BUCKET from Step 1

# Use the simple version (recommended for first deployment)
agentcore configure -e claude_sdk_bedrock.py -dt container -dm -ni

# Or use the advanced Claude Agent SDK version
agentcore configure -e agent/agent.py -dt container -dm -ni
```

### Step 5: Deploy to AgentCore Runtime

```bash
# Important: Use --local-build to avoid Lambda layer injection
agentcore launch --local-build
```

### Step 6: Test Your Agent

```bash
# Check deployment status
agentcore status

# Test 1: Verify Dynamic Skill Loading
agentcore invoke '{"prompt": "What skills do you have?"}'
# Expected: Agent lists code-analysis, web-research, and data-fetcher skills

# Test 2: Skill-Guided Code Review
agentcore invoke '{"prompt": "Using your code-analysis skill, review this Python function: def login(user, password): if user == \"admin\" and password == \"admin123\": return True"}'
# Expected: Applies code-analysis skill context to identify hardcoded credentials and suggest improvements

# Test 3: Research-Guided Response
agentcore invoke '{"prompt": "Using your web-research skill approach, explain best practices for API security"}'
# Expected: Structured response following web-research skill methodology with sources and citations
```

**Expected Behavior:**
- Agent references skills loaded from S3 in its responses
- Applies skill-specific methodologies and frameworks
- Uses skill context to provide structured, consistent guidance
- Demonstrates how skills influence response quality and approach

## Implementation Options

This sample provides **two implementation approaches** to demonstrate the concept at different complexity levels:

### Option 1: Simple Claude SDK (Recommended for Learning)
**File**: `claude_sdk_bedrock.py`
- Direct Bedrock API integration
- Skills injected into system prompt
- ~60 lines of code, easy to understand
- Perfect for learning the concepts
- **Use when**: Prototyping, learning, or building simple internal tools

**Why this exists**: Demonstrates the core concept without complexity. You can read the entire implementation in 5 minutes and understand exactly how S3 skills work. Great for proof-of-concepts and educational purposes.

### Option 2: Advanced Claude Agent SDK (Recommended for Production)
**File**: `agent/agent.py`
- Native Claude Agent SDK integration
- True skill discovery and assembly
- Async/await patterns, production-ready
- Advanced error handling and deduplication
- **Use when**: Building production systems or need advanced SDK features

**Why this exists**: Shows production-ready patterns with proper error handling, async operations, and native SDK integration. Use this as a template for real-world deployments where reliability and maintainability matter.

**Both approaches achieve the same goal** (dynamic S3 skill loading), just at different complexity levels. Start with Option 1 to understand the concept, then move to Option 2 for production deployments.

## Skills Repository Structure

The setup process creates an S3 bucket with sample skills:

```
s3://your-skills-bucket/
└── skills/
    ├── code-analysis/
    │   ├── SKILL.md          # Skill description and instructions
    │   └── implementation.py # Skill execution logic (advanced version)
    ├── web-research/
    │   ├── SKILL.md
    │   └── implementation.py
    ├── data-fetcher/
    │   ├── SKILL.md
    │   └── implementation.py
    ├── document-generator/
    │   ├── SKILL.md
    │   └── implementation.py
    ├── report-generator/
    │   ├── SKILL.md
    │   └── implementation.py
    └── data-analysis-workflow/
        ├── SKILL.md          # Orchestrator skill
        └── orchestrator.py   # Coordinates other skills
```

Each skill has:
- **SKILL.md**: YAML frontmatter + description (for Claude SDK discovery)
- **implementation.py**: Python execution logic (for advanced workflows)

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `AWS_REGION` | AWS region | `us-east-1` |
| `SKILLS_S3_BUCKET` | S3 bucket name | Set in Step 1 setup |
| `ANTHROPIC_MODEL` | Bedrock model ID | `us.anthropic.claude-sonnet-4-20250514-v1:0` |

### AgentCore Settings

| Setting | Value | Reason |
|---------|-------|--------|
| Build | `--local-build` | Avoids Lambda layer injection issues |
| Protocol | HTTP | Standard for AgentCore containers |
| Port | 8080 | Default AgentCore container port |

## Key Implementation Details

### Dynamic Skill Loading

```python
class ClaudeSkillLoader:
    def load_skills_from_s3(self):
        # List all skill directories in S3
        response = self.s3_client.list_objects_v2(
            Bucket=self.skills_bucket, Prefix='skills/', Delimiter='/'
        )

        for prefix in response.get('CommonPrefixes', []):
            skill_name = prefix['Prefix'].replace('skills/', '').rstrip('/')
            self._download_skill(skill_name)

        # Skills now available in .claude/skills/ for Claude SDK discovery
```

### Startup Orchestration

```bash
#!/bin/bash
# startup.sh - Container entry point

# Step 1: Load skills from S3 into .claude/skills/
python s3_skill_loader.py

# Step 2: Verify skills loaded correctly
ls -la .claude/skills/

# Step 3: Start Claude agent (skills auto-discovered)
exec python agent.py
```

### Claude SDK Integration

```python
# Simple version - skills in system prompt
skills_info = "\n".join([f"- {name}: {desc}" for name, desc in SKILLS.items()])
system_prompt = f"Available skills:\n{skills_info}"

response = claude_client.messages.create(
    model=MODEL_ID,
    system=system_prompt,
    messages=[{"role": "user", "content": prompt}]
)

# Advanced version - native skill discovery
options = ClaudeAgentOptions(
    setting_sources=["project"],  # Discovers .claude/skills/ directory
    allowed_tools=["Skill", "Read", "Write", "Bash"]
)
async for message in query(prompt=prompt, options=options):
    # Claude SDK automatically finds and uses skills
```

## Updating Skills

### Zero-Downtime Skill Updates

1. **Update skills in S3**:
   ```bash
   aws s3 cp new-skill.md s3://your-bucket/skills/new-skill/SKILL.md
   ```

2. **Restart containers** (AgentCore handles this):
   ```bash
   agentcore restart
   ```

3. **Skills automatically reload** from S3 on container startup

### Adding New Skills

1. Create skill directory in S3:
   ```bash
   aws s3 cp SKILL.md s3://your-bucket/skills/my-new-skill/SKILL.md
   aws s3 cp implementation.py s3://your-bucket/skills/my-new-skill/implementation.py
   ```

2. Restart agent - new skills auto-discovered

## Cost Considerations

- **AgentCore Runtime**: Pay per request/minute of execution
- **S3**: Minimal cost for skill storage and requests
- **Bedrock**: Pay per token (input/output)
- **ECR**: Container storage costs

**Cost Optimization**:
- Use `--local-build` to avoid CodeBuild charges
- Skills cached in container memory during container lifetime
- S3 requests minimized (one-time loading per container startup)

## Cleanup

```bash
# Destroy AgentCore deployment
agentcore destroy

# Remove S3 skills bucket (be careful - this deletes all skills!)
source .env  # Load SKILLS_S3_BUCKET
aws s3 rm s3://$SKILLS_S3_BUCKET --recursive
aws s3 rb s3://$SKILLS_S3_BUCKET

# Clean up local files
rm -rf skills/ .env
```

## Limitations and Considerations

### Container Lifecycle
- **Automatic termination**: Containers terminate after 15 minutes idle or 8 hours max lifetime (configurable via lifecycle settings)
- **Predictable replacement**: AgentCore replaces containers when idle timeout or max lifetime is reached, triggering fresh S3 downloads
- **Cold start on replacement**: Each new container must download skills from S3 (time varies based on skill size and S3 latency)
- **Skills loaded once per container**: Not per request. To update skills, AgentCore must provision new containers

### S3 Dependencies
- **S3 availability required**: Container startup fails if S3 is unavailable
- **Network latency**: S3 download time depends on region, skill size, and network conditions
- **S3 costs**: Minimal but consider GET request costs for frequent container replacements

### Skill Management
- **No versioning**: Skills are overwritten in S3. Consider using S3 versioning for rollback capability
- **No validation**: Skills are not validated before loading. Malformed skills may cause runtime errors
- **Skill size limits**: Large skills increase container startup time

### Resource Constraints
- **Ephemeral storage**: Skills stored in container filesystem, lost when container terminates
- **No persistent storage**: AgentCore sessions are ephemeral - data persists only for session duration
- **Container resources**: Subject to AgentCore Runtime resource limits (configurable per deployment)

### Best Practices
- ✅ Keep skills small and focused (< 100KB per skill recommended)
- ✅ Use S3 versioning for skill rollback capability
- ✅ Monitor S3 GET request costs in high-traffic scenarios
- ✅ Test skill updates in non-production environments first
- ✅ Include skill validation in your CI/CD pipeline
- ✅ Configure lifecycle settings based on your use case (idle timeout, max lifetime)
- ✅ Verify model availability in your AWS region before deployment

## Security Considerations

- **IAM Least Privilege**: Execution role has minimal S3 and Bedrock permissions
- **VPC Isolation**: Can be deployed in private VPC (configure AgentCore network settings)
- **Skill Validation**: Skills downloaded from trusted S3 bucket only
- **Container Security**: Multi-stage Docker build with minimal surface area

## Comparison with Existing AgentCore Examples

| Feature | This Sample | claude-agent-sdk-on-agentcore | claude-code-on-agentcore |
|---------|-------------|------------------------------|--------------------------|
| **Skill Updates** | S3-based dynamic loading | Container rebuild required | Fixed capabilities |
| **Skill Sharing** | Centralized S3 repository | Bundled per agent | No skill system |
| **Zero Downtime** | Update S3, restart containers | Rebuild + redeploy | Rebuild + redeploy |
| **Use Case** | Multi-skill agent framework | GitHub PR reviews | Claude Code CLI |

## Related Resources

* [Amazon Bedrock AgentCore Documentation](https://docs.aws.amazon.com/bedrock-agentcore/)
* [Claude SDK Documentation](https://docs.anthropic.com/en/api/claude-on-amazon-bedrock)
* [AWS CLI S3 Commands](https://docs.aws.amazon.com/cli/latest/reference/s3/)
* [Other AgentCore Samples](https://github.com/aws-samples/anthropic-on-aws)

## Contributing

This sample demonstrates an advanced pattern for production-scale agent deployments. Contributions welcome for:
- Additional skill examples
- Enhanced error handling patterns
- Multi-region deployment support
- Advanced skill dependency management

## License

This sample is licensed under the MIT-0 License. See the [LICENSE](LICENSE) file for details.