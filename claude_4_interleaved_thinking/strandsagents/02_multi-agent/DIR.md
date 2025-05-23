# 02_multi-agent Directory Structure

```
.
├── NOTES.md                             # Additional notes about multi-agent implementation
├── README.md                            # Documentation for multi-agent systems
├── __init__.py                          # Package initialization
├── agent.py                             # Main orchestrator agent implementation
├── images/                              # Diagram images for multi-agent systems
│   ├── agents_as_tools.png              # Diagram of agents-as-tools pattern
│   └── agents_as_tools_with_metrics.png # Diagram of agents-as-tools with metrics
├── main.py                              # Main entry point for multi-agent system
├── main_with_metrics.py                 # Entry point with performance metrics tracking
├── requirements.txt                     # Dependencies for multi-agent system
├── tool_agents/                         # Specialized agents that act as tools
│   ├── __init__.py                      # Tool agents package initialization
│   ├── calculator_agent.py              # Specialized agent for calculations
│   └── database_agent.py                # Specialized agent for database queries
├── tools/                               # Base tools used by specialized agents
│   ├── __init__.py                      # Tools package initialization
│   ├── calculator.py                    # Basic calculator tool
│   └── database.py                      # Basic database query tool
└── utils.py                             # Utility functions for multi-agent system
```

## Description

This directory demonstrates the implementation of multi-agent systems using the "agents-as-tools" pattern. It showcases how specialized agents can work together, coordinated by an orchestrator agent, to accomplish complex tasks.

### Key Components:

- **agent.py**: Implements the main orchestrator agent that coordinates specialized tool agents
- **main.py**: Entry point for running the basic multi-agent system
- **main_with_metrics.py**: Entry point for running the multi-agent system with performance metrics tracking
- **tool_agents/**: Contains specialized agents that function as tools:
  - **calculator_agent.py**: Agent specialized in performing calculations
  - **database_agent.py**: Agent specialized in database queries and data retrieval
- **tools/**: Basic tools that can be used directly by agents:
  - **calculator.py**: Performs mathematical calculations
  - **database.py**: Provides database query functionality

### Architectural Pattern

The multi-agent system follows the "agents-as-tools" pattern, where:
1. An orchestrator agent receives user queries
2. It delegates specific tasks to specialized tool agents
3. Tool agents use their specialized capabilities to solve sub-problems
4. The orchestrator agent combines results into a final response

### Usage:

Run the basic multi-agent system:
```bash
python main.py
```

Run the multi-agent system with performance metrics:
```bash
python main_with_metrics.py
```