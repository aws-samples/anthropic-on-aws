# Contributing to Claude Code Advanced Patterns

Thank you for your interest in contributing to the Claude Code Advanced Patterns repository! This guide will help you get started with contributing to the project.

## 🚀 Getting Started

### Fork and Clone

1. Fork the repository on GitHub: https://github.com/aws-samples/anthropic-on-aws
2. Clone your fork locally:
```bash
git clone https://github.com/YOUR-USERNAME/anthropic-on-aws.git
cd anthropic-on-aws/advanced-claude-code-patterns
```
3. Add the upstream remote:
```bash
git remote add upstream https://github.com/aws-samples/anthropic-on-aws.git
```

### Development Setup

1. Create a new branch for your feature or fix:
```bash
git checkout -b feature/your-feature-name
```

2. Make your changes following the guidelines below

3. Test your changes thoroughly

4. Commit your changes with a clear message:
```bash
git commit -m "feat: Add new agent for database migrations"
```

## 📝 Contribution Guidelines

### What We're Looking For

We welcome contributions in the following areas:

#### 1. New Agents
- Specialized agents for specific development tasks
- Improvements to existing agents
- Agent documentation and examples

#### 2. Hook Configurations
- New hook patterns for automation
- Quality gate improvements
- Integration with new tools

#### 3. Workflow Templates
- Complex workflow orchestrations
- Industry-specific workflows
- Performance optimizations

#### 4. Command Templates
- New slash commands
- Enhanced argument handling
- Command documentation

#### 5. Documentation
- Improvements to existing guides
- New tutorials and examples
- Translations

#### 6. Bug Fixes
- Issue resolution
- Performance improvements
- Security enhancements

### Code Standards

#### For Agents (`.md` files in `/agents/`)
```markdown
---
name: agent-name
description: Clear, concise description
model: sonnet|opus  # Choose appropriate model
version: 1.0.0
tools: [List, Of, Tools]
---

# Agent documentation here
```

#### For Hooks (`.json` files in `/hooks/`)
```json
{
  "name": "hook-name",
  "description": "What this hook does",
  "hooks": {
    "EventType": [
      {
        "type": "command|agent",
        "blocking": true|false,
        "description": "What this specific hook does"
      }
    ]
  }
}
```

#### For Commands (`.md` files in `/commands/`)
```markdown
---
name: command-name
description: Brief description
argument-hint: [optional-args] [--flags]
---

# Command implementation
```

### Documentation Standards

- Use clear, concise language
- Include practical examples
- Follow existing formatting patterns
- Test all code examples
- Update related documentation when making changes

## 🔄 Pull Request Process

1. **Update your branch** with the latest upstream changes:
```bash
git fetch upstream
git rebase upstream/main
```

2. **Push your branch** to your fork:
```bash
git push origin feature/your-feature-name
```

3. **Create a Pull Request** on GitHub:
   - Go to https://github.com/aws-samples/anthropic-on-aws/tree/main/advanced-claude-code-patterns
   - Click "New Pull Request"
   - Select your fork and branch
   - Fill out the PR template with:
     - Clear description of changes
     - Issue number (if applicable)
     - Testing performed
     - Documentation updates

4. **PR Requirements**:
   - Clear, descriptive title
   - Detailed description of changes
   - Links to related issues
   - Tests pass (if applicable)
   - Documentation updated
   - No merge conflicts

### PR Title Format
Use conventional commit format:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test additions/changes
- `chore:` Maintenance tasks

Examples:
- `feat: Add PostgreSQL migration agent`
- `fix: Correct model selection in security-reviewer agent`
- `docs: Improve TDD workflow guide examples`

## 🧪 Testing

Before submitting your PR, ensure:

1. **Syntax Validation**:
   - Markdown files are properly formatted
   - YAML files are valid
   - JSON files are valid

2. **Functionality Testing**:
   - Agents work as expected
   - Hooks trigger correctly
   - Workflows complete successfully
   - Commands accept arguments properly

3. **Documentation**:
   - All new features are documented
   - Examples work as shown
   - Links are not broken

## 🎯 Areas of Focus

### High Priority Contributions

1. **Enterprise Patterns**
   - Multi-team workflows
   - Compliance automation
   - Audit trails

2. **Performance Optimizations**
   - Faster agent execution
   - Reduced token usage
   - Caching strategies

3. **Security Enhancements**
   - Security scanning agents
   - Vulnerability detection hooks
   - Secure coding workflows

4. **Integration Patterns**
   - New MCP server integrations
   - Third-party tool connections
   - API integrations

### Community Requests

Check our [GitHub Issues](https://github.com/aws-samples/anthropic-on-aws/issues) for:
- Feature requests labeled `help wanted`
- Bug reports labeled `good first issue`
- Documentation needs labeled `documentation`

## 💬 Communication

### Questions and Discussions

- Open a [GitHub Discussion](https://github.com/aws-samples/anthropic-on-aws/discussions) for:
  - General questions
  - Feature ideas
  - Best practices
  - Community showcase

### Reporting Issues

When reporting issues, please include:
- Clear description of the problem
- Steps to reproduce
- Expected behavior
- Actual behavior
- Claude Code version
- Operating system

## 📜 License

By contributing to this repository, you agree that your contributions will be licensed under the same license as the project (MIT License).

## 🙏 Recognition

Contributors will be:
- Listed in the project's contributors section
- Credited in release notes
- Recognized in documentation where appropriate

## 📚 Resources

- [Claude Code Documentation](https://docs.anthropic.com/en/docs/claude-code)
- [Project README](README.md)
- [Quick Start Guide](docs/quick-start.md)
- [Best Practices](docs/best-practices.md)

## ✅ Checklist for Contributors

Before submitting your PR, ensure you have:

- [ ] Forked and cloned the repository
- [ ] Created a feature branch
- [ ] Made your changes following the standards
- [ ] Tested your changes thoroughly
- [ ] Updated relevant documentation
- [ ] Committed with a clear message
- [ ] Pushed to your fork
- [ ] Created a PR with detailed description
- [ ] Responded to any review feedback

Thank you for contributing to Claude Code Advanced Patterns! Your contributions help make AI-assisted development better for everyone.

---

**Questions?** Open a discussion or reach out through GitHub Issues.