# 雲端工作台部署與驗收

WB-017 candidate；AI 與 GitHub 整合均未啟用。本機版及其資料不搬移。本文件不代表完成部署或安全驗收。

1. 使用者指定 Vercel／Supabase 帳號與團隊，建立獨立 ai-project-workbench Supabase 專案；不套用其他產品資料庫，不升級付費方案。
2. 在新專案 SQL Editor 執行 supabase/migrations/202610050001_workbench_cloud.sql。只新增 wb_projects/wb_notes；authenticated 最小權限，anon 無權限，owner RLS、跨 owner FK、notes append-only。
3. Supabase Auth 關閉允許新使用者註冊；由使用者於 Dashboard 預建至少兩個獨立 email/password 帳號，密碼不得寫入 repo 或證據。此版沒有註冊／重設介面。
4. Vercel root apps/workbench-cloud；Node24、build npm run build、output dist。設定 SUPABASE_URL（https://PROJECT.supabase.co）與 SUPABASE_PUBLISHABLE_KEY（公開 publishable 或 anon）；絕不可放 service_role、secret key、AI key、本機/GitHub token。只有這兩個公開值進入 dist/config.mjs。兩個值都缺少時生成清楚未設定／禁止登入的頁面；部分缺少或不安全值使 build 失敗。
5. 部署完成後以兩帳號驗證登入/登出、建立及重新讀取專案、plan/note/repo link 保存與重讀；repo link 只供參考、不呼叫 GitHub。檢查 Tab/焦點/44px/375px 無 overflow、保存失敗草稿保留、快速 A→B切換晚到回應不混資料、session 過期明確登入無 mutation replay。Session 僅當前分頁，登出清除。
6. 用真實 DB 執行 `psql "$DATABASE_URL" -v user_a=UUID_A -v user_b=UUID_B -f supabase/tests/workbench_rls.sql`（兩個既存 Auth UUID；transaction rollback）。另外使用兩帳號真實 Auth token 直接 REST 正反向檢查：A只能select/update自己的project、B不能讀寫A、foreign note拒絕、anon拒絕、owner變更/notes更新/delete拒絕。私人 token、DB URL、個人資料和測試證據只留 host，不上傳。

安全 header 在 vercel.json；build HTML CSP 只允許 self scripts/styles 與精確 Supabase endpoint connect。不用常駐 Node process/SQLite、第三方字型或新增代理 API。零依賴 runtime。未設定 candidate 用於預覽，不是可登入驗收成功。

目前 pending：Supabase 登入/目標專案與 migration、關閉 signup、兩帳號、真實 REST/DB RLS、live CRUD、實際部署與瀏覽器mobile/keyboard驗收。需 fresh TECH/QA/SECURITY、Implementation Gate、DA與發布程序；不可用 unit/build 通過取代上述 pending。後續 PR 遵循 WB-016 單前綴中文；本版不產生 PR。
