# Teardown — removing the gateway deployment

How to cleanly remove everything this example creates. The example uses
easy-teardown defaults on purpose (`RemovalPolicy.DESTROY`, deletion protection
off, `emptyOnDelete` on ECR, minimal backups) so nothing blocks deletion — see the
README "Productionising" section for why you'd harden those before relying on it.

> [!IMPORTANT]
> **The two tracks tear down differently.** The **CDK** track is one command
> (`cdk destroy`) because CloudFormation tracks every resource. The **`setup.sh`**
> track has **no teardown mode** — `setup.sh` creates resources directly via the
> AWS CLI with no CloudFormation stack, so there is nothing to `destroy`; you remove
> resources by hand (or with the script at the end of this doc). Know which track
> you deployed with.

A few things are created **out of band** by both tracks' operators (not by the
automation) and must be cleaned up regardless: the **ACM certificate**, its
**Route 53 validation record**, and — if you built one — the **Client VPN**.

---

## Track A — CDK

```bash
cd cdk
npx cdk destroy ClaudeGatewayStack \
  -c imageReady=true \
  -c publicUrl=https://claude-gateway.example.com \
  -c certArn=arn:aws:acm:us-east-1:<acct>:certificate/<id> \
  -c zoneName=example.com -c zoneId=<zoneId> -c ingressCidr=<cidr>
```

Pass the **same context values** you deployed with (CDK needs them to synthesize the
stack it's deleting). This removes the VPC, RDS, ALB + listeners + target groups,
both Fargate services, the ECR repo (emptied first), secrets, IAM roles, log
groups, and VPC endpoints — everything in the stack.

**Not removed by `cdk destroy`** (delete these separately — see [Shared cleanup](#shared-cleanup-both-tracks)):
- the **ACM certificate** (imported into the stack, not created by it)
- its **Route 53 validation CNAME** and the gateway **A-record** if you created it
  outside the stack
- any **Client VPN** you stood up for laptop access

---

## Track B — `setup.sh` (hand teardown)

`setup.sh` has no `--destroy`. Delete in **reverse dependency order** — services
before the cluster, listeners/target groups before the ALB, everything network
before the VPC. Set your project/region first:

```bash
export AWS_REGION=us-east-1
P=claude-gateway            # PROJECT
```

### 1. ECS services + cluster

```bash
# scale to 0, delete both services, then the cluster
for S in "$P" otel; do
  aws ecs update-service --cluster "$P" --service "$S" --desired-count 0 --region "$AWS_REGION" 2>/dev/null
  aws ecs delete-service  --cluster "$P" --service "$S" --force --region "$AWS_REGION" 2>/dev/null
done
aws ecs delete-cluster --cluster "$P" --region "$AWS_REGION"
```

### 2. ALB — listeners, then load balancer, then target groups

```bash
ALB_ARN=$(aws elbv2 describe-load-balancers --names "$P-alb" --region "$AWS_REGION" \
  --query 'LoadBalancers[0].LoadBalancerArn' --output text)
for L in $(aws elbv2 describe-listeners --load-balancer-arn "$ALB_ARN" --region "$AWS_REGION" \
    --query 'Listeners[].ListenerArn' --output text); do
  aws elbv2 delete-listener --listener-arn "$L" --region "$AWS_REGION"
done
aws elbv2 delete-load-balancer --load-balancer-arn "$ALB_ARN" --region "$AWS_REGION"
sleep 30   # let the ALB finish deleting before removing its target groups
for TG in "$P-tg" "$P-otel-tg"; do
  ARN=$(aws elbv2 describe-target-groups --names "$TG" --region "$AWS_REGION" \
    --query 'TargetGroups[0].TargetGroupArn' --output text 2>/dev/null)
  [ -n "$ARN" ] && [ "$ARN" != "None" ] && aws elbv2 delete-target-group --target-group-arn "$ARN" --region "$AWS_REGION"
done
```

### 3. RDS (no final snapshot — example posture)

```bash
aws rds delete-db-instance --db-instance-identifier "$P-db" \
  --skip-final-snapshot --delete-automated-backups --region "$AWS_REGION"
aws rds wait db-instance-deleted --db-instance-identifier "$P-db" --region "$AWS_REGION"
aws rds delete-db-subnet-group --db-subnet-group-name "$P-db-subnets" --region "$AWS_REGION"
```

### 4. Secrets, IAM roles, log groups

```bash
# gateway-owned secrets (the RDS-managed master secret is deleted with the instance)
for SEC in "$P-jwt-secret" "$P-oidc-client-secret"; do
  aws secretsmanager delete-secret --secret-id "$SEC" --force-delete-without-recovery --region "$AWS_REGION"
done
# IAM roles: delete inline policies + detach managed, then the role
for R in "$P-exec-role" "$P-task-role" "$P-otel-task-role"; do
  for P_INLINE in $(aws iam list-role-policies --role-name "$R" --query 'PolicyNames[]' --output text 2>/dev/null); do
    aws iam delete-role-policy --role-name "$R" --policy-name "$P_INLINE"
  done
  for A in $(aws iam list-attached-role-policies --role-name "$R" --query 'AttachedPolicies[].PolicyArn' --output text 2>/dev/null); do
    aws iam detach-role-policy --role-name "$R" --policy-arn "$A"
  done
  aws iam delete-role --role-name "$R" 2>/dev/null
done
# log groups
for LG in /claude-gateway/gateway /claude-gateway/otel-metrics; do
  aws logs delete-log-group --log-group-name "$LG" --region "$AWS_REGION" 2>/dev/null
done
```

### 5. ECR repo

```bash
aws ecr delete-repository --repository-name "$P" --force --region "$AWS_REGION"
```

### 6. Network — VPC endpoints, NAT (+ EIP), IGW, subnets, SGs, route tables, VPC

Deleting the VPC last requires every dependency gone first. The NAT gateway takes
a few minutes to delete; its Elastic IP is only releasable afterward.

```bash
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=tag:Project,Values=$P" \
  --query 'Vpcs[0].VpcId' --output text --region "$AWS_REGION")

# VPC endpoints (interface + gateway)
for E in $(aws ec2 describe-vpc-endpoints --filters "Name=vpc-id,Values=$VPC_ID" \
    --query 'VpcEndpoints[].VpcEndpointId' --output text --region "$AWS_REGION"); do
  aws ec2 delete-vpc-endpoints --vpc-endpoint-ids "$E" --region "$AWS_REGION"
done
# NAT gateway, then release its EIP
NAT=$(aws ec2 describe-nat-gateways --filter "Name=vpc-id,Values=$VPC_ID" "Name=state,Values=available" \
  --query 'NatGateways[0].NatGatewayId' --output text --region "$AWS_REGION")
if [ -n "$NAT" ] && [ "$NAT" != "None" ]; then
  EIP=$(aws ec2 describe-nat-gateways --nat-gateway-ids "$NAT" --region "$AWS_REGION" \
    --query 'NatGateways[0].NatGatewayAddresses[0].AllocationId' --output text)
  aws ec2 delete-nat-gateway --nat-gateway-id "$NAT" --region "$AWS_REGION"
  aws ec2 wait nat-gateway-deleted --nat-gateway-ids "$NAT" --region "$AWS_REGION"
  [ -n "$EIP" ] && [ "$EIP" != "None" ] && aws ec2 release-address --allocation-id "$EIP" --region "$AWS_REGION"
fi
# detach + delete IGW
IGW=$(aws ec2 describe-internet-gateways --filters "Name=attachment.vpc-id,Values=$VPC_ID" \
  --query 'InternetGateways[0].InternetGatewayId' --output text --region "$AWS_REGION")
if [ -n "$IGW" ] && [ "$IGW" != "None" ]; then
  aws ec2 detach-internet-gateway --internet-gateway-id "$IGW" --vpc-id "$VPC_ID" --region "$AWS_REGION"
  aws ec2 delete-internet-gateway --internet-gateway-id "$IGW" --region "$AWS_REGION"
fi
# subnets
for SN in $(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" \
    --query 'Subnets[].SubnetId' --output text --region "$AWS_REGION"); do
  aws ec2 delete-subnet --subnet-id "$SN" --region "$AWS_REGION"
done
# non-default security groups
for SG in $(aws ec2 describe-security-groups --filters "Name=vpc-id,Values=$VPC_ID" \
    --query "SecurityGroups[?GroupName!='default'].GroupId" --output text --region "$AWS_REGION"); do
  aws ec2 delete-security-group --group-id "$SG" --region "$AWS_REGION" 2>/dev/null
done
# non-main route tables
for RT in $(aws ec2 describe-route-tables --filters "Name=vpc-id,Values=$VPC_ID" \
    --query 'RouteTables[?Associations[0].Main!=`true`].RouteTableId' --output text --region "$AWS_REGION"); do
  aws ec2 delete-route-table --route-table-id "$RT" --region "$AWS_REGION" 2>/dev/null
done
# finally the VPC (only if setup.sh created it — skip if you passed an existing VPC_ID)
aws ec2 delete-vpc --vpc-id "$VPC_ID" --region "$AWS_REGION"
```

> SGs reference each other (three-tier chain), so a `delete-security-group` may fail
> until the SGs that reference it are gone. Re-run the SG loop once if the first pass
> leaves stragglers, or revoke the cross-SG rules first.

---

## Shared cleanup (both tracks)

### ACM certificate + Route 53 records

```bash
# gateway A-record (only if you created it outside CDK, e.g. setup.sh's UPSERT):
#   list it, then DELETE it with the exact alias target via change-resource-record-sets.
# ACM DNS-validation CNAME (always created out of band when you requested the cert):
aws route53 list-resource-record-sets --hosted-zone-id <zoneId> \
  --query "ResourceRecordSets[?contains(Name,'claude-gateway')]" --output json
#   → DELETE each with a change-batch (Action: DELETE, exact Name/Type/TTL/Value).

# the ACM cert itself (must have no in-use associations first — delete the ALB/listener above):
aws acm delete-certificate --certificate-arn <certArn> --region us-east-1
```

### Client VPN (if you built the `docs/connectivity.md` appendix for laptop access)

Disassociate target networks **before** deleting the endpoint, or the delete fails.

```bash
CVPN=<cvpn-endpoint-id>
for A in $(aws ec2 describe-client-vpn-target-networks --client-vpn-endpoint-id "$CVPN" \
    --query 'ClientVpnTargetNetworks[].AssociationId' --output text --region "$AWS_REGION"); do
  aws ec2 disassociate-client-vpn-target-network --client-vpn-endpoint-id "$CVPN" \
    --association-id "$A" --region "$AWS_REGION"
done
# associations take a few minutes to clear; then:
aws ec2 delete-client-vpn-endpoint --client-vpn-endpoint-id "$CVPN" --region "$AWS_REGION"
# delete the VPN's ACM certs (server + client) and its connection-log group:
aws acm delete-certificate --certificate-arn <vpn-server-cert-arn> --region "$AWS_REGION"
aws acm delete-certificate --certificate-arn <vpn-client-cert-arn> --region "$AWS_REGION"
aws logs delete-log-group --log-group-name /claude-gateway/clientvpn --region "$AWS_REGION"
```

### Developer machines

```bash
# remove the machine-wide managed settings that pointed the CLI at the gateway
# (macOS shown; restore any pre-existing corporate file instead of deleting):
sudo rm -f "/Library/Application Support/ClaudeCode/managed-settings.json"
```

---

## Verify nothing's left (and still billing)

The cost items are the NAT gateway, RDS, the ALB, the interface VPC endpoints, and
the Fargate tasks — confirm each is gone:

```bash
aws cloudformation describe-stacks --stack-name ClaudeGatewayStack --region us-east-1 2>&1 | grep -q 'does not exist' && echo "CDK stack: gone"
aws ec2 describe-nat-gateways --region us-east-1 --filter "Name=state,Values=available" \
  --query 'NatGateways[?Tags[?Value==`claude-gateway`]].NatGatewayId' --output text
aws rds describe-db-instances --region us-east-1 \
  --query 'DBInstances[?contains(DBInstanceIdentifier,`claude-gateway`)].DBInstanceIdentifier' --output text
aws elbv2 describe-load-balancers --region us-east-1 \
  --query 'LoadBalancers[?contains(DNSName,`claude-gateway`)].DNSName' --output text 2>/dev/null
aws ec2 describe-vpc-endpoints --region us-east-1 \
  --filters "Name=tag:Project,Values=claude-gateway" --query 'VpcEndpoints[].VpcEndpointId' --output text
aws acm list-certificates --region us-east-1 \
  --query "CertificateSummaryList[?contains(DomainName,'claude-gateway')].CertificateArn" --output text
```

All of those returning empty means teardown is complete and billing has stopped.
