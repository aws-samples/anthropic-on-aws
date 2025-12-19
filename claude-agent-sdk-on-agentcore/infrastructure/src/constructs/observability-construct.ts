/**
 * Observability Infrastructure Construct
 *
 * Creates monitoring and tracing resources:
 * - CloudWatch Log Groups for Lambda and AgentCore
 * - X-Ray sampling rules for distributed tracing
 * - CloudWatch Dashboard for metrics visualization
 *
 * Following sample-validator patterns:
 * - NO explicit resource names (CloudFormation generates)
 * - Constructs contain business logic
 * - Environment-aware removal policies
 */

import { Construct } from 'constructs';
import { RemovalPolicy, Duration } from 'aws-cdk-lib';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as xray from 'aws-cdk-lib/aws-xray';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';

/**
 * Props for ObservabilityConstruct
 */
export interface ObservabilityConstructProps {
  /**
   * Deployment environment (dev/staging/prod)
   */
  environment: 'dev' | 'staging' | 'prod';

  /**
   * Removal policy for resources
   * Production: RETAIN, dev/staging: DESTROY
   */
  removalPolicy: RemovalPolicy;
}

/**
 * Observability infrastructure for GitHub Agent Automation
 *
 * This construct creates:
 * - CloudWatch Log Groups (webhook Lambda, AgentCore agents)
 * - X-Ray sampling rules (distributed tracing)
 * - CloudWatch Dashboard (metrics and logs)
 */
export class ObservabilityConstruct extends Construct {
  /**
   * CloudWatch log group for webhook Lambda
   */
  public readonly webhookLogGroup: logs.LogGroup;

  /**
   * Webhook log group name
   */
  public readonly webhookLogGroupName: string;

  /**
   * CloudWatch log group for AgentCore agents
   */
  public readonly agentcoreLogGroup: logs.LogGroup;

  /**
   * AgentCore log group name
   */
  public readonly agentcoreLogGroupName: string;

  /**
   * X-Ray sampling rule for distributed tracing
   */
  public readonly xraySamplingRule: xray.CfnSamplingRule;

  /**
   * CloudWatch dashboard for metrics
   */
  public readonly dashboard: cloudwatch.Dashboard;

  constructor(scope: Construct, id: string, props: ObservabilityConstructProps) {
    super(scope, id);

    // ========================================================================
    // CLOUDWATCH LOG GROUPS
    // ========================================================================
    // Centralized log management for all components

    // Log retention based on environment
    // Production: 90 days, dev/staging: 7 days
    const logRetention = props.environment === 'prod'
      ? logs.RetentionDays.THREE_MONTHS
      : logs.RetentionDays.ONE_WEEK;

    // Webhook Lambda logs
    this.webhookLogGroup = new logs.LogGroup(this, 'WebhookLogs', {
      // NO explicit logGroupName (CloudFormation generates unique name)
      retention: logRetention,
      removalPolicy: props.removalPolicy,
    });

    this.webhookLogGroupName = this.webhookLogGroup.logGroupName;

    // AgentCore agent logs
    this.agentcoreLogGroup = new logs.LogGroup(this, 'AgentcoreLogs', {
      // NO explicit logGroupName (CloudFormation generates unique name)
      retention: logRetention,
      removalPolicy: props.removalPolicy,
    });

    this.agentcoreLogGroupName = this.agentcoreLogGroup.logGroupName;

    // ========================================================================
    // X-RAY SAMPLING RULES
    // ========================================================================
    // Distributed tracing for request flow:
    // GitHub Webhook → API Gateway → Lambda → AgentCore → Bedrock

    // Sample 100% in dev/staging, 10% in production
    const samplingRate = props.environment === 'prod' ? 0.1 : 1.0;

    this.xraySamplingRule = new xray.CfnSamplingRule(this, 'XraySamplingRule', {
      samplingRule: {
        ruleName: `github-agent-${props.environment}`,
        priority: 1000, // Lower priority than AWS default rules
        version: 1,
        reservoirSize: 1, // Sample at least 1 request per second
        fixedRate: samplingRate, // Sample rate (0.1 = 10%, 1.0 = 100%)
        urlPath: '*', // Apply to all paths
        host: '*', // Apply to all hosts
        httpMethod: '*', // Apply to all HTTP methods
        serviceName: 'github-agent-*', // Match all github-agent services
        serviceType: '*', // Apply to all service types
        resourceArn: '*', // Apply to all resources
        attributes: {}, // No additional attribute filters
      },
    });

    // ========================================================================
    // CLOUDWATCH DASHBOARD
    // ========================================================================
    // Unified view of metrics and logs

    this.dashboard = new cloudwatch.Dashboard(this, 'Dashboard', {
      // NO explicit dashboardName (CloudFormation generates unique name)
      periodOverride: cloudwatch.PeriodOverride.AUTO,
    });

    // Add log query widgets
    // Lambda metric widgets will be added via addLambdaMetrics() method
    this.dashboard.addWidgets(
      new cloudwatch.LogQueryWidget({
        title: 'Recent Webhook Logs',
        logGroupNames: [this.webhookLogGroupName],
        queryLines: [
          'fields @timestamp, @message',
          'sort @timestamp desc',
          'limit 20',
        ],
        width: 24,
        height: 6,
      })
    );

    this.dashboard.addWidgets(
      new cloudwatch.LogQueryWidget({
        title: 'Recent AgentCore Logs',
        logGroupNames: [this.agentcoreLogGroupName],
        queryLines: [
          'fields @timestamp, @message',
          'sort @timestamp desc',
          'limit 20',
        ],
        width: 24,
        height: 6,
      })
    );

    // Error analysis query
    this.dashboard.addWidgets(
      new cloudwatch.LogQueryWidget({
        title: 'Error Analysis',
        logGroupNames: [this.webhookLogGroupName, this.agentcoreLogGroupName],
        queryLines: [
          'fields @timestamp, @message',
          'filter @message like /ERROR/ or @message like /Exception/',
          'sort @timestamp desc',
          'limit 50',
        ],
        width: 24,
        height: 6,
      })
    );
  }

  /**
   * Add Lambda function metrics to dashboard
   * Called by WebhookConstruct after Lambda is created
   */
  public addLambdaMetrics(functionName: string): void {
    // Add invocation count widget
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: `${functionName} Invocations`,
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Invocations',
            dimensionsMap: { FunctionName: functionName },
            statistic: 'Sum',
            period: Duration.minutes(1),
          }),
        ],
        width: 8,
      })
    );

    // Add error count widget
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: `${functionName} Errors`,
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Errors',
            dimensionsMap: { FunctionName: functionName },
            statistic: 'Sum',
            period: Duration.minutes(1),
          }),
        ],
        width: 8,
      })
    );

    // Add duration widget
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: `${functionName} Duration`,
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Duration',
            dimensionsMap: { FunctionName: functionName },
            statistic: 'Average',
            period: Duration.minutes(1),
          }),
        ],
        width: 8,
      })
    );
  }
}
