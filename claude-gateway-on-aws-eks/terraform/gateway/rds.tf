# ---------------------------------------------------------------------------
# RDS PostgreSQL for the gateway store, private subnets only. The security group
# allows 5432 from within the VPC CIDR (EKS Auto Mode nodes get VPC-range IPs;
# scoping to the VPC keeps it simple and private — no public access).
# ---------------------------------------------------------------------------

resource "aws_db_subnet_group" "this" {
  name       = "${var.name_prefix}-db-subnet"
  subnet_ids = var.private_subnet_ids
  tags       = var.tags
}

resource "aws_security_group" "rds" {
  name        = "${var.name_prefix}-rds-sg"
  description = "Claude gateway RDS access (PostgreSQL 5432 from within the VPC)"
  vpc_id      = var.vpc_id
  tags        = var.tags
}

resource "aws_vpc_security_group_ingress_rule" "rds_pg" {
  security_group_id = aws_security_group.rds.id
  description       = "PostgreSQL from within the VPC (EKS pods/nodes)"
  cidr_ipv4         = data.aws_vpc.this.cidr_block
  from_port         = 5432
  to_port           = 5432
  ip_protocol       = "tcp"
}

resource "random_password" "db" {
  length  = 32
  special = false # keep the URL clean (no %-encoding needed)
}

resource "aws_db_instance" "this" {
  identifier     = "${var.name_prefix}-db"
  engine         = "postgres"
  engine_version = var.db_engine_version
  instance_class = var.db_instance_class

  allocated_storage = var.db_allocated_storage
  storage_encrypted = true

  db_name  = "claude_gateway"
  username = var.db_username
  password = random_password.db.result

  db_subnet_group_name   = aws_db_subnet_group.this.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false

  backup_retention_period = 7
  skip_final_snapshot     = true # test stack: allow clean destroy without a final snapshot
  apply_immediately       = true
  deletion_protection     = false

  tags = var.tags
}

locals {
  postgres_url = "postgres://${var.db_username}:${random_password.db.result}@${aws_db_instance.this.endpoint}/claude_gateway?sslmode=require"
}
