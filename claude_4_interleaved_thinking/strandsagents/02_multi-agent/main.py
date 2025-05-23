#strandsagents/02_multi-agent/main.py
# Standard library imports
# None required

# Third-party imports
# None required

# Local application imports
from agent import create_revenue_calculator_agent
from utils import get_model_display_name

# Select the appropriate Claude model
MODEL_ID = "us.anthropic.claude-sonnet-4-20250514-v1:0"  # Claude 4 Sonnet
# MODEL_ID = "anthropic.claude-opus-4-20250514-v1:0"  # Claude 4 Opus


def main() -> None:
    """Main entry point for the revenue calculator application.
    
    Creates and initializes a revenue calculator agent that uses the orchestrator pattern
    with specialized tool agents. The agent processes a sample query to determine which
    product has the highest profit margin when selling 200 units.
    
    This function:
    1. Displays the model being used
    2. Creates the agent with appropriate configuration
    3. Processes a demonstration query
    4. Outputs the completion message
    
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
    You will need to explain your reasoning step by step. To assist you in this task, you have access to two tools:
    
    1. A database_query tool to look up products
    2. A calculator to ensure accuracy in your calculations
    Be efficeint by using parallel tool use.
    
    Before you begin create a step-by-step plan to complete the task.
    Present your final answer in the following format:
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
