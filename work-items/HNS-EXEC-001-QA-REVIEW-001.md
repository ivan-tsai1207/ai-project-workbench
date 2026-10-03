# Work Item Contract

| Field | Value |
|---|---|
| Schema Version | `harness.work-item/v2` |
| ID | `HNS-EXEC-001-QA-REVIEW-001` |
| Title | Independently Validate HNS EXEC 001 Acceptance and Regression |
| Role | `REVIEWER` |
| Feature | `minimal-execution-engine` |
| Phase | `REVIEW` |
| Status | `CANCELLED` |
| Spec Version | `harness-v0.1-review` |
| Design Version | `N/A` |
| Risk Class | `HIGH` |
| Review Profile | `QA_REVIEWER` |
| Reviewed Artifact | `docs/08_agent_reviews/manifests/HNS-EXEC-001-implementation.md` |
| Reviewed Artifact Hash | `sha256:2a1a7086a5614ab042e542e277a700fee5f5463a7086e2483b531741d5179b95` |
| Maker Execution ID | `EXE-HNS-EXEC-001-IMPLEMENTATION-001` |

## Objective

Independently validate HNS-EXEC-001 acceptance criteria, negative behavior, state transitions, test discovery, and prior CORE regression on the exact candidate.

## Requirement References

- Requirement IDs: `AC-HNS-005`, `AC-HNS-EXEC-001-001`, `AC-HNS-EXEC-001-002`, `AC-HNS-EXEC-001-003`, `AC-HNS-EXEC-001-004`
- Feature Spec: `N/A`
- Screen IDs / Screen Specs: `N/A`
- ADR: `N/A`
- Architecture / SDD sections: `docs/harness_v0.1_SDD.md` Sections 5.2-5.3, 17, 35, 40.1, 46 Phase 2
- Review / Evidence references: `docs/08_agent_reviews/manifests/HNS-EXEC-001-implementation.md`

## Read Scope

- `.ai/CONSTITUTION.md`
- `.ai/AUTHORITY.md`
- `.ai/WORKFLOW.md`
- `.ai/roles/reviewer.md`
- `.ai/roles/reviewer-profiles/qa-reviewer.md`
- `.ai/gates/implementation-gate.md`
- `work-items/HNS-EXEC-001.md`
- `work-items/HNS-EXEC-001-QA-REVIEW-001.md`
- `docs/harness_v0.1_SDD.md`
- `docs/08_agent_reviews/manifests/HNS-EXEC-001-implementation.md`
- `harness/src/work-items/**`
- `harness/src/execution/state.ts`
- `harness/tests/**`

## Write Scope

- `docs/08_agent_reviews/review_log.md`

## Forbidden Scope

- `.ai/**`
- `templates/**`
- `work-items/**`
- `harness/**`
- `docs/02_product/**`
- `docs/03_requirements/**`
- `docs/04_system/**`
- `docs/08_agent_reviews/manifests/**`

## Scope

- Validate all four ACs with normal, boundary, negative, malformed, transition, immutability, deterministic, and regression cases.
- Confirm required suites run without skipped or hidden tests and use bounded high-confidence probes only.

## Out of Scope

- Modifying tests/source, broad fuzzing, TECH/Security substitution, remediation, Gate approval, adapters, enforcement, or later milestone work.

## Acceptance Criteria

- [ ] `AC-HNS-EXEC-001-QA-REVIEW-001-001`: Every HNS-EXEC-001 AC maps to reproducible tests on the exact candidate.
- [ ] `AC-HNS-EXEC-001-QA-REVIEW-001-002`: Normal, boundary, malformed, negative, recovery, deterministic, and immutable behavior passes.
- [ ] `AC-HNS-EXEC-001-QA-REVIEW-001-003`: Full suite passes with no failure, cancellation, skip, todo, or prior CORE regression.
- [ ] `AC-HNS-EXEC-001-QA-REVIEW-001-004`: Findings and decision are appended only to the review log.

## Required Gates

- `IMPLEMENTATION_GATE`

## Dependencies

- `HNS-EXEC-001`

## Blockers

- None

## Notes

- Superseded assignment: no persisted QA R1 execution evidence was located in the bounded canonical log lookup; do not invent an execution or PASS. R3 provides final closure; see `LC-HNS-EXEC-001-CORRECTION-001`.
- Decision is `PASS`, `REQUEST_CHANGES`, or `BLOCK` only.
