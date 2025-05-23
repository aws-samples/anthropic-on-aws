# Building Multi-Agent Systems with Strands: A Practical Walkthrough

Welcome to my exploration of Strands Agents! If you're reading this, you're probably as excited as I am about the next generation of AI agent frameworks. Let me take you on a journey through one of the most elegant solutions I've discovered for building AI agents that actually *work*.

## The Agent Orchestration Problem

I've been building AI agents since the early days of LLMs, and I've seen the same pattern over and over. You start with a simple prototype - just a model calling a tool or two. It works, you show it off, everyone's amazed. Then comes the hard part: productionizing it.

Suddenly you're drowning in boilerplate:
- Tracking conversation state
- Managing tool execution logic
- Handling errors gracefully
- Orchestrating the flow of information

I've tried most of the major agent frameworks, and they all seemed to solve the wrong problem. They gave me rigid workflows or complex state machines when what I needed was *intelligent orchestration*.

Enter Strands.

## What Makes Strands Different?

Strands takes a fundamentally different approach - one I like to call "get out of the LLM's way." Instead of prescribing exactly how your agent should work step-by-step, Strands leverages the reasoning capabilities of modern LLMs to determine the flow dynamically.

The core philosophy is simple yet powerful:
1. Give the LLM clear tools
2. Provide a focused system prompt
3. Let the model figure out the rest

The beauty of this approach is that it scales naturally with LLM capabilities. As models like Claude get better at reasoning and planning, your agents automatically improve without changing a line of code.

## A Tale of Two Architectures

In this repo, I've implemented two different approaches to the same revenue calculator application:

1. **Basic Single-Agent**: A straightforward implementation with one agent using calculator and database tools directly
2. **Multi-Agent System**: A hierarchical approach using the "agents-as-tools" pattern

Let me walk you through the second approach, as it showcases some of the more advanced capabilities of Strands.

## The Agents-as-Tools Pattern

Think of this architecture like a well-run company. You have:

- A **Manager** (Orchestrator Agent) who understands the big picture
- **Specialists** (Tool Agents) who excel at specific tasks 

The manager doesn't micromanage - they simply delegate tasks to the right specialist and synthesize the results.

Here's how we've implemented it:

```python
# agent.py - Creating our orchestrator
def create_revenue_calculator_agent(model_id="us.anthropic.claude-opus-4-20250514-v1:0"):
    """Create a Strands orchestrator agent that delegates to specialized agents."""
    
    # Create orchestrator agent with specialized agents as tools
    agent = Agent(
        model=bedrock_model,
        tools=[calculator_agent, database_agent],  # Specialized agents wrapped as tools
        system_prompt="""
        You are a revenue calculator assistant that orchestrates specialized agents...
        Your role as an orchestrator is to:
        - Understand the user's request and create a clear plan
        - Delegate calculations to the calculator_agent
        - Delegate database queries to the database_agent
        - Synthesize the information from both agents into a coherent response
        """
    )
    
    return agent
```

I'm using Claude 4 Opus for the orchestrator because it excels at complex reasoning and planning, while the specialist agents use Claude 4 Sonnet - powerful but more efficient.

## How Specialist Agents Work

Each specialist agent is wrapped as a tool using the `@tool` decorator. Behind the scenes, this creates a function that the orchestrator can call, which in turn creates and invokes a specialized agent.

Here's our calculator specialist:

```python
# tool_agents/calculator_agent.py
@tool
def calculator_agent(expression: str) -> str:
    """
    Specialized agent for performing mathematical calculations accurately.
    
    Args:
        expression (str): A mathematical problem or expression to solve.
        
    Returns:
        str: The calculated result with step-by-step explanation when appropriate.
    """
    try:
        # Create specialized calculator agent
        calc_agent = Agent(
            model=model,
            tools=[calculator],  # Uses the basic calculator tool
            system_prompt="""
            You are a specialized calculator assistant. Your sole purpose is to:
            
            1. Understand mathematical problems
            2. Solve them accurately using the calculator tool
            3. Explain the calculation process when appropriate
            4. Return only the result and minimal explanation
            """
        )
        
        # Process the expression with the specialized agent
        response = calc_agent(expression)
        return str(response)
    except Exception as e:
        return f"Error in calculator agent: {str(e)}"
```

Notice how focused the system prompt is - this agent does one thing and does it well. It's not trying to understand the broader context of revenue calculation; it just needs to compute mathematical expressions accurately.

## The Dance of Delegation

When you run this system, something magical happens. The orchestrator:

1. Receives a query like "Which product has the highest profit margin for 200 units?"
2. Creates a plan: "I need product data, then I need to calculate margins"
3. Delegates to the database agent: "Get me product price and cost info"
4. Receives structured data back from the database agent
5. Delegates to the calculator agent: "Calculate (price - cost) * 200 for each product"
6. Synthesizes everything into a coherent response

All of this happens with a single function call: `agent(user_query)`. Strands handles the entire agentic loop behind the scenes.

## Why This Architecture Matters

This pattern offers several advantages I've found invaluable in production systems:

1. **Better separation of concerns**: Each agent has a laser focus on its specialty, leading to more accurate results
2. **Adaptive delegation**: The orchestrator dynamically decides which specialist to call and in what order
3. **Efficient model usage**: You can use more powerful models for complex orchestration and lighter models for simpler tasks
4. **Graceful failure handling**: If one specialist fails, the orchestrator can try alternative approaches
5. **Extensibility**: Adding new capabilities is as simple as creating a new specialist agent

## Running the Code

Want to try it yourself? It's incredibly simple:

```bash
# Install dependencies
pip install -r requirements.txt

# Run the multi-agent version
python main.py
```

You'll see the orchestration process in action, including how the orchestrator delegates tasks and synthesizes the results.

## The Agentic Loop: What's Happening Behind the Scenes

When you call `agent(user_query)`, Strands kicks off an invisible ballet:

1. **Input Processing**: Your query gets formatted for the orchestrator
2. **Tool Registration**: The specialist agents get registered as tools
3. **Model Invocation**: The orchestrator starts reasoning about the problem
4. **Delegation**: When the orchestrator decides to delegate, it "calls" a specialist
5. **Sub-Agent Execution**: The specialist agent runs through its own agentic loop
6. **Response Integration**: The specialist's response goes back to the orchestrator
7. **Synthesis**: The orchestrator weaves everything into a coherent answer

This nested loop architecture means your agents can handle incredibly complex tasks through decomposition and specialization - much like human organizations do.

## Where to Go From Here

This implementation just scratches the surface of what's possible with Strands. Here are some directions you might explore:

1. **Add more specialists**: Perhaps a market trend analyzer or inventory optimization agent
2. **Implement streaming**: For real-time visibility into the orchestration process
3. **Add persistent state**: To maintain context across multiple interactions
4. **Explore multi-model setups**: Maybe use Anthropic for reasoning and open models for simpler tasks

## Final Thoughts

What excites me most about Strands is how it embraces simplicity. After years of increasingly complex agent frameworks, it's refreshing to see one that trusts in the capabilities of modern LLMs rather than trying to constrain them.

If you're building AI agents professionally, I highly recommend giving Strands a try. I suspect you'll find, as I did, that it dramatically reduces development time while producing more capable agents.

Happy building!

---

*Built with ❤️ using Strands Agents and Claude 4*