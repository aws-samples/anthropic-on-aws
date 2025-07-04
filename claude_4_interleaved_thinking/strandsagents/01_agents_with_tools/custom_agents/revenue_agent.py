#strandsagents/01_agents_with_tools/custom_agents/revenue_agent.py
# Standard library imports
from typing import Optional

# Third-party imports
from botocore.config import Config as BotocoreConfig
from strands import Agent
from strands.models import BedrockModel

# Local application imports
# None required

# Create a boto client config with custom settings
boto_config = BotocoreConfig(
    retries={"max_attempts": 8, "mode": "adaptive"},
    connect_timeout=5,
    read_timeout=1000,
)

# Select the appropriate Claude model
MODEL_ID = "us.anthropic.claude-sonnet-4-20250514-v1:0"  # Claude 4 Sonnet


def create_revenue_calculator_agent(
    model_id: str = MODEL_ID, 
    region_name: str = "us-west-2"
) -> Agent:
    """Create a Strands agent for calculating revenue with the specified Claude model.
    
    Constructs an agent with database query and calculator tools to assist with
    revenue calculations based on product data. The agent can query product information
    and perform precise calculations.
    
    Args:
        model_id: The Claude model ID to use for the agent
        region_name: AWS region name for Bedrock API access
    
    Returns:
        Configured Strands agent ready to process revenue calculation queries
    
    Examples:
        >>> agent = create_revenue_calculator_agent()
        >>> response = agent("Which product has the highest profit margin?")
    """
    # Configure the bedrock model
    bedrock_model = BedrockModel(
        boto_client_config=boto_config,  # Configure our client based on boto_config above
        model_id=model_id,
        region_name=region_name,
        temperature=0.3,
        max_tokens=8000,
        cache_tools="default",  # recommended - enable tool caching optional
        cache_prompt="default",  # optional - enable system prompt caching
        additional_request_fields={
            "anthropic_beta": ["interleaved-thinking-2025-05-14"],
            "reasoning_config": {"type": "enabled", "budget_tokens": 6000},
        },
    )

    # Create agent with tools from the tools directory
    agent = Agent(
        model=bedrock_model,
        system_prompt="""
        You are a revenue calculator assistant that helps calculate total revenue based on product data.
        You have access to two tools:
        1. A database query tool to look up products
        2. A calculator to ensure accuracy in your calculations
        In order to be efficient when aswering requests, you are allowed to make parallel tool calls

        When calculating revenue:
        - Always create a complete step-by-step plan first
        - Enumerate and explain your reasoning at each logical step
        - Use the calculator tool for all calculations to ensure accuracy
        - Provide a clear final answer
        """,
    )

    return agent
