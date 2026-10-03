# Work Item Contract

| Field | Value |
|---|---|
| Schema Version | `harness.work-item/v2` |
| ID | `HNS-EXEC-VALIDATION-FIX-001` |
| Title | Unblock Exact Runtime Validation and Dependency Audit |
| Role | `IMPLEMENTER` |
| Feature | `minimal-execution-engine` |
| Phase | `IMPLEMENTATION` |
| Status | `TODO` |
| Spec Version | `harness-v0.1-review` |
| Design Version | `N/A` |
| Risk Class | `HIGH` |
| Review Profile | `N/A` |
| Reviewed Artifact | `N/A` |
| Reviewed Artifact Hash | `N/A` |
| Maker Execution ID | `N/A` |

## Objective

Resolve the two known dependency-audit findings and restore exact-runtime validation, preserving the existing one-line closure hash fix and all prior evidence.

## Requirement References

- Requirement IDs: `AC-HNS-EXEC-VALIDATION-FIX-001-001`, `AC-HNS-EXEC-VALIDATION-FIX-001-002`, `AC-HNS-EXEC-VALIDATION-FIX-001-003`
- Feature Spec: `N/A`
- Screen IDs / Screen Specs: `N/A`
- ADR: `N/A`
- Architecture / SDD sections: `docs/harness_v0.1_SDD.md` Sections 38, 40.1, 43
- Review / Evidence references: `FND-HNS-EXEC-001-CLOSURE-TEST-FIX-TECH-001-001`, `FND-HNS-EXEC-001-CLOSURE-TEST-FIX-QA-001-001`; `.ai/WORKFLOW.md#bounded-execution-economy`

## Read Scope

- `AGENTS.md`
- `.ai/CONSTITUTION.md`
- `.ai/AUTHORITY.md`
- `.ai/WORKFLOW.md`
- `.ai/roles/implementer.md`
- `.ai/gates/implementation-gate.md`
- `work-items/HNS-EXEC-VALIDATION-FIX-001.md`
- `work-items/HNS-EXEC-001-CLOSURE-TEST-FIX.md`
- `work-items/HNS-EXEC-001.md`
- `docs/harness_v0.1_SDD.md`
- `docs/08_agent_reviews/review_log.md`
- `harness/package.json`
- `harness/package-lock.json`
- `harness/tests/unit/work-items/parser.test.mjs`
- `harness/tests/unit/schemas/**`
- `harness/node_modules/fast-uri/**`

## Write Scope

- `harness/package-lock.json`
- `harness/tests/unit/schemas/fast-uri-security.test.mjs`

## Forbidden Scope

- `.ai/**`
- `AGENTS.md`
- `LLM_OPERATING_RULES.md`
- `docs/**`
- `templates/**`
- `work-items/**`
- `harness/src/**`
- `harness/package.json`
- `harness/tests/unit/work-items/**`
- `harness/src/adapters/**`
- `main`

## Scope

- Update only the locked transitive `fast-uri@3.1.6` to the minimum compatible patched `3.1.8`, satisfying unchanged Ajv `^3.0.1`; no direct dependency, override, unrelated update or audit waiver.
- Add only bounded regression tests for the three named advisories and representative benign URI behavior. Use actual published API semantics; no fuzzing or generalized URI grammar work.
- Validate `npm ci`, build, typecheck, full tests, focused parser/security tests and `npm audit --audit-level=high` on exact Node v24.19.0/npm 11.17.0.
- Preserve the inherited parser test blob `ad9f1723c3cbb431c4d5470eef186475c1444379` exactly. It was merged with the historical implementation/review records from `origin/fix/hns-exec-001-closure-hash-test`; no redo or squash.
- Current candidate manifest must bind the lockfile, new security tests and inherited parser hash fix for fresh reviews. Old REQUEST_CHANGES evidence stays unchanged; closure of both findings requires current exact-hash independent evidence and a fresh Gate.

## Out of Scope

- Context Compiler, Risk/Profile/Gate/Audit modules, adapters, Pilot, runtime budget enforcement, architectural or governance changes, source redesign, new dependency families or production execution.

## Acceptance Criteria

- [ ] `AC-HNS-EXEC-VALIDATION-FIX-001-001`: Only `fast-uri` lock metadata changes to 3.1.8; clean install reproduces it, Ajv/direct dependencies remain unchanged and current high-level audit passes.
- [ ] `AC-HNS-EXEC-VALIDATION-FIX-001-002`: Named URI security regressions and benign cases pass, all existing tests remain enabled/passing, and inherited closed Work Item hash assertion remains exact.
- [ ] `AC-HNS-EXEC-VALIDATION-FIX-001-003`: No source, capability, governance or unrelated dependency change; current candidate receives required independent reviews, finding closure, Implementation Gate, merge and exact-runtime post-merge validation.

## Required Gates

- `IMPLEMENTATION_GATE`

## Dependencies

- `HNS-EXEC-001`
- `HNS-EXEC-001-CLOSURE-TEST-FIX` inherited implementation (closure pending audit correction)

## Blockers

- The two referenced MAJOR/OPEN findings are this Work Item's explicit correction subject, not accepted risk.

## Notes

- Human authorization: continue the unfinished work; this separately scoped dependency correction addresses the previously reported security blocker. Do not expand the old test-only Work Item's write permissions or reset its historical attempts.
- Risk HIGH: security dependency correction; required TECH_REVIEWER and QA_REVIEWER, with SECURITY_REVIEWER activated by the existing vulnerability findings. R=3, G=0; max 8 Agent executions including at most one remediation/re-review cycle. Initial planned use is Maker+3 independent profiles=4.
- Batch: this primary Work Item only, including inherited hash-fix validation/closure handoff. Stop after this batch; do not start HNS-EXEC-002/003/004 or runtime enforcement.
- Origin `2026-10-03T20:31:07Z`; WI elapsed/aggregate active caps 30 minutes, WI deadline `2026-10-03T21:01:07Z`; batch wallclock cap 60 minutes, deadline `2026-10-03T21:31:07Z`. Preserve counters and clocks on retries/resume. Target 30,000 aggregate tokens; actual/remaining null without complete host telemetry. No hard-token guarantee.
- Context operational target: 16 files / 24 sections / 64 KiB, canonical mandatory context intact; historical log retrieved only by the two Finding IDs. Bounded development package-registry access is allowed for the named package/install/audit; no external integration or credentials added.
- Required profiles may verify same-candidate durable Maker command logs instead of duplicate full suites when exact inputs/runtime/freshness match; each fresh review still performs its profile-specific verification. Fresh security audit and post-merge canonical commands remain required.
- Advisory sources: `https://github.com/advisories/GHSA-qw65-cvwx-89v3`, `https://github.com/advisories/GHSA-58mr-gqgx-xq4g`, `https://github.com/advisories/GHSA-hrr3-gc8f-f4qj`. Current reviewed upstream patch lines identify 3.1.8 as covering all three; do not stop at 3.1.7.
