# ---------------------------------------------------------------------------
# Secrets Manager. Terraform generates the machine secrets (JWT, admin keys) and
# assembles the Postgres URL from the RDS instance. The OIDC client secret and
# the full gateway.yaml config are operator-supplied: Terraform creates the
# secret containers with placeholder values you overwrite out-of-band (so real
# IdP secrets and config never live in Terraform state you might commit).
#
# recovery_window_in_days = 0 → immediate delete on destroy, so create/destroy
# test cycles don't hit "a secret with this name is scheduled for deletion".
# ---------------------------------------------------------------------------

resource "random_password" "jwt" {
  length  = 48
  special = false
}

resource "random_password" "admin_read" {
  length  = 32
  special = false
}

resource "random_password" "admin_write" {
  length  = 32
  special = false
}

# ---- machine-generated secrets -------------------------------------------
resource "aws_secretsmanager_secret" "jwt" {
  name                    = "${var.name_prefix}/jwt-secret"
  recovery_window_in_days = 0
  tags                    = var.tags
}
resource "aws_secretsmanager_secret_version" "jwt" {
  secret_id     = aws_secretsmanager_secret.jwt.id
  secret_string = random_password.jwt.result
}

resource "aws_secretsmanager_secret" "admin_read" {
  name                    = "${var.name_prefix}/admin-read-key"
  recovery_window_in_days = 0
  tags                    = var.tags
}
resource "aws_secretsmanager_secret_version" "admin_read" {
  secret_id     = aws_secretsmanager_secret.admin_read.id
  secret_string = random_password.admin_read.result
}

resource "aws_secretsmanager_secret" "admin_write" {
  name                    = "${var.name_prefix}/admin-write-key"
  recovery_window_in_days = 0
  tags                    = var.tags
}
resource "aws_secretsmanager_secret_version" "admin_write" {
  secret_id     = aws_secretsmanager_secret.admin_write.id
  secret_string = random_password.admin_write.result
}

# ---- postgres URL assembled from the RDS instance ------------------------
resource "aws_secretsmanager_secret" "postgres_url" {
  name                    = "${var.name_prefix}/postgres-url"
  recovery_window_in_days = 0
  tags                    = var.tags
}
resource "aws_secretsmanager_secret_version" "postgres_url" {
  secret_id     = aws_secretsmanager_secret.postgres_url.id
  secret_string = local.postgres_url
}

# ---- operator-supplied secrets (placeholders; overwrite out-of-band) -----
resource "aws_secretsmanager_secret" "oidc_client_secret" {
  name                    = "${var.name_prefix}/oidc-client-secret"
  recovery_window_in_days = 0
  tags                    = var.tags
}
resource "aws_secretsmanager_secret_version" "oidc_client_secret" {
  secret_id     = aws_secretsmanager_secret.oidc_client_secret.id
  secret_string = "REPLACE_ME_with_your_oidc_client_secret"
  lifecycle {
    ignore_changes = [secret_string] # don't clobber the real value you set later
  }
}

resource "aws_secretsmanager_secret" "config" {
  name                    = "${var.name_prefix}/config"
  recovery_window_in_days = 0
  tags                    = var.tags
}
resource "aws_secretsmanager_secret_version" "config" {
  secret_id     = aws_secretsmanager_secret.config.id
  secret_string = "REPLACE_ME_with_your_gateway.yaml"
  lifecycle {
    ignore_changes = [secret_string] # gateway.yaml is pushed out-of-band
  }
}
