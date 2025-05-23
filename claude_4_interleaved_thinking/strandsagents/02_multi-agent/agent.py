#strandsagents/02_multi-agent/agent.py
# Standard library imports
from typing import Dict, Any, Optional, List

# Third-party imports
from strands import Agent
from strands.models import BedrockModel

# Local application imports
from tool_agents import calculator_agent, database_agent

# Select the appropriate Claude model
# MODEL_ID = "us.anthropic.claude-sonnet-4-20250514-v1:0"  # Claude 4 Sonnet
MODEL_ID = "anthropic.claude-opus-4-20250514-v1:0"  # Claude 4 Opus
REGION_NAME = "us-west-2"

def create_revenue_calculator_agent(
    model_id: str = MODEL_ID, 
    region_name: str = REGION_NAME
) -> Agent:
    """Create a Strands orchestrator agent that delegates to specialized agents.
    
    This orchestrator acts as a manager that coordinates specialized agents for different
    tasks. It delegates mathematical calculations to the calculator_agent and database
    queries to the database_agent, then synthesizes their responses into a coherent
    answer for the user.
    
    Args:
        model_id: The Claude model ID to use for the orchestrator
        region_name: AWS region name for Bedrock API access
    
    Returns:
        Configured Strands orchestrator agent that can delegate to specialized agents
        
    Examples:
        >>> agent = create_revenue_calculator_agent()
        >>> response = agent("Which product has the highest profit margin for 200 units?")
    """
    # Configure the bedrock model for the orchestrator agent
    bedrock_model = BedrockModel(
        model_id=model_id,
        region_name=region_name,
        temperature=0.7,
        max_tokens=4000,
        additionalModelRequestFields={
            "anthropic_beta": ["interleaved-thinking-2025-05-14"],
            "reasoning_config": {"type": "enabled", "budget_tokens": 3000},
        },
    )

    # Create orchestrator agent with specialized agents as tools
    agent = Agent(
        model=bedrock_model,
        tools=[calculator_agent, database_agent],
        system_prompt="""
        You are a revenue calculator assistant that orchestrates specialized agents to help calculate
        total revenue based on product data.
        
        You have access to two specialized agents:
        1. The calculator_agent - For mathematical calculations and numerical processing
        2. The database_agent - For querying product information from the database

        To be efficient resolving user requests you are allowed to call agents in parallel
        
        Your role as an orchestrator is to:
        - Understand the user's request and create a clear plan
        - Delegate calculations to the calculator_agent
        - Delegate database queries to the database_agent
        - Synthesize the information from both agents into a coherent response
        
        Always follow this process:
        1. Create a step-by-step plan first
        2. Delegate appropriate subtasks to specialized agents
        3. Explain your reasoning at each logical step
        4. Synthesize the information into a clear final answer
        
        Avoid attempting calculations or database queries yourself - always delegate to the specialized agents.
        """,
    )

    return agent
