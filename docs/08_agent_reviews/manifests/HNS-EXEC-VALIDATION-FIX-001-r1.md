# HNS-EXEC-VALIDATION-FIX-001 Immutable Candidate Manifest

| Field | Value |
|---|---|
| Work Item | `HNS-EXEC-VALIDATION-FIX-001` |
| Related Work Item | `HNS-EXEC-001-CLOSURE-TEST-FIX` |
| Develop Base | `1ce9754ffab95a3d226e2bd4547f35aea6d1d936` |
| Base / Candidate | `f7919e9e1d6db60f35041497d482323a668a3ce9` / `91544b88d9c55f9742b4f5d77b54a9ebe3cd78e7` |
| Candidate Tree | `3adacc74282fcc6a033a3de9a812fc484bed6527` |
| Maker Execution ID | `EXE-HNS-EXEC-VALIDATION-FIX-001-MAKER-001` |
| Maker Agent | `01a1037c-f030-7a01-9317-bf3183227029` |
| Runtime | Node `v24.19.0` / npm `11.17.0` |
| Risk / Required Profiles | `HIGH` / `TECH_REVIEWER`, `QA_REVIEWER`, `SECURITY_REVIEWER` |

## Artifact Identity

| Path | Git Blob SHA | Content SHA-256 |
|---|---|---|
| `harness/package-lock.json` | `af04c5c4a743f4f663a699daf904ee5c228a58af` | `sha256:3b5aad9054c2757d68bcdcba24b49e67d1c07ad9962306009c78984b17aa3578` |
| `harness/tests/unit/schemas/fast-uri-security.test.mjs` | `79091f2072342547a82daa82f2c3212c6655a3bb` | `sha256:65e28db6eee5742af6c31a80c7b9283b94bb35b2b3151847037fdb9f01e62080` |
| `harness/tests/unit/work-items/parser.test.mjs` | `ad9f1723c3cbb431c4d5470eef186475c1444379` | `sha256:b2fec13a50f88467828d2b0937d10dfa6635cdb3886a24bbeced9874364585e1` |

## Validation

All final commands exit 0 on 2026-10-03 UTC. Durable raw logs and command metadata are in `docs/08_agent_reviews/validation/HNS-EXEC-VALIDATION-FIX-001-r1/`; `handoff.stdout.log` contains individual log SHA-256 identities and exact timestamps.

| Check | Final Result | Raw Log SHA-256 |
|---|---|---|
| npm ci | PASS; 41 packages | `ba5aaced9561959ea255256da5a8fde277322ed8e67aab2c679bb5a25a3a7875` |
| npm run build | PASS | `4f508288098c0f594f144ba449b406c86a7cfc01338904328b0d973804b30005` |
| npm run typecheck | PASS | `db3ea65f9010bc3aad2f6222df86f3a730be7c79cfbbde8172073664a5402092` |
| npm test | PASS; 181/181, 0 fail/skipped/todo | `ddd9381b1401b1c4efc4a10b0e40abd9565d725f3e481121d34198e0787aa197` |
| Focused parser/security | PASS; 32/32 | `de0e4f3af7ba1379fc90fafd43c0e14c4c485399fe8e6478e94c6b403eb5447f` |
| npm audit --audit-level=high | PASS; 0 vulnerabilities | `6d8c5c8f3d7684adb070417bd608d01ae90aa3dc26a65af03ffda4955f38d9a3` |

Initial full/focused failures while developing API expectations remain preserved in their original logs; final reruns above pass. Maker used one execution, no subsidiary agents. Maker self-review is in the commit message and durable `self-review.stdout.log`; not independent approval.

## Finding and Scope Binding

- `FND-HNS-EXEC-001-CLOSURE-TEST-FIX-TECH-001-001` and `FND-HNS-EXEC-001-CLOSURE-TEST-FIX-QA-001-001` remain OPEN pending fresh independent closure. Previous REQUEST_CHANGES/Gate failure and immutable manifests remain unchanged.
- Maker modifies only fast-uri lock version/resolved/integrity from 3.1.6 to 3.1.8 plus six bounded security/benign tests; Ajv 8.20.0 and ^3.0.1 unchanged.
- Preserved inherited one-line parser hash normalization matches canonical closed HNS-EXEC-001 SHA-256 `6dd149a33b1dfa807890fbcc34f258e473ae42d7933555e90187cb59f584730c`.
- No harness source, package.json, capabilities, permissions, governance, adapters or engine feature changes.
- Same-candidate complete Maker command logs may be reused only after runtime/input/hash/freshness verification; fresh independent profile probes, Security audit and post-merge commands remain required.
- Budget origin 2026-10-03T20:31:07Z; WI deadline 21:01:07Z; max 8 executions, one remediation; initial planned 4. Token target 30,000, actual/remaining null. No full historical review log.

