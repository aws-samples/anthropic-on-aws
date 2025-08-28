# CLAUDE.md - Python Web Application

This CLAUDE.md template is optimized for Python web applications using Django, FastAPI, or Flask.

## Project Overview

This is a Python web application project. Claude Code will help you with API development, database management, testing, and deployment.

## Project Structure

```
.
├── src/                       # Application source code
│   ├── api/                   # API endpoints
│   ├── models/                # Database models
│   ├── services/              # Business logic
│   ├── utils/                 # Utility functions
│   └── migrations/            # Database migrations
├── tests/                     # Test files
│   ├── unit/                  # Unit tests
│   ├── integration/           # Integration tests
│   └── e2e/                   # End-to-end tests
├── config/                    # Configuration files
├── requirements.txt           # Python dependencies
├── docker-compose.yml         # Docker configuration
└── .env.example              # Environment variables template
```

## Commands and Workflows

### Development Commands
```bash
# Start development server
python manage.py runserver       # Django
uvicorn main:app --reload       # FastAPI
flask run --debug                # Flask

# Database operations
python manage.py makemigrations
python manage.py migrate
alembic upgrade head

# Run tests
pytest -v --cov=src
python manage.py test
```

### Quality Checks (MUST RUN BEFORE COMMIT)
```bash
# Format and lint
black . --line-length 88
isort . --profile black
flake8 . --max-line-length 88
mypy . --strict

# Security check
bandit -r src/
safety check

# Run all checks
make quality  # If Makefile exists
```

## Code Style Guidelines

### Python Conventions
- Use type hints for all functions: `def process(data: dict[str, Any]) -> Result:`
- Follow PEP 8 with Black formatting (88 char line limit)
- Use descriptive variable names, no abbreviations
- Docstrings for all public functions and classes

### API Design
- RESTful conventions for endpoints
- Use proper HTTP status codes
- Implement pagination for list endpoints
- Version your API (`/api/v1/`)
- Always validate input data

### Database Best Practices
- Never write raw SQL, use ORM
- Always create migrations for schema changes
- Index foreign keys and commonly queried fields
- Use transactions for multi-step operations
- Implement soft deletes where appropriate

## Testing Requirements

### Test Coverage Goals
- Minimum 80% overall coverage
- 100% coverage for critical business logic
- All API endpoints must have tests
- Include both happy path and error cases

### Test Structure
```python
class TestUserAPI:
    """Test user API endpoints."""
    
    def test_create_user_success(self, client, db):
        """Test successful user creation."""
        response = client.post("/api/users", json={...})
        assert response.status_code == 201
        
    def test_create_user_duplicate_email(self, client, db):
        """Test user creation with duplicate email."""
        # ... test implementation
```

## Custom Claude Code Configuration

### Agents for This Project
- `security-reviewer`: Reviews code for OWASP vulnerabilities
- `test-generator`: Creates comprehensive test suites
- `performance-profiler`: Analyzes performance bottlenecks
- `optimization-engineer`: Implements performance optimizations
- `documentation-agent`: Maintains API documentation

### Hooks
```json
{
  "hooks": {
    "pre-commit": {
      "actions": ["format", "lint", "test", "security-check"]
    },
    "post-deployment": {
      "actions": ["smoke-test", "notify-team"]
    }
  }
}
```

### Recommended MCP Servers
```bash
# Database operations
claude mcp add postgres --env DATABASE_URL=${DATABASE_URL}

# API testing
claude mcp add http-client

# GitHub integration
claude mcp add github --env GITHUB_TOKEN=${GITHUB_TOKEN}
```

## Deployment Checklist

Before deploying to production:
- [ ] All tests passing
- [ ] Security scan completed
- [ ] Database migrations tested
- [ ] Environment variables configured
- [ ] API documentation updated
- [ ] Performance testing completed
- [ ] Rollback plan prepared

## Environment Variables

Required environment variables:
```bash
# Application
SECRET_KEY=your-secret-key
DEBUG=False
ALLOWED_HOSTS=example.com

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname

# Redis (for caching/queues)
REDIS_URL=redis://localhost:6379/0

# External Services
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
STRIPE_API_KEY=xxx
SENDGRID_API_KEY=xxx

# Monitoring
SENTRY_DSN=xxx
NEW_RELIC_LICENSE_KEY=xxx
```

## Common Tasks

### Adding a New API Endpoint
1. Create the endpoint in `src/api/`
2. Add input validation
3. Implement business logic in `src/services/`
4. Write tests in `tests/integration/`
5. Update API documentation
6. Add to postman collection

### Database Schema Changes
1. Modify models in `src/models/`
2. Create migration: `python manage.py makemigrations`
3. Review migration file
4. Test migration on staging database
5. Apply migration: `python manage.py migrate`
6. Update related tests

### Performance Optimization
1. Use `django-debug-toolbar` or `fastapi-profiler`
2. Identify slow queries with `EXPLAIN ANALYZE`
3. Add appropriate indexes
4. Implement caching where needed
5. Consider async operations for I/O bound tasks

## Security Guidelines

### Critical Security Checks
- Always sanitize user input
- Use parameterized queries (ORM handles this)
- Implement rate limiting on all endpoints
- Use HTTPS in production
- Store secrets in environment variables
- Implement CORS properly
- Add CSP headers
- Regular dependency updates

### Authentication & Authorization
```python
# Use established libraries
from django.contrib.auth import authenticate
from fastapi_users import FastAPIUsers
from flask_jwt_extended import JWTManager

# Always hash passwords
from werkzeug.security import generate_password_hash
```

## Troubleshooting

### Common Issues
1. **Import errors**: Check virtual environment is activated
2. **Database connection**: Verify DATABASE_URL is correct
3. **Migration conflicts**: Review and merge migrations carefully
4. **Slow API responses**: Check N+1 queries, add select_related/prefetch_related
5. **Memory leaks**: Profile with memory_profiler

## CI/CD Pipeline

```yaml
# Example GitHub Actions workflow
name: CI/CD
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Python
        uses: actions/setup-python@v2
      - name: Install dependencies
        run: pip install -r requirements.txt
      - name: Run tests
        run: pytest --cov
      - name: Security scan
        run: bandit -r src/
```

## Performance Benchmarks

Target metrics:
- API response time: < 200ms (p95)
- Database queries: < 50ms
- Page load time: < 2 seconds
- Throughput: > 1000 req/sec
- Error rate: < 0.1%

## Additional Resources

- [Django Best Practices](https://docs.djangoproject.com/en/stable/misc/design-philosophies/)
- [FastAPI Best Practices](https://fastapi.tiangolo.com/tutorial/best-practices/)
- [The Twelve-Factor App](https://12factor.net/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

## Notes for Claude Code

When working on this project:
- Always run tests before committing code
- Follow the established patterns in the codebase
- Prioritize security and performance
- Write clear commit messages
- Update documentation when changing APIs
- Use async/await for I/O operations where possible
- Cache expensive computations
- Log errors with appropriate context