# Work Item Contract

| Field | Value |
|---|---|
| Schema Version | `harness.work-item/v2` |
| ID | `HNS-EXEC-003-QA-REVIEW-003` |
| Title | Independent QA Review of Risk Assignment and Execution Profile |
| Role | `REVIEWER` |
| Feature | `minimal-execution-engine` |
| Phase | `REVIEW` |
| Status | `TODO` |
| Spec Version | `harness-v0.1-review` |
| Design Version | `N/A` |
| Risk Class | `HIGH` |
| Review Profile | `QA_REVIEWER` |
| Reviewed Artifact | `docs/08_agent_reviews/manifests/HNS-EXEC-003-implementation-r4.md` |
| Reviewed Artifact Hash | `sha256:b14fb23611b370809aa6b3abe577dacb4c12a26235b4972e5b2244094d69df6a` |
| Maker Execution ID | `01a1070e-3967-72f1-90c0-d576e979a8be` |

## Objective

Independently review exact candidate `52ce59dd4867f2f99db0a01386fba325e2266da5` with one primary QA_REVIEWER profile.

## Requirement References

- Requirement IDs: `AC-HNS-007`, `AC-HNS-EXEC-003-001`, `AC-HNS-EXEC-003-002`, `AC-HNS-EXEC-003-003`, `AC-HNS-EXEC-003-004`
- Feature Spec: `N/A`
- Screen IDs / Screen Specs: `N/A`
- ADR: `N/A`
- Architecture / SDD sections: `docs/harness_v0.1_SDD.md` Sections 5.3, 5.5, 16.1, 18, 21, 35, 38, 40.1
- Review / Evidence references: `docs/08_agent_reviews/manifests/HNS-EXEC-003-implementation-r4.md`; `docs/08_agent_reviews/validation/HNS-EXEC-003-dependency-r4/results.json`

## Read Scope

- `AGENTS.md`
- `.ai/CONSTITUTION.md`
- `.ai/AUTHORITY.md`
- `.ai/WORKFLOW.md`
- `.ai/roles/reviewer.md`
- `.ai/roles/reviewer-profiles/qa-reviewer.md`
- `.ai/gates/implementation-gate.md`
- `.ai/HARNESS_CONTRACT.md` direct boundary sections only
- `templates/Agent_Review_Log.md`
- `templates/Work_Item.md` Forbidden Scope contract only
- `work-items/HNS-EXEC-002.md` affected ACs only
- `docs/08_agent_reviews/validation/HNS-EXEC-003-consolidated-005/consolidated-inspection.md`
- `work-items/HNS-EXEC-003.md`
- `work-items/HNS-EXEC-003-QA-REVIEW-003.md`
- `docs/harness_v0.1_SDD.md` direct referenced sections only
- `docs/08_agent_reviews/manifests/HNS-EXEC-003-implementation-r4.md`
- `docs/08_agent_reviews/validation/HNS-EXEC-003-dependency-r4/**`
- `docs/08_agent_reviews/validation/HNS-EXEC-003-review-resume-003/**`
- `docs/08_agent_reviews/review_log.md` named Finding IDs only
- `harness/src/risk/**`
- `harness/src/execution/profile.ts`
- `harness/src/core/**`
- `harness/src/schemas/**`
- `harness/src/context/**` directly affected compiler and interfaces
- `harness/src/index.ts`
- `harness/tests/unit/risk/**`
- `harness/tests/unit/execution/profile.test.mjs`
- `harness/tests/unit/context/compiler.test.mjs`
- `harness/package.json`
- `harness/package-lock.json`
- `harness/tsconfig.json`
- `harness/dist/**` built probes only
- `harness/src/**` other validation inputs hash-only
- `harness/tests/**` other validation inputs hash-only
- `.ai/**` other validation inputs hash-only

## Write Scope

- `docs/08_agent_reviews/review_log.md` via parent append-only persistence of returned evidence

## Forbidden Scope

- `harness/**` writes (bounded read-only probes permitted)
- `.ai/**` writes
- `work-items/**` writes
- `docs/08_agent_reviews/manifests/**` writes
- `main`

## Scope

- All four canonical ACs, named FND-HNS-EXEC-003-PREFLIGHT-005-001, resolved FND-HNS-EXEC-003-TECH-002-001 and known resolved regressions; bounded normal/boundary/negative security, regression, scope/dependency/capability checks.
- Verify candidate/manifest/source/full input hashes and runtime/log completeness before reuse; fresh profile-focused checks required, Security also fresh audit.
- No build/ci race, generalized fuzzing or open-ended attack taxonomy. One immutable candidate, distinct execution.

## Out of Scope

- Remediation, new requirements/architecture/governance, production enforcement, EXEC-004, adapters or Pilot.

## Acceptance Criteria

- [ ] `AC-HNS-EXEC-003-QA-REVIEW-003-001`: Immutable candidate/hash, independence, full input/runtime/log provenance and scope verified.
- [ ] `AC-HNS-EXEC-003-QA-REVIEW-003-002`: All original ACs and directly affected profile-specific boundaries fully assessed.
- [ ] `AC-HNS-EXEC-003-QA-REVIEW-003-003`: Complete evidence, findings, limitations and decision returned for durable audit.

## Required Gates

- `IMPLEMENTATION_GATE`

## Dependencies

- `HNS-EXEC-003`

## Blockers

- None for dispatch; decision requires exact current hashes and full bounded assigned profile checks.

## Notes

- HUMAN-DEPENDENCY-CORRECTION-005: one fresh primary profile, read-only/no spawn/source/dist writes. Parent persists returned complete evidence using Agent_Review_Log template. Shared deadline2026-10-04T13:38:00Z, <=30min elapsed/cumulativeactive, historical6 attempts/newMaker1; max10 total, correction0051/1 exhausted/no retry. Eachreviewhard6min includingfinalreport; target4.5min, finishprobes5min. Check all003ACs and affected002contextACs/SDD18, realcanonicalWorkItem/write-vs-read, hostReadForbidden/ReadScope/canonical-path/hash/budget, C5/38field/lifecycle regressions. Verify12manifestartifacts/96inputs/16rawlogs/116dist files then freshfocused tests; Securityfreshaudit. Do not load fullreview_log or historicalprimaryWI Notes; mandatoryassignedReviewerWI fully. Dist/input/source snapshots remain unchanged. AllReviewers differfrom allfourMakers inmanifest. Prior approvals not reused; old EXEC002 approval preserved historical only. SameFindingunresolved/newunrelatedMAJOR stopsHuman. TECHfirst, QA/Security onlyafterTECHPASS. TokenTARGET20000/actualunknown. Stopafter003;004/adapters/Pilotnotstarted.
