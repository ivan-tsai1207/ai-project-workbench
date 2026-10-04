# Work Item Contract

| Field | Value |
|---|---|
| Schema Version | `harness.work-item/v2` |
| ID | `WBC-DESIGN` |
| Title | `Vercel Supabase 雲端基礎版規格` |
| Role | `UX_DESIGNER` |
| Feature | `workbench` |
| Phase | `DESIGN` |
| Status | `DONE` |
| Spec Version | `WB-017-v1` |
| Design Version | `WB-017-UX-v1` |
| Risk Class | `MEDIUM` |
| Review Profile | `N/A` |
| Reviewed Artifact | `N/A` |
| Reviewed Artifact Hash | `N/A` |
| Maker Execution ID | `N/A` |

## Objective

先部署 Vercel＋Supabase；AI不啟用。WB-017 / AC-WB-017。

## Read Scope

- Complete mandatory governance, UX_DESIGNER role, DESIGN_GATE and this WI。
- specs/workbench/cloud.md (SPEC_GATE PASS), local styles/ScreenSpec only on-demand。

## Write Scope

- design/workbench/cloud/UX_Contract.md
- design/workbench/cloud/screens/SCR-WBC-001.md
- design/workbench/cloud/wireframe.html
- design/workbench/cloud/Design_Source_Map.md
- work-items/WBC-DESIGN.artifact.json
- host evidence /private/tmp/cloud-workbench-evidence/design-completion.md

## Forbidden Scope

- Application runtime、.ai/**、harness/**、其他 specs、git mutations / deployment。

## Required Gates

- DESIGN_GATE；一獨立UX_REVIEWER。

## Notes

- 共用本次 cloud batch；one fresh UX_DESIGNER production execution <=180sec including self-review/report，目標120sec，無delegation。
- UX先定義一般人任務／首頁和流程、UI後；指定 email/password登入僅預建帳號，開始新專案、手動plan和append紀錄、repo連結可保存參考，AIoff/GitHub integrationoff狀態清楚。error/missingconfig/sessionexpiry/empty/loading/375px/focus/44px/epoch與draft失敗保留。無新增能力。Flat indigo/slate系統中文字型沿用，本地wireframe不connect第三方／真資料。Source map指定rawsource→screens，manifesthash。依WB017所有screen和action追溯。

- DESIGN_GATE PASS：exact design manifest fresh UX review PASS；live browser / user / cloud驗收待完成。
