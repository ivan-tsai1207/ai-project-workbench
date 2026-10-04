# Work Item Contract

| Field | Value |
|---|---|
| Schema Version | `harness.work-item/v2` |
| ID | `WBC-SECURITY-REVIEW` |
| Title | `Vercel Supabase 雲端基礎版規格` |
| Role | `REVIEWER` |
| Feature | `workbench` |
| Phase | `IMPLEMENTATION` |
| Status | `IN_PROGRESS` |
| Spec Version | `WB-017-v1` |
| Design Version | `WB-017-UX-v1` |
| Risk Class | `HIGH` |
| Review Profile | `SECURITY_REVIEWER` |
| Reviewed Artifact | `work-items/WBC-IMPL.artifact.json` |
| Reviewed Artifact Hash | `sha256:2eddc19deeac9973cad7b76ea8ff9dd17e7f0ab99be55ad48f26ed08c6986149` |
| Maker Execution ID | `01a1082f-3fd2-77b2-8676-e91852ba47d5` |

## Objective

先部署 Vercel＋Supabase；AI不啟用。WB-017 / AC-WB-017。

## Read Scope

- Complete mandatory governance, IMPLEMENTER role, IMPLEMENTATION_GATE and this WI。
- specs/workbench/cloud.md, PRD/SRS/SDD #cloud-foundation，WB016 canonical命名。
- design/workbench/cloud/UX_Contract.md, screens/SCR-WBC-001.md, Design_Source_Map.md, wireframe.html (only after DESIGN_GATE PASS)。
- Existing apps/workbench/public/styles.css only for visual reuse；Node runtime supplied24.19。

## Write Scope

- Host /private/tmp/cloud-workbench-evidence/security-review.md only; candidate readonly。

## Required Gates

- IMPLEMENTATION_GATE

## Notes

- Fresh SECURITY_REVIEWER execution, parent cloud batch retained. <=120sec including report, target90；one profile only; no delegation / candidate edits / git / model call。
- Full mandatory REVIEWER/profile/implementationGate/WI/governance；cloud spec + relevant UX/SCR sections + exact manifest，source/tests on-demand under least context limits。No oldlogs。Allfile hashes mechanicalverifywithoutloadingirrelevantcontents。
- Static app with Auth/RLS HIGH. TECH contract/auth/session/async/client validation/build/CSP/data flows; SECURITY leastgrants/policy/compositeFK/inputXSS/publickeys/logout/expiry/foreignownernegative/failclosed; QA 15client/configtests/build + negativecoverage/realRLS/mobile/CRUD. 可讀host implementation-completion/check outputs toqualify exact source。live DB/platform acceptance pending不能以mock tests宣稱完成；存在必須pending時清楚BLOCK/REQUEST_CHANGES，不豁免。
- Report actualtask_started UUID/hash/traceability/checks/findings(owner+severity+AC)/limits+decisionPASS/REQUEST_CHANGES/BLOCK，與MakerUUID不同。
