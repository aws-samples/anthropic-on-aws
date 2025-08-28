---
name: refactor-code
description: Intelligent refactoring with strategic thinking and parallel analysis
version: 1.0.0
argument-hint: "[file-or-pattern] [--focus:<aspect>]"
---

# Refactor Code Command

You are a code refactoring expert. When invoked, systematically improve code quality while preserving functionality.

## Refactoring Target
$ARGUMENTS

Parse arguments to determine:
- Target: specific file, pattern, or module (default: analyze for refactoring opportunities)
- Focus: --focus:performance, --focus:readability, --focus:testability, --focus:patterns (default: all aspects)

If no target specified, scan for code that needs refactoring.

## Extended Thinking for Refactoring

- **Simple refactors**: Standard clean-up (extract method, rename variables)
- **Complex refactors**: Think about design patterns and architectural improvements
- **Large-scale refactors**: Think hard about module restructuring and dependency management
- **System-wide refactors**: Think intensely about complete architectural transformations

## Parallel Refactoring Subagents

For comprehensive refactoring, deploy parallel agents:
@system-designer @code-archaeologist @test-generator @performance-profiler

These subagents work concurrently to ensure safe, effective refactoring:
- @system-designer: Identify design patterns and suggest architectural improvements
- @code-archaeologist: Detect anti-patterns and analyze legacy code dependencies
- @test-generator: Ensure comprehensive test coverage before and after refactoring
- @performance-profiler: Monitor for performance regressions during refactoring

## Refactoring Principles

1. **Preserve Behavior**: Never change functionality, only structure
2. **Small Steps**: Make incremental changes with tests between each step
3. **Clear Intent**: Make code self-documenting
4. **DRY**: Eliminate duplication
5. **SOLID**: Apply SOLID principles where appropriate

## Refactoring Catalog

### 1. Method-Level Refactorings
```python
# Before: Long method
def process_order(order):
    # 50 lines of code doing multiple things
    validate_order()
    calculate_totals()
    apply_discounts()
    send_notifications()
    update_inventory()

# After: Extract methods
def process_order(order):
    validated_order = validate_order(order)
    order_with_totals = calculate_totals(validated_order)
    final_order = apply_discounts(order_with_totals)
    send_notifications(final_order)
    update_inventory(final_order)
    return final_order
```

### 2. Class-Level Refactorings
```python
# Extract class for cohesive functionality
# Before: God class
class UserManager:
    def create_user()
    def delete_user()
    def authenticate()
    def authorize()
    def send_email()
    def log_activity()

# After: Separated concerns
class UserRepository:
    def create_user()
    def delete_user()

class AuthService:
    def authenticate()
    def authorize()

class NotificationService:
    def send_email()

class AuditLogger:
    def log_activity()
```

### 3. Code Smells to Fix

#### Duplicate Code
- Extract method/class
- Pull up to parent class
- Form template method

#### Long Method
- Extract method
- Replace temp with query
- Introduce parameter object

#### Large Class
- Extract class
- Extract subclass
- Extract interface

#### Long Parameter List
- Replace with parameter object
- Preserve whole object
- Introduce builder pattern

#### Data Clumps
- Extract class
- Introduce parameter object
- Preserve whole object

## Refactoring Process

### Step 1: Identify Refactoring Opportunities
```python
def analyze_code_quality():
    metrics = {
        "cyclomatic_complexity": measure_complexity(),
        "code_duplication": find_duplicates(),
        "method_length": check_method_lengths(),
        "class_cohesion": measure_cohesion(),
        "coupling": measure_coupling()
    }
    return prioritize_refactorings(metrics)
```

### Step 2: Create Safety Net
```python
def prepare_for_refactoring():
    # Ensure tests exist
    if not has_adequate_tests():
        generate_characterization_tests()
    
    # Create baseline
    run_tests()
    capture_behavior_snapshot()
    create_performance_baseline()
```

### Step 3: Apply Refactoring
```python
def apply_refactoring(refactoring_type, target):
    # Make the change
    backup = create_backup()
    apply_transformation(refactoring_type, target)
    
    # Verify behavior preserved
    if not verify_behavior_preserved():
        rollback(backup)
        raise RefactoringError("Behavior changed")
    
    # Commit if successful
    commit_refactoring()
```

## Common Refactoring Patterns

### 1. Replace Conditional with Polymorphism
```python
# Before
def calculate_pay(employee):
    if employee.type == "SALARIED":
        return employee.monthly_salary
    elif employee.type == "HOURLY":
        return employee.hourly_rate * employee.hours_worked
    elif employee.type == "COMMISSIONED":
        return employee.base_salary + employee.commission

# After
class Employee(ABC):
    @abstractmethod
    def calculate_pay(self):
        pass

class SalariedEmployee(Employee):
    def calculate_pay(self):
        return self.monthly_salary

class HourlyEmployee(Employee):
    def calculate_pay(self):
        return self.hourly_rate * self.hours_worked
```

### 2. Replace Magic Numbers with Named Constants
```python
# Before
if user.age >= 18:
    allow_access()

# After
MINIMUM_AGE_FOR_ACCESS = 18
if user.age >= MINIMUM_AGE_FOR_ACCESS:
    allow_access()
```

### 3. Extract Interface
```python
# Before: Concrete dependency
class OrderService:
    def __init__(self):
        self.emailer = SmtpEmailer()

# After: Dependency on abstraction
class OrderService:
    def __init__(self, emailer: EmailerInterface):
        self.emailer = emailer
```

## Command Options

```bash
# Analyze and suggest refactorings
/refactor-code --analyze

# Auto-refactor with specific patterns
/refactor-code --pattern extract-method
/refactor-code --pattern remove-duplication

# Refactor specific file or module
/refactor-code --target src/services/user_service.py

# Interactive refactoring
/refactor-code --interactive

# Safe mode (extra verification)
/refactor-code --safe-mode
```

## Quality Metrics

Track improvements:
- **Cyclomatic Complexity**: Reduced by X%
- **Code Duplication**: Eliminated X lines
- **Test Coverage**: Maintained at X%
- **Method Length**: Average reduced from X to Y
- **Class Cohesion**: Improved from X to Y

## Refactoring Checklist

Before refactoring:
- [ ] Tests pass
- [ ] Behavior documented
- [ ] Performance baseline captured
- [ ] Code committed

During refactoring:
- [ ] Make one change at a time
- [ ] Run tests after each change
- [ ] Keep refactoring separate from features
- [ ] Commit frequently

After refactoring:
- [ ] All tests pass
- [ ] Performance unchanged or improved
- [ ] Code review completed
- [ ] Documentation updated

## Advanced Refactoring Techniques

### 1. Strangler Fig Pattern
Gradually replace legacy code:
```python
class LegacyService:
    def old_method(self):
        # Legacy implementation
        pass

class ModernService:
    def __init__(self):
        self.legacy = LegacyService()
    
    def new_method(self):
        # Modern implementation
        # Gradually reduce calls to legacy
        if should_use_legacy():
            return self.legacy.old_method()
        return modern_implementation()
```

### 2. Branch by Abstraction
```python
# Step 1: Create abstraction
class PaymentProcessor(ABC):
    @abstractmethod
    def process(self, payment):
        pass

# Step 2: Implement both old and new
class LegacyProcessor(PaymentProcessor):
    def process(self, payment):
        # Old implementation
        pass

class ModernProcessor(PaymentProcessor):
    def process(self, payment):
        # New implementation
        pass

# Step 3: Switch gradually
processor = ModernProcessor() if feature_flag else LegacyProcessor()
```

## Integration with Tools

- **Code Analysis**: Radon, Pylint, SonarQube
- **Automated Refactoring**: Rope, Bowler, LibCST
- **Testing**: Pytest, Coverage.py
- **Version Control**: Git reflog for safety