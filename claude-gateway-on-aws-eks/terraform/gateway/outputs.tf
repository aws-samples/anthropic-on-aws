output "cluster_name" {
  value       = aws_eks_cluster.this.name
  description = "EKS cluster name. Use with: aws eks update-kubeconfig --name <this> --region <region>"
}

output "cluster_endpoint" {
  value = aws_eks_cluster.this.endpoint
}

output "region" {
  value = var.region
}

output "ecr_repository_url" {
  value       = aws_ecr_repository.gateway.repository_url
  description = "Push the gateway image here."
}

output "gateway_role_arn" {
  value       = aws_iam_role.gateway.arn
  description = "IAM role bound to the gateway ServiceAccount via Pod Identity."
}

output "rds_endpoint" {
  value = aws_db_instance.this.endpoint
}

output "db_subnet_group" {
  value = aws_db_subnet_group.this.name
}

output "secret_names" {
  value = {
    jwt          = aws_secretsmanager_secret.jwt.name
    admin_read   = aws_secretsmanager_secret.admin_read.name
    admin_write  = aws_secretsmanager_secret.admin_write.name
    postgres_url = aws_secretsmanager_secret.postgres_url.name
    oidc_client  = aws_secretsmanager_secret.oidc_client_secret.name
    config       = aws_secretsmanager_secret.config.name
  }
  description = "Overwrite oidc_client and config with your real values before deploying."
}

output "update_kubeconfig_cmd" {
  value = "aws eks update-kubeconfig --name ${aws_eks_cluster.this.name} --region ${var.region}"
}
