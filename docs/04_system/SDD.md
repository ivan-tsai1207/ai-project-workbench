# Workbench SDD

Version: workbench-v0.4. Sources: ARCHITECTURE.md, PRD.md, SRS.md; existing docs/harness_v0.1_SDD.md is dependency only. Its GUI/adapter non-goals apply to Harness v0.1, not this separately approved Workbench application. No full Phase8 adapter compatibility or production enforcement is claimed.

## Data and API

SQLite tables: tasks(id UUID primary key, project, prompt, model, status, result, error, created_at, updated_at); events(task_id foreign key, sequence, timestamp, type, payload_json, previous_hash, hash; composite primary key). WAL and foreign keys enabled; transactionally append and update task. Local single-process lock prevents concurrent servers using same database. Task/event payloads sanitized before writes. Runtime folder mode0700 and database mode0600.

GET /api/bootstrap returns CSRF token, runtime readiness, default model plus allowed models, read-only mode and harness/parser status. GET /api/tasks returns stored summaries; GET /api/tasks/:id returns task plus events and integrity check. POST /api/tasks JSON{project,prompt} validates, creates task and asynchronously starts process. POST /api/tasks/:id/cancel requests bounded process-group termination. Every endpoint requires exact loopback Host; mutating endpoints require exact server Origin, JSON content-type and CSRF header. Error body{error}; no stack/env/raw stderr.

Task lifecycle uses canonical Harness CREATED->CONTEXT_READY->RUNNING->VALIDATING->COMPLETED, or legal FAILED_RUNTIME/CANCELLED. COMPLETED means application execution checks only. Terminal writes occur after process exit. Cancellation request latches precedence; pending signal escalation not cleared until group termination ensured. Timeout/output/protocol failure latch failure and terminate group. Startup recovery marks active statuses FAILED_RUNTIME; never mark restart as success.

Evidence uses actual Harness hashCoreValue canonical hashing over sequence/time/type/safe payload/previous hash. Each read validates contiguous sequence and previous/current hash; mismatch blocks success and is visibly reported. This detects accidental corruption, not malicious database rewrite with recomputed chains. Git-visible fingerprint before/after covers HEAD, status and tracked/untracked nonignored content bounded by 10,000 files/32MiB; excluded secrets/ignored files cannot be certified unchanged. Read-only sandbox remains primary write prevention.

Static assets: index.html, styles.css, app.js; self-only CSP, no inline scripts, no remote fonts, escaped text via textContent. Poll while active and after cancellation; show error/interrupted/integrity failure. Display read-only Agent mode and selected model and unreviewed formal-Gate status.

## Validation and delivery

Meaningful fixtures cover real HTTP APIs/store restart/process lifecycle including descendant cancellation, invalid protocol, spawn failure, nonzero exit, timeout, drift, oversized data, CSRF/Host/Origin and redaction. Fake adapters are tests only and never a production UI mode. Real smoke uses existing Codex login on a disposable Git project, captures completion and then restarts server to verify persistence. UI inspected at desktop and mobile width. Full Harness233 plus focused95 rerun; app tests and audit run. Independent SPEC/UX and implementation TECH/QA/Security; Delivery Assurance and Release Gate before normal develop merge/local launch. main unchanged.

## v0.2 project contracts

SQLite additive tables projects(id,name,summary,path,repo,provision_state,created_at), messages(id,project_id,role,text,task_id,model,skill,created_at); existing tasks retain schema and model evidence. Managed association uses messages task binding. Existing history preserved. Queued jobs remain canonical CREATED with QUEUED event (no invented Harness enum); only dequeue moves CONTEXT_READY. Context is latest bounded completed user/assistant records in same project, max combined prompt8000; omitted old messages visibly bounded, no automatic replay after restart.

GET /api/projects; POST /api/projects {name,summary} creates draft. POST /api/projects/import {url} clones validated repo. GET /api/projects/:id returns project/messages/task summaries; GET /api/projects/:id/skills returns bounded instruction catalog. POST /api/projects/:id/messages {text,model,skill?} persists and enqueues. POST /api/projects/:id/proposal {name,businessGoal,primaryUsers,coreFeatures,primaryPlatform,recommendedStack,openQuestions} returns existing authenticated gh user as owner plus project proposal and random approval token bound to project and SHA256 of entire displayed proposal including github provider/authenticated owner/name/summary/private and all approval fields. POST /api/projects/:id/provision {approval} consumes token, creates private repo and bootstrap on main/develop; retry after partial success reuses exact stored repo. POST /api/projects/:id/preview {includeChat:false} returns exact generated text/digests/base HEAD/target plus one-use token; POST /api/projects/:id/sync {approval} validates state/digests and publishes only previewed record files on a new dedicated branch, opens PR. Never pushes main except initial bootstrap. Tokens live in memory, expire5min, invalid after restart; all mutation endpoints retain Host/Origin/CSRF protections/body32KiB. Input fields allowlisted; errors sanitized, no stderr/credentials returned.

Managed workspace directory UUID under data/projects, initial idea README and initial local commit. GitHub repo regex accepts conservative owner/name (1..100, no . or .., no credentials). gh commands <=30s and 1MiB output; no shell, credential prompt disabled. Sync requires clean repo, no directory/file symlinks or path collisions; content hash/token/head/target revalidated before writing; branch isolation and explicit path staging. Partial state surfaced, retry never erases workspace or force pushes. Bootstrap copies only explicit stable governance manifest with framework resolved HEAD provenance; initial canonical docs clearly TBD/pending; no speculative products/permissions. No arbitrary user code auto-upload. Messages/result exports best-effort redacted, raw-chat opt-in.

Model allowlist configuration is not model availability telemetry; actual CLI success/failure owns outcome. Skill limits20 dirs/platform, file32KiB each, no symlink ancestors; only relative catalog ID allowed. Instruction selection is explicit and within prompt limit, doesn't enable external tools. No native cross-platform compatibility claim.

Proposal input fields are bounded strings (name conservative repo slug, other fields <=2000 characters); multiline users/features/questions displayed as lists. Missing optional fields become explicit TBD, reflected in openQuestions; never silently treated confirmed. Proposed platform/stack are recommendations until approval. Provision consumes one-use token and validates expiry, project identity, entire proposal hash, immutable github/private target and a fresh gh authenticated owner equality before any external side effect. Reject mismatches and require new proposal. Persist exact approved full proposal and target before remote operation so retry after partial creation uses the same target, rechecks owner/private remote ownership, and never re-creates different repository.

<a id="workbench-onboarding-v04"></a>

## WB-015 / AC-WB-015 — 專案首頁到第一份計畫

Human2026-10-05 approves: start on a project home, never auto-select an acceptance project or create test/demo records. Home offers primary 開始新專案 and secondary 接續既有 GitHub 專案, existing project cards with name/summary/recent activity/status and resume action. Dedicated new-project flow asks name and idea, explains local persistence and existing Codex ChatGPT-login prerequisite; GitHub/model/skill unnecessary for default use. Final button 建立專案並整理計畫 creates local draft through unchanged API then explicitly submits one planning request through existing messages API/default Luna. Request asks plain Traditional Chinese project goal, users, suggested MVP features, first next step and up to3 unresolved questions; distinguish suggestions/unknowns, no fabricated confirmed facts or coding/Gate approval. Idea sent to OpenAI for AI analysis; the button explains this before submission. User message contains understandable idea, not synthetic technical test instructions.

Selected project workspace exposes latest completed AI reply as 第一份專案計畫／最新成果, read-only user editable by further conversation, persistent task/message binding, ordinary chat secondary, back-to-project-home always present. Failed/unavailable analysis preserves created project/idea, offers explicit 重新整理計畫 with no duplicate project or automatic retries; same action one in-flight submission only, returning/reload never reruns automatically. At most1process/global20queue unchanged. Waiting/cancel/error show plain next step. Results are local records, not automatically GitHub-uploaded/approved specification. Existing full GitHub proposal and preview approvals retained. UI may view and continue multiple projects, data and confirmation state never leak between them.

Acceptance: complete home→new→idea→first real-model plan→resume/restart without advanced settings or GitHub; demonstrate actual output and failure recovery, default fresh user data shows no test records. Home/project navigation clears stale results/approval/skill selection, composer draft does not leak across projects. Mobile375+desktop keyboard/focus/no-overflow checked. Existing alias-identity finding must be repaired and freshly re-reviewed before release: canonicalize new managed roots and existing project paths without rewriting historical hashed task/events; busy/admission checks recognize alias paths for legacy/queued/current tasks. Test aliased managed root and existing rows in both route directions; unrelated project remains available. No extra model engines, GitHub skill installer, accounts/cloud/autonomous coding/new schema/API. Real general-user study deferred and disclosed.

<a id="pr-naming-rules"></a>

## WB-016 / AC-WB-016 — Repository 驅動的 PR 命名

PR 產生邏輯須以已確認 repository 規則為依據，輸出前核對類型與中文摘要。現有純紀錄同步對應 docs；不得硬編碼英文標題。這是待實作要求，沿用既有 API、資料模型與批准流程。 規則來源：[PR 命名規則](../03_requirements/PR_NAMING_RULES.md)。

<a id="cloud-foundation"></a>

## WB-017 / AC-WB-017 — 雲端基礎版

使用者授權 Vercel＋Supabase 的登入、專案與手動紀錄保存；AI API／GitHub 授權尚不接入。本機模式不變。新增登入角色／RLS 與資料 API、UX、deployment 和驗收邊界由 [雲端規格](../../specs/workbench/cloud.md) 定義；真實部署與隔離驗收未完成前不得宣稱完成。
