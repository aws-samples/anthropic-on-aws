# TDD Commands Reference

Technical reference for Test-Driven Development workflow commands.

## Command Overview

The TDD workflow provides 2 specialized commands for implementing features and fixing bugs using test-driven development methodology.

| Command | Purpose | Output |
|---------|---------|--------|
| `/tdd/tdd-feature` | Implement new features with TDD | Tests + Implementation |
| `/tdd/tdd-bugfix` | Fix bugs using TDD approach | Regression tests + Fix |

## Command Specifications

### `/tdd/tdd-feature`

**Purpose**: Implements new features following strict TDD methodology (Red-Green-Refactor).

**Syntax**:
```bash
/tdd/tdd-feature [feature description] [--skip-integration]
```

**Arguments**:
- `feature description` (required): Description of the feature to implement
- `--skip-integration`: Skip integration tests (not recommended)

**Deployed Agents**:
- `@test-generator`: Creates comprehensive test suites first
- `@qa-engineer`: Identifies edge cases and quality scenarios
- `@performance-profiler`: Creates performance benchmarks
- `@security-reviewer`: Designs security test cases

**TDD Process**:
1. **RED Phase**: Write failing tests
2. **GREEN Phase**: Minimal implementation to pass
3. **REFACTOR Phase**: Improve code while maintaining tests

### `/tdd/tdd-bugfix`

**Purpose**: Fixes bugs by first writing tests that reproduce the issue.

**Syntax**:
```bash
/tdd/tdd-bugfix [bug description] [--hotfix]
```

**Arguments**:
- `bug description` (required): Description of the bug
- `--hotfix`: Emergency fix with minimal testing

**Deployed Agents**:
- `@test-generator`: Creates regression tests
- `@code-archaeologist`: Analyzes bug origins
- `@qa-engineer`: Ensures comprehensive coverage

**Process**:
1. Write test that reproduces the bug
2. Verify test fails
3. Implement minimal fix
4. Verify test passes
5. Add additional test cases
6. Refactor if needed

## Configuration

### Settings
```json
{
  "workflows": {
    "tdd": {
      "testFramework": "pytest",
      "coverageThreshold": 90,
      "strictMode": true
    }
  }
}
```

## Best Practices

1. **Never skip the RED phase** - Tests must fail first
2. **Keep cycles small** - One test at a time
3. **Maintain high coverage** - Aim for >90%
4. **Test behavior, not implementation**
5. **Refactor continuously** - Keep code clean

## See Also

- [TDD Workflow Guide](../../tdd-workflow-guide.md)
- [Test Generator Agent](../../agents-guide.md#development--testing)
- [EPCC Commands](./epcc-commands.md)