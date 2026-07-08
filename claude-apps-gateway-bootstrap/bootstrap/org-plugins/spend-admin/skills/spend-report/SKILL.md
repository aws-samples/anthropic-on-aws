---
name: spend-report
description: Generate the organization's Claude usage & spend report as an interactive artifact. Use when an admin asks for the spend report, usage report, quota status, or who is spending what.
---

# Claude Usage & Spend Report

Produce the standard admin report over per-user Claude spend, using the **spend-admin** MCP
server. The report is ALWAYS rendered as a single interactive React artifact.

## Data collection (do this first, in parallel where possible)

1. `spend___get_spend` with no arguments — every user, all three periods (daily/weekly/monthly),
   each row carrying `spend_usd`, `cap_usd`, and `cap_utilization_pct`.
2. `spend___get_caps` — the configured caps (user / group / organization scopes).
3. `spend___get_blocked_users` with default `warn_pct` (80) — who is blocked, who is in the
   warning band.

Numbers are USD. `cap_usd: null` means unlimited (render as "—", never as 0).
The spend figures are the gateway's list-price estimates used for quota enforcement — a
circuit-breaker view, not the AWS invoice. Say so in the report footnote.

## Report layout (one React artifact, in this order)

Title: **"Claude Usage & Spend Report"** with today's date and a subtitle
"per-user spend vs caps · gateway enforcement view".

1. **Status banner** — if `get_blocked_users` returned anyone:
   - blocked users (≥100% of a cap): red banner, "BLOCKED — will receive 429 until the period
     resets or the cap is raised", listing user + period + cap.
   - warning-band users (80–99%): amber banner, "approaching cap".
   - nobody in either: a single green line "All users within quota."
2. **Top spenders (daily)** — horizontal bar chart, highest first, spend in USD, the user's
   daily cap drawn as a reference line on each bar where one exists.
3. **Cap utilization** — one horizontal progress bar per user/period that has a cap:
   green &lt;60%, amber 60–90%, red &gt;90%, with a tick mark at 80% labelled "alarm threshold".
4. **Detail table** — every user × period: spend, cap ("—" if unlimited), utilization %.
   Sort by daily spend descending.
5. **Footnote** — "Spend = gateway meter at USD list price (enforcement view); reconcile
   against AWS billing for invoices. Caps managed via scripts/07-quota.sh or the gateway
   admin API."

## Style

Clean admin-dashboard look: neutral background, no gradients, tabular numerals for amounts,
currency to 2 decimals (4 for values under $0.01). Recharts (or inline SVG bars) is fine.
Fit on one screen where possible; the detail table may scroll.

## Guardrails

- Read-only: this skill NEVER changes caps. If asked to raise/lower/block, explain that cap
  changes are performed by an administrator via `scripts/07-quota.sh set <sub> <usd> [period]`
  (or the gateway admin API) and offer the exact command instead.
- If a tool call fails with an auth error, tell the admin to open the spend-admin connector
  and complete the Cognito sign-in, then retry.
