#strandsagents/02_multi-agent/main_with_metrics.py
# Standard library imports
# None required

# Third-party imports
# None required

# Local application imports
from agent import create_revenue_calculator_agent
from utils import format_metrics_summary, get_model_display_name

# Set to True to display detailed metrics about agent execution
SHOW_METRICS = True
ORCHESTRATOR_MODEL_ID = "us.anthropic.claude-opus-4-20250514-v1:0"
AGENT_MODEL_ID = "us.anthropic.claude-sonnet-4-20250514-v1:0"

def main():
    """
    Main entry point for the multi-agent revenue calculator application.
    """
    # Select the appropriate Claude model for the orchestrator

    # Get display name based on model ID
    model_display_name = get_model_display_name(ORCHESTRATOR_MODEL_ID)
    print(f"Using {model_display_name} as orchestrator model: {ORCHESTRATOR_MODEL_ID}")
    print(f"With specialized agents using: {AGENT_MODEL_ID}")

    # Create orchestrator agent
    agent = create_revenue_calculator_agent(model_id=ORCHESTRATOR_MODEL_ID)

    # Example query - determining highest profit margin product
    user_query = """
    You are tasked with determining which product from our database would generate the highest profit margin if we sold 200 units.
    You will need to explain your reasoning step by step. To assist you in this task, you have access to two specialized agents:
    1. A database_agent to look up products
    2. A calculator_agent to ensure accuracy in your calculations
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

    # Process with orchestrator agent - the response will be displayed during execution
    # We now capture the result to access metrics
    result = agent(user_query)

    # Display metrics if enabled
    if SHOW_METRICS:
        print("\n" + "=" * 50)
        print("📊 EXECUTION METRICS")
        print("=" * 50)

        # Get and format metrics summary
        metrics_summary = result.metrics.get_summary()
        formatted_metrics = format_metrics_summary(metrics_summary)
        print(formatted_metrics)

        # Print tool usage breakdown for agents-as-tools
        if metrics_summary.get("tool_usage"):
            tool_agents = [
                name
                for name in metrics_summary["tool_usage"].keys()
                if name in ("calculator_agent", "database_agent")
            ]

            if tool_agents:
                print("\n🔄 Agent Delegation Breakdown")
                for agent_name in tool_agents:
                    count = metrics_summary["tool_usage"][agent_name][
                        "execution_stats"
                    ]["call_count"]
                    print(f"  • {agent_name}: {count} call(s)")

    print("\nExecution complete!")


if __name__ == "__main__":
    main()
