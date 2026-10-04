# Work Item Contract

| Field | Value |
|---|---|
| Schema Version | `harness.work-item/v2` |
| ID | `HNS-EXEC-004` |
| Title | Implement Gate Runner and Minimal Audit Evidence |
| Role | `IMPLEMENTER` |
| Feature | `minimal-execution-engine` |
| Phase | `IMPLEMENTATION` |
| Status | `BLOCKED` |
| Spec Version | `harness-v0.1-review` |
| Design Version | `N/A` |
| Risk Class | `HIGH` |
| Review Profile | `N/A` |
| Reviewed Artifact | `N/A` |
| Reviewed Artifact Hash | `N/A` |
| Maker Execution ID | `N/A` |

## Objective

Implement deterministic Gate Runner validation and minimal append-only audit/execution evidence sufficient to close a Pilot execution without vendor or production execution.

## Requirement References

- Requirement IDs: `AC-HNS-012`
- Feature Spec: `N/A`
- Screen IDs / Screen Specs: `N/A`
- ADR: `N/A`
- Architecture / SDD sections: `docs/harness_v0.1_SDD.md` Sections 5.4-5.5, 29-30, 35, 38-40, 44, 46 Phases 5 and 7
- Review / Evidence references: `HNS-EXEC-001`, `HNS-EXEC-003`

## Read Scope

- `.ai/CONSTITUTION.md`
- `.ai/AUTHORITY.md`
- `.ai/WORKFLOW.md`
- `.ai/HARNESS_CONTRACT.md`
- `.ai/roles/implementer.md`
- `.ai/gates/**`
- `docs/harness_v0.1_SDD.md`
- `work-items/HNS-EXEC-001.md`
- `work-items/HNS-EXEC-003.md`
- `work-items/HNS-EXEC-004.md`
- `harness/src/core/**`
- `harness/src/schemas/**`
- `harness/src/errors/**`
- `harness/src/execution/**`
- `harness/src/risk/**`
- `harness/src/gates/**`
- `harness/src/audit/**`
- `harness/tests/**`

## Write Scope

- `harness/src/gates/**`
- `harness/src/audit/**`
- `harness/src/index.ts`
- `harness/tests/unit/gates/**`
- `harness/tests/unit/audit/**`

## Forbidden Scope

- `.ai/**`
- `docs/**`
- `templates/**`
- `work-items/**`
- `harness/package.json`
- `harness/package-lock.json`
- `harness/src/policy/**`
- `harness/src/adapters/**`
- `harness/src/enforcement/**`
- `harness/src/git/**`
- `main`

## Scope

- Resolve canonical required gates without removing phase-mandatory gates and validate exact gate-definition hashes supplied by the host.
- Validate required artifact-bound review evidence, Maker/Checker separation, profile assignment, findings, and stale-hash conditions before Gate PASS.
- Produce immutable `PASS`, `FAILED`, or `NEEDS_CLARIFICATION` Gate Results with evidence and exact artifact/gate hashes.
- Record sequential redacted lifecycle, review, finding, gate, and final execution evidence in an in-memory append-only hash chain with idempotent finalization and tamper verification.
- Bind legal lifecycle completion to all required Gate PASS results and fail closed on audit or Gate failure.

## Out of Scope

- Filesystem audit store, WORM claims, Policy Compiler, adapters, enforcement, Git integration, production execution, Release Gate execution, or Delivery Assurance coordinator.

## Acceptance Criteria

- [ ] `AC-HNS-EXEC-004-001`: Missing/stale review evidence, Maker/Checker collision, unassigned profile, open blocking finding, or missing mandatory Gate prevents PASS and completion.
- [ ] `AC-HNS-EXEC-004-002`: Valid evidence produces deterministic immutable Gate Results with distinct Gate and review decision enums.
- [ ] `AC-HNS-EXEC-004-003`: Audit events use contiguous sequence and hash chaining, redact sensitive values before hashing, detect tampering, and finalize idempotently.
- [ ] `AC-HNS-EXEC-004-004`: Minimal execution evidence can reconstruct context/profile references, state transitions, reviews, findings, gates, and final status without filesystem, adapter, Git, or production side effects.

## Required Gates

- `IMPLEMENTATION_GATE`

## Dependencies

- `HNS-EXEC-001`
- `HNS-EXEC-003`

## Blockers

- BUDGET_INSUFFICIENT / AGENT_DISPATCH_FAILED: fresh Security spawn rejected by host agent thread limit. Remaining full required review and Gate/merge/postmerge/closure reserve cannot fit current cumulative activity; no security waiver or automatic retry. Candidate/TECH source assessment preserved; missingSecurity prevents Gate/closure.

## Notes

- IMPLEMENTATION-CHECKPOINT-001: immutablecandidateb8d5fba1aa656f27cd2b2f8c9a06b4f737a6fb06/manifestsha256ac1c821cf95113bad849f9bc84ad9b90c55825606c838ad566f9a0f9e988b570; sixauthorizedpaths269additions, no package/schema/core/state changes. Fresh exactruntime ci/build/typecheck/full233/focused95(23new+72existing)/audit0PASS;102inputs124dist16logs qualified. Makeractual432477ms/TECH165647ms/QA161056ms timely; independentTECH/QA allfourAC assessmentPASS/no newsourcefinding, Securitynotexecuted afterhostthreadlimitdispatchfailure. No Gate/merge/postmerge/closure. Fourdispatchattempts includingfailedspawn, remediation0/1; no budgetreset/waiver/newMaker. Currentcheckpoint conservativeactivity1584.006s/1800, elapsed1141.201s/1800 beforepreservationcommitpush; fullpendingSecurity+closure reserve360s exceedsremaining215.994s. Preservecurrentevidence atdocs/08_agent_reviews/validation/HNS-EXEC-004-r1. StopexplicitfiniteHumancontinuationneeded forremainingreview/closure; independentproductproposalprivate ivan-tsai1207/ai-agent-workbench stillpendingapproval, noUI/adapter/Lunaspike/productionclaim.

- FINITE-IMPLEMENTATION-ALLOCATION-001: Human new-chat delegation authorizes004 after003closure; independent stage, no003counterreset. Origin 2026-10-04T14:33:00+00:00 harddeadline 2026-10-04T15:03:00+00:00, cumulativeactivity/elapsed<=1800s, max8attempts (initialMaker+requiredTECH/QA/SECURITY, atmost1 existing-scope automaticremediation+allfreshreviews onlyif complete requalification fits remaining). InitialMakerhard480s/target360s, eachReviewhard240s includingreport/target180s, childmax1200s+host480s+safety120s. Required exactruntimeci/build/typecheck/fulltests and focusedgates/audit/risk/profile/context, audit-high, immutablecandidate/selfreview/freshindependentreviews/ImplementationGate/normalunchangeddevelopmerge/freshpostmerge/lifecycle/normalpushremoteverify. Basee3c2150620e4a0090f9f263ad0f559b20dc5c108; mainuntouched/historypreserved. Initial fullTier1+directSDD selections budget96KiB/24files/64sections withinhostdefaults, source/testondemand; no fullhistory. TokenTARGET30000actualnull untilprovidertelemetry, no exactcap/costclaim. Missingcanonicalcontract/newunrelatedMAJORBLOCKING/security/divergence/independence/budget/nonPASSafterremediation stopconcretehandoff. ScopeGateRunner+inmemoryAudit only; notdurable/OSenforcement/production/workbenchcompletion. Parentpersistsevidence/statusonly, Makerwritesonlydeclaredsource/tests.

- Required independent profiles: `TECH_REVIEWER`, `QA_REVIEWER`, `SECURITY_REVIEWER`.
