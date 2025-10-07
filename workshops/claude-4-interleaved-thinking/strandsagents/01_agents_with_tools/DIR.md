# 01_agents_with_tools Directory Structure

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

## Description

This directory demonstrates basic AI agents with direct tool access. The examples showcase how to create agents that can use specialized tools to accomplish specific tasks.

### Key Components:

- **basic.py**: Entry point for a revenue calculator agent that uses database and calculator tools to analyze product revenue
- **advanced.py**: Entry point for a trip planning agent that uses various travel-related tools
- **custom_agents/**: Contains specialized agent implementations:
  - **revenue_agent.py**: Provides functionality for analyzing product revenue and profit margins
  - **trip_agent.py**: Implements travel planning logic using multiple travel-related tools
- **tools/**: Collection of specialized tools that agents can use:
  - **calculator.py**: Performs mathematical calculations
  - **database.py**: Queries product database information
  - **accommodations.py**: Searches for accommodation options
  - **attractions.py**: Finds tourist attractions
  - **flights.py**: Searches for flight options
  - **weather.py**: Retrieves weather forecasts
  - **itinerary.py**: Creates travel itineraries

### Usage:

Run the basic example:
```bash
python basic.py
```

Run the advanced example:
```bash
python advanced.py
```