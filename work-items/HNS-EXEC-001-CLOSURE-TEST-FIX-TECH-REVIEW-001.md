# Work Item Contract

| Field | Value |
|---|---|
| Schema Version | `harness.work-item/v2` |
| ID | `HNS-EXEC-001-CLOSURE-TEST-FIX-TECH-REVIEW-001` |
| Title | Independently Review HNS EXEC 001 Closure Test Fix TECH |
| Role | `REVIEWER` |
| Feature | `minimal-execution-engine` |
| Phase | `REVIEW` |
| Status | `TODO` |
| Spec Version | `harness-v0.1-review` |
| Design Version | `N/A` |
| Risk Class | `LOW` |
| Review Profile | `TECH_REVIEWER` |
| Reviewed Artifact | `docs/08_agent_reviews/manifests/HNS-EXEC-001-closure-test-fix.md` |
| Reviewed Artifact Hash | `sha256:8ac7accebe5addc309599ec1b2630ce99e2bd2734275935c25c26ffc71bb078b` |
| Maker Execution ID | `EXE-HNS-EXEC-001-CLOSURE-TEST-FIX-001` |

## Objective

Independently verify the exact single-line HNS-EXEC-001 closure hash test normalization and complete regression evidence.

## Requirement References

- Requirement IDs: `AC-HNS-EXEC-001-CLOSURE-TEST-FIX-001`, `AC-HNS-EXEC-001-CLOSURE-TEST-FIX-002`
- Feature Spec: `N/A`
- Screen IDs / Screen Specs: `N/A`
- ADR: `N/A`
- Architecture / SDD sections: `docs/harness_v0.1_SDD.md` Sections 17, 35, 40.1
- Review / Evidence references: `docs/08_agent_reviews/manifests/HNS-EXEC-001-closure-test-fix.md`

## Read Scope

- `.ai/CONSTITUTION.md`
- `.ai/AUTHORITY.md`
- `.ai/WORKFLOW.md`
- `.ai/roles/reviewer.md`
- `.ai/roles/reviewer-profiles/tech-reviewer.md`
- `.ai/gates/implementation-gate.md`
- `work-items/HNS-EXEC-001.md`
- `work-items/HNS-EXEC-001-CLOSURE-TEST-FIX.md`
- `work-items/HNS-EXEC-001-CLOSURE-TEST-FIX-TECH-REVIEW-001.md`
- `docs/harness_v0.1_SDD.md`
- `docs/08_agent_reviews/manifests/HNS-EXEC-001-closure-test-fix.md`
- `harness/src/work-items/**`
- `harness/tests/unit/work-items/parser.test.mjs`

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

- Verify exact candidate/manifest identity, one-line diff, canonical closed Work Item hash, focused/full tests, no source/dependency change, and no capability expansion.

## Out of Scope

- Parser redesign, new tests, source modification, remediation, Gate approval, Context Compiler, adapters, enforcement, or production execution.

## Acceptance Criteria

- [ ] `AC-HNS-EXEC-001-CLOSURE-TEST-FIX-TECH-REVIEW-001-001`: Candidate identity, scope, and independent binding are valid.
- [ ] `AC-HNS-EXEC-001-CLOSURE-TEST-FIX-TECH-REVIEW-001-002`: Canonical hash assertion and focused/full regression suites pass exactly.
- [ ] `AC-HNS-EXEC-001-CLOSURE-TEST-FIX-TECH-REVIEW-001-003`: Evidence/findings are appended only to the review log.

## Required Gates

- `IMPLEMENTATION_GATE`

## Dependencies

- `HNS-EXEC-001-CLOSURE-TEST-FIX`

## Blockers

- None

## Notes

- Decision is `PASS`, `REQUEST_CHANGES`, or `BLOCK` only.

