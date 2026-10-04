# SCR-WBC-001 — 雲端工作台

版本 WB-017-UX-v1；canonical source specs/workbench/cloud.md；UX 順序／所有狀態依 ../UX_Contract.md。單一 Screen Spec 內四個 view substate，不新增產品路由能力。

| View / 元件 | 欄位、動作與 binding | 追溯 |
|---|---|---|
| LOGIN | email type=email autocomplete=username；password autocomplete=current-password；登入；僅預建帳號說明 | WB017§1/4/6，Auth token + user |
| HOME | 標題所有專案、開始新專案、具名卡片開啟、登出；空白／讀取錯誤 | WB017§2/4/6，projects GET |
| NEW | name 1..100 trimmed、summary 1..5000 trimmed、建立專案、返回；云端保存說明 | WB017§2/3，projects POST |
| PROJECT/PLAN | 標題名稱／想法、手動計畫 textarea <=12000、保存計畫 | WB017§2/3，projects PATCH plan |
| PROJECT/NOTE | textarea content 1..8000 trimmed、追加紀錄、按建立順序文字紀錄；不可修改／刪除 | WB017§2/3，notes GET/POST project binding |
| PROJECT/LINK | repo_url 空或严格 github HTTPS owner/repo、保存連結；不內嵌／載入遠端；若顯示外開链接 rel=noopener noreferrer | WB017§5，projects PATCH repo_url |
| Shared | 返回所有專案、登出、loading/error/expired/denied/status及未保存導航確認 | WB017§4/6/8；不得新增 API |

只使用既有 Supabase Auth 與 PostgREST：/auth/v1/token?grant_type=password、/auth/v1/user、/auth/v1/logout；/rest/v1/wb_projects GET/POST/PATCH，/rest/v1/wb_notes GET/POST。認證由 Supabase 驗證，owner scope 由 RLS；UI 不自選 owner_id／不推論權限。零列 PATCH 不能顯示成功；歷史紀錄無 UPDATE/DELETE。保存 request 绑定選定 project/驗證 user/epoch，恢復草稿只限重新驗證同帳號同專案。登出／過期清除可見敏感資料、epoch 失效回應。所有內容採 textContent；無 HTML 執行。

## 視覺與互動 token

background slate50 #f8fafc；text slate900 #0f172a；muted slate600 #475569；primary indigo700 #4338ca（白字）；border slate300 #cbd5e1；error #b91c1c（文字＋說明）。system-ui／Noto Sans TC 系統 fallback，不下載字型。正文16px、行高1.6；4/8/16/24 spacing；8px 圓角、平面細邊框。focus-visible 3px indigo outline／2px offset。按鈕及輸入最小44px。沒有行銷 hero、裝飾圖片或工程 schema/Gate 欄位。

375px：外邊距16px、表單100%、按鈕換行、單欄，長 repo/name/plan overflow-wrap:anywhere；桌面 max1100px、左右留24px，專案卡 grid minmax(240px,1fr)。語義 header/nav/main/h1/h2/form/label，error 和 status 分開，不依色彩辨識保存。線框展示四個示意 view，標記示意資料；正式產品只展示實際使用者資料，不預選／植入測試專案。

## 驗收清單

按順序走查 login→home→new→project→保存plan→appendnote→連結→回訪→logout；核對 unavailable/empty/loading/validation/failed/zero-row/expiry；A→B載入失敗及晚到回應不洩漏；同專案失敗保留草稿，換帳號丟棄；375px、Tab、focus、44px、文字換行。真實登入/CRUD/RLS/部署證據仍 pending，不以線框或 build 代替。獨立 UX review 未完成。
