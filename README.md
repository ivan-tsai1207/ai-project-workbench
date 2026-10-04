# AI Project Workbench

AI 專案工作台：用對話把想法整理成第一份專案計畫，分開管理多個專案，並在確認後建立或同步 GitHub repo。

目前提供單人本機 MVP 候選版：專案首頁 → 開始新專案 → 描述想法 → AI 整理計畫 → 隨時回來繼續。GitHub、模型與技能不必先設定；上傳內容會先顯示確認卡或預覽。這是待交付確認的候選版本，尚未完成正式發布。

## 開始使用

1. 安裝 Node.js 24.19+，並在本機 Codex 完成登入。若需要 GitHub 匯入／建立／同步，再登入 GitHub CLI。
2. 在 macOS 雙擊 `apps/workbench/Start.command`，開啟工作台首頁。其他啟動方式與環境設定見 [工作台說明](apps/workbench/README.md)。
3. 點「開始新專案」，填入名稱與想法，按「建立專案並整理計畫」。
4. 從「所有專案」續接對話；要存到 GitHub 時，展開專案頁的「保存到 GitHub」並確認內容。

AI 使用本機 Codex CLI 登入並傳入所選模型；目前協助分析與討論，尚不會修改程式。想法會送至 OpenAI 分析，專案與對話保存在本機。Claude／ChatGPT 原生執行工具及 GitHub 社群技能安裝尚未接入；目前技能只使用專案內 SKILL.md 的指令文字。一般使用者研究與正式公開服務尚未完成。

## 與交付框架的關係

本工作台內含原有跨 Agent 系統交付框架，保留先 UX、再 UI，以及規格、設計、實作與獨立審查的規則。以下為既有框架文件。

## AI System Delivery Framework

本 repo 是系統開發專案的全域交付框架，適用於 Codex、Claude Code 與其他可讀取 Markdown 規則的 LLM / Agent 工具。

## 目的

- 將新概念、MVP、客戶案與正式系統開發整理成可執行流程。
- 以 GitHub private repo 作為長期記憶與版本控制來源。
- 以 Obsidian-compatible Markdown vault 建立知識圖譜。
- 透過 Agent 角色、Skills、文件模板與 Git workflow，降低重複溝通與 token 消耗。

## Repo 類型

全域框架 repo：

```text
ai-system-delivery-framework/
  AGENTS.md
  CLAUDE.md
  LLM_OPERATING_RULES.md
  .ai/
  agent_roles/
  docs/
  skills/
  templates/
```

## Agentic Substrate

本 repo 不只是 AI 工具使用手冊，而是 AI 開發治理層。核心概念：

```text
Constitution
  ↓
Authority
  ↓
Workflow
  ↓
Product Vision
  ↓
Architecture
  ↓
Living Feature Specs
  ↓
UX Contract
  ↓
Work Item
  ↓
Automated Gates
  ↓
Code
```

重要文件：

- `.ai/CONSTITUTION.md`：最高治理規則。
- `.ai/AUTHORITY.md`：規格衝突時的權威順序。
- `.ai/WORKFLOW.md`：ChatGPT / Claude / Codex 交接流程。
- `.ai/roles/`：角色邊界。
- `.ai/gates/`：Spec / Design / Implementation / Release Gate。
- `templates/PRODUCT_VISION.md`：Product Vision 模板。
- `templates/Feature_Spec.md`：Living Feature Spec 模板。
- `templates/Screen_Spec.md`：UX Contract / Screen Spec 模板。
- `templates/Design_Source_Map.md`：Figma、Claude design、HTML prototype 等設計來源整理模板。
- `templates/Work_Item.md`：單次 Agent 任務邊界模板。
- `templates/Change_Request.md`：規格不足或需要擴張時使用。

## 跨 LLM 使用入口

| 工具 | 建議入口 |
|---|---|
| Codex | `AGENTS.md` |
| Claude / Claude Code | `CLAUDE.md` |
| Google AI Studio / Gemini | `docs/llm_bootstrap_prompt.md` + `LLM_OPERATING_RULES.md` |
| 其他 LLM / Agent | `docs/llm_bootstrap_prompt.md` |

詳細載入方式見 `docs/tool_adapters.md`。

專案 repo：

```text
project-name/
  .ai/
  docs/
    00_index.md
    01_sources/
    02_product/
      PRODUCT_VISION.md
      PRD.md
    03_requirements/
      SRS.md
    04_system/
      ARCHITECTURE.md
      SDD.md
    05_decisions/
      ADR-*.md
    06_risks/
    07_open_questions/
    08_agent_reviews/
    09_session_logs/
  specs/<feature>/spec.md
  design/<feature>/
    Design_Source_Map.md
    screens/<SCREEN-ID>.md
  work-items/<WORK-ITEM-ID>.md
  traceability/traceability.yaml
  README.md
  AGENTS.md
```

## 使用原則

1. 新系統概念先進行 project intake 與 Source Map。
2. 依任務深度選擇 MVP、Standard 或 Formal 模式。
3. 高風險操作必須先用繁體中文詢問使用者。
4. 產出文件需寫回專案記憶，並推送到 GitHub。
5. 重大技術決策需建立 ADR。

## PR 命名與工作台規則

工作台與 Agent 的 PR 命名要求已記錄於 [PR 命名規則](docs/03_requirements/PR_NAMING_RULES.md)，並由 PRD、SRS、SDD、Feature Spec 與跨 Agent 操作指引引用。格式為單一小寫前綴加正體中文摘要，例如 `docs: 更新專案計畫與對話紀錄`。目前工作台 PR 產生程式尚待套用此要求；文件存在不代表程式已自動執行規則。
