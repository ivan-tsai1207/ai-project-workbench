# Agent Harness Runtime Contract

本文件定義 vendor-neutral 的 Agent runtime contract。Harness 將既有 Constitution、Authority、Workflow、Role 與 Gate 轉換成可執行限制，但不是新的 Governance Authority，也不得創造產品規則、角色權限或規格優先順序。

若本文件與較高層級治理文件或 active role / gate 衝突，必須依 `.ai/AUTHORITY.md` 停止並回報，不得由 Harness 自行選邊。

## 1. Purpose

Harness 負責：

- Runtime context assembly。
- Role binding。
- Filesystem read / write boundary enforcement。
- Tool permission boundary enforcement。
- Task lifecycle control。
- Gate execution orchestration。
- Audit evidence collection。
- Risk classification、review assignment、separation-of-duties validation與 Delivery Assurance orchestration。

Harness 不負責：

- 定義或修改產品需求。
- 修改 business rule、role、permission、API contract、data model 或 UX flow。
- 修改 Governance Authority hierarchy。
- 自行核准 Change Request。
- 自行修改 canonical spec。
- 取代 Human、Product Architect、Reviewer 或 Gate 的判斷責任。

## 2. Harness Input Contract

每次啟動 Harness 必須提供可定位 execution 與 canonical Work Item 的 input：

```yaml
task_id: string
work_item: work-items/<WORK-ITEM-ID>.md
repository: string
branch: string
```

Work Item 必須符合唯一 schema `templates/Work_Item.md`。Harness 直接從 Work Item 解析：

```yaml
role: string
feature: string
phase: string
spec_version: string
design_version: string
risk_class: LOW | MEDIUM | HIGH | CRITICAL
review_profile: string | N/A
reviewed_artifact: string | N/A
reviewed_artifact_hash: string | N/A
maker_execution_id: string | N/A
read_scope: []
write_scope: []
forbidden_scope: []
required_gates: []
```

Invocation 可選擇提供 `role`、`feature`、`phase`、`spec_version` 或 `design_version` 作 assertion，但不得覆蓋 Work Item metadata。`screen_ids`、`allowed_tools` 與 `additional_context` 是可選 runtime input，只能縮小或補充候選 context，不能擴張 Work Item、Role 或 Governance 權限。

Input validation 規則：

- Required field 不可缺少或為空。
- `task_id`、Work Item `ID` 與 filename 必須一致。
- `role` 必須能映射到既有 role 文件。
- Work Item `Role`、`Feature`、`Phase`、`Risk Class` 與 review-only fields必須明確存在；Harness 不得從 ID prefix、Title、filename、directory 或 Agent assumption 推導。
- Work Item enum、required sections、Requirement References、scope 與 Required Gates 必須通過 `templates/Work_Item.md` 的 Validation Rules。
- `work_item` 必須是 repository-relative path，且符合 canonical path。
- `repository`、`branch` 與啟動時實際 checkout 必須一致。
- Effective read / write permissions 是 Governance、active role 與 Work Item scope 的交集；Work Item 只能縮小權限。
- `forbidden_scope` 優先於 `write_scope`；scope 衝突時必須拒絕 write。
- `additional_context` 只增加候選 read context，不會自動增加 write 或 tool permission。
- Input 無效或 required file 不存在時，進入 `BLOCKED_PERMISSION` 或 `MISSING_REQUIRED_CONTEXT` 對應的停止流程。
- Risk只能由 trusted Orchestrator / Harness policy計算或提高；Invocation、Work Item執行 Agent或 adapter不得降低。
- `REVIEWER` Work Item必須通過 profile、artifact、hash與 Maker execution identity驗證；非 Reviewer的 review-only fields必須為 `N/A`。

## 3. Role Binding

Role binding 必須使用下列固定映射：

| Role ID | Governance Source |
|---|---|
| `PRODUCT_ARCHITECT` | `.ai/roles/product-architect.md` |
| `UX_DESIGNER` | `.ai/roles/ux-designer.md` |
| `IMPLEMENTER` | `.ai/roles/implementer.md` |
| `REVIEWER` | `.ai/roles/reviewer.md` |

- 一個 execution context 只能綁定一個 active role。
- Agent 不得在執行期間自行修改、提升或切換 role。
- 任務需要另一個 role 時，必須結束目前 execution，建立新的 task 或 execution context，重新編譯 context 與 permissions。
- Role permission 來自 active role、assigned work item 與既有 Governance Authority；Harness 只能取其交集，不得擴張。
- `REVIEWER` 必須另外綁定 `.ai/roles/reviewer-profiles/<review-profile>.md`；profile是 subordinate responsibility，不是第五個 Role或 permission source。
- Reviewer Profile由 Orchestrator / Harness指派；一個 execution只能有一個 primary profile，Agent不得自選或切換。
- Maker execution ID不得等於 final Checker execution ID。只更換 prompt、model label或 role文字不構成新的 independent execution。

## 4. Context Compiler

Operational context target 與有限 execution / time / telemetry 規則依 `.ai/WORKFLOW.md#bounded-execution-economy`；SDD 43 host defaults / ceilings 不變，文件政策不代表 runtime 已實作。

Harness 必須根據 `role`、`feature`、`phase` 與 `work_item` 建立最小必要 Context Package。

Mandatory Governance Context：

```text
.ai/CONSTITUTION.md
.ai/AUTHORITY.md
.ai/WORKFLOW.md
.ai/roles/<active-role>.md
```

`REVIEWER` 還必須載入 Work Item綁定的：

```text
.ai/roles/reviewer-profiles/<review-profile>.md
reviewed artifact / manifest and exact hash
Maker Role Completion Evidence
related findings and prior invalidated reviews
```

若目前階段有 active gate，還必須載入：

```text
.ai/gates/<active-gate>.md
```

Delivery Context 選擇原則：

| Role | Required Delivery Context |
|---|---|
| `PRODUCT_ARCHITECT` | 使用者資料來源、Source Map、相關 canonical specs、assigned work item |
| `UX_DESIGNER` | Product Vision、PRD、相關 SRS、Feature Spec、assigned work item、現有 Design Contract |
| `IMPLEMENTER` | 相關 Architecture / SDD、Feature Spec、Screen Spec、assigned work item、相關 source code 與 tests |
| `REVIEWER` | 被審查產物 / manifest、其上層 canonical specs、assigned profile、Maker evidence、findings、assigned work item、active gate |

Context Compiler 必須：

- 遵守 Principle of Least Context，不得預設無差別載入整個 repository。
- 依 feature、requirement、screen ID、work item 與版本縮小 context。
- 將實際載入清單寫入 `context_files` audit evidence。
- 驗證 context path 位於允許的 repository scope 內。
- Required context 缺失、版本不符或互相衝突時停止，不得以 Agent 推論補齊。
- Context Compiler必須驗證 reviewed artifact實際 SHA-256與 Work Item一致；hash變更使舊 review context與 PASS失效。

## 5. Filesystem Boundary

Filesystem permission 分為：

```text
read
write
deny_write
```

共同語意：

- `deny_write` 優先於 `write`。
- `read` 不隱含 `write`；未明確允許的 write 預設拒絕。
- Work item 只能在 active role 允許範圍內縮小或具體化權限，不能擴張 role 權限。
- Work Item `Read Scope`、`Write Scope`、`Forbidden Scope` 由 Harness 分別正規化為 task-specific read、write 與 deny-write policy；`Forbidden Scope` 永遠優先。
- Path 必須先正規化；path traversal、symlink escape 或 repository 外路徑一律拒絕。
- Harness 自身的 audit sink 與 Agent write boundary 分離，Agent 不得修改 audit evidence。

### PRODUCT_ARCHITECT Default

```yaml
read:
  - docs/**
  - specs/**
  - design/**
  - work-items/<assigned-work-item>.md
  - traceability/**
write:
  - docs/**
  - specs/**
  - docs/05_decisions/**
  - work-items/<assigned-work-item>.md
  - traceability/**
deny_write:
  - src/**
  - migrations/**
  - design/**
```

### UX_DESIGNER Default

```yaml
read:
  - docs/**
  - specs/**
  - design/<feature>/**
  - work-items/<assigned-design-work-item>.md
write:
  - design/<feature>/**
  - work-items/<assigned-design-work-item>.md
  - traceability/** # 僅限 design mapping
deny_write:
  - docs/**
  - specs/**
  - src/**
  - migrations/**
```

### IMPLEMENTER Default

```yaml
read:
  - docs/04_system/**
  - specs/<feature>/**
  - design/<feature>/**
  - work-items/<assigned-work-item>.md
  - src/**
  - tests/**
write:
  - src/**
  - tests/**
deny_write:
  - docs/**
  - specs/**
  - design/**
  - migrations/**
```

必要工程設定或 migration 只有在既有規格、active role 與 assigned work item 都明確授權時，才能由專用 execution context 開放；不得由 Implementer 自行擴張。

### REVIEWER Default

```yaml
read:
  - relevant canonical specs
  - artifact under review
  - assigned work item
  - related source code and tests
write: []
deny_write:
  - docs/02_product/**
  - docs/03_requirements/**
  - docs/04_system/**
  - specs/**
  - design/**
  - src/**
  - migrations/**
```

Reviewer 預設為 read-only。若 assigned work item 明確要求產出 review log，可只開放指定的 `docs/08_agent_reviews/**` 路徑，不得同時開放被審查產物。

## 6. Tool Boundary

Harness 必須支援：

```yaml
allow_tools: []
deny_tools: []
```

Input Contract 的 `allowed_tools` 是任務要求；Context Compiler 必須將它與 role、work item 及治理限制取交集，產生 runtime `allow_tools`。`deny_tools` 可由治理規則、role、environment 或 Harness policy 產生。

`deny_tools` 優先於 `allow_tools`。工具至少分為：

- `filesystem`
- `shell`
- `git`
- `github`
- `browser`
- `figma`
- `database`
- `deployment`
- `external_api`

工具權限必須遵守 least privilege，並可限制 operation、environment、resource 與 path：

- `UX_DESIGNER` 可依 work item 使用 design、browser、Figma 與必要的 read-only repo 工具，但預設不得取得 production database、migration、source write 或 production deployment 權限。
- `IMPLEMENTER` 可使用實作與測試所需的 filesystem、shell、git 或 development tools，但不得透過工具修改 canonical Product Spec 或繞過 filesystem boundary。
- `PRODUCT_ARCHITECT` 不因可修改規格而自動取得 source code、database 或 deployment write capability。
- `REVIEWER` 預設使用 read-only tools；任何修正行為需建立新的對應 role execution。

## 7. Command Boundary

Shell command 必須先分類：

| Class | 說明 | Default Policy |
|---|---|---|
| `safe_read` | 查詢檔案、狀態、logs、diff、metadata | 依 read boundary 允許 |
| `development_write` | formatter、test output、build、一般開發檔案修改 | 依 role、work item 與 write boundary 允許 |
| `destructive` | 刪除、覆蓋、資料破壞、history rewrite | Restricted |
| `deployment` | preview、staging、production deployment | 依環境與明確授權限制 |
| `credential_sensitive` | secret、token、API key、credential 操作 | Restricted |

Restricted operations 至少包含：

- `rm` 或其他 destructive delete。
- Destructive database migration、drop、truncate 或 production data write。
- Force push、history rewrite 或刪除 remote branch / tag。
- Production deploy、production resource change 或 release promotion。
- Secret、credential、API key 的讀取、輸出、建立、修改或分享。

Restricted operation 不得由 Agent 自行核准。Harness 必須阻擋或暫停，取得既有治理規則要求的人類明確授權，並記錄 approval 與實際執行結果。

## 8. Task Lifecycle

正常狀態：

```text
CREATED
→ CONTEXT_READY
→ RUNNING
→ VALIDATING
→ COMPLETED
```

例外狀態：

```text
BLOCKED_SPEC_GAP
BLOCKED_SPEC_CONFLICT
BLOCKED_PERMISSION
FAILED_GATE
FAILED_RUNTIME
CANCELLED
```

Lifecycle 規則：

- 只有 Input Contract、Role Binding、Context Package 與 permissions 驗證完成後，才能進入 `CONTEXT_READY`。
- Agent 只能在 `RUNNING` 執行工作。
- 任務完成後必須進入 `VALIDATING` 並執行 required gates。
- 只有 required gates 全部通過，且沒有未處理 stop condition，才能進入 `COMPLETED`。
- Maker execution完成 Self Review與 Role Completion Evidence後只能成為 review candidate；不得自行產生 final Checker PASS。
- Review execution必須先通過 separation、profile assignment、artifact hash與 required evidence驗證。
- Release candidate只有在 required Independent Reviews、phase Gates與 `DELIVERY_ASSURANCE_GATE`通過後才能進入 Release Gate PASS候選。
- Blocked execution 不得偷換 context、role、spec version 或 permissions 後原地繼續；需要更新時建立新的 execution context。

## 9. Stop Conditions

Harness 必須停止受影響工作：

| Condition | Required Result |
|---|---|
| `SPEC_GAP` | `BLOCKED_SPEC_GAP`，提出或建議 Change Request |
| `SPEC_CONFLICT` | `BLOCKED_SPEC_CONFLICT`，列出衝突與權威來源 |
| `UNAUTHORIZED_WRITE` | 阻擋 write，進入 `BLOCKED_PERMISSION` |
| `UNAUTHORIZED_TOOL` | 阻擋 tool call，進入 `BLOCKED_PERMISSION` |
| `OUT_OF_SCOPE_CHANGE` | 阻擋變更並回報 work item scope deviation |
| `MISSING_REQUIRED_CONTEXT` | 不啟動或停止 execution，補齊後建立新 context |
| `GATE_FAILURE` | `FAILED_GATE`，保留 gate evidence |
| `SELF_APPROVAL` | 拒絕 review，建立不同 Reviewer execution |
| `REVIEW_PROFILE_UNASSIGNED` | 不啟動 Reviewer；由 Orchestrator重新指派 |
| `REVIEWED_ARTIFACT_CHANGED` | 舊 PASS失效，建立新 review assignment |
| `REQUIRED_REVIEW_MISSING` | Gate不得 PASS，產生缺失 profile finding |
| `OPEN_BLOCKING_FINDING` | Delivery Assurance不得 PASS |
| `RISK_DOWNGRADE_ATTEMPT` | 拒絕變更並記錄 policy violation |

- Agent 不得忽略、重新命名、降低嚴重度或自動繞過 Stop Condition。
- Harness 只停止受影響範圍；是否終止整個 task 依 active gate、work item 與治理規則判定。

## 10. Change Request Integration

```text
Agent reports SPEC GAP
→ Execution blocked where necessary
→ Change Request
→ Human / authorized role review
→ Canonical Spec Updated
→ New execution context
→ Continue
```

- Harness 不得允許 Agent 直接修改 canonical spec 來解除自己的 `SPEC_GAP`。
- Change Request lifecycle 與權威規則來自 `.ai/AUTHORITY.md`。
- CR 核准但尚未寫回 canonical spec 時，不得解除 blocked state。
- Canonical spec 更新後必須建立新的 execution ID，重新綁定 spec version、context 與 permissions；不得沿用舊 execution context 偷渡需求。

## 11. Gate Integration

Harness 負責 orchestrate：

```text
SPEC_GATE
DESIGN_GATE
IMPLEMENTATION_GATE
DELIVERY_ASSURANCE_GATE
RELEASE_GATE
```

- Gate 規則只來自 `.ai/gates/**`，Harness 不得修改、放寬或建立第二套判定標準。
- Harness 依 `phase`、active role 與 work item 的 `required_gates` 選擇 active gate。
- Phase 的 default gate 與 canonical Gate ID 以 `templates/Work_Item.md` 為準；Work Item 可增加 Gate，但不能移除 Governance / Workflow 強制要求的 Gate。
- `REVIEW` 必須由 Work Item 明確引用被審查 artifact / hash、Maker execution與對應 Gate；Harness 不得自行猜測 artifact phase或 profile。
- Active gate 文件必須加入 Context Package。
- Review decision使用 `PASS / REQUEST_CHANGES / BLOCK`。Gate結果必須記錄為 `PASS / FAILED / NEEDS_CLARIFICATION`並連結 evidence；兩者不得混成同一 enum。
- Gate failure 進入 `FAILED_GATE`；豁免必須來自治理規則允許的授權者並留下 audit evidence。
- Spec / Design / Implementation Gate必須驗證對應 required Reviewer Profile evidence。QA / Security依 Risk Policy計算，不得機械式套用全部 task或由 Agent自行跳過。
- `DELIVERY_ASSURANCE_GATE`只接受 `DELIVERY_ASSURANCE_REVIEWER` Work Item，且 `OPEN BLOCKING` finding、missing review、stale hash或 unresolved conflict時不得 PASS。
- `RELEASE_GATE`在 required Delivery Assurance缺失或失效時不得 PASS。

## 12. Audit Contract

每次 execution 必須能記錄：

```yaml
execution_id: string
task_id: string
role: string
risk_class: string
review_profile: string | null
maker_execution_id: string | null
reviewer_execution_id: string | null
agent: string
model: string
tool_adapter: string
repository: string
branch: string
commit_before: string
context_files: []
files_read: []
files_written: []
commands_executed: []
tools_used: []
blocked_actions: []
gate_results: []
role_completion_evidence: []
review_assignments: []
reviewed_artifacts: []
review_findings: []
delivery_assurance_results: []
spec_gaps: []
spec_conflicts: []
commit_after: string | null
final_status: string
```

- Audit evidence 記錄 execution facts，不是產品或系統 Source of Truth。
- Budget counters、resume clocks、context selections 與 stop evidence 依 `.ai/WORKFLOW.md#bounded-execution-economy` 留在既有 audit / Notes，不新增 schema。
- Audit evidence 不得覆蓋 canonical spec、Gate rule 或 Change Request decision。
- Agent 不得修改、刪除或偽造 Harness 已記錄的 evidence。
- 敏感資訊必須遮罩；不得將 secret 或 credential 寫入 audit log。

Role Completion Evidence至少包含 execution ID、Work Item、Role、Review Profile、artifact / hash、spec references、checks、tests、findings、known limitations、result與 timestamp。Implementer還必須記錄 changed files、diff scope、typecheck、lint、unit / integration test、build、security check與 commit hash。Agent自述不是足夠 evidence。

Finding Severity只允許 `BLOCKING / MAJOR / MINOR / OBSERVATION`；Status只允許 `OPEN / RESOLVED / ACCEPTED_RISK / SUPERSEDED`。`ACCEPTED_RISK`必須引用既有 Governance授權的 Human / authority evidence，Agent不得自行決定。

## 13. Accountability and Assurance Enforcement

Harness必須依 Work Item、artifact type、changed paths與 canonical trigger計算 Risk Class，然後產生 required Reviewer Profile set。最低 policy：

| Risk | Required review policy |
|---|---|
| `LOW` | Artifact-aligned basic Checker |
| `MEDIUM` | Basic Checker + QA when artifact / behavior requires |
| `HIGH` | Tech / QA + Security when security trigger applies |
| `CRITICAL` | Tech + QA + Security + Delivery Assurance + existing Human high-risk approval |

Required reviewer calculation、assignment與 finding state必須由 host-owned orchestration / audit管理。Agent不得選擇自己的 Reviewer、降低 Risk、刪除 finding或宣告 evidence完整。

Enforcement invariants：

1. Maker不能 final approve自己的 artifact。
2. Review execution ID必須不同於 Maker execution ID。
3. Checker不得在同一 execution修改並批准 artifact。
4. Artifact hash改變使先前 review PASS與 dependent Gate evidence失效。
5. Required Reviewer缺失時 phase Gate不得 PASS。
6. `OPEN BLOCKING` finding時 Delivery Assurance不得 PASS。
7. Delivery Assurance缺失或 stale時 Release Gate不得 PASS。
8. Final Assurer不得參與原始 production，也不得修改 artifact後自行批准。

Review assignment至少記錄 assignment ID、Work Item、Risk、Profile、Maker identity / execution、Reviewer identity / execution、artifact / hash、required checks與 evidence。違反 invariants必須 fail closed並留 audit evidence。

## 14. Agent Adapter Principle

Harness Contract 必須保持 vendor-neutral：

- Claude、Codex、Gemini、Hermes 與其他 Agent 都只是 adapter。
- 所有 adapter 共用 Harness Contract、Governance 與 canonical Specifications。
- Adapter 只負責將共用限制轉換成工具支援的 permission、prompt、hook、sandbox 與 tool configuration。
- Adapter 不得另建互相矛盾的 Authority、Role、Gate、Stop Condition 或 Specification hierarchy。
- 工具缺少必要 enforcement capability 時，adapter 必須回報限制或拒絕啟動，不得假裝已強制執行。

## 15. Example Execution Profiles

以下內容只示範 Contract，不建立實際 project artifact。

### UX_DESIGNER Example

```yaml
task:
  task_id: DESIGN-INV-001
  role: UX_DESIGNER
  feature: inventory
  phase: DESIGN
  risk_class: MEDIUM
  review_profile: N/A
  work_item: work-items/DESIGN-INV-001.md
  repository: example/inventory-system
  branch: feature/inventory_design

context:
  required:
    - .ai/CONSTITUTION.md
    - .ai/AUTHORITY.md
    - .ai/WORKFLOW.md
    - .ai/roles/ux-designer.md
    - .ai/gates/design-gate.md
    - docs/02_product/PRODUCT_VISION.md
    - docs/02_product/PRD.md
    - docs/03_requirements/SRS.md
    - specs/inventory/spec.md
    - work-items/DESIGN-INV-001.md

filesystem:
  read:
    - docs/**
    - specs/**
    - design/inventory/**
    - work-items/DESIGN-INV-001.md
  write:
    - design/inventory/**
    - work-items/DESIGN-INV-001.md
  deny_write:
    - docs/**
    - specs/**
    - src/**
    - migrations/**

tools:
  allow:
    - filesystem:scoped
    - browser:design-reference
    - figma:assigned-file
    - git:read
  deny:
    - database:production
    - deployment:production
    - external_api:unapproved

required_gates:
  - DESIGN_GATE

stop_on:
  - SPEC_GAP
  - SPEC_CONFLICT
  - UNAUTHORIZED_WRITE
  - UNAUTHORIZED_TOOL
  - OUT_OF_SCOPE_CHANGE
  - MISSING_REQUIRED_CONTEXT
  - GATE_FAILURE
```

### IMPLEMENTER Example

```yaml
task:
  task_id: PBI-INV-003
  role: IMPLEMENTER
  feature: inventory
  phase: IMPLEMENTATION
  risk_class: MEDIUM
  review_profile: N/A
  work_item: work-items/PBI-INV-003.md
  repository: example/inventory-system
  branch: feature/inventory_list

context:
  required:
    - .ai/CONSTITUTION.md
    - .ai/AUTHORITY.md
    - .ai/WORKFLOW.md
    - .ai/roles/implementer.md
    - .ai/gates/implementation-gate.md
    - docs/04_system/ARCHITECTURE.md
    - docs/04_system/SDD.md
    - specs/inventory/spec.md
    - design/inventory/screens/SCR-INV-001.md
    - work-items/PBI-INV-003.md

filesystem:
  read:
    - docs/04_system/**
    - specs/inventory/**
    - design/inventory/**
    - work-items/PBI-INV-003.md
    - src/**
    - tests/**
  write:
    - src/**
    - tests/**
  deny_write:
    - docs/**
    - specs/**
    - design/**
    - migrations/**

tools:
  allow:
    - filesystem:scoped
    - shell:development
    - git:development
    - github:read
    - browser:test
  deny:
    - database:production
    - deployment:production
    - external_api:unapproved

required_gates:
  - IMPLEMENTATION_GATE

stop_on:
  - SPEC_GAP
  - SPEC_CONFLICT
  - UNAUTHORIZED_WRITE
  - UNAUTHORIZED_TOOL
  - OUT_OF_SCOPE_CHANGE
  - MISSING_REQUIRED_CONTEXT
  - GATE_FAILURE
```

## 16. Non-Goals

本版本不處理：

- 實際 sandbox implementation。
- Docker。
- GitHub Actions。
- CI implementation。
- Claude hooks implementation。
- Codex sandbox configuration。
- Production deployment enforcement。

以上項目屬於後續 Harness Implementation；本文件只定義 contract。
