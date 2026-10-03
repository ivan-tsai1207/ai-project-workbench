# Work Item Contract

| Field | Value |
|---|---|
| Schema Version | `harness.work-item/v2` |
| ID | `HNS-EXEC-002-QA-REVIEW-003` |
| Title | Complete Independent Context Compiler QA Review |
| Role | `REVIEWER` |
| Feature | `minimal-execution-engine` |
| Phase | `REVIEW` |
| Status | `TODO` |
| Spec Version | `harness-v0.1-review` |
| Design Version | `N/A` |
| Risk Class | `HIGH` |
| Review Profile | `QA_REVIEWER` |
| Reviewed Artifact | `docs/08_agent_reviews/manifests/HNS-EXEC-002-implementation-r2.md` |
| Reviewed Artifact Hash | `sha256:eae9aa1501c359f18b02d71e5ba09df3675445c01c7de19dff222f2bdea91c72` |
| Maker Execution ID | `HNS-EXEC-002-REMEDIATION-01a103b6-27da-74c0-9183-f3e87bf4fe33` |

## Objective

Complete fresh independent QA review of unchanged R2 candidate `bdcd60bb36e30e63855f06bbcb06923eb9b02e1f`. This is review continuation, not implementation R3.

## Requirement References

- Requirement IDs: `AC-HNS-021`, `AC-HNS-023`, `AC-HNS-024`, `AC-HNS-EXEC-002-001`, `AC-HNS-EXEC-002-002`, `AC-HNS-EXEC-002-003`, `AC-HNS-EXEC-002-004`
- Feature Spec: `N/A`
- Screen IDs / Screen Specs: `N/A`
- ADR: `N/A`
- Architecture / SDD sections: `docs/harness_v0.1_SDD.md` Sections 5.3, 18, 31, 38, 40.1, 43, 46 Phase 3
- Review / Evidence references: R2 immutable manifest; `FND-HNS-EXEC-002-QA-001-001`, `FND-HNS-EXEC-002-SECURITY-001-001`; `HNS-EXEC-002-RESUME-002`

## Read Scope

- `AGENTS.md`
- `.ai/CONSTITUTION.md`
- `.ai/AUTHORITY.md`
- `.ai/WORKFLOW.md`
- `.ai/roles/reviewer.md`
- `.ai/roles/reviewer-profiles/qa-reviewer.md`
- `.ai/gates/implementation-gate.md`
- `.ai/HARNESS_CONTRACT.md` only necessary runtime boundary sections
- `templates/Agent_Review_Log.md`
- `work-items/HNS-EXEC-002.md`
- `work-items/HNS-EXEC-002-QA-REVIEW-003.md`
- `docs/harness_v0.1_SDD.md` only direct sections above
- `docs/08_agent_reviews/manifests/HNS-EXEC-002-implementation-r2.md`
- `docs/08_agent_reviews/validation/HNS-EXEC-002-r2/**`
- `docs/08_agent_reviews/validation/HNS-EXEC-002-resume-002/**`
- `docs/08_agent_reviews/review_log.md` only named Finding and continuation IDs
- `harness/src/context/**`
- `harness/src/core/**`
- `harness/src/errors/**`
- `harness/src/index.ts`
- `harness/tests/unit/context/**`
- `harness/tests/fixtures/context/**`
- `harness/package.json`
- `harness/package-lock.json`
- `harness/tsconfig.json`
- `harness/dist/context/**` only built probes
- Other validation input files: hash-only comparison against exact candidate, no unrelated source loading

## Write Scope

- `docs/08_agent_reviews/review_log.md` via parent append-only persistence of returned evidence

## Forbidden Scope

- `harness/**` writes (read/probes allowed by explicit Read Scope; no source/test/package writes)
- `.ai/**` writes
- `work-items/**` writes
- `docs/08_agent_reviews/manifests/**` writes
- `main`

## Scope

- All four canonical ACs, normal/boundary/negative/recovery, existing regression tests and fresh focused tests; close missing QA evidence finding only when complete.
- Verify exact artifact/candidate/Maker identity, full executable input hashes, fresh runtime/results and built-dist provenance.
- Independently qualify fresh host canonical logs before reuse. Fresh profile-focused context tests/probes required; Security also fresh audit.
- Existing implementation and evidence immutable. No open-ended fuzzing, crawler, new implementation or Gate approval.

## Out of Scope

- Source remediation, architecture/governance changes, enforcement/adapters, EXEC-003/004, production or Pilot.

## Acceptance Criteria

- [ ] `AC-HNS-EXEC-002-QA-REVIEW-003-001`: Exact candidate/input/manifest identity, independent execution and scope verified.
- [ ] `AC-HNS-EXEC-002-QA-REVIEW-003-002`: Four EXEC-002 ACs and relevant profile boundaries fully assessed with reproducible evidence.
- [ ] `AC-HNS-EXEC-002-QA-REVIEW-003-003`: Complete decision, findings/closure assessments, runtime/provenance/checks and limitations returned for durable audit.

## Required Gates

- `IMPLEMENTATION_GATE`

## Dependencies

- `HNS-EXEC-002`

## Blockers

- None at assignment; missing required checks result in BLOCK, never fabricated PASS.

## Notes

- Fresh single-profile execution, Maker != Reviewer. Parent records actual agent ID. Do not write repository files or spawn agents.
- Parent human increment at most3 attempts, no retry/remediation, elapsed/cumulative<=30min; origin `2026-10-03T21:58:48.089Z`, deadline `2026-10-03T22:28:48.089Z`. Each profile maximum6 minutes from dispatch, or remaining allocation/host deadline if smaller. Conservative intervals count even wait.
- Context initial target16files/24selected units/64KiB; full mandatory context intact, direct sections extracted, additional source/tests on demand and accounted. No whole review_log; old context deviations unwaived.
- Exact runtime Node v24.19.0/npm11.17.0. Tests from harness cwd, actual logs end `.stdout.log`/`.stderr.log`; no TypeScript SDK import. Fresh pre-review host build binds dist to current candidate; no reviewer build/ci race.
- Token TARGET20,000 shared; actual null, no hard token enforcement claim. Non-PASS stops, allPASS required for Gate.
