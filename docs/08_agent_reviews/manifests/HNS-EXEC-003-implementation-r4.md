# HNS-EXEC-003 Immutable Composite Implementation Manifest R4

| Field | Value |
|---|---|
| Work Item | `HNS-EXEC-003` |
| Develop Base | `90f4ff4fe6479a4644723c33e153f7083e07ec88` |
| Preserved R3 | `8e4c06650d13ead12a66eb02cb9e681e862b504a` |
| Candidate / Parent | `52ce59dd4867f2f99db0a01386fba325e2266da5` / `5bb91ad5dadad41e7bc558318a33055c41909b43` |
| Tree | `0bb9b452be69ab1cf50bc7b26ed2e46fe27e405a` |
| Maker Execution ID | `01a1070e-3967-72f1-90c0-d576e979a8be` |
| Runtime | Node `v24.19.0` / npm `11.17.0` |
| Risk / Required Profiles | HIGH / TECH_REVIEWER, QA_REVIEWER, SECURITY_REVIEWER |
| Validation Input Bundle Hash | `sha256:f7d4b682cf6b1e6c45b7638cb02a059573f35ef93ea6738d9c211ae1669307a3` |
| Validation Result Hash | `sha256:fc0349e8b360b8ac2bc664284815da86e700a1c07c54579ddf49f9f1d3bbdc75` |
| Built Output Inventory Hash | `sha256:109030658ce8f97b3c1528a321a009cde6c01da91f0c754555d0926f88b489cd` |

## Artifacts

| Path | Content SHA-256 |
|---|---|
| `harness/src/execution/profile.ts` | `sha256:f8cba6bbe71adb6d8f519a72e34ce8832dff3ec372b4cabdfb2a69167d24ae42` |
| `harness/src/index.ts` | `sha256:5b0a98d78f6c7c999ce0978829bd950e36500905c1e2213cd0bae000f1d3e467` |
| `harness/src/risk/classifier.ts` | `sha256:d216cdc0c1cf0c3cff655d49b31846971b70acf7e1a0abb3baacfefddba97940` |
| `harness/src/risk/index.ts` | `sha256:e471589881e7417ec63efc2649d44ef6dcfa6a85e7c1f80d4e50c4b0c6ef870a` |
| `harness/src/risk/review.ts` | `sha256:d32c6e8420bff2e06783ab903a05be798efac5c2e458ee836bddcdf3ec85b1c0` |
| `harness/src/risk/types.ts` | `sha256:4f1b97481f23d7a5d42303441880178ccd16a415a9982ad1421cd37bf148301c` |
| `harness/src/risk/validation.ts` | `sha256:619b9986a2d8a070d224563c66b6ce3f8fbfaeb52efcd7efd01ecb7dc43ca50a` |
| `harness/tests/unit/execution/profile.test.mjs` | `sha256:af858c427b4244101a9ca91ccd3d834b7c48427ddfc98f803473f3510024a18b` |
| `harness/tests/unit/risk/classifier.test.mjs` | `sha256:581dbd82374fe15f5551bba603a7606406d6d401d8c31a66f29cbfe08aec34ed` |
| `harness/tests/unit/risk/fixtures.mjs` | `sha256:a0dbb1b814817c5df4a9e3e5ae2b9390bfa95bc6198c4889b83248f541b8b383` |
| `harness/src/context/compiler.ts` | `sha256:6d4021d707df4d61a4b6b1cc3558e050fe654ea3c5f558ba242091fa9a0c7411` |
| `harness/tests/unit/context/compiler.test.mjs` | `sha256:4bd489ee78a760907fc21cc14f94db0748ff16d5a934631ab850d619f483136d` |

## Candidate Evidence and Boundary

- Sole named Human dependency correction FND-HNS-EXEC-003-PREFLIGHT-005-001: compiler no longer merges WorkItem WRITE-forbidden paths into independent host READ-forbidden boundary. Two authorized files only; no schema/governance/package/architecture/permission expansion. Real parsed repository WorkItem allows mandatory Constitution/assignedWorkItem reads with writeForbidden unchanged; true host readForbidden and WorkItem/host/policy ReadScope negatives remain failclosed. Existing path/canonical/hash/budget/on-demand/C5/lifecycle regressions retained.
- Original EXEC003 source Makers 01a10535-54ac-7693-b13a-9085abfc6ca3, 01a105c1-8580-7c70-af1c-555ff65aad5d, 01a10614-5ce0-7992-9ee6-065deba61fe0. Fresh dependency Maker above returned before13:20:00Z hard (parent receipt13:18:49Z). All fresh Reviewers must differ from ALL Makers; no old PASS reuse after dependency change. EXEC002 historical evidence unchanged, not retroactively approving changed bytes.
- Parent self-check exact two-file source diff, canonical template write-vs-read requirement/SDD18, unchanged guards and regression assertions PASS; Maker READY_FOR_REVIEW not independent closure. Source delta90insertions/6deletions includes86-line bounded regression helper/tests.
- Fresh candidate exact-runtime ci/build/typecheck/test233/233, focusedRisk/Profile/Context72/72, audit-high0 allPASS, no skip/cancel/todo. 2026-10-04T13:19:22.228Z-2026-10-04T13:19:27.257Z;96stableinputs,116compiledfiles unchanged build/test/final,16rawlogs. Evidence `docs/08_agent_reviews/validation/HNS-EXEC-003-dependency-r4/results.json`, inputs/dist inventories and runner; content hashes bind same exact source candidate.
- Frozen SDD `sha256:90bbe07a15f8d4bd2ef33238b2300434ca600e02ae078561b1aabc0aa52c5933`; all historical manifests/logs preserved. Required fresh TECH then QA/Security on all003ACs and affected002 canonical context boundaries, including namedFinding and knownresolvedC5/field/lifecycle regressions; no unboundedprobes/fullreviewlog. Attempt7/10, new005exception1/1, auto1/1 andC5exception1/1 unchanged; shared added allocation13:08:00Z-13:38:00Z finite/no retry.
- Known nonblocking FND-HNS-EXEC-002-SECURITY-003-001 remains OPEN. Trusted host wiring remains host responsibility; no persistent production backend/enforcement/adapter/Pilot. EXEC004 stillTODO. Maker cannot Gate/finalapprove.
