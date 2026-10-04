# Workbench SRS

Version: workbench-v0.4. Sources: ../02_product/PRD.md and PRODUCT_VISION.md.

| Acceptance | Requirement | Observable acceptance |
|---|---|---|
| AC-WB-001 | WB-001 | Valid Git project launches; invalid/missing path, empty/oversized task rejected before spawn |
| AC-WB-002 | WB-002 | Real Luna completion through current ChatGPT CLI; no API fallback; unavailable CLI/model fails clearly |
| AC-WB-003 | WB-003 | Browser displays progress and final result; malformed/missing completion/nonzero exit/project drift cannot succeed |
| AC-WB-004 | WB-004 | Cancel kills parent and descendant fixture; status remains CANCELLED; timeout fails; legacy busy rejected; managed project queue covered by AC-WB-010 |
| AC-WB-005 | WB-005 | Restart retains history/results; interrupted task fails; database errors prevent dispatch |
| AC-WB-006 | WB-006 | Actual Harness parser/state/hash integrated; illegal transition and tampered evidence rejected; formal approval not synthesized |
| AC-WB-007 | WB-007 | Bad Host/Origin/token, oversized body/output and XSS strings tested; sanitized data only returned/persisted |

Platform: Node24.19+/npm11.17+, macOS/POSIX process groups, current Codex CLI with --ignore-user-config support. NFR: localhost interaction, polling <=1s, no external frontend dependencies, responsive 360px+, visible errors, keyboard-accessible labeled controls, deterministic bounded test suite. No Windows cancellation claim. SQLite is operational durable storage; no WORM or atomic multi-process claim.

AC-WB-008..013 bind WB-008..013 in PRD with positive and negative tests: draft/import isolation, explicit provisioning approval/conflict/partial retry, queue/cancel/restart/context separation, model identity/rejection, bounded skill traversal rejection, preview/hash/target/stale/path safety and dedicated PR sync. Real smoke covers two local projects and two-turn conversation through Codex; external writes mocked unless separately approved business target is supplied. No real GitHub provisioning acceptance claim from mocks.

AC-WB-009 additionally proves all Intake§8 proposal fields visible before approval, missing data explicitly TBD, exact approved proposal survives restart/partial failure, and changed authenticated owner/provider/name/visibility/content/expired or replayed token prevents external effects.

## WB-014 / AC-WB-014 — 一般使用者導向 UX（Human 2026-10-05）

工作台主要服務不熟悉工程工具的專案發起人；信任與單人本機執行邊界保持不變。先定義使用者目標、初次使用與回訪步驟、資訊優先順序、一般用語及失敗恢復，再繪製線框、UI與實作。首頁只呈現「開始新專案」與「接續既有專案」；選擇專案後以對話為主要操作，明確顯示目前狀態與下一步。模型、技能、執行工具、紀錄與證據收於進階設定／操作詳情，保留完整能力但不要求使用者先理解術語。GitHub 說明為「雲端專案資料夾與版本紀錄」，建立私人專案與成果送審仍保留完整命名目標、可見性及明確核准，不隱藏資料公開／上傳影響。可用的模型與工具邊界如 v0.2；不宣稱 Agent 能自動修改程式或原生使用 Claude/ChatGPT。

Acceptance: 未選專案時可看見目的、兩條開始路徑與唯一主要動作；選定後新增表單預設收起，可直接對話並看到下一步。未展開進階區即可完成建草稿與對話；保存步驟有清楚的資料去向與確認。375px/桌面無溢出、鍵盤可操作、載入／失敗／等待有文字說明。證據需區分設計者走查與真實一般人測試；尚無真實一般人測試，不得宣稱已驗證大眾適用性。

<a id="workbench-onboarding-v04"></a>

## WB-015 / AC-WB-015 — 專案首頁到第一份計畫

Human2026-10-05 approves: start on a project home, never auto-select an acceptance project or create test/demo records. Home offers primary 開始新專案 and secondary 接續既有 GitHub 專案, existing project cards with name/summary/recent activity/status and resume action. Dedicated new-project flow asks name and idea, explains local persistence and existing Codex ChatGPT-login prerequisite; GitHub/model/skill unnecessary for default use. Final button 建立專案並整理計畫 creates local draft through unchanged API then explicitly submits one planning request through existing messages API/default Luna. Request asks plain Traditional Chinese project goal, users, suggested MVP features, first next step and up to3 unresolved questions; distinguish suggestions/unknowns, no fabricated confirmed facts or coding/Gate approval. Idea sent to OpenAI for AI analysis; the button explains this before submission. User message contains understandable idea, not synthetic technical test instructions.

Selected project workspace exposes latest completed AI reply as 第一份專案計畫／最新成果, read-only user editable by further conversation, persistent task/message binding, ordinary chat secondary, back-to-project-home always present. Failed/unavailable analysis preserves created project/idea, offers explicit 重新整理計畫 with no duplicate project or automatic retries; same action one in-flight submission only, returning/reload never reruns automatically. At most1process/global20queue unchanged. Waiting/cancel/error show plain next step. Results are local records, not automatically GitHub-uploaded/approved specification. Existing full GitHub proposal and preview approvals retained. UI may view and continue multiple projects, data and confirmation state never leak between them.

Acceptance: complete home→new→idea→first real-model plan→resume/restart without advanced settings or GitHub; demonstrate actual output and failure recovery, default fresh user data shows no test records. Home/project navigation clears stale results/approval/skill selection, composer draft does not leak across projects. Mobile375+desktop keyboard/focus/no-overflow checked. Existing alias-identity finding must be repaired and freshly re-reviewed before release: canonicalize new managed roots and existing project paths without rewriting historical hashed task/events; busy/admission checks recognize alias paths for legacy/queued/current tasks. Test aliased managed root and existing rows in both route directions; unrelated project remains available. No extra model engines, GitHub skill installer, accounts/cloud/autonomous coding/new schema/API. Real general-user study deferred and disclosed.
