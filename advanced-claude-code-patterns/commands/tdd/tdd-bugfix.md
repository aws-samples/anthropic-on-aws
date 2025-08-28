---
name: tdd-bugfix
description: Fix bugs using Test-Driven Development approach with regression prevention
version: 1.0.0
argument-hint: "[bug-description-or-issue-number]"
---

# TDD Bug Fix Command

You are a debugging expert who uses TDD principles. ALWAYS write a failing test that reproduces the bug before fixing it.

## Bug to Fix
$ARGUMENTS

If no bug description was provided above, ask the user: "What bug would you like to fix using TDD? Please provide a description or issue number."

## Extended Thinking for Bug Fixes

- **Simple bugs**: Quick test and fix
- **Complex bugs**: Think about root causes and side effects
- **System bugs**: Think hard about integration impacts
- **Critical bugs**: Think harder about preventing recurrence

## Test Organization and Placement

Before creating any tests, establish the project's test directory structure:

### Test Directory Detection
1. **Scan for existing test structure**:
   - Look for `tests/`, `test/`, or `src/tests/` directories
   - Check `pyproject.toml`, `setup.py`, or `pytest.ini` for test configuration
   - Follow project-specific conventions if they exist

2. **Create standard structure if needed**:
   ```
   tests/
   ├── unit/           # Unit tests for individual functions/classes
   ├── integration/    # Tests for component interactions
   ├── e2e/           # End-to-end system tests
   ├── fixtures/      # Test data and fixtures
   └── conftest.py    # Shared test configuration
   ```

3. **Place bug fix tests appropriately**:
   - **Regression tests**: `tests/unit/test_[module_name].py`
   - **Integration bugs**: `tests/integration/test_[component_name].py`
   - **System bugs**: `tests/e2e/test_[feature_name].py`

## Bug Fix Process

### Step 1: Reproduce the Bug with a Test

```python
def test_reproduces_reported_bug():
    """
    Bug Report: Users can login with expired tokens
    This test MUST fail to confirm bug exists
    """
    expired_token = create_token(expired=True)
    
    # This should fail but currently passes (bug!)
    with pytest.raises(AuthenticationError):
        authenticate_with_token(expired_token)
```

### Step 2: Verify Test Fails

```bash
# Confirm the bug exists - use proper test path
pytest tests/unit/test_auth_module.py::test_reproduces_reported_bug -v

# Expected: Test FAILS (confirming bug exists)
# FAILED tests/unit/test_auth_module.py::test_reproduces_reported_bug
```

### Step 3: Write Expected Behavior Test

```python
def test_correct_token_expiry_behavior():
    """Define correct behavior through tests"""
    # Valid token should work
    valid_token = create_token(expired=False)
    assert authenticate_with_token(valid_token) == True
    
    # Expired token should fail
    expired_token = create_token(expired=True)
    with pytest.raises(AuthenticationError):
        authenticate_with_token(expired_token)
    
    # About-to-expire token should work
    almost_expired = create_token(expires_in_seconds=60)
    assert authenticate_with_token(almost_expired) == True
```

### Step 4: Fix the Bug

```python
# Minimal fix to pass the test
def authenticate_with_token(token):
    """Fixed implementation"""
    if token.is_expired():  # This check was missing!
        raise AuthenticationError("Token expired")
    
    return validate_token(token)
```

### Step 5: Add Regression Tests

```python
def test_prevents_token_expiry_regression():
    """Comprehensive tests to prevent regression"""
    # Test various expiry scenarios
    test_cases = [
        (create_token(expired=True), False),
        (create_token(expired=False), True),
        (create_token(expires_at=yesterday), False),
        (create_token(expires_at=tomorrow), True),
        (create_token(expires_at=now), False),
    ]
    
    for token, should_pass in test_cases:
        if should_pass:
            assert authenticate_with_token(token)
        else:
            with pytest.raises(AuthenticationError):
                authenticate_with_token(token)
```

## Project Structure Analysis

Before starting bug analysis, agents should:

1. **Detect existing test infrastructure**:
   ```bash
   # Check for test directories
   find . -type d -name "test*" -o -name "*test*" | head -10
   
   # Look for test configuration files
   ls -la pyproject.toml setup.py pytest.ini tox.ini
   
   # Find existing test files to follow naming patterns
   find . -name "test_*.py" -o -name "*_test.py" | head -5
   ```

2. **Analyze current test organization**:
   - Check if tests are co-located with source (src/module/test_module.py)
   - Identify central test directory structure
   - Note any project-specific test patterns or conventions

3. **Create missing test structure**:
   ```bash
   # Create standard Python test structure if missing
   mkdir -p tests/{unit,integration,e2e,fixtures}
   touch tests/conftest.py
   ```

## Parallel Bug Analysis Subagents

Deploy concurrent debugging specialists:
@code-archaeologist @business-analyst @test-generator @qa-engineer

- @code-archaeologist: Analyze underlying issues, uncover root causes, search for related patterns, and determine appropriate test directory
- @business-analyst: Evaluate affected components, perform impact analysis, and recommend test categorization (unit/integration/e2e)
- @test-generator: Design comprehensive test suite with proper file placement in central test structure to prevent regression and ensure coverage
- @qa-engineer: Validate fix quality, identify potential side effects, and ensure tests are placed in discoverable locations

## Bug Categories

### 1. Logic Errors
```python
def test_fixes_calculation_error():
    """Test for calculation bugs"""
    # Bug: Total calculated incorrectly
    cart = ShoppingCart()
    cart.add_item(price=10, quantity=2)
    cart.add_item(price=5, quantity=3)
    
    # Should be 35, not 25 (bug!)
    assert cart.total() == 35
```

### 2. Boundary Conditions
```python
def test_handles_empty_input():
    """Test for edge case bugs"""
    # Bug: Crashes on empty list
    result = process_items([])
    assert result == []  # Should handle gracefully
```

### 3. Race Conditions
```python
def test_thread_safety():
    """Test for concurrency bugs"""
    # Bug: Data corruption in parallel access
    import threading
    
    counter = Counter()
    threads = []
    
    for _ in range(100):
        t = threading.Thread(target=counter.increment)
        threads.append(t)
        t.start()
    
    for t in threads:
        t.join()
    
    assert counter.value == 100  # Should be exactly 100
```

### 4. Security Vulnerabilities
```python
def test_prevents_sql_injection():
    """Test for security bugs"""
    # Bug: SQL injection possible
    malicious_input = "'; DROP TABLE users; --"
    
    # Should sanitize input
    with pytest.raises(ValidationError):
        execute_query(malicious_input)
```

## Bug Fix Workflow

1. **Analyze Bug Report**
   - Understand symptoms
   - Identify affected components
   - Determine severity

2. **Create Failing Test**
   - Write test that reproduces bug
   - Verify test fails
   - Document expected behavior

3. **Implement Fix**
   - Make minimal change
   - Focus on root cause
   - Avoid introducing new issues

4. **Verify Fix**
   - Run reproduction test
   - Confirm it passes
   - Run full test suite

5. **Prevent Regression**
   - Add comprehensive tests
   - Test edge cases
   - Document fix

## Usage Examples

```bash
# Fix authentication bug
/tdd-bugfix "Users can login with wrong password"
# Tests will be placed in: tests/unit/test_auth.py

# Fix data corruption bug
/tdd-bugfix "Database records deleted when updating user profile"
# Tests will be placed in: tests/integration/test_user_service.py

# Fix performance bug
/tdd-bugfix "API timeout when loading large datasets"
# Tests will be placed in: tests/e2e/test_api_performance.py

# Fix UI bug
/tdd-bugfix "Button click not working after form validation"
# Tests will be placed in: tests/e2e/test_form_interactions.py
```

## Output Format

1. **Bug Analysis**
   - Root cause identification
   - Impact assessment
   - Related code areas

2. **Reproduction Test**
   - Failing test that confirms bug
   - Test execution output
   - Clear failure message

3. **Bug Fix**
   - Minimal code change
   - Explanation of fix
   - No side effects

4. **Verification**
   - Test now passing
   - All existing tests still pass
   - No performance regression

5. **Regression Prevention**
   - Additional test cases
   - Edge case coverage
   - Documentation updates

## Common Bug Patterns

### Off-by-One Errors
```python
def test_array_bounds():
    """Prevent index errors"""
    arr = [1, 2, 3]
    # Bug: Accessing arr[3]
    assert get_last_element(arr) == 3  # Not arr[len(arr)]
```

### Null Reference Errors
```python
def test_handles_null_values():
    """Prevent NoneType errors"""
    # Bug: Crashes on None
    result = process_data(None)
    assert result == default_value()
```

### Type Mismatches
```python
def test_type_conversion():
    """Prevent type errors"""
    # Bug: String concatenation with number
    result = format_message("Count", 42)
    assert result == "Count: 42"
```

## Quality Checklist

Before completing bug fix:
- [ ] Bug reproduced with failing test in appropriate test directory
- [ ] Root cause identified
- [ ] Minimal fix implemented
- [ ] Test now passes when run with full path
- [ ] No existing tests broken (run full test suite)
- [ ] Regression tests added in centralized test structure
- [ ] Performance unchanged
- [ ] Documentation updated
- [ ] Similar bugs checked
- [ ] Tests are discoverable by test runners
- [ ] Test files follow project naming conventions

## Integration with CI/CD

```yaml
# GitHub Action for bug fixes with centralized test structure
name: TDD Bug Fix Validation
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  validate-bugfix:
    if: contains(github.event.pull_request.labels.*.name, 'bugfix')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Check for regression test in proper location
        run: |
          # Ensure bug fix includes test in tests/ directory
          if ! git diff --name-only origin/main..HEAD | grep -q "tests/.*test_.*\.py"; then
            echo "Bug fix must include test in tests/ directory"
            exit 1
          fi
      
      - name: Run all tests with discovery
        run: |
          # Run tests from centralized location
          pytest tests/ --tb=short --verbose
      
      - name: Check coverage didn't decrease
        run: |
          # Coverage analysis on centralized test structure
          pytest tests/ --cov=src --cov=. --cov-report=term
          # Compare with main branch coverage
```

## Best Practices

1. **Always Test First**: Never fix without reproducing
2. **Minimal Changes**: Fix only the bug, nothing else
3. **Document the Fix**: Explain what was wrong and why
4. **Test Thoroughly**: Include edge cases
5. **Prevent Recurrence**: Add monitoring/logging
6. **Learn from Bugs**: Update coding standards