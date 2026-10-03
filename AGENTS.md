# AGENTS.md

本文件是跨 Agent 的 repository bootstrap router。它不是 Framework handbook，也不取代 `.ai/CONSTITUTION.md`、`.ai/AUTHORITY.md` 或其他 canonical contract。

## Bootstrap

1. 先辨識 assigned Work Item；沒有 Work Item 的新專案請依 `.ai/PROJECT_INTAKE_CONTRACT.md` 路由，不得自行猜測 Role、Risk 或 Gate。
2. 只載入 Tier 1 mandatory context：
   - `.ai/CONSTITUTION.md`
   - `.ai/AUTHORITY.md`
   - `.ai/WORKFLOW.md`
   - `.ai/roles/<active-role>.md`
   - assigned `work-items/<WORK-ITEM-ID>.md`
   - `.ai/gates/<active-gate>.md`
   - Work Item 直接引用的 canonical requirements
3. `Role: REVIEWER` 時，再載入 Work Item 指派的 `.ai/roles/reviewer-profiles/<review-profile>.md`。Profile 是 `REVIEWER` 的 subordinate binding，不是新 Role 或 Authority。
4. 只有 Harness execution 或 runtime boundary 判定需要時，才載入 `.ai/HARNESS_CONTRACT.md`。
5. 其他 specs、SDD sections、source、tests、skills 或 templates 只可依任務需要 on demand 載入。

不得預設讀取 `docs/**`、`skills/**`、`templates/**`、`agent_roles/**`、`specs/**` 或整個 repository。可解析的 section / anchor reference 必須優先抽取該區段，不得預設載入整份文件。

## Routing Rules

- Git repository 內的 canonical artifacts 是 Source of Truth；Agent 與對話不是。
- Authority、Role、Reviewer Profile、Risk、Gate 與 scope 只能來自 canonical governance 與 assigned Work Item。
- Review routing 使用 `Work Item -> Role: REVIEWER -> assigned Reviewer Profile -> Risk -> active Gate`。`agent_roles/**` 與 `docs/review_role_matrix.md` 只能作非 canonical navigation / professional reference。
- 不得擴張 Read Scope、Write Scope、Role、Gate 或 tool permission；Forbidden Scope 永遠優先。
- 規格不足時提出 Change Request；規格衝突時停止並回報 `SPEC CONFLICT`。
- Maker 不得 final approve 自己的 artifact；artifact hash 改變後，既有 review evidence 失效。
- 高風險或 restricted operation 依 Constitution、Workflow 與 active Gate 取得必要 Human approval。
- 初始 context 必須 small-by-default；額外 context 需經 Role、Read Scope、Policy 與 budget 驗證並留下 audit evidence。
- 有限 plan、共用 budget、context target 與 stop / resume 規則只依 `.ai/WORKFLOW.md#bounded-execution-economy`；不形成新 Role 或 runtime permission。

## Detailed Rules

- Authority 與衝突處理：`.ai/AUTHORITY.md`
- Lifecycle 與 handoff：`.ai/WORKFLOW.md`
- Project Intake：`.ai/PROJECT_INTAKE_CONTRACT.md`
- Runtime enforcement：`.ai/HARNESS_CONTRACT.md`
- Role / Reviewer Profile：`.ai/roles/**`
- Gate criteria：`.ai/gates/**`
- 跨 LLM 操作慣例：`LLM_OPERATING_RULES.md`
- 任務專用流程與產物格式：只在需要時讀取對應 `skills/**`、`templates/**`
