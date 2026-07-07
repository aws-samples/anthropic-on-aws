# ECS Fargate as the primary compute target

**Decision:** run the gateway on **ECS Fargate** (the automated `setup.sh` + CDK track), with EKS+IRSA
documented as an alternative rather than built.

**Why:** Fargate is the idiomatic AWS answer for a stateless long-running container with no nodes to
manage, which is exactly the gateway's shape (stateless replicas, Postgres as the shared layer). It
also **avoids a specific Bedrock failure mode**: on EC2-backed compute the default IMDSv2 hop limit of
1 blocks the in-container metadata request, so the AWS SDK's credential chain can't resolve the task
role and **every Bedrock request returns 502 (`Could not load credentials from any providers`)** —
and boot/`/readyz` pass anyway because credentials resolve on first request, making it a confusing
runtime-only failure. Fargate task roles read credentials from the ECS container-credentials endpoint,
not IMDS, so the trap doesn't exist.

**Rejected:** Lambda/App Runner — Lambda can't host a long-running HTTP server; App Runner is awkward
for an internal-only service that must reach a private-subnet RDS over the VPC. EC2/EKS-on-EC2 remain
viable but carry the IMDS hop-limit caveat (documented in the EKS notes; Fargate profiles avoid it).
