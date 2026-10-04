# Work Item Contract

| Field | Value |
|---|---|
| Schema Version | `harness.work-item/v2` |
| ID | `WBP-PR-NAMING-REVIEW` |
| Title | `文件化中文 PR 命名規則` |
| Role | `REVIEWER` |
| Feature | `workbench` |
| Phase | `SPEC` |
| Status | `DONE` |
| Spec Version | `workbench-v0.4 + WB-016` |
| Design Version | `N/A` |
| Risk Class | `MEDIUM` |
| Review Profile | `SPEC_REVIEWER` |
| Reviewed Artifact | `work-items/WBP-PR-NAMING.artifact.json` |
| Reviewed Artifact Hash | `sha256:fdc0b268a5c7eac3e3456ab914b1a853cddd61c5f53ad47d0d9fb3900e9db7c5` |
| Maker Execution ID | `01a10814-7188-7ae0-8c0a-c8fd2d117b12` |

## Objective

將使用者要求的中文 PR 命名規則納入 repository 正式需求，供 Agent 與工作台後續實作引用。

## Requirement References

- `WB-016` / `AC-WB-016`: `docs/03_requirements/PR_NAMING_RULES.md`
- `specs/workbench/spec.md#pr-naming-rules`
- `docs/02_product/PRD.md#pr-naming-rules`
- `docs/03_requirements/SRS.md#pr-naming-rules`
- `docs/04_system/SDD.md#pr-naming-rules`

## Read Scope

- `.ai/CONSTITUTION.md`, `.ai/AUTHORITY.md`, `.ai/WORKFLOW.md`
- `.ai/roles/product-architect.md`, `.ai/gates/spec-gate.md`
- 本 Work Item、manifest 與 manifest 中七份文件；需求文件優先抽取相關區段。

## Write Scope

- 僅指定 host review evidence；不得修改 repository 受審文件。

## Forbidden Scope

- 全部受審 artifact、application source、git mutations、其他 reviewer delegation。

## Required Gates

- `SPEC_GATE`

## Notes

- Parent: `WBP-PR-NAMING-SPEC`，共用 parent finite allocation；一次 fresh SPEC_REVIEWER execution，最長 120 秒含報告。
- Mandatory context 另含 `.ai/roles/reviewer.md`、`.ai/roles/reviewer-profiles/spec-reviewer.md`。
- 核對 manifest hash / 七文件 hashes、WB-016 traceability、既有 authority / scope、acceptance failure flows 與 pending runtime 事實；輸出 profile、獨立 execution ID、hash、checks、findings、limitations、timestamp 與 decision。不得修正後自行批准。

- 本次文件增量已完成獨立 Spec review 與 SPEC_GATE 核對；runtime 修改、原有 release / merge 保持待完成。
