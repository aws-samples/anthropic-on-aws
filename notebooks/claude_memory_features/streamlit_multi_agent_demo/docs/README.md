# Documentation Index

Welcome to the Claude Memory and Context Management documentation!

## Getting Started

Choose your path based on your goal:

### I want to learn the fundamentals (60 minutes)
**Tutorial**: [Memory and Context Management](/docs/tutorials/memory-and-context-management.md)

A hands-on, beginner-friendly tutorial that teaches:
- How Claude's memory system works
- Building a multi-user workflow
- Understanding context management
- Measuring cost savings

**Perfect for**: Beginners, learners, anyone new to Claude's memory features

---

### I need to get running quickly (10 minutes)
**Quick Start**: [Quick Start Guide](/docs/tutorials/quick-start.md)

Minimal setup to see the demo in action:
- 5 steps to launch
- 3 simple prompts
- Immediate results

**Perfect for**: Quick experimentation, demos, proof of concepts

---

### I'm presenting this to others (5 minutes)
**Demo Script**: [Live Demo Script](/live-demo-script.md)

A polished 5-minute presentation script:
- Clear narrative arc
- Expected timings
- What to say at each moment
- Troubleshooting during presentation

**Perfect for**: Sales demos, technical presentations, stakeholder reviews

---

### I want to trigger context clearing reliably
**Trigger Guide**: [Context Clearing Guide](/trigger-context-clearing-guide.md)

Tactical strategies for triggering context management:
- Fastest methods
- Token math explained
- Settings for different scenarios
- Troubleshooting tips

**Perfect for**: Testing, verification, understanding token mechanics

---

### I need ready-to-use prompts
**Prompts Directory**: [Prompts Collection](/prompts/)

Organized prompts for the demo:
- Shared system prompt for all contexts
- User prompts for each user role (Alice, John, Sam)
- Examples and variations
- Custom user role patterns

**Note**: All chat contexts use the same system prompt. User roles are defined by their messages.

**Perfect for**: Quick demos, experimentation, building custom workflows

---

## Documentation Structure

```
docs/
├── README.md (you are here)
└── tutorials/
    ├── memory-and-context-management.md  (Main tutorial)
    └── quick-start.md                     (10-minute version)

prompts/
├── README.md                              (Prompts guide)
├── system-prompts.txt                     (Shared system prompt)
├── 01-discovery-agent.txt                 (Discovery user prompts)
├── 02-solution-architect.txt              (Architect user prompts)
└── 03-proposal-writer.txt                 (Proposal user prompts)

/ (root)
├── live-demo-script.md                    (Presentation script)
├── trigger-context-clearing-guide.md      (Trigger strategies)
└── dual_chat_streamlit.py                 (The application)
```

## Key Concepts Covered

### Memory Tool
- Persistent file-based storage
- Commands: view, create, str_replace, delete
- Shared across all agents and conversations
- Never cleared by context management

### Context Management (Context Editing)
- Automatic clearing of old tool results
- Configurable trigger thresholds
- Smart retention of semantic content
- Measurable token savings

### Multi-User Workflows
- Multiple users sharing knowledge with Claude
- Knowledge sharing through memory files
- Workflow coordination patterns
- Production-ready architecture

### Cost Optimization
- 50-80% token reduction in multi-agent systems
- Real-time statistics and monitoring
- Scaling strategies
- ROI calculations

## Common Questions

### How does memory differ from context?

**Context** = Working memory (conversation history)
- Limited capacity (~200K tokens)
- Includes all messages, tool calls, and results
- Gets cleared by context management
- Costs money on every API call

**Memory** = Long-term storage (files on disk)
- Unlimited capacity
- Only specific knowledge you choose to save
- Never cleared automatically
- Only costs money when accessed

**Analogy**: Context is your RAM, memory is your hard drive.

### Why do I need both?

Claude needs context to understand the immediate conversation, but context grows unbounded in long conversations. Memory provides a persistent storage layer that:
- Survives context clearing
- Enables multi-agent coordination
- Scales indefinitely
- Reduces redundant information in context

### When should I use this pattern?

**Perfect for**:
- Multi-agent systems with handoffs
- Long-running conversations (>50 turns)
- Applications with recurring users
- Cost-sensitive high-volume applications
- Complex workflows requiring state persistence

**Not needed for**:
- Short, single-turn interactions
- Stateless API calls
- Simple Q&A applications
- Low-volume applications

### What are the limitations?

**Memory tool**:
- Files must be explicitly created (not automatic)
- Requires explicit read operations (costs tokens)
- No built-in search or query capabilities
- Manual organization required

**Context management**:
- Can't recover cleared tool results
- May clear semantically important content if not in memory
- Requires careful threshold tuning
- Not suitable if full audit trail is legally required

### How much does this save?

**Typical savings**: 50-80% token reduction in multi-agent systems

**Example calculation**:
- 3-agent pipeline, 20 messages each = 60 total messages
- Average 5 tool calls per message = 300 total tool operations
- Without clearing: 300 × 400 tokens = 120,000 tokens
- With clearing (keeping last 10): 10 × 400 tokens = 4,000 tokens
- **Savings**: 116,000 tokens = 97% reduction

**At scale**:
- 10,000 daily conversations × 116,000 tokens saved = 1.16B tokens/day
- At $3/million tokens = **$3,480/day** = **$1.27M/year**

## Additional Resources

### Official Documentation
- [Memory Tool API](https://docs.anthropic.com/en/docs/build-with-claude/tool-use/memory-tool)
- [Context Editing Guide](https://docs.anthropic.com/en/docs/build-with-claude/context-editing)
- [Tool Use Overview](https://docs.anthropic.com/en/docs/build-with-claude/tool-use)

### AWS Bedrock
- [Bedrock Setup](https://docs.aws.amazon.com/bedrock/latest/userguide/getting-started.html)
- [Claude on Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-anthropic-claude.html)
- [Pricing Calculator](https://aws.amazon.com/bedrock/pricing/)

### Community
- [Anthropic Discord](https://discord.gg/anthropic) - Community support
- [Anthropic Cookbook](https://github.com/anthropics/anthropic-cookbook) - More examples
- [API Reference](https://docs.anthropic.com/en/api) - Complete API docs

## Feedback

Found an issue or have a suggestion? Please:
1. Check existing documentation for answers
2. Review troubleshooting sections
3. Create an issue with clear reproduction steps
4. Include logs, settings, and expected vs actual behavior

## Contributing

Want to improve these docs? We welcome:
- Additional examples and use cases
- Clarifications and corrections
- New agent configurations
- Production deployment guides
- Performance optimization tips

## Version Information

- **Claude Model**: Sonnet 4.5 (claude-sonnet-4-5-20250929)
- **Memory Tool**: Version 20250818
- **Context Management**: Beta 2025-06-27
- **Streamlit**: 1.30+
- **Python**: 3.8+
- **AWS SDK (boto3)**: Latest

## License

This documentation is provided as-is for educational purposes. The Streamlit application and prompts are examples for learning and demonstration.

---

**Ready to start? Pick your path above and dive in!**

*Last updated: January 2025*
