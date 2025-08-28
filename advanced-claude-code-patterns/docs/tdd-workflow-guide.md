# Test-Driven Development (TDD) Workflow Guide for Claude Code

## Overview

Test-Driven Development with Claude Code transforms the traditional Red-Green-Refactor cycle into an AI-assisted workflow that ensures robust, well-tested code from the start. This guide shows how to leverage Claude Code's capabilities for effective TDD practices.

## Core TDD Principle: Write Tests First

The fundamental rule of TDD with Claude Code:
1. **RED**: Write a failing test that defines desired functionality
2. **GREEN**: Write minimal code to make the test pass
3. **REFACTOR**: Improve the code while keeping tests green

## TDD Workflow with Claude Code

### Using Our TDD Commands and Agents

```
# Method 1: Use the dedicated TDD command for features
💬 /tdd/tdd-feature "user authentication with JWT tokens"

# Method 2: Use the test-generator agent directly
💬 Using the @test-generator agent, create failing tests for user authentication

# Method 3: Combine with QA engineer agent for comprehensive coverage
💬 Using the @qa-engineer agent, design test scenarios for authentication
```

### Step 1: Define Requirements Through Tests

### Step 2: Confirm Tests Fail (RED Phase)

```
# Use our quality gates hook to verify tests fail:
💬 Run tests and verify they fail as expected

# The quality_gates.json hook automatically:
# - Runs the test suite
# - Confirms all new tests fail
# - Blocks progress until tests are properly failing
```

### Step 3: Implement Minimal Code (GREEN Phase)

```
# Use the TDD command to implement:
💬 /tdd/tdd-feature --implement "make authentication tests pass"

# Or use the development workflow:
💬 Using the tdd_development workflow, implement minimal code for passing tests

# The implementation follows TDD principles:
# - Only code to satisfy tests
# - No extra features
# - Continuous test execution
```

### Step 4: Refactor with Confidence (REFACTOR Phase)

```
# Use the refactor command:
💬 /refactor-code "improve authentication design patterns"

# Or use the architect agent for design improvements:
💬 Using the @architect agent, refactor authentication for better patterns while keeping tests green

# The quality_gates hook ensures:
# - All tests remain passing
# - Coverage doesn't decrease
# - Performance doesn't degrade
```

## Extended Thinking for TDD

### Test Complexity Levels

- **Simple unit tests**: Standard TDD cycle
- **Integration tests**: Think about component interactions
- **End-to-end tests**: Think hard about user journeys
- **Performance tests**: Think harder about load patterns
- **Security tests**: Ultrathink on attack vectors

## Leveraging TDD Commands

### Available TDD Commands

| Command | Purpose | Agent Used | Output |
|---------|---------|------------|--------|
| `/tdd/tdd-feature` | Complete TDD cycle for features | test-generator | Tests, implementation, refactoring |
| `/tdd/tdd-bugfix` | Fix bugs with test-first approach | test-generator + qa-engineer | Regression tests, bug fix |
| `/generate-tests` | Create comprehensive test suite | test-generator | Test files with full coverage |
| `/code-review` | Review TDD compliance | security-reviewer | TDD adherence report |

### 1. Test-First Feature Development

```markdown
---
name: tdd-feature
description: Develop features using Test-Driven Development
model: opus
tools: [Write, Read, Edit, Bash, Task]
---

# TDD Feature Development

When developing a new feature, follow strict TDD principles.

## Process

1. **Understand Requirements**
   - Think about acceptance criteria
   - Identify edge cases
   - Consider error scenarios

2. **Write Test Suite First**
   ```python
   # Example test structure
   def test_feature_happy_path():
       """Test normal operation"""
       assert feature_works_correctly()
   
   def test_feature_edge_cases():
       """Test boundary conditions"""
       assert handles_edge_cases()
   
   def test_feature_error_handling():
       """Test failure scenarios"""
       assert graceful_error_handling()
   ```

3. **Verify Tests Fail**
   - Run tests before implementation
   - All should fail with clear messages
   - This proves tests are actually testing

4. **Implement Incrementally**
   - Write minimal code for one test
   - Run tests after each change
   - Commit when test passes

5. **Refactor Continuously**
   - After each passing test
   - Keep all tests green
   - Improve design iteratively

## Parallel TDD Subagents

Deploy concurrent testing specialists:

1. **Unit Test Agent**: Write isolated component tests
2. **Integration Agent**: Test component interactions
3. **Edge Case Hunter**: Think hard about boundary conditions
4. **Performance Validator**: Ensure no regression

## Example Usage

```bash
# Start TDD for new feature
/tdd/tdd-feature "Add user profile picture upload with size validation"

# Claude will:
# 1. Write comprehensive test suite
# 2. Verify all tests fail
# 3. Implement feature incrementally
# 4. Refactor for clean code
# 5. Ensure 100% test coverage
```
```

### 2. Test-First Bug Fixes

Create `.claude/commands/tdd/tdd-bugfix.md`:

```markdown
---
name: tdd-bugfix
description: Fix bugs using TDD approach
model: sonnet
tools: [Read, Edit, Bash, Grep]
---

# TDD Bug Fix

Fix bugs by first writing tests that reproduce them.

## Bug Fix Process

1. **Reproduce the Bug**
   ```python
   def test_reproduces_bug():
       """Test that demonstrates the bug"""
       # This test should fail initially
       result = buggy_function(problematic_input)
       assert result != expected_output
   ```

2. **Write Expected Behavior Test**
   ```python
   def test_expected_behavior():
       """Test that defines correct behavior"""
       result = fixed_function(problematic_input)
       assert result == expected_output
   ```

3. **Fix the Bug**
   - Make minimal changes
   - Run tests continuously
   - Ensure no regression

4. **Add Edge Case Tests**
   - Prevent similar bugs
   - Test related functionality
   - Improve coverage

## Example

```bash
# Fix authentication bug
/tdd/tdd-bugfix "Users can login with wrong password"

# Claude will:
# 1. Write test that reproduces bug
# 2. Confirm test fails (bug exists)
# 3. Fix the bug
# 4. Verify test passes
# 5. Add regression tests
```
```

### 3. Test Coverage Enhancement

Create `.claude/commands/enhance-coverage.md`:

```markdown
---
name: enhance-coverage
description: Improve test coverage using TDD principles
model: sonnet
tools: [Read, Write, Bash, Grep]
---

# Enhance Test Coverage

Systematically improve test coverage using TDD.

## Coverage Enhancement Process

1. **Analyze Current Coverage**
   ```bash
   pytest --cov=. --cov-report=term-missing
   ```

2. **Identify Gaps**
   - Uncovered lines
   - Missing edge cases
   - Untested error paths

3. **Write Missing Tests**
   - Start with critical paths
   - Add edge cases
   - Include error scenarios

4. **Verify Coverage Improvement**
   - Target: 80% minimum
   - Critical code: 95%+
   - New code: 100%

## Thinking Strategy

- **Coverage < 60%**: Think hard about comprehensive test suite
- **Coverage 60-80%**: Think about edge cases and error paths
- **Coverage > 80%**: Focus on critical path coverage

## Example

```bash
/enhance-coverage --target 90

# Claude will:
# 1. Run coverage analysis
# 2. Identify uncovered code
# 3. Write tests for gaps
# 4. Achieve target coverage
```
```

## Integrating Agents for TDD

### Agent Collaboration Pattern

```
# Step 1: QA Engineer designs test strategy
💬 Using the @qa-engineer agent, create test plan for payment processing

# Step 2: Test Generator writes tests
💬 Using the @test-generator agent, implement the test plan with failing tests

# Step 3: Architect reviews design
💬 Using the @architect agent, review test design for completeness

# Step 4: Developer implements
💬 Implement minimal code to pass all tests

# Step 5: Performance Optimizer validates
💬 Using the @performance-optimizer agent, ensure no performance regression
```

### Agent Responsibilities in TDD

| Agent | TDD Phase | Responsibilities |
|-------|-----------|------------------|
| **test-generator** | RED | Write failing tests first |
| **qa-engineer** | RED | Design test scenarios and edge cases |
| **architect** | GREEN | Guide minimal implementation design |
| **business-analyst** | RED | Validate tests match requirements |
| **performance-optimizer** | REFACTOR | Ensure optimization doesn't break tests |
| **security-reviewer** | ALL | Verify security tests included |

## TDD Best Practices with Claude Code

### 1. Test Naming Conventions

```python
# Good test names describe behavior
def test_user_cannot_login_with_invalid_email():
    """Verify login fails with malformed email"""
    pass

def test_rate_limiter_blocks_after_five_attempts():
    """Verify rate limiting activates correctly"""
    pass

# Not just "test_login" or "test_1"
```

### 2. Test Independence

```python
# Each test should be independent
class TestUserAuth:
    def setup_method(self):
        """Fresh state for each test"""
        self.db = create_test_database()
        self.user = create_test_user()
    
    def teardown_method(self):
        """Clean up after each test"""
        self.db.cleanup()
```

### 3. Test Data Builders

```python
# Use builders for test data
class UserBuilder:
    def __init__(self):
        self.user = {
            'email': 'test@example.com',
            'password': 'secure123',
            'role': 'user'
        }
    
    def with_admin_role(self):
        self.user['role'] = 'admin'
        return self
    
    def with_email(self, email):
        self.user['email'] = email
        return self
    
    def build(self):
        return User(**self.user)

# Usage in tests
admin = UserBuilder().with_admin_role().build()
```

### 4. Test Doubles and Mocking

```python
# Use appropriate test doubles
from unittest.mock import Mock, patch

def test_sends_welcome_email():
    """Test email sending without actual SMTP"""
    with patch('app.email.send') as mock_send:
        user = create_user('new@example.com')
        mock_send.assert_called_once_with(
            to='new@example.com',
            subject='Welcome!'
        )
```

## TDD Patterns for Common Scenarios

### API Endpoint Testing

```python
# Test-first API development
def test_api_endpoint_returns_user_data():
    """API should return user JSON"""
    response = client.get('/api/users/123')
    assert response.status_code == 200
    assert response.json()['id'] == 123

def test_api_endpoint_requires_authentication():
    """API should reject unauthenticated requests"""
    response = client.get('/api/users/123')
    assert response.status_code == 401
```

### Database Operations

```python
# Test-first database operations
def test_user_repository_saves_user():
    """Repository should persist user"""
    user = User(email='test@example.com')
    repo.save(user)
    
    retrieved = repo.find_by_email('test@example.com')
    assert retrieved is not None
    assert retrieved.email == 'test@example.com'
```

### Async Operations

```python
# Test-first async code
import pytest
import asyncio

@pytest.mark.asyncio
async def test_async_data_processing():
    """Async processor should handle data correctly"""
    processor = AsyncDataProcessor()
    result = await processor.process(test_data)
    assert result.status == 'completed'
```

## Hook Integration for TDD Enforcement

### Quality Gates Hook for TDD

The `quality_gates.json` hook enforces TDD practices:

```json
{
  "name": "quality_gates",
  "triggers": ["pre-commit", "pre-push"],
  "conditions": {
    "test_coverage": ">= 80%",
    "tests_pass": true,
    "tests_exist_before_code": true
  },
  "actions": [
    {
      "type": "block",
      "message": "Tests must be written before code"
    }
  ]
}
```

### Auto-Recovery Hook for Failed Tests

```json
{
  "name": "auto_recovery",
  "triggers": ["test-failure"],
  "actions": [
    {
      "type": "revert",
      "message": "Reverting code that breaks tests"
    },
    {
      "type": "notify",
      "message": "Tests failed - TDD violation detected"
    }
  ]
}
```

## Complete TDD Workflow Example

### Scenario: Adding User Registration Feature

```
# 1. Start with Business Requirements
💬 Using the @business-analyst agent, define requirements for user registration
# Output: Clear acceptance criteria

# 2. Create Test Plan
💬 Using the @qa-engineer agent, create comprehensive test plan for registration
# Output: Test scenarios including edge cases

# 3. Write Failing Tests
💬 /tdd/tdd-feature "user registration with email validation"
# Output: Complete test suite that fails

# 4. Implement Minimal Code
💬 Using the tdd_development workflow, implement registration to pass tests
# Output: Minimal working implementation

# 5. Refactor with Confidence
💬 /refactor-code "optimize registration flow"
# Output: Improved code with all tests passing

# 6. Security Review
💬 Using the @security-reviewer agent, verify registration security
# Output: Security validation with additional security tests

# 7. Performance Check
💬 Using the @performance-optimizer agent, check registration performance
# Output: Performance metrics with tests

# 8. Documentation
💬 Using the @documentation-agent, document the registration feature
# Output: Complete documentation with test examples
```

### TDD Workflow Documentation Example (YAML Planning)

> **📝 Important Note About YAML Files**
> 
> YAML files are **NOT required** for TDD workflows to function. The TDD workflow is executed through slash commands (`/tdd/tdd-feature`, `/tdd/tdd-bugfix`), agents, and hooks.
> 
> However, YAML is a **best practice** for:
> - Planning and documenting your TDD approach
> - Visualizing the Red-Green-Refactor cycle
> - Defining agent responsibilities and task sequences
> - Sharing workflow patterns with your team
> 
> The following YAML example shows how you might document a TDD workflow for planning purposes:

**Example TDD workflow documentation (not executable):**

```yaml
name: tdd_development
description: Automated TDD red-green-refactor cycle
version: 1.0.0

stages:
  - name: write_tests
    agent: test-generator
    description: Write comprehensive failing tests
    outputs:
      - test_files
      - test_report_red.md
    
  - name: verify_red
    agent: qa-engineer
    description: Confirm all tests fail appropriately
    validation:
      - all_tests_fail: true
      - clear_failure_messages: true
    
  - name: implement
    agent: architect
    description: Guide minimal implementation
    constraints:
      - minimal_code_only: true
      - no_extra_features: true
    outputs:
      - implementation_files
    
  - name: verify_green
    agent: test-generator
    description: Confirm all tests pass
    validation:
      - all_tests_pass: true
      - coverage_target_met: true
    
  - name: refactor
    agent: performance-optimizer
    description: Improve code while maintaining green
    validation:
      - tests_still_pass: true
      - performance_maintained: true
    outputs:
      - refactored_code
      - test_report_final.md

quality_gates:
  - test_first: "Tests must exist before implementation"
  - coverage_minimum: 80
  - all_tests_passing: true
```

## TDD Workflow Automation

### Pre-commit Hook for TDD

```json
{
  "name": "tdd-enforcer",
  "description": "Enforce TDD practices",
  "triggers": ["pre-commit"],
  "actions": [
    {
      "type": "check",
      "condition": "new_code_has_tests",
      "message": "New code must have corresponding tests"
    },
    {
      "type": "run",
      "command": "pytest --lf",
      "failOnError": true
    }
  ]
}
```

### Continuous TDD Monitoring

```python
# Monitor TDD compliance
def analyze_tdd_compliance(repo_path):
    """Check if repository follows TDD"""
    metrics = {
        'test_first_commits': 0,
        'code_first_commits': 0,
        'test_coverage': 0,
        'test_to_code_ratio': 0
    }
    
    # Analyze commit history
    for commit in get_commits():
        files = commit.changed_files
        if has_tests_before_code(files):
            metrics['test_first_commits'] += 1
        else:
            metrics['code_first_commits'] += 1
    
    return metrics
```

## Common TDD Pitfalls and How Our Tools Prevent Them

### 1. Writing Tests After Code

**How our tools prevent this:**
- `quality_gates` hook blocks commits without tests
- `/tdd/tdd-feature` command enforces test-first approach
- `test-generator` agent refuses to write tests for existing code without warning

```
# WRONG: Code first (blocked by our hooks)
💬 Implement user authentication
# ❌ Hook blocks: "Tests must exist before implementation"

# RIGHT: Tests first (enforced by our workflow)
💬 /tdd/tdd-feature "user authentication"
# ✅ Automatically writes tests first
```

### 2. Testing Implementation Not Behavior
```python
# WRONG: Testing internals
def test_uses_bcrypt():
    """Test that bcrypt is used"""
    assert 'bcrypt' in hash_function.__module__

# RIGHT: Testing behavior
def test_password_is_securely_hashed():
    """Test that passwords are not stored plain"""
    hashed = hash_password('mypassword')
    assert hashed != 'mypassword'
    assert verify_password('mypassword', hashed)
```

### 3. Overly Coupled Tests
```python
# WRONG: Tests depend on each other
def test_1_create_user():
    global user_id
    user_id = create_user()

def test_2_login_user():
    login(user_id)  # Depends on test_1

# RIGHT: Independent tests
def test_create_user():
    user_id = create_user()
    assert user_id is not None

def test_login_user():
    user_id = create_user()  # Setup within test
    assert login(user_id) == True
```

## Measuring TDD Success with Our Tools

### Automated Metrics Collection

Our hooks and agents automatically track TDD metrics:

```
# Use performance monitor hook to track TDD metrics:
💬 Show TDD compliance metrics from performance_monitor

# Use business analyst to generate TDD report:
💬 Using the @business-analyst agent, analyze our TDD adoption metrics
```

### Key Metrics Tracked

| Metric | Tracked By | Target | Current |
|--------|------------|--------|----------|
| **Test-First Ratio** | quality_gates hook | >90% | Automatic |
| **Coverage Trend** | performance_monitor | Increasing | Monitored |
| **Defect Rate** | qa-engineer agent | <5% | Analyzed |
| **Velocity** | scrum-master agent | Improving | Tracked |
| **Refactor Frequency** | performance-optimizer | Weekly | Logged |

### TDD Maturity Levels

1. **Level 1 - Beginner**: Writing some tests first
2. **Level 2 - Practicing**: Consistent red-green-refactor
3. **Level 3 - Proficient**: Natural TDD workflow
4. **Level 4 - Expert**: TDD drives design decisions
5. **Level 5 - Master**: TDD is second nature

## Quick Reference: TDD with Our Tools

### Complete TDD Cycle Using Commands

```
# Option 1: Automated TDD Command
💬 /tdd/tdd-feature "shopping cart functionality"
# Handles entire RED-GREEN-REFACTOR cycle automatically

# Option 2: Step-by-Step with Agents
# 1. RED - Write failing test
💬 Using test-generator agent, write failing tests for shopping cart

# 2. Verify RED
💬 Using qa-engineer agent, verify all tests fail appropriately

# 3. GREEN - Minimal implementation  
💬 Using architect agent, implement minimal code to pass tests

# 4. Verify GREEN
💬 Run tests with quality_gates hook validation

# 5. REFACTOR - Improve code
💬 Using performance-optimizer agent, refactor while keeping tests green

# 6. Final validation
💬 Using security-reviewer agent, validate complete implementation
```

### Available TDD Resources

| Resource Type | Name | Purpose |
|--------------|------|---------||
| **Commands** | `/tdd/tdd-feature` | Complete TDD cycle |
| | `/tdd/tdd-bugfix` | Bug fixes with tests |
| | `/generate-tests` | Test generation |
| **Agents** | `test-generator` | Test-first development |
| | `qa-engineer` | Test strategy & validation |
| | `architect` | Design guidance |
| **Workflows** | `tdd_development.yaml` | Automated TDD flow |
| | `secure_development.yaml` | TDD with security |
| **Hooks** | `quality_gates.json` | Enforce test-first |
| | `auto_recovery.json` | Revert breaking changes |

### TDD Checklist (Automated by Our Tools)

```bash
# Our tools automatically verify each step:
```

- [ ] **Requirements understood** - `business-analyst` agent validates
- [ ] **Test written first** - `test-generator` agent ensures
- [ ] **Test fails initially** - `quality_gates` hook verifies
- [ ] **Minimal code to pass** - `architect` agent guides
- [ ] **Test passes** - `qa-engineer` agent confirms
- [ ] **Code refactored** - `performance-optimizer` improves
- [ ] **All tests still pass** - `quality_gates` hook validates
- [ ] **Coverage adequate** - `performance_monitor` tracks
- [ ] **Edge cases tested** - `qa-engineer` agent ensures
- [ ] **Documentation updated** - `documentation-agent` maintains

## Conclusion: TDD Excellence Through Automation

Our comprehensive TDD toolkit ensures quality through:

### 🤖 **Specialized Agents**
- `test-generator`: Enforces test-first development
- `qa-engineer`: Ensures comprehensive coverage
- `architect`: Guides minimal implementation
- `performance-optimizer`: Enables safe refactoring

### 📝 **Purpose-Built Commands**
- `/tdd/tdd-feature`: Complete TDD cycle automation
- `/tdd/tdd-bugfix`: Test-driven bug resolution
- `/generate-tests`: Comprehensive test creation

### 🔄 **Automated Workflows**
- `tdd_development.yaml`: Full RED-GREEN-REFACTOR automation
- Quality gates at every stage
- Continuous validation

### 🔒 **Enforcement Hooks**
- `quality_gates`: Blocks untested code
- `auto_recovery`: Reverts breaking changes
- `performance_monitor`: Tracks TDD metrics

By leveraging these tools, TDD becomes not just a practice but an automated, enforced standard that:
- ✅ Guarantees test-first development
- ✅ Maintains high coverage automatically
- ✅ Prevents regression through continuous testing
- ✅ Enables fearless refactoring
- ✅ Documents behavior through tests

Remember: **With our tools, if it's not tested, it won't ship.**