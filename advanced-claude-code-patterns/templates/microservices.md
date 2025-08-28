# CLAUDE.md - Microservices Architecture

This CLAUDE.md template is optimized for microservices architectures, distributed systems, and service mesh deployments.

## Project Overview

This is a microservices-based distributed system. Claude Code will assist with service development, inter-service communication, distributed tracing, and orchestration.

## Project Structure

```
.
├── services/                  # Microservices
│   ├── auth-service/          # Authentication service
│   │   ├── src/
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   └── api.yaml
│   ├── user-service/          # User management
│   ├── order-service/         # Order processing
│   ├── payment-service/       # Payment handling
│   ├── notification-service/  # Notifications
│   └── gateway/               # API Gateway
├── shared/                    # Shared libraries
│   ├── proto/                 # Protocol buffers
│   ├── contracts/             # API contracts
│   └── utils/                 # Common utilities
├── infrastructure/            # Infrastructure config
│   ├── kubernetes/            # K8s manifests
│   ├── istio/                 # Service mesh
│   ├── terraform/             # Cloud resources
│   └── docker-compose/        # Local development
├── monitoring/                # Observability
│   ├── prometheus/
│   ├── grafana/
│   ├── jaeger/                # Distributed tracing
│   └── elk/                   # Logging stack
└── tests/                     # Integration tests
    ├── e2e/
    ├── contract/
    └── performance/
```

## Commands and Workflows

### Local Development
```bash
# Start all services locally
docker-compose up -d

# Start specific service
docker-compose up auth-service user-service

# View logs
docker-compose logs -f service-name

# Run with hot reload
docker-compose -f docker-compose.dev.yml up

# Clean up
docker-compose down -v
```

### Service Development
```bash
# Generate service from template
./scripts/create-service.sh payment-service

# Build service
cd services/auth-service
make build

# Run tests
make test
make integration-test

# Generate API client
openapi-generator generate -i api.yaml -g python -o client/

# Protocol buffers
protoc --go_out=. --go-grpc_out=. proto/user.proto
```

### Kubernetes Deployment
```bash
# Deploy to Kubernetes
kubectl apply -k infrastructure/kubernetes/overlays/dev

# Check service mesh
istioctl analyze
istioctl proxy-status

# Service discovery
kubectl get svc
kubectl get endpoints

# Distributed tracing
kubectl port-forward svc/jaeger 16686:16686
```

## Architecture Patterns

### Service Communication
```yaml
# API Gateway configuration
apiVersion: networking.istio.io/v1beta1
kind: Gateway
metadata:
  name: api-gateway
spec:
  selector:
    istio: ingressgateway
  servers:
  - port:
      number: 80
      name: http
      protocol: HTTP
    hosts:
    - "*"

---
# Virtual Service for routing
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: api-routes
spec:
  hosts:
  - "*"
  gateways:
  - api-gateway
  http:
  - match:
    - uri:
        prefix: "/api/users"
    route:
    - destination:
        host: user-service
        port:
          number: 8080
  - match:
    - uri:
        prefix: "/api/orders"
    route:
    - destination:
        host: order-service
        port:
          number: 8080
```

### Service Template
```python
# services/template/src/main.py
from fastapi import FastAPI, HTTPException
from opentelemetry import trace
from prometheus_client import Counter, Histogram
import httpx

app = FastAPI(title="Service Name", version="1.0.0")

# Metrics
request_count = Counter('requests_total', 'Total requests')
request_duration = Histogram('request_duration_seconds', 'Request duration')

# Tracing
tracer = trace.get_tracer(__name__)

# Health checks
@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.get("/ready")
async def ready():
    # Check dependencies
    return {"status": "ready"}

# Service endpoints
@app.post("/api/resource")
async def create_resource(data: dict):
    with tracer.start_as_current_span("create_resource"):
        # Business logic
        pass
```

### Inter-Service Communication
```python
# Resilient service calls with circuit breaker
from circuitbreaker import circuit
import httpx

class ServiceClient:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.client = httpx.AsyncClient(timeout=5.0)
    
    @circuit(failure_threshold=5, recovery_timeout=30)
    async def call_service(self, endpoint: str, data: dict):
        """Call another service with circuit breaker."""
        try:
            response = await self.client.post(
                f"{self.base_url}{endpoint}",
                json=data,
                headers=self._get_trace_headers()
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            # Log and handle error
            raise
    
    def _get_trace_headers(self):
        """Propagate trace context."""
        # Extract trace headers for distributed tracing
        return {}
```

## Data Management

### Database per Service
```yaml
# Each service has its own database
services:
  user-service:
    environment:
      DATABASE_URL: postgresql://user_db:5432/users
  
  order-service:
    environment:
      DATABASE_URL: postgresql://order_db:5432/orders
  
  payment-service:
    environment:
      DATABASE_URL: postgresql://payment_db:5432/payments
```

### Event Sourcing
```python
# Event store implementation
class Event:
    def __init__(self, aggregate_id: str, event_type: str, data: dict):
        self.aggregate_id = aggregate_id
        self.event_type = event_type
        self.data = data
        self.timestamp = datetime.utcnow()

class EventStore:
    async def append(self, event: Event):
        """Append event to store."""
        pass
    
    async def get_events(self, aggregate_id: str):
        """Get all events for aggregate."""
        pass
```

### Saga Pattern
```python
# Distributed transaction coordination
class OrderSaga:
    def __init__(self):
        self.steps = [
            self.reserve_inventory,
            self.process_payment,
            self.ship_order
        ]
        self.compensations = [
            self.release_inventory,
            self.refund_payment,
            self.cancel_shipment
        ]
    
    async def execute(self, order_data: dict):
        completed_steps = []
        try:
            for step in self.steps:
                await step(order_data)
                completed_steps.append(step)
        except Exception as e:
            # Compensate in reverse order
            for compensation in reversed(self.compensations[:len(completed_steps)]):
                await compensation(order_data)
            raise
```

## Service Mesh Configuration

### Traffic Management
```yaml
# Canary deployment with Istio
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: user-service
spec:
  hosts:
  - user-service
  http:
  - match:
    - headers:
        canary:
          exact: "true"
    route:
    - destination:
        host: user-service
        subset: v2
      weight: 100
  - route:
    - destination:
        host: user-service
        subset: v1
      weight: 90
    - destination:
        host: user-service
        subset: v2
      weight: 10
```

### Security Policies
```yaml
# mTLS between services
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
spec:
  mtls:
    mode: STRICT

---
# Authorization policy
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: user-service-authz
spec:
  selector:
    matchLabels:
      app: user-service
  rules:
  - from:
    - source:
        principals: ["cluster.local/ns/default/sa/order-service"]
    to:
    - operation:
        methods: ["GET", "POST"]
```

## Observability

### Distributed Tracing
```python
# OpenTelemetry integration
from opentelemetry import trace
from opentelemetry.exporter.jaeger import JaegerExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

# Setup tracing
trace.set_tracer_provider(TracerProvider())
tracer = trace.get_tracer(__name__)

jaeger_exporter = JaegerExporter(
    agent_host_name="jaeger",
    agent_port=6831,
)

span_processor = BatchSpanProcessor(jaeger_exporter)
trace.get_tracer_provider().add_span_processor(span_processor)

# Use in code
@app.post("/api/order")
async def create_order(order_data: dict):
    with tracer.start_as_current_span("create_order") as span:
        span.set_attribute("order.id", order_data["id"])
        # Process order
```

### Metrics Collection
```python
# Prometheus metrics
from prometheus_client import Counter, Histogram, Gauge

# Define metrics
request_count = Counter(
    'service_requests_total',
    'Total requests',
    ['method', 'endpoint', 'status']
)

request_latency = Histogram(
    'service_request_duration_seconds',
    'Request latency',
    ['method', 'endpoint']
)

active_connections = Gauge(
    'service_active_connections',
    'Active connections'
)

# Use in middleware
@app.middleware("http")
async def metrics_middleware(request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    
    request_count.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()
    
    request_latency.labels(
        method=request.method,
        endpoint=request.url.path
    ).observe(duration)
    
    return response
```

### Centralized Logging
```python
# Structured logging
import structlog

logger = structlog.get_logger()

logger.info(
    "order_created",
    order_id=order.id,
    user_id=user.id,
    amount=order.amount,
    trace_id=get_trace_id()
)
```

## Testing Strategies

### Contract Testing
```python
# Pact consumer test
from pact import Consumer, Provider

pact = Consumer('OrderService').has_pact_with(
    Provider('UserService'),
    host_name='localhost',
    port=1234
)

def test_get_user():
    expected = {
        'id': '123',
        'name': 'John Doe',
        'email': 'john@example.com'
    }
    
    (pact
     .given('User 123 exists')
     .upon_receiving('a request for user 123')
     .with_request('GET', '/users/123')
     .will_respond_with(200, body=expected))
    
    with pact:
        user = get_user('123')
        assert user == expected
```

### Chaos Engineering
```yaml
# Litmus chaos experiments
apiVersion: litmuschaos.io/v1alpha1
kind: ChaosEngine
metadata:
  name: service-chaos
spec:
  appinfo:
    appns: default
    applabel: "app=user-service"
  chaosServiceAccount: litmus-admin
  experiments:
  - name: pod-network-latency
    spec:
      components:
        env:
        - name: NETWORK_LATENCY
          value: '2000'  # 2 seconds
        - name: DURATION
          value: '60'
```

## Custom Claude Code Configuration

### Agents for This Project
- `service-architect`: Design service boundaries and APIs
- `integration-debugger`: Debug service communication issues
- `performance-analyzer`: Analyze distributed system performance
- `chaos-engineer`: Design and run chaos experiments

### Hooks for Microservices
```json
{
  "hooks": {
    "pre-deploy": {
      "actions": ["contract-test", "integration-test", "load-test"]
    },
    "post-deploy": {
      "actions": ["smoke-test", "synthetic-monitoring", "update-service-registry"]
    },
    "on-incident": {
      "actions": ["collect-traces", "aggregate-logs", "create-timeline"]
    }
  }
}
```

### Recommended MCP Servers
```bash
# Kubernetes for orchestration
claude mcp add kubernetes --kubeconfig ~/.kube/config

# Message broker
claude mcp add kafka --bootstrap-servers localhost:9092

# Service mesh
claude mcp add istio --control-plane istio-system

# Distributed cache
claude mcp add redis --url redis://localhost:6379
```

## Deployment Patterns

### Blue-Green Deployment
```bash
#!/bin/bash
# Deploy new version to green environment
kubectl apply -f services/user-service/k8s/green/

# Run tests against green
./tests/smoke-test.sh green

# Switch traffic to green
kubectl patch virtualservice user-service \
  --type merge \
  -p '{"spec":{"http":[{"route":[{"destination":{"host":"user-service","subset":"green"}}]}]}}'

# Clean up blue
kubectl delete -f services/user-service/k8s/blue/
```

### Feature Flags
```python
# Feature flag service integration
from feature_flags import FeatureFlags

flags = FeatureFlags()

@app.post("/api/order")
async def create_order(order_data: dict):
    if flags.is_enabled("new_payment_flow", user_id=order_data["user_id"]):
        return await new_payment_flow(order_data)
    else:
        return await legacy_payment_flow(order_data)
```

## Security Best Practices

### Service Authentication
```python
# JWT validation middleware
from fastapi import Security, HTTPException
from fastapi.security import HTTPBearer
import jwt

security = HTTPBearer()

async def verify_token(credentials = Security(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, PUBLIC_KEY, algorithms=["RS256"])
        return payload
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.get("/api/protected")
async def protected_endpoint(token_data = Depends(verify_token)):
    return {"user": token_data["sub"]}
```

### API Rate Limiting
```python
# Rate limiting with Redis
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["100/minute"]
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.post("/api/resource")
@limiter.limit("10/minute")
async def create_resource(request: Request, data: dict):
    # Process request
    pass
```

## Performance Optimization

### Caching Strategy
```python
# Multi-level caching
import redis
from functools import lru_cache

redis_client = redis.Redis(host='localhost', port=6379)

# In-memory cache
@lru_cache(maxsize=128)
def get_user_memory(user_id: str):
    return fetch_user_from_db(user_id)

# Redis cache
async def get_user_redis(user_id: str):
    key = f"user:{user_id}"
    cached = redis_client.get(key)
    if cached:
        return json.loads(cached)
    
    user = await fetch_user_from_db(user_id)
    redis_client.setex(key, 3600, json.dumps(user))
    return user
```

### Connection Pooling
```python
# Database connection pool
from databases import Database

database = Database(
    DATABASE_URL,
    min_size=10,
    max_size=20,
    command_timeout=60
)

@app.on_event("startup")
async def startup():
    await database.connect()

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()
```

## Environment Variables

```bash
# Service configuration
SERVICE_NAME=user-service
SERVICE_PORT=8080
SERVICE_VERSION=v1.2.3

# Service discovery
CONSUL_HOST=consul.service.consul
EUREKA_URL=http://eureka:8761/eureka

# Message broker
KAFKA_BROKERS=kafka1:9092,kafka2:9092
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672

# Databases
DATABASE_URL=postgresql://user:pass@postgres:5432/db
REDIS_URL=redis://redis:6379/0
MONGODB_URL=mongodb://mongo:27017/db

# Observability
JAEGER_AGENT_HOST=jaeger
PROMETHEUS_MULTIPROC_DIR=/tmp
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317

# Security
JWT_PUBLIC_KEY_PATH=/secrets/jwt-public.pem
API_KEY_HEADER=X-API-Key
CORS_ORIGINS=https://example.com

# Feature flags
LAUNCHDARKLY_SDK_KEY=xxx
FEATURE_FLAG_SERVICE_URL=http://flagsmith:8000
```

## Common Tasks

### Adding New Service
1. Generate service scaffold: `./scripts/create-service.sh`
2. Define API contract in OpenAPI/Proto
3. Implement business logic
4. Add database migrations if needed
5. Write unit and integration tests
6. Create Dockerfile and K8s manifests
7. Add to service mesh configuration
8. Set up monitoring and alerts
9. Document in service catalog

### Debugging Service Issues
1. Check service health: `/health` endpoint
2. View distributed trace in Jaeger
3. Check logs in ELK stack
4. Review metrics in Grafana
5. Test service isolation
6. Verify network policies
7. Check circuit breaker status

## Resources

- [Microservices Patterns](https://microservices.io/patterns/)
- [Building Microservices](https://www.oreilly.com/library/view/building-microservices-2nd/9781492034018/)
- [Domain-Driven Design](https://domainlanguage.com/ddd/)
- [The Tao of Microservices](https://www.manning.com/books/the-tao-of-microservices)
- [Istio in Action](https://www.manning.com/books/istio-in-action)

## Notes for Claude Code

When working with this microservices architecture:
- Respect service boundaries - don't share databases
- Use async communication where possible
- Implement proper error handling and retries
- Always include correlation IDs for tracing
- Version APIs properly
- Test service contracts
- Monitor service dependencies
- Plan for service failures
- Keep services small and focused
- Document service interfaces clearly