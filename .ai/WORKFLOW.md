# Agentic SDLC Workflow

本文件定義 ChatGPT、Claude、Codex 與其他 Agent 的交接流程，避免 Intent Debt 與 Context Drift。新專案在進入正式規格與 Harness execution 前，依 `.ai/PROJECT_INTAKE_CONTRACT.md` 完成 intake 與 repository provisioning。

## 標準流程

```text
Natural Language Request
  ↓
Intent Classification
  ↓
Project Intake / Discovery
  ↓
Project Context / Project Proposal
  ↓
Human Repo Approval
  ↓
Repo Provisioning / Framework Bootstrap
  ↓
ChatGPT / Product Architect：建立 Source of Truth
  ↓
PRODUCT_VISION / PRD / SRS / ARCHITECTURE / SDD / FEATURE SPEC
  ↓
Maker Self Review / Artifact Hash / Risk Classification
  ↓
Independent SPEC_REVIEWER
  ↓
SPEC GATE
  ↓
Claude / UX Designer：先使用者目標與操作邏輯，再線框與 UI 設計
  ↓
UX CONTRACT / SCREEN SPEC / DESIGN TOKENS
  ↓
Maker Self Review / Independent UX_REVIEWER
  ↓
DESIGN GATE
  ↓
Codex / Implementer：受約束的實作
  ↓
CODE / TEST
  ↓
Maker Self Review / Independent TECH_REVIEWER
  ↓
QA_REVIEWER / SECURITY_REVIEWER when required by Risk
  ↓
IMPLEMENTATION GATE
  ↓
Required Independent Reviews Complete / Candidate Aggregation
  ↓
Delivery Candidate
  ↓
DELIVERY_ASSURANCE_REVIEWER
  ↓
DELIVERY_ASSURANCE_GATE
  ↓
RELEASE_GATE
  ↓
PR / Review / Merge
  ↓
Living Spec Update
```

## New Project Intake

- 使用者以自然語言提出新專案，不需手動建立 Work Item、指定 Role / Phase 或準備 Harness Execution Profile。
- Intent 無法確認時先進行最小必要釐清，不得直接啟動 Implementer。
- 建立 Project Repo 前必須呈現 Project Proposal，並取得使用者對 repo target 與 visibility 的明確核准。
- 新 repo 預設 private；Framework Repo 與 Project Repo 必須分離。
- Repo Provisioning 完成後，由系統建立內部 specification work item，交由 Harness 綁定 `PRODUCT_ARCHITECT`。
- 初始規格通過 Spec Gate 後才能進入 Design；Design Gate 通過後才能建立 implementation work items。
- 初始 specification Maker不得自行通過 Spec review；Orchestrator必須產生 `SPEC_REVIEWER` Work Item並驗證 artifact hash。
- Project Intake 負責 execution 前的 intake、initialization 與 orchestration；Harness 只負責特定 Agent task 的 runtime boundary，不決定產品需求。

## State 與 Delta

- `docs/02_product/PRODUCT_VISION.md`、`docs/02_product/PRD.md`、`docs/03_requirements/SRS.md`、`docs/04_system/ARCHITECTURE.md`、`docs/04_system/SDD.md`、`specs/<feature>/spec.md` 描述系統應該是什麼。
- `work-items/<WORK-ITEM-ID>.md` 描述這一次要改什麼。
- Work item 不應重複整份規格，只引用相關 State 文件與版本。

## Harness Runtime Binding

當任務由 Agent Harness 執行時：

```text
Active Role + Phase + Feature + Work Item
  ↓
.ai/HARNESS_CONTRACT.md
  ↓
Risk + Review Profile + Context Package + Filesystem Boundary + Tool Boundary
  ↓
Agent Execution
  ↓
Role Completion Evidence + Findings + Active Gate + Audit Evidence
```

- Harness Contract 只負責 runtime enforcement，不建立新的 Authority、Role 或 Gate 規則。
- Runtime permissions 必須由 active role、assigned work item 與既有治理規則的交集產生。
- Harness 無法組成 required context 或發現越權、spec gap、spec conflict 時，必須依 contract 停止受影響工作。

## Accountability and Independent Review

```text
Maker Execution
→ Mandatory Self Review
→ Immutable Artifact Hash
→ Orchestrator / Harness Risk Classification
→ Independent Review Assignment
→ Required REVIEWER Executions
→ Existing Phase Gate
→ Delivery Candidate Manifest
→ DELIVERY_ASSURANCE_REVIEWER
→ DELIVERY_ASSURANCE_GATE
→ RELEASE_GATE
```

- Maker不得 final approve自己的 Spec、Design或 Implementation。
- Reviewer Profile是 `REVIEWER` 的 subordinate binding，不是新的 Role；Agent不得自選 profile或降低 Risk。
- 一個 review execution綁定一個 primary profile與 reviewed artifact hash。
- Checker不得在同一 execution修改並批准 artifact；若成為 Maker修正，必須有新 execution、新 hash與新的 independent Checker。
- Artifact hash變更後，所有針對舊 hash的 review PASS失效。
- Review decision使用 `PASS / REQUEST_CHANGES / BLOCK`；GateResult使用 `PASS / FAILED / NEEDS_CLARIFICATION`。
- Risk-based assignment不得讓所有 task機械式經過全部 profile；QA / Security依 artifact與 risk trigger決定。

### Responsibility Return Path

| Finding subject | Return owner |
|---|---|
| Requirement / scope / business rule | `PRODUCT_ARCHITECT` |
| UX flow / state / accessibility | `UX_DESIGNER` |
| Implementation / code / test correction | `IMPLEMENTER` |
| Test coverage verification | `IMPLEMENTER` correction + `QA_REVIEWER` re-review |
| Security finding | `IMPLEMENTER` or actual Maker correction + `SECURITY_REVIEWER` re-review |

Final Assurer只驗證 completion chain與 finding closure，不得自行修改受審 artifact。

### Delivery Assurance

Required reviews與 existing phase Gates完成後，Orchestrator建立 immutable delivery candidate manifest與 `DELIVERY_ASSURANCE_REVIEWER` Work Item。`OPEN BLOCKING` finding、missing review、stale artifact hash、unresolved SPEC GAP / CONFLICT或 scope drift都阻止 `DELIVERY_ASSURANCE_GATE` PASS。

Delivery Assurance PASS不自動 merge、release或 deploy；Human仍保留 business approval、accepted risk、high-risk side effect與 release / production decision。

## Bounded Execution Economy

本節是唯一 canonical operational policy；不新增 schema field / enum、Role、Gate、架構或 runtime permission。文件規則不代表 runtime enforcement 已實作。

### Finite Plan and Allocation

- 執行前在既有 Work Item Notes 與 host audit 記錄有限 plan：primary WI、已授權 milestones、完成條件、必需命令、review assignments、Gates、execution / time caps、token target、context selections 與 stop conditions。
- 預設 batch 只有一個 primary WI；使用者已明確授權的有限 milestones 必須保留、逐項配置與合計 budget。同一有限 scope 不重問已有上層授權；完成目標即停止，不推論下一階段授權。
- Parent 產生的 required review WIs、checkers 與其 retries 共用 parent / batch allocation，不成立獨立或遞迴 batch；多 primary WI 的有限 batch 逐 WI 計算後合計，不共用額外未分配 cycles。
- 從既有 canonical Risk / artifact policy 計算並凍結 required independent profile set；令 R 為每輪 required profile executions，G 為另行必需、未計入 R 的 checker executions（含明定重驗）。一個 execution 只有一個 primary profile。
- 每 WI 上限為 initial Maker + R，加最多一次 remediation Maker + R，再加 G：`2 * (1 + R) + G`。這是上限而非必須消耗的配額；初輪成功只用 `1 + R` 加必需 G。
- 每次 dispatched attempt 均計數，包含 failed / canceled / retry；session、角色切換、新對話或 resume 不重設。Lost counters 或剩餘 allocation 無法確認時停止交接，不假定零使用量。
- 預設每 WI cumulative active time 與 elapsed wallclock 各上限 30 minutes、batch elapsed wallclock 上限 60 minutes；batch token TARGET 30,000，合計所有 WI、primary / generated review agents 與 retries 的 usage。
- Active time 累加 primary 與 generated review / checker executions 的活動區間（parallel agents 各自計入），包括 validation；明確 host pause / 等待 approval 才可扣除且須記起迄，否則照計。WI / batch clocks 各從其 preflight 開始，pause / approval 仍計時；resume 延續原始起點、counters 與 remaining。
- 所有 execution count / time allocation 必須有限；套用 operational allocation、host limits、WI / invocation 限制的最小值。WI / invocation 只能縮小 host limits，process runtime ceiling 另依 SDD 43.2，不以 WI / batch 配額放大。
- Human 可明確續配 operational allocation，記錄有限增額、用途與原始累計值；不得越過 host hard ceiling、默認重設時計，或以重新開始 batch 繞過停止條件。
- Preflight 必須確認 mandatory context、validation、assignments 與 Gates 能在已知剩餘 count / time / host limits 內完成；不足即 `BUDGET_INSUFFICIENT`，不省略治理或 required validation。執行中 count / time / 已知 token ceiling 耗盡即 `BUDGET_EXHAUSTED`，停止目前 Agent production、read、probes、retries 與新 dispatch；沿既有 host cancellation / timeout 保留 bounded checkpoint / evidence，不聲稱 enforcement 已實作。
- 精確 HARD token cap 被要求但 host 無可用完整 aggregate telemetry / enforcement 時，停止 `BUDGET_UNENFORCEABLE`。只有 TARGET 時記 `actual: null`、missing telemetry 與 count / time fallback，不聲稱精確 token bound 或 remaining。
- Token 是模型 input / output / reasoning 或 provider-reported usage，包含 context、generated / tool transcript，依 provider accounting 去重彙總；context 與整體 usage 不等價，shell test runtime 本身不是 token。Bytes / files / sections 不是 token 換算或精確 cap；已知 usage 到頂亦停止，不用 TARGET 掩蓋耗盡。

### Least Context

- Ordinary initial context operational target 為 16 files / 24 extracted sections / 64 KiB；它縮小 SDD 43.1 host defaults 24 / 64 / 1 MiB，後者與 SDD 43.2 hard ceilings 不變。
- 取所有 applicable boundaries 最小值；先 deduplicate、精確 anchor / section extraction、defer optional Tier 2。完整 mandatory Tier 1 不可丟棄、截斷或摘要；仍不符合則 explicit fail，續配也不得越過 host ceiling。
- 一個實際選取的完整文件計一個 selection，抽取區段各計一個 section；audit 分開記 unique files、selected units、實際 bytes，不能用文件內 heading 數冒充 extraction 數或把多區段合併規避限制。
- 只讀直接 requirements、相關 open findings 與必要 resolved regressions；完整 review_log / history 不預設載入。On-demand context 也受 read scope、剩餘 budget、host ceiling 約束，並記 selection / defer 理由。

### Review, Validation and Stop

- 每個 required review 都須 fresh、independent 且綁 exact current artifact hash / Maker execution；禁止 general reviewer PASS cache。不得降低 Risk、刪除 required profile 或重複同 profile 工作來填配額。
- 加 profile 必須指出實際 canonical required trigger、owner 與新增有限 budget；無 trigger 不加。發現新的 required trigger 須更新 assignment / preflight 後才 dispatch，不能自動加 execution。
- Review scope 為 canonical AC、相關 open findings、resolved regressions，以及高信心正常邊界 negative checks；不得自行展開 open-ended fuzz taxonomy 或掃描無關範圍。
- 可引用 exact candidate command logs，但先驗證 artifact identity、完整輸入（含 code / tests / dependencies / config）、command / environment / runtime freshness 與結果完整性；不足或 stale 必須重跑並計 budget。
- 明確 required commands、fresh audit / postmerge validations 永遠執行；引用舊 logs 不豁免。Artifact 改變立即使舊 PASS、review 與 dependent Gate evidence 失效，必需驗證無法容納則停止，不能以 budget waiver 跳過。
- 無關範圍 evidence 的變動不自動重開已審 artifact 或遞迴新 review；先檢查實際依賴 / hash binding。Security failure 阻擋受影響 artifact / required validation / Gate；保留無關既有 blocker、轉 separate scoped handoff，不全域阻擋無關文件修正，也不把舊 audit 標成 PASS。
- 只允許一次 automatic remediation，且限既有 scope / findings；新 unrelated MAJOR / BLOCKING 立即停止並回報 Human。Retry 後仍 OPEN MAJOR / BLOCKING 或 required re-review 非 PASS，停止等待 Human decision；MINOR / OBSERVATION 記 follow-up，不自動新增 remediation。
- Human exception 必須指名 Finding 與有限 added count / time / token allocation；只是額外修正機會，不是 `ACCEPTED_RISK`、Gate waiver 或 permissions 擴張。
- 已完成 batch、budget 耗盡或上述 stop 時，停止後續 task / review / milestone dispatch；保留已完成工作與未完成 mandatory handoff，不能以 completion 壓力自動續跑。

### Closure and Evidence

- 純 parent-authorized status / evidence correction，且 reviewed artifacts 與其 hash 不變時，沿既有 parent handoff 完成，不新增 Role / profile / governance chain；parent write scope 未授權即停止 scoped handoff，不擴權。
- Tests、source、dependencies 或 security fixes 不是 closure-only；交由正常 owner / required review / Gate。Correction 若改到被審 artifact，適用 hash invalidation 與剩餘 budget。
- 保留 history、舊 hashes、invalidated evidence 與修正對照；附誠實 limitations，不自封 Independent Review / Gate PASS。
- 每次 handoff 留短 audit summary：plan、used / remaining counters、累積 active / elapsed time、token actual 或 missing telemetry、context selections、checks / exits、blockers、completed / remaining work 與 durable evidence references。
- Resume 必須先恢復同一 summary / counters / 原始 clocks；Session Log 只連結已有 command / review evidence，不複製 transcript。只在授權 path 寫最小恢復紀錄，無寫入授權則 scoped handoff，不另造 audit schema。
- 本節 `BUDGET_*` 是 operational exit reasons，依既有 lifecycle 記錄；不是新增 Work Item Status、GateResult 或 runtime schema enum。

## 交接規則

- ChatGPT / Product Architect 產出或更新規格，不直接產出未授權 UI 或 code。
- Claude / UX Designer 只能在既定規格內設計，不得改需求、角色、權限、API 或資料模型。
- Codex / Implementer 只能依 Feature Spec 與 Design Contract 實作，不得重設計或新增未授權能力。
- 任何角色發現規格不足，應提出 Change Request，而不是自行補完。

## Design Source Intake

設計來源不限於 Figma，也可能來自 Claude design output、HTML prototype、v0 output、static mockup 或其他可視化原型。

```text
Figma / Claude Design / HTML Prototype
  ↓
Design Source Map
  ↓
Screen Spec / UX Contract
  ↓
Design Gate
  ↓
Codex Implementation
```

規則：

- Raw design source 不能直接成為 Source of Truth。
- Raw design source 不得覆蓋 canonical Product Vision、PRD、SRS、Architecture、SDD 或 Feature Spec。
- Claude design output 與 HTML prototype 只能作為 design input、visual reference 或 implementation reference。
- 交給 Codex 實作前，必須先登錄於 `design/<feature>/Design_Source_Map.md`，並轉成 `design/<feature>/screens/<SCREEN-ID>.md` 或其他明確 Design Contract。
- 若 design source 包含未授權功能、API、欄位、角色、權限或流程，必須提出 Change Request。

## Canonical Spec Update

- Human approval、Accepted ADR 與 Approved Change Request 都必須寫回 canonical spec，才可供下游 Agent 執行。
- Change Request 不得取代正式規格；其狀態與寫回流程依 `.ai/AUTHORITY.md`。
- 發現上下層規格衝突時，停止受影響工作並回報 `SPEC CONFLICT`。

## UX Before UI

在既有 SPEC_GATE → DESIGN_GATE 流程內，先記錄目標使用者與熟悉程度、要完成的任務、首次／回訪主流程、資訊優先順序、每步主要操作、用語及失敗恢復；再畫線框與視覺 UI。不能以工程任務、Role、Gate、模型設定作為一般使用者的必要入門知識。進階設定使用漸進揭露，重要權限、資料去向與確認不得隱藏。上述 UX 決策寫入 Screen Spec 或其直接引用 UX Flow，與需求逐項對應；線框來源記入 Design Source Map。沿用既有 UX review / Design Gate，不增新 Gate、Role 或每頁額外審查。未做實際使用者測試時明列限制，設計走查不等於可用性驗證。
