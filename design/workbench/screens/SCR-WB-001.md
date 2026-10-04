# SCR-WB-001 — Project Workbench

Version: workbench-v0.2. Authority specs/workbench/spec.md; WB001..013/all corresponding ACs. User: single trusted local developer; Agent is read-only; GitHub mutation only via explicitly confirmed proposal/preview.

Layout: existing calm indigo/slate tokens, system font, max1100 content, left project selector and task history. Main shows selected project/repo status, conversation, model/skill selector and composer, repo creation/sync panel. Mobile360px+ stacks panels; long content wraps, no horizontal overflow. No raw external design artifact; designed from approved canonical requirements.

Entry: labeled name+idea form with Create local project; alternative GitHub HTTPS URL import. Busy/loading disables only submitted operation, feedback announces error/success. Empty says start from idea or import. Projects are selectable buttons with aria-pressed; task history follows selected project. Draft/local/linked/partial GitHub state clearly visible.

Conversation: user/assistant text rendered textContent, chronological, bounded context note; each task displays model/status/cancel/failure. Composer text max8000; model allowlist select defaults Luna, label availability checked on execution; skill select shows source platform/instructions-only. Engine Codex enabled; Claude/ChatGPT shown unavailable with explanation. Send can queue even while another project runs; maximum20 feedback. Existing direct path API retained, no arbitrary execute UI. Cancellation shows request pending until confirmed terminal; queued cancellation shown before spawn. Formal reviews always NOT_RUN for user task.

Proposal: editable repo name, goal, users, features, platform, recommended stack, open questions (max2000 each). Pre-filled summaries/recommendations labeled; unresolved values explicitly TBD. Request proposal shows full projectName/summary/goal/users/features/platform/stack/openQuestions plus provider GitHub, authenticated owner, exact repo name, private visibility/main+develop. Button literal 核准建立私人 GitHub repo is the final named-target approval; never create on entering name or ordinary chat. Auth unavailable/changed identity/conflict/partial errors preserve project and offer same-target fresh proposal retry. Initial specs explicitly pending review.

Sync: include full chat checkbox default unchecked; Preview button shows exact generated files and contents, target/base/version. Only then visible 核准同步並建立 PR binds one-use current preview. Editing/expiry/stale error requires preview again. No auto upload. PR URL only valid returned github.com URL rendered anchor. No arbitrary file picker/branch force push. Success displays branch/PR; fail shows safe status and preserves state.

API bindings exactly SDD v0.2 project endpoints; task endpoints unchanged. All forms labeled, semantic buttons, keyboard focus outline, 44px targets, aria-live/rolealert feedback, loading/empty/loaded/error/permission-denied/success states. Respect reduced motion. No new business roles, public repo option, autonomous editing, cloud or native Claude/ChatGPT engine.

## WB014 — UX before UI / v0.3 presentation

Audience: project initiators unfamiliar with engineering vocabulary. Task: clarify an idea through conversation and deliberately save records. Single trusted local user/read-only capability unchanged. First visit: purpose and primary “開始新專案” form (name/idea), secondary collapsed “接續 GitHub 上的專案” URL import. Draft success selects conversation; no repo required. Returning: select project, conversation primary; new-project form collapsed. Switching clears result/approval.

Hierarchy: project/context, plain next step, conversation/composer, optional saving. Header “把想法整理成清楚的下一步”; no autonomous coding promise. Journey “1 想法 / 2 討論 / 3 保存” describes activities, not Gate completion. Composer “告訴我你想做什麼”, CTA “送出”. Initial welcome provides example and requires choosing project. Next step draft=continue conversation, linked=review before upload; running/queued=wait or cancel.

Progressive disclosure: closed “進階設定” contains tool/model/skill, default economical Luna; closed “對話紀錄” contains history; closed “操作詳情” contains model/hash/formal-review/protocol. Main status/cancel still visible. Bubbles “你 / AI 助手”; details retain model. Sidebar “新增專案” opens/focuses name; creation closes form/focuses composer.

GitHub “保存到 GitHub”, explained “雲端專案資料夾與版本紀錄”; local saving/destination explicit. Proposal goal/users/features shown; optional “補充專案資訊” wraps platform/stack/questions, pending values explicit, complete final confirmation still contains all fields. Label “雲端資料夾名稱（英文）”, final “確認建立私人專案”. Sync “查看要上傳的內容” then “確認上傳並建立待確認版本（PR）”, explaining later review/merge. Target/private/public/content/approval unchanged, chat unchecked.

UI follows registered grayscale wireframe-v03.html; retain indigo/slate and system fonts, increase support text16px, whitespace and single primary action. Semantic controls/labels,44px targets,focus/contrast/reduced motion. Desktop sidebar/mobile375 stack, no horizontal overflow. Busy loading disables action; empty tells next step; errors preserve project and suggest retry, GitHub denied suggests login, partial retries same target.

All existing actions WB008..013; presentation WB014. Source wireframe not authority. Host designer walkthrough only; real general-user testing pending, no claim mass-market usability proven.

<a id="onboarding-v04-design"></a>

## WB015 — 專案首頁、新專案、第一份成果

UX task first: user has an idea and wants one concrete plan, without understanding developer tooling. Home is a separate view, no automatic project selection. Large heading 把想法變成第一份專案計畫; purpose explains goal/users/MVP/next step. Primary 開始新專案, secondary 接續 GitHub 專案. Existing project cards show name/idea/recent status/date and 繼續這個專案. No fabricated cards/test content. Sidebar has 所有專案 plus 新增專案 always.

New-project view only: step1 “說說你的想法” name+required idea, real-life placeholder/example; explain AI analysis is sent to OpenAI via existing local Codex login, results initially local and no GitHub yet. Step2/result represented after submit, not decorative progress. Primary 建立專案並整理計畫, disabled if CLI unavailable or operation underway. Back closes flow to home and invalidates confirmations. Create draft once via current API, then send one explicit planning request via messages. First visible user message is understandable request+idea, no hidden README/test marker instructions in UI. Spinner/status “正在整理你的專案計畫”; global queue shows等待, cancel stays available.

Workspace: clear back-to-home, name/idea/storage hint; primary 成果 section with latest completed assistant result as text, preserving line breaks and scroll only for long output. Heading 第一份專案計畫 when1reply, 最新成果 later. Next action 用一句話補充，我們再調整; composer secondary labelled 補充想法或回答問題. Prior conversation collapsed 對話紀錄, not main content. Model/skill/tool settings collapsed. Failed generation preserves draft and idea, showserror/recovery and explicit 重新整理計畫 without creating anotherproject. Reload/resume never resubmits. Result/history/skill/approval/composer cleared on project switch/home; queued work continues backend. GitHub saving is later closed panel retaining complete named target/privacy/content approval. No skill installer or new providers.

UI after task flow: registered interactive-free grayscale wireframe-v04.html then system-font/slate/indigo implementation. Home hero with one primary CTA, responsive project-card grid; lightweight two-step creation; workspace wide readable result and small composer. 16pxbody/44pxtargets/focus/aria-live;375mobile stacks and nooverflow, desktop cards adapt, labels. Loading/empty/error/unavailable/cancelled/success/partialGH states explicit; no false success if storage/runtime failed. User data separate durable dir, no deletion of prior acceptance data.

Traceability: WB015 home/onboarding/outcomes; WB008..013 existing project/queue/model/skill/GH bindings; WB014 UX-first. Wireframe is source only, ScreenSpec canonical. Host walk-through, real-model flow and restart acceptance required; actual general-public usabilitystudy remains pending, no claim full productisation/cloud service.
