# AI 工作台 v0.2

在本機瀏覽器管理 GitHub 專案與對話。需要 macOS/POSIX、Node24.19+、已用 ChatGPT 登入的新版 Codex CLI，以及建立／匯入 repo 時已登入的 GitHub CLI。沒有付費 API fallback。

雙擊 Start.command，或在已完成 Harness build 的 checkout 執行 npm start。預設網址 http://127.0.0.1:4318；目前開發預覽使用4319。資料庫與專案工作副本預設保存在使用者 Library/Application Support/Framework Workbench，業務專案不存入框架 repo。不要刪除資料目錄。

1. 從想法建立本機草稿，或貼上信任的 GitHub HTTPS repo 網址。
2. 選擇專案、Codex 模型與可選的宣告式技能，開始對話。每個專案獨立紀錄，最多20項等待，一次執行1項；可取消。歷史結果與使用者訊息持久保存；重啟不自動重做未完成任務。
3. 沒有 repo 時，填寫目標、使用者、功能、平台、技術建議與未決事項，檢查完整的私人 repo 確認卡後核准建立。建立 main/develop 與初始治理／TBD規格；這些初始規格尚未通過審查。
4. 先預覽 workbench/PROJECT.md、DECISIONS.md，確認後才同步到獨立分支並建立 PR。完整 CHAT.md 預設不選。只有已知生成的紀錄檔案會上傳；不自動上傳所有程式、金鑰、資料庫或暫存檔。後續更新僅能覆寫工作台上次發佈且未被他人修改的紀錄，衝突須人工處理。取消聊天勾選不刪除已上傳的舊聊天檔案。

模型：Luna預設，亦可選gpt-6-sol、gpt-6-astra、gpt-6.1-sol；清單不保證帳號權限，實際執行失敗會顯示，不偷偷替換。Codex執行已接入；Claude／ChatGPT互動介面尚未接入。技能從專案 .agents/skills/*/SKILL.md 與 .claude/skills/*/SKILL.md 讀取有界文字；只作Codex指令參考，不宣稱原生跨平台相容，不安裝插件或由工作台直接執行技能腳本。

Agent維持唯讀分析；GitHub建立／同步是明確確認後的host操作。一次使用一個本機工作台；沒有雲端、多使用者、並行程式修改或自動正式Gate。僅信任的repo；提示詞／結果遮蔽是best effort，不能保證惡意repo或所有秘密均被識別。同步前請檢查預覽。

驗證：內建 Node tests 覆蓋現有生命週期與專案隔離、FIFO、核准失效／身份變更、partial retry、技能／模型限制、同步內容與遠端版本衝突。GitHub寫入測試使用替身，不代表已在真實業務repo完成建立／PR驗收。真實Codex、本機持久化與瀏覽器驗收另記錄於WORKBENCH-002證據。

## v0.4 首次使用

雙擊 Start.command 後，從「開始新專案」填入名稱與想法，按「建立專案並整理計畫」。已登入的 Codex 會分析並保存第一份計畫；回到「所有專案」即可繼續。AI 失敗時專案仍保留，按「重新整理計畫」明確重試，不會重建專案。想法會傳送 OpenAI，這一步不會修改程式或上傳 GitHub。模型走本機 Codex CLI 登入；Claude/ChatGPT 原生引擎及 GitHub 技能安裝尚未提供。

啟動器預設使用本機 4319 埠，以及使用者 Documents/AI工作台資料 目錄；可用 WORKBENCH_PORT、WORKBENCH_DATA_DIR 覆寫。此目錄與 framework repository、暫存驗收資料分開。不要刪除舊資料目錄；若要沿用，指定原目錄。只適用可信任的單人本機使用，一般使用者研究尚待進行。
