# CLAUDE.md - DevOps & Infrastructure as Code

This CLAUDE.md template is optimized for DevOps, Infrastructure as Code (IaC), and platform engineering projects.

## Project Overview

This is a DevOps/Infrastructure project managing cloud resources, CI/CD pipelines, and platform services. Claude Code will assist with infrastructure automation, deployment pipelines, monitoring, and incident response.

## Project Structure

```
.
├── terraform/                 # Terraform configurations
│   ├── environments/          # Environment-specific configs
│   │   ├── dev/
│   │   ├── staging/
│   │   └── production/
│   ├── modules/               # Reusable Terraform modules
│   │   ├── networking/
│   │   ├── compute/
│   │   ├── database/
│   │   └── security/
│   └── global/                # Global resources
├── kubernetes/                # Kubernetes manifests
│   ├── base/                  # Base configurations
│   ├── overlays/              # Environment overlays
│   └── charts/                # Helm charts
├── ansible/                   # Configuration management
│   ├── playbooks/
│   ├── roles/
│   └── inventories/
├── scripts/                   # Automation scripts
│   ├── deployment/
│   ├── monitoring/
│   └── backup/
├── .github/workflows/         # GitHub Actions
├── monitoring/                # Monitoring configs
│   ├── prometheus/
│   ├── grafana/
│   └── alerts/
└── docs/                      # Documentation
    ├── runbooks/              # Operational runbooks
    ├── architecture/          # System design docs
    └── disaster-recovery/     # DR procedures
```

## Commands and Workflows

### Infrastructure Management
```bash
# Terraform operations
terraform init
terraform plan -var-file=environments/dev/terraform.tfvars
terraform apply -auto-approve
terraform destroy -target=module.compute

# State management
terraform state list
terraform state mv
terraform import

# Workspace management
terraform workspace new staging
terraform workspace select production
```

### Kubernetes Operations
```bash
# Cluster management
kubectl get nodes
kubectl describe node node-1
kubectl top nodes

# Deployment
kubectl apply -f kubernetes/base/
kubectl rollout status deployment/app
kubectl rollout undo deployment/app

# Debugging
kubectl logs -f deployment/app
kubectl exec -it pod-name -- /bin/bash
kubectl port-forward service/app 8080:80

# Helm operations
helm install app ./charts/app
helm upgrade app ./charts/app --values values.yaml
helm rollback app 1
```

### CI/CD Pipeline Management
```bash
# GitHub Actions
gh workflow run deploy.yml
gh run list --workflow=deploy.yml
gh run watch

# Docker operations
docker build -t app:latest .
docker push registry.example.com/app:latest
docker-compose up -d
docker-compose logs -f

# Registry management
docker tag app:latest app:v1.2.3
docker manifest inspect app:latest
```

## Infrastructure as Code Best Practices

### Terraform Standards
```hcl
# modules/compute/main.tf
# Always use consistent structure

# 1. Terraform settings
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# 2. Data sources
data "aws_ami" "ubuntu" {
  most_recent = true
  # ...
}

# 3. Locals
locals {
  common_tags = {
    Environment = var.environment
    ManagedBy   = "Terraform"
    Team        = "DevOps"
  }
}

# 4. Resources
resource "aws_instance" "app" {
  # ...
  tags = merge(local.common_tags, {
    Name = "${var.environment}-app-instance"
  })
}

# 5. Outputs
output "instance_id" {
  value       = aws_instance.app.id
  description = "ID of the EC2 instance"
}
```

### Kubernetes Best Practices
```yaml
# Always include resource limits
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app
  labels:
    app: myapp
    version: v1
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: app
        image: myapp:latest
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
```

## Security Guidelines

### Infrastructure Security
```bash
# Secrets management
# Never commit secrets to git
export TF_VAR_db_password=$(vault kv get -field=password secret/db)

# Use AWS Secrets Manager
aws secretsmanager create-secret --name prod/db/password

# Kubernetes secrets
kubectl create secret generic db-secret \
  --from-literal=password=$DB_PASSWORD

# Scan for vulnerabilities
tfsec .
checkov -d terraform/
kubesec scan kubernetes/deployment.yaml
```

### Network Security
```hcl
# Security group with minimal permissions
resource "aws_security_group" "app" {
  name_base = "${var.environment}-app-sg"
  
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/8"]  # Internal only
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
```

## Monitoring and Alerting

### Prometheus Configuration
```yaml
# monitoring/prometheus/alerts.yml
groups:
  - name: infrastructure
    rules:
      - alert: HighCPUUsage
        expr: node_cpu_usage > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage on {{ $labels.instance }}"
          
      - alert: DiskSpaceLow
        expr: node_filesystem_free_bytes / node_filesystem_size_bytes < 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Low disk space on {{ $labels.instance }}"
```

### Grafana Dashboards
```json
{
  "dashboard": {
    "title": "Infrastructure Overview",
    "panels": [
      {
        "title": "CPU Usage",
        "targets": [
          {
            "expr": "100 - (avg(irate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)"
          }
        ]
      }
    ]
  }
}
```

## Custom Claude Code Configuration

### Agents for This Project
- `infrastructure-architect`: Design and review infrastructure
- `security-auditor`: Security compliance and vulnerability scanning
- `cost-optimizer`: Cloud cost analysis and optimization
- `incident-responder`: Automated incident response

### Hooks for DevOps
```json
{
  "hooks": {
    "pre-deploy": {
      "actions": ["terraform-plan", "security-scan", "cost-estimate"]
    },
    "post-deploy": {
      "actions": ["smoke-test", "update-documentation", "notify-team"]
    },
    "on-alert": {
      "actions": ["diagnose", "auto-remediate", "create-incident"]
    }
  }
}
```

### Recommended MCP Servers
```bash
# Kubernetes management
claude mcp add kubernetes --kubeconfig ~/.kube/config

# Cloud provider
claude mcp add aws --profile production

# Monitoring
claude mcp add prometheus --url http://prometheus:9090

# Incident management
claude mcp add pagerduty --api-key ${PAGERDUTY_KEY}
```

## Deployment Strategies

### Blue-Green Deployment
```bash
# Deploy to green environment
kubectl apply -f kubernetes/green/
kubectl wait --for=condition=ready pod -l version=green

# Switch traffic
kubectl patch service app -p '{"spec":{"selector":{"version":"green"}}}'

# Cleanup blue environment
kubectl delete -f kubernetes/blue/
```

### Canary Deployment
```yaml
# Using Flagger for progressive delivery
apiVersion: flagger.app/v1beta1
kind: Canary
metadata:
  name: app
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: app
  progressDeadlineSeconds: 60
  service:
    port: 80
  analysis:
    interval: 1m
    threshold: 5
    maxWeight: 50
    stepWeight: 10
    metrics:
    - name: request-success-rate
      thresholdRange:
        min: 99
      interval: 1m
```

## Disaster Recovery

### Backup Strategy
```bash
# Database backups
#!/bin/bash
# scripts/backup/backup-db.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${DATE}.sql"

pg_dump $DATABASE_URL > $BACKUP_FILE
aws s3 cp $BACKUP_FILE s3://backups/db/
rm $BACKUP_FILE

# Kubernetes state backup
velero backup create cluster-backup --include-namespaces default,production
```

### Recovery Procedures
```bash
# Restore database
aws s3 cp s3://backups/db/latest.sql .
psql $DATABASE_URL < latest.sql

# Restore Kubernetes
velero restore create --from-backup cluster-backup

# Terraform state recovery
terraform init -backend-config=backend.hcl
terraform refresh
```

## Cost Optimization

### Resource Tagging
```hcl
# Consistent tagging for cost tracking
locals {
  cost_tags = {
    Project     = var.project_name
    Environment = var.environment
    CostCenter  = var.cost_center
    Owner       = var.team_email
    AutoShutdown = var.environment != "production" ? "true" : "false"
  }
}
```

### Auto-scaling Configuration
```yaml
# Horizontal Pod Autoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: app
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

## Incident Response

### Runbook Template
```markdown
# Service Down Runbook

## Symptoms
- Service returns 5xx errors
- Health checks failing
- Alerts firing in PagerDuty

## Initial Response
1. Check service status: `kubectl get pods -l app=service`
2. Check logs: `kubectl logs -l app=service --tail=100`
3. Check metrics: Open Grafana dashboard

## Diagnosis
1. Resource exhaustion: `kubectl top pods`
2. Database connectivity: `kubectl exec -it pod -- nc -zv db-host 5432`
3. Configuration issues: `kubectl describe configmap service-config`

## Remediation
1. Restart pods: `kubectl rollout restart deployment/service`
2. Scale up: `kubectl scale deployment/service --replicas=5`
3. Rollback: `kubectl rollout undo deployment/service`

## Escalation
If issue persists > 15 minutes, escalate to senior engineer
```

## Environment Variables

```bash
# Cloud credentials
AWS_PROFILE=production
GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json
AZURE_SUBSCRIPTION_ID=xxx

# Terraform
TF_VAR_region=us-east-1
TF_VAR_environment=production
TF_BACKEND_BUCKET=terraform-state

# Kubernetes
KUBECONFIG=~/.kube/config
KUBE_NAMESPACE=default

# Monitoring
PROMETHEUS_URL=http://prometheus:9090
GRAFANA_URL=http://grafana:3000
ALERT_MANAGER_URL=http://alertmanager:9093

# CI/CD
DOCKER_REGISTRY=registry.example.com
GITHUB_TOKEN=xxx
SONAR_TOKEN=xxx
```

## Compliance and Governance

### Policy as Code
```rego
# Open Policy Agent (OPA) policy
package kubernetes.admission

deny[msg] {
  input.request.kind.kind == "Pod"
  input.request.object.spec.containers[_].image
  not starts_with(input.request.object.spec.containers[_].image, "registry.example.com/")
  msg := "Images must be from approved registry"
}
```

### Audit Logging
```yaml
# Enable audit logging in Kubernetes
apiVersion: audit.k8s.io/v1
kind: Policy
rules:
  - level: RequestResponse
    omitStages:
      - RequestReceived
    resources:
      - group: ""
        resources: ["secrets", "configmaps"]
    namespaces: ["production"]
```

## Performance Benchmarks

- **Deployment time**: < 5 minutes
- **Infrastructure provisioning**: < 10 minutes
- **Rollback time**: < 2 minutes
- **RTO (Recovery Time Objective)**: < 1 hour
- **RPO (Recovery Point Objective)**: < 15 minutes
- **System availability**: > 99.9%

## Resources

- [Terraform Best Practices](https://www.terraform-best-practices.com/)
- [Kubernetes Production Best Practices](https://learnk8s.io/production-best-practices)
- [The Phoenix Project](https://itrevolution.com/the-phoenix-project/)
- [Site Reliability Engineering](https://sre.google/books/)
- [Cloud Native Patterns](https://www.manning.com/books/cloud-native-patterns)

## Notes for Claude Code

When working on this infrastructure:
- Always test changes in dev environment first
- Use terraform plan before any apply
- Never modify production directly
- Document all manual interventions
- Follow the principle of least privilege
- Implement defense in depth
- Automate everything that can be automated
- Monitor everything that moves
- Keep disaster recovery procedures updated
- Regular security audits and updates