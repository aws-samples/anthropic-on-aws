#!/bin/bash

##############################################################################
# GitHub Agent Automation - CDK Deployment Script
#
# This script deploys the CDK infrastructure stack with proper validation
# and error handling.
#
# Usage:
#   ./deploy.sh [environment] [--no-approval]
#
# Arguments:
#   environment: dev, staging, or prod (default: dev)
#   --no-approval: Skip manual approval for changes (optional)
#
# Examples:
#   ./deploy.sh dev
#   ./deploy.sh prod --no-approval
##############################################################################

set -e  # Exit on error
set -u  # Exit on undefined variable

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory (infrastructure/)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Default values
ENVIRONMENT="${1:-dev}"
REQUIRE_APPROVAL="true"

# Parse arguments
shift || true  # Remove first argument (environment)
while [[ $# -gt 0 ]]; do
  case $1 in
    --no-approval)
      REQUIRE_APPROVAL="false"
      shift
      ;;
    *)
      echo -e "${RED}Unknown argument: $1${NC}"
      exit 1
      ;;
  esac
done

##############################################################################
# FUNCTIONS
##############################################################################

log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

##############################################################################
# VALIDATION
##############################################################################

log_info "Starting deployment for environment: $ENVIRONMENT"

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
  log_error "Invalid environment: $ENVIRONMENT"
  log_error "Must be one of: dev, staging, prod"
  exit 1
fi

# Check if .env file exists
if [[ ! -f "$SCRIPT_DIR/.env" ]]; then
  log_error ".env file not found"
  log_info "Please create .env file from .env.example:"
  log_info "  cp .env.example .env"
  log_info "  # Edit .env with your AWS account details"
  exit 1
fi

# Source .env file
set -a  # Export all variables
source "$SCRIPT_DIR/.env"
set +a

# Validate required environment variables
if [[ -z "${AWS_ACCOUNT_ID:-}" ]]; then
  log_error "AWS_ACCOUNT_ID not set in .env"
  exit 1
fi

if [[ -z "${AWS_REGION:-}" ]]; then
  log_error "AWS_REGION not set in .env"
  exit 1
fi

log_success "Environment variables loaded"
log_info "  AWS Account: $AWS_ACCOUNT_ID"
log_info "  AWS Region: $AWS_REGION"
log_info "  Environment: $ENVIRONMENT"

##############################################################################
# PREREQUISITES
##############################################################################

log_info "Checking prerequisites..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
  log_error "Node.js is not installed"
  log_info "Please install Node.js: https://nodejs.org/"
  exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
  log_error "npm is not installed"
  exit 1
fi

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
  log_error "AWS CLI is not installed"
  log_info "Please install AWS CLI: https://aws.amazon.com/cli/"
  exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
  log_error "AWS credentials not configured"
  log_info "Please configure AWS credentials:"
  log_info "  aws configure"
  exit 1
fi

log_success "Prerequisites check passed"

##############################################################################
# INSTALL DEPENDENCIES
##############################################################################

log_info "Installing npm dependencies..."

cd "$SCRIPT_DIR"

if [[ ! -d "node_modules" ]]; then
  npm install
else
  log_info "Dependencies already installed (skipping)"
fi

log_success "Dependencies installed"

##############################################################################
# BUILD CDK
##############################################################################

log_info "Building CDK project..."

npm run build

if [[ $? -ne 0 ]]; then
  log_error "Build failed"
  exit 1
fi

log_success "Build completed"

##############################################################################
# CDK BOOTSTRAP (if needed)
##############################################################################

log_info "Checking CDK bootstrap status..."

# Check if CDK is bootstrapped in this account/region
if ! aws cloudformation describe-stacks \
  --stack-name CDKToolkit \
  --region "$AWS_REGION" \
  &> /dev/null; then

  log_warning "CDK is not bootstrapped in this account/region"
  log_info "Bootstrapping CDK..."

  npx cdk bootstrap "aws://$AWS_ACCOUNT_ID/$AWS_REGION"

  if [[ $? -ne 0 ]]; then
    log_error "CDK bootstrap failed"
    exit 1
  fi

  log_success "CDK bootstrap completed"
else
  log_info "CDK already bootstrapped"
fi

##############################################################################
# CDK SYNTH
##############################################################################

log_info "Synthesizing CloudFormation template..."

npx cdk synth --context environment="$ENVIRONMENT"

if [[ $? -ne 0 ]]; then
  log_error "CDK synth failed"
  exit 1
fi

log_success "CloudFormation template synthesized"

##############################################################################
# CDK DEPLOY
##############################################################################

log_info "Deploying CDK stack..."

if [[ "$REQUIRE_APPROVAL" == "true" ]]; then
  log_info "Manual approval required for changes"
  npx cdk deploy \
    --context environment="$ENVIRONMENT" \
    --require-approval broadening
else
  log_warning "Skipping manual approval (--no-approval flag)"
  npx cdk deploy \
    --context environment="$ENVIRONMENT" \
    --require-approval never
fi

if [[ $? -ne 0 ]]; then
  log_error "CDK deploy failed"
  exit 1
fi

log_success "CDK stack deployed successfully"

##############################################################################
# POST-DEPLOYMENT INSTRUCTIONS
##############################################################################

log_success "Deployment complete!"
echo ""
log_info "Next steps:"
echo ""
echo "  1. Add GitHub Personal Access Token to Secrets Manager:"
echo "     aws secretsmanager put-secret-value \\"
echo "       --secret-id <GithubSecretArn from outputs> \\"
echo "       --secret-string '{\"token\":\"your-github-pat\"}'"
echo ""
echo "  2. Add Anthropic API Key to Secrets Manager:"
echo "     aws secretsmanager put-secret-value \\"
echo "       --secret-id <AnthropicSecretArn from outputs> \\"
echo "       --secret-string '{\"apiKey\":\"your-anthropic-key\"}'"
echo ""
echo "  3. Build and push agent Docker image to ECR:"
echo "     cd ../agent"
echo "     ./build-and-push.sh"
echo ""
echo "  4. Configure GitHub webhook:"
echo "     - Go to your GitHub repository settings"
echo "     - Add webhook with URL from WebhookUrl output"
echo "     - Set content type to 'application/json'"
echo "     - Select 'pull_request' events"
echo ""
log_info "View CloudFormation outputs:"
echo "  aws cloudformation describe-stacks \\"
echo "    --stack-name github-agent-automation-$ENVIRONMENT \\"
echo "    --region $AWS_REGION \\"
echo "    --query 'Stacks[0].Outputs'"
echo ""
