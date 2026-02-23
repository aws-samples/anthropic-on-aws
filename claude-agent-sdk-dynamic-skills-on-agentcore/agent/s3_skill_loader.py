#!/usr/bin/env python3
"""
S3 Skill Loader for Claude Agent SDK

Downloads skills from S3 and creates Claude-compatible skill directory structure.
This enables dynamic skill loading for AgentCore deployments.

Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: MIT-0
"""

import os
import boto3
import yaml
from typing import Dict, Any, Optional

class ClaudeSkillLoader:
    """
    Loads skills from S3 and creates Claude-compatible skill structure.

    Skills are downloaded from S3 into the local .claude/skills/ directory
    where they can be automatically discovered by Claude Agent SDK.
    """

    def __init__(self, skills_bucket: Optional[str] = None, skills_dir: str = '.claude/skills'):
        """
        Initialize the skill loader.

        Args:
            skills_bucket: S3 bucket name (defaults to SKILLS_S3_BUCKET env var)
            skills_dir: Local directory for skills (default: .claude/skills)
        """
        self.s3_client = boto3.client('s3', region_name=os.getenv('AWS_REGION', 'us-east-1'))
        self.skills_bucket = skills_bucket or os.getenv('SKILLS_S3_BUCKET')
        self.skills_dir = skills_dir

        if not self.skills_bucket:
            raise ValueError("Skills bucket must be provided or set in SKILLS_S3_BUCKET environment variable")

    def load_skills_from_s3(self) -> int:
        """
        Load skills from S3 and create local .claude/skills/ structure.

        Returns:
            int: Number of skills successfully loaded
        """
        print(f"🔄 Loading skills from S3 bucket: {self.skills_bucket}")

        # Ensure skills directory exists
        os.makedirs(self.skills_dir, exist_ok=True)

        try:
            # List all skill directories in S3
            response = self.s3_client.list_objects_v2(
                Bucket=self.skills_bucket,
                Prefix='skills/',
                Delimiter='/'
            )

            skills_loaded = 0

            for prefix in response.get('CommonPrefixes', []):
                skill_name = prefix['Prefix'].replace('skills/', '').rstrip('/')
                if skill_name:
                    if self._download_skill(skill_name):
                        skills_loaded += 1

            print(f"✅ Successfully loaded {skills_loaded} skills into {self.skills_dir}/")

            # List downloaded skills for verification
            if skills_loaded > 0:
                self._list_downloaded_skills()

            return skills_loaded

        except Exception as e:
            print(f"❌ Error loading skills from S3: {e}")
            print("🤖 Agent will continue without S3 skills")
            return 0

    def _download_skill(self, skill_name: str) -> bool:
        """
        Download individual skill from S3 to local filesystem.

        Args:
            skill_name: Name of the skill to download

        Returns:
            bool: True if skill was successfully downloaded
        """
        skill_dir = os.path.join(self.skills_dir, skill_name)
        os.makedirs(skill_dir, exist_ok=True)

        try:
            # Download main skill file (SKILL.md)
            skill_key = f'skills/{skill_name}/SKILL.md'
            local_skill_path = os.path.join(skill_dir, 'SKILL.md')

            self.s3_client.download_file(
                self.skills_bucket,
                skill_key,
                local_skill_path
            )

            # Ensure proper YAML frontmatter format
            self._ensure_skill_format(local_skill_path)

            # Download implementation file if it exists (implementation.py)
            try:
                impl_key = f'skills/{skill_name}/implementation.py'
                local_impl_path = os.path.join(skill_dir, 'implementation.py')

                self.s3_client.download_file(
                    self.skills_bucket,
                    impl_key,
                    local_impl_path
                )
                print(f"  📥 Downloaded skill: {skill_name} (with implementation)")

            except Exception:
                # Implementation file is optional
                print(f"  📥 Downloaded skill: {skill_name} (description only)")

            return True

        except Exception as e:
            print(f"  ❌ Failed to download skill {skill_name}: {e}")
            return False

    def _ensure_skill_format(self, skill_path: str) -> None:
        """
        Ensure skill file has proper YAML frontmatter format for Claude SDK.

        Claude Agent SDK expects skills to have YAML frontmatter with metadata.

        Args:
            skill_path: Path to the skill file to validate/fix
        """
        with open(skill_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Check if YAML frontmatter already exists
        if content.startswith('---'):
            return  # Already has proper format

        # Extract description from content
        description = self._extract_skill_description(content)

        # Add YAML frontmatter
        yaml_header = f"""---
description: "{description}"
tags: ["s3-loaded", "dynamic"]
---

"""
        content = yaml_header + content

        # Write back to file
        with open(skill_path, 'w', encoding='utf-8') as f:
            f.write(content)

    def _extract_skill_description(self, content: str) -> str:
        """
        Extract a meaningful description from skill content.

        Args:
            content: Raw skill content

        Returns:
            str: Extracted or default description
        """
        lines = content.split('\n')

        # Look for various description patterns
        for i, line in enumerate(lines):
            line = line.strip()

            # Check for markdown heading
            if line.startswith('# '):
                return line.replace('# ', '').strip()

            # Check for description section
            if line.lower().startswith('## description'):
                if i + 1 < len(lines) and lines[i + 1].strip():
                    return lines[i + 1].strip()

            # Check for first non-empty line as description
            if line and not line.startswith('#'):
                # Truncate if too long
                if len(line) > 100:
                    return line[:97] + "..."
                return line

        return "Dynamically loaded skill from S3"

    def _list_downloaded_skills(self) -> None:
        """List all downloaded skills for verification."""
        print(f"\n📋 Skills available in {self.skills_dir}:")

        try:
            for skill_name in os.listdir(self.skills_dir):
                skill_path = os.path.join(self.skills_dir, skill_name)

                if os.path.isdir(skill_path):
                    skill_file = os.path.join(skill_path, 'SKILL.md')
                    impl_file = os.path.join(skill_path, 'implementation.py')

                    has_impl = os.path.exists(impl_file)
                    impl_indicator = " + implementation" if has_impl else ""

                    if os.path.exists(skill_file):
                        # Extract first line for preview
                        with open(skill_file, 'r', encoding='utf-8') as f:
                            first_line = f.readline().strip()
                            if first_line.startswith('---'):
                                # Skip YAML frontmatter
                                for line in f:
                                    if line.strip() and not line.startswith('---'):
                                        first_line = line.strip()
                                        break

                        print(f"  ✓ {skill_name}{impl_indicator}")
                        print(f"    {first_line[:60]}...")
                    else:
                        print(f"  ❌ {skill_name} (missing SKILL.md)")

        except Exception as e:
            print(f"  ❌ Error listing skills: {e}")

def main():
    """Main entry point for skill loading."""
    try:
        loader = ClaudeSkillLoader()
        skills_count = loader.load_skills_from_s3()

        if skills_count > 0:
            print(f"\n🎯 Skills ready for Claude Agent SDK discovery in {loader.skills_dir}/")
        else:
            print("\n⚠️  No skills loaded - Claude will run without specialized capabilities")

        return skills_count

    except Exception as e:
        print(f"❌ Skill loader initialization failed: {e}")
        return 0

if __name__ == "__main__":
    main()