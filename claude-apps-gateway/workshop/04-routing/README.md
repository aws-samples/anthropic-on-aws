# Module 4: Routing (Amazon Bedrock and Claude Platform on AWS)

## What it is

The gateway holds the upstream credential and routes inference to Amazon Bedrock or Claude Platform on AWS on behalf of developers. It translates between the Anthropic Messages API (what Claude Code speaks) and the provider's API. Developers never call the provider directly. You can configure multiple upstreams for failover across regions or accounts.

## What the customer gets

- Single credential: one IAM role (or API key) on the gateway, not one per developer
- Protocol translation: Claude Code speaks Anthropic format, gateway handles provider differences
- Multi-region failover: if one region returns 5xx or 429, the gateway tries the next
- Cross-account routing: different upstreams can use different AWS accounts
- Provider flexibility: switch between Amazon Bedrock and Claude Platform on AWS with a config change
- Transparent to developers: changing regions or providers requires only a config change

## How to configure it

### Amazon Bedrock (single region)

```yaml
upstreams:
  - provider: bedrock
    region: us-east-1
    auth: {}              # Uses ECS task role / IRSA / instance profile

auto_include_builtin_models: true
```

`auth: {}` means the gateway uses the AWS default credential chain. In production this is the ECS task role or EKS IRSA. For local testing, it uses `~/.aws/credentials` or environment variables.

### Claude Platform on AWS

```yaml
upstreams:
  - provider: anthropicAws
    region: us-east-1
    workspace_id: wrkspc_01ABCDEFGHIJKLMN
    auth:
      api_key: ${ANTHROPIC_AWS_API_KEY}
    # OR use IAM role (SigV4):
    # auth: {}

auto_include_builtin_models: true
```

`workspace_id` is required and sent as the `anthropic-workspace-id` header on every request. Model IDs use the standard Anthropic format (claude-sonnet-4-6), not Bedrock ARNs.

### Multi-region failover (Bedrock)

```yaml
upstreams:
  - name: bedrock-primary
    provider: bedrock
    region: us-east-1
    auth: {}

  - name: bedrock-secondary
    provider: bedrock
    region: us-west-2
    auth: {}
```

The gateway tries upstreams in order. It fails over on 5xx, 429 (rate limit), and timeouts. It does NOT fail over on 4xx (client errors like invalid model).

### Cross-account with provisioned throughput

```yaml
upstreams:
  - name: bedrock-pt
    provider: bedrock
    region: us-east-1
    auth: {}

  - name: bedrock-od
    provider: bedrock
    region: us-east-1
    auth:
      aws_access_key_id: ${ACCT2_AKID}
      aws_secret_access_key: ${ACCT2_SK}

models:
  - id: claude-opus-4-8
    label: Claude Opus 4.8
    upstream_model:
      bedrock-pt: arn:aws:bedrock:us-east-1:111111111111:provisioned-model/abcdef
      bedrock-od: us.anthropic.claude-opus-4-8
```

### IAM permissions required (Bedrock)

The gateway's IAM principal needs:

```json
{
  "Effect": "Allow",
  "Action": [
    "bedrock:InvokeModel",
    "bedrock:InvokeModelWithResponseStream"
  ],
  "Resource": [
    "arn:aws:bedrock:<region>:<account>:inference-profile/us.anthropic.*",
    "arn:aws:bedrock:*::foundation-model/anthropic.*"
  ]
}
```

For Claude Platform on AWS, the IAM principal needs the `aws-external-anthropic` actions documented in the IAM action reference, or use an API key instead.

## How to verify it

### 1. Send a request through the gateway

```bash
curl -s https://<gateway>/v1/messages \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -H "anthropic-version: 2023-06-01" \
  -d '{"model":"claude-haiku-4-5","max_tokens":10,"messages":[{"role":"user","content":"Say hello"}]}'
```

Expected output:
```json
{
  "model": "claude-haiku-4-5-20251001",
  "type": "message",
  "content": [{"type": "text", "text": "Hello!"}],
  "usage": {"input_tokens": 9, "output_tokens": 4}
}
```

Note: the response `model` field shows the Bedrock model ID, confirming it went through Bedrock.

### 2. Test with different models

```bash
# Haiku (fastest, cheapest)
curl -s https://<gateway>/v1/messages \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -H "anthropic-version: 2023-06-01" \
  -d '{"model":"claude-haiku-4-5","max_tokens":10,"messages":[{"role":"user","content":"Say ok"}]}'

# Sonnet
curl -s https://<gateway>/v1/messages \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -H "anthropic-version: 2023-06-01" \
  -d '{"model":"claude-sonnet-4-6","max_tokens":10,"messages":[{"role":"user","content":"Say ok"}]}'
```

### 3. Test model that doesn't exist

```bash
curl -s https://<gateway>/v1/messages \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -H "anthropic-version: 2023-06-01" \
  -d '{"model":"fake-model-xyz","max_tokens":10,"messages":[{"role":"user","content":"Say ok"}]}'
```

Expected output:
```json
{"type":"error","error":{"type":"invalid_request_error","message":"model fake-model-xyz is not in the operator's model allowlist"}}
```

## Key takeaways

- Claude Code speaks Anthropic API format; the gateway translates to the provider format
- Failover between regions is automatic on 5xx/429/timeout
- Developers hold a bearer token, not AWS SigV4 credentials
- The `upstreams` list supports multi-region and cross-account routing
- Switching from Amazon Bedrock to Claude Platform on AWS is a config change; developers notice nothing

## Tested result

```
✅ Haiku inference through gateway to Bedrock: responded "ok"
✅ Sonnet inference through gateway to Bedrock: responded "ok"
✅ Sonnet inference through gateway to Claude Platform on AWS: responded "Hello!"
✅ Unknown model rejected: "not in the operator's model allowlist"
✅ Gateway translates Anthropic format to provider format transparently
```
