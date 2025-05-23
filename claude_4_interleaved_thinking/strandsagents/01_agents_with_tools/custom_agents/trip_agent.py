#strandsagents/01_agents_with_tools/custom_agents/trip_agent.py
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


def trip_planner(
    model_id: str = "anthropic.claude-sonnet-4-20250514-v1:0", 
    region_name: str = "us-west-2"
) -> Agent:
    """Create a Strands agent specialized for comprehensive travel planning.
    
    This agent helps users plan trips by integrating flight search, weather forecasting,
    accommodation booking, attraction recommendations, and itinerary creation. It's
    designed to handle multi-step travel planning while considering practical constraints
    like budget, weather, and family needs.
    
    Args:
        model_id: The Claude model ID to use for the agent
        region_name: AWS region name for Bedrock API access
    
    Returns:
        Configured Strands agent for travel planning
    
    Examples:
        >>> agent = trip_planner()
        >>> response = agent("Help me plan a 3-day trip to Tokyo in June")
    """
    # Configure the bedrock model
    bedrock_model = BedrockModel(
        boto_client_config=boto_config,
        model_id=model_id,
        region_name=region_name,
        temperature=0.3,
        max_tokens=10000,
        cache_tools="default",
        cache_prompt="default",
        additionalModelRequestFields={
            "anthropic_beta": ["interleaved-thinking-2025-05-14"],
            "reasoning_config": {"type": "enabled", "budget_tokens": 8000},
        },
    )

    # Create agent with tools from the tools directory
    agent = Agent(
        model=bedrock_model,
        system_prompt="""
    You are an expert travel planning assistant with access to the following tools:

    1. search_flights(origin, destination, date) - Find flight options between airports
    2. get_weather_forecast(location, date) - Get weather predictions for specific locations and dates
    3. search_accommodations(location, check_in, check_out) - Find available lodging options
    4. search_attractions(location, category=None) - Discover tourist attractions, optionally filtered by category
    5. create_itinerary(days) - Generate a structured travel itinerary from day-by-day plans

    In order to be efficient when aswering requests, you are allowed to make parallel tool calls
    
    When helping users plan trips:
    - Always create a step-by-step plan first
    - Consider practical constraints like budget limitations, weather conditions, and travel time
    - For families, prioritize accommodations with sufficient space and kid-friendly amenities
    - Recommend attractions appropriate for the specified age groups
    - Balance activities with rest time, especially when dealing with jetlag
    - Suggest reasonable travel times between locations based on distances
    - Include practical details about transportation options between cities
    - Present information clearly with organized sections for flights, accommodations, attractions, and daily itineraries
    - Provide cost estimates to help users track against their stated budget
    - Format the final itinerary as a clean, structured document that could be printed or saved
    
    Deliver comprehensive trip plans that balance excitement with practicality, always prioritizing travel safety and family enjoyment.
    """,
    )

    return agent
