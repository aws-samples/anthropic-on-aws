# Workflow Configuration Reference

Complete reference for configuring Claude Code workflows and automation.

## Workflow Overview

Claude Code supports multiple workflow types that can be configured at global and project levels:

- **EPCC Workflow**: Explore-Plan-Code-Commit systematic development
- **TDD Workflow**: Test-Driven Development automation
- **Diataxis Workflow**: Documentation creation following the Diataxis framework
- **Quality Gates**: Automated quality checks and gates
- **Custom Workflows**: User-defined automation patterns

## EPCC Workflow Configuration

### Basic EPCC Configuration
```json
{
  "workflows": {
    "epcc": {
      "enabled": true,
      "outputDir": ".claude/epcc",
      "autoArchive": true,
      "maxFiles": 100
    }
  }
}
```

### Advanced EPCC Configuration
```json
{
  "workflows": {
    "epcc": {
      "enabled": true,
      "outputDir": ".claude/epcc",
      "autoArchive": true,
      "maxFiles": 100,
      "templates": {
        "explore": "./templates/custom-explore.md",
        "plan": "./templates/custom-plan.md",
        "code": "./templates/custom-code.md",
        "commit": "./templates/custom-commit.md"
      },
      "phases": {
        "explore": {
          "model": "sonnet",
          "timeout": 300,
          "depth": "standard",
          "includeSecurity": true,
          "includePerformance": true
        },
        "plan": {
          "model": "sonnet",
          "timeout": 180,
          "includeRisks": true,
          "includeTimeline": true,
          "detailLevel": "detailed"
        },
        "code": {
          "model": "sonnet",
          "timeout": 600,
          "enableTDD": false,
          "runQualityGates": true,
          "autoFormat": true
        },
        "commit": {
          "model": "sonnet",
          "timeout": 120,
          "runTests": true,
          "generateDocs": true,
          "conventionalCommits": true
        }
      },
      "hooks": {
        "beforeExplore": "./hooks/pre-explore.py",
        "afterExplore": "./hooks/post-explore.py",
        "beforePlan": "./hooks/pre-plan.py",
        "afterPlan": "./hooks/post-plan.py",
        "beforeCode": "./hooks/pre-code.py",
        "afterCode": "./hooks/post-code.py",
        "beforeCommit": "./hooks/pre-commit.py",
        "afterCommit": "./hooks/post-commit.py"
      }
    }
  }
}
```

### EPCC Template Configuration

#### Custom Explore Template
```markdown
# EPCC Explore Template

## Project Analysis for ${TARGET}

### Executive Summary
- **Objective**: ${OBJECTIVE}
- **Scope**: ${SCOPE}
- **Complexity**: ${COMPLEXITY}
- **Timeline**: ${ESTIMATED_TIMELINE}

### Architecture Analysis
- Current architecture patterns
- Technology stack assessment
- Scalability considerations
- Integration points

### Security Assessment
- Current security measures
- Vulnerability analysis
- Compliance requirements
- Risk factors

### Performance Analysis
- Current performance metrics
- Bottlenecks identification
- Optimization opportunities
- Resource requirements

### Dependencies Analysis
- External dependencies
- Internal module dependencies
- Version compatibility
- Update requirements

### Risk Assessment
- Technical risks
- Business risks
- Mitigation strategies
- Contingency plans

### Recommendations
- Implementation approach
- Best practices to follow
- Tools and frameworks
- Quality standards
```

#### Custom Plan Template
```markdown
# EPCC Plan Template

## Implementation Plan for ${FEATURE}

### Objectives
- **Primary Goal**: ${PRIMARY_GOAL}
- **Success Criteria**: ${SUCCESS_CRITERIA}
- **Acceptance Criteria**: ${ACCEPTANCE_CRITERIA}

### Technical Approach
- **Architecture**: ${ARCHITECTURE_PATTERN}
- **Design Patterns**: ${DESIGN_PATTERNS}
- **Technology Stack**: ${TECH_STACK}
- **Integration Strategy**: ${INTEGRATION_APPROACH}

### Task Breakdown
1. **Phase 1: Foundation** (${PHASE1_DURATION})
   - ${TASK1}
   - ${TASK2}
   - ${TASK3}

2. **Phase 2: Implementation** (${PHASE2_DURATION})
   - ${TASK4}
   - ${TASK5}
   - ${TASK6}

3. **Phase 3: Integration** (${PHASE3_DURATION})
   - ${TASK7}
   - ${TASK8}
   - ${TASK9}

### Testing Strategy
- **Unit Testing**: ${UNIT_TEST_APPROACH}
- **Integration Testing**: ${INTEGRATION_TEST_APPROACH}
- **End-to-End Testing**: ${E2E_TEST_APPROACH}
- **Performance Testing**: ${PERFORMANCE_TEST_APPROACH}

### Quality Gates
- Code coverage: ${COVERAGE_THRESHOLD}%
- Performance benchmarks: ${PERFORMANCE_TARGETS}
- Security scans: ${SECURITY_REQUIREMENTS}
- Documentation: ${DOCUMENTATION_REQUIREMENTS}

### Risk Mitigation
- **Risk 1**: ${RISK1} → ${MITIGATION1}
- **Risk 2**: ${RISK2} → ${MITIGATION2}
- **Risk 3**: ${RISK3} → ${MITIGATION3}

### Timeline
- **Start Date**: ${START_DATE}
- **Milestone 1**: ${MILESTONE1_DATE}
- **Milestone 2**: ${MILESTONE2_DATE}
- **Completion Date**: ${END_DATE}
```

## TDD Workflow Configuration

### Basic TDD Configuration
```json
{
  "workflows": {
    "tdd": {
      "enabled": true,
      "testFramework": "pytest",
      "coverageThreshold": 80,
      "testPattern": "test_*.py",
      "autoRun": true
    }
  }
}
```

### Advanced TDD Configuration
```json
{
  "workflows": {
    "tdd": {
      "enabled": true,
      "testFramework": "pytest",
      "coverageThreshold": 90,
      "testPattern": "test_*.py",
      "autoRun": true,
      "testDirectory": "tests",
      "sourceDirectory": "src",
      "coverageFormat": "lcov",
      "reportFormats": ["html", "xml", "json"],
      "parallelExecution": true,
      "failFast": false,
      "verbose": true,
      "phases": {
        "red": {
          "writeTestFirst": true,
          "testMustFail": true,
          "timeout": 60
        },
        "green": {
          "implementMinimal": true,
          "testMustPass": true,
          "timeout": 300
        },
        "refactor": {
          "maintainTests": true,
          "improveCode": true,
          "timeout": 240
        }
      },
      "quality": {
        "enableLinting": true,
        "enableTypeChecking": true,
        "enableFormatting": true,
        "enableSecurityScans": true
      },
      "hooks": {
        "beforeTest": "./hooks/setup-test-env.py",
        "afterTest": "./hooks/cleanup-test-env.py",
        "onTestFail": "./hooks/test-failure-handler.py",
        "onCoverageThreshold": "./hooks/coverage-alert.py"
      }
    }
  }
}
```

### Framework-Specific Configuration

#### Python/pytest Configuration
```json
{
  "tdd": {
    "testFramework": "pytest",
    "testCommand": "pytest",
    "testOptions": [
      "--verbose",
      "--tb=short",
      "--strict-markers",
      "--disable-warnings"
    ],
    "coverageCommand": "pytest --cov=src --cov-report=html",
    "fixtures": {
      "useFixtures": true,
      "fixtureFile": "conftest.py",
      "sharedFixtures": ["db_session", "client", "mock_api"]
    }
  }
}
```

#### JavaScript/Jest Configuration
```json
{
  "tdd": {
    "testFramework": "jest",
    "testCommand": "npm test",
    "testOptions": [
      "--verbose",
      "--watchAll=false",
      "--coverage",
      "--collectCoverageFrom=src/**/*.{js,jsx,ts,tsx}"
    ],
    "setupFiles": ["<rootDir>/src/setupTests.js"],
    "testEnvironment": "jsdom"
  }
}
```

## Diataxis Workflow Configuration

### Basic Diataxis Configuration
```json
{
  "workflows": {
    "diataxis": {
      "enabled": true,
      "outputDir": "./docs",
      "defaultMode": "full",
      "autoIndex": true
    }
  }
}
```

### Advanced Diataxis Configuration
```json
{
  "workflows": {
    "diataxis": {
      "enabled": true,
      "outputDir": "./docs",
      "defaultMode": "full",
      "autoIndex": true,
      "crossReference": true,
      "generateDiagrams": true,
      "templates": {
        "tutorial": "./templates/tutorial.md",
        "howto": "./templates/howto.md",
        "reference": "./templates/reference.md",
        "explanation": "./templates/explanation.md"
      },
      "modes": {
        "full": ["tutorial", "howto", "reference", "explanation"],
        "learning": ["tutorial", "explanation"],
        "working": ["howto", "reference"],
        "understanding": ["explanation", "reference"]
      },
      "agents": {
        "tutorial": ["docs-tutorial-agent", "test-generator", "ux-optimizer"],
        "howto": ["docs-howto-agent", "code-archaeologist", "system-designer"],
        "reference": ["docs-reference-agent", "documentation-agent"],
        "explanation": ["docs-explanation-agent", "architecture-documenter"]
      },
      "validation": {
        "checkExamples": true,
        "validateLinks": true,
        "spellCheck": true,
        "formatCheck": true
      }
    }
  }
}
```

### Diataxis Commands
- `/diataxis/diataxis-docs` - Master orchestrator
- `/diataxis/diataxis-tutorial` - Learning documentation
- `/diataxis/diataxis-howto` - Task documentation
- `/diataxis/diataxis-reference` - Technical specs
- `/diataxis/diataxis-explanation` - Conceptual docs

### Diataxis Output Files
- `docs/tutorials/[topic].md` - Step-by-step learning guide
- `docs/how-to/[task].md` - Problem-solving guide
- `docs/reference/[component].md` - Technical specifications
- `docs/explanation/[concept].md` - Conceptual understanding

## Quality Gates Configuration

### Basic Quality Gates
```json
{
  "quality": {
    "gates": [
      {
        "name": "lint",
        "command": "ruff check .",
        "required": true,
        "timeout": 30
      },
      {
        "name": "format",
        "command": "black --check .",
        "required": true,
        "timeout": 30
      },
      {
        "name": "type-check",
        "command": "mypy .",
        "required": false,
        "timeout": 60
      }
    ]
  }
}
```

### Advanced Quality Gates
```json
{
  "quality": {
    "enabled": true,
    "mode": "strict",
    "failFast": false,
    "parallel": true,
    "gates": [
      {
        "name": "format",
        "description": "Code formatting check",
        "command": "black --check .",
        "required": true,
        "timeout": 30,
        "workingDir": ".",
        "env": {
          "PYTHONPATH": "src"
        },
        "retries": 1,
        "condition": "always"
      },
      {
        "name": "lint",
        "description": "Code quality linting",
        "command": "ruff check --output-format=json .",
        "required": true,
        "timeout": 60,
        "parser": "json",
        "thresholds": {
          "errors": 0,
          "warnings": 10
        }
      },
      {
        "name": "type-check",
        "description": "Static type checking",
        "command": "mypy --strict .",
        "required": false,
        "timeout": 120,
        "condition": "on_change",
        "filePatterns": ["*.py"]
      },
      {
        "name": "security",
        "description": "Security vulnerability scan",
        "command": "bandit -r . -f json",
        "required": true,
        "timeout": 90,
        "parser": "json",
        "severity": "medium"
      },
      {
        "name": "test",
        "description": "Unit test execution",
        "command": "pytest --tb=short",
        "required": true,
        "timeout": 300,
        "coverage": {
          "enabled": true,
          "threshold": 80,
          "format": "xml"
        }
      },
      {
        "name": "integration-test",
        "description": "Integration test suite",
        "command": "pytest tests/integration/",
        "required": false,
        "timeout": 600,
        "condition": "on_push",
        "branches": ["main", "develop"]
      }
    ],
    "preCommit": {
      "enabled": true,
      "gates": ["format", "lint", "test"]
    },
    "prePush": {
      "enabled": true,
      "gates": ["format", "lint", "type-check", "security", "test"]
    },
    "notifications": {
      "onFailure": {
        "enabled": true,
        "channels": ["slack", "email"],
        "template": "quality-gate-failure.md"
      },
      "onSuccess": {
        "enabled": false
      }
    }
  }
}
```

### Language-Specific Quality Gates

#### Python Quality Gates
```json
{
  "quality": {
    "gates": [
      {
        "name": "black-format",
        "command": "black --check --line-length 88 .",
        "required": true
      },
      {
        "name": "isort-imports",
        "command": "isort --check-only --profile black .",
        "required": true
      },
      {
        "name": "ruff-lint",
        "command": "ruff check .",
        "required": true
      },
      {
        "name": "mypy-types",
        "command": "mypy --strict .",
        "required": false
      },
      {
        "name": "bandit-security",
        "command": "bandit -r . -ll",
        "required": true
      },
      {
        "name": "pytest-tests",
        "command": "pytest --cov=src --cov-fail-under=80",
        "required": true
      }
    ]
  }
}
```

#### JavaScript/TypeScript Quality Gates
```json
{
  "quality": {
    "gates": [
      {
        "name": "prettier-format",
        "command": "prettier --check .",
        "required": true
      },
      {
        "name": "eslint-lint",
        "command": "eslint . --ext .js,.jsx,.ts,.tsx",
        "required": true
      },
      {
        "name": "tsc-types",
        "command": "tsc --noEmit",
        "required": true
      },
      {
        "name": "jest-tests",
        "command": "jest --coverage --passWithNoTests",
        "required": true
      },
      {
        "name": "audit-security",
        "command": "npm audit --audit-level=moderate",
        "required": true
      }
    ]
  }
}
```

## Custom Workflow Configuration

### Workflow Definition
```json
{
  "workflows": {
    "custom": {
      "deployment": {
        "name": "Automated Deployment",
        "description": "Deploy application to staging/production",
        "trigger": "manual",
        "steps": [
          {
            "name": "validate",
            "command": "./scripts/validate-deployment.sh",
            "timeout": 60
          },
          {
            "name": "build",
            "command": "docker build -t myapp:latest .",
            "timeout": 300
          },
          {
            "name": "test",
            "command": "docker run --rm myapp:latest npm test",
            "timeout": 180
          },
          {
            "name": "deploy",
            "command": "./scripts/deploy.sh ${ENVIRONMENT}",
            "timeout": 600,
            "env": {
              "ENVIRONMENT": "staging"
            }
          }
        ],
        "onSuccess": "./hooks/deployment-success.sh",
        "onFailure": "./hooks/deployment-failure.sh"
      },
      "documentation": {
        "name": "Documentation Generation",
        "description": "Generate and deploy documentation",
        "trigger": "on_change",
        "filePatterns": ["docs/**/*.md", "src/**/*.py"],
        "steps": [
          {
            "name": "generate-api-docs",
            "command": "sphinx-apidoc -o docs/api src/"
          },
          {
            "name": "build-docs",
            "command": "sphinx-build docs docs/_build"
          },
          {
            "name": "deploy-docs",
            "command": "./scripts/deploy-docs.sh",
            "condition": "branch === 'main'"
          }
        ]
      }
    }
  }
}
```

### Workflow Triggers

#### Manual Triggers
```json
{
  "trigger": "manual",
  "parameters": [
    {
      "name": "environment",
      "type": "select",
      "options": ["staging", "production"],
      "required": true
    },
    {
      "name": "force",
      "type": "boolean",
      "default": false
    }
  ]
}
```

#### Event-Based Triggers
```json
{
  "trigger": "on_change",
  "filePatterns": ["src/**/*.py", "tests/**/*.py"],
  "excludePatterns": ["**/__pycache__/**"],
  "debounce": 5000
}
```

#### Scheduled Triggers
```json
{
  "trigger": "schedule",
  "cron": "0 2 * * *",
  "timezone": "UTC"
}
```

#### Git Hook Triggers
```json
{
  "trigger": "git_hook",
  "events": ["pre-commit", "pre-push", "post-merge"],
  "branches": ["main", "develop"]
}
```

## Workflow Execution Control

### Conditional Execution
```json
{
  "steps": [
    {
      "name": "build",
      "command": "npm run build",
      "condition": "env.NODE_ENV === 'production'"
    },
    {
      "name": "test",
      "command": "npm test",
      "condition": "changed_files.includes('test')"
    },
    {
      "name": "deploy",
      "command": "deploy.sh",
      "condition": "branch === 'main' && all_tests_passed"
    }
  ]
}
```

### Parallel Execution
```json
{
  "steps": [
    {
      "name": "parallel-group",
      "parallel": [
        {
          "name": "lint",
          "command": "eslint ."
        },
        {
          "name": "test",
          "command": "jest"
        },
        {
          "name": "build",
          "command": "webpack"
        }
      ]
    }
  ]
}
```

### Error Handling
```json
{
  "steps": [
    {
      "name": "risky-operation",
      "command": "./risky-script.sh",
      "continueOnError": false,
      "retries": 3,
      "retryDelay": 5000,
      "timeout": 120,
      "onError": "./cleanup-script.sh"
    }
  ]
}
```

## Environment Configuration

### Environment Variables
```json
{
  "workflows": {
    "environments": {
      "development": {
        "NODE_ENV": "development",
        "DEBUG": "true",
        "API_URL": "http://localhost:3000"
      },
      "staging": {
        "NODE_ENV": "staging",
        "DEBUG": "false",
        "API_URL": "https://staging-api.example.com"
      },
      "production": {
        "NODE_ENV": "production",
        "DEBUG": "false",
        "API_URL": "https://api.example.com"
      }
    }
  }
}
```

### Secret Management
```json
{
  "workflows": {
    "secrets": {
      "provider": "environment",
      "required": [
        "DATABASE_URL",
        "API_SECRET_KEY",
        "DEPLOYMENT_TOKEN"
      ],
      "vault": {
        "enabled": false,
        "provider": "hashicorp",
        "endpoint": "https://vault.company.com"
      }
    }
  }
}
```

## Monitoring and Notifications

### Workflow Monitoring
```json
{
  "workflows": {
    "monitoring": {
      "enabled": true,
      "metrics": {
        "provider": "prometheus",
        "endpoint": "http://prometheus:9090",
        "labels": {
          "project": "myapp",
          "environment": "${ENVIRONMENT}"
        }
      },
      "logging": {
        "level": "info",
        "format": "json",
        "output": "/var/log/workflows.log"
      },
      "healthCheck": {
        "enabled": true,
        "endpoint": "/_health",
        "interval": 30
      }
    }
  }
}
```

### Notification Configuration
```json
{
  "workflows": {
    "notifications": {
      "slack": {
        "enabled": true,
        "webhook": "${SLACK_WEBHOOK_URL}",
        "channel": "#deployments",
        "username": "Claude Workflows",
        "events": ["success", "failure", "start"]
      },
      "email": {
        "enabled": true,
        "smtp": {
          "host": "smtp.company.com",
          "port": 587,
          "secure": true,
          "auth": {
            "user": "${SMTP_USER}",
            "pass": "${SMTP_PASS}"
          }
        },
        "recipients": ["team@company.com"],
        "events": ["failure"]
      },
      "webhooks": [
        {
          "name": "deployment-webhook",
          "url": "https://api.company.com/webhooks/deployment",
          "method": "POST",
          "headers": {
            "Authorization": "Bearer ${WEBHOOK_TOKEN}"
          },
          "events": ["success", "failure"]
        }
      ]
    }
  }
}
```

## Performance Optimization

### Caching Configuration
```json
{
  "workflows": {
    "cache": {
      "enabled": true,
      "provider": "redis",
      "url": "redis://localhost:6379",
      "ttl": 3600,
      "keys": {
        "dependencies": "deps:${package_json_hash}",
        "build": "build:${source_files_hash}",
        "tests": "tests:${test_files_hash}"
      }
    }
  }
}
```

### Resource Limits
```json
{
  "workflows": {
    "resources": {
      "maxConcurrentWorkflows": 5,
      "maxStepDuration": 1800,
      "maxWorkflowDuration": 3600,
      "memoryLimit": "1GB",
      "diskSpace": "5GB"
    }
  }
}
```

## Migration and Versioning

### Configuration Versioning
```json
{
  "version": "2.0",
  "workflows": {
    "compatibility": {
      "v1": {
        "deprecated": true,
        "migrationGuide": "docs/migration-v1-to-v2.md"
      }
    }
  }
}
```

### Workflow Templates
```json
{
  "workflows": {
    "templates": {
      "python-ci": {
        "version": "1.2.0",
        "description": "Standard Python CI/CD workflow",
        "url": "https://templates.claude.ai/python-ci-v1.2.0.json"
      }
    }
  }
}
```

## See Also

- [EPCC Commands Reference](epcc-commands.md)
- [Hook Configuration](hooks/configuration.md)
- [Quality Gates Guide](../how-to/setup-quality-gates.md)
- [Configuration Schema](configuration/schema.md)