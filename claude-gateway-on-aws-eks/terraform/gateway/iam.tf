# ---------------------------------------------------------------------------
# IAM role the gateway pod assumes: invoke Bedrock models and let the Secrets
# Store CSI driver read the gateway's secrets.
#
# The role trusts BOTH mechanisms, and this is REQUIRED, not belt-and-suspenders:
#   - EKS Pod Identity → the gateway process uses this for Bedrock at runtime.
#   - IRSA (web identity) → the Secrets Store CSI *AWS provider* resolves the
#     role from the ServiceAccount's eks.amazonaws.com/role-arn annotation via
#     AssumeRoleWithWebIdentity. Without the IRSA trust + an IAM OIDC provider +
#     the SA annotation, secret/config volume mounts fail with:
#       "An IAM role must be associated with service account gateway"
# ---------------------------------------------------------------------------

# IAM OIDC provider for the cluster — prerequisite for IRSA.
data "tls_certificate" "oidc" {
  url = aws_eks_cluster.this.identity[0].oidc[0].issuer
}

resource "aws_iam_openid_connect_provider" "cluster" {
  url             = aws_eks_cluster.this.identity[0].oidc[0].issuer
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.oidc.certificates[0].sha1_fingerprint]
  tags            = var.tags
}

locals {
  oidc_issuer = replace(aws_eks_cluster.this.identity[0].oidc[0].issuer, "https://", "")
}

data "aws_iam_policy_document" "gateway_assume" {
  statement {
    sid     = "PodIdentity"
    actions = ["sts:AssumeRole", "sts:TagSession"]
    principals {
      type        = "Service"
      identifiers = ["pods.eks.amazonaws.com"]
    }
  }

  statement {
    sid     = "IRSA"
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.cluster.arn]
    }
    condition {
      test     = "StringEquals"
      variable = "${local.oidc_issuer}:aud"
      values   = ["sts.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "${local.oidc_issuer}:sub"
      values   = ["system:serviceaccount:claude-gateway:gateway"]
    }
  }
}

resource "aws_iam_role" "gateway" {
  name               = "${var.name_prefix}-pod-identity-role"
  assume_role_policy = data.aws_iam_policy_document.gateway_assume.json
  tags               = var.tags
}

# Bedrock: grant BOTH foundation-model and inference-profile ARNs. Invoking via
# an inference profile authorizes against both resource types (see README).
data "aws_iam_policy_document" "bedrock" {
  statement {
    sid    = "InvokeFoundationModels"
    effect = "Allow"
    actions = [
      "bedrock:InvokeModel",
      "bedrock:InvokeModelWithResponseStream",
    ]
    resources = ["arn:aws:bedrock:*::foundation-model/anthropic.*"]
  }
  statement {
    sid    = "InvokeInferenceProfiles"
    effect = "Allow"
    actions = [
      "bedrock:InvokeModel",
      "bedrock:InvokeModelWithResponseStream",
    ]
    resources = [
      "arn:aws:bedrock:*:${local.account_id}:inference-profile/*",
      "arn:aws:bedrock:*:${local.account_id}:application-inference-profile/*",
    ]
  }
}

resource "aws_iam_role_policy" "bedrock" {
  name   = "${var.name_prefix}-bedrock-access"
  role   = aws_iam_role.gateway.id
  policy = data.aws_iam_policy_document.bedrock.json
}

# Secrets Manager: read only this stack's secrets.
data "aws_iam_policy_document" "secrets" {
  statement {
    sid    = "SecretsManagerRead"
    effect = "Allow"
    actions = [
      "secretsmanager:GetSecretValue",
      "secretsmanager:DescribeSecret",
    ]
    resources = ["arn:aws:secretsmanager:${var.region}:${local.account_id}:secret:${var.name_prefix}/*"]
  }
}

resource "aws_iam_role_policy" "secrets" {
  name   = "${var.name_prefix}-secrets-access"
  role   = aws_iam_role.gateway.id
  policy = data.aws_iam_policy_document.secrets.json
}

# Pod Identity association: ns/sa -> role. The namespace + SA are created in the
# Kubernetes layer; Pod Identity associations don't require them to pre-exist.
resource "aws_eks_pod_identity_association" "gateway" {
  cluster_name    = aws_eks_cluster.this.name
  namespace       = "claude-gateway"
  service_account = "gateway"
  role_arn        = aws_iam_role.gateway.arn
  tags            = var.tags
}
