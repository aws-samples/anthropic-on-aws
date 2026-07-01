# Claude Apps Gateway Workshop

Hands-on modules covering each of the gateway's five core capabilities. Each module is self-contained: read it, configure it, verify it.

## Modules

| Module | Capability | Time |
|--------|-----------|------|
| [01 - Identity](01-identity/README.md) | SSO authentication via OIDC | 20 min |
| [02 - Policy](02-policy/README.md) | Model access and managed settings by group | 20 min |
| [03 - Telemetry](03-telemetry/README.md) | Per-user usage attribution via OTLP | 20 min |
| [04 - Routing](04-routing/README.md) | Amazon Bedrock inference with multi-region failover | 15 min |
| [05 - Spend Caps](05-spend-caps/README.md) | Per-user/group budget enforcement | 15 min |

## Prerequisites

- A running Claude apps gateway (see the [CDK deployment](../cdk/README.md) or run locally)
- A valid gateway session token (sign in via `claude /login` or the device flow)
- `curl` and `python3` for verification commands

## Structure of each module

Each module follows the same format:

1. **What it is** — plain English explanation
2. **What the customer gets** — the business value
3. **How to configure it** — the `gateway.yaml` section with comments
4. **How to verify it** — curl commands with expected output
5. **Key takeaways** — what to remember about this capability
