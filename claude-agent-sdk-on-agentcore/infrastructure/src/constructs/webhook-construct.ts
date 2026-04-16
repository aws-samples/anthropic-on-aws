/**
 * GitHub Webhook Infrastructure Construct
 *
 * Creates API Gateway and Lambda for receiving GitHub webhook events:
 * - API Gateway REST API (public endpoint)
 * - Lambda function (webhook handler)
 * - IAM roles and policies
 *
 * Following sample-validator patterns:
 * - NO explicit resource names (CloudFormation generates)
 * - Constructs contain business logic
 * - Environment-aware removal policies
 */

import { Construct } from 'constructs';
import { RemovalPolicy, Duration } from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as path from 'path';

/**
 * Props for WebhookConstruct
 */
export interface WebhookConstructProps {
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
   * ARN of GitHub token secret in Secrets Manager
   */
  githubSecretArn: string;

  /**
   * CloudWatch log group name for webhook Lambda
   */
  logGroupName: string;

  /**
   * DynamoDB table name for workflow state tracking
   */
  workflowTableName: string;

  /**
   * SQS work queue URL for workflow orchestration
   */
  workQueueUrl: string;

  /**
   * ARN of Watchdog Lambda function
   */
  watchdogLambdaArn: string;

  /**
   * ARN of IAM role for EventBridge Scheduler
   */
  schedulerRoleArn: string;

  /**
   * EventBridge Scheduler group name for watchdog schedules
   */
  scheduleGroupName: string;
}

/**
 * GitHub webhook infrastructure
 *
 * This construct creates:
 * - API Gateway REST API (receives GitHub webhooks)
 * - Lambda function (verifies signature, creates workflow orchestration)
 * - IAM roles (Lambda execution, workflow orchestration)
 */
export class WebhookConstruct extends Construct {
  /**
   * Lambda function for webhook handling
   */
  public readonly webhookFunction: lambda.Function;

  /**
   * Lambda function name
   */
  public readonly webhookFunctionName: string;

  /**
   * API Gateway REST API
   */
  public readonly api: apigateway.RestApi;

  /**
   * API Gateway endpoint URL
   */
  public readonly apiEndpoint: string;

  constructor(scope: Construct, id: string, props: WebhookConstructProps) {
    super(scope, id);

    // ========================================================================
    // LAMBDA FUNCTION
    // ========================================================================
    // Handles GitHub webhook events:
    // 1. Verify HMAC-SHA256 signature
    // 2. Parse pull_request event
    // 3. Create workflow orchestration (DynamoDB + SQS + EventBridge)

    this.webhookFunction = new lambda.Function(this, 'WebhookHandler', {
      // NO explicit functionName (CloudFormation generates unique name)
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(
        path.join(__dirname, '..', 'lambda', 'webhook-handler')
      ),
      timeout: Duration.seconds(30), // GitHub webhooks timeout after 30s
      memorySize: 256, // Minimal memory (signature verification is lightweight)
      environment: {
        ENVIRONMENT: props.environment,
        GITHUB_SECRET_ARN: props.githubSecretArn,
        WORKFLOW_TABLE_NAME: props.workflowTableName,
        WORK_QUEUE_URL: props.workQueueUrl,
        WATCHDOG_LAMBDA_ARN: props.watchdogLambdaArn,
        SCHEDULER_ROLE_ARN: props.schedulerRoleArn,
        SCHEDULE_GROUP_NAME: props.scheduleGroupName,
        WATCHDOG_DELAY_MINUTES: '65',
      },
      logGroup: logs.LogGroup.fromLogGroupName(
        this,
        'WebhookLogGroup',
        props.logGroupName
      ),
      tracing: lambda.Tracing.ACTIVE, // Enable X-Ray tracing
    });

    this.webhookFunctionName = this.webhookFunction.functionName;

    // ========================================================================
    // LAMBDA IAM PERMISSIONS
    // ========================================================================

    // Allow Lambda to read GitHub secret (for signature verification)
    this.webhookFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'secretsmanager:GetSecretValue',
          'secretsmanager:DescribeSecret',
        ],
        resources: [props.githubSecretArn],
      })
    );

    // Allow Lambda to write X-Ray traces
    this.webhookFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'xray:PutTraceSegments',
          'xray:PutTelemetryRecords',
        ],
        resources: ['*'], // X-Ray requires wildcard
      })
    );

    // ========================================================================
    // API GATEWAY REST API
    // ========================================================================
    // Public endpoint for GitHub webhooks

    this.api = new apigateway.RestApi(this, 'WebhookApi', {
      // NO explicit restApiName (CloudFormation generates unique name)
      description: `GitHub webhook API (${props.environment})`,
      deployOptions: {
        stageName: props.environment,
        tracingEnabled: true, // Enable X-Ray tracing
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: false, // Log full request/response (disable in prod if sensitive)
        metricsEnabled: true, // Enable CloudWatch metrics
      },
      cloudWatchRole: true, // Create IAM role for CloudWatch logging
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL], // Regional endpoint (not edge-optimized)
      },
    });

    // ========================================================================
    // API GATEWAY ROUTES
    // ========================================================================

    // POST /webhook - Receives GitHub webhook events
    const webhookResource = this.api.root.addResource('webhook');
    webhookResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(this.webhookFunction, {
        proxy: true, // Pass entire request to Lambda
        integrationResponses: [
          {
            statusCode: '200',
            responseTemplates: {
              'application/json': '{"status": "success"}',
            },
          },
          {
            statusCode: '400',
            selectionPattern: '.*\\[BadRequest\\].*',
            responseTemplates: {
              'application/json': '{"status": "error", "message": "Bad request"}',
            },
          },
          {
            statusCode: '401',
            selectionPattern: '.*\\[Unauthorized\\].*',
            responseTemplates: {
              'application/json': '{"status": "error", "message": "Unauthorized"}',
            },
          },
          {
            statusCode: '500',
            selectionPattern: '.*\\[InternalError\\].*',
            responseTemplates: {
              'application/json': '{"status": "error", "message": "Internal server error"}',
            },
          },
        ],
      }),
      {
        methodResponses: [
          { statusCode: '200' },
          { statusCode: '400' },
          { statusCode: '401' },
          { statusCode: '500' },
        ],
      }
    );

    // GET /health - Health check endpoint
    const healthResource = this.api.root.addResource('health');
    healthResource.addMethod(
      'GET',
      new apigateway.MockIntegration({
        integrationResponses: [
          {
            statusCode: '200',
            responseTemplates: {
              'application/json': '{"status": "healthy"}',
            },
          },
        ],
        requestTemplates: {
          'application/json': '{"statusCode": 200}',
        },
      }),
      {
        methodResponses: [{ statusCode: '200' }],
      }
    );

    this.apiEndpoint = `${this.api.url}webhook`;
  }
}
