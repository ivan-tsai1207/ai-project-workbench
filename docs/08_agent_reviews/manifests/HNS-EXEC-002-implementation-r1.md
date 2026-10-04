# HNS-EXEC-002 Immutable Implementation Manifest R1

| Field | Value |
|---|---|
| Work Item | `HNS-EXEC-002` |
| Develop Base | `77f93daef6f880ac9a548ac0a088137f51c74041` |
| Preserved Old Candidate | `4f2bc723d8fd2338ae08d8bae10413d21c0d50fa` |
| Candidate / Parent | `1f11ff00fae30415a12674fd56ddea71c34a16e3` / `a6f3ec5092dfb62b6dc95fea40e4464cea50c54a` |
| Candidate Tree | `6451847b74fc94eb35a47d48959dedc21975ffee` |
| Maker Execution ID | `HNS-EXEC-002-MAKER-FRESH-20261003T212235Z` |
| Maker Agent | `01a103a5-7e1f-7570-b214-7d1ac90eb2e1` |
| Runtime | Node `v24.19.0` / npm `11.17.0` |
| Risk / Required Profiles | `HIGH` / TECH_REVIEWER, QA_REVIEWER, SECURITY_REVIEWER |
| Complete Validation Input Hash | `7217e13764b4a1548a6befa483fe9ef45f5e94f8d794b000957dbcc49065a6d0` |

## Artifact Identity

| Path | Content SHA-256 |
|---|---|
| `harness/src/context/compiler.ts` | `sha256:5f570b370274bdfaf14e821012e9df5a3fa271ce6b5cf8d88b39c39942fc6416` |
| `harness/src/context/index.ts` | `sha256:594b97438cc8d09a82eee171f89b1afe7a6d3dd4c7e25a17e3159e1398752299` |
| `harness/src/context/markdown.ts` | `sha256:36179aa4e2b79c3597651801c0f1a87159ee8c9f6bc716e18df61639bf4e75ac` |
| `harness/src/context/path.ts` | `sha256:64d83f7b0dd4e23a178b93db7e633b521e5235ac16676194fae34e0956dec862` |
| `harness/src/context/types.ts` | `sha256:b467b3be3b204da691999c00fd1b0fd2b6920410596524f3457fc3e046a3ab52` |
| `harness/src/index.ts` | `sha256:060b874b2c766e3581caf2e744ae3a3eb3f4164862a77a9ca5d18600428ac1b2` |
| `harness/tests/fixtures/context/sectioned.md` | `sha256:8634ef6e288023f4fe504a8345d8a6f076d2ceb0d7ce6ce54f35b42efc982786` |
| `harness/tests/unit/context/compiler.test.mjs` | `sha256:ea96331acacc3af8c86d49ee21ea06ee1113c4df1c0ef579165480bb53af562a` |

Git blobs, input hashes and command identity are also retained in durable `docs/08_agent_reviews/validation/HNS-EXEC-002-r1/maker-evidence.json`, `final-inputs.json` and `final-commands.json`. These are not alternate governance/schema enums.

## Validation

All final commands exit0 on 2026-10-03 at 21:25:33.211Z-21:25:37.915Z. Explicit context glob rerun passes at 21:28:26.328Z-21:28:26.667Z. Candidate commit is fixed at 21:28:26+00:00, before the narrowed Maker deadline21:29:00Z; no ongoing processes.

| Command | Result |
|---|---|
| npm ci | PASS |
| npm run build | PASS |
| npm run typecheck | PASS |
| npm test | PASS; existing suite181/181, 0 failed/skipped/todo |
| npm audit --audit-level=high | PASS; 0 vulnerabilities |
| node --test tests/unit/context/*.test.mjs | PASS; 10/10, 0 failed/skipped/todo |
| git diff --check | PASS |

Durable raw stdout/stderr and complete before/after input inventory are in `docs/08_agent_reviews/validation/HNS-EXEC-002-r1/`; regression logs preserve8pass/2fail before Maker's fix. No review/Gate PASS is asserted by these results.

## AC and Scope

- AC001: deterministic immutable manifest/hash and ordering; AC002: Tier selection, Markdown extraction/dedup/bounded explicit provider lookup; AC003: path/sensitive/hash-drift/budget negative checks; AC004: immutable load/deny/defer audit hash/budget deltas.
- Fresh Maker modifies only compiler.ts and its focused tests: one-read document snapshot for multiple sections, repeated selector expected-hash/content revalidation. Eight aggregate implementation artifacts above remain within WI Write Scope.
- No package/dependency, policy, Risk, GateRunner, AuditStore, adapter, filesystem crawler, production or runtime execution changes.
- No currently recorded OPEN finding for EXEC-002; fresh independent profiles must assess canonical ACs, direct regressions and scope/security boundaries.

## Limitations and Budget

- Host supplies validated WorkItem, explicit source references, effective boundary and canonical provider; no filesystem sandbox/enforcement or PolicyCompiler claim. Tests use bounded virtual providers.
- Default npm test does not discover context subdirectory; focused command separately required. Do not report181 as including the10 context tests or silently edit forbidden package settings.
- Maker context process deviation: initial9files/15selections/77,436bytes, total18files/24selections/134,875bytes exceeds operational16-file/64KiB target; full SDD46 table selected instead of onlyPhase3. Targets not claimed met; historical/complete aggregate token telemetry null. Preserve deviation, no retrospective waiver or invented measurement.
- Human continuation increment starts `2026-10-03T21:20:22Z`, deadline `2026-10-03T21:50:22Z`, 8 additional attempts/one remediation maximum; current1 Maker attempt. Maker source/check production completed before narrowed deadline; final handoff returned afterward without new production. Track next three distinct profile intervals conservatively; fail/stop if remaining count/time cannot fit.
- Same-candidate command logs may be reused after full input/runtime/hash/freshness checks; independent bounded profile probes and fresh Security audit still required, plus all exact-runtime postmerge commands. No full review history or open-ended fuzzing. Stop after EXEC-002 only.
