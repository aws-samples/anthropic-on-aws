# Code Patterns: 1P → CPOA Conversion

## Python

### Before (Anthropic 1P)

```python
from anthropic import Anthropic

client = Anthropic(api_key="sk-ant-api03-...")

response = client.messages.create(
    model="claude-sonnet-5",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Hello"}],
)
```

### After (CPOA — API Key Mode)

```python
from anthropic import AnthropicAWS  # pip install -U "anthropic[aws]"

# API key generated in AWS Console under Claude Platform on AWS → API keys
# Region + workspace from AWS_REGION / ANTHROPIC_AWS_WORKSPACE_ID env vars
client = AnthropicAWS(api_key="<your-cpoa-api-key>")

response = client.messages.create(
    model="claude-sonnet-5",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Hello"}],
)
```

### After (CPOA — SigV4 IAM Mode)

```python
from anthropic import AnthropicAWS  # pip install -U "anthropic[aws]"

# No API key → SigV4 via default AWS credential chain
# (env → ~/.aws → IRSA → ECS → IMDS)
client = AnthropicAWS(aws_region="us-west-2")

response = client.messages.create(
    model="claude-sonnet-5",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Hello"}],
)
```

### After (CPOA — Short-Term Token)

```python
from token_generator_for_aws_external_anthropic import TokenGenerator
from anthropic import AnthropicAWS

# Token defaults to 12h, capped at min(requested, AWS creds expiry, 12h)
token = TokenGenerator(region="us-west-2").get_token()

client = AnthropicAWS(api_key=token, aws_region="us-west-2")

response = client.messages.create(
    model="claude-sonnet-5",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Hello"}],
)
```

## Node.js / TypeScript

### Before (Anthropic 1P)

```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: "sk-ant-api03-..." });

const response = await client.messages.create({
  model: "claude-sonnet-5",
  max_tokens: 1024,
  messages: [{ role: "user", content: "Hello" }],
});
```

### After (CPOA — API Key Mode)

```typescript
import AnthropicAws from "@anthropic-ai/aws-sdk";  // npm install @anthropic-ai/aws-sdk

// API key generated in AWS Console under Claude Platform on AWS → API keys
const client = new AnthropicAws({
  apiKey: "<your-cpoa-api-key>",
  awsRegion: "us-west-2",
});

const response = await client.messages.create({
  model: "claude-sonnet-5",
  max_tokens: 1024,
  messages: [{ role: "user", content: "Hello" }],
});
```

### After (CPOA — SigV4 IAM Mode)

```typescript
import AnthropicAws from "@anthropic-ai/aws-sdk";

// No API key → SigV4 via default AWS credential chain
const client = new AnthropicAws({ awsRegion: "us-west-2" });

const response = await client.messages.create({
  model: "claude-sonnet-5",
  max_tokens: 1024,
  messages: [{ role: "user", content: "Hello" }],
});
```

### After (CPOA — Short-Term Token)

```typescript
import { getTokenProvider } from "@aws/token-generator-for-aws-external-anthropic";
import AnthropicAws from "@anthropic-ai/aws-sdk";

const tokenProvider = getTokenProvider({ region: "us-west-2" });
const token = await tokenProvider();

const client = new AnthropicAws({ apiKey: token, awsRegion: "us-west-2" });

const response = await client.messages.create({
  model: "claude-sonnet-5",
  max_tokens: 1024,
  messages: [{ role: "user", content: "Hello" }],
});
```

## curl

### Before (Anthropic 1P)

```bash
curl -X POST https://api.anthropic.com/v1/messages \
  -H "x-api-key: sk-ant-api03-..." \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-sonnet-5","max_tokens":1024,"messages":[{"role":"user","content":"Hello"}]}'
```

### After (CPOA — API Key Mode)

```bash
curl -X POST https://aws-external-anthropic.us-west-2.api.aws/v1/messages \
  -H "x-api-key: <your-cpoa-api-key>" \
  -H "anthropic-workspace-id: wrkspc_XXXXX" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-sonnet-5","max_tokens":1024,"messages":[{"role":"user","content":"Hello"}]}'
```

### After (CPOA — SigV4 Mode)

```bash
# Uses curl's --aws-sigv4 flag (requires curl 7.75+)
curl -X POST "https://aws-external-anthropic.us-west-2.api.aws/v1/messages" \
  --aws-sigv4 "aws:amz:us-west-2:aws-external-anthropic" \
  --user "$AWS_ACCESS_KEY_ID:$AWS_SECRET_ACCESS_KEY" \
  -H "x-amz-security-token: $AWS_SESSION_TOKEN" \
  -H "anthropic-workspace-id: $ANTHROPIC_AWS_WORKSPACE_ID" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-sonnet-5","max_tokens":1024,"messages":[{"role":"user","content":"Hello"}]}'
```

## Self-Hosted Sandbox Workers

### Before (1P — Environment Key)

```python
import asyncio
import os
from anthropic import AsyncAnthropic
from anthropic.lib.environments import EnvironmentWorker

async def main() -> None:
    environment_key = os.environ["ANTHROPIC_ENVIRONMENT_KEY"]  # sk-ant-oat01-...
    environment_id = os.environ["ANTHROPIC_ENVIRONMENT_ID"]
    async with AsyncAnthropic(auth_token=environment_key) as client:
        await EnvironmentWorker(
            client,
            environment_id=environment_id,
            environment_key=environment_key,
            workdir="/workspace",
        ).run()

asyncio.run(main())
```

### After (CPOA — Worker with IAM Auth)

```python
import asyncio
import os
from anthropic import AsyncAnthropic
from anthropic.lib.environments import EnvironmentWorker

async def main() -> None:
    # On CPOA: no environment key needed — authenticate via IAM
    # Requires AnthropicSelfHostedEnvironmentAccess IAM policy
    environment_id = os.environ["ANTHROPIC_ENVIRONMENT_ID"]
    async with AsyncAnthropic() as client:  # SigV4 via AWS credential chain
        await EnvironmentWorker(
            client,
            environment_id=environment_id,
            workdir="/workspace",
        ).run()

asyncio.run(main())
```

### After (CPOA — Worker with API Key)

```python
import asyncio
import os
from anthropic import AsyncAnthropic
from anthropic.lib.environments import EnvironmentWorker

async def main() -> None:
    # On CPOA: use API key generated in AWS Console
    api_key = os.environ["ANTHROPIC_AWS_API_KEY"]
    environment_id = os.environ["ANTHROPIC_ENVIRONMENT_ID"]
    async with AsyncAnthropic(auth_token=api_key) as client:
        await EnvironmentWorker(
            client,
            environment_id=environment_id,
            workdir="/workspace",
        ).run()

asyncio.run(main())
```

### Session Creation (CPOA)

```python
from anthropic import AnthropicAWS

client = AnthropicAWS(aws_region="us-west-2")

# Create session targeting an agent in a self-hosted environment
session = client.beta.sessions.create(
    agent="agent_XXXXX",
    environment_id="env_XXXXX",
)

# Send user message
client.beta.sessions.events.send(
    session_id=session.id,
    events=[{
        "type": "user.message",
        "content": [{"type": "text", "text": "Analyze the data in /mnt/data/"}],
    }],
)

# Session transitions: idle → running (work queued for worker pickup)
```

## Environment Variables Mapping

| 1P Variable | CPOA Variable | Notes |
|-------------|---------------|-------|
| `ANTHROPIC_API_KEY` | (constructor `api_key`) | CPOA keys generated in AWS Console |
| (none) | `ANTHROPIC_AWS_WORKSPACE_ID` | Required — SDK reads automatically |
| (none) | `AWS_REGION` | Required — no fallback default |
| `ANTHROPIC_BASE_URL` | (handled by SDK) | `AnthropicAWS`/`AnthropicAws` sets it from region |
| `ANTHROPIC_ENVIRONMENT_KEY` | (not used on CPOA) | 1P uses `sk-ant-oat01-...`; CPOA workers use IAM or API key instead |

## Validation Checklist

After conversion, verify:

1. [ ] Using platform SDK client (`AnthropicAWS` / `AnthropicAws`), not base `Anthropic` with manual URL
2. [ ] `AWS_REGION` and `ANTHROPIC_AWS_WORKSPACE_ID` environment variables set
3. [ ] No references to `sk-ant-api03-` or `sk-ant-oat01-` keys (1P credentials)
4. [ ] Outbound web identity federation enabled (`aws iam enable-outbound-web-identity-federation`)
5. [ ] Correct IAM policy: `AnthropicInferenceAccess` for `/v1/messages`, `AnthropicSelfHostedEnvironmentAccess` for workers
6. [ ] `/v1/models` endpoint returns 200 (basic connectivity test)
7. [ ] Short-term token refresh logic in place if using generated tokens (no auto-refresh)
