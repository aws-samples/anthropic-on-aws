// Thin poller: gateway /v1/organizations/spend_limits/effective -> CloudWatch metrics.
//
// Runs in the VPC (private subnets) on an EventBridge schedule. Reads the gateway's
// READ-ONLY admin key from Secrets Manager at invoke time (never stored in env), calls
// the internal ALB via private DNS, and publishes per-user spend as CloudWatch metrics:
//
//   Namespace ClaudeGateway
//     SpendToDate     (USD)     dims: UserEmail, Period
//     CapUtilization  (Percent) dims: UserEmail, Period   (only when a cap is set)
//
// This is the SERVER-SIDE number (the one 429 enforcement uses) — the authoritative
// per-user view. It is a list-price estimate, not the Bedrock invoice.

import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';

const GATEWAY_ORIGIN = process.env.GATEWAY_ORIGIN; // e.g. https://claude-gw.example.com
const READ_KEY_ARN = process.env.READ_KEY_ARN;

const sm = new SecretsManagerClient({});
const cw = new CloudWatchClient({});

export const handler = async () => {
  const { SecretString: key } = await sm.send(
    new GetSecretValueCommand({ SecretId: READ_KEY_ARN }),
  );

  // Page through /effective (principals with recorded spend; default page size 20).
  const rows = [];
  let page;
  do {
    const url = new URL(`${GATEWAY_ORIGIN}/v1/organizations/spend_limits/effective`);
    url.searchParams.set('limit', '1000');
    if (page) url.searchParams.set('page', page);
    const res = await fetch(url, { headers: { 'x-api-key': key } });
    if (!res.ok) throw new Error(`gateway /effective ${res.status}: ${await res.text()}`);
    const body = await res.json();
    rows.push(...body.data);
    page = body.next_page || null;
  } while (page);

  const metrics = [];
  for (const r of rows) {
    const email = r.actor?.email_address || r.scope?.user_id || 'unknown';
    const dims = [
      { Name: 'UserEmail', Value: email },
      { Name: 'Period', Value: r.period },
    ];
    // API convention (mirrors Anthropic Admin API): period_to_date_spend AND amount are
    // USD CENTS. Convert once here; everything published to CloudWatch is dollars.
    const spendUsd = parseFloat(r.period_to_date_spend || '0') / 100;
    metrics.push({ MetricName: 'SpendToDate', Dimensions: dims, Value: spendUsd, Unit: 'None' });
    if (r.amount != null) {
      const capUsd = parseInt(r.amount, 10) / 100;
      if (capUsd > 0) {
        metrics.push({
          MetricName: 'CapUtilization',
          Dimensions: dims,
          Value: (spendUsd / capUsd) * 100,
          Unit: 'Percent',
        });
      }
    }
  }

  // PutMetricData caps at 1000 datums/call.
  for (let i = 0; i < metrics.length; i += 1000) {
    await cw.send(
      new PutMetricDataCommand({ Namespace: 'ClaudeGateway', MetricData: metrics.slice(i, i + 1000) }),
    );
  }
  console.log(JSON.stringify({ principals: rows.length / 3 || rows.length, datums: metrics.length }));
  return { rows: rows.length, datums: metrics.length };
};
