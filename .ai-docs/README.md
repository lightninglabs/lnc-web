# `.ai-docs/` (canonical AI guidance)

This repo uses **multiple AI "harnesses"** (Cursor, Claude Code, Copilot,
gemini-cli, Codex) that each expect different file names and formats for:

- agent instructions
- skills
- commands/prompts
- rules/sub-agents/hooks

Without a single source of truth, these files would tend to **diverge**, get **hand-edited
in the wrong place**, and break determinism in CI. The `.ai-docs/` directory solves that by
making AI guidance **canonical and authored once**, then **deterministically generating**
the harness-specific outputs.

- **Edit (source of truth)**: `.ai-docs/**` only
- **Generate outputs locally**: `ai-docs-sync sync`
- **Validate (CI and local)**: `ai-docs-sync check`
- **Remove generated outputs**: `ai-docs-sync clean`

## Directory index

Each subdirectory below has its own README with details and examples:

- **Instructions**: `AGENTS.md` (canonical instruction content; copied verbatim to harness
  entrypoints)
- **Commands**: [`commands/README.md`](commands/README.md)
- **Hooks**: [`hooks/README.md`](hooks/README.md)
- **Plans**: [`plans/README.md`](plans/README.md)
- **Rules**: [`rules/README.md`](rules/README.md)
- **Skills**: [`skills/README.md`](skills/README.md)
- **Sub-agents**: [`subagents/README.md`](subagents/README.md)

## Authoring workflow (how to add or change AI files)

When adding new AI guidance (instructions, skills, commands, rules, sub-agents, hooks):

- Use AI agents to help you **draft** the new file(s).
- **Iterate where you're working**: edit and refine the file(s) in the harness directory
  you're currently using (e.g. `.claude/`, `.cursor/`, `.github/`, `.gemini/`, `.codex/`),
  so you can quickly test that the harness consumes them as intended.
- Once finalized, **copy the result back** into the appropriate canonical location under
  `.ai-docs/` (this is what we keep long-term).
- Then run:
  - `ai-docs-sync sync` to regenerate harness outputs
  - `ai-docs-sync check` to confirm everything is consistent (this is what CI enforces)

### PR expectations

- `.ai-docs/**` is expected to evolve over time — **it's fine to commit `.ai-docs` changes as part
  of any PR**.
- **Separate PRs are preferred but not required**, especially for larger changes to AI
  guidance or the sync system.

## What lives here (at a glance)

- `AGENTS.md`: canonical agent instructions (verbatim-copied to each harness entrypoint)
- `skills/`: canonical skill definitions (copied into each harness' skill directory)
- `commands/`: canonical command prompts (authored in Markdown; may be converted for
  harnesses like gemini-cli)
- `rules/`: Cursor-only rule sources (synced to `.cursor/rules/*.mdc`)
- `subagents/`: sub-agent definitions (synced for Cursor + Claude)
- `hooks/`: hook intent for harnesses that support file-defined hooks
- `plans/`: human-authored plan docs (committed; never generated or synced)
