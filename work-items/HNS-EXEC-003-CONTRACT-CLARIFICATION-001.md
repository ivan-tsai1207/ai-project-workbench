# Work Item Contract

| Field | Value |
|---|---|
| Schema Version | `harness.work-item/v2` |
| ID | `HNS-EXEC-003-CONTRACT-CLARIFICATION-001` |
| Title | Clarify Risk Policy and Context Compile Provenance Contracts |
| Role | `PRODUCT_ARCHITECT` |
| Feature | `minimal-execution-engine` |
| Phase | `SPEC` |
| Status | `BLOCKED` |
| Spec Version | `harness-v0.1-review` |
| Design Version | `N/A` |
| Risk Class | `MEDIUM` |
| Review Profile | `N/A` |
| Reviewed Artifact | `N/A` |
| Reviewed Artifact Hash | `N/A` |
| Maker Execution ID | `N/A` |

## Objective

Close only the two canonical contract gaps recorded by HNS-EXEC-003 preflight, keeping existing frozen architecture, governance and completed implementation unchanged.

## Requirement References

- Requirement IDs: `AC-HNS-007`, `AC-HNS-EXEC-003-001`, `AC-HNS-EXEC-003-003`, `AC-HNS-EXEC-003-004`
- Feature Spec: `N/A`
- Screen IDs / Screen Specs: `N/A`
- ADR: `docs/05_decisions/CR-HNS-EXEC-003-001.md`
- Architecture / SDD sections: `docs/harness_v0.1_SDD.md` Sections 5.3, 5.5, 16.1, 21, 35
- Review / Evidence references: `work-items/HNS-EXEC-003.md`; `docs/08_agent_reviews/review_log.md`

## Read Scope

- `AGENTS.md`
- `.ai/CONSTITUTION.md`
- `.ai/AUTHORITY.md`
- `.ai/WORKFLOW.md`
- `.ai/roles/product-architect.md`
- `.ai/roles/reviewer.md`
- `.ai/gates/spec-gate.md`
- `.ai/HARNESS_CONTRACT.md` necessary sections4,9,13 only
- `work-items/HNS-EXEC-003-CONTRACT-CLARIFICATION-001.md`
- `work-items/HNS-EXEC-003.md`
- `docs/05_decisions/CR-HNS-EXEC-003-001.md`
- `docs/harness_v0.1_SDD.md` direct sections5.3,5.5,16.1,21,35, architecture host-port/module boundaries only
- `docs/08_agent_reviews/review_log.md` only HNS-EXEC-003-PREFLIGHT-001
- `harness/src/context/types.ts`
- `harness/src/context/compiler.ts` provenance construction only
- `harness/src/core/hash/canonical.ts`
- `harness/src/core/hash/sha256.ts`
- `harness/src/schemas/documents.ts` existing Risk/Context/Profile schema shapes only

## Write Scope

- `docs/harness_v0.1_SDD.md` only RiskPolicy clarification near5.5/16.1 and compile-provenance clarification in21

## Forbidden Scope

- `.ai/**`
- `AGENTS.md`
- `harness/**`
- `work-items/**`
- `docs/08_agent_reviews/**`
- `docs/05_decisions/**`
- `main`

## Scope

- Define an unambiguous versioned/hashed host-owned canonical risk rule table representation/evaluation using the existing RiskPolicy string-rule interface, with concrete accepted row format/normalization/identity and safe unknown-sensitive behavior. Do not invent a custom executable DSL, generic parser grammar or allow Agent-selected policy.
- Define a host-owned immutable Context compile provenance receipt/port bound to actual compile execution/hash and repository identity/root/branch/commit. Profile Builder must fail closed without verified host provenance or on mismatch. Reuse existing host ports, no Context/Profile schema revision, no provenance fabricated by Agent or arbitrary spec_versions keys.
- State source hash/ownership, collision/replay and downstream validation semantics with directly traceable bounded positive/negative examples. Keep existing API/type shapes and architecture; small local host-boundary port clarification allowed, no new storage, enforcement, signature system or runtime implementation.
- Host policy rules are authority-supplied, not unreviewed new global risk assignments; existing risk/profile baseline and unknown-sensitive HIGH minimum preserved.

## Out of Scope

- EXEC-003 implementation, Context compiler changes, new security policy/permissions, Governance/Architecture redesign, adapters, Gate Runner, production/Pilot and optional capabilities.

## Acceptance Criteria

- [ ] `AC-HNS-EXEC-003-CONTRACT-CLARIFICATION-001-001`: RiskPolicy row format/validation/source binding and highest-risk evaluation are explicit, deterministic and implementable; unknown sensitive input cannot be accepted or downgraded.
- [ ] `AC-HNS-EXEC-003-CONTRACT-CLARIFICATION-001-002`: Profile receives independently host-owned immutable compile provenance bound to context hash/execution and repository, with missing/stale/tampered/colliding records rejected; no schema change or unbound caller assertion.
- [ ] `AC-HNS-EXEC-003-CONTRACT-CLARIFICATION-001-003`: Two original gaps map to canonical SDD changes and bounded examples; protected governance/source/tests/packages/schema are unchanged.
- [ ] `AC-HNS-EXEC-003-CONTRACT-CLARIFICATION-001-004`: Candidate document hash, self-review and distinct SPEC/Security decisions support Spec Gate before downstream implementation; historical evidence/limits preserved.

## Required Gates

- `SPEC_GATE`

## Dependencies

- `HNS-EXEC-001`
- `HNS-EXEC-002`

## Blockers

- Human authorized Gate/merge/postmerge/closure-only continuation after disclosure of operational overruns. Required closure remains pending; original EXEC-003 runtime stays BLOCKED until canonical merge and closure.

## Notes

- CLOSURE-ALLOCATION-001: Human said to continue after the fixed completion checklist and disclosed late review finalization. Finite additional allocation origin `2026-10-04T04:18:49.724Z`, deadline `2026-10-04T04:33:49.724Z`, elapsed/cumulative<=15min, no child attempt/Maker/reviewer/remediation. Existing4/6 attempts and correction1/1 remain; original clocks/history not reset. Independently completed SPEC/Security PASS are qualified only for unchanged exact artifacts; no Gate/security waiver, fabricated timely PASS or Accepted Risk. Fresh exact-runtime canonical commands before Gate and after merge; final status/CR/evidence updates, normal push/remoteHEAD, then STOP before003 implementation. TokenTARGET10,000 actualnull.
- RESUME-001-CHECKPOINT-001: two new independent review attempts completed, total4/6 attempts, correction1/1 used; no further automatic dispatch/source changes. Current-hash PASS does not waive time-policy deviations. Saved reviewer reports and fresh R2 commands are durable; primary ACs remain unchecked until Gate/merge/closure. Stop at20min aggregate added activity; no Gate/merge/003/004/adapters.
- Human continuation allocation RESUME-001: origin `2026-10-04T03:58:23.317Z`, deadline `2026-10-04T04:18:23.317Z`, at most2 new reviewer attempts; elapsed and host+child cumulative each<=20min. Original two Maker attempts, remediation1/1 exhausted and deadline failure remain; no new Maker/source edit/retry. Full canonical validation before Gate and after merge, only then closure/normalize003 blocker. SPEC_REVIEWER and SECURITY_REVIEWER only, each hard4min. TokenTARGET20,000, actual null. Stop on nonPASS/new MAJOR/BLOCKING/divergence/budget; no implementation003/004/adapters.
- Checkpoint `HNS-EXEC-003-CONTRACT-CLARIFICATION-001-CHECKPOINT-001`: two Maker attempts, one correction used, zero independent reviews; no Spec Gate/merge/closure. Initial candidate validation does not qualify corrected checkpoint. Original EXEC-003 remains BLOCKED; all ACs remain unchecked.
- Human authorization: user approved the proposed PRODUCT_ARCHITECT minimal two-contract correction by asking to proceed. Freeze exception only these two clarifications, no broader architecture/governance/implementation change; CR-HNS-EXEC-003-001 approved for this scope.
- Risk MEDIUM: documentation contract clarification, not runtime/permission/production change; independent basic SPEC_REVIEWER plus SECURITY_REVIEWER required for risk/identity trust-boundary semantics. No code/test-behavior QA or TECH implementation review for this artifact. Original EXEC-003 HIGH TECH/QA/SECURITY unchanged.
- Default new-primary-WI finite origin `2026-10-04T02:54:06.413Z`, deadline `2026-10-04T03:24:06.413Z`; elapsed and cumulative host/all-child activity each<=30min, maximum6 attempts (R=2,G=0), at most1 automatic remediation. Initial Maker +2distinct reviewers; prior EXEC003 preflight/EXEC002 history preserved, not reset as same WI.
- Maker target4min/hard5min; each reviewer target3min/hard4min, only dispatch if conservative elapsed plus summed child intervals leaves host Gate/merge/closure reserve. Count errors/cancellation/retry; no unbounded follow-up or external agents. Hardstop if budget/missing context/nonPASS after sole remediation or new unrelated MAJOR/BLOCKING.
- Token TARGET30,000 aggregate; actual/remaining null without complete telemetry, no hard cap claim. Context initial target16files/24selections/64KiB; mandatory context intact, relevant sections extracted, source on demand; no full historical reviewlog.
- Parent persists outputs/manifests/review-WIs/CR/status/audit outside Maker write scope, no shared-log writes. Maker edits only authorized SDD portions with apply_patch and makes scoped commit, returns timestamp/hash/self-review/AC examples and real execution identity. No final self-approval.
- Required validation: document diff/scope/reference/whitespace and bounded positive-negative contract scenario review; parent also runs exact Node24.19.0/npm11.17.0 canonical ci/build/typecheck/test/audithigh and separate Context tests, including postmerge, without source changes. Do not claim runtime enforcement implemented.
- Stop after this clarification Gate/merge/closure. Only normalize EXEC-003 blocker/status toTODO once spec is canonical; do not start implementation, EXEC004 or adapter.
