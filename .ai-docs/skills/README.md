# `.ai-docs/skills/`

Canonical skill definitions (copied verbatim into each harness skill directory).

- Add each skill under `.ai-docs/skills/<skill-name>/`
- Include `SKILL.md` (and any supporting files)

## Example

```
.ai-docs/skills/
  lightning-debug/
    SKILL.md
    examples.md
    snippets/
      error-codes.md
```

`SKILL.md` is the canonical skill entrypoint, but **all files under the skill directory**
are copied so you can reference helper docs from the skill.

### Example `SKILL.md`

```md
---
name: lightning-debug
description: Help debug Lightning and LND issues in this repo
---

When debugging a bug report:

- Identify likely root cause(s)
- Point to the exact files/functions involved
- Propose a minimal fix and a test plan

Useful references:

- `./examples.md`
- `./snippets/error-codes.md`
```

### Example helper file (`examples.md`)

```md
## Common bug triage checklist

- What changed recently?
- Is this reproducible on regtest?
- Are there logs or stack traces?
```
