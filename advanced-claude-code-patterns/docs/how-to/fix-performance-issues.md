# How to Fix Performance Issues

Optimize Claude Code performance and resolve resource bottlenecks.

## Prerequisites

- Claude Code installed
- System monitoring tools
- Access to configuration files

## Slow Agent Responses

### Quick Diagnosis

```bash
# Monitor response time
time claude --agent my-agent "test task"

# Check token usage
/cost

# Profile agent execution
claude --debug --agent my-agent "task" 2>&1 | grep -i "time\|token"
```

### Solution Steps

1. **Use appropriate model**
   ```markdown
   ---
   model: sonnet  # Fast for simple tasks
   # model: opus  # Only for complex analysis
   ---
   ```

2. **Implement response caching**
   ```python
   # cache_responses.py
   from functools import lru_cache
   import hashlib
   
   @lru_cache(maxsize=100)
   def get_cached_response(agent, input_hash):
       """Cache agent responses by input hash."""
       return claude_api.call(agent, input_hash)
   
   def process_with_cache(agent, input_text):
       # Create stable hash
       input_hash = hashlib.md5(input_text.encode()).hexdigest()
       return get_cached_response(agent, input_hash)
   ```

3. **Limit agent scope**
   ```markdown
   ## Activation Instructions
   
   - CRITICAL: Only analyze files in src/ directory
   - Focus on Python files modified in last commit
   - Ignore test files unless specifically requested
   - Maximum 10 files per analysis
   ```

4. **Optimize tool usage**
   ```yaml
   ---
   tools: [Read, Grep]  # Minimal set
   # Avoid: [Read, Write, Edit, Bash, Search, WebFetch]
   ---
   ```

## High Memory Usage

### Quick Diagnosis

```bash
# Check Claude Code memory
ps aux | grep claude | awk '{print $4, $11}'

# Monitor real-time usage
top -p $(pgrep -f claude)

# Check cache size
du -sh ~/.claude/cache/
```

### Solution Steps

1. **Set memory limits**
   ```json
   // .claude/config.json
   {
     "resources": {
       "max_memory": "2GB",
       "cache_size": "500MB",
       "gc_interval": 300
     }
   }
   ```

2. **Clear cache regularly**
   ```bash
   # Manual clear
   # Clear conversation context
   /clear
   
   # Automated cleanup script
   cat > ~/.claude/cleanup.sh << 'EOF'
   #!/bin/bash
   # Run daily via cron
   find ~/.claude/cache -type f -mtime +7 -delete
   # Manually clear old cache files
   find ~/.claude/cache -type f -mtime +7 -delete
   EOF
   
   chmod +x ~/.claude/cleanup.sh
   ```

3. **Limit concurrent operations**
   ```json
   {
     "execution": {
       "max_parallel": 4,
       "queue_size": 10,
       "worker_timeout": 30
     }
   }
   ```

## Token Limit Issues

### Quick Diagnosis

```bash
# Check current usage
/cost --detailed

# Monitor token consumption
claude --track-tokens "your command"

# View historical usage
/cost --history --days 7
```

### Solution Steps

1. **Reduce context size**
   ```bash
   # Use targeted operations
   Analyze only authentication in src/auth.py
   
   # Clear conversation context
   /clear
   
   # Compact context
   /compact "Focus on security issues"
   ```

2. **Split large tasks**
   ```python
   # split_analysis.py
   def analyze_codebase(files):
       """Split large analysis into chunks."""
       chunk_size = 5
       results = []
       
       for i in range(0, len(files), chunk_size):
           chunk = files[i:i+chunk_size]
           result = claude(f"Analyze: {chunk}")
           results.append(result)
       
       # Summarize results
       return claude(f"Summarize: {results}")
   ```

3. **Use summarization strategies**
   ```markdown
   ## Workflow for Large Codebases
   
   1. First pass: Get high-level structure
   2. Identify critical components
   3. Deep dive only on relevant parts
   4. Summarize findings progressively
   ```

## Slow Hook Execution

### Quick Diagnosis

```bash
# Check hook execution in logs
# Look for hook timing in debug output
claude --debug "test command" 2>&1 | grep hook

# Check hook timing
grep "duration" ~/.claude/logs/hooks.log
```

### Solution Steps

1. **Optimize hook scripts**
   ```json
   {
     "name": "fast-hook",
     "parallel": true,  # Run checks in parallel
     "cache": true,     # Cache results
     "timeout": 10,     # Short timeout
     "actions": [
       {
         "type": "command",
         "command": "quick-check",
         "async": true
       }
     ]
   }
   ```

2. **Use incremental processing**
   ```bash
   #!/bin/bash
   # Only check changed files
   CHANGED=$(git diff --name-only HEAD~1)
   
   if [ -z "$CHANGED" ]; then
     echo "No changes to check"
     exit 0
   fi
   
   # Process only changed files
   for file in $CHANGED; do
     quick-lint "$file"
   done
   ```

3. **Implement smart skipping**
   ```json
   {
     "conditions": {
       "skip_if": {
         "files_match": "*.test.js",
         "branch": "experimental/*",
         "commit_message": "WIP"
       }
     }
   }
   ```

## Network Latency

### Quick Diagnosis

```bash
# Test API latency
ping api.anthropic.com

# Check connection speed
curl -w "@curl-format.txt" -o /dev/null -s https://api.anthropic.com

# Monitor network usage
netstat -i 1
```

### Solution Steps

1. **Configure retry and timeout**
   ```json
   {
     "network": {
       "timeout": 30000,
       "retry": {
         "max_attempts": 3,
         "backoff": "exponential",
         "initial_delay": 1000
       }
     }
   }
   ```

2. **Use connection pooling**
   ```json
   {
     "connection": {
       "pool_size": 5,
       "keep_alive": true,
       "idle_timeout": 60000
     }
   }
   ```

3. **Implement local caching**
   ```python
   # cache_api.py
   import time
   import json
   
   class APICache:
       def __init__(self, ttl=300):
           self.cache = {}
           self.ttl = ttl
       
       def get(self, key):
           if key in self.cache:
               entry = self.cache[key]
               if time.time() - entry['time'] < self.ttl:
                   return entry['data']
           return None
       
       def set(self, key, data):
           self.cache[key] = {
               'data': data,
               'time': time.time()
           }
   ```

## Startup Performance

### Quick Diagnosis

```bash
# Measure startup time
time claude --version

# Profile initialization
claude --profile-startup

# Check loaded modules
claude --debug 2>&1 | head -20
```

### Solution Steps

1. **Optimize configuration loading**
   ```json
   {
     "startup": {
       "lazy_load": true,
       "cache_config": true,
       "skip_updates_check": true
     }
   }
   ```

2. **Reduce agent preloading**
   ```json
   {
     "agents": {
       "preload": false,
       "load_on_demand": true,
       "cache_parsed": true
     }
   }
   ```

3. **Use minimal initialization**
   ```bash
   # Fast startup mode
   claude --fast "command"
   
   # Skip non-essential checks
   claude --no-update-check --no-telemetry "command"
   ```

## Performance Monitoring

### Set Up Monitoring

```bash
# Create monitoring script
cat > ~/.claude/monitor.sh << 'EOF'
#!/bin/bash

# Log performance metrics
while true; do
  timestamp=$(date +%s)
  cpu=$(ps aux | grep claude | awk '{print $3}')
  mem=$(ps aux | grep claude | awk '{print $4}')
  
  echo "$timestamp,$cpu,$mem" >> ~/.claude/performance.csv
  
  sleep 60
done
EOF

chmod +x ~/.claude/monitor.sh
```

### Analyze Performance Trends

```python
# analyze_performance.py
import pandas as pd
import matplotlib.pyplot as plt

# Load metrics
df = pd.read_csv('~/.claude/performance.csv', 
                 names=['timestamp', 'cpu', 'memory'])

# Convert timestamp
df['time'] = pd.to_datetime(df['timestamp'], unit='s')

# Plot trends
fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(10, 8))

ax1.plot(df['time'], df['cpu'])
ax1.set_ylabel('CPU %')
ax1.set_title('Claude Code Performance')

ax2.plot(df['time'], df['memory'])
ax2.set_ylabel('Memory %')
ax2.set_xlabel('Time')

plt.tight_layout()
plt.savefig('performance_report.png')
```

## Emergency Optimization

### Quick Performance Boost

```bash
# 1. Clear conversation context and caches
/clear
# Manually clear cache files if needed
rm -rf ~/.claude/cache/*

# 2. Reset to minimal config
cp ~/.claude/config.json ~/.claude/config.backup
echo '{"model": "sonnet", "minimal": true}' > ~/.claude/config.json

# 3. Disable non-essential features
/config set telemetry false
/config set auto_update false
/config set preload_agents false

# 4. Restart Claude Code
# Note: There's no restart command - exit and restart Claude Code
```

### Performance Checklist

```bash
#!/bin/bash
# performance-check.sh

echo "Claude Code Performance Checklist"
echo "================================="

# Check cache size
cache_size=$(du -sh ~/.claude/cache | cut -f1)
echo "✓ Cache size: $cache_size"

# Check running processes
processes=$(ps aux | grep -c claude)
echo "✓ Running processes: $processes"

# Check memory usage
memory=$(ps aux | grep claude | awk '{sum+=$4} END {print sum}')
echo "✓ Total memory: ${memory}%"

# Check response time
response_time=$(time -f "%e" claude --version 2>&1 | tail -1)
echo "✓ Response time: ${response_time}s"

# Recommendations
echo ""
echo "Recommendations:"
[ "$processes" -gt 3 ] && echo "⚠️  Too many processes running"
[ "${memory%.*}" -gt 10 ] && echo "⚠️  High memory usage"
```

## Quick Reference

### Performance Commands

| Command | Purpose |
|---------|---------|
| `/cost` | Check token usage |
| `/clear` | Clear context |
| `/compact` | Reduce context |
| `claude --fast` | Fast mode |
| `claude profile` | Profile execution |

### Optimization Priorities

1. **Model Selection**: Use sonnet for speed
2. **Context Management**: Keep context minimal
3. **Cache Usage**: Enable caching
4. **Tool Selection**: Use only needed tools
5. **Parallel Processing**: Enable where safe

## Related Guides

- [How to Optimize Agents](optimize-agents.md)
- [How to Configure Resources](configure-resources.md)
- [How to Monitor Usage](monitor-usage.md)
- [How to Fix Memory Issues](fix-memory-issues.md)