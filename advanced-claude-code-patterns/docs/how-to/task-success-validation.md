# How-to Guide Success Validation Framework

**Audience**: Developers implementing Claude Code patterns who need to verify task completion  
**Purpose**: Provide clear success criteria and validation methods for all how-to guides

## The Validation Problem

How-to guides often leave users uncertain whether they've completed tasks successfully. This framework ensures every how-to guide includes:
- **Clear success criteria** - What "done" looks like
- **Validation methods** - How to verify completion
- **Troubleshooting paths** - What to do when validation fails

## Success Criteria Types

### 1. Functional Validation
**What it tests**: Does the implementation work as intended?

```markdown
## Verify It Works
Run these commands to confirm your implementation:

```bash
# Test the basic functionality
your-command --test
# Expected output: "✅ All tests passed (5/5)"
```

**Success criteria**: All tests pass and you see the success message above.
```

### 2. Integration Validation  
**What it tests**: Does the implementation integrate correctly with the existing system?

```markdown
## Verify Integration
Check that your changes integrate properly:

```bash
# Test integration with existing system
existing-command --verify-integration
# Expected: No error messages, clean integration report
```

**Success criteria**: Command completes without errors and reports clean integration.
```

### 3. Quality Gate Validation
**What it tests**: Does the implementation meet quality standards?

```markdown
## Quality Verification
Ensure your implementation meets quality standards:

```bash
# Run quality checks
npm run lint && npm run test && npm run build
# All commands should complete successfully
```

**Success criteria**: All quality checks pass with no warnings or errors.
```

### 4. Performance Validation
**What it tests**: Does the implementation meet performance requirements?

```markdown
## Performance Check
Verify acceptable performance:

```bash
# Run performance tests
npm run perf-test
# Expected: All metrics within acceptable ranges
```

**Success criteria**: Response times < 200ms, memory usage < 100MB.
```

## Validation Template for How-to Guides

Every how-to guide should include this validation section:

```markdown
## Verify Success

### Quick Check
[Simple 1-2 step verification that core functionality works]

### Complete Validation
Run these verification steps to confirm everything is working correctly:

1. **Functional Test**
   ```bash
   [command to test basic functionality]
   ```
   **Expected result**: [Specific output/behavior expected]
   **Success criteria**: [Clear pass/fail criteria]

2. **Integration Test**  
   ```bash
   [command to test integration]
   ```
   **Expected result**: [Specific output/behavior expected]
   **Success criteria**: [Clear pass/fail criteria]

3. **Quality Gate**
   ```bash  
   [quality check commands]
   ```
   **Expected result**: [Specific output/behavior expected]
   **Success criteria**: [Clear pass/fail criteria]

### Troubleshooting
**Issue**: [Common problem users might encounter]
**Solution**: [Specific fix with commands/steps]
**Validation**: [How to verify the fix worked]

**Issue**: [Another common problem]  
**Solution**: [Specific fix with commands/steps]
**Validation**: [How to verify the fix worked]

## Success Checklist
- [ ] [Specific accomplishment 1]
- [ ] [Specific accomplishment 2]
- [ ] [Specific accomplishment 3]  
- [ ] Ready to move to next task/guide
```

## Common Validation Patterns

### File-Based Validation

```markdown
## Verify Files Created
Check that all expected files exist:

```bash
# Check for required files
test -f "expected-file.txt" && echo "✅ File created" || echo "❌ File missing"
```

**Success criteria**: All required files exist and contain expected content.
```

### Service-Based Validation

```markdown
## Verify Service Running
Confirm your service is operational:

```bash
# Check service status
curl -f http://localhost:3000/health
# Expected response: {"status": "healthy"}
```

**Success criteria**: Service responds with healthy status code 200.
```

### Configuration Validation

```markdown  
## Verify Configuration
Test that configuration is correct:

```bash
# Validate configuration
your-tool --validate-config
# Expected: "Configuration valid" message
```

**Success criteria**: Configuration passes validation without errors.
```

### Database Validation

```markdown
## Verify Database Setup
Check database is properly configured:

```bash
# Test database connection
your-app --test-db
# Expected: "Database connection successful"
```

**Success criteria**: Database connection successful, all tables created.
```

## Error Recovery Patterns

### Common Failure: Permission Issues
```markdown
**Problem**: Permission denied errors  
**Diagnostic**: Run `ls -la` to check file permissions
**Solution**: 
```bash
chmod +x script.sh  # Make executable
sudo chown $USER:$USER file.txt  # Fix ownership
```
**Validation**: Re-run the failing command
```

### Common Failure: Missing Dependencies
```markdown
**Problem**: Command not found or module missing
**Diagnostic**: Check if dependencies are installed  
**Solution**:
```bash
# Install missing dependencies
npm install  # or pip install, etc.
```
**Validation**: Re-run the original validation command
```

### Common Failure: Port Conflicts  
```markdown
**Problem**: Port already in use error
**Diagnostic**: Check what's using the port: `lsof -i :3000`
**Solution**: Kill conflicting process or use different port
```bash
# Kill process using port 3000  
kill $(lsof -t -i:3000)
# Or modify config to use different port
```
**Validation**: Service starts successfully on the port
```

## Measurement and Success Metrics

### Objective Success Indicators
- All validation commands pass without errors
- Expected files/services exist and are accessible
- Performance metrics meet stated requirements
- Integration tests confirm proper connectivity

### Subjective Success Indicators
- User feels confident the implementation is working
- User understands what they accomplished
- User knows how to troubleshoot common issues
- User can explain what they built to someone else

## Integration with Documentation Types

### Tutorial Integration
- Tutorials focus on **learning success** - "You now understand..."
- How-to guides focus on **task success** - "You have completed..."

### Reference Integration  
- Reference docs provide **specification compliance** validation
- How-to guides provide **practical implementation** validation

### Explanation Integration
- Explanations help users understand **why validation matters**
- How-to guides show users **how to validate effectively**

## Validation Anti-Patterns to Avoid

### ❌ Vague Success Criteria
**Bad**: "Make sure everything works"
**Good**: "Service responds with HTTP 200 to /health endpoint"

### ❌ No Error Recovery
**Bad**: Just showing the happy path validation
**Good**: Including troubleshooting for common failures

### ❌ Manual-Only Validation  
**Bad**: "Check that the UI looks correct"
**Good**: "Run automated tests + visual confirmation checklist"

### ❌ Incomplete Validation
**Bad**: Only testing one aspect of the implementation  
**Good**: Testing functionality, integration, quality, and performance

## See Also

- [How-to Guide Writing Standards](writing-standards.md) - Complete guide authoring standards
- [Quality Gates Reference](../reference/quality-gates.md) - Standard quality validation commands
- [Troubleshooting Patterns](../reference/troubleshooting-patterns.md) - Common problem resolution patterns
- [Testing Best Practices](../explanation/testing-philosophy.md) - Why validation matters