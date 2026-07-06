# ---------------------------------------------------------------------------
# Inputs. Everything is derivable/defaulted except vpc_id and the two private
# subnet IDs, which reference the (manually-managed) VPC.
# ---------------------------------------------------------------------------

variable "region" {
  type        = string
  default     = "ap-southeast-2"
  description = "AWS region. Must have the Bedrock Claude models you need enabled."
}

variable "name_prefix" {
  type        = string
  default     = "claude-gateway-tf"
  description = "Prefix for all created resources. Change this to run multiple isolated stacks in one account."
}

variable "vpc_id" {
  type        = string
  description = "Existing VPC ID. Managed OUTSIDE Terraform (referenced via data source, never created/destroyed here)."
}

variable "private_subnet_ids" {
  type        = list(string)
  description = "At least two private subnet IDs (different AZs) for EKS nodes, RDS, and the internal ALB. Must have NAT egress."

  validation {
    condition     = length(var.private_subnet_ids) >= 2
    error_message = "Provide at least two private subnet IDs across different AZs."
  }
}

variable "kubernetes_version" {
  type        = string
  default     = "1.32"
  description = "EKS control plane version."
}

variable "db_instance_class" {
  type        = string
  default     = "db.t4g.small"
  description = "RDS instance class for the gateway store."
}

variable "db_engine_version" {
  type        = string
  default     = "16.13"
  description = "PostgreSQL engine version."
}

variable "db_allocated_storage" {
  type        = number
  default     = 20
  description = "RDS allocated storage (GiB)."
}

variable "db_username" {
  type        = string
  default     = "gateway"
  description = "RDS master username."
}

variable "tags" {
  type = map(string)
  default = {
    app     = "claude-gateway"
    managed = "terraform"
    stack   = "gateway-tf-test"
  }
  description = "Tags applied to all created resources."
}
