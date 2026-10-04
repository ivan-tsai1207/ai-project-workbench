# Cloud Design Source Map

版本 WB-017-UX-v1。來源 specs/workbench/cloud.md，WB-017 / AC-WB-017。

| Raw source | Canonical contract | 需求 |
|---|---|---|
| wireframe.html（UX_DESIGNER 離線 HTML） | UX_Contract.md、screens/SCR-WBC-001.md | WB017§1..8；LOGIN/HOME/NEW/PROJECT 及必要失敗狀態 |

順序：使用者任務／首次回訪／資訊順序／失敗恢復 → Screen states/API binding/tokens → HTML 線框。HTML 為 raw visual source，不取代 Screen Spec 或規格，不繞過 DESIGN_GATE。四段是不同 view 的示意，正式產品不預選、不植入測試專案，狀態僅呈現當前項目。

沿用 flat indigo/slate/systemfont；無第三方字型、圖片、腳本、雲端連線、表單提交或真資料。僅靜態結構走查；375px 渲染、鍵盤/dialog、真實使用者測試、登入/CRUD/RLS/部署證據待後續獨立驗證，不宣稱完成。
