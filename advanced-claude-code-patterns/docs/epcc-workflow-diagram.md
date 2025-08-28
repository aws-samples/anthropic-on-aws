# EPCC Workflow Architecture Diagram

This diagram visualizes the complete Explore-Plan-Code-Commit (EPCC) workflow, showing the relationships between commands, agents, hooks, and outputs at each phase.

## Complete EPCC Workflow with Agent Mappings

```mermaid
graph TB
    %% Styling
    classDef commandStyle fill:#4A90E2,stroke:#2E5C8A,stroke-width:2px,color:#fff
    classDef agentStyle fill:#52C41A,stroke:#389E0D,stroke-width:2px,color:#fff
    classDef hookStyle fill:#FA8C16,stroke:#D46B08,stroke-width:2px,color:#fff
    classDef outputStyle fill:#722ED1,stroke:#531DAB,stroke-width:2px,color:#fff
    classDef phaseStyle fill:#F0F2F5,stroke:#8C8C8C,stroke-width:3px
    classDef toolStyle fill:#8C8C8C,stroke:#595959,stroke-width:1px,color:#fff

    %% Start Node
    Start([Start EPCC Workflow])
    
    %% Phase 1: EXPLORE
    subgraph EXPLORE["🔍 PHASE 1: EXPLORE"]
        E_CMD["/epcc/epcc-explore"]:::commandStyle
        
        %% All 5 Explore Agents
        E_AG1{{code-archaeologist}}:::agentStyle
        E_AG2{{architect}}:::agentStyle
        E_AG3{{business-analyst}}:::agentStyle
        E_AG4{{test-generator}}:::agentStyle
        E_AG5{{documentation-agent}}:::agentStyle
        
        %% Relevant Hooks
        E_HOOK1(log_tool_use.py):::hookStyle
        E_HOOK2(performance_monitor.json):::hookStyle
        
        %% Output
        E_OUT[(EPCC_EXPLORE.md)]:::outputStyle
        
        %% Connections
        E_CMD --> E_AG1
        E_CMD --> E_AG2
        E_CMD --> E_AG3
        E_CMD --> E_AG4
        E_CMD --> E_AG5
        E_AG1 --> E_HOOK1
        E_AG2 --> E_HOOK1
        E_AG3 --> E_HOOK1
        E_AG4 --> E_HOOK1
        E_AG5 --> E_HOOK1
        E_HOOK1 --> E_OUT
        E_HOOK2 -.-> E_OUT
    end
    
    %% Quality Gate 1
    QG1{Quality Gate:<br/>quality_gates.json}:::hookStyle
    
    %% Phase 2: PLAN
    subgraph PLAN["📋 PHASE 2: PLAN"]
        P_CMD["/epcc/epcc-plan"]:::commandStyle
        
        %% All 5 Plan Agents
        P_AG1{{architect}}:::agentStyle
        P_AG2{{business-analyst}}:::agentStyle
        P_AG3{{security-reviewer}}:::agentStyle
        P_AG4{{qa-engineer}}:::agentStyle
        P_AG5{{project-manager}}:::agentStyle
        
        %% Tools & Hooks
        P_TOOL[TodoWrite Tool]:::toolStyle
        P_HOOK1(log_tool_use.py):::hookStyle
        P_HOOK2(security_gates.json):::hookStyle
        
        %% Output
        P_OUT[(EPCC_PLAN.md)]:::outputStyle
        
        %% Connections
        P_CMD --> P_AG1
        P_CMD --> P_AG2
        P_CMD --> P_AG3
        P_CMD --> P_AG4
        P_CMD --> P_AG5
        P_AG2 --> P_TOOL
        P_AG5 --> P_TOOL
        P_AG3 --> P_HOOK2
        P_TOOL --> P_OUT
        P_HOOK1 --> P_OUT
    end
    
    %% Quality Gate 2
    QG2{Quality Gate:<br/>quality_gates.json}:::hookStyle
    
    %% Phase 3: CODE
    subgraph CODE["💻 PHASE 3: CODE"]
        C_CMD["/epcc/epcc-code"]:::commandStyle
        
        %% All 5 Code Agents
        C_AG1{{test-generator}}:::agentStyle
        C_AG2{{performance-optimizer}}:::agentStyle
        C_AG3{{security-reviewer}}:::agentStyle
        C_AG4{{documentation-agent}}:::agentStyle
        C_AG5{{ux-optimizer}}:::agentStyle
        
        %% Python-specific Hooks
        C_HOOK1(python_lint.py):::hookStyle
        C_HOOK2(black_formatter.py):::hookStyle
        C_HOOK3(use_uv.py):::hookStyle
        
        %% Outputs
        C_OUT1[(EPCC_CODE.md)]:::outputStyle
        C_OUT2[(Source Files)]:::outputStyle
        C_OUT3[(Test Files)]:::outputStyle
        
        %% Connections
        C_CMD --> C_AG1
        C_CMD --> C_AG2
        C_CMD --> C_AG3
        C_CMD --> C_AG4
        C_CMD --> C_AG5
        C_AG1 --> C_HOOK1
        C_AG2 --> C_HOOK1
        C_AG3 --> C_HOOK1
        C_HOOK1 --> C_HOOK2
        C_HOOK2 --> C_HOOK3
        C_HOOK3 --> C_OUT1
        C_AG4 --> C_OUT2
    end
    
    %% Quality Gate 3
    QG3{Quality Gate:<br/>quality_gates.json}:::hookStyle
    
    %% Phase 4: COMMIT
    subgraph COMMIT["✅ PHASE 4: COMMIT"]
        CM_CMD["/epcc/epcc-commit"]:::commandStyle
        
        %% All 5 Commit Agents
        CM_AG1{{qa-engineer}}:::agentStyle
        CM_AG2{{security-reviewer}}:::agentStyle
        CM_AG3{{documentation-agent}}:::agentStyle
        CM_AG4{{deployment-agent}}:::agentStyle
        CM_AG5{{project-manager}}:::agentStyle
        
        %% Compliance & Security Hooks
        CM_HOOK1(security_gates.json):::hookStyle
        CM_HOOK2(compliance.json):::hookStyle
        CM_HOOK3(auto_recovery.json):::hookStyle
        CM_HOOK4(notifications.json):::hookStyle
        
        %% Git Tools
        CM_TOOL[Git/GitHub CLI]:::toolStyle
        
        %% Outputs
        CM_OUT1[(EPCC_COMMIT.md)]:::outputStyle
        CM_OUT2[(Git Commit)]:::outputStyle
        CM_OUT3[(Pull Request)]:::outputStyle
        
        %% Connections
        CM_CMD --> CM_AG1
        CM_CMD --> CM_AG2
        CM_CMD --> CM_AG3
        CM_CMD --> CM_AG4
        CM_CMD --> CM_AG5
        CM_AG1 --> CM_HOOK1
        CM_AG2 --> CM_HOOK1
        CM_AG5 --> CM_HOOK2
        CM_HOOK1 --> CM_TOOL
        CM_HOOK2 --> CM_TOOL
        CM_TOOL --> CM_OUT1
        CM_TOOL --> CM_OUT2
        CM_OUT2 --> CM_OUT3
        CM_HOOK3 -.->|Recovery| CM_AG4
        CM_HOOK4 --> CM_OUT3
    end
    
    %% Main Flow Connections
    Start --> EXPLORE
    EXPLORE --> QG1
    QG1 -->|Pass| PLAN
    QG1 -->|Fail| EXPLORE
    PLAN --> QG2
    QG2 -->|Pass| CODE
    QG2 -->|Fail| PLAN
    CODE --> QG3
    QG3 -->|Pass| COMMIT
    QG3 -->|Fail| CODE
    COMMIT --> End([Workflow Complete])
    
    %% Cross-Phase Performance Monitoring
    PERF(performance_monitor.json):::hookStyle
    PERF -.-> EXPLORE
    PERF -.-> PLAN
    PERF -.-> CODE
    PERF -.-> COMMIT
```

## Agent-Hook-Output Matrix

### Detailed Mapping Table

| Phase | Command | Agents (5 per phase) | Relevant Hooks | Output Files |
|-------|---------|---------------------|----------------|--------------|
| **EXPLORE** | `/epcc/epcc-explore` | • code-archaeologist<br>• architect<br>• business-analyst<br>• test-generator<br>• documentation-agent | • log_tool_use.py<br>• performance_monitor.json | • EPCC_EXPLORE.md |
| **PLAN** | `/epcc/epcc-plan` | • architect<br>• business-analyst<br>• security-reviewer<br>• qa-engineer<br>• project-manager | • log_tool_use.py<br>• security_gates.json<br>• performance_monitor.json | • EPCC_PLAN.md |
| **CODE** | `/epcc/epcc-code` | • test-generator<br>• performance-optimizer<br>• security-reviewer<br>• documentation-agent<br>• ux-optimizer | • python_lint.py<br>• black_formatter.py<br>• use_uv.py<br>• quality_gates.json | • EPCC_CODE.md<br>• Source files<br>• Test files |
| **COMMIT** | `/epcc/epcc-commit` | • qa-engineer<br>• security-reviewer<br>• documentation-agent<br>• deployment-agent<br>• project-manager | • security_gates.json<br>• compliance.json<br>• auto_recovery.json<br>• notifications.json | • EPCC_COMMIT.md<br>• Git commit<br>• Pull Request |

## Hook Categories and Functions

### Python-Specific Hooks (Exit Code 2 for Claude Action)
```mermaid
graph LR
    classDef pythonHook fill:#FF6B6B,stroke:#C92A2A,stroke-width:2px,color:#fff
    classDef jsonHook fill:#4DABF7,stroke:#1971C2,stroke-width:2px,color:#fff
    
    PH1[python_lint.py]:::pythonHook
    PH2[black_formatter.py]:::pythonHook
    PH3[use_uv.py]:::pythonHook
    PH4[log_tool_use.py]:::pythonHook
    
    PH1 --> |Lints Python code| CODE
    PH2 --> |Formats Python code| CODE
    PH3 --> |Uses UV package manager| CODE
    PH4 --> |Logs all tool usage| ALL
```

### JSON Configuration Hooks
```mermaid
graph LR
    classDef jsonHook fill:#4DABF7,stroke:#1971C2,stroke-width:2px,color:#fff
    
    JH1[quality_gates.json]:::jsonHook
    JH2[security_gates.json]:::jsonHook
    JH3[compliance.json]:::jsonHook
    JH4[auto_recovery.json]:::jsonHook
    JH5[performance_monitor.json]:::jsonHook
    JH6[notifications.json]:::jsonHook
    
    JH1 --> |Quality checkpoints| GATES
    JH2 --> |Security validation| SECURITY
    JH3 --> |Compliance checks| COMMIT
    JH4 --> |Error recovery| RECOVERY
    JH5 --> |Performance tracking| METRICS
    JH6 --> |Status notifications| ALERTS
```

## Component Legend

```mermaid
graph LR
    %% Styling
    classDef commandStyle fill:#4A90E2,stroke:#2E5C8A,stroke-width:2px,color:#fff
    classDef agentStyle fill:#52C41A,stroke:#389E0D,stroke-width:2px,color:#fff
    classDef hookStyle fill:#FA8C16,stroke:#D46B08,stroke-width:2px,color:#fff
    classDef outputStyle fill:#722ED1,stroke:#531DAB,stroke-width:2px,color:#fff
    classDef toolStyle fill:#8C8C8C,stroke:#595959,stroke-width:1px,color:#fff
    
    CMD["/epcc/command"]:::commandStyle
    AGENT{{agent-name}}:::agentStyle
    HOOK(hook-file.py/.json):::hookStyle
    OUTPUT[(Output File)]:::outputStyle
    TOOL[External Tool]:::toolStyle
    
    CMD --> |triggers| AGENT
    AGENT --> |validated by| HOOK
    HOOK --> |generates| OUTPUT
    AGENT --> |uses| TOOL
```


## File Locations in Project

| Component Type | Location | Count | Examples |
|---------------|----------|-------|----------|
| **Commands** | `/commands/epcc/` | 4 | `epcc-explore.md`, `epcc-plan.md`, `epcc-code.md`, `epcc-commit.md` |
| **Agents** | `/agents/` | 13 | `architect.md`, `test-generator.md`, `security-reviewer.md` |
| **Python Hooks** | `/hooks/` | 4 | `python_lint.py`, `black_formatter.py`, `use_uv.py`, `log_tool_use.py` |
| **JSON Hooks** | `/hooks/` | 6 | `quality_gates.json`, `security_gates.json`, `compliance.json` |
| **Outputs** | Project root | 4 | `EPCC_EXPLORE.md`, `EPCC_PLAN.md`, `EPCC_CODE.md`, `EPCC_COMMIT.md` |

## Hook Execution Flow

### Python Hooks (Exit Code Behavior)
- **Exit Code 0**: Success, continue workflow
- **Exit Code 1**: Error, stop workflow
- **Exit Code 2**: Claude should take action (format code, install packages, etc.)

### Hook Trigger Points
1. **Pre-Command**: Before agent execution
2. **During Execution**: Real-time validation
3. **Post-Command**: After completion
4. **Quality Gates**: Between phases

## Usage Flow with Actual Components

1. **Developer initiates**: `claude /epcc/epcc-explore "authentication system"`
2. **Explore phase** triggers 5 agents: code-archaeologist, architect, business-analyst, test-generator, documentation-agent
3. **Quality gate** (`quality_gates.json`) validates exploration
4. **Plan phase** triggers 5 agents: architect, business-analyst, security-reviewer, qa-engineer, project-manager
5. **Quality gate** validates plan completeness
6. **Code phase** triggers 5 agents: test-generator, performance-optimizer, security-reviewer, documentation-agent, ux-optimizer
   - Python hooks automatically format and lint code
7. **Quality gate** (`quality_gates.json`) validates code quality
8. **Commit phase** triggers 5 agents: qa-engineer, security-reviewer, documentation-agent, deployment-agent, project-manager
9. **Workflow complete** with full documentation trail

## Key Insights

### Agent Reuse Patterns
- **architect**: Used in EXPLORE and PLAN phases
- **business-analyst**: Used in EXPLORE and PLAN phases
- **security-reviewer**: Used in PLAN, CODE, and COMMIT phases
- **documentation-agent**: Used in EXPLORE, CODE, and COMMIT phases
- **test-generator**: Used in EXPLORE and CODE phases
- **qa-engineer**: Used in PLAN and COMMIT phases
- **project-manager**: Used in PLAN and COMMIT phases

### Python-Specific Integration
All Python hooks use exit code 2 to trigger Claude actions:
- `use_uv.py`: Automatically uses UV package manager
- `black_formatter.py`: Auto-formats Python code
- `python_lint.py`: Runs Ruff linting

### Quality Enforcement Points
1. Between phases: `quality_gates.json`
2. Security checks: `security_gates.json`
3. Compliance: `compliance.json`
5. Performance: `performance_monitor.json`

## Benefits of This Architecture

1. **Comprehensive Coverage**: Each phase uses 5 specialized agents
2. **Automatic Quality**: Python hooks ensure code quality without manual intervention
3. **Security Throughout**: Security validation in 3 of 4 phases
4. **Documentation Trail**: Every phase creates permanent records
5. **Smart Recovery**: `auto_recovery.json` handles errors gracefully
6. **Performance Tracking**: Continuous monitoring across all phases
7. **Compliance Ready**: Built-in compliance checking for enterprise needs

## Related Documentation

- [Agents Guide](../agents/README.md) - Complete agent documentation
- [Hooks Guide](../hooks/EXIT_CODES_GUIDE.md) - Hook configuration and exit codes
- [Commands Guide](../commands/README.md) - Command creation guide
- [EPCC Workflow Guide](epcc-workflow-guide.md) - Detailed implementation guide