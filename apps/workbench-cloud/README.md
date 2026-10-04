# AI 專案工作台雲端基礎版

Node24 靜態 build，零第三方 runtime 依賴，直接使用 Supabase Auth/PostgREST。

`npm ci`、`npm run check`、`npm test`、`npm run build`。

環境：SUPABASE_URL 和 SUPABASE_PUBLISHABLE_KEY，僅公開 Supabase publishable/anon key。兩值缺少則提供禁止登入的未設定頁面；不安全設定使 build 失敗。輸出 dist；Vercel Root Directory apps/workbench-cloud。部署與 DB/RLS 真實驗收見 ../../docs/09_deployment/WORKBENCH_CLOUD.md。

登入僅預建 email/password 帳號；手動專案計畫、追加紀錄、參考 GitHub 連結。AI 不啟用、沒有付費 API fallback、GitHub 授權或自動編碼。無本機資料／私人證據搬移。尚待 Supabase 帳號與 schema、兩帳號隔離/CRUD與部署驗收，不以 unit/build通過宣稱已上線。
