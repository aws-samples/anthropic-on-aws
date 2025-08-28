# Monitoring and Observability Configuration Reference

Complete reference for configuring monitoring, metrics, and alerting in Claude Code implementations.

## Metrics Configuration

### Prometheus Integration

```yaml
metrics:
  provider: prometheus
  endpoint: /metrics
  port: 9090
  path: /claude-metrics
  
  # Authentication for metrics endpoint
  auth:
    type: basic
    username: ${env:METRICS_USER}
    password: ${env:METRICS_PASSWORD}
  
  # Custom metrics definitions
  custom_metrics:
    - name: agent_execution_time
      type: histogram
      description: "Time taken for agent execution"
      labels: [agent_name, model, success]
      buckets: [0.1, 0.5, 1.0, 5.0, 10.0, 30.0, 60.0]
    
    - name: workflow_success_rate
      type: gauge
      description: "Success rate of workflow executions"
      labels: [workflow_name, environment, team]
    
    - name: hook_trigger_count
      type: counter
      description: "Number of hook triggers"
      labels: [hook_name, event, result]
    
    - name: token_usage_total
      type: counter
      description: "Total tokens consumed"
      labels: [agent_name, model, user]
    
    - name: cache_hit_rate
      type: gauge
      description: "Cache hit rate percentage"
      labels: [cache_type, agent]
    
    - name: error_rate
      type: gauge
      description: "Error rate percentage"
      labels: [component, error_type]

  # Metric collection intervals
  collection:
    interval: 15s
    timeout: 10s
    retry_count: 3
```

### InfluxDB Integration

```yaml
metrics:
  provider: influxdb
  url: http://influxdb:8086
  database: claude_metrics
  username: ${env:INFLUXDB_USER}
  password: ${env:INFLUXDB_PASSWORD}
  
  # Retention policies
  retention:
    default: 30d
    detailed: 7d
    aggregated: 365d
  
  # Field mappings
  fields:
    execution_time: float
    token_count: integer
    success: boolean
    user_id: string
    timestamp: datetime
    
  # Tags (indexed fields)
  tags:
    - agent_name
    - model
    - environment
    - team
    - workflow_name
```

## Distributed Tracing

### Jaeger Configuration

```yaml
tracing:
  provider: jaeger
  endpoint: http://jaeger:14268/api/traces
  service_name: claude-code
  
  # Sampling configuration
  sampling:
    type: probabilistic
    rate: 0.1  # Sample 10% of traces
    
  # Rate limiting
  rate_limiting:
    max_traces_per_second: 100
    
  # Trace points configuration
  trace_points:
    agents:
      enabled: true
      include: ["*"]  # All agents
      exclude: ["debug-*"]  # Skip debug agents
      
    workflows:
      enabled: true
      include: ["production-*", "staging-*"]
      exclude: ["test-*"]
      
    hooks:
      enabled: true
      include: ["pre-deploy", "post-deploy", "security-*"]
      
    commands:
      enabled: false  # Disable for performance
      
  # Span attributes
  span_attributes:
    - key: user.id
      value: ${user}
    - key: project.name
      value: ${project}
    - key: environment
      value: ${env:ENVIRONMENT}
```

### OpenTelemetry Configuration

```yaml
tracing:
  provider: opentelemetry
  exporters:
    - type: jaeger
      endpoint: http://jaeger:14268
    - type: zipkin
      endpoint: http://zipkin:9411/api/v2/spans
    - type: otlp
      endpoint: http://otel-collector:4317
      
  # Resource attributes
  resource:
    service.name: claude-code
    service.version: 1.0.0
    deployment.environment: ${env:ENVIRONMENT}
    
  # Instrumentation configuration
  instrumentation:
    auto_detect: true
    libraries:
      - requests
      - asyncio
      - subprocess
      
  # Context propagation
  propagation:
    - tracecontext
    - baggage
    - jaeger
```

## Logging Configuration

### Structured Logging

```yaml
logging:
  level: info
  format: json
  
  # Log destinations
  outputs:
    - type: file
      path: /var/log/claude-code/application.log
      rotation:
        max_size: 100MB
        max_files: 10
        compress: true
        
    - type: stdout
      format: console  # Human-readable for development
      
    - type: elasticsearch
      url: http://elasticsearch:9200
      index: claude-logs
      auth:
        username: ${env:ES_USER}
        password: ${env:ES_PASSWORD}
  
  # Log levels by component
  loggers:
    claude.agents: debug
    claude.workflows: info
    claude.hooks: warn
    claude.security: info
    
  # Custom fields
  fields:
    environment: ${env:ENVIRONMENT}
    service: claude-code
    version: 1.0.0
    
  # Sensitive data filtering
  filters:
    - type: redact
      patterns:
        - "password=.*"
        - "token=.*"
        - "key=.*"
      replacement: "[REDACTED]"
```

### Audit Logging

```yaml
audit:
  enabled: true
  destination: /var/log/claude-code/audit.log
  format: json
  
  # Events to audit
  events:
    - agent_execution
    - workflow_start
    - workflow_end
    - hook_trigger
    - file_modification
    - command_execution
    - authentication
    - authorization_failure
    - configuration_change
    
  # Retention policy
  retention:
    period: 90d
    archive: true
    archive_location: s3://audit-logs/claude-code/
    
  # Compliance requirements
  compliance:
    include_user_ip: true
    include_session_id: true
    include_request_id: true
    timestamp_format: ISO8601
    
  # Filtering
  exclude_patterns:
    - "health_check"
    - "metrics_endpoint"
```

## Alerting Rules

### Prometheus AlertManager Rules

```yaml
alerts:
  # High error rate
  - name: high_error_rate
    metric: error_rate
    condition: "> 5%"
    window: 5m
    severity: critical
    labels:
      team: platform
      service: claude-code
    annotations:
      summary: "High error rate detected"
      description: "Error rate is {{ $value }}% over the last 5 minutes"
    notify:
      - pagerduty
      - slack
  
  # Slow agent response
  - name: slow_agent_response
    metric: agent_execution_time
    condition: "p95 > 30s"
    window: 10m
    severity: warning
    labels:
      component: agents
    notify:
      - slack
      - email
  
  # High token usage
  - name: high_token_usage
    metric: token_usage_total
    condition: "rate(5m) > 10000"
    window: 5m
    severity: warning
    labels:
      cost: true
    notify:
      - email
      - webhook
  
  # Workflow failure spike
  - name: workflow_failure_spike
    metric: workflow_success_rate
    condition: "< 80%"
    window: 15m
    severity: critical
    notify:
      - pagerduty
      - slack
  
  # Cache performance degradation
  - name: low_cache_hit_rate
    metric: cache_hit_rate
    condition: "< 70%"
    window: 30m
    severity: warning
    notify:
      - email
```

### Custom Alert Conditions

```yaml
alert_conditions:
  # Resource exhaustion
  resource_alerts:
    - name: memory_exhaustion
      condition: memory_usage > 90%
      duration: 2m
      action: restart_service
      
    - name: disk_space_low
      condition: disk_usage > 85%
      duration: 5m
      action: cleanup_logs
  
  # Security events
  security_alerts:
    - name: multiple_auth_failures
      condition: failed_logins > 10
      window: 1m
      action: block_ip
      
    - name: suspicious_command
      condition: command matches "rm -rf|sudo|chmod 777"
      action: block_user
  
  # Performance degradation
  performance_alerts:
    - name: response_time_degradation
      condition: avg_response_time > 2 * baseline
      window: 10m
      action: scale_up
```

## Notification Channels

### Slack Integration

```yaml
notifications:
  slack:
    webhook: ${env:SLACK_WEBHOOK_URL}
    
    # Channel routing
    channels:
      critical: "#alerts-critical"
      warning: "#alerts-warning"
      info: "#dev-notifications"
      security: "#security-alerts"
      
    # Message templates
    templates:
      alert: |
        🚨 *{{ .severity | upper }}*: {{ .alert_name }}
        
        *Service*: {{ .service }}
        *Environment*: {{ .environment }}
        *Metric*: {{ .metric }} {{ .condition }}
        *Current Value*: {{ .value }}
        
        *Runbook*: {{ .runbook_url }}
        *Dashboard*: {{ .dashboard_url }}
        
      resolution: |
        ✅ *RESOLVED*: {{ .alert_name }}
        
        *Duration*: {{ .duration }}
        *Resolved at*: {{ .resolved_at }}
        
    # Rate limiting
    rate_limit:
      burst: 10
      period: 1m
```

### PagerDuty Integration

```yaml
notifications:
  pagerduty:
    integration_key: ${env:PAGERDUTY_INTEGRATION_KEY}
    
    # Escalation policies
    escalation:
      critical:
        service: "claude-code-critical"
        escalation_policy: "platform-team-critical"
        
      warning:
        service: "claude-code-warning"
        escalation_policy: "platform-team-warning"
    
    # Event details
    event_details:
      - key: environment
        value: ${env:ENVIRONMENT}
      - key: service
        value: claude-code
      - key: team
        value: platform
```

### Email Configuration

```yaml
notifications:
  email:
    smtp:
      host: smtp.company.com
      port: 587
      username: ${env:SMTP_USER}
      password: ${env:SMTP_PASSWORD}
      tls: true
      
    # Distribution lists
    lists:
      platform_team: ["alice@company.com", "bob@company.com"]
      security_team: ["security@company.com"]
      on_call: ["oncall@company.com"]
      
    # Templates
    templates:
      alert_subject: "[{{ .severity }}] Claude Code Alert: {{ .alert_name }}"
      alert_body: |
        Alert: {{ .alert_name }}
        Severity: {{ .severity }}
        Condition: {{ .condition }}
        Current Value: {{ .value }}
        
        Dashboard: {{ .dashboard_url }}
        Runbook: {{ .runbook_url }}
```

## Dashboard Configuration

### Grafana Dashboards

```yaml
dashboards:
  - name: claude_code_overview
    file: dashboards/overview.json
    folder: "Claude Code"
    datasource: prometheus
    
  - name: agent_performance
    file: dashboards/agents.json
    folder: "Claude Code"
    variables:
      - name: agent
        type: query
        query: label_values(agent_execution_time, agent_name)
        
  - name: workflow_monitoring
    file: dashboards/workflows.json
    folder: "Claude Code"
    
  - name: cost_analysis
    file: dashboards/costs.json
    folder: "Claude Code"
    datasource: influxdb
```

### Health Check Endpoints

```yaml
health_checks:
  # Application health
  - name: application
    endpoint: /health
    interval: 30s
    timeout: 5s
    
  # Database connectivity
  - name: database
    endpoint: /health/db
    interval: 60s
    timeout: 10s
    
  # External dependencies
  - name: claude_api
    endpoint: /health/claude
    interval: 120s
    timeout: 15s
    
  # Metrics endpoint
  - name: metrics
    endpoint: /metrics
    interval: 30s
    expected_status: 200
```

## Performance Monitoring

### SLA Configuration

```yaml
sla:
  availability: 99.9%
  response_time:
    p50: 500ms
    p95: 2000ms
    p99: 5000ms
    
  agent_execution:
    simple_tasks: 5s
    complex_tasks: 30s
    
  workflow_completion:
    standard: 300s
    complex: 900s
    
  uptime_calculation:
    window: 30d
    exclude_maintenance: true
```

### Performance Baselines

```yaml
baselines:
  agent_performance:
    code_review: 3s
    test_generation: 8s
    security_scan: 15s
    documentation: 5s
    
  workflow_duration:
    ci_pipeline: 120s
    deployment: 300s
    security_audit: 600s
    
  resource_usage:
    memory: 512MB
    cpu: 50%
    disk_io: 100MB/s
```

## Configuration Validation

```yaml
validation:
  required_fields:
    - metrics.provider
    - logging.level
    - alerts
    - notifications
    
  optional_fields:
    - tracing
    - audit
    - dashboards
    
  constraints:
    - metrics.collection.interval >= 10s
    - logging.rotation.max_files >= 5
    - alerts.window >= 1m