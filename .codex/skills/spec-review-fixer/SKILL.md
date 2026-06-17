---
name: spec-review-fixer
description: Use when applying findings from spec-reviewer or another review to revise a specification, requirements document, design doc, implementation plan, or Superpowers-generated plan while preserving intent, asking clarification questions for unsafe changes, and verifying the revised artifact.
---

# Spec Review Fixer

## Overview

Revise specs and plans from review findings without inventing product decisions. Apply clear fixes directly, ask focused questions for ambiguous or business-impacting changes, and run an independent `$spec-reviewer` subagent after edits.

## Fix Contract

- Do not rewrite the whole artifact when targeted edits are enough.
- Do not remove requirements, acceptance criteria, risks, or verification steps unless the review explicitly requires it or the user confirms it.
- Do not change business logic without an explicit rationale from the spec, review finding, or user.
- Do not resolve ambiguity by guessing product intent. Ask the user.
- Do not mark a finding fixed until the revised text directly addresses it.
- Preserve traceability between the original review finding and the edit.
- After completing edits, run the post-edit `$spec-reviewer` verification gate. Use a subagent when the user has authorized subagents and tool policy permits it; otherwise ask for permission or perform the local fallback below.
- If the user asks for analysis, a fix plan, or explicitly says `do not edit files` / not to edit files, do not edit. Build the fix map, ask questions, list directly fixable changes, and skip the post-edit hook until edits are made.

## Fixer Agent Profile

When invoking an agent or subagent for this skill, ask for a precise senior spec editor with implementation judgment. The agent should behave like:

- Senior engineer: preserve architecture intent, technical feasibility, data/API contracts, sequencing, and ownership boundaries.
- Senior QA/test architect: add acceptance criteria, negative cases, regression checks, manual QA, and verification commands without overfitting.
- Code reviewer: keep fixes small, reviewable, traceable to findings, and free of unrelated refactors or hidden scope.
- Product-minded editor: protect business logic from accidental changes and ask for rationale when product behavior changes.
- Technical program planner: split work into Beads-ready units with dependencies, blockers, and completion evidence.
- Release/migration reviewer: preserve rollout, rollback, migration, compatibility, and observability requirements.
- Skeptical clarification writer: ask only blocking questions, but ask them before inventing product decisions.

The fixer must be strict, conservative, and traceable: fix what is supported, ask when intent is unknown, and never hide disagreement by rewriting vague text into unsupported certainty.

Suggested subagent prompt for fix work:

```text
Use $spec-review-fixer as a strict senior spec editor, senior engineer, senior QA/test architect, code reviewer, product-minded editor, and Beads decomposition planner. Apply only supported fixes from the review findings. Ask blocking questions before changing business logic or unsupported scope. Keep every edit traceable to a finding.
```

## Workflow

1. Gather inputs.
   - Locate the source spec or plan.
   - Locate the review findings, coverage matrix, open questions, and recommendation.
   - If any required artifact is missing, ask for it before editing.

2. Build a fix map.
   - List each finding by ID, severity, source location, and requested change.
   - Classify each item as `direct fix`, `needs user answer`, `defer with rationale`, or `reject with rationale`.
   - For spec-plan drift, map each plan step to the related spec requirement or mark it as unsupported.
   - For Beads readiness findings, identify the exact section or step that must be decomposed.

3. Ask clarification questions before risky edits.
   - Ask only questions that block a correct revision.
   - Group related questions and explain which finding each question unblocks.
   - Prefer concrete choices when the review already implies valid options.
   - For unsupported scope that may be intentional, ask whether to add it to the spec or remove it from the plan.
   - Wait for answers before editing sections that depend on those answers.

4. Apply edits.
   - Edit the artifact in place when a file path is provided.
   - If the artifact was pasted in chat, return the revised artifact or a patch-style replacement for the affected sections.
   - Keep wording precise and testable.
   - Add or adjust acceptance criteria, verification steps, dependencies, rationale, and Beads decomposition where needed.
   - Keep the plan aligned with the spec: every material plan step must trace to a spec requirement or explicitly named technical prerequisite.
   - Remove unsupported plan scope only when the review or user clearly rejects it; otherwise ask whether the spec should be expanded.

5. Self-check before subagent review.
   - Confirm every review finding is resolved, blocked by a question, or intentionally deferred with rationale.
   - Confirm no new business logic was introduced without rationale.
   - Confirm the result is Beads-ready or explicitly states what still prevents Beads-ready decomposition.
   - Confirm the plan and spec complement each other and do not contradict.

6. Run the post-edit reviewer hook.
   - Spawn a fresh subagent with `$spec-reviewer` when subagent use is authorized and available.
   - Pass the revised artifact, the original review findings, and any user answers.
   - Ask the subagent to review only the revised artifact and report remaining blockers, spec-plan drift, business-logic rationale gaps, and Beads readiness.
   - Integrate any confirmed post-edit findings before finalizing.

## Clarification Rules

Ask the user when a fix would:

- change business logic, pricing, permissions, eligibility, calculations, lifecycle statuses, data retention, notifications, or side effects without a stated reason;
- choose between multiple valid product behaviors;
- expand or reduce scope beyond the spec;
- remove an acceptance criterion, verification requirement, migration step, or rollback requirement;
- decide how to split work into Beads issues when dependencies or ownership are unclear;
- resolve a contradiction where neither side is clearly authoritative.

Do not ask when the fix is mechanical and unambiguous, such as adding missing traceability, naming a verification command already implied by the plan, decomposing a broad step into obvious substeps, or replacing vague wording with behavior already stated elsewhere.

## Beads Decomposition Fixes

When fixing Beads readiness:

- split broad plan steps into issue-sized units with title, scope, acceptance criteria, dependencies, and verification;
- keep each unit independently closable from observable evidence;
- make prerequisites and blockers explicit;
- preserve traceability to spec requirements, plan steps, bugs, or technical prerequisites;
- when the source spec is too thin to support concrete acceptance criteria, create the decomposition skeleton and mark the missing criteria as user questions instead of inventing behavior;
- do not create actual `bd` issues unless the user explicitly asks to create them.

## Business Logic Fixes

When fixing business-logic findings, add the missing rationale instead of hiding the change. A complete rationale states:

- what rule changes;
- why the change is needed;
- who or what source authorizes it;
- what existing behavior, data, or users are affected;
- how success and regressions will be verified.

If the rationale is unavailable, ask the user instead of drafting one from assumptions.

## Post-Edit Subagent Hook

Use this hook after edits are complete and before the final response. If current tool policy requires explicit user permission to spawn subagents and the user has not granted it, ask for permission before spawning.

```text
Use $spec-reviewer as a strict independent senior technical reviewer, senior QA/test architect, code reviewer, product-minded reviewer, and Beads decomposition reviewer. Review the revised spec or plan below. Focus on remaining blockers, unresolved review findings, spec-plan drift, unexplained business-logic changes, Beads readiness, contradictions, missing acceptance criteria, and verification gaps. Report findings with severity and a coverage matrix.

Original review findings:
<paste findings or summary>

User answers:
<paste answers or "none">

Revised artifact:
<paste revised artifact or relevant file path plus changed sections>
```

If a subagent tool is unavailable or permission is not granted, perform a second-pass `$spec-reviewer` review locally and explicitly state that subagent verification could not be run.

## Output Format

Use this structure unless the user requested a different format:

```markdown
**Applied Fixes**
- `<finding ID>` - <what changed and where>

**Questions**
- `<finding ID>` - <question and why it blocks a safe edit>

**Directly Fixable**
- `<finding ID>` - <safe edit that can be made without user input>

**Deferred or Rejected**
- `<finding ID>` - <reason, if any>

**Post-Edit Review**
<subagent result summary, including remaining blockers and Beads readiness>

**Result**
<Ready / Needs user answers / Needs another revision>, with one sentence explaining why.
```

When editing a file, include the file path and changed sections. When returning a revised pasted artifact, include only the revised artifact plus the fix summary unless the user asks for a diff.
