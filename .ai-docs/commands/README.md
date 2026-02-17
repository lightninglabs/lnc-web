# `.ai-docs/commands/`

Canonical command prompts authored in Markdown.

- Add each command as `.ai-docs/commands/<command-name>.md`
- Optional YAML frontmatter may be used for metadata (e.g. `description:`)
- `ai-docs-sync sync` generates harness-specific command files, including gemini-cli TOML.

## Example

```
.ai-docs/commands/
  triage-bug.md
```

Example `triage-bug.md`:

```md
---
description: Triage a bug report and propose a fix
---

Given the bug report below, do the following:

1. Identify likely root cause(s)
2. Point to relevant files/functions
3. Propose a minimal fix and a test plan

Bug report: {{args}}
```
