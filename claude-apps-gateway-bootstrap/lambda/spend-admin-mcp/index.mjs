// Spend-admin MCP tools — Lambda target behind an Amazon Bedrock AgentCore Gateway.
//
// The AgentCore gateway (ap-southeast-2) authenticates callers with a CUSTOM_JWT
// authorizer (Entra tenant, audience = the spend-admin public client; the app's
// service principal has appRoleAssignmentRequired=true, so ONLY assigned admins can
// obtain a token). It then invokes this Lambda per tool call, passing the tool name in
// the client context as "<targetName>___<toolName>".
//
// This Lambda runs IN THE VPC (private subnets) and reads the Claude apps gateway's
// admin API through the internal ALB with the READ-ONLY key. Deliberately no set_cap /
// delete tools: cap mutations stay with humans (scripts/07-quota.sh).

import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const GATEWAY_ORIGIN = process.env.GATEWAY_ORIGIN;
const READ_KEY_ARN = process.env.READ_KEY_ARN;

const sm = new SecretsManagerClient({});
let cachedKey;

async function readKey() {
  if (!cachedKey) {
    const { SecretString } = await sm.send(new GetSecretValueCommand({ SecretId: READ_KEY_ARN }));
    cachedKey = SecretString;
  }
  return cachedKey;
}

async function effective(params = {}) {
  const key = await readKey();
  const rows = [];
  let page;
  do {
    const url = new URL(`${GATEWAY_ORIGIN}/v1/organizations/spend_limits/effective`);
    url.searchParams.set('limit', '1000');
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    if (page) url.searchParams.set('page', page);
    const res = await fetch(url, { headers: { 'x-api-key': key } });
    if (!res.ok) throw new Error(`gateway /effective ${res.status}: ${await res.text()}`);
    const body = await res.json();
    rows.push(...body.data);
    page = body.next_page || null;
  } while (page);
  return rows;
}

// API convention (mirrors Anthropic Admin API): period_to_date_spend AND amount are USD
// CENTS. Convert to dollars once, here — every tool result is dollars.
const usd = c => (c == null ? null : Number(c) / 100);

function summarize(r) {
  const spendUsd = usd(r.period_to_date_spend || 0);
  const capUsd = usd(r.amount);
  return {
    user: r.actor?.email_address || r.scope?.user_id,
    name: r.actor?.name || null,
    period: r.period,
    spend_usd: spendUsd,
    cap_usd: capUsd,
    // One-decimal precision: integer rounding turns 0.33% into a misleading 0%, and —
    // worse — 99.5% into 100%, which get_blocked_users would report as blocked before
    // the gateway actually blocks.
    cap_utilization_pct:
      capUsd != null && capUsd > 0 ? Math.round((spendUsd / capUsd) * 1000) / 10 : null,
  };
}

const tools = {
  // Spend to date for every user (optionally one period: daily|weekly|monthly).
  async get_spend({ period } = {}) {
    const rows = await effective(period ? { 'period[]': period } : {});
    return rows.map(summarize);
  },

  // Top spenders for one period, highest first.
  async get_top_spenders({ period = 'daily', limit = 10 } = {}) {
    const rows = await effective({ 'period[]': period, sort: 'spend_desc' });
    return rows.slice(0, limit).map(summarize);
  },

  // Configured caps (raw spend_limits list).
  async get_caps() {
    const key = await readKey();
    const res = await fetch(`${GATEWAY_ORIGIN}/v1/organizations/spend_limits?limit=1000`, {
      headers: { 'x-api-key': key },
    });
    if (!res.ok) throw new Error(`gateway /spend_limits ${res.status}`);
    const body = await res.json();
    return body.data.map(l => ({
      id: l.id,
      scope: l.scope,
      cap_usd: usd(l.amount),
      period: l.period,
      updated_at: l.updated_at,
    }));
  },

  // Users at or over 100% of any cap (blocked), plus anyone over a warn threshold.
  async get_blocked_users({ warn_pct = 80 } = {}) {
    const rows = (await effective()).map(summarize).filter(r => r.cap_utilization_pct != null);
    return {
      blocked: rows.filter(r => r.cap_utilization_pct >= 100),
      warning: rows.filter(r => r.cap_utilization_pct >= warn_pct && r.cap_utilization_pct < 100),
    };
  },
};

export const handler = async (event, context) => {
  // AgentCore passes "<targetName>___<toolName>" in the client context.
  const raw = context.clientContext?.custom?.bedrockAgentCoreToolName || '';
  const name = raw.includes('___') ? raw.split('___').pop() : raw;
  const fn = tools[name];
  if (!fn) return { error: `unknown tool: ${raw}` };
  try {
    const result = await fn(event || {});
    return { result };
  } catch (e) {
    return { error: String(e.message || e) };
  }
};
