# Module 3: Telemetry (Per-User Usage Attribution)

## What it is

The gateway relays OpenTelemetry Protocol (OTLP) metrics from Claude Code to a collector you configure. Each export is stamped with the developer's identity (user ID, email, IdP groups), giving you per-user cost and usage breakdowns with no developer-side configuration.

## What the customer gets

- Per-user usage breakdowns: who used which models, how many tokens, at what latency
- Identity stamping: automatic, no developer-side setup
- Any OTLP backend: works with any OpenTelemetry-compatible collector
- Sensitivity control: metrics (safe) vs logs/traces (sensitive, opt-in)
- Data stays under customer control: telemetry goes to their collector, never to Anthropic

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

### CloudWatch OTLP (AWS-native)

Amazon CloudWatch now supports native OTLP metrics ingestion. To send gateway telemetry to CloudWatch, you need an OTLP collector (such as the AWS Distro for OpenTelemetry) running in your VPC that forwards to CloudWatch. The collector authenticates to CloudWatch using its IAM role.

Example collector setup (ADOT running as ECS sidecar or separate service):
```yaml
# ADOT collector config
receivers:
  otlp:
    protocols:
      http:
        endpoint: 0.0.0.0:4318

exporters:
  awsemf:
    namespace: ClaudeGateway
    region: us-east-1

service:
  pipelines:
    metrics:
      receivers: [otlp]
      exporters: [awsemf]
```

Then point the gateway at the collector:
```yaml
telemetry:
  forward_to:
    - url: https://adot-collector.internal.company.com:4318
      metrics: true
```

### What gets stamped on each metric

The CLI automatically includes these attributes on every OTLP export:
- `user.id`: the OIDC `sub` claim (stable user identifier)
- `user.email`: the user's email from the id_token
- `user.groups`: the user's IdP groups

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
✅ CLAUDE_GATEWAY_ALLOW_LOOPBACK=1 overrides for local development
✅ Per-user attribution proven via /effective endpoint (email, name, spend per period)
✅ CloudWatch integration documented (via ADOT collector pattern)
⚠️ Actual OTLP data flow requires an interactive Claude Code session (CLI sends to gateway, gateway relays to collector)
```
