# How to Optimize Claude Code Costs

Practical strategies for reducing token usage and managing expenses in Claude Code implementations.

## Prerequisites

- Understanding of Claude pricing models
- Access to usage analytics
- Knowledge of your current spending patterns

## Optimize Model Selection

### Implement Smart Model Selection

Choose the most cost-effective model for each task:

```python
def select_optimal_model(task_complexity: float, input_size: int, urgency: str) -> str:
    """Select most cost-effective model based on task characteristics."""
    
    # Sonnet: $3 per million tokens (input/output)
    # Opus: $15 per million tokens (input), $75 per million tokens (output)
    
    # For very large inputs, cost difference is significant
    if input_size > 50000:  # 50k+ tokens
        if task_complexity < 0.5:
            return "sonnet"  # Much cheaper for simple tasks
        elif urgency == "low":
            return "sonnet"  # Save money when not urgent
    
    # For complex tasks, accuracy vs cost trade-off
    if task_complexity < 0.3:
        return "sonnet"  # Simple tasks - always use cheaper model
    elif task_complexity < 0.7:
        if urgency in ["low", "medium"]:
            return "sonnet"  # Try cheaper model first
        else:
            return "opus"   # Use opus for urgent complex tasks
    else:
        return "opus"  # Complex tasks need opus
```

### Task Complexity Estimation

Create heuristics to estimate task complexity:

```python
def estimate_task_complexity(task_description: str, context: dict) -> float:
    """Estimate task complexity from 0.0 to 1.0."""
    
    complexity_indicators = {
        # Simple tasks (0.1-0.3)
        'format': 0.2, 'lint': 0.2, 'basic': 0.2, 'simple': 0.2,
        'fix typo': 0.1, 'add comment': 0.1,
        
        # Medium tasks (0.3-0.6)
        'analyze': 0.5, 'review': 0.5, 'refactor': 0.5, 'optimize': 0.6,
        'debug': 0.5, 'test': 0.4,
        
        # Complex tasks (0.7-1.0)
        'architect': 0.8, 'design': 0.8, 'migrate': 0.9,
        'security audit': 0.9, 'performance analysis': 0.8,
        'legacy': 0.9, 'complex': 0.9
    }
    
    # Analyze task description
    description_lower = task_description.lower()
    complexity_scores = []
    
    for indicator, score in complexity_indicators.items():
        if indicator in description_lower:
            complexity_scores.append(score)
    
    # Context factors
    context_multipliers = {
        'large_codebase': 1.2,
        'multiple_languages': 1.3,
        'legacy_code': 1.4,
        'no_documentation': 1.2,
        'tight_deadline': 0.9,  # Use faster model even if less accurate
    }
    
    base_complexity = sum(complexity_scores) / len(complexity_scores) if complexity_scores else 0.4
    
    # Apply context multipliers
    for factor, multiplier in context_multipliers.items():
        if context.get(factor):
            base_complexity *= multiplier
    
    return min(base_complexity, 1.0)

# Usage example
task = "Analyze this legacy Python codebase for security vulnerabilities"
context = {"large_codebase": True, "legacy_code": True}
complexity = estimate_task_complexity(task, context)
model = select_optimal_model(complexity, 80000, "medium")
print(f"Task complexity: {complexity:.2f}, Selected model: {model}")
```

### Dynamic Model Fallback

Implement fallback strategies to save costs:

```python
class CostOptimizedAgent:
    def __init__(self):
        self.model_costs = {
            'sonnet': {'input': 3, 'output': 15},    # per million tokens
            'opus': {'input': 15, 'output': 75}
        }
        self.retry_budget = 0.10  # Max 10 cents for retries
    
    def execute_with_fallback(self, task: str, max_cost: float = 0.05):
        """Execute task with cost optimization and fallback."""
        
        # Try cheaper model first
        try:
            estimated_tokens = self.estimate_token_usage(task)
            sonnet_cost = self.calculate_cost('sonnet', estimated_tokens)
            
            if sonnet_cost <= max_cost:
                result = self.run_agent(task, 'sonnet')
                if self.validate_result_quality(result, task):
                    return result
                    
            # Fallback to opus if result quality is poor or cost allows
            opus_cost = self.calculate_cost('opus', estimated_tokens)
            if opus_cost <= max_cost + self.retry_budget:
                return self.run_agent(task, 'opus')
            else:
                # Simplify task to reduce cost
                simplified_task = self.simplify_task(task)
                return self.run_agent(simplified_task, 'sonnet')
                
        except Exception as e:
            # Log cost optimization failure
            print(f"Cost optimization failed: {e}")
            return self.run_agent(task, 'sonnet')  # Default fallback
    
    def calculate_cost(self, model: str, estimated_tokens: int) -> float:
        """Calculate estimated cost for model and token count."""
        costs = self.model_costs[model]
        # Assume 1:2 input:output ratio
        input_tokens = estimated_tokens * 0.67
        output_tokens = estimated_tokens * 0.33
        
        return (input_tokens * costs['input'] + output_tokens * costs['output']) / 1_000_000
```

## Implement Aggressive Caching

### Multi-Level Caching Strategy

```python
import hashlib
import json
import time
from typing import Optional, Dict, Any

class AggressiveCacheSystem:
    def __init__(self):
        # Different cache levels with different TTLs
        self.cache_levels = {
            'immediate': {'ttl': 300, 'storage': {}},     # 5 minutes
            'session': {'ttl': 3600, 'storage': {}},      # 1 hour  
            'daily': {'ttl': 86400, 'storage': {}},       # 24 hours
            'persistent': {'ttl': 604800, 'storage': {}}, # 1 week
        }
    
    def cache_key(self, agent: str, input_data: str, model: str) -> str:
        """Generate consistent cache key."""
        key_data = {
            'agent': agent,
            'input': input_data,
            'model': model,
            'version': '1.0'  # Include version for cache invalidation
        }
        key_string = json.dumps(key_data, sort_keys=True)
        return hashlib.sha256(key_string.encode()).hexdigest()[:16]
    
    def get_cached_result(self, cache_key: str) -> Optional[Dict[Any, Any]]:
        """Get result from any cache level."""
        current_time = time.time()
        
        for level_name, level in self.cache_levels.items():
            if cache_key in level['storage']:
                entry = level['storage'][cache_key]
                
                # Check if expired
                if current_time - entry['timestamp'] < level['ttl']:
                    entry['hits'] = entry.get('hits', 0) + 1
                    return {
                        'result': entry['result'],
                        'from_cache': True,
                        'cache_level': level_name,
                        'age': current_time - entry['timestamp']
                    }
                else:
                    # Remove expired entry
                    del level['storage'][cache_key]
        
        return None
    
    def cache_result(self, cache_key: str, result: Dict[Any, Any], 
                    cache_level: str = 'session'):
        """Cache result at specified level."""
        entry = {
            'result': result,
            'timestamp': time.time(),
            'hits': 0
        }
        
        self.cache_levels[cache_level]['storage'][cache_key] = entry
    
    def determine_cache_level(self, agent: str, task_type: str) -> str:
        """Determine appropriate cache level based on task."""
        
        # Static content - cache longest
        if task_type in ['documentation', 'formatting', 'linting']:
            return 'persistent'
        
        # Code analysis - cache daily
        elif task_type in ['code_review', 'static_analysis']:
            return 'daily'
        
        # Dynamic content - cache session
        elif task_type in ['test_generation', 'debugging']:
            return 'session'
        
        # Real-time content - cache briefly
        else:
            return 'immediate'

# Usage with cost tracking
class CostAwareCachedAgent:
    def __init__(self):
        self.cache = AggressiveCacheSystem()
        self.cost_savings = 0.0
        
    def execute(self, agent: str, task: str, model: str = 'sonnet'):
        """Execute with aggressive caching."""
        
        cache_key = self.cache.cache_key(agent, task, model)
        
        # Check cache first
        cached_result = self.cache.get_cached_result(cache_key)
        if cached_result:
            # Calculate cost savings
            estimated_cost = self.estimate_execution_cost(task, model)
            self.cost_savings += estimated_cost
            
            return cached_result
        
        # Execute and cache result
        result = self.run_agent(agent, task, model)
        task_type = self.classify_task_type(task)
        cache_level = self.cache.determine_cache_level(agent, task_type)
        
        self.cache.cache_result(cache_key, result, cache_level)
        
        return {
            'result': result,
            'from_cache': False,
            'cached_at': cache_level
        }
```

### Cache Analytics and Optimization

```python
def analyze_cache_performance():
    """Analyze cache hit rates and optimize."""
    
    cache_stats = {}
    for level_name, level in cache.cache_levels.items():
        total_entries = len(level['storage'])
        total_hits = sum(entry.get('hits', 0) for entry in level['storage'].values())
        
        cache_stats[level_name] = {
            'entries': total_entries,
            'total_hits': total_hits,
            'hit_rate': total_hits / max(total_entries, 1),
            'storage_mb': estimate_storage_size(level['storage'])
        }
    
    # Identify optimization opportunities
    recommendations = []
    for level, stats in cache_stats.items():
        if stats['hit_rate'] < 0.3:
            recommendations.append(f"Consider shorter TTL for {level}")
        elif stats['hit_rate'] > 0.8:
            recommendations.append(f"Consider longer TTL for {level}")
    
    return cache_stats, recommendations
```

## Monitor and Control Token Usage

### Token Usage Tracking

```python
class TokenUsageMonitor:
    def __init__(self):
        self.usage_data = []
        self.daily_limit = 1_000_000  # 1M tokens per day
        self.cost_limit = 50.0        # $50 per day
        
    def track_usage(self, agent: str, model: str, input_tokens: int, 
                   output_tokens: int, cost: float):
        """Track token usage and costs."""
        
        usage_entry = {
            'timestamp': time.time(),
            'agent': agent,
            'model': model,
            'input_tokens': input_tokens,
            'output_tokens': output_tokens,
            'total_tokens': input_tokens + output_tokens,
            'cost': cost
        }
        
        self.usage_data.append(usage_entry)
        
        # Check limits
        self.check_limits()
    
    def check_limits(self):
        """Check if approaching limits."""
        today_usage = self.get_today_usage()
        
        if today_usage['total_tokens'] > self.daily_limit * 0.8:
            self.send_warning(f"80% of daily token limit reached")
        
        if today_usage['total_cost'] > self.cost_limit * 0.8:
            self.send_warning(f"80% of daily cost limit reached")
    
    def get_today_usage(self) -> Dict[str, float]:
        """Get today's usage statistics."""
        today_start = time.time() - 86400  # 24 hours ago
        
        today_entries = [
            entry for entry in self.usage_data 
            if entry['timestamp'] > today_start
        ]
        
        return {
            'total_tokens': sum(e['total_tokens'] for e in today_entries),
            'total_cost': sum(e['cost'] for e in today_entries),
            'agent_breakdown': self.breakdown_by_agent(today_entries),
            'model_breakdown': self.breakdown_by_model(today_entries)
        }
    
    def get_cost_optimization_suggestions(self) -> List[str]:
        """Analyze usage patterns and suggest optimizations."""
        
        today_usage = self.get_today_usage()
        suggestions = []
        
        # Analyze by agent
        for agent, stats in today_usage['agent_breakdown'].items():
            if stats['cost'] > 5.0:  # Expensive agents
                cache_rate = self.get_cache_hit_rate(agent)
                if cache_rate < 0.5:
                    suggestions.append(f"Increase caching for {agent}")
                
                model_usage = stats['model_usage']
                if model_usage.get('opus', 0) > model_usage.get('sonnet', 0):
                    suggestions.append(f"Consider using Sonnet more for {agent}")
        
        return suggestions

# Integration with agent execution
monitor = TokenUsageMonitor()

def execute_with_monitoring(agent: str, task: str, model: str):
    """Execute agent with comprehensive monitoring."""
    
    start_time = time.time()
    
    try:
        result = run_agent(agent, task, model)
        
        # Extract token usage from result
        input_tokens = result.get('usage', {}).get('input_tokens', 0)
        output_tokens = result.get('usage', {}).get('output_tokens', 0)
        cost = calculate_cost(model, input_tokens, output_tokens)
        
        # Track usage
        monitor.track_usage(agent, model, input_tokens, output_tokens, cost)
        
        return result
        
    except Exception as e:
        # Track failed requests too
        monitor.track_usage(agent, model, 0, 0, 0)
        raise
```

### Cost Alerting and Controls

```python
class CostController:
    def __init__(self):
        self.limits = {
            'daily_cost': 100.0,
            'hourly_cost': 10.0,
            'per_user_daily': 20.0
        }
        self.actions = {
            'warn_at': 0.8,      # Warn at 80%
            'throttle_at': 0.9,  # Throttle at 90%
            'block_at': 1.0      # Block at 100%
        }
    
    def check_and_enforce_limits(self, user: str, requested_cost: float) -> Dict[str, Any]:
        """Check limits and return action to take."""
        
        current_usage = self.get_current_usage(user)
        projected_usage = {
            'daily': current_usage['daily'] + requested_cost,
            'hourly': current_usage['hourly'] + requested_cost
        }
        
        # Check each limit
        for limit_type, limit_value in self.limits.items():
            current = current_usage.get(limit_type.split('_')[0], 0)
            threshold_value = limit_value * self.actions['block_at']
            
            if current + requested_cost > threshold_value:
                return {
                    'action': 'block',
                    'reason': f"{limit_type} limit exceeded",
                    'current': current,
                    'limit': limit_value
                }
            
            elif current + requested_cost > limit_value * self.actions['throttle_at']:
                return {
                    'action': 'throttle',
                    'delay': self.calculate_throttle_delay(current, limit_value),
                    'reason': f"Approaching {limit_type} limit"
                }
            
            elif current + requested_cost > limit_value * self.actions['warn_at']:
                return {
                    'action': 'warn',
                    'reason': f"80% of {limit_type} limit reached"
                }
        
        return {'action': 'allow'}
```

## Implement Cost-Aware Workflows

### Budget-Based Execution

```yaml
# Cost-aware workflow configuration
name: budget_conscious_workflow
budget:
  daily_limit: 50.00
  per_execution_limit: 2.00
  currency: USD

stages:
  - name: cost_check
    tasks:
      - name: validate_budget
        type: cost_check
        fail_if_exceeded: true
  
  - name: analysis
    budget_allocation: 60%  # 60% of daily budget
    tasks:
      - name: quick_analysis
        agent: analyzer
        model: sonnet
        max_cost: 0.50
        
      - name: detailed_analysis
        agent: deep_analyzer  
        model: opus
        max_cost: 1.50
        when: ${quick_analysis.confidence} < 0.8
  
  - name: optimization
    budget_allocation: 40%
    tasks:
      - name: optimize_code
        agent: optimizer
        model: sonnet  # Force cheaper model
        max_cost: 1.00
```

### Cost Optimization Best Practices

```python
# Cost optimization checklist
COST_OPTIMIZATION_CHECKLIST = {
    'model_selection': [
        'Use Sonnet for simple formatting/linting tasks',
        'Use Sonnet for initial code review, Opus for complex issues',
        'Estimate task complexity before model selection',
        'Implement fallback strategies'
    ],
    
    'caching': [
        'Cache static analysis results for 24 hours',
        'Cache formatting results for 1 week',
        'Cache documentation generation for 1 week',
        'Implement cache analytics and optimization'
    ],
    
    'input_optimization': [
        'Remove unnecessary comments from code analysis',
        'Truncate large files to relevant sections',
        'Use file summaries instead of full content when possible',
        'Batch similar requests together'
    ],
    
    'monitoring': [
        'Track daily/weekly token usage',
        'Set up cost alerts at 80% of budget',
        'Monitor per-agent cost efficiency',
        'Regular cost optimization reviews'
    ]
}

def generate_cost_report(usage_data: List[Dict]) -> str:
    """Generate cost optimization report."""
    
    total_cost = sum(entry['cost'] for entry in usage_data)
    total_tokens = sum(entry['total_tokens'] for entry in usage_data)
    
    # Calculate potential savings
    potential_savings = 0.0
    
    # Model optimization savings
    opus_usage = [e for e in usage_data if e['model'] == 'opus']
    simple_opus_tasks = [
        e for e in opus_usage 
        if e.get('task_complexity', 1.0) < 0.4
    ]
    
    for task in simple_opus_tasks:
        opus_cost = task['cost']
        sonnet_cost = opus_cost * (3/15)  # Approximate cost ratio
        potential_savings += opus_cost - sonnet_cost
    
    report = f"""
# Cost Optimization Report

## Current Usage
- **Total Cost**: ${total_cost:.2f}
- **Total Tokens**: {total_tokens:,}
- **Average Cost per 1K tokens**: ${(total_cost/total_tokens*1000):.4f}

## Optimization Opportunities
- **Model Selection Savings**: ${potential_savings:.2f}
- **Estimated Cache Hit Rate**: {calculate_cache_efficiency(usage_data):.1%}

## Recommendations
{generate_optimization_recommendations(usage_data)}
"""
    
    return report
```

## Troubleshooting Cost Issues

### Common Cost Problems

1. **Unexpectedly high costs**
   ```python
   # Debug high costs
   def debug_high_costs(usage_data):
       # Find expensive operations
       expensive_ops = sorted(usage_data, key=lambda x: x['cost'], reverse=True)[:10]
       
       for op in expensive_ops:
           print(f"Agent: {op['agent']}, Cost: ${op['cost']:.2f}, "
                 f"Tokens: {op['total_tokens']:,}, Model: {op['model']}")
   ```

2. **Poor cache hit rates**
   ```python
   # Analyze cache misses
   def analyze_cache_misses():
       # Check for input variations causing cache misses
       # Look for opportunities to normalize inputs
       pass
   ```

3. **Inefficient model usage**
   ```python
   # Find model optimization opportunities
   def find_model_waste():
       # Identify Opus usage for simple tasks
       # Calculate potential savings from using Sonnet
       pass
   ```

## Cost Optimization Summary

- **Smart Model Selection**: Use complexity estimation to choose appropriate models
- **Aggressive Caching**: Multi-level caching with appropriate TTLs
- **Usage Monitoring**: Track costs and set up alerts
- **Budget Controls**: Implement spending limits and throttling
- **Input Optimization**: Reduce token usage through preprocessing
- **Regular Analysis**: Weekly cost optimization reviews
- **Team Education**: Train team on cost-aware practices
- **Automation**: Automate cost optimization decisions
- **Fallback Strategies**: Handle cost limit scenarios gracefully