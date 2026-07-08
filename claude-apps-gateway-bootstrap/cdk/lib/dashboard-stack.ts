import { Stack, StackProps, Duration, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { DeployConfig } from './config';

interface DashboardStackProps extends StackProps {
  readonly config: DeployConfig;
}

/**
 * Single-pane observability dashboard, three layers (no Bedrock invocation logging —
 * deliberate: prompt/response capture is a separate governance decision):
 *   1. AWS/Bedrock  — native, always-on: account ground truth per model.
 *   2. ClaudeCode   — OTLP from CLI/Desktop via the ADOT sidecar: how users work.
 *   3. ClaudeGateway — spend-metrics Lambda: who spent what vs caps (enforcement view).
 */
export class DashboardStack extends Stack {
  constructor(scope: Construct, id: string, props: DashboardStackProps) {
    super(scope, id, props);

    // SEARCH expressions so widgets pick up new users/models without a redeploy.
    const search = (expr: string, stat: string, label?: string) =>
      new cloudwatch.MathExpression({
        expression: `SEARCH('${expr}', '${stat}', 300)`,
        usingMetrics: {},
        label: label ?? ' ',
        period: Duration.minutes(5),
      });

    const bedrockByModel = (metric: string, stat: string) =>
      search(`{AWS/Bedrock,ModelId} MetricName="${metric}"`, stat);

    const dash = new cloudwatch.Dashboard(this, 'Dashboard', {
      dashboardName: 'claude-observability',
      defaultInterval: Duration.hours(24),
    });

    // ---- Row 1: Bedrock ground truth (native metrics, per model) ----
    dash.addWidgets(
      new cloudwatch.TextWidget({
        markdown:
          '# Bedrock — account ground truth (native metrics)\n' +
          'Everything the account does on Bedrock in this region, per model — gateway AND direct. No invocation logging enabled.',
        width: 24, height: 2,
      }),
    );
    dash.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Invocations by model', width: 8, height: 6,
        left: [bedrockByModel('Invocations', 'Sum')],
      }),
      new cloudwatch.GraphWidget({
        title: 'Tokens by model (input + output)', width: 8, height: 6,
        left: [bedrockByModel('InputTokenCount', 'Sum')],
        right: [bedrockByModel('OutputTokenCount', 'Sum')],
        leftYAxis: { label: 'input', showUnits: false },
        rightYAxis: { label: 'output', showUnits: false },
      }),
      new cloudwatch.GraphWidget({
        title: 'Latency p99 / errors / throttles', width: 8, height: 6,
        left: [bedrockByModel('InvocationLatency', 'p99')],
        right: [
          bedrockByModel('InvocationClientErrors', 'Sum'),
          bedrockByModel('InvocationServerErrors', 'Sum'),
          bedrockByModel('InvocationThrottles', 'Sum'),
        ],
        leftYAxis: { label: 'ms', showUnits: false },
        rightYAxis: { label: 'count', showUnits: false },
      }),
    );

    // ---- Row 2: per-user usage (OTLP -> ADOT -> EMF, namespace ClaudeCode) ----
    dash.addWidgets(
      new cloudwatch.TextWidget({
        markdown:
          '# Claude Code / Desktop usage per user (OTLP)\n' +
          'Client-reported telemetry via the ADOT sidecar. Gateway-authenticated sessions stamp the real ' +
          'Entra email; direct-Bedrock sessions show anonymised IDs.',
        width: 24, height: 2,
      }),
    );
    dash.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Tokens by user', width: 8, height: 6,
        left: [search('{ClaudeCode,OTelLib,user.email} MetricName="claude_code.token.usage"', 'Sum')],
      }),
      new cloudwatch.GraphWidget({
        title: 'Cost (USD, client-estimated) by user', width: 8, height: 6,
        left: [search('{ClaudeCode,OTelLib,user.email} MetricName="claude_code.cost.usage"', 'Sum')],
      }),
      new cloudwatch.GraphWidget({
        title: 'Tokens by model / sessions', width: 8, height: 6,
        left: [search('{ClaudeCode,OTelLib,model,user.email} MetricName="claude_code.token.usage"', 'Sum')],
        right: [search('{ClaudeCode,OTelLib} MetricName="claude_code.session.count"', 'Sum', 'sessions')],
      }),
      new cloudwatch.GraphWidget({
        title: 'Lines of code / commits', width: 12, height: 5,
        left: [search('{ClaudeCode,OTelLib,type,user.email} MetricName="claude_code.lines_of_code.count"', 'Sum')],
        right: [search('{ClaudeCode,OTelLib,user.email} MetricName="claude_code.commit.count"', 'Sum')],
      }),
      new cloudwatch.GraphWidget({
        title: 'MCP tool calls (by server/tool)', width: 12, height: 5,
        left: [search('{ClaudeCode,OTelLib,mcp_server.name,mcp_tool.name,user.email} MetricName="claude_code.token.usage"', 'Sum')],
      }),
    );

    // ---- Row 3: gateway spend enforcement view (Lambda-published) ----
    dash.addWidgets(
      new cloudwatch.TextWidget({
        markdown:
          '# Gateway spend vs caps (enforcement view)\n' +
          'Server-side meter — the number 429 blocking uses. List-price estimate, not the Bedrock invoice. ' +
          'Manage caps: `scripts/07-quota.sh`.',
        width: 24, height: 2,
      }),
    );
    dash.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Spend to date (USD) by user/period', width: 9, height: 6,
        left: [search('{ClaudeGateway,"Period",UserEmail} MetricName="SpendToDate"', 'Maximum')],
      }),
      new cloudwatch.GraphWidget({
        title: 'Cap utilization % (429-blocked at 100)', width: 9, height: 6,
        left: [search('{ClaudeGateway,"Period",UserEmail} MetricName="CapUtilization"', 'Maximum')],
        leftYAxis: { min: 0, max: 110, showUnits: false },
        leftAnnotations: [
          { value: 80, label: 'alarm', color: '#ff9900' },
          { value: 100, label: 'blocked', color: '#d13212' },
        ],
      }),
      new cloudwatch.AlarmStatusWidget({
        title: 'Spend alarms', width: 6, height: 6,
        alarms: [
          cloudwatch.Alarm.fromAlarmArn(this, 'CapAlarm',
            `arn:aws:cloudwatch:${this.region}:${this.account}:alarm:claude-gateway-spend-cap-80pct`),
        ],
      }),
    );

    new CfnOutput(this, 'DashboardUrl', {
      value: `https://${this.region}.console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards/dashboard/claude-observability`,
    });
  }
}
