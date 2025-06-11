#!/bin/bash

# Parse command line arguments
PROFILE=""
STACK_NAME=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --profile)
      PROFILE="--profile $2"
      shift 2
      ;;
    --stack)
      STACK_NAME="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# If stack name not provided, try to get it from CDK outputs
if [ -z "$STACK_NAME" ]; then
    STACK_NAME=$(aws $PROFILE cloudformation describe-stacks --query 'Stacks[?contains(StackName, `ComputerUseAws`)].StackName' --output text)
    if [ -z "$STACK_NAME" ]; then
        echo "Error: Could not determine stack name. Please provide it using --stack option."
        exit 1
    fi
fi

# Convert stack name to lowercase for service names
STACK_NAME_LOWER=$(echo "$STACK_NAME" | tr '[:upper:]' '[:lower:]')

# Get cluster name from CloudFormation outputs
CLUSTER_NAME=$(aws $PROFILE cloudformation describe-stacks --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`ComputerUseAwsClusterName`].OutputValue' --output text)

if [ -z "$CLUSTER_NAME" ]; then
    CLUSTER_NAME="computer-use-aws-cluster"
fi

ENV_SERVICE="computer-use-aws-env-service-${STACK_NAME_LOWER}"
ORCH_SERVICE="computer-use-aws-orch-service-${STACK_NAME_LOWER}"

echo "Using cluster: $CLUSTER_NAME"
echo "Environment service name: $ENV_SERVICE"
echo "Orchestration service name: $ORCH_SERVICE"

echo -e "\nChecking service status..."
aws $PROFILE ecs describe-services --cluster $CLUSTER_NAME --services $ENV_SERVICE $ORCH_SERVICE \
--query 'services[*].[serviceName,status,runningCount,desiredCount,events[0].message]' --output table

echo -e "\nGetting Orchestration Service IP (Front End on port 8080)..."
ORCH_TASK=$(aws $PROFILE ecs list-tasks --cluster $CLUSTER_NAME --service-name $ORCH_SERVICE --query 'taskArns[0]' --output text)
if [ "$ORCH_TASK" != "None" ] && [ ! -z "$ORCH_TASK" ]; then
    ORCH_ENI=$(aws $PROFILE ecs describe-tasks --cluster $CLUSTER_NAME --tasks $ORCH_TASK \
    --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' --output text)
    ORCH_IP=$(aws $PROFILE ec2 describe-network-interfaces --network-interface-ids $ORCH_ENI \
    --query 'NetworkInterfaces[0].Association.PublicIp' --output text)
    echo "Task ARN: $ORCH_TASK"
    echo "ENI: $ORCH_ENI"
    echo "IP Address: $ORCH_IP"
    echo "Orchestration Service URL: http://$ORCH_IP:8080"
else
    echo "No running tasks found for Orchestration Service"
fi

echo -e "\nGetting Environment Service IP (DVC on port 8443)..."
ENV_TASK=$(aws $PROFILE ecs list-tasks --cluster $CLUSTER_NAME --service-name $ENV_SERVICE --query 'taskArns[0]' --output text)
if [ "$ENV_TASK" != "None" ] && [ ! -z "$ENV_TASK" ]; then
    ENV_ENI=$(aws $PROFILE ecs describe-tasks --cluster $CLUSTER_NAME --tasks $ENV_TASK \
    --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' --output text)
    ENV_IP=$(aws $PROFILE ec2 describe-network-interfaces --network-interface-ids $ENV_ENI \
    --query 'NetworkInterfaces[0].Association.PublicIp' --output text)
    echo "Task ARN: $ENV_TASK"
    echo "ENI: $ENV_ENI"
    echo "IP Address: $ENV_IP"
    echo "Environment Service URL: https://$ENV_IP:8443"
else
    echo "No running tasks found for Environment Service"
fi