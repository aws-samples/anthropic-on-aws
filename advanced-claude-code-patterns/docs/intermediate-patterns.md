# Intermediate Patterns Guide

🟡 **Difficulty**: Intermediate | **Time**: 45-60 minutes | **Prerequisites**: Completed Quick Start

## Introduction

You've mastered the basics and created your first agents and hooks. Now let's explore intermediate patterns that bridge the gap between simple usage and advanced orchestration. This guide focuses on practical patterns you'll use daily.

## Table of Contents
1. [Pattern Categories](#pattern-categories)
2. [Agent Composition Patterns](#agent-composition-patterns)
3. [Hook Chaining Patterns](#hook-chaining-patterns)
4. [Command Orchestration](#command-orchestration)
5. [Context Management](#context-management)
6. [Error Handling Patterns](#error-handling-patterns)
7. [Performance Patterns](#performance-patterns)
8. [Real-World Scenarios](#real-world-scenarios)
9. [Next Steps](#next-steps)

## Pattern Categories

### Complexity Levels

| Pattern Type | Complexity | Use When |
|-------------|------------|----------|
| **Single Component** | Low | Simple, isolated tasks |
| **Paired Components** | Medium | Related operations |
| **Orchestrated Suite** | High | Complex workflows |
| **Adaptive Systems** | Advanced | Dynamic requirements |

## Agent Composition Patterns

### Pattern 1: Agent Handoff

**Problem**: Complex tasks require multiple specializations  
**Solution**: Agents explicitly hand off work to other agents

```markdown
# In review-agent.md
After code review, recommend:
"Now run the security-reviewer agent for vulnerability assessment"

# In security-reviewer.md  
After security review, suggest:
"Consider running performance-optimizer for bottleneck analysis"
```

**Implementation**:
```bash
# Create a meta-agent that coordinates others
cat > .claude/agents/coordinator.md << 'EOF'
---
name: coordinator
description: Orchestrates multiple specialist agents for complex tasks
model: sonnet
tools: [Read, Grep, TodoWrite]
---

## Quick Reference
- Coordinates multiple specialist agents
- Creates execution plans
- Tracks task progress
- Synthesizes results
- Manages handoffs between agents

## Activation Instructions

- CRITICAL: Assess requirements before delegating
- WORKFLOW: Analyze → Plan → Delegate → Track → Synthesize
- Direct to appropriate specialists
- Monitor overall progress
- STAY IN CHARACTER as Orchestrator, coordination expert

## Core Identity

**Role**: Principal Coordination Specialist
**Identity**: You are **Orchestrator**, who conducts the symphony of specialized agents.

**Principles**:
- **Right Tool**: Match agent to task
- **Clear Handoffs**: Explicit transitions
- **Progress Tracking**: Monitor all stages
- **Result Synthesis**: Combine outputs effectively
- **Quality Control**: Verify completeness

## Agent Roster

### Available Specialists
- **security-reviewer**: Vulnerability analysis
- **performance-optimizer**: Speed improvements
- **test-generator**: Test creation
- **documentation-agent**: Documentation
- **architect**: System design

## Output Format

Coordination plan includes:
- **Task Analysis**: Requirements breakdown
- **Agent Sequence**: Ordered execution plan
- **Dependencies**: What each agent needs
- **Success Criteria**: Completion metrics
EOF
```

### Pattern 2: Agent Specialization Hierarchy

**Problem**: Some agents are too broad  
**Solution**: Create sub-specialized agents

```
General Agent
├── Frontend Specialist
│   ├── React Expert
│   └── Vue Expert
└── Backend Specialist
    ├── API Designer
    └── Database Expert
```

**Example Implementation**:
```bash
# Parent agent (generalist)
cat > .claude/agents/backend-specialist.md << 'EOF'
---
name: backend-specialist
description: General backend development and architecture
model: sonnet
tools: [Read, Write, Grep]
---

## Quick Reference
- Backend architecture design
- API development guidance
- Database schema design
- Performance optimization
- Delegates to specialists when needed

## Activation Instructions

- CRITICAL: Assess if specialization needed
- WORKFLOW: Evaluate → Design → Implement or Delegate
- For specific needs, recommend specialists
- Maintain architectural consistency
- STAY IN CHARACTER as BackendLead, backend expert

## Core Identity

**Role**: Senior Backend Architect
**Identity**: You are **BackendLead**, who ensures robust backend systems.

**Principles**:
- **Scalability First**: Design for growth
- **Clean Architecture**: Separation of concerns
- **API Excellence**: Developer-friendly interfaces
- **Data Integrity**: Protect the source of truth
- **Performance Matters**: Every millisecond counts

## Specialist Delegation

When to delegate:
- **api-designer**: Complex REST/GraphQL design
- **database-expert**: Advanced query optimization
- **auth-specialist**: Security implementation
EOF

# Child agent (specialist)
cat > .claude/agents/api-designer.md << 'EOF'
---
name: api-designer
description: Specialized API design and OpenAPI documentation
model: sonnet
tools: [Read, Write, WebSearch]
---

## Quick Reference
- RESTful API design
- GraphQL schema creation
- OpenAPI/Swagger specs
- Versioning strategies
- Rate limiting design

## Activation Instructions

- CRITICAL: Follow REST principles strictly
- WORKFLOW: Resources → Endpoints → Schemas → Docs
- Inherit backend-specialist principles
- Focus on developer experience
- STAY IN CHARACTER as APIcrafter, API specialist
EOF
```

### Pattern 3: Agent Consensus

**Problem**: Critical decisions need multiple perspectives  
**Solution**: Multiple agents review the same work

```bash
# Run multiple agents on the same code
Review this with security-reviewer
Review this with performance-optimizer  
Review this with ux-optimizer

# Then synthesize
Summarize all review feedback and prioritize fixes
```

## Hook Chaining Patterns

### Pattern 4: Progressive Quality Gates

**Problem**: Want increasing quality checks without blocking fast iteration  
**Solution**: Graduated hook strictness

```json
{
  "hooks": {
    "development": {
      "pre-commit": ["format", "basic-lint"]
    },
    "staging": {
      "pre-commit": ["format", "lint", "test", "security-scan"]
    },
    "production": {
      "pre-commit": ["format", "lint", "test", "security", "performance", "docs"]
    }
  }
}
```

**Environment-based activation**:
```python
# hooks/progressive_gate.py
import os
import subprocess

def pre_commit():
    env = os.getenv('CLAUDE_ENV', 'development')
    
    checks = {
        'development': ['black .', 'ruff check .'],
        'staging': ['black .', 'ruff check .', 'pytest', 'bandit -r .'],
        'production': ['black .', 'ruff check .', 'pytest', 'bandit -r .', 
                      'mypy .', 'safety check']
    }
    
    for check in checks.get(env, []):
        result = subprocess.run(check, shell=True)
        if result.returncode != 0:
            return result.returncode
    return 0
```

### Pattern 5: Conditional Hook Execution

**Problem**: Not all hooks apply to all files  
**Solution**: Smart hook filtering

```python
# hooks/smart_hook.py
import sys
import glob

def should_run(patterns):
    """Check if hook should run based on changed files"""
    changed_files = sys.argv[1:]  # Files passed by Claude
    
    for pattern in patterns:
        if glob.glob(pattern):
            return True
    return False

def pre_edit():
    # Only run for Python files
    if should_run(['**/*.py']):
        return run_python_checks()
    
    # Only run for JavaScript files
    if should_run(['**/*.js', '**/*.jsx']):
        return run_javascript_checks()
    
    return 0  # Skip if no relevant files
```

### Pattern 6: Hook Recovery Chain

**Problem**: Hooks fail and block progress  
**Solution**: Automatic recovery attempts

```json
{
  "hooks": {
    "pre-commit": {
      "command": "python hooks/quality_check.py",
      "on_failure": {
        "auto_fix": "python hooks/auto_fix.py",
        "retry": true,
        "max_attempts": 3
      }
    }
  }
}
```

## Command Orchestration

### Pattern 7: Command Workflows

**Problem**: Common multi-step operations  
**Solution**: Commands that call other commands

```markdown
---
name: full-review
description: Complete code review workflow
---

Execute these commands in sequence:
1. /analyze-performance
2. /security-scan  
3. /generate-tests
4. /docs-create --complete

Compile results into a comprehensive review report.
```

### Pattern 8: Parameterized Command Templates

**Problem**: Similar commands with slight variations  
**Solution**: Template commands with variables

```markdown
---
name: create-feature
argument-hint: <feature-name> <feature-type>
---

## Create Feature: $FEATURE_NAME

Based on type '$FEATURE_TYPE', use template:

### If API Endpoint:
1. Create route file: `api/$FEATURE_NAME.py`
2. Create test: `tests/test_$FEATURE_NAME.py`
3. Update OpenAPI spec
4. Generate client code

### If UI Component:
1. Create component: `components/$FEATURE_NAME.jsx`
2. Create story: `stories/$FEATURE_NAME.stories.js`
3. Create test: `tests/$FEATURE_NAME.test.js`
4. Update component index
```

### Pattern 9: Command Aliases

**Problem**: Team members use different terminology  
**Solution**: Multiple commands pointing to same operation

```bash
# All these do the same thing
ln -s ~/.claude/commands/security-scan.md ~/.claude/commands/sec-check.md
ln -s ~/.claude/commands/security-scan.md ~/.claude/commands/audit.md
ln -s ~/.claude/commands/security-scan.md ~/.claude/commands/pentest.md
```

## Context Management

### Pattern 10: Context Preservation

**Problem**: Losing context between sessions  
**Solution**: Persistent context files

```markdown
# .claude/context/current_sprint.md
## Current Sprint Context

Sprint: 24
Feature: User Authentication
Branch: feature/auth-system
PR: #1234

## Completed:
- Database schema
- Basic auth endpoints

## In Progress:
- JWT implementation
- Password reset flow

## Blocked:
- Email service configuration
```

Reference in CLAUDE.md:
```markdown
# CLAUDE.md
Always check `.claude/context/` for current work context.
```

### Pattern 11: Dynamic Context Loading

**Problem**: Different contexts for different tasks  
**Solution**: Conditional context loading

```python
# hooks/load_context.py
import os
import json

def on_session_start():
    task_type = os.getenv('CLAUDE_TASK_TYPE', 'general')
    
    contexts = {
        'debug': '.claude/context/debug_context.md',
        'feature': '.claude/context/feature_context.md',
        'refactor': '.claude/context/refactor_context.md',
        'general': '.claude/context/general_context.md'
    }
    
    context_file = contexts.get(task_type)
    if os.path.exists(context_file):
        print(f"Loading context from {context_file}")
        # Claude will read this automatically
```

## Error Handling Patterns

### Pattern 12: Graceful Degradation

**Problem**: Advanced features fail in some environments  
**Solution**: Fallback strategies

```python
# hooks/smart_formatter.py
def format_code():
    formatters = [
        ('uv run black .', 'black .'),  # Try uv first, fallback to direct
        ('ruff format .', 'autopep8 .'),  # Try ruff first, fallback to autopep8
    ]
    
    for primary, fallback in formatters:
        try:
            result = subprocess.run(primary, shell=True, check=True)
            return 0
        except:
            try:
                result = subprocess.run(fallback, shell=True, check=True)
                return 0
            except:
                continue
    
    print("Warning: No formatter available, skipping")
    return 0  # Don't block on missing tools
```

### Pattern 13: Error Context Collection

**Problem**: Errors lack context for debugging  
**Solution**: Automatic context gathering on failure

```python
# hooks/error_collector.py
def on_error(error_info):
    """Collect context when errors occur"""
    
    context = {
        'timestamp': datetime.now().isoformat(),
        'error': str(error_info),
        'cwd': os.getcwd(),
        'git_branch': get_git_branch(),
        'recent_files': get_recent_files(),
        'system_info': get_system_info()
    }
    
    # Save for debugging
    with open('.claude/errors/last_error.json', 'w') as f:
        json.dump(context, f, indent=2)
    
    print("Error context saved. Run '/debug-last-error' to investigate.")
```

## Performance Patterns

### Pattern 14: Lazy Agent Loading

**Problem**: Loading all agents slows startup  
**Solution**: Load agents on demand

```python
# .claude/hooks/lazy_loader.py
def load_agent_if_needed(message):
    """Only load agents mentioned in the message"""
    
    agents = {
        'security': 'security-reviewer',
        'performance': 'performance-optimizer',
        'test': 'test-generator'
    }
    
    for keyword, agent in agents.items():
        if keyword in message.lower():
            load_agent(agent)
```

### Pattern 15: Result Caching

**Problem**: Repeated expensive operations  
**Solution**: Cache and reuse results

```python
# hooks/cache_manager.py
import hashlib
import json
import time

CACHE_DIR = '.claude/cache'

def get_cache_key(operation, params):
    """Generate cache key from operation and parameters"""
    content = f"{operation}:{json.dumps(params, sort_keys=True)}"
    return hashlib.md5(content.encode()).hexdigest()

def get_cached_result(operation, params, max_age=3600):
    """Get cached result if fresh enough"""
    key = get_cache_key(operation, params)
    cache_file = f"{CACHE_DIR}/{key}.json"
    
    if os.path.exists(cache_file):
        stat = os.stat(cache_file)
        age = time.time() - stat.st_mtime
        
        if age < max_age:
            with open(cache_file) as f:
                return json.load(f)
    
    return None

def cache_result(operation, params, result):
    """Cache result for future use"""
    key = get_cache_key(operation, params)
    cache_file = f"{CACHE_DIR}/{key}.json"
    
    os.makedirs(CACHE_DIR, exist_ok=True)
    with open(cache_file, 'w') as f:
        json.dump(result, f)
```

## Real-World Scenarios

### Scenario 1: Feature Development Pipeline

Combining multiple patterns for feature development:

```bash
# 1. Start with context
export CLAUDE_TASK_TYPE=feature

# 2. Use coordinator agent
I need to add user profile editing

# 3. Progressive workflow
/epcc-explore --focus user-management
/epcc-plan 
/tdd-feature profile-editing
/epcc-code
/full-review
/epcc-commit
```

### Scenario 2: Production Hotfix

Fast, safe production fixes:

```bash
# 1. Set environment
export CLAUDE_ENV=production

# 2. Load production context
Load production hotfix context

# 3. Quick fix with full validation
/analyze-issue "User login failing"
/create-fix --priority critical
/security-scan --quick
/deploy --hotfix
```

### Scenario 3: Code Modernization

Systematic refactoring using slash commands:

```bash
# Execute modernization workflow
/modernize-codebase

# This command internally orchestrates:
# 1. Using @code-archaeologist agent to map legacy patterns
# 2. Running /identify-debt command
# 3. Using @architect agent to design modernization plan
# 4. Running /refactor-code --incremental --safe
# 5. Triggering quality_gates hook
# 6. Using @test-generator agent to ensure coverage maintained
```

Or define as a custom command:

```markdown
# .claude/commands/modernize-codebase.md
---
name: modernize-codebase
description: Systematically modernize legacy codebase
argument-hint: [module-name] [--incremental] [--safe]
---

## Workflow Steps

1. Using @code-archaeologist agent to map legacy patterns
2. Identify technical debt with /identify-debt
3. Using @architect agent to design modernization plan
4. Refactor code with /refactor-code --incremental --safe
5. Validate with quality gates
6. Using @test-generator agent to ensure coverage maintained
```

## Practice Exercises

### Exercise 1: Build Your First Composition
Create an agent that coordinates two others for your specific use case.

### Exercise 2: Design a Hook Chain
Build a progressive quality gate for your project with 3 levels.

### Exercise 3: Create a Workflow Command
Design a command that orchestrates 3+ operations you do regularly.

## Common Pitfalls

### Pitfall 1: Over-Engineering
**Problem**: Making everything complex  
**Solution**: Start simple, add complexity when needed

### Pitfall 2: Circular Dependencies
**Problem**: Agents calling each other infinitely  
**Solution**: Clear handoff directions, no loops

### Pitfall 3: Context Explosion
**Problem**: Too much context slows Claude  
**Solution**: Selective context loading

## Debugging Tips

### Tip 1: Trace Execution
```bash
export CLAUDE_DEBUG=true
claude --verbose "Your command"
```

### Tip 2: Test in Isolation
```bash
# Test single agent
claude --agent security-reviewer "Review this file"

# Test single hook
python .claude/hooks/my_hook.py test
```

### Tip 3: Profile Performance
```bash
time claude "Your command"
claude /cost  # Check token usage
```

## Next Steps

You've learned intermediate patterns for:
- ✅ Agent composition and coordination
- ✅ Hook chaining and filtering
- ✅ Command orchestration
- ✅ Context and error management
- ✅ Performance optimization

### Continue Your Journey

1. **🟡 Current Level**: Apply these patterns to your project
2. **🔴 Ready for More?**: 
   - Deep dive into [Advanced Agent Development](./agents-guide.md#advanced-agent-patterns)
   - Master [Complex Workflows](./epcc-workflow-guide.md)
   - Explore [Production Patterns](./best-practices.md)

### Suggested Next Reads

- **For Automation**: [Hooks Guide](./hooks-guide.md) - Advanced hook patterns
- **For Workflows**: [EPCC Workflow](./epcc-workflow-guide.md) - Complete methodology
- **For Testing**: [TDD Workflow](./tdd-workflow-guide.md) - Test-driven patterns
- **For Teams**: [Best Practices](./best-practices.md) - Team collaboration

### Quick Reference Card

Save this for easy reference:

```markdown
# Intermediate Patterns Cheat Sheet

## Agent Patterns
- Handoff: Agent A → Agent B → Agent C
- Hierarchy: General → Specialist → Expert
- Consensus: Multiple agents → Combined result

## Hook Patterns  
- Progressive: Dev → Staging → Production
- Conditional: If Python → Python checks
- Recovery: Fail → Auto-fix → Retry

## Command Patterns
- Workflow: Command calls commands
- Template: Parameterized operations
- Alias: Multiple names, same operation

## Context Patterns
- Persistent: Save between sessions
- Dynamic: Load based on task
- Scoped: Different contexts for different work
```

---

*Ready to implement these patterns? Start with one that solves your immediate need, then gradually add more as you gain confidence.*

---

*Last Updated: 2025-08-13*