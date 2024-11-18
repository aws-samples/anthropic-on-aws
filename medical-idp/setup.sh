#!/bin/bash

# Set the Guardrail ID
export GUARDRAIL_ID="<TODO: ENTER GUARDRAIL ID HERE>"

# Set the Guardrail Version
export GUARDRAIL_VERSION="DRAFT" # Change this to use a specific version of the guardrail

# Print the values to confirm
echo "GUARDRAIL_ID set to: $GUARDRAIL_ID"
echo "GUARDRAIL_VERSION set to: $GUARDRAIL_VERSION"

# Optionally, you can add more environment variables here if needed

# Note: Running this script directly won't affect your current shell session.
# You need to source it for the variables to be available in your current session.
