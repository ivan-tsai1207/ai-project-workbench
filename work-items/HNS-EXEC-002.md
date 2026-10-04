# Work Item Contract

| Field | Value |
|---|---|
| Schema Version | `harness.work-item/v2` |
| ID | `HNS-EXEC-002` |
| Title | Implement Minimal Deterministic Context Compiler |
| Role | `IMPLEMENTER` |
| Feature | `minimal-execution-engine` |
| Phase | `IMPLEMENTATION` |
| Status | `DONE` |
| Spec Version | `harness-v0.1-review` |
| Design Version | `N/A` |
| Risk Class | `HIGH` |
| Review Profile | `N/A` |
| Reviewed Artifact | `N/A` |
| Reviewed Artifact Hash | `N/A` |
| Maker Execution ID | `N/A` |

## Objective

Implement the deterministic least-context compiler needed to assemble a bounded execution context for the first real-project Pilot.

## Requirement References

- Requirement IDs: `AC-HNS-021`, `AC-HNS-023`, `AC-HNS-024`
- Feature Spec: `N/A`
- Screen IDs / Screen Specs: `N/A`
- ADR: `N/A`
- Architecture / SDD sections: `docs/harness_v0.1_SDD.md` Sections 5.3, 18, 31, 38, 40.1, 43, 46 Phase 3
- Review / Evidence references: `HNS-EXEC-001`

## Read Scope

- `.ai/CONSTITUTION.md`
- `.ai/AUTHORITY.md`
- `.ai/WORKFLOW.md`
- `.ai/HARNESS_CONTRACT.md`
- `.ai/roles/implementer.md`
- `.ai/gates/implementation-gate.md`
- `docs/harness_v0.1_SDD.md`
- `work-items/HNS-EXEC-001.md`
- `work-items/HNS-EXEC-002.md`
- `harness/src/core/**`
- `harness/src/errors/**`
- `harness/src/work-items/**`
- `harness/src/context/**`
- `harness/tests/**`

## Write Scope

- `harness/src/context/**`
- `harness/src/index.ts`
- `harness/tests/unit/context/**`
- `harness/tests/fixtures/context/**`

## Forbidden Scope

- `.ai/**`
- `docs/**`
- `templates/**`
- `work-items/**`
- `harness/package.json`
- `harness/package-lock.json`
- `harness/src/policy/**`
- `harness/src/risk/**`
- `harness/src/gates/**`
- `harness/src/audit/**`
- `harness/src/adapters/**`
- `harness/src/enforcement/**`
- `main`

## Scope

- Compile Tier 0 and Tier 1 context entries from explicitly supplied repository-relative sources and section references.
- Enforce normalized in-repository paths, read/forbidden scope, file/section/byte budgets, hard ceilings, deduplication, deterministic ordering, and content hashes.
- Extract Markdown sections by AST heading structure and record deterministic full-document fallback reasons only when required.
- Authorize or deny bounded Tier 2 requests against read scope, forbidden scope, policy read boundary, and remaining budget; return immutable before/after hashes suitable for audit.

## Out of Scope

- Policy compilation, filesystem write enforcement, vendor token counting, broad repository discovery, adapters, network access, or runtime process launch.

## Acceptance Criteria

- [x] `AC-HNS-EXEC-002-001`: Identical inputs produce byte-identical immutable manifests and context hashes independent of caller ordering.
- [x] `AC-HNS-EXEC-002-002`: Tier selection, section extraction, deduplication, unrelated-file exclusion, and bounded large-repository behavior follow Sections 18 and 43.
- [x] `AC-HNS-EXEC-002-003`: Path escape, forbidden/sensitive input, concurrent hash drift, unresolved required context, and budget overflow fail closed without leaking content.
- [x] `AC-HNS-EXEC-002-004`: On-demand load, deny, and defer decisions are deterministic and include audit-ready hash and budget deltas without expanding permissions.

## Required Gates

- `IMPLEMENTATION_GATE`

## Dependencies

- `HNS-EXEC-001`

## Blockers

- None

## Notes

- Lifecycle closure `LC-HNS-EXEC-002-001`: exact R2 independent TECH/QA/SECURITY REVIEW-003 PASS and `IG-HNS-EXEC-002-002` PASS; normal merge `efe5530e178a91974a2759293201f7417f65b1f1` and fresh exact-runtime postmerge ci/build/typecheck/test181/context11/audithigh0 PASS. Two original MAJOR/BLOCKING Findings RESOLVED; nonblocking context observation retained OPEN. Superseded R2 review assignments CANCELLED with original BLOCK decisions preserved, not rewritten as PASS. Stop after this Work Item; EXEC-003/004 and adapters/Pilot remain pending.
- Human merge/closure increment `HNS-EXEC-002-CLOSURE-ALLOCATION-001`: user approved the proposed last5-minute continuation by saying proceed. Origin `2026-10-04T02:27:02.610Z`, deadline `2026-10-04T02:32:02.610Z`; at most5minutes elapsed/cumulative host activity, no new Reviewer/Maker dispatch, no remediation/retry or implementation changes. Preserve previous8/8 and1/1 plus review-only3/3 and1806.565-second exhaustion checkpoint; historical aggregate/token totals remain unknown, not zero. Only normal merge of unchanged reviewed R2, exact-runtime complete postmerge validation plus separate context tests, DONE/evidence normalization and normalpush/remoteHEAD verification. Any divergence/failure/timeout stops. Stop afterEXEC-002; no successors/adapters/Pilot.
- Human review-only continuation `HNS-EXEC-002-RESUME-002`: user approved the proposed finite increment by asking to proceed. Origin `2026-10-03T21:58:48.089Z`, elapsed deadline `2026-10-03T22:28:48.089Z`; elapsed and cumulative host/reviewer activity each <=30 minutes. Exactly at most 3 new independent TECH/QA/SECURITY attempts, no retries, no new Maker/source remediation. Each reviewer <=6 minutes activity; host activity plus sum of reviewer dispatch-to-completion intervals counted conservatively. Token TARGET20,000; actual/remaining null without full telemetry. Prior 8/8 attempts, 1/1 remediation and unknown historical totals remain unchanged, not reset. Only verify/close `FND-HNS-EXEC-002-QA-001-001` and `FND-HNS-EXEC-002-SECURITY-001-001` against unchanged R2 candidate, canonical ACs and affected boundaries. Non-PASS/new MAJOR/BLOCKING or exhausted allocation stops Human. All PASS permits Implementation Gate, normal merge develop, exact-runtime postmerge validation and lifecycle closure; stop after EXEC-002, no EXEC-003/004 or adapters.
- Required independent profiles: `TECH_REVIEWER`, `QA_REVIEWER`, `SECURITY_REVIEWER`.
- Human continuation allocation `HNS-EXEC-002-RESUME-001`: user answered continue to the proposed finite successor allocation. Additional origin `2026-10-03T21:20:22Z`, deadline `2026-10-03T21:50:22Z`; at most 30 minutes elapsed and cumulative primary/reviewer activity, 8 additional dispatched attempts, 1 remediation. Preserve old candidate `4f2bc723d8fd2338ae08d8bae10413d21c0d50fa` and all history. Original complete counts/activity/token usage remain unknown, not zero; this is a bounded human continuation increment, not a reset or historical compliance claim.
- This allocation is EXEC-002 only; mandatory TECH/QA/SECURITY (R=3,G=0); initial planned 1 fresh Maker + 3 distinct profile executions. Record dispatch start/end conservatively for each; retry only if count/elapsed/aggregate active remaining can fit required review/validation. Known activity beyond allocation or new unrelated MAJOR/BLOCKING stops Human handoff. Token target 30,000; actual/remaining null without complete telemetry.
- Focused context tests must run explicitly in addition to npm ci/build/typecheck/test/audit on exact Node v24.19.0/npm 11.17.0. Existing npm test script does not discover context subdirectory, and package.json is forbidden here; report separate counts, not fictional full-suite inclusion. No hidden omission or test-script permission expansion.
- Required reviews may reuse verified same-candidate complete input/runtime/command logs when current; each profile still independently checks canonical ACs with bounded probes. Fresh security audit and exact-runtime postmerge commands remain required.
- Context target 16 files /24 selected sections /64 KiB; only assigned mandatory context, direct SDD sections and affected source/tests. No complete review_log, generalized fuzzing, historical R1-R8 context, new architecture or adapter. Stop after EXEC-002 closure; EXEC-003/004 remain explicitly pending.
