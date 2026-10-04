# Work Item Contract

| Field | Value |
|---|---|
| Schema Version | `harness.work-item/v2` |
| ID | `HNS-EXEC-003` |
| Title | Implement Risk Review Assignment and Execution Profile |
| Role | `IMPLEMENTER` |
| Feature | `minimal-execution-engine` |
| Phase | `IMPLEMENTATION` |
| Status | `IN_PROGRESS` |
| Spec Version | `harness-v0.1-review` |
| Design Version | `N/A` |
| Risk Class | `HIGH` |
| Review Profile | `N/A` |
| Reviewed Artifact | `N/A` |
| Reviewed Artifact Hash | `N/A` |
| Maker Execution ID | `N/A` |

## Objective

Implement deterministic Risk Assignment, Reviewer Assignment, and immutable Execution Profile building for the minimal execution engine.

## Requirement References

- Requirement IDs: `AC-HNS-007`
- Feature Spec: `N/A`
- Screen IDs / Screen Specs: `N/A`
- ADR: `N/A`
- Architecture / SDD sections: `docs/harness_v0.1_SDD.md` Sections 5.3, 5.5, 16.1, 21, 35, 38, 40.1, 46 Phases 6-7
- Review / Evidence references: `HNS-EXEC-001`, `HNS-EXEC-002`

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
- `work-items/HNS-EXEC-003.md`
- `harness/src/core/**`
- `harness/src/schemas/**`
- `harness/src/context/**`
- `harness/src/risk/**`
- `harness/src/execution/**`
- `harness/tests/**`

## Write Scope

- `harness/src/risk/**`
- `harness/src/execution/profile.ts`
- `harness/src/index.ts`
- `harness/tests/unit/risk/**`
- `harness/tests/unit/execution/profile.test.mjs`

## Forbidden Scope

- `.ai/**`
- `docs/**`
- `templates/**`
- `work-items/**`
- `harness/package.json`
- `harness/package-lock.json`
- `harness/src/policy/**`
- `harness/src/gates/**`
- `harness/src/audit/**`
- `harness/src/adapters/**`
- `harness/src/enforcement/**`
- `main`

## Scope

- Classify deterministic risk from canonical trigger facts using highest-risk-wins semantics and fail closed on unknown sensitive triggers.
- Resolve deterministic artifact-aligned TECH plus risk-required QA and SECURITY assignments, enforce Maker/Reviewer separation inputs, and hash immutable assignments.
- Build and verify immutable execution profiles from validated Work Item, Context, supplied effective policy, gate, review, repository, adapter-requirement, and audit inputs.
- Reject risk downgrade, unassigned profile, stale/missing artifact hash, identity mismatch, missing mandatory gate, policy/context hash mismatch, and mutable output.

## Out of Scope

- Policy Compiler, reviewer execution, adapters, enforcement, production launch, finding registry, Delivery Assurance, or human approval implementation.

## Acceptance Criteria

- [ ] `AC-HNS-EXEC-003-001`: Same normalized trigger inputs produce the same immutable Risk Assignment hash and highest applicable risk.
- [ ] `AC-HNS-EXEC-003-002`: Reviewer assignments are deterministic, artifact-bound, role-aligned, and include TECH plus risk-required QA/SECURITY without self-assignment.
- [ ] `AC-HNS-EXEC-003-003`: Valid profile inputs produce a canonical deep-frozen profile whose hash changes for every execution-relevant field change.
- [ ] `AC-HNS-EXEC-003-004`: Downgrade, stale hash, missing gate, identity mismatch, and assignment collision fail closed without adapter or enforcement behavior.

## Required Gates

- `IMPLEMENTATION_GATE`

## Dependencies

- `HNS-EXEC-001`
- `HNS-EXEC-002`

## Blockers

- None

## Notes

- IMPLEMENTATION-ALLOCATION-001: Human requested next execution after contract closure. Original preflight origin02:45:34Z/no childattempts preserved; added finite implementation allocation origin `2026-10-04T04:34:53.250Z`, deadline `2026-10-04T05:04:53.250Z`, elapsed/cumulative<=30min, max8 attempts R=3/G=0, at most1 remediation only if required fullrequalification fits remaining time. Initial fresh Maker hard9min/target6min, each fresh TECH/QA/SECURITY hard4.5min/target3min; initial child maxima22.5min, host critical work target<=6min, explicit host pause while waiting must record start/end and counts wallclock. No reset of historical clocks/unknown activity, pause is not extra childtime. Required canonical ci/build/typecheck/test/audit-high plus focusedContext/Risk/profile, frozen manifest/source hashes, independent reviews, ImplementationGate, normalmerge/postmerge/lifecycle/remoteverify. TokenTARGET30,000 actualnull; no hardcap. Initialcontexttarget16files/24selections/64KiB, fullTier1 plus directASTSDDsections, source on demand; no whole reviewlog/fuzzing. Stop after003, no004/adapters/Pilot.
- Current handoff `LC-HNS-EXEC-003-CONTRACT-001`: both `HNS-EXEC-003-PREFLIGHT-001` contract gaps resolved by SDD5.5/16.1/21 in reviewed merge `afcb13a795d99ff3b274cb380dbcd3da2a74b12d`, clarification WI DONE, `SG-HNS-EXEC-003-CONTRACT-001` PASS and CR-HNS-EXEC-003-001 Closed. Scope/Role/HIGH required TECH/QA/SECURITY unchanged; host mappings remain canonical-authority inputs, not invented global policy. StatusTODO means ready for a separate fresh implementation execution, not completed or authorized by this closure to begin. All implementation ACs remain unchecked. Older preflight Notes below remain historical evidence.
- Host preflight `HNS-EXEC-003-PREFLIGHT-001`, base develop `1b6fdfca5507c5274a893d0074c602b98ff2cb99`; dependency Work Items001/002 DONE. Default one-WI plan would require HIGH TECH/QA/SECURITY (R=3,G=0), initial1Maker+3reviews, at most1remediation+3reviews; maximum8 attempts and30min elapsed/cumulative, tokenTARGET30,000 with actualnull. Preflight began2026-10-04T02:45:34Z; no Maker/Reviewer dispatched, no implementation allocation consumed by childagents. Original milestone/history counters not reset or claimedknown.
- Preflight cannot establish implementability against frozen canonical contracts, so exits `HUMAN_DECISION_REQUIRED` / SPEC_GAP before implementation, validation/review/Gate/merge. Two contract clarifications belong to PRODUCT_ARCHITECT; approval must be incorporated into canonical requirements before a fresh implementation context. No ad hoc risk rule DSL, caller-asserted unbound commit, Context schema change or re-opening EXEC-002 is authorized.
- Minimal pending decisions: define a versioned/hashed canonical risk trigger policy or explicitly specified existing host-policy port; define immutable Context compile repository/commit provenance consumed by SDD21 (including hash/source binding), and narrowly scoped implementation ownership if producer changes are required. Clarifications only, no Governance/Architecture redesign. Existing EXEC-002 independent approval and closure are not invalidated by this cross-module specification gap.
- Stop after this handoff. No EXEC-004/adapters/Pilot. Required runtime validation remains mandatory when implementation exists; none run or claimedPASS for this blocked preflight. No complete review_log loaded; only direct requirement sections, assigned governance/WI and bounded source/type checks.
- Required independent profiles: `TECH_REVIEWER`, `QA_REVIEWER`, `SECURITY_REVIEWER`.
