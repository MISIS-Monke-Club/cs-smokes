---
name: spec-reviewer
description: Use when reviewing specifications, requirements documents, design docs, implementation plans, Superpowers-generated plans, or spec-to-plan alignment for correctness, completeness, ambiguity, sequencing, feasibility, Beads-ready decomposition, business-logic rationale, contradictions, verification coverage, hidden assumptions, or missing acceptance criteria.
---

# Spec Reviewer

## Overview

Perform a rigorous review of a spec or plan before implementation. Treat the artifact as the source of truth, inspect every numbered item, heading, checklist entry, and meaningful bullet, and report both high-impact findings and explicit coverage.

## Review Contract

- Do not sample. Review the entire artifact.
- Do not silently skip low-risk sections. If a point has no issue, mark it as reviewed in the coverage matrix.
- Do not rewrite the spec or plan unless the user explicitly asks for a rewrite. Review first.
- Do not approve a document that has unresolved contradictions, missing acceptance criteria for user-visible behavior, unverifiable steps, or implementation order that can produce broken intermediate states.
- Do not approve a spec or plan that changes business logic without explaining the reason, decision owner, and intended product outcome.
- Do not approve a spec or plan that is too coarse to split into Beads issues without additional design work.
- Ground every finding in a concrete artifact location: section title, numbered item, bullet text, file path, or stable ID assigned during review.
- Separate confirmed issues from open questions. Do not present assumptions as facts.

## Reviewer Agent Profile

When invoking an agent or subagent for this skill, ask for a strict independent reviewer with senior-level technical judgment. The agent should behave like:

- Senior backend/frontend engineer: verify feasibility, architecture fit, data/API contracts, ownership boundaries, and implementation sequencing.
- Senior QA/test architect: look for missing acceptance criteria, edge cases, negative paths, regression coverage, manual QA, and verification commands.
- Code reviewer: challenge hidden coupling, broad refactors, maintainability risks, unclear ownership, and changes that are hard to review.
- Product-minded technical reviewer: identify business-logic changes, unsupported scope, product ambiguity, and missing rationale.
- Release/migration reviewer: check rollout, rollback, migrations, compatibility, observability, and broken intermediate states.
- Security/privacy reviewer when relevant: check permissions, auth, sensitive data, retention, abuse paths, and compliance-sensitive behavior.
- Beads decomposition reviewer: decide whether the artifact is split into durable issue-sized units with dependencies and completion evidence.
- Skeptical specification editor: require precise, falsifiable wording and reject vague verbs without observable behavior.

The reviewer must be rigorous, evidence-based, and non-performative: no rubber-stamping, no praise filler, no guessing intent, and no softening blocking issues. Prefer fewer high-confidence findings over broad speculation, but still show full coverage.

Suggested subagent prompt:

```text
Use $spec-reviewer as a strict senior technical reviewer, senior QA/test architect, code reviewer, product-minded reviewer, and Beads decomposition reviewer. Review the full artifact point by point. Do not rubber-stamp. Report concrete blockers, contradictions, business-logic rationale gaps, spec-plan drift, Beads readiness, and verification gaps with severity and a coverage matrix.
```

## Workflow

1. Locate the artifact.
   - If the user pasted the spec or plan, review that text.
   - If the user gave a file path, read the full relevant file before reviewing.
   - If the artifact is missing or inaccessible, ask for it directly.

2. Build a review index.
   - Preserve existing numbering when present.
   - Assign stable IDs when needed, using prefixes such as `S1`, `S1.1`, `P3`, or `B7`.
   - Include headings, numbered steps, checklist items, and bullets that define behavior, constraints, architecture, tests, rollout, or acceptance criteria.

3. Read for intent before judging.
   - Identify the goal, non-goals, affected users, constraints, dependencies, success criteria, and risk level.
   - For repository-specific plans, inspect the named files or nearby implementation patterns when local context is needed to verify feasibility.

4. Review every indexed point.
   - Check clarity: unambiguous actor, action, inputs, outputs, and expected result.
   - Check completeness: edge cases, errors, empty states, permissions, migrations, compatibility, rollout, and cleanup.
   - Check correctness: consistency with the rest of the artifact and with known project constraints.
   - Check feasibility: the step can be implemented with the available architecture, data, APIs, and ownership boundaries.
   - Check sequencing: prerequisites happen before dependents; each intermediate state remains coherent.
   - Check testability: each behavior or plan step has a concrete verification path.
   - Check scope control: no hidden refactors, unrelated work, or vague "improve/fix/handle" commands without criteria.

5. Run cross-document checks.
   - Look for duplicate or conflicting requirements.
   - Look for missing dependencies between steps.
   - Look for requirements that lack corresponding plan steps or tests.
   - Look for plan steps that implement behavior not requested by the spec.
   - When both a spec and a plan are present, verify that the plan complements the spec: every material spec requirement maps to one or more plan steps, every material plan step traces back to a spec requirement or explicitly labeled technical prerequisite, and no plan step contradicts the spec.
   - Flag drift where the plan changes scope, behavior, user workflow, data model, permissions, pricing, eligibility, calculations, statuses, notifications, retention, or side effects without explicit spec support.
   - Look for verification that proves implementation details but not user-visible outcomes.

6. Produce a review, not a generic summary.
   - Lead with actionable findings ordered by severity.
   - Include a complete coverage matrix showing every reviewed point.
   - End with an approval recommendation.

## Extra Checks for Superpowers Plans

When the artifact is a Superpowers-generated plan, additionally verify:

- The plan has small, sequential implementation steps with clear completion criteria.
- Each step names likely files, modules, commands, or behaviors precisely enough to execute.
- Tests or verification are planned before completion claims.
- The plan respects relevant skills such as TDD, systematic debugging, worktrees, code review, or verification-before-completion when those skills apply.
- Independent work is only parallelized when dependencies and shared-state risks are explicit.
- The plan includes rollback, migration, or compatibility handling when persistent data, APIs, deployments, or user workflows are affected.
- The plan does not substitute broad exploratory work for concrete implementation tasks.

## Beads Readiness

Treat Beads readiness as an approval gate for specs and plans that are meant to become tracked work.

Flag a `P1` or `P2` issue when the artifact cannot be split into durable `bd` issues without rethinking the design. A Beads-ready artifact has:

- Atomic work units: each item can become one issue with a clear title, scope, acceptance criteria, and verification command or manual check.
- Explicit dependencies: blockers, ordering, prerequisites, migrations, rollout steps, and shared files are visible instead of implied.
- Small enough slices: no item combines unrelated UI, API, data, infra, and cleanup work unless the coupling is justified.
- Clear ownership boundary: each issue has a primary module, feature area, or workflow and does not require broad repository archaeology to understand.
- Independent completion signal: each issue can be closed from observable evidence, not from a vague "integrate everything" milestone.
- Traceability: each issue links back to a spec requirement, plan step, bug, or explicitly named technical prerequisite.

When reviewing a plan, mention whether it is `Beads-ready`, `Mostly Beads-ready with fixes`, or `Not Beads-ready` in the recommendation.

## Business Logic Rationale

Flag any change to business logic that lacks an explicit reason. Business logic includes user-visible rules, permissions, pricing, eligibility, lifecycle statuses, calculations, routing, quotas, notifications, data retention, billing, moderation, compliance, and side effects.

Required rationale for a business-logic change:

- what rule changes;
- why the change is needed;
- who or what source authorizes it;
- what existing behavior, data, or users are affected;
- how success and regressions will be verified.

If a plan introduces business-logic changes that are absent from the spec, treat that as spec-plan drift unless the plan labels the change as an open question or explicitly requests a spec update.

## Severity

- `P0`: The spec or plan is unsafe to execute; likely data loss, security issue, broken production flow, or impossible architecture.
- `P1`: A major correctness, completeness, sequencing, or verification gap that should block approval.
- `P2`: A meaningful ambiguity, missing edge case, or maintainability risk that should be fixed before serious implementation.
- `P3`: Minor clarity, polish, or local improvement that does not block implementation.

## Output Format

Use this structure unless the user requested a different format:

```markdown
**Findings**
- `[P1] <short title>` - <artifact location>: <specific problem, why it matters, and what should change>
- `[P2] <short title>` - <artifact location>: <specific problem, why it matters, and what should change>

**Coverage Matrix**
| ID | Point | Status | Notes |
| --- | --- | --- | --- |
| S1 | <short paraphrase> | OK | Reviewed; no issue found. |
| S2 | <short paraphrase> | Issue | See P1 finding. |
| S3 | <short paraphrase> | Question | Needs product/technical clarification. |

**Open Questions**
- <question that must be answered before approval, if any>

**Recommendation**
<Approve / Approve with P2/P3 fixes / Revise before implementation / Blocked>, plus Beads readiness status, with one sentence explaining why.
```

If there are no findings, explicitly say `No blocking findings` and still provide the complete coverage matrix. Keep summaries brief; the matrix is the evidence that every point was reviewed.

## Review Standards

- Prefer precise, falsifiable criticism over style preferences.
- Flag vague verbs such as "handle", "support", "improve", "optimize", or "integrate" when they lack concrete behavior.
- Flag missing negative cases: invalid input, partial failure, retries, concurrency, stale data, permissions, cancellations, timeouts, and idempotency.
- Flag unowned decisions: product choices, UX tradeoffs, API contracts, data retention, observability, rollout, and migration strategy.
- Flag verification gaps: tests that do not exercise the promised behavior, no manual QA path for UI work, no migration test for data changes, or no regression coverage for prior bugs.
- For implementation plans, flag steps that are too large to review, combine unrelated changes, or make completion unverifiable.
