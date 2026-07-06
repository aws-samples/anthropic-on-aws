# ---------------------------------------------------------------------------
# ECR repository for the gateway image. force_delete lets `terraform destroy`
# remove it even if test images were pushed (fine for a test stack).
# ---------------------------------------------------------------------------

resource "aws_ecr_repository" "gateway" {
  name                 = "${var.name_prefix}/claude-gateway"
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = var.tags
}
