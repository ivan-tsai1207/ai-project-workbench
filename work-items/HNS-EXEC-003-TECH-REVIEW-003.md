# Work Item Contract

| Field | Value |
|---|---|
| Schema Version | `harness.work-item/v2` |
| ID | `HNS-EXEC-003-TECH-REVIEW-003` |
| Title | Independent TECH Review of Risk Assignment and Execution Profile |
| Role | `REVIEWER` |
| Feature | `minimal-execution-engine` |
| Phase | `REVIEW` |
| Status | `TODO` |
| Spec Version | `harness-v0.1-review` |
| Design Version | `N/A` |
| Risk Class | `HIGH` |
| Review Profile | `TECH_REVIEWER` |
| Reviewed Artifact | `docs/08_agent_reviews/manifests/HNS-EXEC-003-implementation-r3.md` |
| Reviewed Artifact Hash | `sha256:6b92a4c829c0fdc70c00fc8ad3da65332ca1bd5fdd5d63d2fdf41829855adc02` |
| Maker Execution ID | `01a10614-5ce0-7992-9ee6-065deba61fe0` |

## Objective

Independently review exact candidate `8e4c06650d13ead12a66eb02cb9e681e862b504a` with one primary TECH_REVIEWER profile.

## Requirement References

- Requirement IDs: `AC-HNS-007`, `AC-HNS-EXEC-003-001`, `AC-HNS-EXEC-003-002`, `AC-HNS-EXEC-003-003`, `AC-HNS-EXEC-003-004`
- Feature Spec: `N/A`
- Screen IDs / Screen Specs: `N/A`
- ADR: `N/A`
- Architecture / SDD sections: `docs/harness_v0.1_SDD.md` Sections 5.3, 5.5, 16.1, 21, 35, 38, 40.1
- Review / Evidence references: `docs/08_agent_reviews/manifests/HNS-EXEC-003-implementation-r3.md`; `docs/08_agent_reviews/validation/HNS-EXEC-003-targeted-r3/results.json`

## Read Scope

- `AGENTS.md`
- `.ai/CONSTITUTION.md`
- `.ai/AUTHORITY.md`
- `.ai/WORKFLOW.md`
- `.ai/roles/reviewer.md`
- `.ai/roles/reviewer-profiles/tech-reviewer.md`
- `.ai/gates/implementation-gate.md`
- `.ai/HARNESS_CONTRACT.md` direct boundary sections only
- `templates/Agent_Review_Log.md`
- `work-items/HNS-EXEC-003.md`
- `work-items/HNS-EXEC-003-TECH-REVIEW-003.md`
- `docs/harness_v0.1_SDD.md` direct referenced sections only
- `docs/08_agent_reviews/manifests/HNS-EXEC-003-implementation-r3.md`
- `docs/08_agent_reviews/validation/HNS-EXEC-003-targeted-r3/**`
- `docs/08_agent_reviews/validation/HNS-EXEC-003-review-resume-003/**`
- `docs/08_agent_reviews/review_log.md` named Finding IDs only
- `harness/src/risk/**`
- `harness/src/execution/profile.ts`
- `harness/src/core/**`
- `harness/src/schemas/**`
- `harness/src/context/**` directly affected interfaces only
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

- All four canonical ACs, named FND-HNS-EXEC-003-TECH-002-001 and known resolved regressions; bounded normal/boundary/negative security, regression, scope/dependency/capability checks.
- Verify candidate/manifest/source/full input hashes and runtime/log completeness before reuse; fresh profile-focused checks required, Security also fresh audit.
- No build/ci race, generalized fuzzing or open-ended attack taxonomy. One immutable candidate, distinct execution.

## Out of Scope

- Remediation, new requirements/architecture/governance, production enforcement, EXEC-004, adapters or Pilot.

## Acceptance Criteria

- [ ] `AC-HNS-EXEC-003-TECH-REVIEW-003-001`: Immutable candidate/hash, independence, full input/runtime/log provenance and scope verified.
- [ ] `AC-HNS-EXEC-003-TECH-REVIEW-003-002`: All original ACs and directly affected profile-specific boundaries fully assessed.
- [ ] `AC-HNS-EXEC-003-TECH-REVIEW-003-003`: Complete evidence, findings, limitations and decision returned for durable audit.

## Required Gates

- `IMPLEMENTATION_GATE`

## Dependencies

- `HNS-EXEC-003`

## Blockers

- Required independent assessment pending.

## Notes

- HUMAN-TARGETED-REMEDIATION-001 shared allocation08:36:08Z-09:06:08Z, max30min elapsed/cumulative; priorattempts5/8, automatic correction1/1 exhausted, targetedexception1/1 used. This is one fresh required TECH profile on newR3; hard5min including final report, target4min/finish probes4.25min. No retry/correction/newscope/fuzzing/fullreviewlog or direct writes/spawn. Parent persists returned complete evidence. TECH first; QA/Security only afterTECHPASS. Verify exact candidate/hash/all96inputs/16rawlogs/116dist files before log reuse; fresh focused checks, Security fresh audit-high. MandatoryTier1/profile/directsections intact; tokenTARGET20,000 aggregateactualnull. Stop after003, not004/adapters/Pilot.
