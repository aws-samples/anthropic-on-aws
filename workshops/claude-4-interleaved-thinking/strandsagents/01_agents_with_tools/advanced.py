#strandsagents/01_agents_with_tools/advanced.py
# Standard library imports
# None required

# Third-party imports
# None required

# Local application imports  
from custom_agents.trip_agent import trip_planner
from utils import get_model_display_name

# Select the appropriate Claude model
MODEL_ID = "us.anthropic.claude-sonnet-4-20250514-v1:0"  # Claude 4 Sonnet
# MODEL_ID = "us.anthropic.claude-opus-4-20250514-v1:0"  # Claude 4 Opus


def main() -> None:
    """Main entry point for trip planning application.
    
    Demonstrates the advanced implementation of an AI agent for comprehensive
    travel planning. This function initializes a trip planning agent with the specified
    Claude model and processes a sample query to plan a 5-day family trip to Japan.
    
    The agent uses multiple specialized tools:
    - Flight search
    - Weather forecasting
    - Accommodation search
    - Attraction recommendations
    - Itinerary creation
    
    The function:
    1. Initializes the agent with the appropriate model
    2. Processes a sample trip planning query
    3. Displays the planning results to the console
    
    Returns:
        None
    """

    # Get display name based on model ID
    model_display_name = get_model_display_name(MODEL_ID)
    print(f"Using {model_display_name} model: {MODEL_ID}")

    # Create agent
    agent = trip_planner(model_id=MODEL_ID)

    # Example query - determining highest profit margin product
    user_query = """
    I need your help planning a 5-day trip to Japan for a family of four (parents, 8-year-old, and 14-year-old).
    We'll be traveling from Los Angeles (LAX) to Japan in June 2025, starting on June 15th.
    Our budget is $6,000 for accommodations and activities (excluding flights).
    
    Please help by:
    1. Finding flight options from LAX to Tokyo for June 15th, 2025
    2. Checking weather forecasts for Tokyo, Kyoto, and Osaka during our visit (June 15-19, 2025)
    3. Suggesting family-friendly accommodations in these cities
    4. Recommending attractions suitable for our family's age range
    5. Creating a practical itinerary considering jetlag and possible rain

    Be efficeint by using parallel tool use.
    """

    print("Planning your trip please standby:", user_query)

    # Process with agent - the response will be displayed during execution
    # so we don't need to print it again or store the result
    agent(user_query)

    # Print just a completion message instead of the full response again
    print("\nExecution complete!")


if __name__ == "__main__":
    main()
