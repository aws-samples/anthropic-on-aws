# Bake `gateway.yaml` into the image; secrets and deploy-created facts as env vars

On ECS Fargate the task definition's `secrets:` block injects secrets only as **environment
variables** — it cannot mount a Secrets Manager secret as a **file**, unlike Cloud Run (secret
volumes) or EKS (Secrets Store CSI driver). The `claude` binary's entrypoint reads
`--config /etc/claude/gateway.yaml`, which must exist as a real file on disk.

**Decision:** treat `gateway.yaml` as the non-secret config it is (every secret is externalized via
`${VAR}` expansion) and **bake it into the image** — a committed `gateway.yaml.template` is stamped
at build time with the real literal values (`public_url`, `region`, `issuer`, `client_id`,
`allowed_email_domains`) and `COPY`ed into the distroless image. `${VAR}` env expansion is used for
exactly two categories: **secrets** (`jwt_secret`, `client_secret`) and **values that don't exist
until the deploy creates them** (`DB_HOST`/`DB_USER`/`DB_PASSWORD` from the RDS-generated secret).

**Why not the alternatives:** an entrypoint wrapper that writes an env var to disk would force a
shell into the distroless image; an EFS/sidecar file mount adds a stateful resource or doubles the
moving parts. Baking keeps the image distroless with no wrapper and the config versioned as code.

**Consequence:** the image is **per-environment** (one image = one IdP + URL + region). Changing any
of those means a rebuild — acceptable because they're known at deploy time and change rarely. This
is a deliberate divergence from Anthropic's GCP worked example, which stored the whole YAML in Secret
Manager and relied on Cloud Run file mounts; a reader familiar with that example will expect the
same and should know why ECS differs. (On EKS, where the CSI driver *can* file-mount, the example's
notes use `${file:/secrets/...}` instead — the one place a file mount is the natural AWS answer.)
