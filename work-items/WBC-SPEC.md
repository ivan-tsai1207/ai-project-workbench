# Work Item Contract

| Field | Value |
|---|---|
| Schema Version | `harness.work-item/v2` |
| ID | `WBC-SPEC` |
| Title | `Vercel Supabase 雲端基礎版規格` |
| Role | `PRODUCT_ARCHITECT` |
| Feature | `workbench` |
| Phase | `SPEC` |
| Status | `DONE` |
| Spec Version | `WB-017-v1` |
| Design Version | `N/A` |
| Risk Class | `MEDIUM` |
| Review Profile | `N/A` |
| Reviewed Artifact | `work-items/WBC-SPEC.artifact.json` |
| Reviewed Artifact Hash | `sha256:482ae09ff51d72b110738eb91cd76c075c4ec564a9eaa188542b9794d4181b6c` |
| Maker Execution ID | `01a10825-4156-7931-82e6-d4014742d978` |

## Objective

先部署 Vercel＋Supabase；AI不啟用。WB-017 / AC-WB-017。

## Read Scope

- Mandatory .ai/CONSTITUTION.md, AUTHORITY.md, WORKFLOW.md, active role/gate。
- 本 WI、manifest與四文件；已確認 WB016 與 workbench現有UX sections；source僅定位 cloud 移植邊界，不載舊review logs。

## Write Scope

- specs/workbench/cloud.md、PRD/SRS/SDD cloud-foundation section。
- 本WI及generated review WI/manifest；host audit。

## Forbidden Scope

- .ai/**、harness/**、main、既有 apps/workbench/**、其他產品／私人資料。

## Required Gates

- SPEC_GATE

## Notes

- 本次新授權有限 cloud batch，共用所有 child allocations；預設各WI累積active/wall30min，batchwall60min，tokenTARGET12000，actual null無完整aggregate telemetry。
- Spec initial Maker+一次 SPEC_REVIEWER；Design一Maker+一次UX_REVIEWER；Implementation一Maker+TECH/QA/SECURITY（auth/RLS trigger HIGH）；final DeliveryAssurance一次。每WI最多一次修正＋必需重審，上限按 2*(1+R)+G；不使用足額視為目標。Review單次120秒含報告，準備＋部署任務20min target，若账户未準備則checkpoint，不重啟舊 release batch。
- 門檻順序Spec→Design→Implementation→Assurance→Release→已授權雲端部署，branchPR不包含main merge。命令syntax/build/security測試、必要liveCRUD/RLS與mobile驗收。未取得登入／deploymenttarget前僅準備本機artifact。完整mandatory context，其他僅直接sections；缺少evidence/hash冲突/budget耗盡停止。

- SPEC_GATE PASS：WB017 exact manifest fresh independent SPEC_REVIEWER passed，未宣稱部署完成。
