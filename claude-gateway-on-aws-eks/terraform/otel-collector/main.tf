terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

provider "aws" {
  region = var.region
}

variable "region" {
  type    = string
  default = "ap-southeast-2"
}

variable "cluster_name" {
  type    = string
  default = "claude-gateway"
}

variable "namespace" {
  type    = string
  default = "claude-gateway"
}

variable "service_account" {
  type    = string
  default = "otel-collector"
}

data "aws_caller_identity" "current" {}

# OIDC provider for the cluster, needed for the IRSA trust statement.
# The Secrets Store CSI AWS provider resolves the role via the SA's
# eks.amazonaws.com/role-arn annotation (IRSA / AssumeRoleWithWebIdentity),
# NOT via Pod Identity — so the role must trust both, exactly like the
# existing claude-gateway-pod-identity-role.
data "aws_eks_cluster" "this" {
  name = var.cluster_name
}

locals {
  oidc_issuer = replace(data.aws_eks_cluster.this.identity[0].oidc[0].issuer, "https://", "")
  oidc_arn    = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:oidc-provider/${local.oidc_issuer}"
}

# ---------------------------------------------------------------------------
# IAM role assumed by the collector pods. Trusts BOTH the Pod Identity service
# principal AND IRSA web-identity federation, mirroring the gateway role.
# ---------------------------------------------------------------------------
data "aws_iam_policy_document" "trust" {
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
      identifiers = [local.oidc_arn]
    }
    condition {
      test     = "StringEquals"
      variable = "${local.oidc_issuer}:aud"
      values   = ["sts.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "${local.oidc_issuer}:sub"
      values   = ["system:serviceaccount:${var.namespace}:${var.service_account}"]
    }
  }
}

resource "aws_iam_role" "collector" {
  name               = "claude-otel-collector-pod-identity-role"
  assume_role_policy = data.aws_iam_policy_document.trust.json
  tags = {
    app     = "claude-otel-collector"
    managed = "terraform"
  }
}

# Permissions the ADOT collector needs for the awsemf + otlphttp(sigv4) exporters.
data "aws_iam_policy_document" "collector" {
  # EMF exporter writes metrics as embedded-metric-format log events, and
  # otlphttp(sigv4) calls the CloudWatch metrics API.
  statement {
    sid    = "CloudWatchMetrics"
    effect = "Allow"
    actions = [
      "cloudwatch:PutMetricData",
    ]
    resources = ["*"]
  }

  statement {
    sid    = "CloudWatchLogs"
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:DescribeLogGroups",
      "logs:DescribeLogStreams",
    ]
    # awsemf writes to /aws/claude-code/*; scope to that log-group family.
    resources = [
      "arn:aws:logs:${var.region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/claude-code/*",
      "arn:aws:logs:${var.region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/claude-code/*:*",
    ]
  }

  # The Secrets Store CSI driver mounts the client bearer token; the collector
  # SA's role must be allowed to read it.
  statement {
    sid    = "SecretsManagerRead"
    effect = "Allow"
    actions = [
      "secretsmanager:GetSecretValue",
      "secretsmanager:DescribeSecret",
    ]
    resources = [
      "arn:aws:secretsmanager:${var.region}:${data.aws_caller_identity.current.account_id}:secret:claude-gateway/otel-bearer-token-*",
    ]
  }
}

resource "aws_iam_role_policy" "collector" {
  name   = "claude-otel-collector-policy"
  role   = aws_iam_role.collector.id
  policy = data.aws_iam_policy_document.collector.json
}

# ---------------------------------------------------------------------------
# EKS Pod Identity association: ns/sa -> role.
# ---------------------------------------------------------------------------
resource "aws_eks_pod_identity_association" "collector" {
  cluster_name    = var.cluster_name
  namespace       = var.namespace
  service_account = var.service_account
  role_arn        = aws_iam_role.collector.arn
}

# ---------------------------------------------------------------------------
# CloudWatch dashboard for Claude Code usage metrics (namespace: ClaudeCode).
# Metrics are emitted per user.email; queries use CloudWatch Metrics Insights.
# ---------------------------------------------------------------------------
resource "aws_cloudwatch_dashboard" "claude_code_usage" {
  dashboard_name = "ClaudeCodeUsage"
  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [[{
            expression = "SEARCH('{ClaudeCode,user.email} MetricName=claude_code.token.usage', 'Sum', 300)"
            id         = "e2"
            period     = 300
            region     = var.region
            label      = "$${PROP('Dim.user.email')}"
          }]]
          view    = "timeSeries"
          stacked = false
          region  = var.region
          stat    = "Sum"
          period  = 300
          title   = "Token Usage Per User (5 min, sum)"
          legend  = { position = "bottom" }
          yAxis   = { left = { showUnits = true } }
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 6
        height = 6
        properties = {
          metrics = [[{
            expression = "SEARCH('{ClaudeCode,user.email} MetricName=claude_code.cost.usage', 'Sum', 3600)"
            id         = "e3"
            period     = 3600
            region     = var.region
            label      = "$${PROP('Dim.user.email')}"
          }]]
          view    = "timeSeries"
          stacked = false
          region  = var.region
          stat    = "Sum"
          period  = 3600
          title   = "Cost Per User (1 hour, sum)"
          legend  = { position = "bottom" }
          yAxis   = { left = { showUnits = true, label = "USD" } }
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 6
        height = 6
        properties = {
          metrics = [[{
            expression = "SEARCH('{ClaudeCode,user.email} MetricName=claude_code.cost.usage', 'Sum', 86400)"
            id         = "e3"
            period     = 86400
            region     = var.region
            label      = "$${PROP('Dim.user.email')}"
          }]]
          view    = "timeSeries"
          stacked = false
          region  = var.region
          stat    = "Sum"
          period  = 86400
          title   = "Cost Per User (1 Day, sum)"
          legend  = { position = "bottom" }
          yAxis   = { left = { showUnits = true, label = "USD" } }
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          metrics = [[{
            expression = "SEARCH('{ClaudeCode,model} MetricName=claude_code.token.usage', 'Sum', 86400)"
            id         = "e4"
            period     = 86400
            region     = var.region
            label      = "$${PROP('Dim.model')}"
          }]]
          view    = "timeSeries"
          stacked = false
          region  = var.region
          stat    = "Sum"
          period  = 86400
          title   = "Token Usage Per Model (1 Day, sum)"
          legend  = { position = "bottom" }
          yAxis   = { left = { showUnits = true } }
        }
      },
    ]
  })
}

output "collector_role_arn" {
  value = aws_iam_role.collector.arn
}

output "pod_identity_association_id" {
  value = aws_eks_pod_identity_association.collector.association_id
}
