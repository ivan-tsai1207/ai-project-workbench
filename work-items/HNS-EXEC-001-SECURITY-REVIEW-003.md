# Work Item Contract

| Field | Value |
|---|---|
| Schema Version | `harness.work-item/v2` |
| ID | `HNS-EXEC-001-SECURITY-REVIEW-003` |
| Title | Independently Review HNS EXEC 001 Targeted R3 Security |
| Role | `REVIEWER` |
| Feature | `minimal-execution-engine` |
| Phase | `REVIEW` |
| Status | `DONE` |
| Spec Version | `harness-v0.1-review` |
| Design Version | `N/A` |
| Risk Class | `HIGH` |
| Review Profile | `SECURITY_REVIEWER` |
| Reviewed Artifact | `docs/08_agent_reviews/manifests/HNS-EXEC-001-implementation-r3.md` |
| Reviewed Artifact Hash | `sha256:52da10037915b88f9bf86a524cd5f3cf65b5e065e2333ee9e10ea4f1e036d7c1` |
| Maker Execution ID | `EXE-HNS-EXEC-001-TARGETED-REMEDIATION-R3-001` |

## Objective

Independently verify exact R3 reviewed-artifact binding, path/hash fail-closed behavior, dependency trust, and capability boundaries.

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
- `.ai/roles/reviewer-profiles/security-reviewer.md`
- `.ai/gates/implementation-gate.md`
- `work-items/HNS-EXEC-001.md`
- `work-items/HNS-EXEC-001-SECURITY-REVIEW-003.md`
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

- Validate registered target and exact SHA metadata, nonexistent/unregistered/traversal/absolute/unsupported/malformed/mismatched bindings, immutable outputs, and no capability expansion.
- Verify exact R3 identity and direct regressions for `FND-HNS-EXEC-001-TECH-002-001` without expanding review taxonomy.

## Out of Scope

- Open-ended fuzzing, unrelated parser grammar, new attack taxonomies, candidate modification, remediation, Gate approval, Context Compiler, adapters, enforcement, or later milestone work.

## Acceptance Criteria

- [x] `AC-HNS-EXEC-001-SECURITY-REVIEW-003-001`: R3 identity, manifest hash, dependency provenance, and independent binding are valid.
- [x] `AC-HNS-EXEC-001-SECURITY-REVIEW-003-002`: Targeted finding closes across canonical positive and bounded negative security cases.
- [x] `AC-HNS-EXEC-001-SECURITY-REVIEW-003-003`: No scan, filesystem write, process, credential, network, adapter, enforcement, or production capability is introduced.
- [x] `AC-HNS-EXEC-001-SECURITY-REVIEW-003-004`: Evidence and findings are appended only to the review log.

## Required Gates

- `IMPLEMENTATION_GATE`

## Dependencies

- `HNS-EXEC-001`

## Blockers

- None

## Notes

- Lifecycle normalization only: existing `REV-HNS-EXEC-001-SECURITY-003` PASS and `IG-HNS-EXEC-001-001` support DONE. No new review or current-candidate approval; see `LC-HNS-EXEC-001-CORRECTION-001`.
- A same-finding failure stops as `TARGETED_REMEDIATION_FAILED`; a new unrelated MAJOR/BLOCKING finding stops as `NEW_MAJOR_FINDING`.
