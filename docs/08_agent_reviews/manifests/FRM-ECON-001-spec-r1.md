# FRM-ECON-001 Immutable Specification Manifest

| Field | Value |
|---|---|
| Work Item | `FRM-ECON-001` |
| Base | `446f80a4fc49395fceaa2260c084d5d379fc0e61` |
| Candidate | `006d1d1cd1b9e82b97ebcf87dfc7065979ac4958` |
| Maker Execution ID | `EXE-FRM-ECON-001-MAKER-001` |
| Actual Maker agent | `01a10350-c451-7261-b69d-01be0c06a182` |
| Risk / Required Profiles | `MEDIUM` / `SPEC_REVIEWER` |
| Active Gate | `SPEC_GATE` |
| Role Completion Evidence | `docs/09_session_logs/2026-10-04-execution-economy.md` |
| Result | `READY_FOR_REVIEW`; no Gate or independent PASS asserted |

## Exact Artifacts

| Path | Git Blob SHA | Content SHA-256 |
|---|---|---|
| `.ai/HARNESS_CONTRACT.md` | `f1e76a4a865e457dfb66f5270bd356c5efe2d891` | `6d4c15e4d8ec857e026fb549f53b99f10caa37043fe1ba250e8c0a6a50bdfc5d` |
| `.ai/WORKFLOW.md` | `aaeeca3daebe722b0dbeed5f365a20c209e024d0` | `4fb16d6db7d6dc7507878ebb7a371dc1d5c8100ff1acd542188174a2ea012d62` |
| `AGENTS.md` | `985cfb586c865cbd79e91d3c29db768d83164415` | `2de3e62bf67a2c8bc11051134c63fe27e62f02051429620a227e76230479a01b` |
| `LLM_OPERATING_RULES.md` | `a965cef8dc9178f8efd5a3e4e88c37c07c2e6a38` | `f0af1953a6cddabf2070a3bca8505515b2367c112a5e8028a8b05e8d49272a9d` |
| `docs/09_session_logs/2026-10-04-execution-economy.md` | `29884cf55f66ecaed42b3da5d233ed6b940e80df` | `e8d865ba83a4be0ac94b42bd0c1fabf8e86c14e01434343cb7ea0fbabe8dfd8e` |
| `docs/harness_v0.1_SDD.md` | `6b9200fdd0615ebbdeb6287379a36ec53c2d0031` | `9eb48b670c5940bed4dc4b528c8e44e50dce5cf8ab53ccebce7179ad09f3589b` |
| `templates/Work_Item.md` | `7b3d84d47566c110d3d7ea9ade1af95a4282593b` | `b6865bc685be6d82f09eda18d732af3db52da5b6463b7ff2e8fd6278bf8c3ca7` |

## Validation and Scope

- Exact authorized seven-path candidate diff; `git diff --check` PASS, reproduced by controller.
- Maker self-review/scenario evidence is the immutable session note above: finite allocations, 13 bounded normal/boundary/negative scenarios and stated telemetry limitations.
- Six operational document edits plus one evidence note; no source, tests, dependencies, Role/Gate definitions, schema enums, runtime defaults or architecture changes.
- Runtime tests and npm validation are NOT_APPLICABLE to this documentation-only candidate; the separate `fast-uri` security blocker has not been fixed or accepted.
- One primary Work Item, R=1, G=0; max 4 Maker/reviewer executions including at most one remediation. Start/time accounting and token `actual: null` are recorded in Maker evidence. Independent SPEC review and Gate remain required.
