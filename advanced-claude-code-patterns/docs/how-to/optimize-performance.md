# How to Optimize Claude Code Performance

Practical techniques for improving agent response times, reducing costs, and scaling effectively.

## Prerequisites

- Claude Code environment configured
- Basic understanding of caching concepts
- Access to performance monitoring tools

## Implement Agent Response Caching

### Set Up Function-Level Caching

Cache expensive agent operations using Python decorators:

```python
from functools import lru_cache
import hashlib
import json

@lru_cache(maxsize=100)
def cached_agent_call(agent_name: str, input_hash: str):
    """Cache agent responses for identical inputs."""
    return run_agent(agent_name, input_hash)

def get_agent_response(agent_name: str, input_data: str):
    # Create consistent hash of input
    input_hash = hashlib.md5(
        json.dumps(input_data, sort_keys=True).encode()
    ).hexdigest()
    
    return cached_agent_call(agent_name, input_hash)
```

### Configure Redis Caching

For distributed caching across multiple processes:

```python
import redis
import json
from typing import Optional

class AgentCache:
    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.redis = redis.from_url(redis_url)
        self.ttl = 3600  # 1 hour default
    
    def get(self, key: str) -> Optional[dict]:
        """Get cached result."""
        result = self.redis.get(key)
        if result:
            return json.loads(result)
        return None
    
    def set(self, key: str, value: dict, ttl: int = None):
        """Cache result with TTL."""
        self.redis.setex(
            key, 
            ttl or self.ttl, 
            json.dumps(value)
        )
    
    def cache_key(self, agent: str, input_data: str) -> str:
        """Generate consistent cache key."""
        data_hash = hashlib.md5(input_data.encode()).hexdigest()
        return f"agent:{agent}:{data_hash}"

# Usage
cache = AgentCache()
key = cache.cache_key("code-reviewer", source_code)

# Check cache first
result = cache.get(key)
if not result:
    result = run_agent("code-reviewer", source_code)
    cache.set(key, result)
```

### File-Based Caching

For simpler setups without Redis:

```python
import os
import json
import time
from pathlib import Path

class FileCache:
    def __init__(self, cache_dir: str = ".cache"):
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(exist_ok=True)
    
    def _cache_file(self, key: str) -> Path:
        return self.cache_dir / f"{key}.json"
    
    def get(self, key: str, max_age: int = 3600) -> Optional[dict]:
        """Get cached result if not expired."""
        cache_file = self._cache_file(key)
        
        if not cache_file.exists():
            return None
        
        # Check if expired
        if time.time() - cache_file.stat().st_mtime > max_age:
            cache_file.unlink()
            return None
        
        with open(cache_file) as f:
            return json.load(f)
    
    def set(self, key: str, value: dict):
        """Cache result to file."""
        with open(self._cache_file(key), 'w') as f:
            json.dump(value, f)
```

## Optimize Parallel Processing

### Parallel Agent Execution

Process multiple files simultaneously:

```yaml
# Workflow configuration
stages:
  - name: parallel_analysis
    parallel:
      max_workers: 10
      chunk_size: 100
    tasks:
      - name: analyze_files
        for_each: ${files}
        agent: analyzer
        input: ${item}
        timeout: 30
```

### Python Parallel Implementation

```python
import asyncio
import concurrent.futures
from typing import List, Dict

async def analyze_files_parallel(files: List[str], max_workers: int = 5) -> Dict[str, dict]:
    """Analyze multiple files in parallel."""
    
    async def analyze_single_file(file_path: str) -> tuple[str, dict]:
        # Use thread pool for CPU-bound agent calls
        loop = asyncio.get_event_loop()
        with concurrent.futures.ThreadPoolExecutor() as executor:
            result = await loop.run_in_executor(
                executor, 
                run_agent, 
                "code-analyzer", 
                file_path
            )
        return file_path, result
    
    # Create semaphore to limit concurrent operations
    semaphore = asyncio.Semaphore(max_workers)
    
    async def analyze_with_limit(file_path: str):
        async with semaphore:
            return await analyze_single_file(file_path)
    
    # Execute all analyses in parallel
    tasks = [analyze_with_limit(f) for f in files]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    # Convert to dictionary, filtering out exceptions
    return {
        file_path: result 
        for file_path, result in results 
        if not isinstance(result, Exception)
    }

# Usage
files = ["src/file1.py", "src/file2.py", "src/file3.py"]
results = asyncio.run(analyze_files_parallel(files))
```

### Batch Processing

Process similar items together to reduce overhead:

```python
def batch_process_items(items: List[str], batch_size: int = 10) -> List[dict]:
    """Process items in batches for better performance."""
    results = []
    
    for i in range(0, len(items), batch_size):
        batch = items[i:i + batch_size]
        
        # Single agent call for entire batch
        batch_input = "\n".join(f"File {j}: {item}" for j, item in enumerate(batch))
        batch_result = run_agent("batch-analyzer", batch_input)
        
        # Parse batch result back to individual results
        individual_results = parse_batch_result(batch_result, len(batch))
        results.extend(individual_results)
    
    return results
```

## Configure Resource Limits

### Set Memory and CPU Limits

Prevent resource exhaustion:

```yaml
# Resource configuration
resources:
  limits:
    memory: 2Gi
    cpu: 2
    time: 300  # 5 minutes max
  
  monitoring:
    alert_on:
      memory_usage: "> 80%"
      cpu_usage: "> 90%"
      execution_time: "> 240s"
```

### Python Resource Management

```python
import resource
import signal
import psutil
from contextlib import contextmanager

@contextmanager
def resource_limits(memory_mb: int, cpu_percent: int, timeout_sec: int):
    """Context manager to enforce resource limits."""
    
    # Set memory limit
    memory_bytes = memory_mb * 1024 * 1024
    resource.setrlimit(resource.RLIMIT_AS, (memory_bytes, memory_bytes))
    
    # Set timeout
    def timeout_handler(signum, frame):
        raise TimeoutError(f"Operation timed out after {timeout_sec} seconds")
    
    signal.signal(signal.SIGALRM, timeout_handler)
    signal.alarm(timeout_sec)
    
    # Monitor CPU usage
    process = psutil.Process()
    initial_cpu = process.cpu_percent()
    
    try:
        yield
    finally:
        signal.alarm(0)  # Cancel timeout
        
        # Check final CPU usage
        final_cpu = process.cpu_percent()
        if final_cpu > cpu_percent:
            print(f"Warning: High CPU usage detected: {final_cpu}%")

# Usage
try:
    with resource_limits(memory_mb=512, cpu_percent=80, timeout_sec=60):
        result = run_expensive_agent_operation()
except (MemoryError, TimeoutError) as e:
    print(f"Resource limit exceeded: {e}")
```

## Optimize Model Selection

### Smart Model Selection

Choose the most cost-effective model for each task:

```python
def select_optimal_model(task_complexity: float, input_size: int) -> str:
    """Select most cost-effective model for task."""
    
    # Simple heuristics based on task characteristics
    if input_size > 10000:  # Large inputs need more capable models
        return "opus"
    elif task_complexity < 0.3:  # Simple tasks
        return "sonnet"
    elif task_complexity < 0.7:  # Moderate tasks
        return "sonnet" 
    else:  # Complex tasks
        return "opus"

def estimate_task_complexity(task_description: str) -> float:
    """Estimate task complexity from 0.0 to 1.0."""
    complexity_keywords = {
        'simple': 0.2, 'basic': 0.2, 'format': 0.2,
        'analyze': 0.5, 'review': 0.5, 'optimize': 0.6,
        'architect': 0.8, 'design': 0.8, 'complex': 0.9
    }
    
    words = task_description.lower().split()
    scores = [complexity_keywords.get(word, 0.3) for word in words]
    return min(sum(scores) / len(scores) if scores else 0.3, 1.0)

# Usage
task = "Analyze code for security vulnerabilities"
complexity = estimate_task_complexity(task)
model = select_optimal_model(complexity, len(source_code))
```

### Dynamic Model Switching

Switch models based on context:

```python
class AdaptiveAgent:
    def __init__(self):
        self.models = {
            'fast': 'sonnet',
            'accurate': 'opus',
            'balanced': 'sonnet'
        }
        self.performance_history = {}
    
    def select_model(self, task_type: str, urgency: str) -> str:
        """Select model based on requirements."""
        
        if urgency == 'high':
            return self.models['fast']
        
        # Check performance history
        if task_type in self.performance_history:
            avg_accuracy = self.performance_history[task_type]['accuracy']
            if avg_accuracy < 0.8:  # Poor performance, use better model
                return self.models['accurate']
        
        return self.models['balanced']
    
    def record_performance(self, task_type: str, accuracy: float, duration: float):
        """Record performance for future model selection."""
        if task_type not in self.performance_history:
            self.performance_history[task_type] = {
                'accuracy': [], 'duration': []
            }
        
        history = self.performance_history[task_type]
        history['accuracy'].append(accuracy)
        history['duration'].append(duration)
        
        # Keep only recent history
        if len(history['accuracy']) > 10:
            history['accuracy'] = history['accuracy'][-10:]
            history['duration'] = history['duration'][-10:]
```

## Monitor and Profile Performance

### Performance Metrics Collection

Track key performance indicators:

```python
import time
from dataclasses import dataclass
from typing import Dict, List

@dataclass
class PerformanceMetrics:
    agent_name: str
    execution_time: float
    tokens_used: int
    cache_hit: bool
    model_used: str
    success: bool

class PerformanceMonitor:
    def __init__(self):
        self.metrics: List[PerformanceMetrics] = []
    
    def record(self, metrics: PerformanceMetrics):
        """Record performance metrics."""
        self.metrics.append(metrics)
    
    def get_agent_stats(self, agent_name: str) -> Dict:
        """Get performance stats for specific agent."""
        agent_metrics = [m for m in self.metrics if m.agent_name == agent_name]
        
        if not agent_metrics:
            return {}
        
        return {
            'avg_execution_time': sum(m.execution_time for m in agent_metrics) / len(agent_metrics),
            'total_tokens': sum(m.tokens_used for m in agent_metrics),
            'cache_hit_rate': sum(1 for m in agent_metrics if m.cache_hit) / len(agent_metrics),
            'success_rate': sum(1 for m in agent_metrics if m.success) / len(agent_metrics),
            'total_executions': len(agent_metrics)
        }

# Usage with context manager
monitor = PerformanceMonitor()

@contextmanager
def track_performance(agent_name: str, model: str):
    start_time = time.time()
    tokens_used = 0
    cache_hit = False
    success = False
    
    try:
        yield locals()  # Allow modification of tracking variables
        success = True
    finally:
        metrics = PerformanceMetrics(
            agent_name=agent_name,
            execution_time=time.time() - start_time,
            tokens_used=tokens_used,
            cache_hit=cache_hit,
            model_used=model,
            success=success
        )
        monitor.record(metrics)

# Usage
with track_performance("code-reviewer", "sonnet") as tracker:
    result = run_agent("code-reviewer", code)
    tracker['tokens_used'] = result.get('tokens', 0)
    tracker['cache_hit'] = result.get('from_cache', False)
```

### Performance Dashboard

Create a simple performance dashboard:

```python
def generate_performance_report(monitor: PerformanceMonitor) -> str:
    """Generate human-readable performance report."""
    
    agents = set(m.agent_name for m in monitor.metrics)
    report = ["Performance Report", "=" * 50, ""]
    
    for agent in agents:
        stats = monitor.get_agent_stats(agent)
        report.extend([
            f"Agent: {agent}",
            f"  Avg Execution Time: {stats['avg_execution_time']:.2f}s",
            f"  Total Tokens: {stats['total_tokens']:,}",
            f"  Cache Hit Rate: {stats['cache_hit_rate']:.1%}",
            f"  Success Rate: {stats['success_rate']:.1%}",
            f"  Total Executions: {stats['total_executions']}",
            ""
        ])
    
    return "\n".join(report)
```

## Troubleshooting Performance Issues

### Common Performance Problems

1. **Slow agent responses**
   - Check if caching is enabled
   - Verify model selection is appropriate
   - Profile input size and complexity

2. **High token usage**
   - Review prompt length and complexity
   - Consider using simpler models for basic tasks
   - Implement aggressive caching

3. **Memory issues**
   - Set resource limits
   - Process files in smaller batches
   - Clear caches periodically

4. **CPU bottlenecks**
   - Increase parallel processing workers
   - Optimize agent logic
   - Consider distributed processing

### Performance Debugging

```bash
# Enable performance profiling
export CLAUDE_PERFORMANCE_DEBUG=true

# Profile specific operations
claude profile agent run code-reviewer --input large_file.py

# Monitor resource usage
htop
iostat -x 1
```

## Performance Best Practices Summary

- Cache expensive agent operations with appropriate TTL
- Use parallel processing for independent tasks
- Set resource limits to prevent system overload
- Choose models based on task complexity and urgency
- Monitor performance metrics continuously
- Profile and optimize bottlenecks
- Batch similar operations together
- Use asynchronous processing when possible
- Implement smart caching strategies
- Regular performance reviews and optimizations