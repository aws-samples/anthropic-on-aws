"""
Environment configuration for GitHub PR Review Agent.

Provides centralized access to environment variables and configuration.
"""

import os


def setup_environment() -> None:
    """
    Configure environment for Claude Agent SDK to use Bedrock.

    This must be called before importing claude_agent_sdk.
    """
    os.environ['CLAUDE_CODE_USE_BEDROCK'] = '1'


def get_aws_region() -> str:
    """
    Get AWS region from environment.

    Returns:
        AWS region string (default: 'us-east-1')
    """
    return os.environ.get('AWS_REGION', 'us-east-1')


def get_workflow_table_name() -> str:
    """
    Get DynamoDB workflow table name from environment.

    Returns:
        Table name string or None if not set
    """
    return os.environ.get('WORKFLOW_TABLE_NAME')


def get_schedule_group_name() -> str:
    """
    Get EventBridge Scheduler group name from environment.

    Returns:
        Schedule group name or None if not set
    """
    return os.environ.get('SCHEDULE_GROUP_NAME')


def get_github_secret_arn() -> str:
    """
    Get GitHub token Secrets Manager ARN from environment.

    Returns:
        Secret ARN string or None if not set
    """
    return os.environ.get('GITHUB_SECRET_ARN')
