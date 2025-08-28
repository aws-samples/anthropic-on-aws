# CLAUDE.md - Enterprise Application

This CLAUDE.md template is optimized for large-scale enterprise applications with complex requirements around compliance, security, and governance.

## Project Overview

This is an enterprise-grade application with strict requirements for security, compliance, scalability, and maintainability. Claude Code will assist with architecture decisions, security implementations, compliance checks, and enterprise integration patterns.

## Project Structure

```
.
├── src/                       # Application source
│   ├── core/                  # Core business domain
│   │   ├── domain/            # Domain models
│   │   ├── services/          # Domain services
│   │   └── repositories/      # Repository interfaces
│   ├── application/           # Application services
│   │   ├── commands/          # Command handlers (CQRS)
│   │   ├── queries/           # Query handlers
│   │   └── events/            # Event handlers
│   ├── infrastructure/        # Infrastructure layer
│   │   ├── persistence/       # Database implementation
│   │   ├── messaging/         # Message bus/queues
│   │   ├── caching/           # Cache implementation
│   │   └── external/          # External service clients
│   ├── api/                   # API layer
│   │   ├── rest/              # REST endpoints
│   │   ├── graphql/           # GraphQL schema
│   │   └── grpc/              # gRPC services
│   └── web/                   # Web UI
│       ├── components/        # UI components
│       ├── pages/             # Page components
│       └── services/          # Frontend services
├── tests/                     # Comprehensive testing
│   ├── unit/
│   ├── integration/
│   ├── acceptance/
│   ├── performance/
│   └── security/
├── docs/                      # Documentation
│   ├── architecture/          # ADRs and design docs
│   ├── api/                   # API documentation
│   ├── compliance/            # Compliance docs
│   └── operations/            # Ops runbooks
├── deployment/                # Deployment configs
│   ├── kubernetes/            # K8s manifests
│   ├── helm/                  # Helm charts
│   └── terraform/             # Infrastructure
├── security/                  # Security configs
│   ├── policies/              # Security policies
│   ├── certificates/          # SSL/TLS certs
│   └── secrets/               # Secret management
└── compliance/                # Compliance artifacts
    ├── audit-logs/            # Audit trail
    ├── reports/               # Compliance reports
    └── controls/              # Control mappings
```

## Architecture Principles

### Domain-Driven Design (DDD)
```python
# src/core/domain/entities/order.py
from dataclasses import dataclass
from typing import List, Optional
from datetime import datetime
from decimal import Decimal

@dataclass
class Order:
    """Order aggregate root."""
    
    order_id: str
    customer_id: str
    order_items: List['OrderItem']
    status: 'OrderStatus'
    created_at: datetime
    updated_at: datetime
    total_amount: Decimal
    
    def add_item(self, item: 'OrderItem') -> None:
        """Add item to order with business rules."""
        if self.status != OrderStatus.DRAFT:
            raise DomainException("Cannot modify submitted order")
        
        if self.total_amount + item.amount > Decimal('1000000'):
            raise DomainException("Order exceeds maximum allowed amount")
        
        self.order_items.append(item)
        self.total_amount += item.amount
        self.updated_at = datetime.utcnow()
    
    def submit(self) -> List['DomainEvent']:
        """Submit order for processing."""
        if not self.order_items:
            raise DomainException("Cannot submit empty order")
        
        self.status = OrderStatus.SUBMITTED
        return [OrderSubmittedEvent(self.order_id, self.customer_id)]
```

### CQRS Pattern
```python
# src/application/commands/submit_order.py
from dataclasses import dataclass

@dataclass
class SubmitOrderCommand:
    order_id: str
    customer_id: str

class SubmitOrderHandler:
    def __init__(self, 
                 order_repo: OrderRepository,
                 payment_service: PaymentService,
                 event_bus: EventBus):
        self.order_repo = order_repo
        self.payment_service = payment_service
        self.event_bus = event_bus
    
    async def handle(self, command: SubmitOrderCommand) -> None:
        # Load aggregate
        order = await self.order_repo.get(command.order_id)
        
        # Business logic
        events = order.submit()
        
        # Side effects
        await self.payment_service.authorize_payment(order)
        
        # Persist
        await self.order_repo.save(order)
        
        # Publish events
        for event in events:
            await self.event_bus.publish(event)
```

## Security Implementation

### Authentication & Authorization
```python
# Enterprise SSO integration
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2AuthorizationCodeBearer
import jwt
from typing import Optional

# OAuth2 with enterprise IdP (e.g., Okta, Auth0, Azure AD)
oauth2_scheme = OAuth2AuthorizationCodeBearer(
    authorizationUrl="https://idp.enterprise.com/oauth/authorize",
    tokenUrl="https://idp.enterprise.com/oauth/token",
)

class SecurityContext:
    def __init__(self, token_data: dict):
        self.user_id = token_data["sub"]
        self.roles = token_data.get("roles", [])
        self.permissions = token_data.get("permissions", [])
        self.department = token_data.get("department")
        self.clearance_level = token_data.get("clearance_level", 0)

async def get_security_context(token: str = Depends(oauth2_scheme)) -> SecurityContext:
    try:
        # Validate token with IdP
        payload = jwt.decode(
            token,
            PUBLIC_KEY,
            algorithms=["RS256"],
            audience="enterprise-app",
            issuer="https://idp.enterprise.com"
        )
        return SecurityContext(payload)
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid authentication")

# Role-based access control
def require_role(role: str):
    def role_checker(context: SecurityContext = Depends(get_security_context)):
        if role not in context.roles:
            raise HTTPException(status_code=403, detail="Insufficient privileges")
        return context
    return role_checker

# Attribute-based access control
def require_clearance(level: int):
    def clearance_checker(context: SecurityContext = Depends(get_security_context)):
        if context.clearance_level < level:
            raise HTTPException(status_code=403, detail="Insufficient clearance level")
        return context
    return clearance_checker
```

### Data Encryption
```python
# Field-level encryption for sensitive data
from cryptography.fernet import Fernet
from typing import Any
import json

class FieldEncryption:
    def __init__(self, key: bytes):
        self.cipher = Fernet(key)
    
    def encrypt_field(self, value: Any) -> str:
        """Encrypt sensitive field."""
        json_value = json.dumps(value)
        encrypted = self.cipher.encrypt(json_value.encode())
        return encrypted.decode()
    
    def decrypt_field(self, encrypted_value: str) -> Any:
        """Decrypt sensitive field."""
        decrypted = self.cipher.decrypt(encrypted_value.encode())
        return json.loads(decrypted.decode())

# Usage in models
class Customer:
    def __init__(self, encryption: FieldEncryption):
        self.encryption = encryption
    
    @property
    def ssn(self) -> str:
        return self.encryption.decrypt_field(self._encrypted_ssn)
    
    @ssn.setter
    def ssn(self, value: str):
        self._encrypted_ssn = self.encryption.encrypt_field(value)
```

## Compliance & Audit

### Audit Logging
```python
# Comprehensive audit trail
import json
from datetime import datetime
from typing import Any, Optional

class AuditLogger:
    def __init__(self, storage: AuditStorage):
        self.storage = storage
    
    async def log_action(self,
                         action: str,
                         entity_type: str,
                         entity_id: str,
                         user_id: str,
                         changes: Optional[dict] = None,
                         metadata: Optional[dict] = None):
        """Log auditable action."""
        audit_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "action": action,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "user_id": user_id,
            "changes": changes,
            "metadata": metadata or {},
            "ip_address": get_client_ip(),
            "session_id": get_session_id(),
            "correlation_id": get_correlation_id()
        }
        
        # Store in immutable audit log
        await self.storage.append(audit_entry)
        
        # Send to SIEM if configured
        if self.siem_enabled:
            await self.send_to_siem(audit_entry)

# Decorator for automatic audit logging
def audit(action: str, entity_type: str):
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # Extract entity_id and user_id from context
            entity_id = kwargs.get("entity_id")
            user_id = get_current_user_id()
            
            # Capture state before
            before_state = await capture_entity_state(entity_type, entity_id)
            
            # Execute function
            result = await func(*args, **kwargs)
            
            # Capture state after
            after_state = await capture_entity_state(entity_type, entity_id)
            
            # Log audit entry
            await audit_logger.log_action(
                action=action,
                entity_type=entity_type,
                entity_id=entity_id,
                user_id=user_id,
                changes=diff_states(before_state, after_state)
            )
            
            return result
        return wrapper
    return decorator
```

### Compliance Controls
```yaml
# compliance/controls/sox-controls.yaml
controls:
  - id: SOX-IT-01
    name: Access Control
    description: Ensure appropriate access controls for financial systems
    implementation:
      - component: Authentication Service
        evidence: 
          - Multi-factor authentication required
          - Session timeout after 15 minutes
          - Password complexity requirements
      - component: Authorization Service
        evidence:
          - Role-based access control
          - Segregation of duties enforced
          - Regular access reviews
    
  - id: SOX-IT-02
    name: Change Management
    description: Formal change management process
    implementation:
      - component: CI/CD Pipeline
        evidence:
          - All changes require approval
          - Automated testing before deployment
          - Rollback procedures in place
```

## Data Management

### Data Classification
```python
# Data classification and handling
from enum import Enum
from typing import Dict, Any

class DataClassification(Enum):
    PUBLIC = "public"
    INTERNAL = "internal"
    CONFIDENTIAL = "confidential"
    RESTRICTED = "restricted"

class DataHandler:
    def __init__(self):
        self.handlers = {
            DataClassification.PUBLIC: self.handle_public,
            DataClassification.INTERNAL: self.handle_internal,
            DataClassification.CONFIDENTIAL: self.handle_confidential,
            DataClassification.RESTRICTED: self.handle_restricted
        }
    
    def process_data(self, data: Dict[str, Any], classification: DataClassification):
        """Process data according to classification."""
        handler = self.handlers[classification]
        return handler(data)
    
    def handle_restricted(self, data: Dict[str, Any]):
        """Handle restricted data with maximum security."""
        # Encrypt at rest
        encrypted_data = self.encrypt(data)
        
        # Log access
        self.audit_log.record_access("RESTRICTED", get_user_context())
        
        # Apply data loss prevention
        self.dlp.scan(data)
        
        # Store in secure vault
        return self.secure_storage.store(encrypted_data)
```

### Data Retention
```python
# Automated data retention and purging
class DataRetentionPolicy:
    def __init__(self):
        self.policies = {
            "audit_logs": 7 * 365,  # 7 years
            "transaction_data": 10 * 365,  # 10 years
            "user_activity": 90,  # 90 days
            "temp_data": 1,  # 1 day
        }
    
    async def apply_retention_policies(self):
        """Apply data retention policies."""
        for data_type, retention_days in self.policies.items():
            cutoff_date = datetime.utcnow() - timedelta(days=retention_days)
            
            # Archive data before deletion
            await self.archive_data(data_type, cutoff_date)
            
            # Delete expired data
            await self.delete_expired_data(data_type, cutoff_date)
            
            # Log retention action
            await self.audit_logger.log_retention_action(data_type, cutoff_date)
```

## Integration Patterns

### Enterprise Service Bus (ESB)
```python
# Message-based integration
from abc import ABC, abstractmethod
import asyncio

class MessageBus:
    def __init__(self):
        self.handlers = {}
        self.middleware = []
    
    def register_handler(self, message_type: type, handler: callable):
        """Register message handler."""
        self.handlers[message_type.__name__] = handler
    
    async def publish(self, message: Any):
        """Publish message to bus."""
        message_type = type(message).__name__
        
        # Apply middleware
        for mw in self.middleware:
            message = await mw.process(message)
        
        # Route to handler
        if message_type in self.handlers:
            handler = self.handlers[message_type]
            await handler(message)
        
        # Persist for audit
        await self.persist_message(message)
```

### API Gateway Pattern
```python
# Enterprise API Gateway
class APIGateway:
    def __init__(self):
        self.rate_limiter = RateLimiter()
        self.cache = Cache()
        self.circuit_breaker = CircuitBreaker()
        self.auth_service = AuthService()
    
    async def handle_request(self, request: Request) -> Response:
        """Handle incoming API request."""
        # Authentication
        if not await self.auth_service.authenticate(request):
            return Response(status=401)
        
        # Rate limiting
        if not await self.rate_limiter.allow(request):
            return Response(status=429)
        
        # Check cache
        cached_response = await self.cache.get(request)
        if cached_response:
            return cached_response
        
        # Route to backend service
        try:
            response = await self.circuit_breaker.call(
                self.route_to_service, request
            )
            
            # Cache successful responses
            await self.cache.set(request, response)
            
            return response
        except ServiceUnavailable:
            return Response(status=503)
```

## Performance & Scalability

### Caching Strategy
```python
# Multi-tier caching
class CacheManager:
    def __init__(self):
        self.l1_cache = InMemoryCache(max_size=1000)  # In-process
        self.l2_cache = RedisCache()  # Distributed
        self.l3_cache = CDNCache()  # Edge
    
    async def get(self, key: str) -> Optional[Any]:
        """Get from cache with fallback."""
        # Try L1
        value = self.l1_cache.get(key)
        if value:
            return value
        
        # Try L2
        value = await self.l2_cache.get(key)
        if value:
            self.l1_cache.set(key, value)
            return value
        
        # Try L3
        value = await self.l3_cache.get(key)
        if value:
            await self.l2_cache.set(key, value)
            self.l1_cache.set(key, value)
            return value
        
        return None
```

### Database Optimization
```python
# Read/write splitting
class DatabaseManager:
    def __init__(self):
        self.write_db = WriteDatabase()
        self.read_replicas = [
            ReadReplica("replica1"),
            ReadReplica("replica2"),
            ReadReplica("replica3")
        ]
        self.current_replica = 0
    
    async def execute_read(self, query: str) -> Any:
        """Execute read query on replica."""
        replica = self.get_next_replica()
        return await replica.execute(query)
    
    async def execute_write(self, query: str) -> Any:
        """Execute write query on primary."""
        result = await self.write_db.execute(query)
        
        # Invalidate related cache
        await self.cache_manager.invalidate_pattern(query)
        
        return result
    
    def get_next_replica(self) -> ReadReplica:
        """Round-robin replica selection."""
        replica = self.read_replicas[self.current_replica]
        self.current_replica = (self.current_replica + 1) % len(self.read_replicas)
        return replica
```

## Disaster Recovery

### Backup Strategy
```python
# Automated backup system
class BackupManager:
    def __init__(self):
        self.backup_schedule = {
            "database": "0 2 * * *",  # Daily at 2 AM
            "files": "0 3 * * 0",  # Weekly on Sunday
            "config": "0 4 1 * *",  # Monthly
        }
    
    async def perform_backup(self, backup_type: str):
        """Perform backup with verification."""
        # Create backup
        backup_id = await self.create_backup(backup_type)
        
        # Verify backup integrity
        if not await self.verify_backup(backup_id):
            raise BackupException("Backup verification failed")
        
        # Replicate to secondary location
        await self.replicate_backup(backup_id)
        
        # Test restore capability
        await self.test_restore(backup_id)
        
        # Update recovery point objective (RPO)
        await self.update_rpo_metrics(backup_type)
```

## Monitoring & Alerting

### Business Metrics
```python
# Business KPI monitoring
class BusinessMetrics:
    def __init__(self):
        self.metrics = {
            "revenue": Gauge("business_revenue_total"),
            "orders": Counter("business_orders_total"),
            "users": Gauge("business_active_users"),
            "sla": Histogram("business_sla_compliance"),
        }
    
    async def track_order(self, order: Order):
        """Track order metrics."""
        self.metrics["orders"].inc()
        self.metrics["revenue"].inc(float(order.total_amount))
        
        # Track SLA compliance
        processing_time = (datetime.utcnow() - order.created_at).total_seconds()
        self.metrics["sla"].observe(processing_time)
        
        # Alert if SLA breached
        if processing_time > SLA_THRESHOLD:
            await self.alert_manager.send_alert(
                "SLA_BREACH",
                f"Order {order.order_id} exceeded SLA"
            )
```

## Custom Claude Code Configuration

### Agents for Enterprise
- `compliance-auditor`: Automated compliance checks
- `security-scanner`: Continuous security assessment
- `performance-profiler`: System performance analysis
- `optimization-engineer`: Performance tuning implementation
- `integration-specialist`: Enterprise system integration
- `data-governor`: Data governance and quality

### Enterprise Hooks
```json
{
  "hooks": {
    "pre-commit": {
      "actions": [
        "security-scan",
        "compliance-check",
        "code-review",
        "dependency-check"
      ]
    },
    "pre-deployment": {
      "actions": [
        "change-approval",
        "risk-assessment",
        "backup-verification",
        "rollback-plan"
      ]
    },
    "post-incident": {
      "actions": [
        "root-cause-analysis",
        "incident-report",
        "compliance-notification",
        "lessons-learned"
      ]
    }
  }
}
```

### Recommended MCP Servers
```bash
# Enterprise identity provider
claude mcp add okta --client-id ${OKTA_CLIENT_ID}

# Enterprise database
claude mcp add oracle --connection ${ORACLE_CONNECTION}

# Enterprise service bus
claude mcp add mulesoft --api-key ${MULE_API_KEY}

# SIEM integration
claude mcp add splunk --url ${SPLUNK_URL}
```

## Regulatory Compliance

### GDPR Compliance
```python
# Data subject rights implementation
class GDPRCompliance:
    async def handle_data_request(self, request_type: str, user_id: str):
        """Handle GDPR data subject requests."""
        if request_type == "ACCESS":
            return await self.export_user_data(user_id)
        elif request_type == "DELETION":
            return await self.delete_user_data(user_id)
        elif request_type == "PORTABILITY":
            return await self.export_portable_data(user_id)
        elif request_type == "RECTIFICATION":
            return await self.correct_user_data(user_id)
```

### SOX Compliance
- Segregation of duties enforced
- Change management controls
- Access reviews quarterly
- Financial data integrity checks

### HIPAA Compliance
- PHI encryption at rest and in transit
- Access controls with MFA
- Audit logs for all PHI access
- Business Associate Agreements (BAAs)

## Environment Variables

```bash
# Application configuration
APP_ENV=production
APP_VERSION=2.1.0
APP_INSTANCE_ID=prod-001

# Security
ENCRYPTION_KEY_ID=## add arn here
VAULT_URL=https://vault.enterprise.com
VAULT_TOKEN=${VAULT_TOKEN}
HSM_SLOT_ID=1

# Authentication
OKTA_DOMAIN=enterprise.okta.com
OKTA_CLIENT_ID=xxx
OKTA_CLIENT_SECRET=${OKTA_SECRET}
MFA_REQUIRED=true

# Database
PRIMARY_DB_URL=oracle://primary.db.enterprise.com:1521/PROD
READ_REPLICA_URLS=oracle://replica1:1521/PROD,oracle://replica2:1521/PROD
CONNECTION_POOL_SIZE=100

# Message Queue
MQ_BROKER_URL=amqps://mq.enterprise.com:5671
MQ_CERT_PATH=/certs/client.pem

# Monitoring
APM_AGENT_URL=https://apm.enterprise.com
SIEM_ENDPOINT=https://siem.enterprise.com/api
METRICS_NAMESPACE=enterprise-app

# Compliance
AUDIT_LOG_RETENTION_DAYS=2555
COMPLIANCE_MODE=strict
DATA_RESIDENCY_REGION=us-east-1
```

## Notes for Claude Code

When working with this enterprise application:
- Always consider compliance requirements first
- Security is non-negotiable - never bypass security controls
- All changes must be traceable and auditable
- Performance must meet SLA requirements
- High availability is critical - plan for failures
- Data sovereignty and residency requirements must be met
- Integration with enterprise systems requires proper authentication
- Follow enterprise architecture standards and patterns
- Document all architectural decisions (ADRs)
- Coordinate with enterprise architecture team for major changes