/**
 * AgentCore Supporting Infrastructure Construct
 *
 * Creates all AWS resources required for AWS Bedrock AgentCore:
 * - ECR repository for Docker images
 * - IAM roles and policies
 * - Secrets Manager for GitHub token
 * - EFS file system for agent state
 * - VPC with private subnets (optional, AgentCore can use default VPC)
 *
 * Following sample-validator patterns:
 * - NO explicit resource names (CloudFormation generates)
 * - Constructs contain business logic
 * - Environment-aware removal policies
 */

import { Construct } from 'constructs';
import { RemovalPolicy, Duration, SecretValue } from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecr_assets from 'aws-cdk-lib/aws-ecr-assets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as efs from 'aws-cdk-lib/aws-efs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as bedrockagentcore from 'aws-cdk-lib/aws-bedrockagentcore';
import * as path from 'path';

/**
 * Props for AgentcoreConstruct
 */
export interface AgentcoreConstructProps {
  /**
   * Deployment environment (dev/staging/prod)
   */
  environment: 'dev' | 'staging' | 'prod';

  /**
   * Removal policy for resources
   * Production: RETAIN, dev/staging: DESTROY
   */
  removalPolicy: RemovalPolicy;

  /**
   * Whether to create a dedicated VPC
   * Default: false (uses default VPC)
   */
  createVpc?: boolean;

  /**
   * Additional environment variables to pass to the agent container
   * Optional. Allows passing dynamic values like table names, API endpoints, etc.
   */
  environmentVariables?: Record<string, string>;
}

/**
 * AgentCore supporting infrastructure
 *
 * This construct creates all resources needed for AWS Bedrock AgentCore runtime:
 * - ECR for agent Docker images
 * - IAM roles for AgentCore execution
 * - Secrets for GitHub token
 * - EFS for agent state (if needed)
 */
export class AgentcoreConstruct extends Construct {
  /**
   * Docker image asset (automatically builds and pushes to ECR)
   */
  public readonly agentDockerImage: ecr_assets.DockerImageAsset;

  /**
   * ECR repository URI where image is stored
   */
  public readonly imageUri: string;

  /**
   * IAM role for AgentCore execution
   * Allows AgentCore to invoke Bedrock, CloudWatch, X-Ray
   */
  public readonly agentcoreRole: iam.Role;

  /**
   * IAM role ARN
   */
  public readonly agentcoreRoleArn: string;

  /**
   * GitHub token secret in Secrets Manager
   */
  public readonly githubSecret: secretsmanager.Secret;

  /**
   * GitHub secret ARN
   */
  public readonly githubSecretArn: string;


  /**
   * EFS file system for agent state (optional)
   */
  public readonly fileSystem?: efs.FileSystem;

  /**
   * VPC for AgentCore (optional)
   */
  public readonly vpc?: ec2.IVpc;

  /**
   * AgentCore runtime resource
   */
  public readonly runtime: bedrockagentcore.CfnRuntime;

  /**
   * AgentCore runtime ARN
   */
  public readonly runtimeArn: string;

  /**
   * AgentCore runtime ID
   */
  public readonly runtimeId: string;

  /**
   * AgentCore Memory resource
   */
  public readonly memory: bedrockagentcore.CfnMemory;

  /**
   * AgentCore Memory ID
   */
  public readonly memoryId: string;

  /**
   * AgentCore Memory ARN
   */
  public readonly memoryArn: string;

  constructor(scope: Construct, id: string, props: AgentcoreConstructProps) {
    super(scope, id);

    // ========================================================================
    // VPC (Optional)
    // ========================================================================
    // AgentCore can use default VPC or a dedicated VPC
    if (props.createVpc) {
      this.vpc = new ec2.Vpc(this, 'Vpc', {
        maxAzs: 2, // Multi-AZ for high availability
        natGateways: 1, // Single NAT gateway for cost optimization
        subnetConfiguration: [
          {
            name: 'Public',
            subnetType: ec2.SubnetType.PUBLIC,
            cidrMask: 24,
          },
          {
            name: 'Private',
            subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
            cidrMask: 24,
          },
        ],
      });
    }

    // ========================================================================
    // DOCKER IMAGE ASSET
    // ========================================================================
    // CDK automatically builds and pushes Docker image to ECR during deployment
    // This eliminates manual docker build/push steps
    this.agentDockerImage = new ecr_assets.DockerImageAsset(this, 'AgentImage', {
      directory: path.join(__dirname, '..', '..', '..', 'agent'), // Path to agent/ directory
      platform: ecr_assets.Platform.LINUX_ARM64, // AgentCore only supports ARM64
      buildArgs: {
        CACHE_BUST: new Date().toISOString(), // Force rebuild without cache
      },
      invalidation: {
        // Rebuild image when these files change
        buildArgs: true, // Changed to true to trigger rebuild on buildArgs change
        file: true,
        repositoryName: true,
      },
    });

    this.imageUri = this.agentDockerImage.imageUri;

    // ========================================================================
    // SECRETS MANAGER
    // ========================================================================

    // GitHub Personal Access Token
    // User must manually add token value after deployment
    // Required scopes: repo, pull_requests:write
    this.githubSecret = new secretsmanager.Secret(this, 'GithubToken', {
      // NO explicit secretName (CloudFormation generates unique name)
      description: 'GitHub Personal Access Token for PR operations',
      removalPolicy: props.removalPolicy,
      secretObjectValue: {
        token: SecretValue.unsafePlainText('REPLACE_WITH_GITHUB_PAT'),
      },
    });

    this.githubSecretArn = this.githubSecret.secretArn;

    // ========================================================================
    // IAM ROLE FOR AGENTCORE
    // ========================================================================
    // This role is assumed by AgentCore when executing agents
    // Grants access to: Bedrock, Secrets Manager, CloudWatch, X-Ray

    this.agentcoreRole = new iam.Role(this, 'AgentcoreRole', {
      // NO explicit roleName (CloudFormation generates unique name)
      assumedBy: new iam.ServicePrincipal('bedrock-agentcore.amazonaws.com'),
      description: 'IAM role for AWS Bedrock AgentCore execution',
      maxSessionDuration: Duration.hours(12), // Long-running agent sessions
    });

    // Allow AgentCore to invoke Bedrock models
    this.agentcoreRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'bedrock:InvokeModel',
          'bedrock:InvokeModelWithResponseStream',
          'bedrock:GetFoundationModel',
          'bedrock:ListFoundationModels',
        ],
        resources: ['*'], // Bedrock models don't support resource-level permissions
      })
    );

    // Allow AgentCore to read secrets (GitHub PAT)
    this.agentcoreRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'secretsmanager:GetSecretValue',
          'secretsmanager:DescribeSecret',
        ],
        resources: [
          this.githubSecret.secretArn,
        ],
      })
    );

    // Allow AgentCore to write logs to CloudWatch
    this.agentcoreRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
        ],
        resources: ['*'], // CloudWatch logs require wildcard
      })
    );

    // Allow AgentCore to write traces to X-Ray
    this.agentcoreRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'xray:PutTraceSegments',
          'xray:PutTelemetryRecords',
        ],
        resources: ['*'], // X-Ray requires wildcard
      })
    );

    // Allow AgentCore to access Memory service (will be restricted to specific memory after creation)
    // Note: Memory ARN not available yet, so using wildcard temporarily - will be updated below
    const memoryPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'bedrockagentcore:CreateMemorySession',
        'bedrockagentcore:GetMemorySession',
        'bedrockagentcore:DeleteMemorySession',
        'bedrockagentcore:InvokeMemoryAgent',
        'bedrockagentcore:CreateMemoryEvent',
        'bedrockagentcore:RetrieveMemoryRecords',
        'bedrockagentcore:ListMemoryRecords',
      ],
      resources: ['*'], // Will be restricted after memory creation
    });
    this.agentcoreRole.addToPolicy(memoryPolicy);

    // Allow AgentCore to pull Docker images from ECR
    this.agentDockerImage.repository.grantPull(this.agentcoreRole);

    // Also grant ECR authorization token (required for authentication)
    this.agentcoreRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['ecr:GetAuthorizationToken'],
        resources: ['*'], // GetAuthorizationToken doesn't support resource-level permissions
      })
    );

    this.agentcoreRoleArn = this.agentcoreRole.roleArn;

    // ========================================================================
    // AGENTCORE MEMORY
    // ========================================================================
    // Create Memory resource for workflow state persistence across sessions
    // Memory enables checkpoint/resume functionality for long-running workflows

    // Memory resource - following AWS sample pattern
    // https://github.com/awslabs/amazon-bedrock-agentcore-samples
    // Note: memoryStrategies and memoryExecutionRoleArn are NOT used during creation
    // Memory content is populated at runtime via Memory API, not CDK
    this.memory = new bedrockagentcore.CfnMemory(this, 'Memory', {
      name: `github_agent_memory_${props.environment}`, // Underscores only (per AWS sample)
      description: 'Memory store for GitHub agent workflow state and context',
      eventExpiryDuration: 30, // 30 days retention for conversation turns
    });

    // Apply removal policy via CFN (L1 constructs don't support removalPolicy directly)
    this.memory.applyRemovalPolicy(props.removalPolicy);

    // Export Memory IDs for use in agent configuration
    this.memoryId = this.memory.attrMemoryId;
    this.memoryArn = this.memory.attrMemoryArn;

    // ========================================================================
    // BEDROCK AGENTCORE RUNTIME
    // ========================================================================
    // Define the runtime using CDK BedrockAgentCore module
    // This automatically registers the runtime with AgentCore service

    this.runtime = new bedrockagentcore.CfnRuntime(this, 'Runtime', {
      // Runtime name (required) - only letters, numbers, and underscores allowed
      agentRuntimeName: 'github_pr_review_agent',

      // Description
      description: 'Automated GitHub pull request code review agent using Claude SDK',

      // Agent runtime artifact (required)
      agentRuntimeArtifact: {
        containerConfiguration: {
          containerUri: this.imageUri,
        },
      },

      // Network configuration (required)
      // Using PUBLIC mode for internet access
      networkConfiguration: {
        networkMode: 'PUBLIC',
      },

      // IAM execution role (required)
      roleArn: this.agentcoreRoleArn,

      // Environment variables passed to container
      environmentVariables: {
        // Claude Code configuration
        CLAUDE_CODE_USE_BEDROCK: '1',
        AWS_REGION: 'us-east-1',
        GITHUB_SECRET_ARN: this.githubSecretArn,
        DEPLOYMENT_VERSION: new Date().toISOString(), // Force runtime restart

        // AgentCore Memory configuration
        AGENTCORE_MEMORY_ID: this.memoryId,

        // OpenTelemetry configuration (minimal for AgentCore-hosted agents)
        // AgentCore automatically handles OTEL exporting when using opentelemetry-instrument
        AGENT_OBSERVABILITY_ENABLED: 'true',
        OTEL_PYTHON_DISTRO: 'aws_distro',
        OTEL_PYTHON_CONFIGURATOR: 'aws_configurator',

        // Additional environment variables from props (e.g., table names, API endpoints)
        ...props.environmentVariables,
      },

      // Tags for cost allocation and organization
      tags: {
        Project: 'github-agent-automation',
        Environment: props.environment,
        ManagedBy: 'CDK',
        Purpose: 'pull-request-review',
      },
    });

    // Ensure runtime waits for all dependencies to be ready
    this.runtime.node.addDependency(this.agentcoreRole);
    this.runtime.node.addDependency(this.agentDockerImage.repository);
    this.runtime.node.addDependency(this.memory);  // Wait for Memory resource

    this.runtimeArn = this.runtime.attrAgentRuntimeArn;
    this.runtimeId = this.runtime.attrAgentRuntimeId;

    // ========================================================================
    // EFS FILE SYSTEM (Optional)
    // ========================================================================
    // AgentCore can use EFS for persistent agent state
    // Currently not needed for PR review use case (stateless)
    // Uncomment if agent needs to persist state between invocations

    // if (this.vpc) {
    //   this.fileSystem = new efs.FileSystem(this, 'AgentFileSystem', {
    //     vpc: this.vpc,
    //     removalPolicy: props.removalPolicy,
    //     lifecyclePolicy: efs.LifecyclePolicy.AFTER_14_DAYS, // Move to IA after 14 days
    //     performanceMode: efs.PerformanceMode.GENERAL_PURPOSE,
    //     throughputMode: efs.ThroughputMode.BURSTING,
    //   });
    //
    //   // Allow AgentCore role to access EFS
    //   this.fileSystem.grantReadWrite(this.agentcoreRole);
    // }
  }
}
