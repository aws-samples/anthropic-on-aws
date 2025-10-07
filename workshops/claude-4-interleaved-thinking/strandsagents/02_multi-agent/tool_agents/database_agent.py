# tool_agents/database_agent.py
from typing import Union
from strands import Agent, tool
from strands.models import BedrockModel
from tools.database import database_query

AGENT_MODEL_ID = "us.anthropic.claude-sonnet-4-20250514-v1:0"
REGION_NAME = "us-west-2"

@tool
def database_agent(query: str) -> str:
    """Specialized agent for querying databases and interpreting results.
    
    Creates and invokes a specialized database agent that translates natural language
    queries into appropriate database lookups. The agent interprets and formats the
    results into a human-readable response.
    
    Args:
        query: A natural language query about data in the database, such as 
            "What products have the highest profit margin?" or "Show me inventory levels"
    
    Returns:
        The query results with appropriate interpretation as a formatted string.
        In error cases, returns an error message prefixed with "Error in database agent:".
    
    Examples:
        >>> database_agent("What products do we have in stock?")
        "We currently have 250 Premium Widgets and 175 Deluxe Gadgets in stock."
        >>> database_agent("Which product has the best profit margin?")
        "The Deluxe Gadget has the best profit margin at 58.3%."
    """
    try:
        # Configure specialized database agent
        model = BedrockModel(
            model_id=AGENT_MODEL_ID,  # Tool agent model as specified
            region_name=REGION_NAME,
            temperature=0.5,
            additional_request_fields={
                "anthropic_beta": ["interleaved-thinking-2025-05-14"],
                "reasoning_config": {"type": "enabled", "budget_tokens": 1000},
            },
        )

        # Create specialized database agent
        db_agent = Agent(
            model=model,
            tools=[database_query],
            system_prompt="""
            You are a specialized database query assistant. Your purpose is to:
            
            1. Understand data-related queries
            2. Determine the appropriate database query to execute
            3. Execute the query using the database_query tool
            4. Interpret and format the results clearly
            
            Offer a concise interpretation of the data, focusing on what the user needs.
            Always use the database_query tool to retrieve information.
            Present the information in a clear, structured manner.
            """,
        )

        # Process the query with the specialized agent
        response = db_agent(query)
        return str(response)
    except Exception as e:
        return f"Error in database agent: {str(e)}"
