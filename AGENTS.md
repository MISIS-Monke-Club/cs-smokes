# Agent Instructions

This repository uses project-local Codex skills, Superpowers workflows, Beads tracking, and Grace memory. Start by loading this file, then follow the startup sequence below before changing code or docs.

## Startup Sequence

1. Use `superpowers:using-superpowers` at the start of every session, then invoke any relevant Superpowers skill before acting.
2. Run `bd prime` to load Beads workflow context. Use `bd` for task tracking and session handoff.
3. Read `.grace/memory.md` before planning or editing. Treat it as the repository Grace memory mirror.
4. If a real Grace CLI, MCP tool, or plugin is available in the current environment, update Grace through that tool first and keep `.grace/memory.md` in sync.
5. Check for project-local skills under `.codex/skills` when the task mentions specs, plans, reviews, or review fixes.

## Local Codex Skills

Installed skills live in `.codex/skills`:

- `spec-reviewer`: use for rigorous reviews of specs, requirements, design docs, implementation plans, and Superpowers plans.
- `spec-review-fixer`: use when applying findings from a spec review while preserving intent and avoiding unsupported business-logic changes.

## Memory Rules

- Use Grace memory for stable repository knowledge: architecture, business rules, entities, conventions, workflows, and gotchas.
- Keep `.grace/memory.md` factual and evidence-based. Update it when repository behavior, commands, entities, or operational rules change.
- Do not store secrets, tokens, private user data, or one-off chat history in memory.
- Use `bd remember` only for Beads-compatible persistent notes when Beads workflows require them; Grace remains the project memory surface requested for this repo.

## Beads Tracking Rules

- Track actionable work with `bd`; do not use ad hoc markdown TODO lists for project work.
- Create or update a Beads issue for non-trivial changes.
- Close issues only after verification is complete and cite the checks that passed.
- Do not run `bd init --force`. If Beads is missing or broken, diagnose first and use safe setup or recovery commands.

<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:7510c1e2 -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking - do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge - do NOT use MEMORY.md files

**Architecture in one line:** issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export. See https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md for details and anti-patterns.

## Session Completion

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
<!-- END BEADS INTEGRATION -->
