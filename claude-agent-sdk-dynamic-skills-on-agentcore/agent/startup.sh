#!/bin/bash
#
# Container Startup Script for Claude Agent with Dynamic Skills
#
# This script orchestrates the container startup process:
# 1. Load skills from S3 into .claude/skills/ directory
# 2. Verify skills are properly formatted
# 3. Start the Claude agent with loaded skills
#
# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0
#

set -e  # Exit on any error

echo "🚀 Starting Claude Agent with Dynamic S3 Skill Loading..."
echo "📍 Working directory: $(pwd)"
echo "🌍 Environment:"
echo "  - AWS_REGION: ${AWS_REGION:-us-east-1}"
echo "  - SKILLS_S3_BUCKET: ${SKILLS_S3_BUCKET:-not set}"
echo "  - ANTHROPIC_MODEL: ${ANTHROPIC_MODEL:-default}"
echo ""

# Step 1: Load skills from S3 into .claude/skills/ directory
echo "📦 Step 1: Loading skills from S3..."
python /app/s3_skill_loader.py
skill_load_status=$?

if [ $skill_load_status -eq 0 ]; then
    echo "✅ Skill loading completed successfully"
else
    echo "⚠️  Skill loading completed with warnings (exit code: $skill_load_status)"
fi
echo ""

# Step 2: Verify and list loaded skills
echo "📋 Step 2: Verifying loaded skills..."

if [ -d ".claude/skills" ]; then
    skill_count=$(find .claude/skills -maxdepth 1 -type d | tail -n +2 | wc -l)
    echo "📁 Skills directory exists with $skill_count skill directories:"

    # List skill directories with details
    for skill_dir in .claude/skills/*/; do
        if [ -d "$skill_dir" ]; then
            skill_name=$(basename "$skill_dir")
            echo "  📂 $skill_name"

            # Check for SKILL.md file
            if [ -f "$skill_dir/SKILL.md" ]; then
                # Show first meaningful line (skip YAML frontmatter)
                first_line=$(grep -v '^---' "$skill_dir/SKILL.md" | grep -v '^$' | head -n 1 | cut -c1-50)
                echo "    📄 SKILL.md: ${first_line}..."
            else
                echo "    ❌ Missing SKILL.md file"
            fi

            # Check for implementation file
            if [ -f "$skill_dir/implementation.py" ]; then
                echo "    🐍 Has implementation.py"
            fi
        fi
    done

    if [ $skill_count -eq 0 ]; then
        echo "⚠️  No skill directories found in .claude/skills/"
    fi
else
    echo "❌ .claude/skills directory not found - creating empty directory"
    mkdir -p .claude/skills
fi
echo ""

# Step 3: Display environment info
echo "🔧 Step 3: Environment verification..."
echo "Python version: $(python --version)"
echo "Available packages:"
python -c "import anthropic, boto3, bedrock_agentcore; print('  ✓ All required packages available')" 2>/dev/null || echo "  ❌ Missing required packages"

# Check AWS credentials
if aws sts get-caller-identity > /dev/null 2>&1; then
    echo "  ✓ AWS credentials configured"
else
    echo "  ❌ AWS credentials not available"
fi
echo ""

# Step 4: Start the Claude agent
echo "🤖 Step 4: Starting Claude Agent..."
echo "Entry point: $*"
echo "Starting agent at $(date)"
echo ""

# Execute the provided command (agent.py)
exec python "$@"