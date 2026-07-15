#!/usr/bin/env bash
# setup.sh — deploy the Claude apps gateway on AWS ECS Fargate, end to end, with
# Amazon Bedrock as the upstream. Idempotent (describe-before-create): safe to
# re-run; existing resources are reused, not duplicated.
#
# This is a WORKED EXAMPLE for customer-managed infrastructure, not a supported
# production artifact. It optimises for clarity and clean teardown; see the README
# "Productionising" checklist before you rely on it.
#
# The CDK app under cdk/ provisions the SAME Fargate deployment a second way; the
# two are kept in sync.
#
# ── Two-pass deploy ───────────────────────────────────────────────────────────
# `public_url` drives the gateway's OIDC redirect_uri and discovery doc, and the
# config is baked into the image (see gateway.yaml.template's header). Because we bring our own Route 53
# zone and pick the record name, PUBLIC_URL is KNOWN before anything is created
# (it's claude-gateway.<ZONE_NAME>), so there is no "deploy to learn the URL" pass.
# The only ordering constraint is image-before-service. A single run handles it:
# the image is built and pushed (phase 3) before the service is created (phase 6).
# Re-run any time to roll a new image.
#
# ── Prerequisites you must satisfy out of band ────────────────────────────────
#     * Bedrock MODEL ACCESS enabled for each Claude model you list in
#     gateway.yaml's managed.policies.availableModels. The gateway uses GLOBAL
#     inference profiles (global.anthropic.*), which route to any commercial region,
#     so enable access in your source region (and any region global may route to).
#     This is a console/account-level step IAM cannot grant; missing it yields
#     AccessDeniedException on invoke even when IAM is correct. (#1 Bedrock failure.)
#   * TLS: an imported ACM cert for PUBLIC_URL's hostname (set CERT_ARN). On first
#     /login the CLI pins its SHA-256 fingerprint and prompts to confirm it (intended
#     behavior). To skip the prompt, use a PUBLIC ACM cert - DNS validation needs no
#     public endpoint, so the ALB stays internal. See the "TLS: bring an ACM cert"
#     section of cdk/README.md.
#   * A Route 53 hosted zone (ZONE_ID/ZONE_NAME) for the gateway A-record — public
#     or private; see the two topologies in docs/deployment.md prerequisite 3 —
#     plus a network path + private-DNS resolution from developer laptops to the
#     internal ALB (VPN/DX/TGW). See docs/connectivity.md - the #1 "internal ALB
#     doesn't work from my laptop" failure.
#   * The OIDC client's redirect URI <PUBLIC_URL>/oauth/callback registered.

set -euo pipefail

# The docker build context (Dockerfile, gateway.yaml.template) lives one level up
# from this script, in cdk/. Run everything from there so the script works from
# any CWD and its artifacts (claude binary, stamped gateway.yaml) land in one place.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}/.."

# ──────────────────────────────────────────────────────────────────────────────
# Helpers (defined before configuration so tests can source them in isolation —
# see the SETUP_SH_LIB_ONLY gate below).
# ──────────────────────────────────────────────────────────────────────────────
log()  { printf '\n\033[1;34m==>\033[0m %s\n' "$*"; }
info() { printf '    %s\n' "$*"; }
skip() { printf '    \033[2m(exists)\033[0m %s\n' "$*"; }
die()  { printf '\n\033[1;31mERROR:\033[0m %s\n' "$*" >&2; exit 1; }

aws_q() { aws "$@" --output text --region "${AWS_REGION}" 2>/dev/null; }

sha_of() {
  if command -v sha256sum >/dev/null 2>&1; then sha256sum "$1" | awk '{print $1}';
  else shasum -a 256 "$1" | awk '{print $1}'; fi
}

# resolve_container_tool — honor CONTAINER_TOOL if set (and fail if it isn't on
# PATH), else the first of docker/podman/finch found. podman/finch build the
# linux/amd64 image via their VM's emulation fine (verified live — gotchas §13).
resolve_container_tool() {
  if [[ -n "${CONTAINER_TOOL:-}" ]]; then
    command -v "${CONTAINER_TOOL}" >/dev/null 2>&1 || return 1
    echo "${CONTAINER_TOOL}"
    return 0
  fi
  local t
  for t in docker podman finch; do
    if command -v "$t" >/dev/null 2>&1; then echo "$t"; return 0; fi
  done
  return 1
}

# container_build_extra_flags — --provenance=false is buildx-only (it stops
# buildx emitting an OCI image index that some runtimes reject). podman/finch
# emit a plain image by default and REJECT the flag, so pass it to docker only.
container_build_extra_flags() {
  if [[ "$1" == "docker" ]]; then echo "--provenance=false"; fi
}

# preflight_oidc_secret — fail fast in phase 0 rather than after the ~9-minute
# RDS wait: the deploy needs the real OIDC client secret, either exported as
# OIDC_CLIENT_SECRET (phase 4 seeds Secrets Manager from it) or already present
# in Secrets Manager with a non-placeholder value.
preflight_oidc_secret() {
  [[ -n "${OIDC_CLIENT_SECRET:-}" ]] && return 0
  local current
  current="$(aws_q secretsmanager get-secret-value --secret-id "${OIDC_SECRET_NAME}" --query SecretString || true)"
  if [[ -z "${current}" || "${current}" == "None" ]]; then
    die "OIDC client secret not provided. Either re-run with OIDC_CLIENT_SECRET='<your-oidc-client-secret>' exported
    (seeded straight into Secrets Manager, never baked into the image), or create the secret first:
    aws secretsmanager create-secret --name ${OIDC_SECRET_NAME} --secret-string '<your-oidc-client-secret>' --region ${AWS_REGION}"
  elif [[ "${current}" == "REPLACE_ME" ]]; then
    die "OIDC client secret is still the REPLACE_ME placeholder. Either re-run with OIDC_CLIENT_SECRET exported, or set it:
    aws secretsmanager put-secret-value --secret-id ${OIDC_SECRET_NAME} --secret-string '<your-oidc-client-secret>' --region ${AWS_REGION}"
  fi
}

# Test hook: `SETUP_SH_LIB_ONLY=1 source setup.sh` loads only the helpers above
# (see test/setup-helpers.test.sh) — no env requirements, no AWS calls.
# shellcheck disable=SC2317  # the exit is the executed-not-sourced fallback
if [[ "${SETUP_SH_LIB_ONLY:-}" == "1" ]]; then return 0 2>/dev/null || exit 0; fi

# ──────────────────────────────────────────────────────────────────────────────
# Configuration — env vars with defaults (mirrors the GCP example's convention).
# ──────────────────────────────────────────────────────────────────────────────
AWS_REGION="${AWS_REGION:-us-east-1}"
PROJECT="${PROJECT:-claude-gateway}"

# Pin the Claude Code version. Drives BOTH the download URL and the image tag, so
# the artifact is self-describing. The gateway subcommand floor is 2.1.195; the
# version must also be >= the newest managed-settings key you use (we ship a live
# managed.policies block). 2.1.198 added 404-failover across upstreams and the
# anthropicAws (Claude Platform on AWS) provider, both referenced in
# gateway.yaml.template; keep this >= 2.1.198 if you rely on either. See the README
# "Version coupling" note.
CLAUDE_VERSION="${CLAUDE_VERSION:-2.1.199}"
RELEASES_URL="${RELEASES_URL:-https://downloads.claude.ai/claude-code-releases}"
KEYS_URL="${KEYS_URL:-https://downloads.claude.ai/keys/claude-code.asc}"
# Anthropic Claude Code release signing key fingerprint (verify the imported key).
GPG_FINGERPRINT="${GPG_FINGERPRINT:-31DDDE24DDFAB679F42D7BD2BAA929FF1A7ECACE}"
# Optional out-of-band SHA256 to cross-check the manifest's value against.
CLAUDE_SHA256="${CLAUDE_SHA256:-}"
CLAUDE_BINARY="${CLAUDE_BINARY:-./claude}"

ECR_REPO="${ECR_REPO:-${PROJECT}}"
IMAGE_TAG="${IMAGE_TAG:-${CLAUDE_VERSION}}"

DB_INSTANCE="${DB_INSTANCE:-${PROJECT}-db}"
DB_NAME="${DB_NAME:-claude_gateway}"
DB_INSTANCE_CLASS="${DB_INSTANCE_CLASS:-db.t4g.micro}"
DB_ENGINE_VERSION="${DB_ENGINE_VERSION:-16}"

CLUSTER="${CLUSTER:-${PROJECT}}"
SERVICE="${SERVICE:-${PROJECT}}"
DESIRED_COUNT="${DESIRED_COUNT:-2}"
LOG_GROUP="${LOG_GROUP:-/claude-gateway/gateway}"
LOG_RETENTION_DAYS="${LOG_RETENTION_DAYS:-90}"
GATEWAY_LOG_LEVEL="${GATEWAY_LOG_LEVEL:-info}"

# Telemetry: an ADOT collector sidecar in the gateway task receives OTLP on
# localhost:4318 and forwards metrics to CloudWatch's native OTLP endpoint using
# SigV4 via the task role — no bearer token or API key to manage or rotate. See
# docs/deployment.md "Telemetry". The public ECR image for the collector:
ADOT_IMAGE="${ADOT_IMAGE:-public.ecr.aws/aws-observability/aws-otel-collector:latest}"

# Required inputs (no safe default — fail loudly). See header.
PUBLIC_URL="${PUBLIC_URL:?required: the internal ALB https origin, e.g. https://claude-gateway.example.com}"
OIDC_ISSUER="${OIDC_ISSUER:?required: OIDC discovery base, e.g. https://example.okta.com}"
OIDC_CLIENT_ID="${OIDC_CLIENT_ID:?required: OAuth client id}"
# Optional: the OIDC client secret. If set, phase 4 seeds/updates the Secrets
# Manager secret from it (the value goes straight to the Secrets Manager API —
# never baked into the image, logged, or written to disk). If unset, the secret
# must already exist with a real value; preflight fails fast otherwise.
OIDC_CLIENT_SECRET="${OIDC_CLIENT_SECRET:-}"
JWT_SECRET_NAME="${PROJECT}-jwt-secret"
OIDC_SECRET_NAME="${PROJECT}-oidc-client-secret"
ALLOWED_EMAIL_DOMAINS="${ALLOWED_EMAIL_DOMAINS:?required: comma-separated, e.g. example.com}"
# Imported ACM cert for PUBLIC_URL's hostname. The CLI pins its SHA-256 fingerprint
# on first /login; use a PUBLIC ACM cert to skip the prompt (see the header).
CERT_ARN="${CERT_ARN:?required: ACM cert ARN for the PUBLIC_URL hostname}"
ZONE_ID="${ZONE_ID:?required: Route 53 hosted zone id for the gateway A-record (public or private; see deployment.md prereq 3)}"
ZONE_NAME="${ZONE_NAME:?required: Route 53 zone name, e.g. example.com}"
# The VPN/corp CLIENT CIDR developer traffic arrives from — NOT the VPC CIDR.
# A wrong guess is either wide-open or fully-closed, so we refuse to default it.
INGRESS_CIDR="${INGRESS_CIDR:?required: the VPN/corp client CIDR developers connect from}"

# ──────────────────────────────────────────────────────────────────────────────
# Phase 0 — Preflight
# ──────────────────────────────────────────────────────────────────────────────
log "Phase 0: preflight"
for bin in aws jq openssl gpg curl; do
  command -v "$bin" >/dev/null 2>&1 || die "required tool not found on PATH: $bin"
done
CTR="$(resolve_container_tool)" \
  || die "no container tool found: need docker, podman, or finch on PATH (or set CONTAINER_TOOL to yours)"
info "container tool: ${CTR}"
ACCOUNT_ID="${ACCOUNT_ID:-$(aws_q sts get-caller-identity --query Account)}"
[[ -n "${ACCOUNT_ID}" && "${ACCOUNT_ID}" != "None" ]] || die "could not resolve AWS account id - is the aws CLI authenticated?"
info "account ${ACCOUNT_ID}, region ${AWS_REGION}"
info "TLS: imported cert ${CERT_ARN}"
info "caller $(aws_q sts get-caller-identity --query Arn)"
# Fail fast on the OIDC client secret BEFORE the slow phases (RDS alone is ~9 min).
preflight_oidc_secret
REGISTRY="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
IMAGE_URI="${REGISTRY}/${ECR_REPO}:${IMAGE_TAG}"

# ──────────────────────────────────────────────────────────────────────────────
# Phase 1 — ECR
# ──────────────────────────────────────────────────────────────────────────────
log "Phase 1: ECR repository"
if aws_q ecr describe-repositories --repository-names "${ECR_REPO}" >/dev/null; then
  skip "ecr repo ${ECR_REPO}"
else
  aws ecr create-repository --repository-name "${ECR_REPO}" \
    --image-scanning-configuration scanOnPush=true \
    --region "${AWS_REGION}" >/dev/null
  info "created ecr repo ${ECR_REPO}"
fi
info "${CTR} login to ${REGISTRY}"
aws ecr get-login-password --region "${AWS_REGION}" \
  | "${CTR}" login --username AWS --password-stdin "${REGISTRY}" >/dev/null

# ──────────────────────────────────────────────────────────────────────────────
# Phase 2 — Image: stamp config, download + verify binary, build, push
# ──────────────────────────────────────────────────────────────────────────────
log "Phase 2: build and push image ${IMAGE_URI}"

if aws_q ecr describe-images --repository-name "${ECR_REPO}" \
     --image-ids imageTag="${IMAGE_TAG}" >/dev/null; then
  skip "image tag ${IMAGE_TAG} already in ECR — re-run with a new IMAGE_TAG to rebuild"
else
  # 2a. Stamp gateway.yaml from the committed template.
  info "stamping gateway.yaml from template"
  PUBLIC_URL="${PUBLIC_URL}" AWS_REGION="${AWS_REGION}" \
  OIDC_ISSUER="${OIDC_ISSUER}" OIDC_CLIENT_ID="${OIDC_CLIENT_ID}" \
  ALLOWED_EMAIL_DOMAINS="${ALLOWED_EMAIL_DOMAINS}" \
  DB_NAME="${DB_NAME}" \
  "${SCRIPT_DIR}/stamp-config.sh"

  # 2b. Import + verify the GPG signing key.
  info "importing Claude Code release signing key"
  curl -fsSL "${KEYS_URL}" | gpg --import 2>/dev/null || die "failed to import signing key"
  if ! gpg --fingerprint security@anthropic.com 2>/dev/null \
        | tr -d ' ' | grep -qi "${GPG_FINGERPRINT}"; then
    die "imported GPG key fingerprint does not match expected ${GPG_FINGERPRINT}"
  fi
  info "signing key fingerprint verified"

  # 2c. Download manifest + detached signature, verify signature.
  tmpdir="$(mktemp -d)"
  trap 'rm -rf "${tmpdir}"' EXIT INT TERM
  curl -fsSL -o "${tmpdir}/manifest.json"     "${RELEASES_URL}/${CLAUDE_VERSION}/manifest.json"     || die "manifest.json download failed for ${CLAUDE_VERSION}"
  curl -fsSL -o "${tmpdir}/manifest.json.sig" "${RELEASES_URL}/${CLAUDE_VERSION}/manifest.json.sig" || die "manifest.json.sig download failed (manifest signatures exist for 2.1.89+)"
  gpg --verify "${tmpdir}/manifest.json.sig" "${tmpdir}/manifest.json" 2>/dev/null \
    || die "manifest signature verification FAILED — do not trust this artifact"
  info "manifest signature verified (Good signature)"

  # 2d. Read the linux-x64 checksum from the signed manifest.
  expected_sha="$(jq -r '.platforms["linux-x64"].checksum' "${tmpdir}/manifest.json")"
  [[ "${expected_sha}" =~ ^[a-f0-9]{64}$ ]] || die "could not read linux-x64 checksum from manifest"
  if [[ -n "${CLAUDE_SHA256}" && "${CLAUDE_SHA256}" != "${expected_sha}" ]]; then
    die "out-of-band CLAUDE_SHA256 (${CLAUDE_SHA256}) != manifest checksum (${expected_sha})"
  fi

  # 2e. Download the binary (skip if a matching one is already staged), verify SHA.
  if [[ -f "${CLAUDE_BINARY}" && "$(sha_of "${CLAUDE_BINARY}")" == "${expected_sha}" ]]; then
    skip "binary ${CLAUDE_BINARY} already present and matches"
  else
    info "downloading linux-x64 claude ${CLAUDE_VERSION}"
    # trap-clean a partial download so a failed run never leaves a truncated binary.
    trap 'rm -f "${CLAUDE_BINARY}"; rm -rf "${tmpdir}"' EXIT INT TERM
    curl -fL -o "${CLAUDE_BINARY}" "${RELEASES_URL}/${CLAUDE_VERSION}/linux-x64/claude" \
      || die "binary download failed"
    actual_sha="$(sha_of "${CLAUDE_BINARY}")"
    [[ "${actual_sha}" == "${expected_sha}" ]] \
      || die "SHA256 mismatch: got ${actual_sha}, expected ${expected_sha}"
  fi
  info "binary SHA256 verified against signed manifest"
  trap - EXIT INT TERM
  rm -rf "${tmpdir}"

  # 2f. Build (amd64; docker additionally gets --provenance=false so buildx emits
  #     a plain image, not an OCI index some runtimes reject) and push.
  BUILD_FLAGS="$(container_build_extra_flags "${CTR}")"
  info "${CTR} build --platform=linux/amd64 ${BUILD_FLAGS}"
  # shellcheck disable=SC2086  # BUILD_FLAGS is intentionally word-split (empty for podman/finch)
  "${CTR}" build --platform=linux/amd64 ${BUILD_FLAGS} -t "${IMAGE_URI}" .
  "${CTR}" push "${IMAGE_URI}"
  info "pushed ${IMAGE_URI}"
fi

# ──────────────────────────────────────────────────────────────────────────────
# Phase 3 — Network, VPC endpoints, RDS
# ──────────────────────────────────────────────────────────────────────────────
log "Phase 3: network, VPC endpoints, RDS"

# 3a. VPC (reuse VPC_ID if supplied; else find/create one tagged for this project).
if [[ -n "${VPC_ID:-}" ]]; then
  info "using supplied VPC_ID ${VPC_ID}"
else
  VPC_ID="$(aws_q ec2 describe-vpcs \
    --filters "Name=tag:Project,Values=${PROJECT}" \
    --query 'Vpcs[0].VpcId')"
  if [[ -z "${VPC_ID}" || "${VPC_ID}" == "None" ]]; then
    VPC_ID="$(aws_q ec2 create-vpc --cidr-block 10.20.0.0/16 \
      --query Vpc.VpcId)"
    aws ec2 modify-vpc-attribute --vpc-id "${VPC_ID}" --enable-dns-hostnames --region "${AWS_REGION}"
    aws ec2 modify-vpc-attribute --vpc-id "${VPC_ID}" --enable-dns-support --region "${AWS_REGION}"
    aws ec2 create-tags --resources "${VPC_ID}" --region "${AWS_REGION}" \
      --tags "Key=Project,Value=${PROJECT}" "Key=Name,Value=${PROJECT}-vpc" >/dev/null
    info "created VPC ${VPC_ID} (10.20.0.0/16)"
  else
    skip "VPC ${VPC_ID}"
  fi
fi
# 3b. Two AZs; a public subnet (NAT + ALB) and a private subnet (tasks + RDS) each.
# The backticks below are JMESPath literal syntax inside --query, not shell expansion.
# (Avoid `mapfile`/`readarray` — bash 4+ only; macOS ships bash 3.2. Read into an
# array portably instead.)
AZS=()
# shellcheck disable=SC2016
while IFS= read -r _az; do [[ -n "${_az}" ]] && AZS+=("${_az}"); done < <(
  aws_q ec2 describe-availability-zones \
    --query 'AvailabilityZones[?State==`available`].ZoneName' | tr '\t' '\n' | head -2)
[[ "${#AZS[@]}" -ge 2 ]] || die "need at least 2 available AZs in ${AWS_REGION}"

# subnet helper: ensure a subnet with a given Name tag + CIDR + AZ exists; echo id.
ensure_subnet() {
  local name="$1" cidr="$2" az="$3" id
  id="$(aws_q ec2 describe-subnets \
    --filters "Name=tag:Name,Values=${name}" "Name=vpc-id,Values=${VPC_ID}" \
    --query 'Subnets[0].SubnetId')"
  if [[ -z "${id}" || "${id}" == "None" ]]; then
    id="$(aws_q ec2 create-subnet --vpc-id "${VPC_ID}" --cidr-block "${cidr}" \
      --availability-zone "${az}" --query Subnet.SubnetId)"
    aws ec2 create-tags --resources "${id}" --region "${AWS_REGION}" \
      --tags "Key=Name,Value=${name}" "Key=Project,Value=${PROJECT}" >/dev/null
  fi
  echo "${id}"
}
PUB_SUBNET_A="$(ensure_subnet "${PROJECT}-public-a"  10.20.0.0/24 "${AZS[0]}")"
PUB_SUBNET_B="$(ensure_subnet "${PROJECT}-public-b"  10.20.1.0/24 "${AZS[1]}")"
PRI_SUBNET_A="$(ensure_subnet "${PROJECT}-private-a" 10.20.10.0/24 "${AZS[0]}")"
PRI_SUBNET_B="$(ensure_subnet "${PROJECT}-private-b" 10.20.11.0/24 "${AZS[1]}")"
info "public subnets: ${PUB_SUBNET_A}, ${PUB_SUBNET_B}"
info "private subnets: ${PRI_SUBNET_A}, ${PRI_SUBNET_B}"

# 3c. Internet gateway + public route table (for NAT egress to the IdP).
IGW_ID="$(aws_q ec2 describe-internet-gateways \
  --filters "Name=attachment.vpc-id,Values=${VPC_ID}" \
  --query 'InternetGateways[0].InternetGatewayId')"
if [[ -z "${IGW_ID}" || "${IGW_ID}" == "None" ]]; then
  IGW_ID="$(aws_q ec2 create-internet-gateway --query InternetGateway.InternetGatewayId)"
  aws ec2 attach-internet-gateway --internet-gateway-id "${IGW_ID}" --vpc-id "${VPC_ID}" --region "${AWS_REGION}"
  aws ec2 create-tags --resources "${IGW_ID}" --region "${AWS_REGION}" \
    --tags "Key=Project,Value=${PROJECT}" >/dev/null
  info "created + attached IGW ${IGW_ID}"
else
  skip "IGW ${IGW_ID}"
fi

# NAT gateway in public subnet A — the ONLY public-internet leg, kept for OIDC
# issuer discovery + sign-in (a public HTTPS endpoint). All AWS-service traffic
# uses the VPC endpoints below, never the internet.
NAT_ID="$(aws_q ec2 describe-nat-gateways \
  --filter "Name=subnet-id,Values=${PUB_SUBNET_A}" "Name=state,Values=available,pending" \
  --query 'NatGateways[0].NatGatewayId')"
if [[ -z "${NAT_ID}" || "${NAT_ID}" == "None" ]]; then
  EIP_ALLOC="$(aws_q ec2 allocate-address --domain vpc --query AllocationId)"
  NAT_ID="$(aws_q ec2 create-nat-gateway --subnet-id "${PUB_SUBNET_A}" \
    --allocation-id "${EIP_ALLOC}" --query NatGateway.NatGatewayId)"
  aws ec2 create-tags --resources "${NAT_ID}" --region "${AWS_REGION}" \
    --tags "Key=Project,Value=${PROJECT}" >/dev/null
  info "creating NAT gateway ${NAT_ID} (waiting for available)…"
  aws ec2 wait nat-gateway-available --nat-gateway-ids "${NAT_ID}" --region "${AWS_REGION}"
else
  skip "NAT gateway ${NAT_ID}"
fi

# route table helper.
ensure_rt() {
  local name="$1" id
  id="$(aws_q ec2 describe-route-tables \
    --filters "Name=tag:Name,Values=${name}" "Name=vpc-id,Values=${VPC_ID}" \
    --query 'RouteTables[0].RouteTableId')"
  if [[ -z "${id}" || "${id}" == "None" ]]; then
    id="$(aws_q ec2 create-route-table --vpc-id "${VPC_ID}" --query RouteTable.RouteTableId)"
    aws ec2 create-tags --resources "${id}" --region "${AWS_REGION}" \
      --tags "Key=Name,Value=${name}" "Key=Project,Value=${PROJECT}" >/dev/null
  fi
  echo "${id}"
}
PUB_RT="$(ensure_rt "${PROJECT}-public-rt")"
PRI_RT="$(ensure_rt "${PROJECT}-private-rt")"
# Routes are create-or-replace (idempotent). 2>/dev/null||replace handles re-runs.
aws ec2 create-route --route-table-id "${PUB_RT}" --destination-cidr-block 0.0.0.0/0 \
  --gateway-id "${IGW_ID}" --region "${AWS_REGION}" >/dev/null 2>&1 \
  || aws ec2 replace-route --route-table-id "${PUB_RT}" --destination-cidr-block 0.0.0.0/0 \
       --gateway-id "${IGW_ID}" --region "${AWS_REGION}" >/dev/null
aws ec2 create-route --route-table-id "${PRI_RT}" --destination-cidr-block 0.0.0.0/0 \
  --nat-gateway-id "${NAT_ID}" --region "${AWS_REGION}" >/dev/null 2>&1 \
  || aws ec2 replace-route --route-table-id "${PRI_RT}" --destination-cidr-block 0.0.0.0/0 \
       --nat-gateway-id "${NAT_ID}" --region "${AWS_REGION}" >/dev/null
for s in "${PUB_SUBNET_A}" "${PUB_SUBNET_B}"; do
  aws ec2 associate-route-table --route-table-id "${PUB_RT}" --subnet-id "${s}" --region "${AWS_REGION}" >/dev/null 2>&1 || true
done
for s in "${PRI_SUBNET_A}" "${PRI_SUBNET_B}"; do
  aws ec2 associate-route-table --route-table-id "${PRI_RT}" --subnet-id "${s}" --region "${AWS_REGION}" >/dev/null 2>&1 || true
done

# 3d. Three-tier security groups. CAUTION: this is exactly where hand-rolled scripts
# leak an over-open 0.0.0.0/0:5432 — RDS ingress is from the TASK SG ONLY, never a CIDR.
ensure_sg() {
  local name="$1" desc="$2" id
  id="$(aws_q ec2 describe-security-groups \
    --filters "Name=group-name,Values=${name}" "Name=vpc-id,Values=${VPC_ID}" \
    --query 'SecurityGroups[0].GroupId')"
  if [[ -z "${id}" || "${id}" == "None" ]]; then
    id="$(aws_q ec2 create-security-group --group-name "${name}" \
      --description "${desc}" --vpc-id "${VPC_ID}" --query GroupId)"
    aws ec2 create-tags --resources "${id}" --region "${AWS_REGION}" \
      --tags "Key=Project,Value=${PROJECT}" >/dev/null
  fi
  echo "${id}"
}
ALB_SG="$(ensure_sg "${PROJECT}-alb-sg"  "ALB: 443 from client CIDR")"
TASK_SG="$(ensure_sg "${PROJECT}-task-sg" "Gateway tasks: 8080 from ALB only")"
RDS_SG="$(ensure_sg "${PROJECT}-rds-sg"  "RDS: 5432 from task SG only")"
VPCE_SG="$(ensure_sg "${PROJECT}-vpce-sg" "VPC endpoints: 443 from task SG")"

# authorize helper: add a rule, tolerating "already exists".
sg_ingress_cidr() { aws ec2 authorize-security-group-ingress --group-id "$1" \
  --protocol tcp --port "$2" --cidr "$3" --region "${AWS_REGION}" >/dev/null 2>&1 || true; }
sg_ingress_sg()   { aws ec2 authorize-security-group-ingress --group-id "$1" \
  --protocol tcp --port "$2" --source-group "$3" --region "${AWS_REGION}" >/dev/null 2>&1 || true; }

sg_ingress_cidr "${ALB_SG}"  443   "${INGRESS_CIDR}"  # developers → ALB (sign-in)
sg_ingress_sg   "${TASK_SG}" 8080  "${ALB_SG}"        # ALB → tasks
sg_ingress_sg   "${RDS_SG}"  5432  "${TASK_SG}"       # tasks → RDS (NOT a CIDR)
sg_ingress_sg   "${VPCE_SG}" 443   "${TASK_SG}"       # gateway tasks → VPC endpoints
info "security groups: alb=${ALB_SG} task=${TASK_SG} rds=${RDS_SG} vpce=${VPCE_SG}"

# 3e. Interface VPC endpoints (AWS-backbone, no internet) + S3 gateway endpoint.
PRIVATE_SUBNETS="${PRI_SUBNET_A} ${PRI_SUBNET_B}"
ensure_interface_endpoint() {
  local svc="$1" sname="com.amazonaws.${AWS_REGION}.$1" existing
  existing="$(aws_q ec2 describe-vpc-endpoints \
    --filters "Name=vpc-id,Values=${VPC_ID}" "Name=service-name,Values=${sname}" \
    --query 'VpcEndpoints[0].VpcEndpointId')"
  if [[ -n "${existing}" && "${existing}" != "None" ]]; then skip "vpc endpoint ${svc}"; return; fi
  # shellcheck disable=SC2086
  aws ec2 create-vpc-endpoint --vpc-id "${VPC_ID}" --vpc-endpoint-type Interface \
    --service-name "${sname}" --subnet-ids ${PRIVATE_SUBNETS} \
    --security-group-ids "${VPCE_SG}" --private-dns-enabled \
    --region "${AWS_REGION}" >/dev/null
  info "created vpc endpoint ${svc}"
}
for svc in bedrock-runtime secretsmanager ecr.api ecr.dkr logs monitoring; do
  ensure_interface_endpoint "${svc}"
done
# S3 gateway endpoint — ECR layer pulls go to S3.
if [[ "$(aws_q ec2 describe-vpc-endpoints \
      --filters "Name=vpc-id,Values=${VPC_ID}" "Name=service-name,Values=com.amazonaws.${AWS_REGION}.s3" \
      --query 'VpcEndpoints[0].VpcEndpointId')" =~ ^vpce- ]]; then
  skip "vpc endpoint s3 (gateway)"
else
  aws ec2 create-vpc-endpoint --vpc-id "${VPC_ID}" --vpc-endpoint-type Gateway \
    --service-name "com.amazonaws.${AWS_REGION}.s3" --route-table-ids "${PRI_RT}" \
    --region "${AWS_REGION}" >/dev/null
  info "created vpc endpoint s3 (gateway)"
fi

# 3f. RDS PostgreSQL — private subnets, not publicly accessible, encrypted,
# RDS-managed master secret. EXAMPLE posture: easy teardown (see Productionising).
DB_SUBNET_GROUP="${PROJECT}-db-subnets"
if aws_q rds describe-db-subnet-groups --db-subnet-group-name "${DB_SUBNET_GROUP}" >/dev/null; then
  skip "db subnet group ${DB_SUBNET_GROUP}"
else
  aws rds create-db-subnet-group --db-subnet-group-name "${DB_SUBNET_GROUP}" \
    --db-subnet-group-description "${PROJECT} private subnets" \
    --subnet-ids "${PRI_SUBNET_A}" "${PRI_SUBNET_B}" --region "${AWS_REGION}" >/dev/null
  info "created db subnet group ${DB_SUBNET_GROUP}"
fi
if aws_q rds describe-db-instances --db-instance-identifier "${DB_INSTANCE}" >/dev/null; then
  skip "rds instance ${DB_INSTANCE}"
else
  info "creating RDS Postgres ${DB_ENGINE_VERSION} (${DB_INSTANCE_CLASS}); this takes several minutes…"
  aws rds create-db-instance \
    --db-instance-identifier "${DB_INSTANCE}" \
    --engine postgres --engine-version "${DB_ENGINE_VERSION}" \
    --db-instance-class "${DB_INSTANCE_CLASS}" \
    --allocated-storage 20 --storage-type gp3 --storage-encrypted \
    --db-name "${DB_NAME}" \
    --master-username gateway \
    --manage-master-user-password \
    --no-publicly-accessible \
    --no-multi-az \
    --no-deletion-protection \
    --backup-retention-period 1 \
    --db-subnet-group-name "${DB_SUBNET_GROUP}" \
    --vpc-security-group-ids "${RDS_SG}" \
    --region "${AWS_REGION}" >/dev/null
  aws rds wait db-instance-available --db-instance-identifier "${DB_INSTANCE}" --region "${AWS_REGION}"
fi
DB_HOST="$(aws_q rds describe-db-instances --db-instance-identifier "${DB_INSTANCE}" \
  --query 'DBInstances[0].Endpoint.Address')"
DB_SECRET_ARN="$(aws_q rds describe-db-instances --db-instance-identifier "${DB_INSTANCE}" \
  --query 'DBInstances[0].MasterUserSecret.SecretArn')"
[[ -n "${DB_HOST}" && "${DB_HOST}" != "None" ]] || die "could not resolve RDS endpoint"
info "RDS endpoint ${DB_HOST}"
info "RDS master secret ${DB_SECRET_ARN}"

# ──────────────────────────────────────────────────────────────────────────────
# Phase 4 — Secrets Manager (gateway-owned secrets; DB creds come from RDS secret)
# ──────────────────────────────────────────────────────────────────────────────
log "Phase 4: secrets"

if aws_q secretsmanager describe-secret --secret-id "${JWT_SECRET_NAME}" >/dev/null; then
  skip "secret ${JWT_SECRET_NAME}"
else
  aws secretsmanager create-secret --name "${JWT_SECRET_NAME}" \
    --description "Claude gateway JWT signing secret (>=32 bytes)" \
    --secret-string "$(openssl rand -base64 32)" --region "${AWS_REGION}" >/dev/null
  info "created ${JWT_SECRET_NAME} (openssl rand -base64 32)"
fi
JWT_SECRET_ARN="$(aws_q secretsmanager describe-secret --secret-id "${JWT_SECRET_NAME}" --query ARN)"

if aws_q secretsmanager describe-secret --secret-id "${OIDC_SECRET_NAME}" >/dev/null; then
  if [[ -n "${OIDC_CLIENT_SECRET}" ]] && [[ "$(aws_q secretsmanager get-secret-value \
       --secret-id "${OIDC_SECRET_NAME}" --query SecretString)" != "${OIDC_CLIENT_SECRET}" ]]; then
    aws secretsmanager put-secret-value --secret-id "${OIDC_SECRET_NAME}" \
      --secret-string "${OIDC_CLIENT_SECRET}" --region "${AWS_REGION}" >/dev/null
    info "updated ${OIDC_SECRET_NAME} from OIDC_CLIENT_SECRET"
  else
    skip "secret ${OIDC_SECRET_NAME}"
  fi
else
  # Seeded from OIDC_CLIENT_SECRET when exported; otherwise a placeholder (the
  # guard below and the phase-0 preflight both refuse to deploy with it unset).
  aws secretsmanager create-secret --name "${OIDC_SECRET_NAME}" \
    --description "Claude gateway OIDC client secret" \
    --secret-string "${OIDC_CLIENT_SECRET:-REPLACE_ME}" --region "${AWS_REGION}" >/dev/null
  if [[ -n "${OIDC_CLIENT_SECRET}" ]]; then
    info "created ${OIDC_SECRET_NAME} (seeded from OIDC_CLIENT_SECRET)"
  else
    info "created ${OIDC_SECRET_NAME} (placeholder REPLACE_ME — set the real value!)"
  fi
fi
OIDC_SECRET_ARN="$(aws_q secretsmanager describe-secret --secret-id "${OIDC_SECRET_NAME}" --query ARN)"

# Guard (belt-and-braces behind the phase-0 preflight): refuse to deploy with the
# OIDC secret still a placeholder.
if [[ "$(aws_q secretsmanager get-secret-value --secret-id "${OIDC_SECRET_NAME}" --query SecretString)" == "REPLACE_ME" ]]; then
  die "OIDC client secret is still the REPLACE_ME placeholder. Set it, then re-run:
    aws secretsmanager put-secret-value --secret-id ${OIDC_SECRET_NAME} --secret-string '<your-oidc-client-secret>' --region ${AWS_REGION}"
fi

# Telemetry needs no secret: the ADOT sidecar authenticates to CloudWatch with
# SigV4 via the task role (see phase 5b), so there is no bearer token to seed here.

# ──────────────────────────────────────────────────────────────────────────────
# Phase 5 — IAM roles + CloudWatch log group
# ──────────────────────────────────────────────────────────────────────────────
log "Phase 5: IAM roles and log group"

if aws_q logs describe-log-groups --log-group-name-prefix "${LOG_GROUP}" \
     --query "logGroups[?logGroupName=='${LOG_GROUP}'].logGroupName" | grep -q .; then
  skip "log group ${LOG_GROUP}"
else
  aws logs create-log-group --log-group-name "${LOG_GROUP}" --region "${AWS_REGION}" >/dev/null
  aws logs put-retention-policy --log-group-name "${LOG_GROUP}" \
    --retention-in-days "${LOG_RETENTION_DAYS}" --region "${AWS_REGION}" >/dev/null
  info "created log group ${LOG_GROUP} (${LOG_RETENTION_DAYS}d retention)"
fi

ECS_TRUST='{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"ecs-tasks.amazonaws.com"},"Action":"sts:AssumeRole"}]}'
ensure_role() {
  local name="$1"
  if aws iam get-role --role-name "${name}" >/dev/null 2>&1; then skip "iam role ${name}";
  else
    aws iam create-role --role-name "${name}" \
      --assume-role-policy-document "${ECS_TRUST}" \
      --tags "Key=Project,Value=${PROJECT}" >/dev/null
    info "created iam role ${name}"
  fi
}

# 5a. Execution role — ECR pull, log writes, and reading the two gateway secrets +
# the RDS master secret (needed to inject secrets: env vars into the container).
EXEC_ROLE="${PROJECT}-exec-role"
ensure_role "${EXEC_ROLE}"
aws iam attach-role-policy --role-name "${EXEC_ROLE}" \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy >/dev/null 2>&1 || true
EXEC_SECRETS_POLICY=$(cat <<JSON
{"Version":"2012-10-17","Statement":[
  {"Effect":"Allow","Action":["secretsmanager:GetSecretValue"],
   "Resource":["${JWT_SECRET_ARN}","${OIDC_SECRET_ARN}","${DB_SECRET_ARN}"]},
  {"Effect":"Allow","Action":["logs:CreateLogStream","logs:PutLogEvents"],
   "Resource":"arn:aws:logs:${AWS_REGION}:${ACCOUNT_ID}:log-group:${LOG_GROUP}:*"}
]}
JSON
)
aws iam put-role-policy --role-name "${EXEC_ROLE}" \
  --policy-name "${PROJECT}-exec-secrets" --policy-document "${EXEC_SECRETS_POLICY}" >/dev/null
EXEC_ROLE_ARN="$(aws iam get-role --role-name "${EXEC_ROLE}" --query Role.Arn --output text)"

# 5b. Task role — the gateway's runtime identity. Dual-ARN Bedrock policy: BOTH
# inference-profile (global.anthropic.*) AND foundation-model (anthropic.*) ARNs, or
# invoke 403s. Matches gateway.yaml.template's global.anthropic.* model catalog, so
# any region works. auth: {} in gateway.yaml picks this up via the ECS creds endpoint.
# Also grants cloudwatch:PutMetricData so the ADOT sidecar can push OTLP metrics
# to CloudWatch via SigV4 (PutMetricData takes no resource scope, hence "*").
TASK_ROLE="${PROJECT}-task-role"
ensure_role "${TASK_ROLE}"
BEDROCK_POLICY=$(cat <<JSON
{"Version":"2012-10-17","Statement":[
  {"Effect":"Allow",
   "Action":["bedrock:InvokeModel","bedrock:InvokeModelWithResponseStream"],
   "Resource":[
     "arn:aws:bedrock:${AWS_REGION}:${ACCOUNT_ID}:inference-profile/global.anthropic.*",
     "arn:aws:bedrock:*::foundation-model/anthropic.*"
   ]},
  {"Effect":"Allow",
   "Action":["cloudwatch:PutMetricData"],
   "Resource":["*"]}
]}
JSON
)
aws iam put-role-policy --role-name "${TASK_ROLE}" \
  --policy-name "${PROJECT}-bedrock-invoke" --policy-document "${BEDROCK_POLICY}" >/dev/null
TASK_ROLE_ARN="$(aws iam get-role --role-name "${TASK_ROLE}" --query Role.Arn --output text)"
info "exec=${EXEC_ROLE_ARN}"
info "task=${TASK_ROLE_ARN}"

# ──────────────────────────────────────────────────────────────────────────────
# Phase 6 — ECS cluster, ALB, gateway service (with ADOT telemetry sidecar)
# ──────────────────────────────────────────────────────────────────────────────
log "Phase 6: ECS cluster, ALB, services"

if aws_q ecs describe-clusters --clusters "${CLUSTER}" \
     --query "clusters[?status=='ACTIVE'].clusterName" | grep -q .; then
  skip "ecs cluster ${CLUSTER}"
else
  aws ecs create-cluster --cluster-name "${CLUSTER}" \
    --capacity-providers FARGATE --region "${AWS_REGION}" >/dev/null
  info "created ecs cluster ${CLUSTER}"
fi

# 6a. Internal IPv4 ALB. IPv4-only on purpose: internal dual-stack ALBs return
# public-range AAAA records that /login rejects.
# describe-by-name errors (non-zero) when the resource is absent — unlike
# filter-based describes that return None — so tolerate that under `set -e`.
ALB_ARN="$(aws_q elbv2 describe-load-balancers --names "${PROJECT}-alb" \
  --query 'LoadBalancers[0].LoadBalancerArn' || true)"
if [[ -z "${ALB_ARN}" || "${ALB_ARN}" == "None" ]]; then
  ALB_ARN="$(aws_q elbv2 create-load-balancer --name "${PROJECT}-alb" \
    --scheme internal --type application --ip-address-type ipv4 \
    --subnets "${PRI_SUBNET_A}" "${PRI_SUBNET_B}" \
    --security-groups "${ALB_SG}" \
    --query 'LoadBalancers[0].LoadBalancerArn')"
  info "created internal ALB ${PROJECT}-alb"
else
  skip "ALB ${PROJECT}-alb"
fi
# Raise idle timeout to 3600s or long streaming responses get cut off.
aws elbv2 modify-load-balancer-attributes --load-balancer-arn "${ALB_ARN}" \
  --attributes Key=idle_timeout.timeout_seconds,Value=3600 --region "${AWS_REGION}" >/dev/null
ALB_DNS="$(aws_q elbv2 describe-load-balancers --load-balancer-arns "${ALB_ARN}" \
  --query 'LoadBalancers[0].DNSName')"
ALB_ZONE="$(aws_q elbv2 describe-load-balancers --load-balancer-arns "${ALB_ARN}" \
  --query 'LoadBalancers[0].CanonicalHostedZoneId')"

# Gateway target group + HTTPS:443 listener. Health check → /healthz (liveness);
# /readyz would drain all replicas during a Postgres blip (see README tradeoff).
TG_ARN="$(aws_q elbv2 describe-target-groups --names "${PROJECT}-tg" \
  --query 'TargetGroups[0].TargetGroupArn' || true)"
if [[ -z "${TG_ARN}" || "${TG_ARN}" == "None" ]]; then
  TG_ARN="$(aws_q elbv2 create-target-group --name "${PROJECT}-tg" \
    --protocol HTTP --port 8080 --vpc-id "${VPC_ID}" --target-type ip \
    --health-check-path /healthz --health-check-protocol HTTP \
    --matcher HttpCode=200 \
    --query 'TargetGroups[0].TargetGroupArn')"
  info "created target group ${PROJECT}-tg (/healthz)"
else
  skip "target group ${PROJECT}-tg"
fi

# shellcheck disable=SC2016  # backticks are JMESPath literal syntax, not shell expansion
if [[ "$(aws_q elbv2 describe-listeners --load-balancer-arn "${ALB_ARN}" \
      --query 'Listeners[?Port==`443`].ListenerArn')" =~ arn: ]]; then
  skip "HTTPS:443 listener"
else
  aws elbv2 create-listener --load-balancer-arn "${ALB_ARN}" \
    --protocol HTTPS --port 443 \
    --certificates "CertificateArn=${CERT_ARN}" \
    --ssl-policy ELBSecurityPolicy-TLS13-1-2-2021-06 \
    --default-actions "Type=forward,TargetGroupArn=${TG_ARN}" \
    --region "${AWS_REGION}" >/dev/null
  info "created HTTPS:443 listener (cert ${CERT_ARN})"
fi

# 6d. Route 53 private A-record (alias to the ALB).
RECORD_NAME="${PUBLIC_URL#https://}"
CHANGE_BATCH=$(cat <<JSON
{"Changes":[{"Action":"UPSERT","ResourceRecordSet":{
  "Name":"${RECORD_NAME}","Type":"A",
  "AliasTarget":{"HostedZoneId":"${ALB_ZONE}","DNSName":"${ALB_DNS}","EvaluateTargetHealth":true}}}]}
JSON
)
aws route53 change-resource-record-sets --hosted-zone-id "${ZONE_ID}" \
  --change-batch "${CHANGE_BATCH}" >/dev/null
info "upserted Route 53 A-record ${RECORD_NAME} → ${ALB_DNS}"

# 6e. Gateway task definition. NO non-secret app config — it's BAKED into the image.
# Secrets injected as env vars. DB_USER/DB_PASSWORD come from the RDS-managed master
# secret's JSON fields; DB_HOST is the (non-secret) RDS endpoint as a plain env var,
# because the RDS-managed secret holds only {username,password}, not the host.
#
# Two containers: the gateway, and a non-essential ADOT collector sidecar. The
# gateway forwards OTLP to the sidecar on localhost:4318 (CLAUDE_GATEWAY_ALLOW_LOOPBACK=1
# lets it target loopback past the SSRF guard); the sidecar relays to CloudWatch's
# native OTLP endpoint using SigV4 via the task role. Kept identical to the CDK
# stack's adotConfig — keep the two in sync.
ADOT_CONFIG="$(cat <<YAML
extensions:
  sigv4auth:
    service: monitoring
    region: ${AWS_REGION}
receivers:
  otlp:
    protocols:
      http:
        endpoint: 127.0.0.1:4318
processors:
  batch:
    send_batch_size: 200
    timeout: 10s
exporters:
  otlphttp:
    metrics_endpoint: https://monitoring.${AWS_REGION}.amazonaws.com/v1/metrics
    auth:
      authenticator: sigv4auth
    compression: gzip
service:
  extensions: [sigv4auth]
  pipelines:
    metrics:
      receivers: [otlp]
      processors: [batch]
      exporters: [otlphttp]
YAML
)"
# Build with jq so the multi-line ADOT config is JSON-escaped correctly.
GW_TASKDEF="$(jq -n \
  --arg family "${PROJECT}" \
  --arg execRole "${EXEC_ROLE_ARN}" \
  --arg taskRole "${TASK_ROLE_ARN}" \
  --arg image "${IMAGE_URI}" \
  --arg adotImage "${ADOT_IMAGE}" \
  --arg logLevel "${GATEWAY_LOG_LEVEL}" \
  --arg dbHost "${DB_HOST}" \
  --arg jwtArn "${JWT_SECRET_ARN}" \
  --arg oidcArn "${OIDC_SECRET_ARN}" \
  --arg dbArn "${DB_SECRET_ARN}" \
  --arg logGroup "${LOG_GROUP}" \
  --arg region "${AWS_REGION}" \
  --arg adotConfig "${ADOT_CONFIG}" \
  '{
    family: $family,
    networkMode: "awsvpc",
    requiresCompatibilities: ["FARGATE"],
    cpu: "512", memory: "1024",
    executionRoleArn: $execRole,
    taskRoleArn: $taskRole,
    containerDefinitions: [
      {
        name: "gateway",
        image: $image,
        essential: true,
        portMappings: [{containerPort: 8080, protocol: "tcp"}],
        environment: [
          {name: "CLAUDE_GATEWAY_LOG_LEVEL", value: $logLevel},
          {name: "DB_HOST", value: $dbHost},
          {name: "CLAUDE_GATEWAY_ALLOW_LOOPBACK", value: "1"}
        ],
        secrets: [
          {name: "GATEWAY_JWT_SECRET", valueFrom: $jwtArn},
          {name: "OIDC_CLIENT_SECRET", valueFrom: $oidcArn},
          {name: "DB_USER", valueFrom: ($dbArn + ":username::")},
          {name: "DB_PASSWORD", valueFrom: ($dbArn + ":password::")}
        ],
        logConfiguration: {logDriver: "awslogs", options: {
          "awslogs-group": $logGroup, "awslogs-region": $region, "awslogs-stream-prefix": "gateway"}}
      },
      {
        name: "otel-collector",
        image: $adotImage,
        essential: false,
        memoryReservation: 128,
        environment: [{name: "AOT_CONFIG_CONTENT", value: $adotConfig}],
        logConfiguration: {logDriver: "awslogs", options: {
          "awslogs-group": $logGroup, "awslogs-region": $region, "awslogs-stream-prefix": "otel"}}
      }
    ]
  }')"
GW_TD_ARN="$(aws_q ecs register-task-definition --cli-input-json "${GW_TASKDEF}" \
  --query 'taskDefinition.taskDefinitionArn')"
info "registered gateway task def ${GW_TD_ARN} (gateway + otel-collector sidecar)"

# 6f. Gateway Fargate service — desiredCount 2 across 2 AZs for zero-downtime
# rolling deploys + AZ resilience (stateless; Postgres is the shared layer).
if aws_q ecs describe-services --cluster "${CLUSTER}" --services "${SERVICE}" \
     --query "services[?status=='ACTIVE'].serviceName" | grep -q .; then
  aws ecs update-service --cluster "${CLUSTER}" --service "${SERVICE}" \
    --task-definition "${GW_TD_ARN}" --desired-count "${DESIRED_COUNT}" \
    --region "${AWS_REGION}" >/dev/null
  skip "ecs service ${SERVICE} (updated to new task def, rolling deploy)"
else
  aws ecs create-service --cluster "${CLUSTER}" --service-name "${SERVICE}" \
    --task-definition "${GW_TD_ARN}" --desired-count "${DESIRED_COUNT}" \
    --launch-type FARGATE \
    --health-check-grace-period-seconds 120 \
    --network-configuration "awsvpcConfiguration={subnets=[${PRI_SUBNET_A},${PRI_SUBNET_B}],securityGroups=[${TASK_SG}],assignPublicIp=DISABLED}" \
    --load-balancers "targetGroupArn=${TG_ARN},containerName=gateway,containerPort=8080" \
    --region "${AWS_REGION}" >/dev/null
  info "created gateway service ${SERVICE} (desiredCount ${DESIRED_COUNT})"
fi

# ──────────────────────────────────────────────────────────────────────────────
# Final summary
# ──────────────────────────────────────────────────────────────────────────────
# Cert SHA-256 fingerprint the CLI pins on first /login. Publish it so developers
# can confirm the prompt. (A public, browser-trusted ACM cert shows no prompt.)
FINGERPRINT="$(echo | openssl s_client -connect "${RECORD_NAME}:443" -servername "${RECORD_NAME}" 2>/dev/null \
  | openssl x509 -noout -fingerprint -sha256 2>/dev/null | sed 's/.*=//' || true)"
[[ -n "${FINGERPRINT}" ]] || FINGERPRINT="(run once DNS resolves: openssl s_client -connect ${RECORD_NAME}:443 -servername ${RECORD_NAME} | openssl x509 -noout -fingerprint -sha256)"
TLS_STEP="4. Publish this cert SHA-256 fingerprint for developers to compare on /login
        (a public, browser-trusted ACM cert shows no prompt):
        ${FINGERPRINT}"

cat <<SUMMARY

$(log "Deploy complete")
  Image .............. ${IMAGE_URI}
  Cluster / service .. ${CLUSTER} / ${SERVICE} (desiredCount ${DESIRED_COUNT})
  Public URL ......... ${PUBLIC_URL}
  Internal ALB DNS ... ${ALB_DNS}
  RDS endpoint ....... ${DB_HOST}
  Task role ARN ...... ${TASK_ROLE_ARN}
  Log group .......... ${LOG_GROUP}

  NEXT STEPS
  1. Register this redirect URI on your OIDC client (if not already):
        ${PUBLIC_URL}/oauth/callback
  2. Ensure Bedrock MODEL ACCESS is enabled for the models in gateway.yaml's
     availableModels — the gateway uses global.anthropic.* profiles, so enable
     access in your source region (and regions global may route to). Missing
     this → AccessDeniedException on invoke.
  3. Confirm developer laptops resolve ${RECORD_NAME} to the ALB's PRIVATE IP
     (VPN/DX/TGW + private DNS — see docs/connectivity.md).
  ${TLS_STEP}
  5. Push forceLoginMethod/forceLoginGatewayUrl to developer machines
     (managed-settings.json — see the Verify section of docs/deployment.md).
  6. Telemetry is ON automatically: the ADOT collector sidecar in the task relays
     OTLP metrics to CloudWatch using SigV4 via the task role (no key to set).
     Metrics land in CloudWatch's native OTLP (PromQL) backend — query them via
     the PromQL API, NOT list-metrics (see docs/gotchas.md §2). See
     docs/deployment.md "Telemetry".

  Smoke test once DNS + a session route exist:
     curl -fsS ${PUBLIC_URL}/.well-known/oauth-authorization-server | jq .
SUMMARY
