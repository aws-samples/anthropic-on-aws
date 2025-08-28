---
name: architecture-design
description: Complete architecture design and documentation for any project
argument-hint: "[project-description]"
---

# Complete Architecture Design Automation

This command provides end-to-end architecture design and documentation for any software project.

## Usage

```bash
/architecture-design "Build a task management app for small teams with real-time collaboration"
```

## What This Command Does

1. **Requirements Analysis**: Analyzes project description and extracts requirements
2. **Architecture Design**: Creates system architecture based on best practices
3. **Technology Selection**: Recommends appropriate technologies and tools
4. **Visual Documentation**: Generates C4 diagrams and system documentation
5. **Decision Recording**: Creates ADRs documenting architectural choices

## Parallel Architecture Specialists

Deploy both architecture specialists simultaneously:

@architect @architecture-documenter

## Agent Coordination Instructions

**For @architect:**
Analyze the project requirements and design a complete system architecture:

1. Identify functional and non-functional requirements
2. Determine appropriate architecture pattern (monolith, microservices, etc.)
3. Select technology stack based on requirements and team constraints
4. Create Architecture Decision Records for major decisions
5. Provide implementation guidance and next steps

Consider team size, complexity, scalability needs, and maintenance requirements in your recommendations.

**For @architecture-documenter:**
Create comprehensive visual documentation for the architecture:

1. Generate C4 Context diagram showing system in its environment
2. Create C4 Container diagram showing major technical building blocks
3. Produce Component diagrams for key containers
4. Create system overview documentation
5. Generate container-specific documentation

Ensure all diagrams use consistent notation and professional styling.

## Expected Deliverables

### 1. Architecture Analysis
- Requirements summary (functional and non-functional)
- Architecture pattern recommendation with reasoning
- Technology stack selection with justification
- Scalability and performance considerations

### 2. System Design
- System context and boundaries
- Major components and their relationships
- Data flow and integration points
- Security and deployment considerations

### 3. Visual Documentation
- C4 Context Diagram (system in environment)
- C4 Container Diagram (technical building blocks)
- C4 Component Diagrams (internal structure)
- System overview documentation

### 4. Decision Documentation
- Architecture Decision Records (ADRs)
- Technology selection reasoning
- Trade-offs and alternatives considered
- Implementation roadmap

## Output Structure

The automation creates this documentation structure:

```
architecture/
├── README.md                 # System overview
├── decisions/                # Architecture Decision Records
│   ├── ADR-001-architecture-pattern.md
│   ├── ADR-002-technology-stack.md
│   └── ADR-003-data-management.md
├── diagrams/                 # C4 diagrams
│   ├── context.md           # System context
│   ├── containers.md        # Container view
│   └── components.md        # Component details
└── implementation/          # Implementation guidance
    ├── getting-started.md   # How to start building
    ├── technology-setup.md  # Tool and framework setup
    └── deployment.md        # Deployment strategy
```

## Success Criteria

- Architecture is appropriate for project requirements and team size
- Technology choices have clear justification
- Visual diagrams accurately represent the system design
- ADRs document key decisions with reasoning
- Implementation guidance is practical and actionable
- All documentation is professional and maintainable

## Example Usage

```bash
# E-commerce platform
/architecture-design "Build an e-commerce platform for 50,000+ products with real-time inventory, payment processing, and mobile apps"

# Team collaboration tool  
/architecture-design "Create a Slack competitor for enterprise teams with channels, file sharing, video calls, and integrations"

# IoT data platform
/architecture-design "Build an IoT platform that collects sensor data from 10,000+ devices, processes it in real-time, and provides analytics dashboards"
```

Each project gets customized architecture appropriate for its specific requirements, scale, and complexity.