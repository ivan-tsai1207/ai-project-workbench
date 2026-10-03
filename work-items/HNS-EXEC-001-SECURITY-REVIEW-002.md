# Work Item Contract

| Field | Value |
|---|---|
| Schema Version | `harness.work-item/v2` |
| ID | `HNS-EXEC-001-SECURITY-REVIEW-002` |
| Title | Independently Review HNS EXEC 001 R2 Security Boundaries |
| Role | `REVIEWER` |
| Feature | `minimal-execution-engine` |
| Phase | `REVIEW` |
| Status | `CANCELLED` |
| Spec Version | `harness-v0.1-review` |
| Design Version | `N/A` |
| Risk Class | `HIGH` |
| Review Profile | `SECURITY_REVIEWER` |
| Reviewed Artifact | `docs/08_agent_reviews/manifests/HNS-EXEC-001-implementation-r2.md` |
| Reviewed Artifact Hash | `sha256:1eddcedd96d643ecd27db655b61161d9985fe987aebf8f431c81f2759f344b9b` |
| Maker Execution ID | `EXE-HNS-EXEC-001-REMEDIATION-R2-001` |

## Objective

Independently verify R2 path, scope, reference, dependency, immutable-state, and capability boundaries on the exact candidate.

## Requirement References

- Requirement IDs: `AC-HNS-005`, `AC-HNS-EXEC-001-001`, `AC-HNS-EXEC-001-002`, `AC-HNS-EXEC-001-003`, `AC-HNS-EXEC-001-004`
- Feature Spec: `N/A`
- Screen IDs / Screen Specs: `N/A`
- ADR: `N/A`
- Architecture / SDD sections: `docs/harness_v0.1_SDD.md` Sections 5.2-5.3, 17, 35, 38, 40.1, 46 Phase 2
- Review / Evidence references: `docs/08_agent_reviews/review_log.md`, `docs/08_agent_reviews/manifests/HNS-EXEC-001-implementation-r2.md`

## Read Scope

- `.ai/CONSTITUTION.md`
- `.ai/AUTHORITY.md`
- `.ai/WORKFLOW.md`
- `.ai/roles/reviewer.md`
- `.ai/roles/reviewer-profiles/security-reviewer.md`
- `.ai/gates/implementation-gate.md`
- `work-items/HNS-EXEC-001.md`
- `work-items/HNS-EXEC-001-SECURITY-REVIEW-002.md`
- `docs/harness_v0.1_SDD.md`
- `docs/08_agent_reviews/manifests/HNS-EXEC-001-implementation-r2.md`
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

- Verify traversal/absolute path rejection, unsupported glob rejection, contradictory scope detection, missing-target fail-closed behavior, dependency integrity, immutable output, and non-expansion.
- Validate closure of `FND-HNS-EXEC-001-TECH-001-001`, `FND-HNS-EXEC-001-TECH-001-002`, and `FND-HNS-EXEC-001-TECH-001-003` where applicable, plus known-risk regressions.

## Out of Scope

- Candidate modification, open-ended fuzzing, speculative grammar taxonomies, remediation, Gate approval, adapters, enforcement, or later milestone work.

## Acceptance Criteria

- [ ] `AC-HNS-EXEC-001-SECURITY-REVIEW-002-001`: Exact R2 identity, dependency provenance, and independent binding are valid.
- [ ] `AC-HNS-EXEC-001-SECURITY-REVIEW-002-002`: R1 security-relevant findings close with bounded adjacent negative controls.
- [ ] `AC-HNS-EXEC-001-SECURITY-REVIEW-002-003`: No filesystem write, broad scan, process, credential, network, adapter, enforcement, or production capability is introduced.
- [ ] `AC-HNS-EXEC-001-SECURITY-REVIEW-002-004`: Evidence and findings are appended only to the review log.

## Required Gates

- `IMPLEMENTATION_GATE`

## Dependencies

- `HNS-EXEC-001`

## Blockers

- None

## Notes

- Superseded assignment: no persisted SECURITY R2 execution evidence was located in the bounded canonical log lookup; do not invent an execution or PASS. R3 provides final closure; see `LC-HNS-EXEC-001-CORRECTION-001`.
- Decision is `PASS`, `REQUEST_CHANGES`, or `BLOCK` only; a new MAJOR/BLOCKING generalized finding triggers the review-loop stop rule.
