#!/usr/bin/env bash
#
# Render the k8s manifest templates with your values and apply them.
#
#   ./deploy.sh            # render + kubectl apply all manifests
#   ./deploy.sh --dry-run  # render + kubectl apply --dry-run=client (no changes)
#   ./deploy.sh --diff     # render + kubectl diff (show what would change)
#   ./deploy.sh --render   # just print the rendered manifests to stdout
#
# Values come from ./deploy.env (gitignored). Copy deploy.env.example to
# deploy.env and fill it in first. Requires `envsubst` (brew install gettext).
set -euo pipefail
cd "$(dirname "$0")"

ENV_FILE="deploy.env"
# Templates to render, in apply order.
TEMPLATES=(
  "k8s/otel-collector.template.yaml"
  "k8s/deployment.template.yaml"
  "k8s/ingress.template.yaml"
)
# Explicit allow-list: only these ${VARS} are substituted, so any other
# shell-like syntax in the YAML is left untouched.
VARS='${AWS_ACCOUNT_ID} ${AWS_REGION} ${OTEL_HOST} ${ACM_CERT_ARN} ${ALB_SUBNETS} ${ALB_LOGS_BUCKET} ${ALB_PRIVATE_IP} ${GATEWAY_IMAGE_TAG}'

command -v envsubst >/dev/null || { echo "envsubst not found — 'brew install gettext'"; exit 1; }
[ -f "$ENV_FILE" ] || { echo "$ENV_FILE not found — copy deploy.env.example to $ENV_FILE and fill it in"; exit 1; }

# Load values into the environment so envsubst can see them.
set -a && . "./$ENV_FILE" && set +a

# Fail loudly if any required variable is unset/empty.
: "${AWS_ACCOUNT_ID:?set in $ENV_FILE}" "${AWS_REGION:?set in $ENV_FILE}" \
  "${OTEL_HOST:?set in $ENV_FILE}" "${ACM_CERT_ARN:?set in $ENV_FILE}" \
  "${ALB_SUBNETS:?set in $ENV_FILE}" "${ALB_LOGS_BUCKET:?set in $ENV_FILE}" \
  "${ALB_PRIVATE_IP:?set in $ENV_FILE}" "${GATEWAY_IMAGE_TAG:?set in $ENV_FILE}"

mode="${1:-apply}"
for t in "${TEMPLATES[@]}"; do
  [ -f "$t" ] || { echo "template not found: $t"; exit 1; }
  rendered="$(envsubst "$VARS" < "$t")"

  # Guard against typos: no ${...} should survive substitution.
  if grep -q '\${' <<<"$rendered"; then
    echo "⚠️  unresolved \${VARS} in $t — check $ENV_FILE:"
    grep -n '\${' <<<"$rendered"
    exit 1
  fi

  case "$mode" in
    --render)  printf '%s\n---\n' "$rendered" ;;
    --dry-run) echo "== dry-run $t =="; kubectl apply --dry-run=client -f - <<<"$rendered" ;;
    --diff)    echo "== diff $t ==";    kubectl diff -f - <<<"$rendered" || true ;;
    apply)     echo "== apply $t ==";   kubectl apply -f - <<<"$rendered" ;;
    *) echo "unknown option: $mode (use --dry-run, --diff, --render, or no arg)"; exit 1 ;;
  esac
done
