# Hook Events Reference

Technical specification for Claude Code hook events.

## Event Types

| Event | Trigger | Can Block | Exit Code Support |
|-------|---------|-----------|-------------------|
| `PreToolUse` | Before any tool execution | Yes | 0, 1, 2 |
| `PostToolUse` | After tool execution | No | 0 only |
| `UserPromptSubmit` | When user submits prompt | Yes | 0, 1, 2 |
| `Notification` | On notifications | No | 0 only |
| `Stop` | On session end | No | 0 only |
| `SubagentStop` | When subagent completes | No | 0 only |
| `PreCompact` | Before conversation compact | Yes | 0, 1 |
| `SessionStart` | On session initialization | No | 0 only |

## Event Context Objects

### PreToolUse

```json
{
  "session_id": "abc123",
  "transcript_path": "/Users/.../.claude/projects/.../transcript.jsonl",
  "cwd": "/Users/...",
  "hook_event_name": "PreToolUse",
  "tool_name": "Write",
  "tool_input": {
    "file_path": "/path/to/file.txt",
    "content": "file content"
  }
}
```

### PostToolUse

```json
{
  "session_id": "abc123",
  "transcript_path": "/Users/.../.claude/projects/.../transcript.jsonl",
  "cwd": "/Users/...",
  "hook_event_name": "PostToolUse",
  "tool_name": "Write",
  "tool_input": {
    "file_path": "/path/to/file.txt",
    "content": "file content"
  },
  "tool_response": {
    "filePath": "/path/to/file.txt",
    "success": true
  }
}
```

### UserPromptSubmit

```json
{
  "session_id": "abc123",
  "transcript_path": "/Users/.../.claude/projects/.../transcript.jsonl",
  "cwd": "/Users/...",
  "hook_event_name": "UserPromptSubmit",
  "prompt": "Write a function to calculate the factorial of a number"
}
```

### notification

```json
{
  "event": "notification",
  "type": "info | warning | error",
  "message": "string",
  "details": "object",
  "timestamp": "ISO 8601"
}
```

### stop

```json
{
  "event": "stop",
  "reason": "user | error | complete",
  "sessionDuration": "number",
  "messagesExchanged": "number",
  "timestamp": "ISO 8601"
}
```

### subagentStop

```json
{
  "event": "subagentStop",
  "subagentName": "string",
  "result": "any",
  "duration": "number",
  "exitCode": "number",
  "timestamp": "ISO 8601"
}
```

### preCompact

```json
{
  "event": "preCompact",
  "currentTokens": "number",
  "targetTokens": "number",
  "strategy": "string",
  "timestamp": "ISO 8601"
}
```

### sessionStart

```json
{
  "event": "sessionStart",
  "sessionId": "string",
  "mode": "interactive | script",
  "config": "object",
  "timestamp": "ISO 8601"
}
```

## Exit Codes

| Code | Meaning | Effect |
|------|---------|--------|
| 0 | Success | Continue normal execution |
| 1 | Block | Stop execution with error |
| 2 | Correct | Replace tool parameters |
| 3-125 | Custom | Hook-specific behavior |
| 126 | Not executable | Hook configuration error |
| 127 | Not found | Hook script missing |
| 128+ | Signal | System termination |

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `CLAUDE_SESSION_ID` | Current session identifier | `sess_abc123` |
| `CLAUDE_MESSAGE_ID` | Current message identifier | `msg_xyz789` |
| `CLAUDE_TOOL_NAME` | Tool being executed | `Edit` |
| `CLAUDE_EVENT_TYPE` | Current event type | `preToolUse` |
| `CLAUDE_PROJECT_ROOT` | Project root directory | `/home/user/project` |
| `CLAUDE_CONFIG_DIR` | Configuration directory | `/home/user/.claude` |
| `CLAUDE_TIMESTAMP` | Event timestamp | `2024-01-01T12:00:00Z` |
| `CLAUDE_USER` | Current user | `john.doe` |

## Tool Matchers

### Exact Match
```json
"toolMatcher": {
  "tool": "Edit"
}
```

### Pattern Match
```json
"toolMatcher": {
  "tool": "Edit",
  "pathPattern": "*.py"
}
```

### Multiple Tools
```json
"toolMatcher": {
  "tools": ["Edit", "Write", "MultiEdit"]
}
```

### Inverted Match
```json
"toolMatcher": {
  "tool": "!Read"
}
```

### Parameter Match
```json
"toolMatcher": {
  "tool": "Bash",
  "parameterMatch": {
    "command": "rm *"
  }
}
```

## Hook Response Format

### Blocking Response
```json
{
  "allow": false,
  "message": "Operation blocked",
  "suggestion": "Alternative action"
}
```

### Correction Response (Exit Code 2)
```json
{
  "corrected": true,
  "parameters": {
    "file_path": "/corrected/path.py",
    "content": "corrected content"
  }
}
```

### Success Response
```json
{
  "allow": true,
  "metadata": {
    "processed": true,
    "duration": 100
  }
}
```

## Event Priority

| Priority | Event Type | Order |
|----------|------------|-------|
| 1 | `sessionStart` | First |
| 2 | `userPromptSubmit` | Before processing |
| 3 | `preToolUse` | Before each tool |
| 4 | `postToolUse` | After each tool |
| 5 | `notification` | As generated |
| 6 | `preCompact` | Before compaction |
| 7 | `subagentStop` | On subagent end |
| 8 | `stop` | Last |

## Execution Order

When multiple hooks match an event:

1. Global hooks (`~/.claude/settings.json`)
2. Project hooks (`.claude/settings.json`)
3. Local hooks (`.claude/settings.local.json`)
4. Within each level: Array order

## See Also

- [Hook Configuration](configuration.md)
- [Hook API](api.md)
- [Tool Reference](../tools.md)