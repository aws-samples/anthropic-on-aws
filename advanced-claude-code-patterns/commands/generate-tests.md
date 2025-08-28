---
name: generate-tests
description: Generate comprehensive test suites for code
version: 1.0.0
argument-hint: "[file-or-module-to-test] [--unit|--integration|--e2e|--all]"
---

# Generate Tests Command

You are a test generation expert. Create comprehensive, maintainable test suites that ensure code quality.

## Parallel Subagent Support

For complex testing scenarios, coordinate with these subagents:
@test-generator @qa-engineer @system-designer

- @test-generator: Create comprehensive test suites with proper coverage
- @qa-engineer: Validate test quality and identify edge cases
- @system-designer: Ensure tests align with system architecture patterns

## Test Target
$ARGUMENTS

Parse arguments to determine:
- Target: specific file, module, or entire codebase (default: analyze current context)
- Test type: --unit, --integration, --e2e, or --all (default: --all)

If no target specified, analyze the most recently modified or currently open files.

## Test Generation Strategy

### 1. Test Types to Generate

#### Unit Tests
```python
# Test individual functions/methods in isolation
def test_calculate_discount():
    # Arrange
    original_price = 100
    discount_percent = 20
    
    # Act
    result = calculate_discount(original_price, discount_percent)
    
    # Assert
    assert result == 80
```

#### Integration Tests
```python
# Test component interactions
def test_order_processing_workflow():
    # Test complete flow from order to fulfillment
    order = create_order(items=[...])
    payment = process_payment(order)
    shipment = create_shipment(order, payment)
    assert shipment.status == "ready_to_ship"
```

#### Edge Case Tests
```python
# Test boundary conditions
def test_edge_cases():
    # Empty input
    assert function([]) == expected_empty_result
    
    # Maximum values
    assert function(MAX_INT) == expected_max_result
    
    # Null/None handling
    assert function(None) raises ValueError
    
    # Special characters
    assert function("!@#$%") == expected_special_result
```

## Test Generation Patterns

### 1. Parameterized Tests
```python
import pytest

@pytest.mark.parametrize("input,expected", [
    (0, 0),
    (1, 1),
    (-1, 1),
    (10, 100),
    (3.14, 9.8596),
])
def test_square_function(input, expected):
    assert square(input) == pytest.approx(expected)
```

### 2. Property-Based Tests
```python
from hypothesis import given, strategies as st

@given(st.integers())
def test_sorting_preserves_length(numbers):
    sorted_nums = sort_function(numbers)
    assert len(sorted_nums) == len(numbers)

@given(st.text())
def test_encoding_decoding_roundtrip(text):
    encoded = encode(text)
    decoded = decode(encoded)
    assert decoded == text
```

### 3. Mocking and Stubbing
```python
from unittest.mock import Mock, patch

def test_api_call_handling():
    # Mock external dependency
    with patch('requests.get') as mock_get:
        mock_get.return_value.json.return_value = {'status': 'success'}
        
        result = fetch_data_from_api()
        
        assert result['status'] == 'success'
        mock_get.assert_called_once_with('http://api.example.com/data')
```

## Coverage Analysis

### Generate Coverage Report
```bash
# Python
pytest --cov=src --cov-report=html --cov-report=term-missing

# JavaScript
jest --coverage --coverageReporters=html,text

# Go
go test -cover -coverprofile=coverage.out
go tool cover -html=coverage.out
```

### Coverage Goals
- **Line Coverage**: > 80%
- **Branch Coverage**: > 75%
- **Function Coverage**: > 90%
- **Critical Path Coverage**: 100%

## Test Structure Templates

### 1. Python (pytest)
```python
import pytest
from unittest.mock import Mock, patch
from datetime import datetime

class TestUserService:
    """Test suite for UserService class."""
    
    @pytest.fixture
    def user_service(self):
        """Provide UserService instance for tests."""
        return UserService()
    
    @pytest.fixture
    def sample_user(self):
        """Provide sample user data."""
        return {
            'id': 1,
            'name': 'Test User',
            'email': 'test@example.com'
        }
    
    def test_create_user_success(self, user_service, sample_user):
        """Test successful user creation."""
        # Arrange
        user_data = sample_user
        
        # Act
        result = user_service.create_user(user_data)
        
        # Assert
        assert result.id is not None
        assert result.name == user_data['name']
        assert result.email == user_data['email']
    
    def test_create_user_duplicate_email(self, user_service):
        """Test user creation with duplicate email."""
        # Arrange
        user_service.create_user({'email': 'test@example.com'})
        
        # Act & Assert
        with pytest.raises(DuplicateEmailError):
            user_service.create_user({'email': 'test@example.com'})
    
    @pytest.mark.parametrize("invalid_email", [
        "not-an-email",
        "@example.com",
        "user@",
        "",
        None
    ])
    def test_create_user_invalid_email(self, user_service, invalid_email):
        """Test user creation with invalid email formats."""
        with pytest.raises(ValidationError):
            user_service.create_user({'email': invalid_email})
```

### 2. JavaScript (Jest)
```javascript
describe('OrderProcessor', () => {
    let orderProcessor;
    let mockDatabase;
    let mockPaymentGateway;
    
    beforeEach(() => {
        mockDatabase = {
            save: jest.fn(),
            find: jest.fn()
        };
        mockPaymentGateway = {
            charge: jest.fn()
        };
        orderProcessor = new OrderProcessor(mockDatabase, mockPaymentGateway);
    });
    
    afterEach(() => {
        jest.clearAllMocks();
    });
    
    describe('processOrder', () => {
        it('should process valid order successfully', async () => {
            // Arrange
            const order = {
                id: '123',
                amount: 100,
                items: [{ id: '1', quantity: 2 }]
            };
            mockPaymentGateway.charge.mockResolvedValue({ status: 'success' });
            mockDatabase.save.mockResolvedValue(true);
            
            // Act
            const result = await orderProcessor.processOrder(order);
            
            // Assert
            expect(result.status).toBe('completed');
            expect(mockPaymentGateway.charge).toHaveBeenCalledWith(100);
            expect(mockDatabase.save).toHaveBeenCalledWith(order);
        });
        
        it('should handle payment failure', async () => {
            // Arrange
            mockPaymentGateway.charge.mockRejectedValue(new Error('Payment failed'));
            
            // Act & Assert
            await expect(orderProcessor.processOrder({}))
                .rejects.toThrow('Payment failed');
        });
    });
});
```

## Test Data Generation

### 1. Fixtures
```python
@pytest.fixture
def database():
    """Provide test database."""
    db = create_test_database()
    yield db
    db.cleanup()

@pytest.fixture
def authenticated_client():
    """Provide authenticated API client."""
    client = TestClient()
    client.login(username="test", password="test")
    return client
```

### 2. Factories
```python
import factory

class UserFactory(factory.Factory):
    class Meta:
        model = User
    
    id = factory.Sequence(lambda n: n)
    username = factory.Faker('user_name')
    email = factory.Faker('email')
    created_at = factory.Faker('date_time')

# Usage
user = UserFactory()
users = UserFactory.create_batch(10)
```

## Command Options

```bash
# Generate tests for specific file
/generate-tests --file src/services/user_service.py

# Generate specific test types
/generate-tests --type unit
/generate-tests --type integration
/generate-tests --type e2e

# Generate with coverage target
/generate-tests --coverage 90

# Generate property-based tests
/generate-tests --property-based

# Generate performance tests
/generate-tests --performance
```

## Test Quality Checklist

- [ ] **Isolated**: Tests don't depend on each other
- [ ] **Repeatable**: Same result every time
- [ ] **Fast**: Unit tests < 100ms, integration < 1s
- [ ] **Self-Validating**: Clear pass/fail
- [ ] **Comprehensive**: Cover happy path, edge cases, errors
- [ ] **Maintainable**: Easy to understand and update
- [ ] **Documented**: Clear test names and comments

## Special Test Cases

### 1. Async/Concurrent Tests
```python
import asyncio
import pytest

@pytest.mark.asyncio
async def test_concurrent_requests():
    tasks = [fetch_data(i) for i in range(10)]
    results = await asyncio.gather(*tasks)
    assert len(results) == 10
    assert all(r.status == 200 for r in results)
```

### 2. Performance Tests
```python
import time

def test_performance_under_load():
    start = time.time()
    for _ in range(1000):
        process_item()
    duration = time.time() - start
    assert duration < 1.0  # Should complete in under 1 second
```

### 3. Security Tests
```python
def test_sql_injection_prevention():
    malicious_input = "'; DROP TABLE users; --"
    result = search_users(malicious_input)
    # Should handle safely, not execute SQL
    assert "error" not in result.lower()
    assert len(get_all_users()) > 0  # Table still exists
```

## Test Documentation

Generate test documentation:
```python
def test_user_registration_flow():
    """
    Test the complete user registration flow.
    
    This test verifies:
    1. User can submit registration form
    2. Email validation is performed
    3. Confirmation email is sent
    4. User can confirm email
    5. User can login after confirmation
    
    Test Data:
    - Username: testuser
    - Email: test@example.com
    - Password: SecurePass123!
    
    Expected Results:
    - User created in database
    - Confirmation email sent
    - User status changes to 'active' after confirmation
    """
    # Test implementation
```