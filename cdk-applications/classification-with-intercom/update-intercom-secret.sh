#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | sed 's/\r$//' | awk '/=/ {print $1}' )
else
    echo ".env file not found"
    exit 1
fi

# Check if INTERCOM_API_TOKEN is set
if [ -z "$INTERCOM_API_TOKEN" ]; then
    echo "INTERCOM_API_TOKEN is not set in the .env file"
    exit 1
fi

# Set the secret name and region
SECRET_NAME="intercomApiToken"
AWS_REGION=${AWS_REGION:-"us-east-1"}  # Default to us-east-1 if not set

# Update the secret
aws secretsmanager update-secret \
    --secret-id "$SECRET_NAME" \
    --secret-string "$INTERCOM_API_TOKEN" \
    --region "$AWS_REGION" \
    > /dev/null 2>&1;

if [ $? -eq 0 ]; then
    echo "Secret updated successfully"
else
    echo "Failed to update secret"
    exit 1
fi
