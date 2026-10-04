# Work Item Contract

| Field | Value |
|---|---|
| Schema Version | `harness.work-item/v2` |
| ID | `WBC-LOGIN-FIX` |
| Title | 修正瀏覽器 fetch 接收者造成登入失敗 |
| Role | `IMPLEMENTER` |
| Feature | `workbench` |
| Phase | `IMPLEMENTATION` |
| Status | `IN_PROGRESS` |
| Risk Class | `HIGH` |
| Spec Version | `WB-017-v1` |
| Design Version | `WB-017-UX-v1` |
| Review Profile | `N/A` |
| Reviewed Artifact | `N/A` |
| Reviewed Artifact Hash | `N/A` |
| Maker Execution ID | `01a10864-9797-72d2-85d0-aa9c6a3da77c` |

## Objective
修正使用者回報無法登入。瀏覽器實測相同設定：物件方法 fetch 發生 Illegal invocation，普通 wrapper HTTP200。WB017§1/4/8 既有登入行為；無規格或 UX 變更。

## Read Scope
完整 mandatory governance、IMPLEMENTER、implementation-gate；WB017、SCR-WBC-001；client.mjs 及 client/config tests、既有 build/package。

## Write Scope
apps/workbench-cloud/public/client.mjs；apps/workbench-cloud/tests/client.test.mjs；本 WI、fix manifest/review assignments；私人 host evidence。

## Forbidden Scope
其他 source、schema、credentials、API/權限、UX/spec/.ai 修改；不宣稱既有整體雲端驗收通過。

## Required Gates
IMPLEMENTATION_GATE。沿用登入元件 HIGH；TECH/QA/SECURITY 各一次 exact delta review（Auth 路徑需 security）。整體 WB017 AC8 原有未完成項目保留，不以 scoped regression PASS 覆蓋。

## Notes
新使用者回報的獨立 BUG_FIX，不重啟雲端原 batch。有限 scope 一行 transport 修正＋receiver regression；primary one Maker＋3 independent reviews，各120sec含報告，最多一次同範圍修正。累積active/wall30min、batch60min；tokenTARGET5000、actual null無完整telemetry。停止條件：新重大問題、scope擴張、required review非PASS。checks 既有check/test/build、真瀏覽器 receiver正反probe。只保存公開程式，host evidence/帳號留本機。允許沿既有使用者部署授權更新Vercel；PR單前綴中文；main不改。無登入密碼，實際本人登入需使用者重試。
