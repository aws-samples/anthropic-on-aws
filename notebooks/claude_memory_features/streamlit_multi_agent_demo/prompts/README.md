# Prompts Directory

This directory contains organized prompts for the Claude Memory and Context Management demo.

## Quick Start

Use these prompts to explore multi-user workflows with Claude's shared memory system.

## Files

- **`system-prompts.txt`** - Shared system prompt to use for all chat contexts
- **`01-discovery-agent.txt`** - User prompts for discovery tasks (gathering requirements)
- **`02-solution-architect.txt`** - User prompts for architecture tasks (designing solutions)
- **`03-proposal-writer.txt`** - User prompts for proposal tasks (creating proposals)

**Note**: All chat contexts use the **same system prompt**. User roles (Alice, John, Sam) are defined by the user prompts, not different system prompts. This simpler approach is easier for beginners while still demonstrating multi-user collaboration.

## How to Use

### Tutorial Path (Beginner)

Follow the tutorial at `/docs/tutorials/memory-and-context-management.md` which walks you through:
1. Setting up the environment
2. Creating your first memory file
3. Simulating a multi-user workflow (Alice, John, Sam)
4. Triggering context management
5. Understanding the results

### Demo Path (Presenter)

Follow the live demo script at `/live-demo-script.md` for a 5-minute presentation showing:
1. Three team members (Alice, John, Sam) collaborating through shared memory
2. Context management clearing old tools
3. Memory persistence after clearing
4. Measurable cost savings

### Quick Test Path (Experimenter)

1. Launch the Streamlit app: `streamlit run dual_chat_streamlit.py`
2. Add 3 chat windows (click "➕ Add New Chat" twice)
3. Verify all chats use the **same system prompt** from `system-prompts.txt` (should be default)
4. Copy user prompts from files 01-03 into Chat Context 1, 2, and 3 respectively
5. Watch the multi-user coordination happen through shared memory!

## Prompt Structure

Each user prompt file contains:
- Simple example prompts (1-2 sentences)
- Detailed example prompts (full requirements)
- Follow-up prompts for continuing the workflow

All chat contexts use the same system prompt. User roles and behaviors are defined through your user messages.

## Customizing User Roles

Want to create your own specialized user role patterns? Use these user message patterns:

**Pattern**: "Hi, I'm [NAME] from [COMPANY]. [Role instruction]. Based on what you have in memory about [TOPIC], please [specific task]."

**Examples**:
- **Risk Assessor**: "I'm reviewing the proposed solution. Based on the project requirements in memory, please identify potential risks and compliance issues."
- **Cost Estimator**: "Based on the solution architecture in memory, please create a detailed cost breakdown and ROI analysis."
- **Technical Writer**: "Based on the solution design in memory, please create comprehensive technical documentation."
- **Compliance Reviewer**: "Review the requirements and solution in memory for HIPAA, SOC2, and GDPR compliance."
- **Data Analyst**: "Analyze the customer requirements in memory and identify key patterns and metrics."
- **Project Manager**: "Based on all information in memory, create a project plan with milestones and dependencies."

## Context Management Settings

For demos and learning, use these settings in the Streamlit app:
- **Trigger Threshold**: 2,000 tokens (fast demonstration)
- **Keep Last N Tool Uses**: 0 (maximum clearing)
- **Clear At Least**: 1,000 tokens

For production, use these settings:
- **Trigger Threshold**: 20,000-50,000 tokens (realistic workload)
- **Keep Last N Tool Uses**: 3-5 (preserve recent context)
- **Clear At Least**: 2,000 tokens

## Tips for Best Results

1. **Be specific in introductions**: Include role, company, project details
2. **Ask for memory explicitly**: "Please store this in memory" when needed
3. **Reference memory across contexts**: "Based on what's in memory about X..."
4. **Use descriptive names**: Help Claude organize memory files logically
5. **Watch token counts**: Monitor the "Input: X tokens" display to see context grow

## Troubleshooting

**Claude not creating memory files?**
- Try adding explicit instructions: "Please save this information to memory"
- Verify the system prompt includes the memory protocol (should be default)

**Context not clearing?**
- Verify trigger threshold is set low enough (2,000 for demos)
- Try memory-heavy operations: "Show me all memories in the system" (repeat 3-4 times)
- Check that "Enable Context Management" is checked

**Chat contexts not finding each other's memory?**
- Make sure all chat contexts are using memory consistently
- Try explicit prompts: "Check memory files for information about X"
- Verify memory files exist in the "📁 Memory Files" section

## Examples by Scenario

### Scenario 1: Sales Pipeline
```
User 1 - Alice (Discovery): Provides customer needs that Claude stores
User 2 - John (Solution): Asks Claude to design solution from stored requirements
User 3 - Sam (Proposal): Asks Claude to write proposal using stored info
```

### Scenario 2: Software Development
```
User 1 (Requirements): Provides feature requirements that Claude stores
User 2 (Design): Asks Claude to create technical design from requirements
User 3 (Code): Asks Claude to generate implementation plan
User 4 (Test): Asks Claude to create test strategy
```

### Scenario 3: Research Pipeline
```
User 1 (Search): Provides research findings that Claude stores
User 2 (Analysis): Asks Claude to analyze stored findings
User 3 (Synthesis): Asks Claude to combine insights
User 4 (Report): Asks Claude to write final report
```

### Scenario 4: Customer Support
```
User 1 (Triage): Provides issue details that Claude categorizes and stores
User 2 (Research): Asks Claude to find solutions from stored knowledge
User 3 (Resolution): Asks Claude to provide solution
User 4 (Follow-up): Asks Claude to verify and document resolution
```

## Additional Resources

- **Tutorial**: `/docs/tutorials/memory-and-context-management.md`
- **Live Demo Script**: `/live-demo-script.md`
- **Trigger Guide**: `/trigger-context-clearing-guide.md`
- **Memory Tool Docs**: https://docs.anthropic.com/en/docs/build-with-claude/tool-use/memory-tool
- **Context Management Docs**: https://docs.anthropic.com/en/docs/build-with-claude/context-editing

## Contributing

Have a great agent configuration or workflow? Consider contributing:
1. Create a new prompt file with clear documentation
2. Test it thoroughly with the Streamlit app
3. Include example outputs and success criteria
4. Submit with a description of the use case

---

**Ready to explore multi-user coordination? Start with the tutorial or jump into the demo!**
