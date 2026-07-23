# Module 3: Telemetry (Per-User Usage Attribution)

## What it is

The gateway relays OpenTelemetry Protocol (OTLP) metrics from Claude Code to a collector you configure. Each export is stamped with the developer's identity (user ID, email, IdP groups), giving you per-user cost and usage breakdowns with no developer-side configuration.

## Benefits

- Per-user usage breakdowns: who used which models, how many tokens, at what latency
- Identity stamping: automatic, no developer-side setup
- Any OTLP backend: works with any OpenTelemetry-compatible collector
- Sensitivity control: metrics (safe) vs logs/traces (sensitive, opt-in)
- Data stays under your control: telemetry goes to your collector, never to Anthropic

## How to configure it

```yaml
telemetry:
  forward_to:
    - url: https://your-otlp-collector.internal.company.com:4318
      headers:
        Authorization: Bearer ${OTLP_TOKEN}
      metrics: true     # Token counts, latency, model (default when telemetry configured)
      logs: false       # Bash commands, file paths (sensitive, opt-in)
      traces: false     # Full tool inputs (most sensitive, opt-in)
```

### Configuration notes

- Configuring `telemetry.forward_to` together with `listen.public_url` automatically enables telemetry on all connected clients
- The gateway pushes OTEL environment variables to clients via managed settings (no developer action needed)
- Each destination independently opts into metrics, logs, and traces
- Multiple destinations are supported (e.g., one for metrics, another for logs)

### CloudWatch OTLP via ADOT collector sidecar (AWS-native)

This example runs an **AWS Distro for OpenTelemetry (ADOT) collector sidecar** in the same Fargate task as the gateway. The gateway sends OTLP to `http://localhost:4318` (the ADOT container), which forwards metrics to CloudWatch using **SigV4 via the task role**:

```yaml
telemetry:
  forward_to:
    # No /v1/metrics suffix — the gateway appends the OTLP signal path itself.
    - url: http://localhost:4318
      metrics: true
```

The ADOT sidecar:
- Authenticates to CloudWatch automatically using the ECS task role (needs `cloudwatch:PutMetricData`, already granted in the CDK stack)
- Is marked **non-essential** — if the agent crashes, the gateway continues serving inference traffic
- Requires `CLAUDE_GATEWAY_ALLOW_LOOPBACK=1` on the gateway container (already set) to permit forwarding to a localhost destination

See [`docs/deployment.md`](../../docs/deployment.md#telemetry) for deployment details. This endpoint is metrics-only: logs and traces need a separate setup, so keep them `false` unless you add that separately.

### What gets stamped on each metric

The CLI automatically includes these attributes on every OTLP export, in the OTel
**resource block** (and, by default, mirrored as datapoint labels):
- `user.id`: the OIDC `sub` claim (stable user identifier)
- `user.email`: the user's email from the id_token
- `user.groups`: the user's IdP groups (only when your IdP emits them)
- `identity.source`: `gateway-oidc` on gateway sessions

Placing identity in the resource block is what lets CloudWatch **Coding Agent
Insights** (below) slice usage by developer.

### CloudWatch Coding Agent Insights

When the CloudWatch destination is used, these metrics land in the console's **GenAI
Observability → Coding Agent Insights** dashboards (Claude Code tab) — no dashboards
to build. Out of the box you get **per-user** (`user.email`), **per-model**, and
**per-token-type** breakdowns for adoption and spend.

The dashboards also segment by `team.id`, `department`, `cost_center`, and
`organization`, but the gateway does **not** emit those — they're not part of its
identity stamping. (`user.groups` *is* stamped when your IdP sends it, but it's a
comma-separated string of all groups, not a dashboard grouping dimension, so it doesn't
segment usage on its own.) To populate the team/department segments, push them as
resource attributes via
[`OTEL_RESOURCE_ATTRIBUTES`](https://code.claude.com/docs/en/monitoring-usage) from a
group-scoped managed policy's `env` block:

```yaml
managed:
  policies:
    - match: { groups: [team-payments] }
      cli:
        env:
          OTEL_RESOURCE_ATTRIBUTES: "team.id=payments,department=engineering,cost_center=CC-1234"
```

The CLI stamps those as resource attributes, the gateway relays them verbatim, and
CloudWatch retains them so the by-team/department/cost-center views populate. Values
are static per policy — one policy per group. See
[`docs/deployment.md`](../../docs/deployment.md#cloudwatch-coding-agent-insights) for
the full write-up, and note Coding Agent Insights isn't available in every region
(excludes UAE, Bahrain, Tel Aviv).

### Sensitivity levels

| Signal | Contains | Default |
|--------|----------|---------|
| Metrics | Token counts, request counts, latency, model name | ON (when telemetry configured) |
| Logs | Bash commands, file paths, tool names | OFF (opt-in) |
| Traces | Full tool inputs, detailed execution flow | OFF (opt-in) |

Enable logs and traces only on destinations with appropriate access controls and retention policies.

## How to verify it

### 1. Check the gateway reports telemetry as configured

When the gateway boots with `telemetry.forward_to` set, you should see in the logs:
```
[gateway] ... info telemetry relay: configured
```

Without telemetry:
```
[gateway] ... info telemetry relay: not configured
```

### 2. Verify per-user attribution via spend limits (alternative)

Even without a full OTLP collector, the spend limits `/effective` endpoint proves per-user attribution works:

```bash
curl -s https://<gateway>/v1/organizations/spend_limits/effective \
  -H "x-api-key: <your-admin-key>"
```

This shows per-user spend (token counts priced at list rate), proving the gateway tracks each developer's identity and usage.

### 3. Check pushed environment variables

When telemetry is configured, the gateway pushes these to all connected clients:
- `CLAUDE_CODE_ENABLE_TELEMETRY=1`
- `OTEL_METRICS_EXPORTER=otlp`
- `OTEL_LOGS_EXPORTER=otlp`
- `OTEL_TRACES_EXPORTER=otlp`
- `OTEL_EXPORTER_OTLP_ENDPOINT=<public_url>`

The developer doesn't set any of these manually.

## Key takeaways

- Telemetry is pushed automatically to developers via managed settings (no developer config needed)
- The `/effective` endpoint shows per-user spend with email and identity
- Any OTLP-compatible backend works as a destination
- Each destination independently opts into metrics, logs, and traces
- `user.id`, `user.email`, and `user.groups` are stamped automatically on every export

## Tested result

```
✅ Gateway boots with "telemetry relay: 1 destination(s), signals enabled: metrics,logs"
✅ Gateway rejects loopback OTLP destinations by default (SSRF guard)
✅ CLAUDE_GATEWAY_ALLOW_LOOPBACK=1 overrides for localhost ADOT sidecar forwarding
✅ Per-user attribution proven via /effective endpoint (email, name, spend per period)
✅ ADOT collector sidecar receives OTLP on localhost:4318, forwards to CW via SigV4 (task role)
⚠️ Actual OTLP data flow requires an interactive Claude Code session (CLI sends to gateway, gateway relays to collector)
```
