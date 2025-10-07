#strandsagents/01_agents_with_tools/basic.py
# Standard library imports
# None required

# Third-party imports
# None required

# Local application imports
from custom_agents.revenue_agent import create_revenue_calculator_agent
from utils import get_model_display_name

# Select the appropriate Claude model
MODEL_ID = "us.anthropic.claude-sonnet-4-20250514-v1:0"  # Claude 4 Sonnet
# MODEL_ID = "us.anthropic.claude-opus-4-20250514-v1:0"  # Claude 4 Opus

def main() -> None:
    """Main entry point for the revenue calculator application.
    
    Demonstrates the basic implementation of an AI agent for revenue calculation.
    This entry point configures and initializes a revenue calculator agent with
    the specified Claude model, then processes a sample user query to identify
    the product with the highest profit margin for 200 units.
    
    The function:
    1. Configures the agent with the appropriate model
    2. Processes a sample revenue calculation query
    3. Displays the results to the console
    
    Returns:
        None
    """
    # Get display name based on model ID
    model_display_name = get_model_display_name(MODEL_ID)
    print(f"Using {model_display_name} model: {MODEL_ID}")

    # Create agent
    agent = create_revenue_calculator_agent(model_id=MODEL_ID)

    # Example query - determining highest profit margin product
    user_query = """
    You are tasked with determining which product from our database would generate the highest profit margin if we sold 200 units.
    You will need to explain your reasoning step by step. Be efficeint by using parallel tool use. Present your final answer in the following format:

    <answer>
    Step-by-step reasoning: [Provide your detailed analysis here]
    Highest profit margin product: [Product name]
    Profit margin for 200 units: [Amount in dollars]
    Explanation: [Brief explanation of why this product generates the highest profit margin]
    </answer>
    """

    print("Processing query:", user_query)

    # Process with agent - the response will be displayed during execution
    # so we don't need to print it again or store the result
    agent(user_query)

    # Print just a completion message instead of the full response again
    print("\nExecution complete!")


if __name__ == "__main__":
    main()
