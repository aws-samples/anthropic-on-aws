# Module 5: Spend Caps (Budget Enforcement)

## What it is

The gateway can set daily, weekly, or monthly spend limits per user, group, or organization. When a developer exceeds their cap, the gateway returns 429 and blocks further inference requests until the period resets or an admin raises the limit. Spend is estimated from token counts at USD list price.

## What the customer gets

- Circuit breaker: prevent one runaway agent from spending the entire commitment
- Per-user visibility: see who is spending how much, per day/week/month
- Group caps: different budgets for different teams (engineers vs. contractors)
- Custom messaging: tell blocked developers where to request a higher limit
- Fail-safe: if Postgres is down, enforcement fails open by default (inference continues)

## How to configure it

### Enable the admin API in gateway.yaml

```yaml
admin:
  write_keys:
    - { id: terraform, key: "${GATEWAY_ADMIN_WRITE_KEY}" }
  read_keys:
    - { id: reporting, key: "${GATEWAY_ADMIN_READ_KEY}" }
  blocked_message: "Contact platform-team@company.com to request a higher limit."
```

Key requirements:
- Keys must be at least 32 characters
- Each key has an `id` that appears in the audit log for attribution
- `blocked_message` is appended to the 429 error the developer sees

### Set caps via the admin API (not in YAML)

Caps are managed dynamically via HTTP, not in the config file. This means you can change them without redeploying.

## How to verify it

### 1. List existing caps (should be empty initially)

```bash
curl -s https://<gateway>/v1/organizations/spend_limits \
  -H "x-api-key: <your-admin-write-key>"
```

Expected output:
```json
{"data":[],"has_more":false,"first_id":null,"last_id":null}
```

### 2. Set an org-wide cap ($5/month per developer)

```bash
curl -s -X POST https://<gateway>/v1/organizations/spend_limits \
  -H "x-api-key: <your-admin-write-key>" \
  -H "Content-Type: application/json" \
  -d '{"scope":{"type":"organization"},"amount":"500","period":"monthly"}'
```

Expected output:
```json
{
  "type": "spend_limit",
  "id": "spl_...",
  "scope": {"type": "organization"},
  "amount": "500",
  "currency": "USD",
  "period": "monthly"
}
```

Amount is in **USD cents**: 500 = $5.00, 50000 = $500.00.

### 3. Set a zero daily cap (to test blocking)

```bash
curl -s -X POST https://<gateway>/v1/organizations/spend_limits \
  -H "x-api-key: <your-admin-write-key>" \
  -H "Content-Type: application/json" \
  -d '{"scope":{"type":"organization"},"amount":"0","period":"daily"}'
```

### 4. Verify blocking works

```bash
curl -s https://<gateway>/v1/messages \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -H "anthropic-version: 2023-06-01" \
  -d '{"model":"claude-haiku-4-5","max_tokens":10,"messages":[{"role":"user","content":"Hi"}]}'
```

Expected output (blocked):
```json
{"type":"error","error":{"type":"billing_error","message":"spend limit reached — Contact platform-team@company.com to request a higher limit."}}
```

### 5. Delete the zero cap (unblock)

```bash
curl -s -X DELETE https://<gateway>/v1/organizations/spend_limits/<spl_id> \
  -H "x-api-key: <your-admin-write-key>"
```

Expected output:
```json
{"type":"spend_limit_deleted","id":"spl_..."}
```

### 6. Check per-user spend attribution

```bash
curl -s https://<gateway>/v1/organizations/spend_limits/effective \
  -H "x-api-key: <your-admin-write-key>"
```

Expected output (shows each user's spend):
```json
{
  "data": [{
    "scope": {"type": "user", "user_id": "google-oauth2|..."},
    "actor": {
      "name": "John Doe",
      "email_address": "john@company.com"
    },
    "amount": "500",
    "period": "monthly",
    "period_to_date_spend": "0.003"
  }]
}
```

### 7. Set a group cap (optional)

```bash
curl -s -X POST https://<gateway>/v1/organizations/spend_limits \
  -H "x-api-key: <your-admin-write-key>" \
  -H "Content-Type: application/json" \
  -d '{"scope":{"type":"rbac_group","rbac_group_id":"contractors"},"amount":"10000","period":"daily"}'
```

## Scope precedence

Per period, a developer's effective cap resolves in this order:
1. Per-user override (if set)
2. Most restrictive of their group caps (default) or least restrictive (`group_limit_mode: max`)
3. Organization default
4. Unlimited (no cap)

## Key takeaways

- Caps are set dynamically via the admin API (no config redeployment needed)
- A zero cap blocks all inference with a custom message
- The `/effective` endpoint shows per-user spend breakdown by period
- Deleting a cap immediately unblocks requests
- This is a circuit breaker, not billing. Reconcile against the provider usage reporting for actual costs.

## Tested result

```
✅ Admin API accepts API key authentication
✅ Org-wide cap created: $5/month
✅ Zero daily cap blocks inference with custom message: "spend limit reached — Contact..."
✅ Cap deletion unblocks requests
✅ /effective shows per-user spend attribution (email, name, groups, period_to_date_spend)
✅ Amounts in USD cents, periods: daily/weekly/monthly
```
