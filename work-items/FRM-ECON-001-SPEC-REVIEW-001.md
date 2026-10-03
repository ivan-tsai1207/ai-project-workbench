# Work Item Contract

| Field | Value |
|---|---|
| Schema Version | `harness.work-item/v2` |
| ID | `FRM-ECON-001-SPEC-REVIEW-001` |
| Title | Review Bounded Framework Execution Policy |
| Role | `REVIEWER` |
| Feature | `execution-economy` |
| Phase | `REVIEW` |
| Status | `TODO` |
| Spec Version | `execution-economy-v1` |
| Design Version | `N/A` |
| Risk Class | `MEDIUM` |
| Review Profile | `SPEC_REVIEWER` |
| Reviewed Artifact | `docs/08_agent_reviews/manifests/FRM-ECON-001-spec-r1.md` |
| Reviewed Artifact Hash | `sha256:08afbdc8fbd3334dd3e6dc85c88ded95448c72c16c2bd6329fe4cdd4d4b44c2d` |
| Maker Execution ID | `EXE-FRM-ECON-001-MAKER-001` |

## Objective

Independently verify the exact bounded-execution specification candidate, its consistency with canonical governance, and the required normal/boundary/negative scenario evidence.

## Requirement References

- Requirement IDs: `AC-FRM-ECON-001-001`, `AC-FRM-ECON-001-002`, `AC-FRM-ECON-001-003`, `AC-FRM-ECON-001-004`
- Feature Spec: `N/A`
- Screen IDs / Screen Specs: `N/A`
- ADR: `N/A`
- Architecture / SDD sections: `docs/harness_v0.1_SDD.md` Section 43
- Review / Evidence references: `docs/08_agent_reviews/manifests/FRM-ECON-001-spec-r1.md`, `docs/09_session_logs/2026-10-04-execution-economy.md`

## Read Scope

- `AGENTS.md`
- `.ai/CONSTITUTION.md`
- `.ai/AUTHORITY.md`
- `.ai/WORKFLOW.md`
- `.ai/HARNESS_CONTRACT.md`
- `.ai/roles/reviewer.md`
- `.ai/roles/reviewer-profiles/spec-reviewer.md`
- `.ai/gates/spec-gate.md`
- `LLM_OPERATING_RULES.md`
- `templates/Work_Item.md`
- `docs/harness_v0.1_SDD.md`
- `docs/09_session_logs/2026-10-04-execution-economy.md`
- `docs/08_agent_reviews/manifests/FRM-ECON-001-spec-r1.md`
- `work-items/FRM-ECON-001.md`
- `work-items/FRM-ECON-001-SPEC-REVIEW-001.md`

## Write Scope

- `docs/08_agent_reviews/review_log.md`

## Forbidden Scope

- `.ai/**`
- `AGENTS.md`
- `LLM_OPERATING_RULES.md`
- `templates/**`
- `work-items/**`
- `harness/**`
- `docs/harness_v0.1_SDD.md`
- `docs/09_session_logs/**`
- `docs/08_agent_reviews/manifests/**`
- `main`

## Scope

- Verify exact manifest/candidate identity, scope, Maker separation, canonical authority and AC mapping.
- Review finite primary/generated execution budgets, non-resetting counters, time limits, telemetry fallback, narrower context selection, required reviewer routing, evidence reuse boundaries, remediation/stop rules, scoped closure corrections and preserved security blockers.
- Check the 13 bounded scenarios already supplied by Maker, plus only directly necessary high-confidence counterexamples; no history retrieval or generalized probing matrix.

## Out of Scope

- Editing the candidate, authoring policy, risk downgrade, implementation/dependency remediation, npm tests, runtime enforcement, Gate approval or milestone continuation.

## Acceptance Criteria

- [ ] `AC-FRM-ECON-001-SPEC-REVIEW-001-001`: Exact candidate hashes, assigned primary profile, scope and independence are verified.
- [ ] `AC-FRM-ECON-001-SPEC-REVIEW-001-002`: Policy ACs and bounded scenarios pass without governance/security bypass or contradictory defaults.
- [ ] `AC-FRM-ECON-001-SPEC-REVIEW-001-003`: Findings, limitations and decision are recorded with artifact binding and actual independent execution identity.

## Required Gates

- `SPEC_GATE`

## Dependencies

- `FRM-ECON-001`

## Blockers

- None for this review; the separate execution-milestone dependency blocker remains outside this candidate.

## Notes

- Reviewer execution: `EXE-FRM-ECON-001-SPEC-REVIEW-001`; fresh independent context, one primary profile.
- Shared parent batch allocation: R=1, G=0, 4 execution cap; Maker used 1, this review uses 1, leaving at most 2 for one remediation/re-review. Do not reset counters or start a successor batch.
- Conservative parent wallclock origin `2026-10-03T19:45:00Z`; WI deadline `2026-10-03T20:15:00Z`, batch deadline `2026-10-03T20:45:00Z`. Token target 30,000, actual/remaining unknown; finite count/time fallback. Required checks must fit remaining allocation.
- Return independent evidence for controller-only persistence in the assigned log; no concurrent artifact writes. Decision is `PASS`, `REQUEST_CHANGES` or `BLOCK`, never a GateResult.
