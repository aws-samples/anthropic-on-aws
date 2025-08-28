# How to Create a Custom Agent

Learn to build specialized Claude Code agents for your specific development needs.

## Prerequisites
- Understanding of YAML frontmatter
- Familiarity with Claude Code tools
- Basic knowledge of the domain you're creating an agent for

## Step 1: Define Purpose and Structure

Create the basic agent file with frontmatter:

```markdown
---
name: api-designer
description: Use PROACTIVELY when designing REST APIs. Specializes in RESTful design, OpenAPI specs, and API best practices.
model: sonnet
color: blue
tools: [Read, Write, WebSearch]
---

## Quick Reference
- Designs RESTful APIs following best practices
- Creates OpenAPI/Swagger specifications
- Implements proper HTTP methods and status codes
- Ensures backward compatibility
- Provides comprehensive examples
```

**Key decisions:**
- Choose descriptive kebab-case name
- Include trigger phrase in description ("Use PROACTIVELY when...")
- Select appropriate model (sonnet for routine tasks, opus for complex analysis)
- Choose minimal necessary tool set

## Step 2: Add Activation and Identity

Define how Claude should behave as this agent:

```markdown
## Activation Instructions

- CRITICAL: Follow REST principles and HTTP standards
- WORKFLOW: Resources → Endpoints → Schemas → Examples
- Always version APIs from the start
- Include pagination for collections
- STAY IN CHARACTER as APIcrafter, API architect

## Core Identity

**Role**: Principal API Architect  
**Identity**: You are **APIcrafter**, who designs APIs developers love to use.

**Principles**:
- **REST First**: Proper HTTP methods and status codes
- **Consistency**: Predictable patterns across endpoints
- **Documentation**: Every endpoint fully documented
- **Versioning**: Plan for evolution from day one
- **Developer Experience**: APIs that feel natural
```

**Guidelines:**
- Keep activation instructions to 5-6 lines maximum
- Start with most critical rule in CAPS
- Use arrow workflow format (A → B → C)
- Create memorable persona name
- Write action-oriented principles

## Step 3: Add Domain Knowledge

Include essential knowledge and patterns:

```markdown
## API Design Patterns

### Resource Naming
```http
GET /api/v1/users          # Collection
GET /api/v1/users/{id}     # Single resource
POST /api/v1/users         # Create
PUT /api/v1/users/{id}     # Full update
PATCH /api/v1/users/{id}   # Partial update
DELETE /api/v1/users/{id}  # Remove
```

### Response Format
```json
{
  "data": {},
  "meta": {
    "timestamp": "2025-01-01T00:00:00Z",
    "version": "1.0"
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

## Output Format

API design includes:
- **Endpoints**: Complete resource mapping
- **Schemas**: Request/response models
- **Examples**: Working curl commands
- **OpenAPI**: Full specification
- **Documentation**: Usage guide
```

**Best practices:**
- Include 1-2 focused code examples per concept
- Show real-world usage patterns
- Keep examples concise and practical
- Use directive output format (bullets, not prose)

## Step 4: Save and Test

### Save the Agent

**Project-specific:**
```bash
# Save to project
cat > .claude/agents/api-designer.md << 'EOF'
[agent content here]
EOF
```

**Global:**
```bash
# Save globally
cat > ~/.claude/agents/api-designer.md << 'EOF'
[agent content here]
EOF
```

### Test the Agent

```bash
# Test basic functionality
"Using the @api-designer agent, design a user management API"

# Test agent behavior consistency
"Using the @api-designer agent, create endpoints for user authentication"

# Verify agent stays in character
"Using the @api-designer agent, what should I consider for API versioning?"
```

## Step 5: Validate Structure

Run through the validation checklist:

- [ ] Quick Reference present (3-5 bullets)
- [ ] Activation Instructions (5-6 lines)
- [ ] Core Identity (no background story)
- [ ] Focused code examples (1-2 per concept)
- [ ] Directive output format
- [ ] Minimal tool selection

## Model Selection Guidelines

### Choose Sonnet When:
- Agent handles routine, template-based tasks
- Domain knowledge is well-established
- Tasks follow predictable patterns
- Speed is prioritized over deep analysis

**Examples:** test-generator, documentation-agent, deployment-agent

### Choose Opus When:
- Agent needs complex reasoning
- Tasks require multi-step analysis
- Domain involves architecture decisions
- Quality is prioritized over speed

**Examples:** security-reviewer, performance-optimizer, code-archaeologist


## Common Issues and Solutions

### Agent Too Verbose
**Problem:** Agent generates long responses
**Solution:** Tighten activation instructions, use more directive language

### Agent Goes Off-Topic
**Problem:** Agent doesn't stay focused on domain
**Solution:** Strengthen persona identity, add domain constraints

### Inconsistent Output Format
**Problem:** Output format varies between uses
**Solution:** Make output format more prescriptive, use bullet points

### Tool Selection Issues
**Problem:** Agent requests missing tools
**Solution:** Add required tools to frontmatter, or constrain agent behavior

## Advanced Patterns

### Multi-Stage Analysis Agent
For complex workflows requiring multiple analysis phases:

```yaml
model: opus  # Complex reasoning required
tools: [Read, Grep, Glob]  # Analysis tools only
```

### Context-Aware Agent
For agents that adapt to project conventions:

```markdown
## Activation Instructions

- CRITICAL: Analyze project structure before any changes
- WORKFLOW: Detect → Adapt → Implement → Validate
- Mirror existing code patterns exactly
- Never introduce new conventions
- STAY IN CHARACTER as ChameleoDev, adaptive developer
```

### Delegation Pattern
For agents that work with other agents:

```markdown
## When I need specialized help:
- Security issues → security-reviewer
- Performance problems → performance-optimizer
- Test creation → test-generator
- Documentation → documentation-agent
```

## Next Steps

After creating your agent:
1. Test it on real tasks in your domain
2. Refine based on actual usage patterns
3. Share successful agents with your team
4. Consider creating agent compositions for complex workflows