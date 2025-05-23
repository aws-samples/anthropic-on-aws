# Strandsagents Directory Structure

```
.
├── 01_agents_with_tools/                    # Examples of basic agents with direct tool access
│   ├── README.md                            # Documentation for agents with tools
│   ├── __init__.py                          # Package initialization
│   ├── advanced.py                          # Advanced trip planning agent implementation
│   ├── basic.py                             # Basic revenue calculator agent implementation
│   ├── custom_agents/                       # Directory for specialized agent implementations
│   │   ├── revenue_agent.py                 # Revenue calculator specialized agent
│   │   └── trip_agent.py                    # Trip planning specialized agent
│   ├── images/                              # Diagram images for agents with tools
│   │   ├── adv_agents_with_tools.png        # Diagram of advanced agents architecture
│   │   └── basic_agents_with_tools.png      # Diagram of basic agents architecture
│   ├── requirements.txt                     # Dependencies for agents with tools
│   ├── tools/                               # Tools used by agents
│   │   ├── __init__.py                      # Tools package initialization
│   │   ├── accommodations.py                # Accommodation search tool
│   │   ├── attractions.py                   # Attraction search tool
│   │   ├── calculator.py                    # Mathematical calculation tool
│   │   ├── database.py                      # Database query tool
│   │   ├── flights.py                       # Flight search tool
│   │   ├── itinerary.py                     # Itinerary creation tool
│   │   └── weather.py                       # Weather forecast tool
│   └── utils.py                             # Utility functions for agents with tools
├── 02_multi-agent/                          # Examples of multi-agent systems
│   ├── NOTES.md                             # Additional notes about multi-agent implementation
│   ├── README.md                            # Documentation for multi-agent systems
│   ├── __init__.py                          # Package initialization
│   ├── agent.py                             # Main orchestrator agent implementation
│   ├── images/                              # Diagram images for multi-agent systems
│   │   ├── agents_as_tools.png              # Diagram of agents-as-tools pattern
│   │   └── agents_as_tools_with_metrics.png # Diagram of agents-as-tools with metrics
│   ├── main.py                              # Main entry point for multi-agent system
│   ├── main_with_metrics.py                 # Entry point with performance metrics tracking
│   ├── requirements.txt                     # Dependencies for multi-agent system
│   ├── tool_agents/                         # Specialized agents that act as tools
│   │   ├── __init__.py                      # Tool agents package initialization
│   │   ├── calculator_agent.py              # Specialized agent for calculations
│   │   └── database_agent.py                # Specialized agent for database queries
│   ├── tools/                               # Base tools used by specialized agents
│   │   ├── __init__.py                      # Tools package initialization
│   │   ├── calculator.py                    # Basic calculator tool
│   │   └── database.py                      # Basic database query tool
│   └── utils.py                             # Utility functions for multi-agent system
└── README.md                                # Overview of strandsagents package
```