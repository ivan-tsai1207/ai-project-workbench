# LLM Operating Rules

本文件是跨 LLM 的通用操作規則。若目標工具支援 `AGENTS.md`，以其作為 repository entrypoint；治理權威仍依 `.ai/AUTHORITY.md`，本文件不得覆蓋 Constitution。

## 核心原則

1. 使用者的系統想法需被整理為可交付的產品與技術文件。
2. LLM 不應只靠自身猜測理解需求，必須讀取使用者提供的資料來源。
3. LLM 只能依 assigned Work Item 的 active Role 工作；正式 review 使用 `REVIEWER` 及系統指派的 Reviewer Profile，不以固定 legacy Agent 群組決定審查範圍。
4. 沒有明確要求的事不要做；必要延伸需標記並詢問。
5. 高風險操作必須先詢問。
6. 所有系統專案需沉澱至 GitHub private repo 與 Obsidian-compatible Markdown 記憶。
7. Git repository 內的規格文件是 Source of Truth；LLM 不得用對話推論覆蓋 repo 規格。

## Agentic Substrate

- `.ai/CONSTITUTION.md` 定義最高治理規則。
- `.ai/AUTHORITY.md` 定義規格衝突時的權威順序。
- `.ai/WORKFLOW.md` 定義 ChatGPT / Claude / Codex 的交接流程。
- `.ai/HARNESS_CONTRACT.md` 將既有治理規則轉換成 vendor-neutral runtime boundary，但不加入 Authority hierarchy。
- `specs/<feature>/spec.md` 是功能開發的 Living Feature Spec。
- `design/<feature>/screens/<SCREEN-ID>.md` 是 UX Contract，不得新增未授權 product capability。
- `work-items/<WORK-ITEM-ID>.md` 定義單次任務的 delta、read / write / forbidden 範圍。
- `traceability/**` 或 `templates/Traceability.yaml` 用於追蹤 requirement、screen、API 與 tests。
- `agent_roles/**` 只提供非 canonical professional reference，不決定 required reviews、Reviewer Profile、Risk、Gate或Authority。

## Canonical Project Paths

- Product Vision：`docs/02_product/PRODUCT_VISION.md`
- PRD：`docs/02_product/PRD.md`
- SRS：`docs/03_requirements/SRS.md`
- Architecture：`docs/04_system/ARCHITECTURE.md`
- SDD：`docs/04_system/SDD.md`
- ADR：`docs/05_decisions/ADR-*.md`
- Feature Spec：`specs/<feature>/spec.md`
- Design Source Map：`design/<feature>/Design_Source_Map.md`
- Screen Spec：`design/<feature>/screens/<SCREEN-ID>.md`
- Work Item：`work-items/<WORK-ITEM-ID>.md`

發生上下層規格衝突時停止並回報 `SPEC CONFLICT`。ADR 與 Change Request 的權威與寫回規則以 `.ai/AUTHORITY.md` 為準。

## 記憶策略

- 先依 `AGENTS.md` 載入 mandatory context；僅在 assigned scope 需要時讀取 `docs/00_index.md`、直接引用 ADR 或指定 Session Log。
- Finite plan、budget / stop / resume 與最小 evidence 依 `.ai/WORKFLOW.md#bounded-execution-economy`；已有授權的同一有限 scope 不重問。
- 每次有實質討論、規則變更、文件更新、程式變更、決策、風險或未解問題時，需更新 Session Log。
- 一般寒暄或無實質內容不記錄。
- Session Log 不寫逐字稿、不寫流水帳，只記錄能幫助未來恢復上下文的內容。
- 已有 command / review evidence 只留 durable link，不複製；無授權寫入範圍時留下 scoped handoff。
- Session Log 長度原則：一般討論約 300 到 800 字；複雜討論可到約 1,500 字。

## 分級執行

- MVP：快速驗證，但仍需 Source Map、完整 SDD、架構文件、GitHub workflow 與記憶同步。
- Standard：一般正式專案規劃與開發前文件。
- Formal：正式 SI / Production 交付。

## Gate

- `SPEC_GATE`：PRD、Architecture / SDD、Feature Spec 不得互相矛盾，且需有獨立 `SPEC_REVIEWER` evidence。
- `DESIGN_GATE`：Screen、Action、State 必須可追溯到 requirement，且需有獨立 `UX_REVIEWER` evidence。
- `IMPLEMENTATION_GATE`：Code 必須符合 Feature Spec、Design Contract 與 Work Item，且至少需有獨立 `TECH_REVIEWER` evidence；QA / Security依 Risk決定。
- `DELIVERY_ASSURANCE_GATE`：獨立確認 Maker / Checker / Assurer separation、required reviews、findings與 evidence完整性。
- `RELEASE_GATE`：只有 required Delivery Assurance通過，且測試、資安、traceability與Living Spec完成後，才可成為 release候選。

Reviewer decision使用 `PASS / REQUEST_CHANGES / BLOCK`；GateResult使用 `PASS / FAILED / NEEDS_CLARIFICATION`，不得混用。Required Reviewer set由 Orchestrator / Harness依 Work Item、Risk與 artifact type計算，Agent不得自行選擇或省略。

## 框架 repo 分支策略

- `main` 是穩定正式版，更新前必須取得使用者確認。
- `develop` 是下一版整合區，更新後需回報更新內容，並注意其他 agent 可能讀到新版規則。
- 日常框架維護需從 `develop` 建立工作 branch；若使用者明確要求，才可直接 commit 到 `develop`。
- merge 或更新到 `main` 時，必須告知本次更新內容與影響範圍。

## 模式指定

可用明確指令指定：

```text
/mode mvp
/mode standard
/mode formal
```

也可使用自然語言指定，例如「用 MVP 模式做」、「用正式 SI 模式整理」、「這次只要快速驗證」或「這次要完整規格」。

## PR 標題

建立或修改 PR 前讀取 [PR 命名規則](docs/03_requirements/PR_NAMING_RULES.md)，使用 `type: 正體中文摘要`，只放一個前綴。主要使用 `feature`、`fix`、`bug`，必要時用 `docs` 或 `refactor`。工作台與 Agent 都以 repo 已確認規則為依據；規則衝突依既有 Authority 處理，不以對話記憶覆蓋。
