#!/usr/bin/env bash
# spend-limits.sh — manage Claude apps gateway per-developer spend caps.
#
# Wraps the gateway's Admin API at /v1/organizations/spend_limits, which mirrors
# Anthropic's public Admin API wire shapes.
#   https://code.claude.com/docs/en/claude-apps-gateway-spend-limits
#
# The gateway serves this API only when gateway.yaml has an `admin:` block, and it
# sits behind an INTERNAL load balancer — run this from a host with a private
# network path to the VPC (VPN, Direct Connect, in-VPC).
#
# Auth (first match wins):
#   1. --key / GATEWAY_ADMIN_KEY   → x-api-key      (admin.write_keys = full,
#                                                    admin.read_keys = GET only)
#   2. --token / GATEWAY_BEARER_TOKEN → Bearer      (session JWT whose `groups`
#                                                    claim hits admin.admin_groups)
#   3. the CLI's own gateway JWT from ~/.claude/.credentials.json
#
# Amounts are whole-number strings of USD cents on the wire; this script also
# accepts dollars via --usd and converts with integer math (no float rounding).
#
# Usage: spend-limits.sh <command> [options]     (`--help` for the full list)

set -euo pipefail

# ── Defaults from the environment ────────────────────────────────────────────
GATEWAY="${GATEWAY_URL:-${GW:-}}"
ADMIN_KEY="${GATEWAY_ADMIN_KEY:-}"
BEARER="${GATEWAY_BEARER_TOKEN:-}"
RAW_JSON=0
ASSUME_YES=0
DRY_RUN=0
FETCH_ALL=0

readonly VALID_PERIODS='daily weekly monthly'
readonly VALID_SCOPE_TYPES='organization rbac_group user'

TMP_BODY=""
TMP_HDR=""
# Must always succeed: as the EXIT trap, a non-zero return here would overwrite the
# script's real exit status (an unset TMP_BODY made `--help` exit 1).
cleanup() { [ -n "$TMP_BODY" ] && rm -f "$TMP_BODY"; [ -n "$TMP_HDR" ] && rm -f "$TMP_HDR"; return 0; }
trap cleanup EXIT INT TERM

die() { printf 'error: %s\n' "$*" >&2; exit 1; }
note() { printf '%s\n' "$*" >&2; }

need() { command -v "$1" >/dev/null 2>&1 || die "$1 is required but not installed"; }

# ── Help ─────────────────────────────────────────────────────────────────────
usage() {
  cat <<'EOF'
spend-limits.sh — manage Claude apps gateway spend caps

USAGE
  spend-limits.sh <command> [options]

COMMANDS
  list                       List configured caps
  get <spl_id>               Fetch one cap by id
  set                        Create or replace a cap for {scope, period}
  delete <spl_id>            Delete one cap
  effective                  Resolved cap + period-to-date spend per developer
  audit                      Admin mutation trail (newest first)
  apply -f <file.json>       Declaratively apply an array of caps
  resolve <email>            Print the OIDC sub for an email address

GLOBAL OPTIONS
  -g, --gateway URL   Gateway origin (default: $GATEWAY_URL or $GW)
      --key KEY       x-api-key for the admin API (default: $GATEWAY_ADMIN_KEY)
      --token JWT     Bearer session JWT (default: $GATEWAY_BEARER_TOKEN, else
                      .enterpriseGateway.jwt from the CLI credentials file)
      --json          Emit raw JSON instead of a table
      --all           Follow pagination and fetch every page (list, effective,
                      audit); mutually exclusive with --after/--before/--page
      --dry-run       Print the request that would be sent; send nothing
  -y, --yes           Skip confirmation prompts (destructive ops)
  -h, --help          This help

SCOPE SYNTAX (for `set`)
  --scope organization              the org-wide per-seat default
  --scope rbac_group:<group-id>     one IdP group, as it appears in the
                                    token's `groups` claim (Entra: the
                                    group Object ID GUID)
  --scope user:<oidc-sub>           one developer, by OIDC subject
  --scope email:<address>           one developer, by email. Resolved to their
                                    sub via /effective; only works after that
                                    developer's first request through the
                                    gateway, and requires an exact, unique match

AMOUNT (exactly one, for `set`)
  --usd 50            dollars; accepts cents, e.g. 12.50
  --cents 5000        whole-number USD cents, as the API takes it
  --zero              a zero cap: blocks every request
  --unlimited         no cap (amount: null)

EXAMPLES
  # Org-wide default of $50/month for every developer
  spend-limits.sh set --scope organization --usd 50 --period monthly

  # $100/month per member of a group (per-seat, not a shared pool)
  spend-limits.sh set --scope rbac_group:$P20_GROUP_ID --usd 100 --period monthly

  # Raise one developer above their group cap
  spend-limits.sh set --scope user:$SUB --usd 300 --period monthly

  # Same thing, by email (resolved to their sub for you)
  spend-limits.sh set --scope email:alice@example.com --usd 300 --period monthly

  # Just look up someone's sub
  spend-limits.sh resolve alice@example.com

  # Who is spending the most this month
  spend-limits.sh effective --period monthly --sort spend_desc

  # Find one developer, and audit what changed
  spend-limits.sh effective --q alice@example.com
  spend-limits.sh audit --limit 20

  # Review, then remove a cap
  spend-limits.sh list
  spend-limits.sh delete spl_0123456789

NOTES
  * Caps reset on UTC calendar boundaries: daily 00:00, weekly Monday, monthly
    the 1st. A scope holds one cap per period, and each enforces independently.
  * Effective cap per period resolves: per-user override -> most restrictive of
    the developer's group caps -> org default -> unlimited. admin.group_limit_mode
    = max flips the multi-group tie-break to least-restrictive.
  * `set` is create-or-replace on {scope, period}, so re-running is idempotent.
  * `apply` files carry raw API shapes: a user scope needs the real OIDC sub in
    scope.user_id — the `email:` alias is CLI-only, because resolving an email is
    not deterministic over time and a declarative file should be.
  * --q and --user land in the URL query string, so they appear in load balancer
    and proxy access logs. Both can carry PII. So does `email:` / `resolve`,
    which look up through the same endpoint.
  * A cap is keyed on the OIDC sub, never the email. On Microsoft Entra the sub
    is a hash of the user's ObjectID and your Application ID, so recreating the
    app registration, or deleting and recreating a user, silently orphans their
    per-user cap: they fall through to their group cap, then the org default.
    Renaming a user's email does NOT change it. Prefer rbac_group caps for
    anything standing, and keep user caps as reviewed exceptions.
EOF
}

# ── Auth + transport ─────────────────────────────────────────────────────────
resolve_gateway() {
  [ -n "$GATEWAY" ] || die "no gateway URL: pass --gateway or set GATEWAY_URL"
  case "$GATEWAY" in
    http://*|https://*) ;;
    *) die "gateway URL must start with http:// or https:// (got '$GATEWAY')" ;;
  esac
  GATEWAY="${GATEWAY%/}"   # normalize: no trailing slash
}

# Reads the gateway JWT the CLI stored at `claude /login`. Honors CLAUDE_CONFIG_DIR.
credentials_jwt() {
  local dir="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
  local f="$dir/.credentials.json"
  [ -r "$f" ] || return 1
  jq -r '.enterpriseGateway.jwt // empty' "$f" 2>/dev/null
}

resolve_auth() {
  if [ -n "$ADMIN_KEY" ]; then
    AUTH_HEADER="x-api-key: $ADMIN_KEY"
    AUTH_KIND="x-api-key"
    return
  fi
  if [ -z "$BEARER" ]; then
    BEARER="$(credentials_jwt || true)"
    [ -n "$BEARER" ] && AUTH_SOURCE=" (from the CLI credentials file)"
  fi
  [ -n "$BEARER" ] || die "no credential: pass --key or --token, set GATEWAY_ADMIN_KEY /
GATEWAY_BEARER_TOKEN, or sign in with 'claude /login' through the gateway first"
  AUTH_HEADER="authorization: Bearer $BEARER"
  AUTH_KIND="bearer${AUTH_SOURCE:-}"
}

# api <METHOD> <path> [json_body] — extra query args come from the CURL_Q array.
# Prints the response body on success; on failure surfaces the gateway's error
# envelope ({type:"error", error:{type,message}, request_id}) and exits non-zero.
api() {
  local method="$1" path="$2" body="${3-}"
  local url="$GATEWAY$path"
  # The auth header is read from a 0600 temp file (`-H @file`, curl >= 7.55) so the
  # credential never appears on the curl command line — argv is world-readable via
  # ps / /proc on shared hosts.
  local -a args=(-sS -o "$TMP_BODY" -w '%{http_code}' -X "$method" -H "@$TMP_HDR")

  if [ -n "$body" ]; then
    args+=(-H 'content-type: application/json' --data-binary "$body")
  fi
  # --get moves --data-urlencode pairs into the query string with proper encoding.
  if [ "${#CURL_Q[@]}" -gt 0 ]; then
    [ "$method" = GET ] && args+=(--get)
    args+=("${CURL_Q[@]}")
  fi

  if [ "$DRY_RUN" -eq 1 ]; then
    # Describe the request on stderr and emit NOTHING on stdout, so the caller's
    # renderer (jq / column) simply no-ops and the exit status stays 0.
    printf '%s %s\n' "$method" "$url" >&2
    [ "${#CURL_Q[@]}" -gt 0 ] && printf 'query: %s\n' "${CURL_Q[*]}" >&2
    [ -n "$body" ] && printf 'body: %s\n' "$body" >&2
    printf 'auth: %s\n' "$AUTH_KIND" >&2
    return 0
  fi

  local code
  code="$(curl "${args[@]}" "$url")" || die "curl failed talking to $GATEWAY (network path to the internal ALB?)"

  if [ "$code" -ge 400 ]; then
    local msg rid
    msg="$(jq -r '.error.message // empty' "$TMP_BODY" 2>/dev/null || true)"
    rid="$(jq -r '.request_id // empty' "$TMP_BODY" 2>/dev/null || true)"
    [ -n "$msg" ] || msg="$(cat "$TMP_BODY")"
    case "$code" in
      401|403) msg="$msg
(403 with a bearer means your token's 'groups' claim doesn't match admin.admin_groups;
the gateway logs it as admin.denied reason=bearer_rejected. A bearer also expires
after session.ttl_hours — re-read it and retry.)" ;;
    esac
    die "HTTP $code from $method $path${rid:+ (request_id: $rid)}
$msg"
  fi
  cat "$TMP_BODY"
}

# ── Validation helpers ───────────────────────────────────────────────────────
in_list() {  # in_list <needle> <space-separated haystack>
  local n="$1" h="$2" x
  for x in $h; do [ "$x" = "$n" ] && return 0; done
  return 1
}

# Resolve an email address to its OIDC sub, which is the only user identifier the
# API accepts. Sets RESOLVED_SUB rather than echoing, because `die` inside a
# command substitution would only kill the subshell and return an empty value.
#
# /effective's `q=` is a SUBSTRING match over the sub, last-seen email, and
# last-seen display name, so "bob@x.io" would also match "bobby@x.io". We
# therefore re-filter for an exact, case-insensitive match on the email and
# refuse to act when it still maps to more than one principal.
RESOLVED_SUB=""
resolve_email_to_sub() {  # resolve_email_to_sub <email>  -> sets RESOLVED_SUB
  local email="$1" saved_dry="$DRY_RUN" resp subs count
  # Always perform the lookup, even under --dry-run: it's a read-only GET, and
  # without it the dry-run body would show an empty user_id.
  # limit=1000 (the API max): /effective returns up to three rows per principal
  # (one per period) and q= is a substring match, so the default page of 20 could
  # truncate the candidate set and make the exact-match re-filter miss a real user.
  DRY_RUN=0
  CURL_Q=(--data-urlencode "q=$email" --data-urlencode "limit=1000")
  resp="$(api GET /v1/organizations/spend_limits/effective)"
  DRY_RUN="$saved_dry"
  CURL_Q=()

  subs="$(jq -r --arg e "$email" '
      [ .data[]?
        | select(((.actor.email_address // "") | ascii_downcase) == ($e | ascii_downcase))
        | (.scope.user_id // .user_id // empty) ]
      | unique | .[]' <<<"$resp")"

  count="$(printf '%s\n' "$subs" | grep -c . || true)"
  case "$count" in
    0) die "no principal found for '$email'.
The gateway records an email only after that developer's first request through
it, so a new joiner won't resolve yet. Get their sub from a token issued by your
app registration, or from a session.mint audit event, then pass --scope user:<sub>." ;;
    1) RESOLVED_SUB="$subs" ;;
    *) die "'$email' matches more than one principal:
$subs
Pass --scope user:<sub> to choose one." ;;
  esac
}

validate_period() {
  in_list "$1" "$VALID_PERIODS" || die "invalid --period '$1' (want: ${VALID_PERIODS// /, })"
}

# Dollars -> whole cents using integer math only, so 12.10 can't drift to 1209.
# Validation is a SEPARATE function on purpose: usd_to_cents runs inside a command
# substitution, where `die` would only kill the subshell and leave an empty amount.
readonly USD_RE='^([0-9]+)(\.([0-9]{1,2}))?$'

validate_usd() {
  [[ "$1" =~ $USD_RE ]] \
    || die "invalid --usd '$1' (want dollars, up to 2 decimals, e.g. 50 or 12.50)"
}

usd_to_cents() {
  local v="$1"
  [[ "$v" =~ $USD_RE ]] || return 1
  local whole="${BASH_REMATCH[1]}" frac="${BASH_REMATCH[3]:-}"
  frac="${frac}00"; frac="${frac:0:2}"          # pad: "5" -> "50", "" -> "00"
  printf '%d' "$(( 10#$whole * 100 + 10#$frac ))"
}

validate_cents() {
  [[ "$1" =~ ^[0-9]+$ ]] \
    || die "invalid --cents '$1' (want a whole number of USD cents, e.g. 5000)"
}

# Parse `organization` | `rbac_group:<id>` | `user:<sub>` | `email:<addr>` into
# SCOPE_TYPE/SCOPE_ID. Splits on the FIRST colon only, because an OIDC sub may
# itself contain colons.
parse_scope() {
  local raw="$1"
  local type="${raw%%:*}" id=""
  [ "$type" != "$raw" ] && id="${raw#*:}"

  # `email:` is a convenience alias for `user:`. The API has no email-scoped cap,
  # so resolve it to the sub here and carry on as a user scope.
  if [ "$type" = email ]; then
    [ -n "$id" ] || die "scope 'email' needs an address, e.g. --scope email:alice@example.com"
    resolve_email_to_sub "$id"
    note "resolved $id -> user:$RESOLVED_SUB"
    type=user
    id="$RESOLVED_SUB"
  fi

  in_list "$type" "$VALID_SCOPE_TYPES" \
    || die "invalid scope type '$type' (want: ${VALID_SCOPE_TYPES// /, }, or email)"

  # The API accepts ANY string as user_id without validating it, but enforcement
  # matches on the OIDC sub. Passing an email creates a cap that silently matches
  # nobody. Warn rather than fail, because a few IdPs really do set sub = email.
  if [ "$type" = user ] && [ "${id#*@}" != "$id" ]; then
    note "warning: user_id '$id' looks like an email address."
    note "         Caps match on the OIDC sub, and the API will accept this without"
    note "         complaint. Unless your IdP sets sub to the email verbatim (Entra"
    note "         does not), this cap will match nobody. Use --scope email:$id"
    note "         to resolve it to the real sub."
  fi
  if [ "$type" = organization ]; then
    [ -z "$id" ] || die "scope 'organization' takes no id (got '$id')"
  else
    [ -n "$id" ] || die "scope '$type' needs an id, e.g. --scope $type:<id>"
  fi
  SCOPE_TYPE="$type"; SCOPE_ID="$id"
}

# Build the POST body with jq so values are JSON-escaped rather than interpolated.
build_cap_body() {  # build_cap_body <type> <id> <period> <amount_json>
  jq -n \
    --arg type "$1" --arg id "$2" --arg period "$3" --argjson amount "$4" '
    {
      scope: (
        if   $type == "rbac_group" then { type: $type, rbac_group_id: $id }
        elif $type == "user"       then { type: $type, user_id: $id }
        else { type: $type } end
      ),
      amount: $amount,
      period: $period
    }'
}

# ── Output rendering ─────────────────────────────────────────────────────────
render_limits() {
  if [ "$RAW_JSON" -eq 1 ]; then jq .; return; fi
  jq -r '
    def scope_label:
      .scope.type + (
        (.scope.rbac_group_id // .scope.user_id // "")
        | if . == "" then "" else ":" + . end
      );
    def money:
      if . == null then "unlimited" else "$" + (((. | tonumber) / 100) | tostring) end;
    ["ID","SCOPE","AMOUNT","PERIOD"],
    (.data[] | [ .id, scope_label, (.amount | money), .period ])
    | @tsv' | COLUMNS=500 column -t -s "$(printf '\t')"
}

render_effective() {
  if [ "$RAW_JSON" -eq 1 ]; then jq .; return; fi
  # BOTH amount and period_to_date_spend are USD *cents*. period_to_date_spend
  # carries sub-cent precision ("496.628" = $4.96628), so keep 4 decimals rather
  # than rounding to whole cents. Verified against Bedrock token counts: 151
  # invocations priced at the config's rates come to ~$5, not ~$500.
  jq -r '
    def cents2usd: (. | tonumber) / 100 | (. * 10000 | round) / 10000;
    def money: if . == null then "unlimited" else "$" + (cents2usd | tostring) end;
    ["USER","EMAIL","PERIOD","CAP","SPEND","USED"],
    (.data[] | [
      (.scope.user_id // .user_id // "-"),
      (.actor.email_address // "-"),
      (.period // "-"),
      (.amount | money),
      ("$" + ((.period_to_date_spend // "0") | cents2usd | tostring)),
      (if (.amount == null) or ((.amount | tonumber) == 0) then "-"
       else ((((.period_to_date_spend // "0") | tonumber)
              / (.amount | tonumber) * 1000 | round) / 10 | tostring) + "%" end)
    ]) | @tsv' | COLUMNS=500 column -t -s "$(printf '\t')"
}

render_audit() {
  if [ "$RAW_JSON" -eq 1 ]; then jq .; return; fi
  # COLUMNS=500 on every column(1) call: util-linux column (Linux) budgets table
  # width from $COLUMNS / the tty — 80 when non-interactive — and can silently
  # DROP trailing columns that don't fit (observed: audit's ACTION column lost
  # under SSM/cron). BSD column (macOS) ignores it, so the prefix is harmless there.
  jq -r '
    ["ID","WHEN","ACTOR","ACTION"],
    (.data[] | [
      (.id|tostring),
      (.created_at // "-"),
      (.actor // "-"),
      (.action // .event // "-")
    ]) | @tsv' | COLUMNS=500 column -t -s "$(printf '\t')"
}

# Follow pagination and merge every page's .data into one response object.
# cursor_expr yields the next cursor; cursor_param names the query parameter.
# Follow pagination and merge every page's .data into one response object.
# cursor_jq must yield the NEXT cursor, or empty when finished. Each endpoint
# signals "finished" differently, verified against live responses:
#   list      has_more + last_id   (last_id is present even on the final page,
#                                   so has_more must gate it or we'd loop forever)
#   audit     has_more + data[-1].id
#   effective next_page ONLY  -- it returns NO has_more field, so gating on
#                                has_more would stop after the first page.
paginate() {  # paginate <path> <cursor_param> <cursor_jq>
  local path="$1" cursor_param="$2" cursor_jq="$3"
  # ${arr[@]+"${arr[@]}"} guards against bash 3.2 treating an empty array as unset
  # under `set -u` (macOS ships bash 3.2).
  local -a base_q=(${CURL_Q[@]+"${CURL_Q[@]}"})
  local pages="" page cursor="" guard=0
  while :; do
    CURL_Q=(${base_q[@]+"${base_q[@]}"})
    [ -n "$cursor" ] && CURL_Q+=(--data-urlencode "$cursor_param=$cursor")
    page="$(api GET "$path")"
    pages="$pages$page"
    cursor="$(jq -r "$cursor_jq" <<<"$page")"
    [ -n "$cursor" ] && [ "$cursor" != null ] || break
    guard=$((guard+1))
    [ "$guard" -lt 1000 ] || die "pagination did not terminate after 1000 pages"
  done
  jq -s '{ data: (map(.data // []) | add), has_more: false }' <<<"$pages"
}

# ── Commands ─────────────────────────────────────────────────────────────────
cmd_list() {
  local scope_type="" limit="" after="" before=""
  while [ $# -gt 0 ]; do
    case "$1" in
      --scope-type) scope_type="${2-}"; shift 2 ;;
      --limit)      limit="${2-}";      shift 2 ;;
      --after)      after="${2-}";      shift 2 ;;
      --before)     before="${2-}";     shift 2 ;;
      *) die "list: unknown option '$1'" ;;
    esac
  done
  [ -n "$after" ] && [ -n "$before" ] && die "--after and --before are mutually exclusive"
  if [ "$FETCH_ALL" -eq 1 ] && { [ -n "$after" ] || [ -n "$before" ]; }; then
    die "list: --all follows the cursor itself; drop --after/--before"
  fi
  if [ -n "$scope_type" ]; then
    in_list "$scope_type" "$VALID_SCOPE_TYPES" \
      || die "invalid --scope-type '$scope_type' (want: ${VALID_SCOPE_TYPES// /, })"
    CURL_Q+=(--data-urlencode "scope_type=$scope_type")
  fi
  [ -n "$limit" ]  && CURL_Q+=(--data-urlencode "limit=$limit")
  [ -n "$after" ]  && CURL_Q+=(--data-urlencode "after_id=$after")
  [ -n "$before" ] && CURL_Q+=(--data-urlencode "before_id=$before")

  if [ "$FETCH_ALL" -eq 1 ]; then
    paginate /v1/organizations/spend_limits after_id \
      'if (.has_more // false) then (.last_id // empty) else empty end' | render_limits
  else
    local resp
    resp="$(api GET /v1/organizations/spend_limits)"
    printf '%s' "$resp" | render_limits
    if [ -n "$resp" ] && [ "$RAW_JSON" -eq 0 ] \
       && jq -e '.has_more // false' <<<"$resp" >/dev/null 2>&1; then
      note "(more results — re-run with --all, or page with --after)"
    fi
  fi
}

cmd_get() {
  local id="${1-}"
  [ -n "$id" ] || die "get: need a cap id, e.g. spl_0123456789"
  api GET "/v1/organizations/spend_limits/$id" | jq .
}

cmd_set() {
  local scope="" period="" amount_json="" chose=0
  while [ $# -gt 0 ]; do
    case "$1" in
      --scope)  scope="${2-}";  shift 2 ;;
      --period) period="${2-}"; shift 2 ;;
      --usd)    validate_usd "${2-}"
                amount_json="$(jq -n --arg c "$(usd_to_cents "${2-}")" '$c')"; chose=$((chose+1)); shift 2 ;;
      --cents)  validate_cents "${2-}"; amount_json="$(jq -n --arg c "${2-}" '$c')"; chose=$((chose+1)); shift 2 ;;
      --zero)   amount_json='"0"'; chose=$((chose+1)); shift ;;
      --unlimited) amount_json='null'; chose=$((chose+1)); shift ;;
      *) die "set: unknown option '$1'" ;;
    esac
  done
  [ -n "$scope" ]  || die "set: --scope is required (organization | rbac_group:<id> | user:<sub>)"
  [ -n "$period" ] || die "set: --period is required (${VALID_PERIODS// /, })"
  [ "$chose" -eq 1 ] || die "set: pass exactly one of --usd, --cents, --zero, --unlimited"
  validate_period "$period"
  parse_scope "$scope"

  # Defensive: never let a malformed amount reach the API. The wire format is a
  # whole-number string of USD cents, or null for unlimited.
  [[ "$amount_json" =~ ^(null|\"[0-9]+\")$ ]] \
    || die "internal: refusing to send amount $amount_json (want a cents string or null)"

  local body
  body="$(build_cap_body "$SCOPE_TYPE" "$SCOPE_ID" "$period" "$amount_json")"

  if [ "$amount_json" = '"0"' ] && [ "$ASSUME_YES" -eq 0 ] && [ "$DRY_RUN" -eq 0 ]; then
    note "A zero cap BLOCKS every inference request for this scope."
    confirm "Set a zero $period cap on $scope?"
  fi

  api POST /v1/organizations/spend_limits "$body" | jq .
}

cmd_delete() {
  local id="${1-}"
  [ -n "$id" ] || die "delete: need a cap id, e.g. spl_0123456789"
  if [ "$ASSUME_YES" -eq 0 ] && [ "$DRY_RUN" -eq 0 ]; then
    note "Deleting a cap removes that ceiling; developers fall back to the next"
    note "scope in the resolution order (group -> org default -> unlimited)."
    confirm "Delete cap $id?"
  fi
  api DELETE "/v1/organizations/spend_limits/$id" | jq .
}

cmd_effective() {
  local sort="" q="" limit="" page="" periods=0
  while [ $# -gt 0 ]; do
    case "$1" in
      --period) validate_period "${2-}"; CURL_Q+=(--data-urlencode "period[]=${2-}")
                periods=$((periods+1)); shift 2 ;;
      --user)   CURL_Q+=(--data-urlencode "user_ids[]=${2-}"); shift 2 ;;
      --q)      q="${2-}"; shift 2 ;;
      --sort)   sort="${2-}"; shift 2 ;;
      --limit)  limit="${2-}"; shift 2 ;;
      --page)   page="${2-}"; shift 2 ;;
      *) die "effective: unknown option '$1'" ;;
    esac
  done
  if [ -n "$sort" ]; then
    [ "$sort" = spend_desc ] || die "effective: --sort only accepts 'spend_desc'"
    [ "$periods" -eq 1 ] || die "effective: --sort spend_desc requires exactly one --period"
    CURL_Q+=(--data-urlencode "sort=$sort")
  fi
  if [ "$FETCH_ALL" -eq 1 ] && [ -n "$page" ]; then
    die "effective: --all follows the cursor itself; drop --page"
  fi
  [ -n "$q" ]     && CURL_Q+=(--data-urlencode "q=$q")
  [ -n "$limit" ] && CURL_Q+=(--data-urlencode "limit=$limit")
  [ -n "$page" ]  && CURL_Q+=(--data-urlencode "page=$page")

  if [ "$FETCH_ALL" -eq 1 ]; then
    paginate /v1/organizations/spend_limits/effective page \
      '.next_page // empty' | render_effective
  else
    local resp
    resp="$(api GET /v1/organizations/spend_limits/effective)"
    printf '%s' "$resp" | render_effective
    if [ -n "$resp" ] && [ "$RAW_JSON" -eq 0 ] \
       && [ -n "$(jq -r '.next_page // empty' <<<"$resp" 2>/dev/null)" ]; then
      note "(more results — re-run with --all, or page with --page)"
    fi
  fi
}

cmd_audit() {
  local limit="" after=""
  while [ $# -gt 0 ]; do
    case "$1" in
      --limit) limit="${2-}"; shift 2 ;;
      --after) after="${2-}"; shift 2 ;;
      *) die "audit: unknown option '$1'" ;;
    esac
  done
  if [ "$FETCH_ALL" -eq 1 ] && [ -n "$after" ]; then
    die "audit: --all follows the cursor itself; drop --after"
  fi
  [ -n "$limit" ] && CURL_Q+=(--data-urlencode "limit=$limit")
  [ -n "$after" ] && CURL_Q+=(--data-urlencode "after_id=$after")

  if [ "$FETCH_ALL" -eq 1 ]; then
    paginate /v1/organizations/spend_limits/audit after_id \
      'if (.has_more // false) then (.data[-1].id // empty) else empty end' | render_audit
  else
    local resp
    resp="$(api GET /v1/organizations/spend_limits/audit)"
    printf '%s' "$resp" | render_audit
    if [ -n "$resp" ] && [ "$RAW_JSON" -eq 0 ] \
       && jq -e '.has_more // false' <<<"$resp" >/dev/null 2>&1; then
      note "(more results — re-run with --all, or page with --after)"
    fi
  fi
}

# One entry from the apply file, with any "_"-prefixed key dropped. That lets the
# file carry comments (JSON has none) without sending unknown fields to the API.
apply_entry() {  # apply_entry <file> <index>
  jq -c ".[$2] | with_entries(select(.key | startswith(\"_\") | not))" "$1"
}

# Declarative apply: a JSON array of {scope, amount, period}. POST is
# create-or-replace per {scope, period}, so applying the same file is idempotent.
cmd_apply() {
  local file=""
  while [ $# -gt 0 ]; do
    case "$1" in
      -f|--file) file="${2-}"; shift 2 ;;
      *) die "apply: unknown option '$1'" ;;
    esac
  done
  [ -n "$file" ] || die "apply: -f <file.json> is required"
  [ -r "$file" ] || die "apply: cannot read '$file'"
  jq -e 'type == "array"' "$file" >/dev/null 2>&1 \
    || die "apply: '$file' must contain a JSON array of {scope, amount, period}"

  # Validate every entry before sending any, so a typo can't leave a half-applied set.
  local n i
  n="$(jq 'length' "$file")"
  for (( i=0; i<n; i++ )); do
    local entry type period
    entry="$(apply_entry "$file" "$i")"
    type="$(jq -r '.scope.type // empty' <<<"$entry")"
    period="$(jq -r '.period // empty' <<<"$entry")"
    [ -n "$type" ]   || die "apply: entry $i has no .scope.type"
    [ -n "$period" ] || die "apply: entry $i has no .period"
    in_list "$type" "$VALID_SCOPE_TYPES" || die "apply: entry $i invalid scope.type '$type'"
    validate_period "$period"
    jq -e '.amount == null or (.amount|type == "string" and test("^[0-9]+$"))' <<<"$entry" >/dev/null \
      || die "apply: entry $i .amount must be null or a whole-number string of cents"
  done

  for (( i=0; i<n; i++ )); do
    local entry
    entry="$(apply_entry "$file" "$i")"
    note "applying: $entry"
    CURL_Q=()
    api POST /v1/organizations/spend_limits "$entry" >/dev/null
  done
  note "applied $n cap(s)"
}

cmd_resolve() {
  local email="${1-}"
  [ -n "$email" ] || die "resolve: need an email address, e.g. resolve alice@example.com"
  resolve_email_to_sub "$email"
  if [ "$RAW_JSON" -eq 1 ]; then
    jq -n --arg e "$email" --arg s "$RESOLVED_SUB" '{email:$e, user_id:$s}'
  else
    printf '%s\n' "$RESOLVED_SUB"
  fi
}

confirm() {
  local prompt="$1" reply
  printf '%s [y/N] ' "$prompt" >&2
  read -r reply </dev/tty || die "no tty for confirmation; re-run with --yes"
  case "$reply" in y|Y|yes|YES) ;; *) die "aborted" ;; esac
}

# ── Argument parsing ─────────────────────────────────────────────────────────
main() {
  need curl; need jq

  local -a rest=()
  local cmd=""
  while [ $# -gt 0 ]; do
    case "$1" in
      -h|--help) usage; return 0 ;;
      -g|--gateway) GATEWAY="${2-}"; shift 2 ;;
      --key)   ADMIN_KEY="${2-}"; shift 2 ;;
      --token) BEARER="${2-}";    shift 2 ;;
      --json)  RAW_JSON=1; shift ;;
      --dry-run) DRY_RUN=1; shift ;;
      --all)   FETCH_ALL=1; shift ;;
      -y|--yes) ASSUME_YES=1; shift ;;
      -*) if [ -z "$cmd" ]; then die "unknown global option '$1' (see --help)"; else rest+=("$1"); shift; fi ;;
      *) if [ -z "$cmd" ]; then cmd="$1"; else rest+=("$1"); fi; shift ;;
    esac
  done

  [ -n "$cmd" ] || { usage; return 1; }

  resolve_gateway
  resolve_auth
  TMP_BODY="$(mktemp)"
  TMP_HDR="$(mktemp)"           # mktemp creates 0600 — credential is not in argv
  printf '%s\n' "$AUTH_HEADER" > "$TMP_HDR"
  CURL_Q=()

  case "$cmd" in
    list)      cmd_list      "${rest[@]+"${rest[@]}"}" ;;
    get)       cmd_get       "${rest[@]+"${rest[@]}"}" ;;
    set)       cmd_set       "${rest[@]+"${rest[@]}"}" ;;
    delete|rm) cmd_delete    "${rest[@]+"${rest[@]}"}" ;;
    effective) cmd_effective "${rest[@]+"${rest[@]}"}" ;;
    audit)     cmd_audit     "${rest[@]+"${rest[@]}"}" ;;
    apply)     cmd_apply     "${rest[@]+"${rest[@]}"}" ;;
    resolve)   cmd_resolve   "${rest[@]+"${rest[@]}"}" ;;
    help)      usage ;;
    *) die "unknown command '$cmd' (see --help)" ;;
  esac
}

main "$@"
