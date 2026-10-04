# Work Item Contract

| Field | Value |
|---|---|
| Schema Version | `harness.work-item/v2` |
| ID | `WBC-SPEC-REVIEW` |
| Title | `Vercel Supabase 雲端基礎版規格` |
| Role | `REVIEWER` |
| Feature | `workbench` |
| Phase | `SPEC` |
| Status | `IN_PROGRESS` |
| Spec Version | `WB-017-v1` |
| Design Version | `N/A` |
| Risk Class | `MEDIUM` |
| Review Profile | `SPEC_REVIEWER` |
| Reviewed Artifact | `work-items/WBC-SPEC.artifact.json` |
| Reviewed Artifact Hash | `sha256:482ae09ff51d72b110738eb91cd76c075c4ec564a9eaa188542b9794d4181b6c` |
| Maker Execution ID | `01a10825-4156-7931-82e6-d4014742d978` |

## Objective

先部署 Vercel＋Supabase；AI不啟用。WB-017 / AC-WB-017。

## Read Scope

- Mandatory .ai/CONSTITUTION.md, AUTHORITY.md, WORKFLOW.md, active role/gate。
- 本 WI、manifest與四文件；已確認 WB016 與 workbench現有UX sections；source僅定位 cloud 移植邊界，不載舊review logs。

## Write Scope

- /private/tmp/cloud-workbench-evidence/spec-review.md only; no candidate edits.

## Required Gates

- SPEC_GATE

## Notes

- 共用 parent cloud batch；一次 fresh SPEC_REVIEWER review，120sec含報告，無 delegation；mandatory REVIEWER + spec-reviewer profile + spec gate。
- 本次仅审WB017增量；核對hash、auth/RLS与公开key、AIoff scope、失敗UX、traceability。報告附 actual task_started execution UUID、MakerUUID、artifact hash、checks/findings/decision/timestamp。
