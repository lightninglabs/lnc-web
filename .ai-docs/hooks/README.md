# `.ai-docs/hooks/`

Canonical hook intent for harnesses that support file-defined hooks.

- `claude.hooks.json` -> generated as `.claude/settings.json`
- `gemini.hooks.json` -> generated as `.gemini/settings.json`

These JSON files should contain only the settings needed by the respective harnesses.

## Example

```
.ai-docs/hooks/
  claude.hooks.json
  gemini.hooks.json
  scripts/
    format.sh
```

Example `claude.hooks.json`:

```json
{
  "hooks": {
    "preCommit": [
      {
        "command": "bash .ai-docs/hooks/scripts/format.sh"
      }
    ]
  }
}
```
