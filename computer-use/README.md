# Computer Use AWS Infrastructure

This project contains the AWS CDK infrastructure code for deploying the Computer Use AWS application in the us-west-2 (Oregon) region. The infrastructure includes ECS Fargate services, ECR repositories, and all necessary networking components.

## Project Structure

```
ComputerUseAWS/
├── README.md
├── app.py
├── cdk.json
├── computer_use_aws_stack.py
├── requirements.txt
├── scripts/
│   └── get_urls.sh
├── computer_use_aws/
│   ├── environment_image/
│   │   ├── computer_use_demo/
│   │   ├── image/
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   └── orchestration_image/
│       ├── computer_use_demo/
│       ├── Dockerfile
│       └── requirements.txt
└── tests/
    ├── integration/
    └── unit/
```

## Prerequisites

1. AWS CLI installed and configured with us-west-2 region
2. Python 3.7 or later
3. Node.js 14.x or later (required for CDK)
4. Docker installed and running
5. AWS CDK CLI installed (`npm install -g aws-cdk`)

## Quick Start
1. Clone the repository:
```bash
git clone git@ssh.gitlab.aws.dev:jonaevau/ComputerUseAWS.git
cd ComputerUseAWS
```

2. Make the gets_urls.sh cript executable:
```bash
chmod +x scripts/gets_urls.sh
```

3. Configure AWS CLI for us-west-2 (if not already configured):
```bash
aws configure set default.region us-west-2
```

4. Create virtual environment:
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows use: .venv\Scripts\activate
```

5. Install the required dependencies:
```bash
pip install -r requirements.txt
```

6. Bootstrap CDK in us-west-2 (if you haven't already):
```bash
cdk bootstrap aws://ACCOUNT-NUMBER/us-west-2
```

7. Deploy the solution in **Fail-Secure Mode** (Default). In this mode, if no IP address is provided, the security groups will default to a highly restrictive setting (255.255.255.255/32) that effectively blocks all access. This is the recommended setting for the sandbox environment.

```bash
# Deploy with your current IP (Fail-Secure)
cdk deploy --context deployer_ip=$(curl -s https://api.ipify.org)

# Deploy with manual IP (Fail-Secure)
cdk deploy --context deployer_ip=203.0.113.1
# This will automatically be converted to 203.0.113.1/32

# Deploy with IP address range (Fail-Secure)
cdk deploy --context deployer_ip=203.0.113.0/24 
# Allows 203.0.113.0 through 203.0.113.255
```

**Note**: This stack takes ~10-15 minutes to deploy. After the deployment it may take a few additional minutes for the Environment/Virtual Machine to come online

8. After the deploy has completed, you can cet the URLs of the services:
```bash
./scripts/get_urls.sh
```

**Note**:If you are using aws profiles append --profile <profile name> to the command line if not provided "default" is assumed
```bash
./scripts/get_urls.sh --profile <your profile name>
```


## Usage

Navigate to the links provided in the output of the `get_urls.sh` script to access the services, the Orchestration Service URL and Environment Service URL.

The DCV **username** is `computeruse` and the **password** is `admin`. DCV is used to connect to the environment container for remote desktop access, for activities such as resetting the state of the environment, or elliciting the state of the environment prior to a new task.

The Streamlit interface is used to configure the API provider, model, and other parameters for the environment container. Then ultimately instruct the model via a chat interface to perform tasks.

## GUI Access

After navigating to the Orchestration Service URL (Streamlit interface), you'll need to log in:

1. Default credentials:
   - **Username:** `admin`
   - **Password:** `computeruse`

2. After successful login, you'll see:
   - Configuration panel in the sidebar
   - Chat interface in the main area
   - HTTP Exchange Logs tab for debugging

Note: The session will timeout after 60 minutes of inactivity, requiring you to log in again.

## Infrastructure Components

- **VPC**: Configured with public and private subnets across 2 AZs in us-west-2
- **ECR Repository**: Single repository for both environment and orchestration images
- **ECS Cluster**: Fargate cluster for running containers
- **Task Definition**: Includes both containers with appropriate port mappings
- **Security Groups**: 
  - Environment container: Accepts traffic only from orchestration container
  - Orchestration container: Accepts public traffic on port 8501
- **IAM Roles**: Task execution role with minimal permissions
- **CloudWatch Logs**: Configured for container logging
- **KMS**: Encryption key for secure storage

## Container Ports

- **Environment Container**:
  - 8443: DCV
  - 5000: Flask Control API
- **Orchestration Container**:
  - 8501: Streamlit interface

## Monitoring

- Container insights enabled for the ECS cluster
- CloudWatch logs configured with KMS encryption
- VPC flow logs enabled for network monitoring
- All logs retained for one month

## Troubleshooting

1. If deployment fails:
```bash
# Check AWS credentials
aws sts get-caller-identity

# Check CloudFormation events
aws cloudformation describe-stack-events --stack-name ComputerUseAwsStack
```

2. If containers fail to start:
```bash
# Check ECS service events
aws ecs describe-services --cluster computer-use-aws-cluster --services computer-use-aws-service-computeruseawsstack

# Check container logs
aws logs get-log-events --log-group-name /ecs/computer-use-aws-computeruseawsstack
```

## Clean Up

To destroy the infrastructure:
```bash
cdk destroy
```
