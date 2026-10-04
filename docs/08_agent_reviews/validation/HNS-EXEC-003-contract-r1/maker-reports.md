# Preserved Maker Reports - Not Independent Review

## Initial Maker

`READY_FOR_REVIEW`。已完成 Maker 修訂、自查與 scoped commit；未宣告獨立審查或 Gate PASS。

- Maker／實際 Codex session ID：`01a104d9-06f5-71f0-ba11-a57f0626638e`；未取得另外的 Harness execution ID。
- UTC：開始 `02:58:30`，提交 `03:02:52`，最終驗證 `03:02:52`，均於截止前完成。
- Commit：`cc54ba6364839c77295f08b5a736bec65df191d8`
- Artifact：[harness_v0.1_SDD.md](/Users/ivan/Documents/Codex/系統開發框架/.orchestration/hns-core-005-r4.hn6GJU/repo/docs/harness_v0.1_SDD.md)
- Candidate SHA-256：`3df2b79434a88b3381a0afb5421dbe7be26ec4a06a7ce09125f3cba7dcd656b2`
- 原始 SHA-256：`9eb48b670c5940bed4dc4b528c8e44e50dce5cf8ab53ccebce7179ad09f3589b`

| Clarification AC | Maker 覆蓋與自查 |
|---|---|
| `001-001` | §5.5／16.1：JSON-row 格式、正規化、來源／版本／hash 綁定、最高風險與未知事實 fail closed。R1–R5 涵蓋正常匹配、路徑邊界、未知 trigger、非法列與政策竄改／重播。 |
| `001-002` | §21：實際 compile transaction 建立 host-owned immutable receipt；Builder 重驗 ownership、SHA、execution/context/repository。C1–C6 涵蓋正常 admission、缺失、竄改、碰撞、stale 與 replay。 |
| `001-003` | Commit 僅 SDD，新增 66 行，差異限 §5.5、16.1、21；受保護路徑及全部 TypeScript interface 區塊未變。 |
| `001-004` | Hash、自查與需求追溯已提供；fresh SPEC／Security 決策、Spec Gate 留給 parent。 |

Whitespace、精確區段、interface preservation、引用存在性檢查均完成，工作樹乾淨。11 組 bounded examples 為規格情境自查，未執行 runtime tests。

限制：runtime 尚未實作；npm 驗證、review bindings 與 Gate 由 parent 完成。未新增全域風險映射、schema、store 或 signing subsystem。讀取時曾意外返回歷史 review headings，但未載入歷史正文；目標 preflight 正文已單獨抽取。



## Sole Correction Maker - Deadline Failure

BLOCKED：期限已過，未建立新 commit；已停止後續工作。

- 原候選 HEAD 保留：`cc54ba6364839c77295f08b5a736bec65df191d8`
- lastMaker：`01a104e1-a0cb-7cb3-a623-518e1c59e124`
- 未提交修正僅限 `docs/harness_v0.1_SDD.md` §5.5／16.1／21：1 file，6 insertions／6 deletions。
- 五項 SHA 欄位與 raw-source-file evidence 已明定 `sha256:<64 lowercase hex>`，區分 raw digest；Git IDs 保持 40／64 bare hex。
- 空白檢查通過；未執行 tests、派遣 agents 或修改其他檔案。

在修正呼叫完成後於 `03:09:00Z` 才確認超過 `03:08:38.056Z`，這次未守住硬期限。無新 commit／artifact hash，不宣稱 READY_FOR_REVIEW；修正額度已耗盡。

