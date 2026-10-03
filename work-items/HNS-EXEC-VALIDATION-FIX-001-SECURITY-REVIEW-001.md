# Work Item Contract

| Field | Value |
|---|---|
| Schema Version | `harness.work-item/v2` |
| ID | `HNS-EXEC-VALIDATION-FIX-001-SECURITY-REVIEW-001` |
| Title | Independently Review Validation Unblock SECURITY |
| Role | `REVIEWER` |
| Feature | `minimal-execution-engine` |
| Phase | `REVIEW` |
| Status | `DONE` |
| Spec Version | `harness-v0.1-review` |
| Design Version | `N/A` |
| Risk Class | `HIGH` |
| Review Profile | `SECURITY_REVIEWER` |
| Reviewed Artifact | `docs/08_agent_reviews/manifests/HNS-EXEC-VALIDATION-FIX-001-r1.md` |
| Reviewed Artifact Hash | `sha256:ed7ed76cc0709600cd7f6a042f8069a7452080e676bc25f1d813b32daebc8f3d` |
| Maker Execution ID | `EXE-HNS-EXEC-VALIDATION-FIX-001-MAKER-001` |

## Objective

Independently review exact aggregate candidate and the two named audit findings; do not modify implementation or approve the Gate.

## Requirement References

- Requirement IDs: `AC-HNS-EXEC-VALIDATION-FIX-001-001`, `AC-HNS-EXEC-VALIDATION-FIX-001-002`, `AC-HNS-EXEC-VALIDATION-FIX-001-003`; `AC-HNS-EXEC-001-CLOSURE-TEST-FIX-001`, `AC-HNS-EXEC-001-CLOSURE-TEST-FIX-002`
- Feature Spec: `N/A`
- Screen IDs / Screen Specs: `N/A`
- ADR: `N/A`
- Architecture / SDD sections: `docs/harness_v0.1_SDD.md` Sections 38, 40.1, 43
- Review / Evidence references: `docs/08_agent_reviews/manifests/HNS-EXEC-VALIDATION-FIX-001-r1.md`; `docs/08_agent_reviews/review_log.md`

## Read Scope

- `AGENTS.md`
- `.ai/CONSTITUTION.md`
- `.ai/AUTHORITY.md`
- `.ai/WORKFLOW.md`
- `.ai/roles/reviewer.md`
- `.ai/roles/reviewer-profiles/security-reviewer.md`
- `.ai/gates/implementation-gate.md`
- `work-items/HNS-EXEC-VALIDATION-FIX-001-SECURITY-REVIEW-001.md`
- `work-items/HNS-EXEC-VALIDATION-FIX-001.md`
- `work-items/HNS-EXEC-001-CLOSURE-TEST-FIX.md`
- `work-items/HNS-EXEC-001.md`
- `docs/08_agent_reviews/manifests/HNS-EXEC-VALIDATION-FIX-001-r1.md`
- `docs/08_agent_reviews/validation/HNS-EXEC-VALIDATION-FIX-001-r1/**`
- `docs/08_agent_reviews/review_log.md` only targeted named Finding evidence
- `docs/harness_v0.1_SDD.md` only direct sections
- `harness/package.json`
- `harness/package-lock.json`
- `harness/tests/unit/work-items/parser.test.mjs`
- `harness/tests/unit/schemas/fast-uri-security.test.mjs`
- `harness/node_modules/fast-uri/**`

## Write Scope

- `docs/08_agent_reviews/review_log.md`

## Forbidden Scope

- `harness/**`
- `.ai/**`
- `work-items/**`
- `docs/08_agent_reviews/manifests/**`
- `main`

## Scope

- Verify manifest/candidate/runtime/hash identity and canonical ACs; assess closure of both named findings.
- Verify same-input Maker logs instead of duplicate complete suites where provenance/freshness permits.
- Run fresh npm audit --audit-level=high and bounded named advisory tests; verify dependency integrity and unchanged capability boundary.
- No open-ended probes, repository scans, full review history, new capabilities or repeat historical reviews.

## Out of Scope

- Implementation, remediation, final Gate approval, Context Compiler, adapters, production and Pilot.

## Acceptance Criteria

- [x] `AC-HNS-EXEC-VALIDATION-FIX-001-SECURITY-REVIEW-001-001`: Identity, independence, scope and required profile criteria verified.
- [x] `AC-HNS-EXEC-VALIDATION-FIX-001-SECURITY-REVIEW-001-002`: Candidate required validations and named findings independently assessed with bounded probes.
- [x] `AC-HNS-EXEC-VALIDATION-FIX-001-SECURITY-REVIEW-001-003`: Honest decision and evidence delivered for append-only host persistence.

## Required Gates

- `IMPLEMENTATION_GATE`

## Dependencies

- `HNS-EXEC-VALIDATION-FIX-001`

## Blockers

- Both named findings require current-candidate closure before Gate PASS.

## Notes

- Return PASS / REQUEST_CHANGES / BLOCK; parent appends returned evidence verbatim to avoid shared-log races.
- Fresh profile execution; Maker != Reviewer. Deadline 2026-10-03T21:01:07Z and existing counters do not reset.
- This is one of three required reviews, not a checker or recursive review chain. Target <=4 minutes, minimal canonical context; extra evidence on demand only.
