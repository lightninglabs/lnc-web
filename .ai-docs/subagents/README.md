# `.ai-docs/subagents/`

Canonical sub-agents (Cursor + Claude).

- Add each sub-agent as `.ai-docs/subagents/<agent-name>.md`
- `ai-docs-sync sync` generates:
  - `.claude/agents/<agent-name>.md`
  - `.cursor/agents/<agent-name>.md`

## Example

```
.ai-docs/subagents/
  reviewer.md
```

Example `reviewer.md`:

```md
---
name: reviewer
description: Reviews changes for correctness and repo conventions
tools: Read, Grep, Glob
model: inherit
---

You are a code reviewer. Focus on correctness, determinism, and repo conventions. When you
flag an issue, propose a concrete fix.
```
