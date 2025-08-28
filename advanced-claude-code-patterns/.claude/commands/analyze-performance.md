---
name: analyze-performance
description: Deep performance analysis with extended thinking and parallel optimization
version: 1.0.0
argument-hint: "[target] [--profile|--benchmark|--analyze]"
---

# Analyze Performance Command

You are a performance analysis expert. When this command is invoked, you will:

## Analysis Target
$ARGUMENTS

Parse arguments to determine:
- Target: specific file, function, or system component (default: entire application)
- Mode: --profile (CPU/memory profiling), --benchmark (speed tests), --analyze (static analysis), default: all

If no target specified, perform comprehensive performance analysis.

## Extended Thinking Strategy

- **Quick metrics**: Standard performance measurements
- **Bottleneck analysis**: Think about performance hotspots and inefficiencies
- **Deep optimization**: Think hard about algorithmic improvements and caching strategies
- **System redesign**: Ultrathink on architectural changes for 10x+ improvements

## Parallel Performance Subagents

Deploy concurrent analysis agents:
@performance-profiler @optimization-engineer @system-designer @code-archaeologist

These specialized subagents provide comprehensive performance insights:
- @performance-profiler: Analyze and measure performance bottlenecks
- @optimization-engineer: Implement performance improvements and optimizations
- @system-designer: Examine system design and scalability patterns
- @code-archaeologist: Identify legacy performance issues and optimization opportunities

## Primary Tasks

1. **Profile Current Performance**
   - Identify performance bottlenecks in the codebase
   - Analyze time complexity of algorithms
   - Check for memory leaks or inefficient memory usage
   - Review database queries for optimization opportunities
   - Identify unnecessary network calls or API requests

2. **Generate Performance Metrics**
   - Calculate Big O notation for critical functions
   - Measure actual execution times where possible
   - Identify hot paths in the code
   - Check for N+1 query problems
   - Analyze bundle sizes for frontend code

3. **Suggest Optimizations**
   - Recommend algorithm improvements
   - Suggest caching strategies
   - Propose lazy loading opportunities
   - Identify code that can be parallelized
   - Recommend database indexing strategies

## Analysis Approach

```python
# Example performance analysis structure
performance_analysis = {
    "bottlenecks": [
        {
            "location": "file:line",
            "issue": "description",
            "impact": "high|medium|low",
            "solution": "recommended fix"
        }
    ],
    "metrics": {
        "complexity": {},
        "memory": {},
        "io": {},
        "network": {}
    },
    "optimizations": [
        {
            "priority": 1,
            "description": "optimization",
            "expected_improvement": "percentage",
            "implementation_effort": "hours"
        }
    ]
}
```

## Common Performance Issues to Check

1. **Algorithm Complexity**
   - Nested loops (O(n²) or worse)
   - Inefficient sorting/searching
   - Unnecessary recursion
   - Missing memoization opportunities

2. **Memory Management**
   - Memory leaks
   - Large object creation in loops
   - Unnecessary data copying
   - Missing object pooling

3. **I/O Operations**
   - Synchronous file operations
   - Missing database connection pooling
   - Inefficient batch processing
   - Lack of pagination

4. **Frontend Specific**
   - Unnecessary re-renders
   - Missing React.memo/useMemo
   - Large bundle sizes
   - Blocking JavaScript
   - Missing code splitting

5. **Backend Specific**
   - N+1 queries
   - Missing database indexes
   - Inefficient ORM usage
   - Lack of caching
   - Synchronous operations that could be async

## Output Format

Provide a structured performance report including:

1. **Executive Summary** - High-level findings and impact
2. **Critical Issues** - Must-fix performance problems
3. **Optimization Opportunities** - Ranked by ROI
4. **Implementation Plan** - Step-by-step optimization guide
5. **Benchmarks** - Before/after performance metrics

## Usage Examples

```bash
# Analyze entire codebase
/analyze-performance

# Analyze specific module
/analyze-performance --module src/api

# Focus on database performance
/analyze-performance --focus database

# Analyze frontend bundle
/analyze-performance --focus frontend --bundle
```

## Integration with Agents

This command can trigger specialized agents for deeper analysis:
@performance-profiler @optimization-engineer

```yaml
agents: [@performance-profiler, @optimization-engineer]
models: [sonnet, opus]
task: "Deep performance analysis with profiling and optimization"
```

Remember to:
- Consider both time and space complexity
- Think about scalability (10x, 100x, 1000x users)
- Balance optimization effort with actual impact
- Provide concrete, actionable recommendations
- Include code examples for suggested optimizations