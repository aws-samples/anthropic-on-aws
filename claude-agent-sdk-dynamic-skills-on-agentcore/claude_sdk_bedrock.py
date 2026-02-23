#!/usr/bin/env python3
"""
Claude Agent with Dynamic Skills - Simple Implementation

This demonstrates the simplest approach to dynamic skill loading with Claude SDK.
Skills are loaded from S3 at startup and injected into the system prompt.

Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: MIT-0
"""

import os
import boto3
import anthropic
from bedrock_agentcore.runtime import BedrockAgentCoreApp

# Configuration from environment variables
AWS_REGION = os.getenv('AWS_REGION', 'us-east-1')
SKILLS_S3_BUCKET = os.getenv('SKILLS_S3_BUCKET')  # Set during setup process
MODEL_ID = os.getenv('ANTHROPIC_MODEL', 'us.anthropic.claude-sonnet-4-20250514-v1:0')

# Initialize AWS and Claude clients
s3_client = boto3.client('s3', region_name=AWS_REGION)
claude_client = anthropic.AnthropicBedrock(aws_region=AWS_REGION)

# Global skills registry
SKILLS = {}

def load_skills():
    """Load skill definitions from S3 at startup."""
    global SKILLS

    if not SKILLS_S3_BUCKET:
        print("⚠️  SKILLS_S3_BUCKET environment variable not set")
        return

    try:
        print(f"🔄 Loading skills from S3 bucket: {SKILLS_S3_BUCKET}")

        response = s3_client.list_objects_v2(
            Bucket=SKILLS_S3_BUCKET,
            Prefix='skills/',
            Delimiter='/'
        )

        for prefix in response.get('CommonPrefixes', []):
            skill_name = prefix['Prefix'].replace('skills/', '').rstrip('/')
            if skill_name:
                try:
                    # Download skill description
                    skill_obj = s3_client.get_object(
                        Bucket=SKILLS_S3_BUCKET,
                        Key=f'skills/{skill_name}/SKILL.md'
                    )
                    skill_content = skill_obj['Body'].read().decode('utf-8')

                    # Extract first 200 characters for system prompt
                    SKILLS[skill_name] = skill_content[:200]
                    print(f"  ✅ Loaded skill: {skill_name}")

                except Exception as e:
                    print(f"  ❌ Failed to load skill {skill_name}: {e}")
                    SKILLS[skill_name] = f"Skill: {skill_name} (description unavailable)"

        print(f"🎯 Successfully loaded {len(SKILLS)} skills from S3")

    except Exception as e:
        print(f"❌ Error loading skills from S3: {e}")
        print("🤖 Agent will run without skills")

# Load skills at module import time
load_skills()

# Initialize AgentCore app
app = BedrockAgentCoreApp()

@app.entrypoint
def handler(event, context):
    """
    AgentCore entrypoint handler using Claude SDK with S3-loaded skills.

    Args:
        event: Request event from AgentCore
        context: Lambda-style context (not used)

    Returns:
        dict: Response with agent output and metadata
    """
    prompt = event.get('prompt', 'Hello') if event else 'Hello'

    # Build system prompt with available skills
    if SKILLS:
        skills_info = "\n".join([
            f"- {name}: {desc.strip()}"
            for name, desc in SKILLS.items()
        ])
        system_prompt = f"""You are a helpful AI assistant with specialized skills loaded dynamically from S3.

Available skills:
{skills_info}

When users ask about your capabilities or request specific tasks, reference these skills appropriately.
You can perform analysis, research, data processing, and document generation based on the loaded skills."""
    else:
        system_prompt = "You are a helpful AI assistant. No specialized skills are currently loaded."

    try:
        # Call Claude via Bedrock
        response = claude_client.messages.create(
            model=MODEL_ID,
            max_tokens=1024,
            system=system_prompt,
            messages=[{"role": "user", "content": prompt}]
        )

        return {
            "response": response.content[0].text,
            "skills_loaded": len(SKILLS),
            "skills_available": list(SKILLS.keys()),
            "implementation": "simple_s3_injection",
            "s3_bucket": SKILLS_S3_BUCKET
        }

    except Exception as e:
        return {
            "error": f"Claude API error: {str(e)}",
            "skills_loaded": len(SKILLS),
            "implementation": "simple_s3_injection"
        }

if __name__ == "__main__":
    # For local testing
    app.run()