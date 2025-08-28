---
name: docs-explanation
description: Create in-depth explanations that build conceptual understanding of complex topics
version: 1.0.0
argument-hint: "[concept to explain] [--architecture|--design|--theory|--comparison]"
---

# Diataxis Explanation Command

You are in the **EXPLANATION** phase of the Diataxis documentation workflow. Your mission is to create understanding-oriented documentation that provides context, background, and deeper insights into concepts, designs, and decisions.

⚠️ **IMPORTANT**: This command is for creating EXPLANATORY documentation ONLY. Focus exclusively on:
- Providing conceptual understanding and context
- Explaining the "why" behind decisions
- Discussing alternatives and trade-offs
- Offering broader perspectives and connections
- Documenting everything in `docs/explanation/[topic-slug].md`

## Concept to Explain
$ARGUMENTS

If no specific concept was provided above, ask the user: "What concept, architecture, or design decision would you like explained in depth?"

## 🤔 Explanation Objectives

1. **Deepen Understanding**: Provide context and background
2. **Explain Rationale**: Why things are the way they are
3. **Discuss Alternatives**: What other approaches exist
4. **Make Connections**: How concepts relate to each other
5. **Provide Perspective**: Historical and future context

## Extended Thinking Strategy

- **Simple concepts**: Clear analogies and examples
- **Complex systems**: Think about relationships and interactions
- **Design decisions**: Think hard about trade-offs and constraints
- **Architectural choices**: Ultrathink about long-term implications

## Parallel Explanation Subagents

Deploy concurrent documentation specialists:
@docs-explanation-agent @architecture-documenter @system-designer @business-analyst

All subagents work in parallel to create comprehensive explanations:
- @docs-explanation-agent: Create conceptual, understanding-oriented content
- @architecture-documenter: Document design decisions and rationale
- @system-designer: Explain system architecture and patterns
- @business-analyst: Provide business context and requirements background

## Explanation Documentation Framework

### Step 1: Define the Topic

```markdown
## About [Topic]

### Overview
[High-level introduction to the concept]

### Why This Matters
- [Business impact]
- [Technical significance]
- [User benefits]

### Scope of This Explanation
This document explains:
- [Aspect 1]
- [Aspect 2]
- [Aspect 3]

This document does not cover:
- [Out of scope 1]
- [Out of scope 2]
```

### Step 2: Provide Context

```markdown
## Background and Context

### Historical Perspective
[How we got here - evolution of the concept]

### Current State
[Where we are now - current implementation/understanding]

### Industry Context
[How others approach this - standards and practices]

### Our Approach
[Why we chose this path - specific context]
```

### Step 3: Core Concepts

```markdown
## Understanding [Core Concept]

### The Fundamental Idea
[Explain the core concept in simple terms]

### Analogy
Think of [concept] like [familiar analogy]. Just as [analogy explanation], 
[concept] works by [parallel explanation].

### Key Principles
1. **Principle 1**: [Explanation]
   - Why it matters
   - How it works
   - Implications

2. **Principle 2**: [Explanation]
   - Why it matters
   - How it works
   - Implications

### Mental Model
```
[Visual or conceptual model]
Component A → Process → Component B
     ↓                        ↓
  Storage                  Output
```
```

### Step 4: Design Decisions

```markdown
## Design Decisions and Trade-offs

### Decision: [Specific Choice Made]

#### Options Considered
1. **Option A** (Chosen)
   - Pros: [Benefits]
   - Cons: [Drawbacks]
   - Why chosen: [Reasoning]

2. **Option B**
   - Pros: [Benefits]
   - Cons: [Drawbacks]
   - Why not: [Reasoning]

3. **Option C**
   - Pros: [Benefits]
   - Cons: [Drawbacks]
   - Why not: [Reasoning]

#### Trade-offs Accepted
- We prioritized [quality] over [quality]
- We accepted [limitation] to gain [benefit]
- We chose [approach] knowing [consequence]

#### Future Considerations
- This decision allows for [future possibility]
- We may revisit if [condition changes]
- Migration path exists to [alternative]
```

### Step 5: Relationships and Connections

```markdown
## How This Relates to Other Concepts

### Relationship to [Related Concept 1]
[Explain connection and interaction]

### Relationship to [Related Concept 2]
[Explain connection and interaction]

### Part of Larger System
```
[Broader Context]
    ├── [This Concept]
    ├── [Related System]
    └── [Connected Component]
```

### Dependencies
- Depends on: [What this needs]
- Depended on by: [What needs this]
- Interfaces with: [What it connects to]
```

## Explanation Deliverables

### Output File Location

All explanation documentation will be generated in the `docs/explanation/` directory with descriptive filenames based on the concept being explained.

### Explanation Template Structure

```markdown
# Understanding [Topic]

## Introduction
[Accessible introduction that draws readers in]

## The Big Picture
[Context and significance in the broader landscape]

## Core Concepts

### What Is [Concept]?
[Clear, accessible explanation]

### Why [Concept] Exists
[Problem it solves, need it addresses]

### How [Concept] Works
[Conceptual overview, not implementation details]

## Design Philosophy

### Guiding Principles
[What drives the design]

### Architectural Decisions
[Key choices and their rationale]

### Trade-offs
[What we optimized for vs. what we sacrificed]

## Alternatives and Comparisons

### Alternative Approaches
[Other ways to solve the same problem]

### When to Use Which
[Decision framework for choosing approaches]

### Evolution and History
[How approaches have evolved]

## Practical Implications

### Impact on Development
[How this affects day-to-day work]

### Impact on Users
[How this affects end users]

### Impact on Operations
[How this affects deployment and maintenance]

## Common Misconceptions

### Misconception 1: [Statement]
**Reality**: [Correction and explanation]

### Misconception 2: [Statement]
**Reality**: [Correction and explanation]

## Future Directions

### Current Limitations
[Honest assessment of current state]

### Planned Improvements
[Roadmap and vision]

### Industry Trends
[Where the field is heading]

## Summary
[Key takeaways and main points]

## Further Reading
- [Related explanation documents]
- [External resources]
- [Academic papers or industry articles]
```

## Explanation Best Practices

### DO:
- ✅ Provide rich context and background
- ✅ Explain the "why" behind decisions
- ✅ Discuss alternatives thoughtfully
- ✅ Make connections between concepts
- ✅ Use analogies and examples
- ✅ Admit uncertainties and opinions
- ✅ Consider multiple perspectives
- ✅ Include historical context

### DON'T:
- ❌ Include step-by-step instructions
- ❌ Focus on implementation details
- ❌ Provide technical specifications
- ❌ Write tutorials or how-tos
- ❌ Be prescriptive about usage
- ❌ Avoid difficult topics
- ❌ Present only one viewpoint

## Quality Checklist

Before finalizing explanation documentation:

- [ ] Concept clearly explained
- [ ] Context and background provided
- [ ] Design decisions documented
- [ ] Trade-offs discussed honestly
- [ ] Alternatives considered fairly
- [ ] Connections to other concepts made
- [ ] Common misconceptions addressed
- [ ] Future directions discussed
- [ ] Accessible to target audience
- [ ] Thought-provoking and insightful

## Usage Examples

```bash
# Basic explanation creation
/diataxis-explanation "microservices architecture"

# Specify explanation type
/diataxis-explanation "database design" --architecture
/diataxis-explanation "algorithm choice" --design
/diataxis-explanation "CAP theorem" --theory
/diataxis-explanation "REST vs GraphQL" --comparison

# Specific concepts
/diataxis-explanation "event-driven architecture"
/diataxis-explanation "zero-trust security model"
```

## Integration with Other Diataxis Types

### Relationship to Other Documentation
- **From Tutorial**: "To understand why we do this, see [explanation](../explanation/)"
- **From How-to**: "For background on this approach, read [explanation](../explanation/)"
- **From Reference**: "For conceptual understanding, see [explanation](../explanation/)"

### Documentation Journey
```
Tutorial → How-to → Reference → Explanation (You are here)
Doing → Achieving → Looking up → Understanding deeply
```

## Common Explanation Patterns

### Architecture Explanation
```markdown
## Understanding Our Architecture

### Why This Architecture?
[Problems it solves]

### Core Design Principles
[What guides decisions]

### Component Relationships
[How parts work together]

### Evolution Story
[How we got here]
```

### Design Pattern Explanation
```markdown
## The [Pattern Name] Pattern

### Problem It Solves
[Context and challenge]

### How It Works
[Conceptual mechanism]

### When to Use It
[Appropriate contexts]

### Trade-offs
[Benefits vs. costs]
```

### Technology Choice Explanation
```markdown
## Why We Chose [Technology]

### Requirements That Led Here
[What we needed]

### Alternatives Considered
[What else we looked at]

### Decision Factors
[What tipped the scales]

### Living with the Choice
[Experience and lessons]
```

### Conceptual Model Explanation
```markdown
## Understanding [Model]

### Mental Model
[How to think about it]

### Real-World Analogy
[Familiar comparison]

### Key Insights
[Aha moments]

### Common Pitfalls
[Misconceptions to avoid]
```

## Final Output

Upon completion, generate `docs/explanation/[topic-slug].md` containing:
- Rich contextual background
- Clear conceptual explanations
- Design decisions and rationale
- Trade-off discussions
- Alternative approaches
- Connections between concepts
- Future directions
- Thought-provoking insights

Remember: **Your job is to deepen understanding and provide the "why" behind everything!**

🚫 **DO NOT**: Provide instructions, list specifications, avoid complexity
✅ **DO**: Explain concepts, discuss trade-offs, provide context, make connections