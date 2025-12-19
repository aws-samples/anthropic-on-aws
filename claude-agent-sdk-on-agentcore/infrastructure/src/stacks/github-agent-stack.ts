/**
 * GitHub Agent Automation POC - Main Infrastructure Stack
 *
 * THIN ORCHESTRATOR PATTERN
 * This stack delegates all business logic to constructs.
 * It validates props, instantiates constructs, and exports resources.
 *
 * Following sample-validator CDK patterns:
 * - NO explicit resource names (CloudFormation generates)
 * - SSM Parameters for cross-stack communication
 * - Environment-aware removal policies
 */

import { Stack, StackProps, CfnOutput, RemovalPolicy, Tags, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as scheduler from 'aws-cdk-lib/aws-scheduler';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as logs from 'aws-cdk-lib/aws-logs';

// Import constructs
import { AgentcoreConstruct } from '../constructs/agentcore-construct';
import { WebhookConstruct } from '../constructs/webhook-construct';
import { ObservabilityConstruct } from '../constructs/observability-construct';

/**
 * Props for GithubAgentStack
 * Extends StackProps to inherit standard CDK stack properties
 */
export interface GithubAgentStackProps extends StackProps {
  /**
   * Deployment environment
   * - dev: Development (DESTROY removal policy)
   * - staging: Staging (DESTROY removal policy)
   * - prod: Production (RETAIN removal policy)
   */
  deploymentEnvironment: 'dev' | 'staging' | 'prod';
}

/**
 * Main infrastructure stack for GitHub Agent Automation POC
 *
 * Creates:
 * - AgentCore supporting resources (ECR, IAM, Secrets, EFS, VPC)
 * - Webhook infrastructure (API Gateway, Lambda)
 * - Observability (CloudWatch, X-Ray)
 */
export class GithubAgentStack extends Stack {
  /**
   * Deployment environment for this stack
   */
  public readonly deploymentEnvironment: 'dev' | 'staging' | 'prod';

  /**
   * Removal policy based on environment
   * Production uses RETAIN, dev/staging use DESTROY
   */
  public readonly removalPolicy: RemovalPolicy;

  constructor(scope: Construct, id: string, props: GithubAgentStackProps) {
    super(scope, id, props);

    // Validate props
    if (!props.deploymentEnvironment) {
      throw new Error('deploymentEnvironment prop is required');
    }

    this.deploymentEnvironment = props.deploymentEnvironment;

    // Set removal policy based on environment
    // Production resources are retained, dev/staging are destroyed
    this.removalPolicy = this.deploymentEnvironment === 'prod'
      ? RemovalPolicy.RETAIN
      : RemovalPolicy.DESTROY;

    // ========================================================================
    // CONSTRUCTS (Business Logic)
    // ========================================================================

    // Observability infrastructure
    // Creates: CloudWatch log groups, X-Ray sampling rules, CloudWatch dashboard
    const observability = new ObservabilityConstruct(this, 'Observability', {
      environment: this.deploymentEnvironment,
      removalPolicy: this.removalPolicy,
    });

    // ========================================================================
    // WORKFLOW STATE TABLE (DynamoDB)
    // ========================================================================
    // Tracks workflow state for long-running agent executions
    // Enables checkpoint/resume functionality via EventBridge watchdog
    const workflowStateTable = new dynamodb.Table(this, 'WorkflowStateTable', {
      // Partition key: unique workflow identifier (UUID)
      partitionKey: {
        name: 'workflow_id',
        type: dynamodb.AttributeType.STRING,
      },

      // Billing mode: PAY_PER_REQUEST for cost optimization (no minimum capacity)
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,

      // Removal policy based on environment
      removalPolicy: this.removalPolicy,

      // Point-in-time recovery for production
      pointInTimeRecovery: this.deploymentEnvironment === 'prod',

      // Table class: STANDARD (default, supports GSI)
      tableClass: dynamodb.TableClass.STANDARD,
    });

    // Add tags for cost allocation (using Tags.of() API)
    Tags.of(workflowStateTable).add('Project', 'github-agent-automation');
    Tags.of(workflowStateTable).add('Environment', this.deploymentEnvironment);
    Tags.of(workflowStateTable).add('ManagedBy', 'CDK');
    Tags.of(workflowStateTable).add('Purpose', 'workflow-state-tracking');

    // Global Secondary Index: Query workflows by repo and status
    // Use case: "Show me all RUNNING workflows for repo X"
    workflowStateTable.addGlobalSecondaryIndex({
      indexName: 'repo-status-index',
      partitionKey: {
        name: 'repo',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'status',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL, // Include all attributes
    });

    // ========================================================================
    // EVENTBRIDGE SCHEDULER (created early for AgentCore env var)
    // ========================================================================
    // Schedule Group for organizing workflow watchdog schedules
    // Each workflow creates a one-time schedule to check completion after 65 minutes
    const scheduleGroup = new scheduler.CfnScheduleGroup(this, 'ScheduleGroup', {
      name: `github-agent-watchdog-${this.deploymentEnvironment}`,
      tags: [
        { key: 'Project', value: 'github-agent-automation' },
        { key: 'Environment', value: this.deploymentEnvironment },
        { key: 'ManagedBy', value: 'CDK' },
        { key: 'Purpose', value: 'workflow-watchdog' },
      ],
    });

    // IAM role for EventBridge Scheduler to invoke Lambda
    // This role is assumed by EventBridge Scheduler when executing schedules
    const schedulerRole = new iam.Role(this, 'SchedulerRole', {
      assumedBy: new iam.ServicePrincipal('scheduler.amazonaws.com'),
      description: 'IAM role for EventBridge Scheduler to invoke Watchdog Lambda',
      maxSessionDuration: Duration.hours(1),
      inlinePolicies: {
        'LambdaInvokePolicy': new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: ['lambda:InvokeFunction'],
              resources: [
                // Wildcard for all Lambda functions in this account/region
                // Will be restricted by schedule configuration
                `arn:aws:lambda:${this.region}:${this.account}:function/*`,
              ],
            }),
          ],
        }),
      },
    });

    // Add tags to scheduler role
    Tags.of(schedulerRole).add('Project', 'github-agent-automation');
    Tags.of(schedulerRole).add('Environment', this.deploymentEnvironment);
    Tags.of(schedulerRole).add('ManagedBy', 'CDK');
    Tags.of(schedulerRole).add('Purpose', 'scheduler-execution');

    // ========================================================================
    // AGENTCORE CONSTRUCT
    // ========================================================================
    // AgentCore supporting resources
    // Creates: ECR repository, IAM roles, Secrets, EFS, VPC, Runtime
    // NOTE: Created after DynamoDB table so we can pass table name as env var
    const agentcore = new AgentcoreConstruct(this, 'Agentcore', {
      environment: this.deploymentEnvironment,
      removalPolicy: this.removalPolicy,
      environmentVariables: {
        WORKFLOW_TABLE_NAME: workflowStateTable.tableName,
        SCHEDULE_GROUP_NAME: scheduleGroup.name!,
      },
    });

    // ========================================================================
    // SQS QUEUES (FIFO)
    // ========================================================================
    // Dead Letter Queue for failed workflow messages
    // FIFO ensures ordered delivery within the same workflow
    const deadLetterQueue = new sqs.Queue(this, 'DeadLetterQueue', {
      fifo: true, // FIFO queue for ordering
      contentBasedDeduplication: true, // Automatic deduplication based on content

      // Retention: Keep failed messages for 14 days for investigation
      retentionPeriod: Duration.days(14),

      // Removal policy
      removalPolicy: this.removalPolicy,
    });

    // Add tags to DLQ
    Tags.of(deadLetterQueue).add('Project', 'github-agent-automation');
    Tags.of(deadLetterQueue).add('Environment', this.deploymentEnvironment);
    Tags.of(deadLetterQueue).add('ManagedBy', 'CDK');
    Tags.of(deadLetterQueue).add('Purpose', 'workflow-dlq');

    // Work Queue for workflow orchestration
    // Lambda functions pull messages to invoke AgentCore runtime
    const workQueue = new sqs.Queue(this, 'WorkQueue', {
      fifo: true, // FIFO queue for ordering
      contentBasedDeduplication: true, // Automatic deduplication

      // Visibility timeout: Must exceed AgentCore max execution time (1 hour + buffer)
      // If message not deleted within this time, it becomes visible again for retry
      visibilityTimeout: Duration.minutes(65), // 1 hour + 5 minute buffer

      // Message retention: Keep messages for 4 days
      retentionPeriod: Duration.days(4),

      // Receive wait time: Long polling to reduce empty receives
      receiveMessageWaitTime: Duration.seconds(20),

      // Dead Letter Queue configuration
      deadLetterQueue: {
        queue: deadLetterQueue,
        maxReceiveCount: 3, // After 3 failed attempts, move to DLQ
      },

      // Removal policy
      removalPolicy: this.removalPolicy,
    });

    // Add tags to work queue
    Tags.of(workQueue).add('Project', 'github-agent-automation');
    Tags.of(workQueue).add('Environment', this.deploymentEnvironment);
    Tags.of(workQueue).add('ManagedBy', 'CDK');
    Tags.of(workQueue).add('Purpose', 'workflow-orchestration');

    // ========================================================================
    // LAMBDA FUNCTIONS (Workflow Orchestration)
    // ========================================================================

    // -------------------------------------------------------------------
    // Watchdog Lambda
    // -------------------------------------------------------------------
    // Invoked by EventBridge Scheduler to check workflow completion
    // If workflow incomplete: queue RESUME message and create next watchdog schedule
    const watchdogLambda = new lambda.Function(this, 'WatchdogLambda', {
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'handler.handler',
      code: lambda.Code.fromAsset('../lambda/watchdog'),
      timeout: Duration.minutes(1),
      memorySize: 256,
      environment: {
        WORKFLOW_TABLE_NAME: workflowStateTable.tableName,
        WORK_QUEUE_URL: workQueue.queueUrl,
        SCHEDULE_GROUP_NAME: scheduleGroup.name!,
        SCHEDULER_ROLE_ARN: schedulerRole.roleArn,
        MAX_RETRIES: '3',
        WATCHDOG_DELAY_MINUTES: '65',
        // Note: WATCHDOG_LAMBDA_ARN obtained from Lambda context at runtime
      },
    });

    // Add tags to Watchdog Lambda
    Tags.of(watchdogLambda).add('Project', 'github-agent-automation');
    Tags.of(watchdogLambda).add('Environment', this.deploymentEnvironment);
    Tags.of(watchdogLambda).add('ManagedBy', 'CDK');
    Tags.of(watchdogLambda).add('Purpose', 'workflow-watchdog');

    // Grant permissions to Watchdog Lambda
    workflowStateTable.grantReadWriteData(watchdogLambda); // DynamoDB read/write
    workQueue.grantSendMessages(watchdogLambda); // SQS send (for RESUME messages)

    // EventBridge Scheduler permissions (create/delete schedules)
    watchdogLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'scheduler:CreateSchedule',
        'scheduler:DeleteSchedule',
        'scheduler:GetSchedule',
      ],
      resources: [
        `arn:aws:scheduler:${this.region}:${this.account}:schedule/${scheduleGroup.name}/*`,
      ],
    }));

    // Permission to pass the scheduler role (required when creating schedules)
    watchdogLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['iam:PassRole'],
      resources: [schedulerRole.roleArn],
      conditions: {
        StringEquals: {
          'iam:PassedToService': 'scheduler.amazonaws.com',
        },
      },
    }));

    // Note: Lambda invoke permission is granted via scheduler role's inline policy
    // No need for resource-based policy on Lambda (avoids circular dependency)

    // -------------------------------------------------------------------
    // Ingestion Lambda
    // -------------------------------------------------------------------
    // Receives GitHub webhook events from API Gateway
    // Creates workflow record, queues work message, creates watchdog schedule
    const ingestionLambda = new lambda.Function(this, 'IngestionLambda', {
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'handler.handler',
      code: lambda.Code.fromAsset('../lambda/ingestion'),
      timeout: Duration.seconds(30),
      memorySize: 256,
      environment: {
        WORKFLOW_TABLE_NAME: workflowStateTable.tableName,
        WORK_QUEUE_URL: workQueue.queueUrl,
        WATCHDOG_LAMBDA_ARN: watchdogLambda.functionArn,
        SCHEDULER_ROLE_ARN: schedulerRole.roleArn,
        SCHEDULE_GROUP_NAME: scheduleGroup.name!,
        WATCHDOG_DELAY_MINUTES: '65',
      },
    });

    // Add tags to Ingestion Lambda
    Tags.of(ingestionLambda).add('Project', 'github-agent-automation');
    Tags.of(ingestionLambda).add('Environment', this.deploymentEnvironment);
    Tags.of(ingestionLambda).add('ManagedBy', 'CDK');
    Tags.of(ingestionLambda).add('Purpose', 'workflow-ingestion');

    // Grant permissions to Ingestion Lambda
    workflowStateTable.grantReadWriteData(ingestionLambda); // DynamoDB read/write
    workQueue.grantSendMessages(ingestionLambda); // SQS send (for START messages)

    // EventBridge Scheduler permissions (create schedules)
    ingestionLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'scheduler:CreateSchedule',
        'scheduler:DeleteSchedule',
        'scheduler:GetSchedule',
      ],
      resources: [
        `arn:aws:scheduler:${this.region}:${this.account}:schedule/${scheduleGroup.name}/*`,
      ],
    }));

    // Permission to pass the scheduler role (required when creating schedules)
    ingestionLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['iam:PassRole'],
      resources: [schedulerRole.roleArn],
      conditions: {
        StringEquals: {
          'iam:PassedToService': 'scheduler.amazonaws.com',
        },
      },
    }));

    // -------------------------------------------------------------------
    // Invoker Lambda
    // -------------------------------------------------------------------
    // Triggered by SQS to invoke AgentCore Runtime for workflow execution
    const invokerLambda = new lambda.Function(this, 'InvokerLambda', {
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'handler.handler',
      code: lambda.Code.fromAsset('../lambda/invoker'),
      timeout: Duration.minutes(15), // Max AgentCore execution time
      memorySize: 512, // Higher memory for streaming responses
      reservedConcurrentExecutions: 5, // Limit concurrent AgentCore invocations
      environment: {
        WORKFLOW_TABLE_NAME: workflowStateTable.tableName,
        RUNTIME_ARN: agentcore.runtimeArn,
        SCHEDULE_GROUP_NAME: scheduleGroup.name!,
      },
    });

    // Add tags to Invoker Lambda
    Tags.of(invokerLambda).add('Project', 'github-agent-automation');
    Tags.of(invokerLambda).add('Environment', this.deploymentEnvironment);
    Tags.of(invokerLambda).add('ManagedBy', 'CDK');
    Tags.of(invokerLambda).add('Purpose', 'workflow-invocation');

    // Grant permissions to Invoker Lambda
    workflowStateTable.grantReadWriteData(invokerLambda); // DynamoDB read/write

    // Grant AgentCore invocation permission
    invokerLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['bedrock-agentcore:InvokeAgentRuntime'],
      resources: ['*'], // AgentCore runtime invocation requires wildcard
    }));

    // Grant DynamoDB write permissions to AgentCore execution role
    // Agent updates workflow status to COMPLETED/FAILED when done
    workflowStateTable.grantWriteData(agentcore.agentcoreRole);

    // Grant DynamoDB read permissions to AgentCore execution role
    // Agent needs to read workflow to get schedule name for deletion
    workflowStateTable.grantReadData(agentcore.agentcoreRole);

    // EventBridge Scheduler permissions for AgentCore (delete schedules on completion)
    // Agent deletes watchdog schedule when marking workflow COMPLETED
    agentcore.agentcoreRole.addToPolicy(new iam.PolicyStatement({
      actions: ['scheduler:DeleteSchedule', 'scheduler:GetSchedule'],
      resources: [
        `arn:aws:scheduler:${this.region}:${this.account}:schedule/${scheduleGroup.name}/*`,
      ],
    }));

    // EventBridge Scheduler permissions (delete schedules on completion)
    invokerLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['scheduler:DeleteSchedule', 'scheduler:GetSchedule'],
      resources: [
        `arn:aws:scheduler:${this.region}:${this.account}:schedule/${scheduleGroup.name}/*`,
      ],
    }));

    // Add SQS trigger (event source mapping)
    invokerLambda.addEventSource(new lambdaEventSources.SqsEventSource(workQueue, {
      batchSize: 1, // Process one workflow at a time
      maxConcurrency: 5, // Max 5 concurrent invocations
      reportBatchItemFailures: true, // Enable partial batch failures
    }));

    // Webhook infrastructure
    // Creates: API Gateway REST API, Lambda function
    const webhook = new WebhookConstruct(this, 'Webhook', {
      environment: this.deploymentEnvironment,
      removalPolicy: this.removalPolicy,
      githubSecretArn: agentcore.githubSecretArn,
      logGroupName: observability.webhookLogGroupName,
      workflowTableName: workflowStateTable.tableName,
      workQueueUrl: workQueue.queueUrl,
      watchdogLambdaArn: watchdogLambda.functionArn,
      schedulerRoleArn: schedulerRole.roleArn,
      scheduleGroupName: scheduleGroup.name!,
    });

    // Grant permissions to Webhook Lambda
    workflowStateTable.grantReadWriteData(webhook.webhookFunction); // DynamoDB read/write
    workQueue.grantSendMessages(webhook.webhookFunction); // SQS send (for START messages)

    // EventBridge Scheduler permissions (create schedules)
    webhook.webhookFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'scheduler:CreateSchedule',
        'scheduler:DeleteSchedule',
        'scheduler:GetSchedule',
      ],
      resources: [
        `arn:aws:scheduler:${this.region}:${this.account}:schedule/${scheduleGroup.name}/*`,
      ],
    }));

    // Permission to pass the scheduler role (required when creating schedules)
    webhook.webhookFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: ['iam:PassRole'],
      resources: [schedulerRole.roleArn],
      conditions: {
        StringEquals: {
          'iam:PassedToService': 'scheduler.amazonaws.com',
        },
      },
    }));

    // Add Lambda metrics to observability dashboard
    observability.addLambdaMetrics(webhook.webhookFunctionName);

    // ========================================================================
    // SSM PARAMETER EXPORTS (Cross-Stack Communication)
    // ========================================================================
    // Following sample-validator pattern: use SSM instead of CloudFormation exports
    // Benefit: Avoids hard dependencies, enables independent stack updates

    // Export Docker image URI
    new ssm.StringParameter(this, 'AgentImageUriParameter', {
      parameterName: `/github-agent/${this.deploymentEnvironment}/agent-image-uri`,
      stringValue: agentcore.imageUri,
      description: 'Docker image URI for GitHub agent (built and pushed by CDK)',
    });

    // Export AgentCore runtime ARN
    new ssm.StringParameter(this, 'RuntimeArnParameter', {
      parameterName: `/github-agent/${this.deploymentEnvironment}/runtime-arn`,
      stringValue: agentcore.runtimeArn,
      description: 'AWS Bedrock AgentCore runtime ARN',
    });

    // Export AgentCore runtime ID
    new ssm.StringParameter(this, 'RuntimeIdParameter', {
      parameterName: `/github-agent/${this.deploymentEnvironment}/runtime-id`,
      stringValue: agentcore.runtimeId,
      description: 'AWS Bedrock AgentCore runtime ID',
    });

    // Export AgentCore Memory ID
    new ssm.StringParameter(this, 'MemoryIdParameter', {
      parameterName: `/github-agent/${this.deploymentEnvironment}/memory-id`,
      stringValue: agentcore.memoryId,
      description: 'AWS Bedrock AgentCore Memory ID',
    });

    // Export AgentCore Memory ARN
    new ssm.StringParameter(this, 'MemoryArnParameter', {
      parameterName: `/github-agent/${this.deploymentEnvironment}/memory-arn`,
      stringValue: agentcore.memoryArn,
      description: 'AWS Bedrock AgentCore Memory ARN',
    });

    // Export webhook API endpoint
    new ssm.StringParameter(this, 'WebhookApiEndpointParameter', {
      parameterName: `/github-agent/${this.deploymentEnvironment}/webhook-api-endpoint`,
      stringValue: webhook.apiEndpoint,
      description: 'API Gateway endpoint for GitHub webhooks',
    });

    // Export DynamoDB table name
    new ssm.StringParameter(this, 'WorkflowStateTableNameParameter', {
      parameterName: `/github-agent/${this.deploymentEnvironment}/workflow-state-table-name`,
      stringValue: workflowStateTable.tableName,
      description: 'DynamoDB table name for workflow state tracking',
    });

    // Export DynamoDB table ARN
    new ssm.StringParameter(this, 'WorkflowStateTableArnParameter', {
      parameterName: `/github-agent/${this.deploymentEnvironment}/workflow-state-table-arn`,
      stringValue: workflowStateTable.tableArn,
      description: 'DynamoDB table ARN for workflow state tracking',
    });

    // Export SQS work queue URL
    new ssm.StringParameter(this, 'WorkQueueUrlParameter', {
      parameterName: `/github-agent/${this.deploymentEnvironment}/work-queue-url`,
      stringValue: workQueue.queueUrl,
      description: 'SQS work queue URL for workflow orchestration',
    });

    // Export SQS work queue ARN
    new ssm.StringParameter(this, 'WorkQueueArnParameter', {
      parameterName: `/github-agent/${this.deploymentEnvironment}/work-queue-arn`,
      stringValue: workQueue.queueArn,
      description: 'SQS work queue ARN for IAM permissions',
    });

    // Export SQS DLQ URL
    new ssm.StringParameter(this, 'DlqUrlParameter', {
      parameterName: `/github-agent/${this.deploymentEnvironment}/dlq-url`,
      stringValue: deadLetterQueue.queueUrl,
      description: 'SQS dead letter queue URL',
    });

    // Export SQS DLQ ARN
    new ssm.StringParameter(this, 'DlqArnParameter', {
      parameterName: `/github-agent/${this.deploymentEnvironment}/dlq-arn`,
      stringValue: deadLetterQueue.queueArn,
      description: 'SQS dead letter queue ARN for IAM permissions',
    });

    // Export EventBridge Scheduler group name
    new ssm.StringParameter(this, 'ScheduleGroupNameParameter', {
      parameterName: `/github-agent/${this.deploymentEnvironment}/schedule-group-name`,
      stringValue: scheduleGroup.name!,
      description: 'EventBridge Scheduler group name for workflow watchdog schedules',
    });

    // Export EventBridge Scheduler role ARN
    new ssm.StringParameter(this, 'SchedulerRoleArnParameter', {
      parameterName: `/github-agent/${this.deploymentEnvironment}/scheduler-role-arn`,
      stringValue: schedulerRole.roleArn,
      description: 'IAM role ARN for EventBridge Scheduler to invoke Lambda',
    });

    // ========================================================================
    // CLOUDFORMATION OUTPUTS (Manual Configuration Steps)
    // ========================================================================
    // Outputs are displayed after deployment for manual setup steps

    // Output Docker image URI
    new CfnOutput(this, 'AgentImageUri', {
      value: agentcore.imageUri,
      description: 'Docker image URI (automatically built and pushed by CDK)',
      exportName: `${this.stackName}-AgentImageUri`,
    });

    // Output AgentCore runtime ARN
    new CfnOutput(this, 'RuntimeArn', {
      value: agentcore.runtimeArn,
      description: 'AWS Bedrock AgentCore runtime ARN (use to invoke runtime)',
      exportName: `${this.stackName}-RuntimeArn`,
    });

    // Output AgentCore runtime ID
    new CfnOutput(this, 'RuntimeId', {
      value: agentcore.runtimeId,
      description: 'AWS Bedrock AgentCore runtime ID',
      exportName: `${this.stackName}-RuntimeId`,
    });

    // Output AgentCore Memory ID
    new CfnOutput(this, 'MemoryId', {
      value: agentcore.memoryId,
      description: 'AWS Bedrock AgentCore Memory ID (for workflow state persistence)',
      exportName: `${this.stackName}-MemoryId`,
    });

    // Output AgentCore Memory ARN
    new CfnOutput(this, 'MemoryArn', {
      value: agentcore.memoryArn,
      description: 'AWS Bedrock AgentCore Memory ARN',
      exportName: `${this.stackName}-MemoryArn`,
    });

    // Output GitHub webhook URL
    new CfnOutput(this, 'WebhookUrl', {
      value: webhook.apiEndpoint,
      description: 'GitHub webhook URL (configure in GitHub repo settings)',
      exportName: `${this.stackName}-WebhookUrl`,
    });

    // Output GitHub secret ARN
    new CfnOutput(this, 'GithubSecretArn', {
      value: agentcore.githubSecretArn,
      description: 'AWS Secrets Manager ARN for GitHub token (add token manually)',
      exportName: `${this.stackName}-GithubSecretArn`,
    });

    // Output CloudWatch log group
    new CfnOutput(this, 'WebhookLogGroup', {
      value: observability.webhookLogGroupName,
      description: 'CloudWatch log group for webhook Lambda',
      exportName: `${this.stackName}-WebhookLogGroup`,
    });

    // Output CloudWatch dashboard
    new CfnOutput(this, 'Dashboard', {
      value: observability.dashboard.dashboardName,
      description: 'CloudWatch dashboard for monitoring',
      exportName: `${this.stackName}-Dashboard`,
    });

    // Output DynamoDB table name
    new CfnOutput(this, 'WorkflowStateTableName', {
      value: workflowStateTable.tableName,
      description: 'DynamoDB table name for workflow state tracking',
      exportName: `${this.stackName}-WorkflowStateTableName`,
    });

    // Output DynamoDB table ARN
    new CfnOutput(this, 'WorkflowStateTableArn', {
      value: workflowStateTable.tableArn,
      description: 'DynamoDB table ARN for IAM permissions',
      exportName: `${this.stackName}-WorkflowStateTableArn`,
    });

    // Output SQS work queue URL
    new CfnOutput(this, 'WorkQueueUrl', {
      value: workQueue.queueUrl,
      description: 'SQS work queue URL for sending workflow messages',
      exportName: `${this.stackName}-WorkQueueUrl`,
    });

    // Output SQS work queue ARN
    new CfnOutput(this, 'WorkQueueArn', {
      value: workQueue.queueArn,
      description: 'SQS work queue ARN for IAM permissions',
      exportName: `${this.stackName}-WorkQueueArn`,
    });

    // Output SQS DLQ URL
    new CfnOutput(this, 'DeadLetterQueueUrl', {
      value: deadLetterQueue.queueUrl,
      description: 'SQS dead letter queue URL for failed messages',
      exportName: `${this.stackName}-DeadLetterQueueUrl`,
    });

    // Output SQS DLQ ARN
    new CfnOutput(this, 'DeadLetterQueueArn', {
      value: deadLetterQueue.queueArn,
      description: 'SQS dead letter queue ARN for IAM permissions',
      exportName: `${this.stackName}-DeadLetterQueueArn`,
    });

    // Output EventBridge Scheduler group name
    new CfnOutput(this, 'ScheduleGroupName', {
      value: scheduleGroup.name!,
      description: 'EventBridge Scheduler group name for workflow watchdog schedules',
      exportName: `${this.stackName}-ScheduleGroupName`,
    });

    // Output EventBridge Scheduler role ARN
    new CfnOutput(this, 'SchedulerRoleArn', {
      value: schedulerRole.roleArn,
      description: 'IAM role ARN for EventBridge Scheduler to invoke Lambda',
      exportName: `${this.stackName}-SchedulerRoleArn`,
    });

    // Output Watchdog Lambda function ARN
    new CfnOutput(this, 'WatchdogLambdaArn', {
      value: watchdogLambda.functionArn,
      description: 'Watchdog Lambda function ARN',
      exportName: `${this.stackName}-WatchdogLambdaArn`,
    });

    // Output Watchdog Lambda function name
    new CfnOutput(this, 'WatchdogLambdaName', {
      value: watchdogLambda.functionName,
      description: 'Watchdog Lambda function name',
      exportName: `${this.stackName}-WatchdogLambdaName`,
    });

    // Output Ingestion Lambda function ARN
    new CfnOutput(this, 'IngestionLambdaArn', {
      value: ingestionLambda.functionArn,
      description: 'Ingestion Lambda function ARN',
      exportName: `${this.stackName}-IngestionLambdaArn`,
    });

    // Output Ingestion Lambda function name
    new CfnOutput(this, 'IngestionLambdaName', {
      value: ingestionLambda.functionName,
      description: 'Ingestion Lambda function name',
      exportName: `${this.stackName}-IngestionLambdaName`,
    });

    // Output Invoker Lambda function ARN
    new CfnOutput(this, 'InvokerLambdaArn', {
      value: invokerLambda.functionArn,
      description: 'Invoker Lambda function ARN',
      exportName: `${this.stackName}-InvokerLambdaArn`,
    });

    // Output Invoker Lambda function name
    new CfnOutput(this, 'InvokerLambdaName', {
      value: invokerLambda.functionName,
      description: 'Invoker Lambda function name',
      exportName: `${this.stackName}-InvokerLambdaName`,
    });
  }
}
