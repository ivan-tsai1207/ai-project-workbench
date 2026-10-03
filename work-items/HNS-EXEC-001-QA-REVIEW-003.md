# Work Item Contract

| Field | Value |
|---|---|
| Schema Version | `harness.work-item/v2` |
| ID | `HNS-EXEC-001-QA-REVIEW-003` |
| Title | Independently Validate HNS EXEC 001 Targeted R3 Acceptance |
| Role | `REVIEWER` |
| Feature | `minimal-execution-engine` |
| Phase | `REVIEW` |
| Status | `DONE` |
| Spec Version | `harness-v0.1-review` |
| Design Version | `N/A` |
| Risk Class | `HIGH` |
| Review Profile | `QA_REVIEWER` |
| Reviewed Artifact | `docs/08_agent_reviews/manifests/HNS-EXEC-001-implementation-r3.md` |
| Reviewed Artifact Hash | `sha256:52da10037915b88f9bf86a524cd5f3cf65b5e065e2333ee9e10ea4f1e036d7c1` |
| Maker Execution ID | `EXE-HNS-EXEC-001-TARGETED-REMEDIATION-R3-001` |

## Objective

Independently validate exact R3 acceptance criteria, targeted finding regression, state behavior, and complete test evidence.

## Requirement References

- Requirement IDs: `AC-HNS-005`, `AC-HNS-EXEC-001-001`, `AC-HNS-EXEC-001-002`, `AC-HNS-EXEC-001-003`, `AC-HNS-EXEC-001-004`
- Feature Spec: `N/A`
- Screen IDs / Screen Specs: `N/A`
- ADR: `N/A`
- Architecture / SDD sections: `docs/harness_v0.1_SDD.md` Sections 5.2-5.3, 17, 35, 38, 40.1, 46 Phase 2
- Review / Evidence references: `docs/08_agent_reviews/review_log.md`, `docs/08_agent_reviews/manifests/HNS-EXEC-001-implementation-r3.md`

## Read Scope

- `.ai/CONSTITUTION.md`
- `.ai/AUTHORITY.md`
- `.ai/WORKFLOW.md`
- `.ai/roles/reviewer.md`
- `.ai/roles/reviewer-profiles/qa-reviewer.md`
- `.ai/gates/implementation-gate.md`
- `work-items/HNS-EXEC-001.md`
- `work-items/HNS-EXEC-001-QA-REVIEW-003.md`
- `docs/harness_v0.1_SDD.md`
- `docs/08_agent_reviews/manifests/HNS-EXEC-001-implementation-r3.md`
- `docs/08_agent_reviews/review_log.md`
- `harness/package.json`
- `harness/package-lock.json`
- `harness/src/work-items/**`
- `harness/src/execution/state.ts`
- `harness/tests/unit/work-items/**`
- `harness/tests/unit/execution/state.test.mjs`

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

- Validate registered/matching reviewer binding, bounded invalid bindings, parser/state normal and negative behavior, deterministic immutability, test discovery, and prior CORE regressions.
- Verify exact R3 identity and direct regressions for `FND-HNS-EXEC-001-TECH-002-001` without expanding review taxonomy.

## Out of Scope

- Open-ended fuzzing, unrelated parser grammar, new attack taxonomies, candidate modification, remediation, Gate approval, Context Compiler, adapters, enforcement, or later milestone work.

## Acceptance Criteria

- [x] `AC-HNS-EXEC-001-QA-REVIEW-003-001`: All HNS-EXEC-001 ACs map to reproducible exact-R3 evidence.
- [x] `AC-HNS-EXEC-001-QA-REVIEW-003-002`: Registered reviewer binding passes and directly affected invalid bindings fail closed.
- [x] `AC-HNS-EXEC-001-QA-REVIEW-003-003`: Full and focused suites pass without failure, cancellation, skip, todo, or regression.
- [x] `AC-HNS-EXEC-001-QA-REVIEW-003-004`: Evidence and findings are appended only to the review log.

## Required Gates

- `IMPLEMENTATION_GATE`

## Dependencies

- `HNS-EXEC-001`

## Blockers

- None

## Notes

- Lifecycle normalization only: existing `REV-HNS-EXEC-001-QA-003` PASS and `IG-HNS-EXEC-001-001` support DONE. No new review or current-candidate approval; see `LC-HNS-EXEC-001-CORRECTION-001`.
- A same-finding failure stops as `TARGETED_REMEDIATION_FAILED`; a new unrelated MAJOR/BLOCKING finding stops as `NEW_MAJOR_FINDING`.
