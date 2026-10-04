# Work Item Contract

| Field | Value |
|---|---|
| Schema Version | `harness.work-item/v2` |
| ID | `WBC-DESIGN-REVIEW` |
| Title | `Vercel Supabase 雲端基礎版規格` |
| Role | `REVIEWER` |
| Feature | `workbench` |
| Phase | `DESIGN` |
| Status | `IN_PROGRESS` |
| Spec Version | `WB-017-v1` |
| Design Version | `WB-017-UX-v1` |
| Risk Class | `MEDIUM` |
| Review Profile | `UX_REVIEWER` |
| Reviewed Artifact | `work-items/WBC-DESIGN.artifact.json` |
| Reviewed Artifact Hash | `sha256:3fad51705403c3f4e0a0caf648c241dd3ad2bca2ed3abd9d8de289fdab9e0ac9` |
| Maker Execution ID | `01a1082a-d5ae-7273-bf02-36ada3e3e831` |

## Objective

先部署 Vercel＋Supabase；AI不啟用。WB-017 / AC-WB-017。

## Read Scope

- Complete mandatory governance, UX_DESIGNER role, DESIGN_GATE and this WI。
- specs/workbench/cloud.md (SPEC_GATE PASS), local styles/ScreenSpec only on-demand。

## Write Scope

- Host /private/tmp/cloud-workbench-evidence/ux-review.md only; candidate readonly。

## Required Gates

- DESIGN_GATE

## Notes

- 一次fresh UX_REVIEWER parentcloudallocation，120sec含報告；fullmandatoryREVIEWER/ux-reviewer/designgate; 4designfiles+manifest+cloudspec，source仅wireframe，無oldlogs/应用source/delegation。確認UX→UI、WB017action/API/noextra capability、AIofftruth、states/isolation/失败draft、labels/focus/mobile375/frame source map；actualexecutionUUID/hash/checks/findings/limitations/decision。不能宣稱live驗收或最終部署。
