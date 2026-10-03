# HNS-EXEC-001 Closure Test Fix Immutable Manifest

| Field | Value |
|---|---|
| Work Item | `HNS-EXEC-001-CLOSURE-TEST-FIX` |
| Base / Candidate | `4956c367c397a2e196904e08634b522c56be8c91` / `46f4bd6cfb4ddd4b098f04d00576af01f9b4e70b` |
| Maker Execution ID | `EXE-HNS-EXEC-001-CLOSURE-TEST-FIX-001` |
| Runtime | Node `v24.19.0` / npm `11.17.0` |
| Risk / Required Profiles | `LOW` / `TECH_REVIEWER`, `QA_REVIEWER` |

## Validation

| Check | Result |
|---|---|
| `npm ci` | `PASS`; 42 packages audited, 0 vulnerabilities |
| Build / Typecheck | `PASS` / `PASS` |
| Focused parser tests | `PASS`; 26 passed |
| Full suite | `PASS`; 175 passed, 0 failed/skipped/todo |
| Audit | `PASS`; 0 vulnerabilities |
| Scope | `PASS`; one authorized test file, one insertion and one deletion |

## Artifact Identity

| Path | Git Blob SHA | Content SHA-256 |
|---|---|---|
| `harness/tests/unit/work-items/parser.test.mjs` | `ad9f1723c3cbb431c4d5470eef186475c1444379` | `sha256:b2fec13a50f88467828d2b0937d10dfa6635cdb3886a24bbeced9874364585e1` |

## Scope Statement

- Updates only the deterministic expected hash for canonical closed `work-items/HNS-EXEC-001.md` bytes.
- No source, dependency, Work Item, parser behavior, Context Compiler, adapter, enforcement, or production capability changes.
