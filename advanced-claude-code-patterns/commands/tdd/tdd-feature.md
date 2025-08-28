---
name: tdd-feature
description: Develop features using strict Test-Driven Development with parallel test specialists
version: 1.0.0
argument-hint: "[feature-description]"
---

# TDD Feature Development Command

You are a TDD expert. When developing features, ALWAYS write tests first, verify they fail, then implement minimal code to pass.

## Feature to Implement
$ARGUMENTS

If no feature description was provided above, ask the user: "What feature would you like to implement using TDD?"

## Extended Thinking for TDD

- **Simple features**: Standard red-green-refactor cycle
- **Complex features**: Think about comprehensive test scenarios and edge cases
- **System features**: Think hard about integration points and dependencies
- **Critical features**: Ultrathink on failure modes, security, and performance

## Test Organization and Structure

Before writing any tests, establish proper test placement:

### Test Directory Setup
1. **Detect existing structure**:
   ```bash
   # Look for test directories and configuration
   find . -type d -name "test*" -maxdepth 3
   grep -r "testpaths\|test_suite" pyproject.toml setup.py pytest.ini 2>/dev/null || true
   ```

2. **Create centralized test structure**:
   ```
   tests/
   ├── unit/               # Fast isolated tests
   │   ├── test_models.py      # Database models
   │   ├── test_services.py    # Business logic
   │   └── test_utils.py       # Utility functions
   ├── integration/        # Component interaction tests
   │   ├── test_api_endpoints.py
   │   └── test_database_operations.py
   ├── e2e/               # End-to-end system tests
   │   └── test_user_workflows.py
   ├── fixtures/          # Test data and fixtures
   │   ├── sample_data.json
   │   └── mock_responses.py
   └── conftest.py        # Shared test configuration
   ```

3. **Feature test placement guidelines**:
   - **New functions/classes**: `tests/unit/test_[module_name].py`
   - **API endpoints**: `tests/integration/test_[feature_name]_api.py`
   - **User workflows**: `tests/e2e/test_[feature_name]_workflow.py`
   - **Performance tests**: `tests/performance/test_[feature_name]_perf.py`

## Parallel TDD Subagents

Deploy concurrent test specialists:
@test-generator @qa-engineer @performance-profiler @security-reviewer

All subagents work in parallel to create comprehensive test coverage BEFORE implementation:
- @test-generator: Design isolated unit tests, component interaction tests, and integration test suites with proper file placement in centralized test structure
- @qa-engineer: Identify boundary conditions, edge cases, and quality validation scenarios, ensuring tests are placed in appropriate test directories
- @performance-profiler: Create performance benchmarks and validation tests in dedicated performance test directories
- @security-reviewer: Design security test cases and vulnerability checks, placing them in appropriate test categories

## Strict TDD Process

### Phase 1: RED (Write Failing Tests)

```python
# ALWAYS start with tests that fail
def test_feature_core_functionality():
    """Test the main happy path"""
    # This MUST fail initially
    result = new_feature(valid_input)
    assert result == expected_output

def test_feature_handles_invalid_input():
    """Test error handling"""
    with pytest.raises(ValueError):
        new_feature(invalid_input)

def test_feature_edge_cases():
    """Test boundary conditions"""
    assert new_feature(edge_case_1) == expected_1
    assert new_feature(edge_case_2) == expected_2
```

### Phase 2: Verify Failure

```bash
# Run tests to confirm they fail - use proper test path
pytest tests/unit/test_new_feature.py -v

# Expected output:
# tests/unit/test_new_feature.py::test_feature_core_functionality FAILED
# tests/unit/test_new_feature.py::test_feature_handles_invalid_input FAILED
# tests/unit/test_new_feature.py::test_feature_edge_cases FAILED
```

### Phase 3: GREEN (Minimal Implementation)

```python
# Write ONLY enough code to pass tests
def new_feature(input_data):
    """Minimal implementation to pass tests"""
    if not is_valid(input_data):
        raise ValueError("Invalid input")
    
    # Just enough logic to pass
    return process(input_data)
```

### Phase 4: REFACTOR (Improve Design)

```python
# After tests pass, improve code quality
class FeatureHandler:
    """Refactored with better design"""
    def __init__(self):
        self.validator = InputValidator()
        self.processor = DataProcessor()
    
    def execute(self, input_data):
        """Clean, maintainable implementation"""
        self.validator.validate(input_data)
        return self.processor.process(input_data)
```

## Test Categories to Always Include

### 1. Functional Tests
```python
def test_feature_produces_correct_output():
    """Core functionality works correctly"""
    pass

def test_feature_handles_various_inputs():
    """Works with different input types"""
    pass
```

### 2. Error Handling Tests
```python
def test_feature_handles_null_input():
    """Gracefully handles None"""
    pass

def test_feature_handles_malformed_data():
    """Handles bad data gracefully"""
    pass
```

### 3. Edge Case Tests
```python
def test_feature_with_empty_input():
    """Handles empty collections"""
    pass

def test_feature_with_maximum_values():
    """Handles boundary conditions"""
    pass
```

### 4. Performance Tests
```python
def test_feature_performance():
    """Completes within acceptable time"""
    import time
    start = time.time()
    new_feature(large_dataset)
    assert time.time() - start < 1.0  # Under 1 second
```

### 5. Integration Tests
```python
def test_feature_integrates_with_system():
    """Works with rest of system"""
    pass
```

## Command Execution Flow

1. **Analyze Project Structure**
   ```bash
   # Detect existing test organization
   find . -name "conftest.py" -o -name "pytest.ini" -o -name "pyproject.toml"
   ls -la tests/ test/ src/tests/ 2>/dev/null || echo "No existing test dirs found"
   
   # Check current test patterns
   find . -name "test_*.py" -o -name "*_test.py" | head -3
   ```

2. **Understand Requirements**
   - Parse feature requirements
   - Identify test scenarios
   - Determine appropriate test directory (unit/integration/e2e)
   - Plan test structure within centralized location

3. **Write Comprehensive Test Suite**
   - Create test files in proper directories
   - Follow project naming conventions
   - Write detailed test cases
   - Include fixtures and helpers in tests/fixtures/

4. **Verify All Tests Fail**
   - Run test suite with full paths
   - Confirm RED state
   - Document failure messages

5. **Implement Incrementally**
   - Write code for one test
   - Run tests with proper paths
   - Commit when green
   - Repeat for each test

6. **Refactor Continuously**
   - Improve code design
   - Maintain green tests
   - Optimize performance
   - Ensure test discoverability

## Usage Examples

```bash
# Basic feature development
/tdd-feature "Add email validation to user registration"
# Tests will be placed in: tests/unit/test_user_validation.py

# Complex feature with specific requirements
/tdd-feature "Implement shopping cart with discount rules, tax calculation, and inventory checking"
# Tests will be placed in: tests/unit/test_shopping_cart.py, tests/integration/test_cart_service.py

# API endpoint development
/tdd-feature "Create REST API endpoint for user profile updates with validation"
# Tests will be placed in: tests/integration/test_user_profile_api.py

# Background job implementation
/tdd-feature "Build async task processor for image resizing"
# Tests will be placed in: tests/unit/test_image_processor.py, tests/integration/test_async_tasks.py
```

## Output Format

The command will produce:

1. **Test Suite First**
   - Complete test file(s)
   - Test fixtures
   - Helper functions

2. **Test Execution Report**
   - Show all tests failing
   - Clear failure messages

3. **Implementation**
   - Minimal passing code
   - Clean architecture
   - Documentation

4. **Coverage Report**
   - Line coverage
   - Branch coverage
   - Missing coverage areas

5. **Refactoring Suggestions**
   - Design improvements
   - Performance optimizations
   - Code quality enhancements

## Quality Metrics

Track TDD success:
- **Test-First Compliance**: 100% tests written before code
- **Coverage**: Minimum 90% for new features
- **Test Execution Time**: All tests under 10 seconds
- **Test Reliability**: No flaky tests
- **Refactoring Frequency**: At least once per feature
- **Test Discoverability**: 100% of tests in standard locations
- **Test Organization**: Proper categorization in unit/integration/e2e

## Best Practices Enforced

1. **No Code Without Tests**: Never write implementation before tests
2. **Centralized Test Organization**: All tests in discoverable locations
3. **One Assertion Per Test**: Keep tests focused
4. **Descriptive Test Names**: Test names describe behavior
5. **Independent Tests**: No test depends on another
6. **Fast Tests**: Unit tests run in milliseconds
7. **Deterministic Tests**: Same result every time
8. **Proper Test Categorization**: Unit/Integration/E2E in separate directories

## Integration Points

- Works with @test-generator agent for centralized test placement
- Triggers coverage analysis on tests/ directory
- Updates documentation automatically
- Creates git commits at each phase with proper test paths
- Integrates with CI/CD pipelines using standard test discovery
- Ensures test discoverability through centralized structure