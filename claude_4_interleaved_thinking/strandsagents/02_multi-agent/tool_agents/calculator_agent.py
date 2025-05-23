# tool_agents/calculator_agent.py
from typing import Union
from strands import Agent, tool
from strands.models import BedrockModel
from tools.calculator import calculator

AGENT_MODEL_ID = "us.anthropic.claude-sonnet-4-20250514-v1:0"
REGION_NAME = "us-west-2"

@tool
def calculator_agent(expression: str) -> str:
    """Specialized agent for performing mathematical calculations accurately.
    
    Creates and invokes a specialized calculator agent that uses the calculator tool
    to evaluate mathematical expressions. The agent provides explanation for complex
    calculations and handles various mathematical notations.
    
    Args:
        expression: A mathematical problem or expression to solve. Can include basic 
            arithmetic operations, complex formulas, or word problems requiring calculation.
    
    Returns:
        The calculated result with step-by-step explanation when appropriate.
        In error cases, returns an error message prefixed with "Error in calculator agent:".
    
    Examples:
        >>> calculator_agent("2 + 2")
        "4"
        >>> calculator_agent("What is 15% of 200?")
        "15% of 200 is 30."
    """
    try:
        # Configure specialized calculator agent with a focused system prompt
        model = BedrockModel(
            model_id=AGENT_MODEL_ID,  # Tool agent model as specified
            region_name=REGION_NAME,
            temperature=0.3,  # Lower temperature for more precise calculations
            additionalModelRequestFields={
                "anthropic_beta": ["interleaved-thinking-2025-05-14"],
                "reasoning_config": {"type": "enabled", "budget_tokens": 1000},
            },
        )

        # Create specialized calculator agent
        calc_agent = Agent(
            model=model,
            tools=[calculator],
            system_prompt="""
            You are a specialized calculator assistant. Your sole purpose is to:
            
            1. Understand mathematical problems
            2. Solve them accurately using the calculator tool
            3. Explain the calculation process when appropriate
            4. Return only the result and minimal explanation
            
            Always use the calculator tool for operations to ensure precision.
            Be concise but thorough in your explanations.
            """,
        )

        # Process the expression with the specialized agent
        response = calc_agent(expression)
        return str(response)
    except Exception as e:
        return f"Error in calculator agent: {str(e)}"
