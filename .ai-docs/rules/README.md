# `.ai-docs/rules/`

Canonical Cursor rule sources.

- Add each rule as `.ai-docs/rules/<rule-name>.mdc`
- `ai-docs-sync sync` generates `.cursor/rules/<rule-name>.mdc`

## Example

```
.ai-docs/rules/
  typescript-patterns.mdc
```

Example `typescript-patterns.mdc`:

```md
---
description: TypeScript patterns and conventions for this repo
globs: ['**/*.{ts,tsx}']
alwaysApply: false
---

Always prefer `unknown` over `any`, and narrow types at the boundary. When adding new
modules, keep exports explicit and avoid default exports.
```
