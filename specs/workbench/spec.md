# Local Framework Workbench Feature

Version: workbench-v0.4. Canonical sources: docs/02_product/PRODUCT_VISION.md, docs/02_product/PRD.md, docs/03_requirements/SRS.md, docs/04_system/ARCHITECTURE.md, docs/04_system/SDD.md.

Implements WB-001..007 and AC-WB-001..007: one trusted local user submits read-only Git project analysis to selected Codex model via Codex CLI; can observe, cancel and recover history. Fixed localhost browser + Node/SQLite host, actual Harness parser/state/hash integration, distinct unreviewed formal-Gate display.

Main flow: startup validates app Work Item -> browser selects project/task -> host validates request and persists CREATED -> CONTEXT_READY -> RUNNING -> sanitized events -> exit and completion checks -> VALIDATING -> COMPLETED. Failures/cancel retain evidence and terminal status. Restart resolves interrupted work to FAILED_RUNTIME. Detailed contracts and limits live in SDD/PRD, not duplicated here.

No new business roles, cloud/account system, Agent auto-editing, formal review bypass or credentials copied into this repository. MVP is accepted only after real execution + cancel + persisted restart demonstration; passing core tests alone does not count.

Approved v0.2 extends WB-008..013 / AC-WB-008..013: idea and GitHub import entry, project-isolated conversations, explicit private-repo proposal approval and separate bootstrap, bounded FIFO, selected model/declarative skill, hash-bound record sync preview and dedicated PR. Exact data/API/security/retry/limits in PRD/SDD. New provisioned specs remain pending independent specification review. Claude/ChatGPT execution deferred visibly; no arbitrary all-file upload. Source .ai/harness unchanged.

## WB-014 / AC-WB-014 — 一般使用者導向 UX（Human 2026-10-05）

工作台主要服務不熟悉工程工具的專案發起人；信任與單人本機執行邊界保持不變。先定義使用者目標、初次使用與回訪步驟、資訊優先順序、一般用語及失敗恢復，再繪製線框、UI與實作。首頁只呈現「開始新專案」與「接續既有專案」；選擇專案後以對話為主要操作，明確顯示目前狀態與下一步。模型、技能、執行工具、紀錄與證據收於進階設定／操作詳情，保留完整能力但不要求使用者先理解術語。GitHub 說明為「雲端專案資料夾與版本紀錄」，建立私人專案與成果送審仍保留完整命名目標、可見性及明確核准，不隱藏資料公開／上傳影響。可用的模型與工具邊界如 v0.2；不宣稱 Agent 能自動修改程式或原生使用 Claude/ChatGPT。

Acceptance: 未選專案時可看見目的、兩條開始路徑與唯一主要動作；選定後新增表單預設收起，可直接對話並看到下一步。未展開進階區即可完成建草稿與對話；保存步驟有清楚的資料去向與確認。375px/桌面無溢出、鍵盤可操作、載入／失敗／等待有文字說明。證據需區分設計者走查與真實一般人測試；尚無真實一般人測試，不得宣稱已驗證大眾適用性。

<a id="workbench-onboarding-v04"></a>

## WB-015 / AC-WB-015 — 專案首頁到第一份計畫

Human2026-10-05 approves: start on a project home, never auto-select an acceptance project or create test/demo records. Home offers primary 開始新專案 and secondary 接續既有 GitHub 專案, existing project cards with name/summary/recent activity/status and resume action. Dedicated new-project flow asks name and idea, explains local persistence and existing Codex ChatGPT-login prerequisite; GitHub/model/skill unnecessary for default use. Final button 建立專案並整理計畫 creates local draft through unchanged API then explicitly submits one planning request through existing messages API/default Luna. Request asks plain Traditional Chinese project goal, users, suggested MVP features, first next step and up to3 unresolved questions; distinguish suggestions/unknowns, no fabricated confirmed facts or coding/Gate approval. Idea sent to OpenAI for AI analysis; the button explains this before submission. User message contains understandable idea, not synthetic technical test instructions.

Selected project workspace exposes latest completed AI reply as 第一份專案計畫／最新成果, read-only user editable by further conversation, persistent task/message binding, ordinary chat secondary, back-to-project-home always present. Failed/unavailable analysis preserves created project/idea, offers explicit 重新整理計畫 with no duplicate project or automatic retries; same action one in-flight submission only, returning/reload never reruns automatically. At most1process/global20queue unchanged. Waiting/cancel/error show plain next step. Results are local records, not automatically GitHub-uploaded/approved specification. Existing full GitHub proposal and preview approvals retained. UI may view and continue multiple projects, data and confirmation state never leak between them.

Acceptance: complete home→new→idea→first real-model plan→resume/restart without advanced settings or GitHub; demonstrate actual output and failure recovery, default fresh user data shows no test records. Home/project navigation clears stale results/approval/skill selection, composer draft does not leak across projects. Mobile375+desktop keyboard/focus/no-overflow checked. Existing alias-identity finding must be repaired and freshly re-reviewed before release: canonicalize new managed roots and existing project paths without rewriting historical hashed task/events; busy/admission checks recognize alias paths for legacy/queued/current tasks. Test aliased managed root and existing rows in both route directions; unrelated project remains available. No extra model engines, GitHub skill installer, accounts/cloud/autonomous coding/new schema/API. Real general-user study deferred and disclosed.

<a id="pr-naming-rules"></a>

## WB-016 / AC-WB-016 — Repository 驅動的 PR 命名

工作台與 Agent 的 PR 標題都須符合本需求。AC-WB-016 的詳細條件與目前未實作狀態見 canonical 命名規則；本次文件變更不宣稱 runtime enforcement。 規則來源：[PR 命名規則](../../docs/03_requirements/PR_NAMING_RULES.md)。
