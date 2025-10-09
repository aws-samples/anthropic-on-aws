#!/bin/bash

# Unified deployment script for Claude Code on AgentCore
# This script:
# 1. Deploys CloudFormation stack (IAM, S3, ECR)
# 2. Builds and pushes Docker image
# 3. Deploys AgentCore runtime
# 4. Saves deployment info

set -e

STACK_NAME="claude-code-agent-memory-stack"
REGION="${AWS_REGION:-us-east-1}"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║       Claude Code Agent - Unified Deployment Script           ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "📍 Region: $REGION"
echo "📦 Stack:  $STACK_NAME"
echo ""

# Step 1: Deploy CloudFormation stack
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 1: Deploying CloudFormation stack..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

aws cloudformation deploy \
    --template-file infrastructure.yaml \
    --stack-name "$STACK_NAME" \
    --capabilities CAPABILITY_NAMED_IAM \
    --region "$REGION" \
    --no-fail-on-empty-changeset

echo "✅ CloudFormation stack deployed"
echo ""

# Step 2: Setup AgentCore Memory (if not exists)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 2: Setting up AgentCore Memory..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

SSM_MEMORY_PARAM="/claude-code-agent/memory-id"
MEMORY_NAME="ClaudeCodeAgentMemory"

# Check if memory ID exists in SSM
EXISTING_MEMORY_ID=$(aws ssm get-parameter --name "$SSM_MEMORY_PARAM" --region "$REGION" --query 'Parameter.Value' --output text 2>/dev/null || echo "")

if [ -n "$EXISTING_MEMORY_ID" ]; then
    echo "📖 Found existing memory ID in SSM: $EXISTING_MEMORY_ID"
    
    # Verify memory still exists in AgentCore
    MEMORY_EXISTS=$(aws bedrock-agentcore list-memories --region "$REGION" --query "memories[?id=='$EXISTING_MEMORY_ID'].id" --output text 2>/dev/null || echo "")
    
    if [ -n "$MEMORY_EXISTS" ]; then
        echo "✅ Memory is valid and active"
        MEMORY_ID="$EXISTING_MEMORY_ID"
    else
        echo "⚠️  Memory ID in SSM not found in AgentCore, will create new one"
        EXISTING_MEMORY_ID=""
    fi
fi

# If no valid memory found, create or find one
if [ -z "$EXISTING_MEMORY_ID" ]; then
    echo "🔄 Checking for existing memory by name..."
    
    # Try to find memory by name
    FOUND_MEMORY_ID=$(aws bedrock-agentcore list-memories --region "$REGION" --query "memories[?name=='$MEMORY_NAME'].id | [0]" --output text 2>/dev/null || echo "")
    
    if [ -n "$FOUND_MEMORY_ID" ] && [ "$FOUND_MEMORY_ID" != "None" ]; then
        echo "📋 Found existing memory: $FOUND_MEMORY_ID"
        MEMORY_ID="$FOUND_MEMORY_ID"
    else
        echo "🔄 Creating new memory resource..."
        
        # Create memory using Python inline script (simpler than pure bash for JSON)
        MEMORY_ID=$(python3 << PYTHON_MEMORY_SCRIPT
import boto3
import sys
from bedrock_agentcore.memory import MemoryClient
from bedrock_agentcore.memory.constants import StrategyType

region = "$REGION"
memory_name = "$MEMORY_NAME"

try:
    memory_client = MemoryClient(region_name=region)
    
    strategies = [
        {
            StrategyType.SEMANTIC.value: {
                "name": "fact_extractor",
                "description": "Extracts and stores factual information about coding patterns",
                "namespaces": ["coding/user/{actorId}/facts"]
            }
        },
        {
            StrategyType.SUMMARY.value: {
                "name": "conversation_summary",
                "description": "Captures summaries of coding conversations",
                "namespaces": ["coding/user/{actorId}/{sessionId}"]
            }
        },
        {
            StrategyType.USER_PREFERENCE.value: {
                "name": "user_preferences",
                "description": "Captures user coding preferences",
                "namespaces": ["coding/user/{actorId}/preferences"]
            }
        }
    ]
    
    memory = memory_client.create_memory_and_wait(
        name=memory_name,
        strategies=strategies,
        description="Memory for Claude Code autonomous agent",
        event_expiry_days=30,
    )
    
    print(memory['id'])
    
except Exception as e:
    if "already exists" in str(e).lower():
        # Memory exists, find it
        memories = memory_client.list_memories()
        memory_id = next((m['id'] for m in memories if m.get('name') == memory_name), None)
        if memory_id:
            print(memory_id)
        else:
            sys.stderr.write(f"Error: Could not find memory\n")
            sys.exit(1)
    else:
        sys.stderr.write(f"Error: {e}\n")
        sys.exit(1)
PYTHON_MEMORY_SCRIPT
)
        
        if [ $? -eq 0 ] && [ -n "$MEMORY_ID" ]; then
            echo "✅ Memory created successfully: $MEMORY_ID"
        else
            echo "❌ Failed to create memory"
            exit 1
        fi
    fi
    
    # Store memory ID in SSM
    aws ssm put-parameter \
        --name "$SSM_MEMORY_PARAM" \
        --value "$MEMORY_ID" \
        --type String \
        --overwrite \
        --description "Memory ID for Claude Code Agent" \
        --region "$REGION" > /dev/null
    
    echo "🔐 Stored memory ID in SSM: $SSM_MEMORY_PARAM"
fi

echo "✅ Memory setup complete: $MEMORY_ID"
echo ""

# Step 3: Get CloudFormation outputs
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 3: Retrieving stack outputs..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

ROLE_ARN=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`RoleArn`].OutputValue' \
    --output text)

OUTPUT_BUCKET=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`OutputBucketName`].OutputValue' \
    --output text)

ECR_URI=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`EcrRepositoryUri`].OutputValue' \
    --output text)

ACCOUNT_ID=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`AccountId`].OutputValue' \
    --output text)

echo "✅ Role ARN:       $ROLE_ARN"
echo "✅ Output Bucket:  $OUTPUT_BUCKET"
echo "✅ ECR URI:        $ECR_URI"
echo "✅ Account ID:     $ACCOUNT_ID"
echo ""

# Step 4: Setup Docker buildx
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 4: Setting up Docker buildx..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if ! docker buildx ls | grep -q claude-code-builder; then
    docker buildx create --name claude-code-builder --use
else
    docker buildx use claude-code-builder
fi

docker buildx inspect --bootstrap
echo "✅ Docker buildx ready"
echo ""

# Step 5: Build and push Docker image
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 5: Building and pushing Docker image..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Login to ECR
aws ecr get-login-password --region "$REGION" | \
    docker login --username AWS --password-stdin "${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"

echo "✅ Logged in to ECR"

# Build and push image
IMAGE_URI="${ECR_URI}:latest"
echo "Building image: $IMAGE_URI"
echo "Output bucket: $OUTPUT_BUCKET"

docker buildx build \
    --platform linux/arm64 \
    --build-arg OUTPUT_BUCKET_NAME="$OUTPUT_BUCKET" \
    -t "$IMAGE_URI" \
    --push \
    .

echo "✅ Image pushed to ECR"
echo ""

# Step 6: Deploy AgentCore runtime using Python script
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 6: Deploying AgentCore runtime..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Export variables for Python script to use
export STACK_NAME
export ROLE_ARN
export IMAGE_URI
export OUTPUT_BUCKET
export REGION
export ACCOUNT_ID

python3 << 'PYTHON_SCRIPT'
import os
import json
import boto3

stack_name = os.environ['STACK_NAME']
role_arn = os.environ['ROLE_ARN']
image_uri = os.environ['IMAGE_URI']
output_bucket = os.environ['OUTPUT_BUCKET']
region = os.environ['REGION']
account_id = os.environ['ACCOUNT_ID']

agentcore_client = boto3.client('bedrock-agentcore-control', region_name=region)
# Runtime name must match pattern: [a-zA-Z][a-zA-Z0-9_]{0,47}
# Replace hyphens with underscores to comply with AgentCore naming rules
runtime_name = f"claude_code_agent_{stack_name}".replace('-', '_')

print(f"Deploying runtime: {runtime_name}")
print(f"  Image: {image_uri}")
print(f"  Role:  {role_arn}")

try:
    # Check if runtime already exists
    existing_runtimes = agentcore_client.list_agent_runtimes()

    runtime_arn = None
    for runtime in existing_runtimes.get('agentRuntimes', []):
        if runtime['agentRuntimeName'] == runtime_name:
            print(f"ℹ️  Runtime already exists, updating...")
            response = agentcore_client.update_agent_runtime(
                agentRuntimeId=runtime['agentRuntimeId'],
                agentRuntimeArtifact={
                    'containerConfiguration': {
                        'containerUri': image_uri
                    }
                },
                roleArn=role_arn,
                networkConfiguration={'networkMode': 'PUBLIC'}
            )
            runtime_arn = runtime['agentRuntimeArn']
            print(f"✅ Updated runtime")
            break

    if not runtime_arn:
        # Create new runtime
        response = agentcore_client.create_agent_runtime(
            agentRuntimeName=runtime_name,
            agentRuntimeArtifact={
                'containerConfiguration': {
                    'containerUri': image_uri
                }
            },
            networkConfiguration={'networkMode': 'PUBLIC'},
            roleArn=role_arn,
            description='Claude Code autonomous coding agent'
        )
        runtime_arn = response['agentRuntimeArn']
        print(f"✅ Created runtime")

    # Save deployment info
    deployment_info = {
        'stack_name': stack_name,
        'runtime_arn': runtime_arn,
        'image_uri': image_uri,
        'output_bucket': output_bucket,
        'region': region,
        'account_id': account_id,
        'role_arn': role_arn
    }

    with open('deployment.json', 'w') as f:
        json.dump(deployment_info, f, indent=2)

    print(f"✅ Saved deployment info to deployment.json")
    print(f"\nRuntime ARN: {runtime_arn}")

except Exception as e:
    print(f"❌ Error: {e}")
    exit(1)

PYTHON_SCRIPT

echo ""

# Step 7: Display success message
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ DEPLOYMENT SUCCESSFUL!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Quick start:"
echo "  ./invoke_claude_code.sh \"Create a simple hello world app\""
echo ""
echo "📊 View deployment info:"
echo "  ./show_agent_info.sh"
echo ""
echo "📥 Download generated files:"
echo "  ./download_outputs.sh"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
