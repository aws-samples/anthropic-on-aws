# ---------------------------------------------------------------------------
# EKS cluster in Auto Mode. Auto Mode manages the data-plane (nodes) and bundles
# the AWS Load Balancer Controller + EBS CSI, so an internal ALB works from an
# Ingress with no extra controller install. (Secrets Store CSI is NOT bundled —
# it's installed via Helm in the Kubernetes layer.)
# ---------------------------------------------------------------------------

# ---- Cluster IAM role -----------------------------------------------------
data "aws_iam_policy_document" "cluster_assume" {
  statement {
    actions = ["sts:AssumeRole", "sts:TagSession"]
    principals {
      type        = "Service"
      identifiers = ["eks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "cluster" {
  name               = "${var.name_prefix}-eks-cluster-role"
  assume_role_policy = data.aws_iam_policy_document.cluster_assume.json
  tags               = var.tags
}

# Managed policies EKS Auto Mode requires on the cluster role.
resource "aws_iam_role_policy_attachment" "cluster" {
  for_each = toset([
    "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy",
    "arn:aws:iam::aws:policy/AmazonEKSComputePolicy",
    "arn:aws:iam::aws:policy/AmazonEKSBlockStoragePolicy",
    "arn:aws:iam::aws:policy/AmazonEKSLoadBalancingPolicy",
    "arn:aws:iam::aws:policy/AmazonEKSNetworkingPolicy",
  ])
  role       = aws_iam_role.cluster.name
  policy_arn = each.value
}

# ---- Node IAM role (used by Auto Mode managed nodes) ----------------------
data "aws_iam_policy_document" "node_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "node" {
  name               = "${var.name_prefix}-eks-node-role"
  assume_role_policy = data.aws_iam_policy_document.node_assume.json
  tags               = var.tags
}

resource "aws_iam_role_policy_attachment" "node" {
  for_each = toset([
    "arn:aws:iam::aws:policy/AmazonEKSWorkerNodeMinimalPolicy",
    "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPullOnly",
  ])
  role       = aws_iam_role.node.name
  policy_arn = each.value
}

# ---- Cluster --------------------------------------------------------------
resource "aws_eks_cluster" "this" {
  name     = "${var.name_prefix}-test"
  role_arn = aws_iam_role.cluster.arn
  version  = var.kubernetes_version

  # Required by EKS Auto Mode: the self-managed kube-proxy/CoreDNS/VPC-CNI addons
  # must NOT be bootstrapped — Auto Mode manages the data plane itself.
  bootstrap_self_managed_addons = false

  vpc_config {
    subnet_ids              = var.private_subnet_ids
    endpoint_private_access = true
    endpoint_public_access  = true # kubectl from the operator's machine; tighten with public_access_cidrs in prod
  }

  # EKS Auto Mode: AWS manages compute, block storage, and load balancing.
  compute_config {
    enabled       = true
    node_pools    = ["general-purpose"]
    node_role_arn = aws_iam_role.node.arn
  }
  storage_config {
    block_storage {
      enabled = true
    }
  }
  kubernetes_network_config {
    elastic_load_balancing {
      enabled = true
    }
  }

  # Bootstrap the creating principal as a cluster admin so the k8s provider and
  # kubectl work immediately after creation.
  access_config {
    authentication_mode                         = "API_AND_CONFIG_MAP"
    bootstrap_cluster_creator_admin_permissions = true
  }

  tags = var.tags

  depends_on = [aws_iam_role_policy_attachment.cluster]
}
