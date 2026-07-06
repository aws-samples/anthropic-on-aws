# ---------------------------------------------------------------------------
# VPC is managed OUTSIDE Terraform. We reference it read-only via data sources
# so `terraform destroy` never touches the shared VPC/subnets — it only removes
# the resources this module creates.
# ---------------------------------------------------------------------------

data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

data "aws_vpc" "this" {
  id = var.vpc_id
}

data "aws_subnet" "private" {
  for_each = toset(var.private_subnet_ids)
  id       = each.value
}

locals {
  account_id = data.aws_caller_identity.current.account_id
  # Distinct AZs covered by the provided private subnets (RDS needs >= 2 AZs).
  private_azs = distinct([for s in data.aws_subnet.private : s.availability_zone])
}
