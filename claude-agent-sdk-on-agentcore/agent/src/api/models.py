"""
Pydantic models for FastAPI request/response validation.

Defines data models for AgentCore Runtime invocations.
"""

from typing import Dict, Any
from pydantic import BaseModel


class InvocationRequest(BaseModel):
    """Request model for AgentCore invocations"""
    input: Dict[str, Any] = {}
    # Support both nested (input.field) and flat (field) payloads
    pr_number: int = None
    repo_full_name: str = None
    pr_url: str = None
    pr_title: str = None
    pr_body: str = ""
    head_sha: str = None
    base_sha: str = None
    diff_url: str = None


class InvocationResponse(BaseModel):
    """Response model for AgentCore invocations"""
    output: Dict[str, Any]
