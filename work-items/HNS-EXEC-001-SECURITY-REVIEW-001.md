# Work Item Contract

| Field | Value |
|---|---|
| Schema Version | `harness.work-item/v2` |
| ID | `HNS-EXEC-001-SECURITY-REVIEW-001` |
| Title | Independently Review HNS EXEC 001 Security Boundaries |
| Role | `REVIEWER` |
| Feature | `minimal-execution-engine` |
| Phase | `REVIEW` |
| Status | `CANCELLED` |
| Spec Version | `harness-v0.1-review` |
| Design Version | `N/A` |
| Risk Class | `HIGH` |
| Review Profile | `SECURITY_REVIEWER` |
| Reviewed Artifact | `docs/08_agent_reviews/manifests/HNS-EXEC-001-implementation.md` |
| Reviewed Artifact Hash | `sha256:2a1a7086a5614ab042e542e277a700fee5f5463a7086e2483b531741d5179b95` |
| Maker Execution ID | `EXE-HNS-EXEC-001-IMPLEMENTATION-001` |

## Objective

Independently verify HNS-EXEC-001 path, parser, dependency, immutable-state, and fail-closed security boundaries on the exact candidate.

## Requirement References

- Requirement IDs: `AC-HNS-005`, `AC-HNS-EXEC-001-002`, `AC-HNS-EXEC-001-004`
- Feature Spec: `N/A`
- Screen IDs / Screen Specs: `N/A`
- ADR: `N/A`
- Architecture / SDD sections: `docs/harness_v0.1_SDD.md` Sections 17, 38, 40.1, 46 Phase 2
- Review / Evidence references: `docs/08_agent_reviews/manifests/HNS-EXEC-001-implementation.md`

## Read Scope

- `.ai/CONSTITUTION.md`
- `.ai/AUTHORITY.md`
- `.ai/WORKFLOW.md`
- `.ai/roles/reviewer.md`
- `.ai/roles/reviewer-profiles/security-reviewer.md`
- `.ai/gates/implementation-gate.md`
- `work-items/HNS-EXEC-001.md`
- `work-items/HNS-EXEC-001-SECURITY-REVIEW-001.md`
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

- Verify repository-relative path rejection, traversal and absolute-path handling, unsafe Markdown/input behavior, dependency integrity, immutable output, diagnostic non-disclosure, and capability non-expansion.
- Use bounded canonical negative cases and dependency audit only.

## Out of Scope

- Open-ended fuzzing, arbitrary grammar taxonomies, modifying candidate artifacts, remediation, Gate approval, adapters, enforcement, or later milestone work.

## Acceptance Criteria

- [ ] `AC-HNS-EXEC-001-SECURITY-REVIEW-001-001`: Exact candidate identity, dependency provenance, and independent binding are valid.
- [ ] `AC-HNS-EXEC-001-SECURITY-REVIEW-001-002`: Traversal, absolute path, malformed review binding, unsafe scope, and hostile object boundaries fail closed without disclosure.
- [ ] `AC-HNS-EXEC-001-SECURITY-REVIEW-001-003`: Outputs remain immutable and no filesystem write, process, credential, network, adapter, enforcement, or production capability is introduced.
- [ ] `AC-HNS-EXEC-001-SECURITY-REVIEW-001-004`: Findings and decision are appended only to the review log.

## Required Gates

- `IMPLEMENTATION_GATE`

## Dependencies

- `HNS-EXEC-001`

## Blockers

- None

## Notes

- Superseded assignment: no persisted SECURITY R1 execution evidence was located in the bounded canonical log lookup; do not invent an execution or PASS. R3 provides final closure; see `LC-HNS-EXEC-001-CORRECTION-001`.
- Decision is `PASS`, `REQUEST_CHANGES`, or `BLOCK` only.
