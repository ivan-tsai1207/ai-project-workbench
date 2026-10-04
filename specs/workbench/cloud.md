# AI 工作台雲端基礎版

## 需求來源與範圍

使用者授權先部署 Vercel＋Supabase，暫不接入付費 AI API。此為既有產品新增雲端模式；本機版與資料不搬移、不刪除。Canonical 上層沿用 PRD / SRS / SDD 的 workbench 範圍；本文件定義本次新增 WB-017 的具體雲端邊界。部署帳號／團隊尚待使用者指定與登入，不得套用其他產品資料庫。

## WB-017 / AC-WB-017

1. Vercel 承載独立 cloud app；Supabase Auth 提供 email/password 登入，只有管理員預先建立的帳號可登入；不提供公開註冊，管理端須關閉新用戶註冊。第一位帳號由使用者於 Supabase Dashboard 建立；不由 Agent 決定使用者密碼。
2. 登入者可建立多個專案（名稱 1..100 字、想法 1..5000 字）、選取專案、追加自己的討論紀錄（1..8000 字）及更新手動專案計畫（最多 12000 字）。每次保存有明確進度、成功／錯誤與重試；失敗保留草稿且不宣稱已保存。紀錄僅 user role，不能製造 AI 回覆。
3. Supabase Postgres 新建 wb_projects 與 wb_notes；所有資料以 auth.uid() 隔離，未登入無法讀寫，登入 A 不能讀寫 B 或把紀錄掛到 B 專案。RLS 全表啟用，顯式 revoke anon，grant authenticated 最小 select/insert/update；無 delete UI / grant，不改其他 schema。FK 同時綁 owner＋project；owner 不可由 update 改為他人。所有 UI 內容 textContent，不執行模型／使用者 HTML。
4. 網頁僅持有 Supabase 公開 publishable／anon key；不使用 service_role／secret key，不包含本機 Codex/GitHub token。session 只留當前分頁 sessionStorage，登出立即清除資料；token 過期由明確重新登入恢复，不自動重送 mutation。切換專案／登出以 epoch 丟棄過期 async responses，禁止 A 草稿／結果出現在 B。登入即驗證 user，不能只解析未驗證 JWT 作權威。
5. AI 尚未啟用，沒有 API key、模型請求、付費 fallback、AI 回覆或自動整理；不展示可送出 AI 的假按鈕。GitHub 雲端授權未接入；僅可保存／修改供參考的 GitHub HTTPS repo 連結，不 clone、不讀私人 repo、不建立 repo/PR。工作台命名仍引用 WB-016，不宣稱此版已完成 PR generator。
6. UI 為 登入 → 所有專案 → 開始新專案 → 專案計畫與紀錄；中文、mobile375、label/focus/44px controls，沒有工程內部 Gate/schema 欄位。未設定、loading、empty、loaded、error、session expired 顯示下一步。首次不預選測試專案。
7. Build 僅使用部署環境 SUPABASE_URL 和 SUPABASE_PUBLISHABLE_KEY 產生公開 config；驗證 HTTPS *.supabase.co 與只允許公開 anon/publishable key；reject service_role/secret key。不複製本機資料。Vercel root apps/workbench-cloud，static output dist，不需要常駐 process／SQLite；AI off。CSP 限 same-origin scripts/styles 與指定 Supabase connect endpoint；安全headers，config 不含任何私人 secret。
8. Acceptance：部署 URL 可開啟；登入／登出、建立／重新載入專案、保存／重新載入計畫和紀錄；兩獨立帳號直接 REST 正／反向驗證 RLS；未登入 denied；快速切換與失敗不混資料；mobile375無橫向溢出。缺少帳號／平台登入／DB schema／真實 RLS evidence 時明列 pending，不能以 build pass宣稱已部署或security驗收完成。

## Data / API Contract

wb_projects: id uuid PK default gen_random_uuid(), owner_id uuid FK auth.users NOT NULL default auth.uid(), name text CHECK 1..100 trimmed, summary text CHECK 1..5000 trimmed, plan text default '' CHECK <=12000, repo_url text default '' CHECK empty or strict github HTTPS owner/repo, created_at timestamptz default now(), UNIQUE(id,owner_id).
wb_notes: id uuid PK default gen_random_uuid(), project_id uuid NOT NULL, owner_id uuid default auth.uid() NOT NULL FK auth.users, content text CHECK 1..8000 trimmed, created_at timestamptz default now(); composite FK(project_id,owner_id)→wb_projects(id,owner_id). Append-only notes, no update/delete.
Supabase Auth /auth/v1/token?grant_type=password + /auth/v1/user + /auth/v1/logout; PostgREST /rest/v1/wb_projects (GET/POST/PATCH), /rest/v1/wb_notes (GET/POST), auth Bearer verified by Supabase + apikey public. PATCH uses project id and owner via RLS; select return representation to detect zero-row / denied. Foreign project no rows，新增錯誤拒絕。無 server proxy 或模型 API。

## Deployment 與未決事項

- 使用者需指定並登入 Vercel / Supabase 帳號與團隊；建立獨立 ai-project-workbench 專案。不得新付費方案／upgrade；若 free quota 不足，停止取得具體費用確認。
- 設定 Supabase 關閉 signup，先由使用者建測試帳號／正式帳號；新的 DB 密碼若平台要求由使用者輸入。
- 只有公開程式／已確認 schema 上傳；私人驗收證據、資料／secrets 留 host。Git branch develop→feature/cloud-workbench→中文PR；部署是本次使用者授權，不包含 main merge 或自動開放外部成員。
- 真實跨使用者 RLS／CRUD與平台設定驗收完成前不得標示完成。未授權 AI API、本機資料搬移、GitHub OAuth、新技能／自動程式修改均 out-of-scope。

## 正式文件追溯

- PRD: docs/02_product/PRD.md#cloud-foundation
- SRS: docs/03_requirements/SRS.md#cloud-foundation
- SDD: docs/04_system/SDD.md#cloud-foundation
- PR 命名: docs/03_requirements/PR_NAMING_RULES.md
- 官方: https://supabase.com/docs/guides/database/postgres/row-level-security ; https://supabase.com/docs/guides/auth/passwords ; https://vercel.com/docs/git/vercel-for-github
