# Work Item Contract

| Field | Value |
|---|---|
| Schema Version | `harness.work-item/v2` |
| ID | `HNS-EXEC-001-TECH-REVIEW-001` |
| Title | Independently Review HNS EXEC 001 Technical Candidate |
| Role | `REVIEWER` |
| Feature | `minimal-execution-engine` |
| Phase | `REVIEW` |
| Status | `CANCELLED` |
| Spec Version | `harness-v0.1-review` |
| Design Version | `N/A` |
| Risk Class | `HIGH` |
| Review Profile | `TECH_REVIEWER` |
| Reviewed Artifact | `docs/08_agent_reviews/manifests/HNS-EXEC-001-implementation.md` |
| Reviewed Artifact Hash | `sha256:2a1a7086a5614ab042e542e277a700fee5f5463a7086e2483b531741d5179b95` |
| Maker Execution ID | `EXE-HNS-EXEC-001-IMPLEMENTATION-001` |

## Objective

Independently verify HNS-EXEC-001 correctness, SDD compliance, dependency impact, scope, typing, and immutable candidate identity.

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
- `.ai/roles/reviewer-profiles/tech-reviewer.md`
- `.ai/gates/implementation-gate.md`
- `work-items/HNS-EXEC-001.md`
- `work-items/HNS-EXEC-001-TECH-REVIEW-001.md`
- `docs/harness_v0.1_SDD.md`
- `docs/08_agent_reviews/manifests/HNS-EXEC-001-implementation.md`
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

- Verify exact manifest hash, candidate commit, Maker/Reviewer separation, authorized diff, parser/state correctness, exact dependency, and required validation.
- Use bounded checks tied to canonical ACs and high-confidence parser/state boundaries.

## Out of Scope

- Modifying candidate artifacts, broad parser fuzzing, QA/Security substitution, remediation, Gate approval, adapters, enforcement, or later milestone work.

## Acceptance Criteria

- [ ] `AC-HNS-EXEC-001-TECH-REVIEW-001-001`: Candidate identity, dependency lock, diff scope, and separation are valid.
- [ ] `AC-HNS-EXEC-001-TECH-REVIEW-001-002`: Parser and state APIs satisfy direct SDD and Work Item requirements without unauthorized capability.
- [ ] `AC-HNS-EXEC-001-TECH-REVIEW-001-003`: Build, typecheck, complete tests, and bounded technical probes pass on the exact candidate.
- [ ] `AC-HNS-EXEC-001-TECH-REVIEW-001-004`: Findings and decision are appended only to the review log.

## Required Gates

- `IMPLEMENTATION_GATE`

## Dependencies

- `HNS-EXEC-001`

## Blockers

- None

## Notes

- Superseded assignment: historical `REV-HNS-EXEC-001-TECH-001` execution completed with `REQUEST_CHANGES`; decision/evidence retained unchanged. Incomplete ACs are not retroactively passed. R3 provides final closure; see `LC-HNS-EXEC-001-CORRECTION-001`.
- Decision is `PASS`, `REQUEST_CHANGES`, or `BLOCK` only.
