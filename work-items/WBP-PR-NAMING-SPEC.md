# Work Item Contract

| Field | Value |
|---|---|
| Schema Version | `harness.work-item/v2` |
| ID | `WBP-PR-NAMING-SPEC` |
| Title | `文件化中文 PR 命名規則` |
| Role | `PRODUCT_ARCHITECT` |
| Feature | `workbench` |
| Phase | `SPEC` |
| Status | `DONE` |
| Spec Version | `workbench-v0.4 + WB-016` |
| Design Version | `N/A` |
| Risk Class | `MEDIUM` |
| Review Profile | `N/A` |
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

- `docs/03_requirements/PR_NAMING_RULES.md`
- `docs/02_product/PRD.md`
- `docs/03_requirements/SRS.md`
- `docs/04_system/SDD.md`
- `specs/workbench/spec.md`
- `LLM_OPERATING_RULES.md`
- `README.md`

- 本 Work Item、對應 Review Work Item 與 artifact manifest。

## Forbidden Scope

- `.ai/**`, `harness/**`, `apps/**`, production / default-branch merge。

## Acceptance Criteria

- [x] `AC-WB-016`: 單一前綴、正體中文摘要、依變更選類型與失敗流程均有規定。
- [x] PRD / SRS / SDD / Feature Spec / Agent 指引引用同一命名規則。
- [x] 文件明示工作台程式尚未套用；不宣稱 runtime enforcement 或既有 Release Gate 完成。

## Required Gates

- `SPEC_GATE`；獨立 `SPEC_REVIEWER`，只審本次文件增量。

## Notes

- 使用者已授權寫入 repo；此文件增量不重啟先前已停止的工作台實作 / release batch。
- 有限工作：七份文件、靜態連結 / diff 範圍檢查、一次獨立 Spec review、提交並推送既有 draft PR。應用程式不修改，因此不重跑應用程式測試。
- 初輪 Maker + 一次 SPEC_REVIEWER；最多一次文件修正與一次重新審查，上限四次 executions。每 WI active / wallclock 上限 30 分鐘、batch wallclock 上限 60 分鐘；review 單次最多 120 秒。Token target 8,000，actual null，缺少完整 aggregate telemetry，依有限 count / time 停止。
- 完成文件候選即停止；衝突、未完成 required review 或 allocation 耗盡時保留候選，禁止宣稱通過。

- 本次文件增量已完成獨立 Spec review 與 SPEC_GATE 核對；runtime 修改、原有 release / merge 保持待完成。
