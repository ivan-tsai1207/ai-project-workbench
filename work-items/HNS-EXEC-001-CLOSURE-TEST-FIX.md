# Work Item Contract

| Field | Value |
|---|---|
| Schema Version | `harness.work-item/v2` |
| ID | `HNS-EXEC-001-CLOSURE-TEST-FIX` |
| Title | Normalize HNS EXEC 001 Closure Hash Regression |
| Role | `IMPLEMENTER` |
| Feature | `minimal-execution-engine` |
| Phase | `IMPLEMENTATION` |
| Status | `TODO` |
| Spec Version | `harness-v0.1-review` |
| Design Version | `N/A` |
| Risk Class | `LOW` |
| Review Profile | `N/A` |
| Reviewed Artifact | `N/A` |
| Reviewed Artifact Hash | `N/A` |
| Maker Execution ID | `N/A` |

## Objective

Restore the deterministic HNS-EXEC-001 parser test after canonical lifecycle closure changed the assigned Work Item document from `TODO` to `DONE`.

## Requirement References

- Requirement IDs: `AC-HNS-EXEC-001-001`
- Feature Spec: `N/A`
- Screen IDs / Screen Specs: `N/A`
- ADR: `N/A`
- Architecture / SDD sections: `docs/harness_v0.1_SDD.md` Sections 17, 35, 40.1
- Review / Evidence references: `docs/08_agent_reviews/review_log.md`

## Read Scope

- `.ai/CONSTITUTION.md`
- `.ai/AUTHORITY.md`
- `.ai/WORKFLOW.md`
- `.ai/roles/implementer.md`
- `.ai/gates/implementation-gate.md`
- `docs/harness_v0.1_SDD.md`
- `docs/08_agent_reviews/review_log.md`
- `work-items/HNS-EXEC-001.md`
- `work-items/HNS-EXEC-001-CLOSURE-TEST-FIX.md`
- `harness/src/work-items/**`
- `harness/tests/unit/work-items/parser.test.mjs`
- `harness/package.json`
- `harness/package-lock.json`

## Write Scope

- `harness/tests/unit/work-items/parser.test.mjs`

## Forbidden Scope

- `.ai/**`
- `docs/**`
- `templates/**`
- `work-items/**`
- `harness/src/**`
- `harness/package.json`
- `harness/package-lock.json`
- `harness/tests/unit/context/**`
- `harness/tests/unit/config/**`
- `harness/tests/unit/core/**`
- `harness/tests/unit/errors/**`
- `harness/tests/unit/execution/**`
- `harness/tests/unit/schemas/**`
- `main`

## Scope

- Recompute the canonical SHA-256 for the closed `HNS-EXEC-001.md` document and update only the exact deterministic parser assertion.
- Preserve all parser behavior and every existing positive/negative test.

## Out of Scope

- Source changes, parser redesign, context compiler changes, new test cases, dependency changes, adapters, enforcement, or production execution.

## Acceptance Criteria

- [ ] `AC-HNS-EXEC-001-CLOSURE-TEST-FIX-001`: The exact expected document hash matches the canonical closed `HNS-EXEC-001.md` bytes.
- [ ] `AC-HNS-EXEC-001-CLOSURE-TEST-FIX-002`: Focused parser tests and the complete suite pass without source, dependency, or unrelated test changes.

## Required Gates

- `IMPLEMENTATION_GATE`

## Dependencies

- `HNS-EXEC-001`

## Blockers

- None

## Notes

- Required independent profiles: `TECH_REVIEWER`, `QA_REVIEWER`.
