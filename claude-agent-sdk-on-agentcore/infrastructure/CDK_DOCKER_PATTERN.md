# CDK Docker Image Asset Pattern

## Overview

**Use `DockerImageAsset` to automatically build and push Docker images during CDK deployment instead of manual docker commands.**

This pattern eliminates manual docker build/push steps and integrates Docker image management into your infrastructure-as-code workflow.

## ❌ Anti-Pattern: Manual Docker Build/Push

```typescript
// DON'T DO THIS
export class AgentcoreConstruct extends Construct {
  public readonly ecrRepository: ecr.Repository;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    // Creates empty ECR repository
    this.ecrRepository = new ecr.Repository(this, 'Repository', {
      removalPolicy: props.removalPolicy,
    });

    // ❌ User must manually:
    // 1. docker build -t my-image .
    // 2. docker tag my-image ${ECR_URI}
    // 3. docker push ${ECR_URI}
  }
}
```

**Problems:**
- Manual steps required outside CDK
- Not repeatable/automatable
- Easy to forget or skip
- No integration with CI/CD
- Image and infrastructure can get out of sync

## ✅ Best Practice: DockerImageAsset

```typescript
import * as ecr_assets from 'aws-cdk-lib/aws-ecr-assets';
import * as path from 'path';

export class AgentcoreConstruct extends Construct {
  public readonly agentDockerImage: ecr_assets.DockerImageAsset;
  public readonly imageUri: string;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    // ✅ CDK automatically builds and pushes during deployment
    this.agentDockerImage = new ecr_assets.DockerImageAsset(this, 'AgentImage', {
      directory: path.join(__dirname, '..', '..', '..', 'agent'),
      platform: ecr_assets.Platform.LINUX_ARM64, // or LINUX_AMD64
      invalidation: {
        buildArgs: false,
        file: true,
        repositoryName: true,
      },
    });

    this.imageUri = this.agentDockerImage.imageUri;

    // Grant IAM permissions to pull the image
    this.agentDockerImage.repository.grantPull(someRole);
  }
}
```

**Benefits:**
- ✅ Fully automated - no manual steps
- ✅ Repeatable - same image every deployment
- ✅ Integrated with CDK deployment
- ✅ Works in CI/CD pipelines automatically
- ✅ Image URI available immediately in code
- ✅ Proper IAM permissions via `.repository.grantPull()`

## How It Works

When you run `cdk deploy`:

1. **Build**: CDK runs `docker build` in the specified directory
2. **Tag**: Image is tagged with a content hash
3. **Push**: Image is pushed to an auto-created ECR repository
4. **Deploy**: CloudFormation templates reference the image URI
5. **Cleanup**: Old images can be auto-deleted based on retention policy

## Platform Specification

Always specify the platform to match your runtime environment:

```typescript
// For AWS Lambda on ARM64 (Graviton)
platform: ecr_assets.Platform.LINUX_ARM64

// For AWS Lambda on x86_64
platform: ecr_assets.Platform.LINUX_AMD64

// For AWS Bedrock AgentCore (requires ARM64)
platform: ecr_assets.Platform.LINUX_ARM64
```

## Invalidation Strategy

Control when CDK rebuilds the image:

```typescript
invalidation: {
  buildArgs: false,   // Don't rebuild if build args change
  file: true,         // Rebuild if Dockerfile or source files change
  repositoryName: true, // Rebuild if repo name changes
}
```

## Docker Build Context

The `directory` parameter sets the Docker build context:

```typescript
// Project structure:
// infrastructure/
// ├── src/constructs/agentcore-construct.ts  (this file)
// └── ...
// agent/
// ├── Dockerfile
// ├── src/
// └── .claude/

// Path calculation:
directory: path.join(__dirname, '..', '..', '..', 'agent')
// __dirname = infrastructure/src/constructs
// ..        = infrastructure/src
// ..        = infrastructure
// ..        = project root
// agent     = agent/
```

## IAM Permissions

Grant pull permissions to roles that need to use the image:

```typescript
// Single role
this.agentDockerImage.repository.grantPull(agentcoreRole);

// Multiple roles
this.agentDockerImage.repository.grantPull(role1);
this.agentDockerImage.repository.grantPull(role2);

// Grant to a service
new ecs.FargateTaskDefinition(this, 'Task', {
  executionRole: executionRole,
});
this.agentDockerImage.repository.grantPull(executionRole);
```

## Accessing Image URI

The image URI is available immediately:

```typescript
// In construct
this.imageUri = this.agentDockerImage.imageUri;

// In stack
const agentcore = new AgentcoreConstruct(this, 'Agentcore', {...});

// Use image URI
new CfnOutput(this, 'AgentImageUri', {
  value: agentcore.imageUri,
  description: 'Docker image URI (built and pushed by CDK)',
});

// Store in SSM Parameter
new ssm.StringParameter(this, 'ImageUriParam', {
  parameterName: `/app/image-uri`,
  stringValue: agentcore.imageUri,
});
```

## CI/CD Integration

In CI/CD pipelines, no special setup needed:

```yaml
# GitHub Actions, GitLab CI, etc.
- name: Deploy CDK Stack
  run: |
    npm install
    npm run build
    npx cdk deploy --require-approval never
    # ✅ Docker image build/push happens automatically!
```

## Cost Optimization

DockerImageAsset creates ECR repositories automatically. Control costs:

```typescript
// In construct props
removalPolicy: RemovalPolicy.DESTROY  // Delete repo when stack deleted

// Lifecycle policies (if using manual ecr.Repository)
lifecycleRules: [
  {
    description: 'Keep last 10 images',
    maxImageCount: 10,
  },
]
```

## Multi-Architecture Builds

For multi-arch images (advanced):

```typescript
// Option 1: Build for specific platform
platform: ecr_assets.Platform.LINUX_ARM64

// Option 2: Use buildx for multi-arch (requires Docker buildx)
buildArgs: {
  '--platform': 'linux/arm64,linux/amd64',
}
```

## Troubleshooting

### Build fails with "platform not supported"
- Check your local Docker supports the target platform
- For ARM64 on x86 Mac: Enable Rosetta in Docker Desktop
- For ARM64 on x86 Linux: Install qemu-user-static

### Image not updating on redeploy
- CDK uses content hash to determine if rebuild needed
- Force rebuild: `cdk deploy --no-asset-cache`
- Or: Update invalidation strategy

### ECR push permission denied
- Check AWS credentials: `aws sts get-caller-identity`
- Ensure IAM user/role has ECR push permissions
- CDK automatically handles ECR auth

## Real-World Example

From this project (github-agent-automation):

```typescript
// infrastructure/src/constructs/agentcore-construct.ts
this.agentDockerImage = new ecr_assets.DockerImageAsset(this, 'AgentImage', {
  directory: path.join(__dirname, '..', '..', '..', 'agent'),
  platform: ecr_assets.Platform.LINUX_ARM64, // AgentCore requires ARM64
});

this.imageUri = this.agentDockerImage.imageUri;
this.agentDockerImage.repository.grantPull(this.agentcoreRole);

// infrastructure/src/stacks/github-agent-stack.ts
new CfnOutput(this, 'AgentImageUri', {
  value: agentcore.imageUri,
  description: 'Docker image URI (automatically built and pushed by CDK)',
});
```

**Deployment:**
```bash
cd infrastructure
npm run build
npx cdk deploy
# ✅ Docker image built and pushed automatically
# ✅ Image URI available in CloudFormation outputs
# ✅ Ready to use with AgentCore immediately
```

## Summary

| Aspect | Manual Build/Push | DockerImageAsset |
|--------|-------------------|------------------|
| Automation | ❌ Manual steps | ✅ Fully automated |
| Repeatability | ❌ Prone to errors | ✅ Consistent |
| CI/CD Integration | ⚠️ Extra scripts needed | ✅ Built-in |
| Image URI | ⚠️ Must hardcode | ✅ Available in code |
| IAM Permissions | ⚠️ Manual setup | ✅ Via `.grantPull()` |
| Infrastructure Sync | ❌ Can drift | ✅ Always in sync |

**Recommendation**: Always use `DockerImageAsset` for Docker-based AWS services in CDK.
