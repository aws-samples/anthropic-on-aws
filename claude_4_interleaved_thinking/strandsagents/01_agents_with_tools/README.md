# Building AI Agents with Strands SDK: From Notebooks to Production

Hey there! Welcome to my exploration of the Strands Agents SDK - Amazon's brand-new open-source framework for building AI agents that actually work like you'd expect them to. I created this repo to show you the applications you've run in the notebook as a Strands applications.

## What's This All About?

If you're like me, you've probably built some cool prototypes with LLMs and tools in Jupyter notebooks. They work great... until you try to productionize them. Then you're stuck writing boilerplate code for the "agentic loop" - that cycle of thinking, tool-calling, response processing, and more thinking that makes an AI agent tick.

That's exactly where Strands comes in.

## The Strands Revolution

Strands is AWS's newly released open-source SDK that takes a fundamentally different approach to agent development. Instead of making you orchestrate every interaction between the model and your tools, Strands leverages the reasoning capabilities of modern LLMs (like Claude) to handle that complexity automatically.

> *"Where it used to take months for Q Developer teams to go from prototype to production with a new agent, we're now able to ship new agents in days and weeks with Strands."* - Clare Liguori, AWS Senior Principal Engineer

I've worked with a few agent frameworks, and what makes Strands different is its elegant simplicity. You just need to define three things:
1. A model
2. Some tools
3. A prompt

Then Strands handles the rest. No complex workflows, no rigid state machines, no convoluted orchestration code.

## What You'll Find in This Repo

As I mentioned before, I've taken the basic example python notebook that uses Claude with calculator and database query tools and converted it into a modular Strands application. I've also taken the advanced notebooks that uses Claude with accommodations, attractions, flights, weather, itinerary tools and converted it into a modular Strands application as well.

Here's the structure:

```
.
├── README.md                          # Documentation for agents with tools
├── __init__.py                        # Package initialization
├── advanced.py                        # Advanced trip planning agent implementation
├── basic.py                           # Basic revenue calculator agent implementation
├── custom_agents/                     # Directory for specialized agent implementations
│   ├── revenue_agent.py               # Revenue calculator specialized agent
│   └── trip_agent.py                  # Trip planning specialized agent
├── images/                            # Diagram images for agents with tools
│   ├── adv_agents_with_tools.png      # Diagram of advanced agents architecture
│   └── basic_agents_with_tools.png    # Diagram of basic agents architecture
├── requirements.txt                   # Dependencies for agents with tools
├── tools/                             # Tools used by agents
│   ├── __init__.py                    # Tools package initialization
│   ├── accommodations.py              # Accommodation search tool
│   ├── attractions.py                 # Attraction search tool
│   ├── calculator.py                  # Mathematical calculation tool
│   ├── database.py                    # Database query tool
│   ├── flights.py                     # Flight search tool
│   ├── itinerary.py                   # Itinerary creation tool
│   └── weather.py                     # Weather forecast tool
└── utils.py                           # Utility functions for agents with tools
```

Let's take a deep dive into the key components.

## The Magic Under the Hood

### Defining Tools with Strands

In traditional Bedrock applications, you need to define tools with JSON schemas, handle tool calls, manage responses, and maintain conversation state. It gets messy fast. Let's look at how Strands simplifies this with decorators:

```python
# tools/calculator.py
from strands import tool

@tool
def calculator(expression: str) -> str:
    """Perform mathematical calculations safely.

    Evaluates mathematical expressions and formats the result appropriately.
    Handles basic operations and common mathematical notation.
    
    Args:
        expression: Mathematical expression to evaluate. Can include standard 
            operations (+, -, *, /) as well as common math notation (×, ÷, ^).
            Also supports basic functions like sin, cos, sqrt, etc.
    
    Returns:
        The result of the calculation as a string. Float results are 
        formatted to 2 decimal places.
    """
    # Implementation here...
    return formatted_result
```

That's it! The `@tool` decorator automatically converts your Python function into an agent tool. The docstring becomes the tool's description, and the type hints define the schema. No JSON, no boilerplate, no headaches.

I especially love how Strands uses Python's native features (decorators, docstrings, and type hints) to create a clean, Pythonic API. It feels like Flask or FastAPI for AI agents.

### Creating the Agent

The agent definition is equally straightforward:

```python
# agent.py
from strands import Agent
from strands.models import BedrockModel
from tools import *  # Import all tools from tools directory

MODEL_ID = "us.anthropic.claude-sonnet-4-20250514-v1:0"

def create_revenue_calculator_agent(model_id=MODEL_ID):
    # Configure the bedrock model
    bedrock_model = BedrockModel(
        model_id=model_id,
        region_name="us-west-2",
        temperature=0.7,
        max_tokens=6000,
        additionalModelRequestFields={
            "anthropic_beta": ["interleaved-thinking-2025-05-14"],
            "reasoning_config": {
                "type": "enabled",
                "budget_tokens": 10000
            }
        }
    )
    
    # Create agent with tools from the tools directory
    agent = Agent(
        model=bedrock_model,
        system_prompt="""
        You are a revenue calculator assistant that helps calculate total revenue based on product data.
        You have access to two tools:
        1. A database_query tool to look up products
        2. A calculator to ensure accuracy in your calculations
        
        When calculating revenue:
        - Always create a step-by-step plan first
        - Enumerate and explain your reasoning at each logical step
        - Use the calculator tool for all calculations to ensure accuracy
        - Provide a clear final answer
        """
    )
    
    return agent
```

Notice what's missing here - there's no code for handling the agent loop, no conversation tracking, no complex state management. Strands handles all of that behind the scenes.

### Running the Agent

The main application code is refreshingly simple:

```python
# main.py
from agent import create_revenue_calculator_agent
from utils import get_model_display_name

# Select the appropriate Claude model
MODEL_ID = "us.anthropic.claude-sonnet-4-20250514-v1:0"

def main():
    # Get display name based on model ID
    model_display_name = get_model_display_name(MODEL_ID)
    print(f"Using {model_display_name} model: {MODEL_ID}")
    
    # Create agent
    agent = create_revenue_calculator_agent(model_id=MODEL_ID)
    
    # Process a query
    user_query = """
    You are tasked with determining which product from our database would generate 
    the highest profit margin if we sold 200 units.
    [... more query details ...]
    """
    
    print("Processing query:", user_query)
    response = agent(user_query)
    print("\nExecution complete!")
```

Just look at that! We're invoking our agent with a simple function call (`agent(user_query)`). No callbacks, no promises, no complex event handlers. Strands builds the entire agentic loop for us.

## Demystifying the Agentic Loop

Let's peek under the hood to see what's really happening when you call `agent(user_query)`. This is where Strands truly shines.

In traditional agent frameworks, I'd typically write 50-100 lines of boilerplate code to handle the "agentic loop" - that cycle of thinking, tool usage, and response generation. With Strands, that entire loop is abstracted away into a single function call.

### The Dance of Model and Tools

When you run `response = agent(user_query)`, here's the invisible ballet that occurs:

1. **Input Processing**: Strands formats your query and any conversation history into a prompt that Claude can understand.

2. **Tool Registration**: All those Python functions decorated with `@tool` get transformed into tool definitions that Claude can reason about. Your docstrings become tool descriptions, and type hints become parameter schemas.

3. **Model Invocation**: Strands sends everything to Claude, along with instructions on how to think about the problem.

4. **Reasoning Phase**: Claude starts working through the problem step-by-step (powered by that `reasoning_config` we set). You'll see this reasoning in the output - it's the "I'll help you determine which product..." part.

5. **Tool Selection**: When Claude decides it needs information, it calls a tool. For example:
   ```
   Tool #1: database_query
   Querying database: products
   ```

6. **Tool Execution**: Strands intercepts this, recognizes it as a tool call, and executes your actual Python function with the provided parameters.

7. **Context Update**: The tool result gets fed back to Claude as part of the ongoing conversation.

8. **Continuation**: Claude picks up where it left off, incorporating the new information into its reasoning.

9. **Repetition or Conclusion**: Steps 4-8 repeat as many times as needed until Claude has enough information to provide a final answer.

In our profit margin example, you can see this loop in action. Claude:
- Queries the database for product info
- Queries for cost data
- Calculates profit margins for individual products
- Calculates total margins for 200 units
- Compares the results
- Formats the answer

All of this happens automatically from that single `agent(user_query)` call. No manual state tracking, no complex response parsing.

### Why This Is Revolutionary

I've been building with LLMs since they first appeared, and this model-driven approach is a game-changer. In traditional workflow-driven frameworks, I had to:

1. Define explicit paths for every possible scenario
2. Write complex logic to interpret the model's intentions
3. Maintain conversation state manually
4. Handle error cases for each step

With Strands, I just define what tools are available, and Claude figures out the rest. It's the difference between micromanaging every step versus hiring an expert and letting them decide the approach.

The real power comes from combining Claude's reasoning abilities with your Python functions. Claude handles the "thinking" and decides when to use tools, while your functions provide the specialized capabilities Claude needs to solve problems.

This fundamentally changes how we approach agent development. Instead of spending time on orchestration code, I can focus on building better tools and crafting effective prompts - the parts that actually drive business value.

## Why This Matters

When I first started building with LLMs, I spent more time writing orchestration code than actual business logic. With Strands, I can focus on what matters - building tools that solve real problems and designing effective prompts.

The shift from workflow-based frameworks to model-driven frameworks like Strands represents a fundamental evolution in how we build AI agents. Instead of telling the agent exactly how to do its job step-by-step, we're leveraging the LLM's own reasoning capabilities to determine when and how to use tools.

This is analogous to the shift from procedural to object-oriented programming - it's a higher level of abstraction that lets us focus on the "what" rather than the "how".

## Running This Code

If you want to try this yourself:

1. Clone the repository
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Set up your AWS credentials with Bedrock access
4. Run the main application:
   ```bash
   python main.py
   ```

You'll see the agent reasoning through the problem, querying the database, performing calculations, and arriving at a conclusion - all with minimal code on your part.

## Where to Go From Here

This is just the beginning of what's possible with Strands. The framework supports:

- Streaming responses (for real-time UI updates)
- Persistent state management (for maintaining context)
- Multiple model providers (not just Bedrock)
- Multi-agent systems (for complex workflows)
- Production deployment options (Lambda, ECS, EC2)

I'm particularly excited about the multi-agent capabilities. By modeling sub-agents as tools, Strands enables a whole new level of compositional thinking where agents can delegate to specialized sub-agents as needed.

## Final Thoughts

Strands represents a significant step forward in making AI agents more accessible to developers. By embracing a model-driven approach rather than a workflow-driven one, it dramatically reduces the complexity and boilerplate needed to build effective agents.

If you've been struggling with the complexity of productionizing AI agents, give Strands a try. I think you'll be pleasantly surprised at how much easier it makes the process.

Have questions or improvements? Feel free to open an issue or PR. I'd love to hear about your experiences with Strands!

---

*Built with ❤️ using Strands Agents SDK, Amazon Bedrock, and Claude 3.7 Sonnet*
