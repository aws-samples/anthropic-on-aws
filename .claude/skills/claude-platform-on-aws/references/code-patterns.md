# Code Patterns: 1P → CPOA Conversion

## Python

### Before (Anthropic 1P)

```python
from anthropic import Anthropic

client = Anthropic(api_key="sk-ant-api03-...")

response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Hello"}],
)
```

### After (CPOA — API Key Mode)

```python
from anthropic import Anthropic

REGION = "us-west-2"
WORKSPACE_ID = "wrkspc_XXXXX"
API_KEY = "aws-external-anthropic-api-key-..."

client = Anthropic(
    auth_token=API_KEY,
    base_url=f"https://aws-external-anthropic.{REGION}.api.aws",
    default_headers={"anthropic-workspace-id": WORKSPACE_ID},
)

response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Hello"}],
)
```

### After (CPOA — SigV4 IAM Mode)

```python
from anthropic import Anthropic

REGION = "us-west-2"
WORKSPACE_ID = "wrkspc_XXXXX"

client = Anthropic(
    credentials={"type": "aws_iam", "region": REGION},
    base_url=f"https://aws-external-anthropic.{REGION}.api.aws",
    default_headers={"anthropic-workspace-id": WORKSPACE_ID},
)

response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Hello"}],
)
```

## Node.js / TypeScript

### Before (Anthropic 1P)

```javascript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: "sk-ant-api03-..." });

const response = await client.messages.create({
  model: "claude-sonnet-4-6",
  max_tokens: 1024,
  messages: [{ role: "user", content: "Hello" }],
});
```

### After (CPOA — API Key Mode)

```javascript
import Anthropic from "@anthropic-ai/sdk";

const region = "us-west-2";
const workspaceId = "wrkspc_XXXXX";
const apiKey = "aws-external-anthropic-api-key-...";

const client = new Anthropic({
  authToken: apiKey,
  baseURL: `https://aws-external-anthropic.${region}.api.aws`,
  defaultHeaders: { "anthropic-workspace-id": workspaceId },
});

const response = await client.messages.create({
  model: "claude-sonnet-4-6",
  max_tokens: 1024,
  messages: [{ role: "user", content: "Hello" }],
});
```

### After (CPOA — SigV4 IAM Mode)

```javascript
import Anthropic from "@anthropic-ai/sdk";

const region = "us-west-2";
const workspaceId = "wrkspc_XXXXX";

const client = new Anthropic({
  credentials: { type: "aws_iam", region },
  baseURL: `https://aws-external-anthropic.${region}.api.aws`,
  defaultHeaders: { "anthropic-workspace-id": workspaceId },
});

const response = await client.messages.create({
  model: "claude-sonnet-4-6",
  max_tokens: 1024,
  messages: [{ role: "user", content: "Hello" }],
});
```

**Note:** `AnthropicAWS` class is Python-only. In Node.js, always use the standard `Anthropic` class with `authToken` or `credentials`.

## curl

### Before (Anthropic 1P)

```bash
curl -X POST https://api.anthropic.com/v1/messages \
  -H "x-api-key: sk-ant-api03-..." \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-sonnet-4-6","max_tokens":1024,"messages":[{"role":"user","content":"Hello"}]}'
```

### After (CPOA — API Key Mode)

```bash
curl -X POST https://aws-external-anthropic.us-west-2.api.aws/v1/messages \
  -H "Authorization: Bearer aws-external-anthropic-api-key-..." \
  -H "anthropic-workspace-id: wrkspc_XXXXX" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-sonnet-4-6","max_tokens":1024,"messages":[{"role":"user","content":"Hello"}]}'
```

## Managed Agents (Self-Hosted Environments)

### Before (1P — Environment Key)

```python
from anthropic import Anthropic
from anthropic.helpers.beta.environments import WorkPoller

client = Anthropic(api_key="sk-ant-api03-...")
poller = WorkPoller(client, environment_key="sk-ant-env01-...")

for work in poller:
    # process work items
    pass
```

### After (CPOA — Direct Polling)

```python
from anthropic import Anthropic

REGION = "us-west-2"
WORKSPACE_ID = "wrkspc_XXXXX"
API_KEY = "aws-external-anthropic-api-key-..."
ENVIRONMENT_ID = "env_XXXXX"

client = Anthropic(
    auth_token=API_KEY,
    base_url=f"https://aws-external-anthropic.{REGION}.api.aws",
    default_headers={"anthropic-workspace-id": WORKSPACE_ID},
)

# Direct polling (bypasses WorkPoller's environmentKey requirement)
while True:
    work = client.beta.environments.work.poll(
        environment_id=ENVIRONMENT_ID,
        timeout=30,
    )
    if work:
        # process work items
        pass
```

### Session Creation (CPOA)

```python
# Create session targeting an agent
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

# Session transitions: idle → running (work queued for MicroVM pickup)
```

## Environment Variables Mapping

| 1P Variable | CPOA Variable | Notes |
|-------------|---------------|-------|
| `ANTHROPIC_API_KEY` | `ANTHROPIC_AWS_API_KEY` | Prefix: `aws-external-anthropic-api-key-` |
| (none) | `ANTHROPIC_AWS_WORKSPACE_ID` | Required for all CPOA calls |
| (none) | `AWS_REGION` | Region for endpoint URL |
| `ANTHROPIC_BASE_URL` | (derived) | `https://aws-external-anthropic.{region}.api.aws` |
| `ENVIRONMENT_KEY` | (not used) | CPOA doesn't use environment keys |

## Validation Checklist

After conversion, verify:

1. [ ] Base URL uses `aws-external-anthropic.{region}.api.aws`
2. [ ] `anthropic-workspace-id` header present on all requests
3. [ ] API key has `aws-external-anthropic-api-key-` prefix (if using key mode)
4. [ ] No references to `sk-ant-api03-` or `sk-ant-env01-` keys
5. [ ] No `AnthropicAWS` imports in Node.js code
6. [ ] IAM role has `AnthropicSelfHostedEnvironmentAccess` policy (if SigV4 mode)
7. [ ] `/v1/models` endpoint returns 200 (basic connectivity test)
