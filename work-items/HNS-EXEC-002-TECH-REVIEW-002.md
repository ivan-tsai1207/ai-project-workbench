# Work Item Contract

| Field | Value |
|---|---|
| Schema Version | `harness.work-item/v2` |
| ID | `HNS-EXEC-002-TECH-REVIEW-002` |
| Title | Independently Review Minimal Context Compiler TECH |
| Role | `REVIEWER` |
| Feature | `minimal-execution-engine` |
| Phase | `REVIEW` |
| Status | `CANCELLED` |
| Spec Version | `harness-v0.1-review` |
| Design Version | `N/A` |
| Risk Class | `HIGH` |
| Review Profile | `TECH_REVIEWER` |
| Reviewed Artifact | `docs/08_agent_reviews/manifests/HNS-EXEC-002-implementation-r2.md` |
| Reviewed Artifact Hash | `sha256:eae9aa1501c359f18b02d71e5ba09df3675445c01c7de19dff222f2bdea91c72` |
| Maker Execution ID | `HNS-EXEC-002-REMEDIATION-01a103b6-27da-74c0-9183-f3e87bf4fe33` |

## Objective

Independently assess exact fixed EXEC-002 candidate, all canonical ACs and directly affected risk boundaries. No implementation or Gate approval.

## Requirement References

- Requirement IDs: `AC-HNS-021`, `AC-HNS-023`, `AC-HNS-024`, `AC-HNS-EXEC-002-001`, `AC-HNS-EXEC-002-002`, `AC-HNS-EXEC-002-003`, `AC-HNS-EXEC-002-004`
- Feature Spec: `N/A`
- Screen IDs / Screen Specs: `N/A`
- ADR: `N/A`
- Architecture / SDD sections: `docs/harness_v0.1_SDD.md` Sections 5.3, 18, 31, 38, 40.1, 43, 46 Phase 3
- Review / Evidence references: `docs/08_agent_reviews/manifests/HNS-EXEC-002-implementation-r2.md`; `docs/08_agent_reviews/review_log.md`

## Read Scope

- `AGENTS.md`
- `.ai/CONSTITUTION.md`
- `.ai/AUTHORITY.md`
- `.ai/WORKFLOW.md`
- `.ai/roles/reviewer.md`
- `.ai/roles/reviewer-profiles/tech-reviewer.md`
- `.ai/gates/implementation-gate.md`
- `.ai/HARNESS_CONTRACT.md` only relevant runtime-boundary sections if needed
- `templates/Agent_Review_Log.md`
- `work-items/HNS-EXEC-002.md`
- `work-items/HNS-EXEC-002-TECH-REVIEW-002.md`
- `docs/08_agent_reviews/manifests/HNS-EXEC-002-implementation-r2.md`
- `docs/08_agent_reviews/validation/HNS-EXEC-002-r2/**`
- `docs/08_agent_reviews/review_log.md` only current EXEC-002 evidence IDs
- `docs/harness_v0.1_SDD.md` only directly referenced sections
- `harness/src/context/**`
- `harness/src/index.ts`
- `harness/src/core/**`
- `harness/src/errors/**`
- `harness/tests/unit/context/**`
- `harness/tests/fixtures/context/**`
- `harness/package.json`
- `harness/package-lock.json`
- `harness/tsconfig.json`
- `harness/dist/context/**` for bounded probes

## Write Scope

- `docs/08_agent_reviews/review_log.md`

## Forbidden Scope

- `harness/**`
- `.ai/**`
- `work-items/**`
- `docs/08_agent_reviews/manifests/**`
- `main`

## Scope

- Correctness, canonical SDD18/43, deterministic hash/immutability, snapshot/repeated-request regressions, input validation, performance and scope.
- Verify exact candidate, manifest/input hashes, runtime and fresh Maker identity. Reuse complete same-input Maker canonical logs only when hashes/environment/freshness/results reproduce.
- Run bounded profile-specific probes; fresh context tests or focused correctness probes mandatory.
- Report Maker context deviation honestly; no retrospective budget waiver, forged compliance or source defect inference from target miss alone.
- Do not expand into generic fuzzing, whole-repo lookup, new attack taxonomy or unrelated history.

## Out of Scope

- Remediation, code/test editing, Gate approval, new architecture, enforcement, adapters, EXEC-003/004, production or Pilot.

## Acceptance Criteria

- [ ] `AC-HNS-EXEC-002-TECH-REVIEW-002-001`: Current candidate/input/manifest identity, independence and authorized scope verified.
- [ ] `AC-HNS-EXEC-002-TECH-REVIEW-002-002`: All four EXEC-002 ACs and profile risk boundaries independently assessed with reproducible bounded evidence.
- [ ] `AC-HNS-EXEC-002-TECH-REVIEW-002-003`: Decision, findings, runtime/probes/log provenance and known limitations delivered for append-only host persistence.

## Required Gates

- `IMPLEMENTATION_GATE`

## Dependencies

- `HNS-EXEC-002`

## Blockers

- None; any new confirmed defect must be documented without automatic scope expansion.

## Notes

- Superseded assignment lifecycle closure `LC-HNS-EXEC-002-001`: original R2 deadline decision BLOCK and unchecked ACs preserved; completed same-candidate independent `HNS-EXEC-002-TECH-REVIEW-003` supplies authoritative PASS. CANCELLED is assignment status, not a historical review decision change or fabricated execution.
- Parent transcribes returned evidence to avoid shared-log conflicts; do not write repository files. Return PASS / REQUEST_CHANGES / BLOCK with complete required fields; not GateResult.
- One primary profile, fresh independent execution. WI deadline21:50:22Z, additional8attempts/one remediation shared with Maker/allprofiles; counters/clocks do not reset.
- Initial context operational target16files/24sections/64KiB; mandatoryTier1 intact, on-demand extra selections recorded. Avoid full HARNESS contract unless needed; exact SDD46 Phase3 row only.
- Reviewer target <=3min and narrowed deadline21:48:20Z. Required checks must be complete, otherwise checkpoint non-PASS; no unbounded reads or probes. Parent checks aggregate activity and wall remaining before any remediation.

- Final R2 re-review: counter reaches8/8, remediation1/1 alreadyused. Only FND-HNS-EXEC-002-SECURITY-001-001 and FND-HNS-EXEC-002-QA-001-001 plus canonical AC/direct regressions; no additionalloop. Run fresh built-dist/context tests, never TypeScript SDK transpilation. Complete input provenance using R2 inputs.json/results.json, current candidate/source equality; immutable R1 evidence remains unchanged. Deadline21:48:20Z, target<=2minutes. Any requirednonPASS stopsHuman.
