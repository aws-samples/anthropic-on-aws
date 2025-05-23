# Multi-Agent Revenue Calculator

This project demonstrates how to implement the "agents-as-tools" pattern in Strands, transforming what was originally a simple agent with tools into a hierarchical multi-agent system.

## The Agents-as-Tools Pattern

In this implementation, we've converted our basic calculator and database query tools into full-fledged specialized agents, which are then wrapped as tools for the orchestrator agent.

### Key Components:

1. **Specialized Tool Agents**: 
   - `calculator_agent`: Focused solely on mathematical calculations
   - `database_agent`: Focused solely on database queries

2. **Orchestrator Agent**: 
   - Understands the user's task
   - Creates a plan
   - Delegates subtasks to the specialized agents
   - Synthesizes the results into a coherent response

## Implementation Details

### Model Hierarchy

We've implemented a hierarchical model approach:
- Orchestrator agent: Uses Claude 4 Opus (`us.anthropic.claude-opus-4-20250514-v1:0`)
- Tool agents: Use Claude 4 Sonnet (`us.anthropic.claude-sonnet-4-20250514-v1:0`)

This reflects a common pattern where the "manager" agent uses a more powerful model for complex planning and reasoning, while "worker" agents use more efficient models for specific tasks.

### System Prompts

Each agent has a carefully crafted system prompt:

1. **Calculator Agent**: 
   ```
   You are a specialized calculator assistant. Your sole purpose is to:
   1. Understand mathematical problems
   2. Solve them accurately using the calculator tool
   3. Explain the calculation process when appropriate
   4. Return only the result and minimal explanation
   ```

2. **Database Agent**:
   ```
   You are a specialized database query assistant. Your purpose is to:
   1. Understand data-related queries
   2. Determine the appropriate database query to execute
   3. Execute the query using the database_query tool
   4. Interpret and format the results clearly
   ```

3. **Orchestrator Agent**:
   ```
   You are a revenue calculator assistant that orchestrates specialized agents...
   Your role as an orchestrator is to:
   - Understand the user's request and create a clear plan
   - Delegate calculations to the calculator_agent
   - Delegate database queries to the database_agent
   - Synthesize the information from both agents into a coherent response
   ```

## Benefits of This Approach

1. **Separation of Concerns**: Each agent has a focused domain of expertise
2. **Improved Performance**: Specialized agents with tailored system prompts can perform better at specific tasks
3. **Efficient Model Usage**: Use the most powerful models only where needed
4. **Modular Development**: Can add or modify specialized agents without changing the orchestrator
5. **Better Reasoning**: Compartmentalized reasoning leads to clearer step-by-step logic

## Running the Application

To run the multi-agent application:

```bash
python main.py
```

## Output Example

When executed, the application shows:
1. The orchestrator breaking down the problem
2. Delegation to specialized agents when needed
3. Synthesis of the results into a final answer

## Future Enhancements

This pattern can be extended with additional specialized agents:
- Product recommendation agent
- Data visualization agent
- Market research agent
- Inventory management agent

Each would be wrapped as a tool for the orchestrator to use when needed.