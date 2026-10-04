# Work Item Contract

| Field | Value |
|---|---|
| Schema Version | `harness.work-item/v2` |
| ID | `WBC-IMPL` |
| Title | `Vercel Supabase 雲端基礎版規格` |
| Role | `IMPLEMENTER` |
| Feature | `workbench` |
| Phase | `IMPLEMENTATION` |
| Status | `IN_PROGRESS` |
| Spec Version | `WB-017-v1` |
| Design Version | `WB-017-UX-v1` |
| Risk Class | `HIGH` |
| Review Profile | `N/A` |
| Reviewed Artifact | `N/A` |
| Reviewed Artifact Hash | `N/A` |
| Maker Execution ID | `N/A` |

## Objective

先部署 Vercel＋Supabase；AI不啟用。WB-017 / AC-WB-017。

## Read Scope

- Complete mandatory governance, IMPLEMENTER role, IMPLEMENTATION_GATE and this WI。
- specs/workbench/cloud.md, PRD/SRS/SDD #cloud-foundation，WB016 canonical命名。
- design/workbench/cloud/UX_Contract.md, screens/SCR-WBC-001.md, Design_Source_Map.md, wireframe.html (only after DESIGN_GATE PASS)。
- Existing apps/workbench/public/styles.css only for visual reuse；Node runtime supplied24.19。

## Write Scope

- apps/workbench-cloud/** (dedicated new package metadata/build configuration/static frontend/client/tests/vercel.json)
- supabase/migrations/202610050001_workbench_cloud.sql
- supabase/tests/workbench_rls.sql
- docs/09_deployment/WORKBENCH_CLOUD.md
- work-items/WBC-IMPL.artifact.json
- host evidence /private/tmp/cloud-workbench-evidence/implementation-completion.md

## Forbidden Scope

- .ai/**, harness/**, existing apps/workbench/**, canonical specs/design edits, main, secrets/local-data, unrelated projects；no git mutations or remote deployment from Maker。

## Required Gates

- IMPLEMENTATION_GATE；HIGH auth/RLS trigger requires TECH_REVIEWER + QA_REVIEWER + SECURITY_REVIEWER fresh exact-artifact reviews。

## Notes

- Only begin after Spec and Design Gate PASS. SDD WB017 explicitly requires dedicated Node static build, deployment configuration and migration. This WI authorizes package.json / Node build / tests / lockfile if dependencies needed；prefer zero dependency runtime, no paidAI/API.
- One fresh IMPLEMENTER production execution <=480sec including self-review/report; use shared original cloud batch counters/time; no delegation. Implement simplest static app direct Supabase Auth/REST with publishable key and server-enforced RLS. Never put secret/service_role key into frontend. Build can fail closed without config; test fixtures only clearly local. API auth token validation uses /user before trusting id, sessionStorage only, logout/expiry epoch protection, async stale isolation, no mutation replay.
- Minimum tests: public config rejects secret keys/unsafe origin; request auth failure/auth identity; project/data ID isolation/stale-response/failed mutations drafts; syntax/build/security input handling; Postgres two-account RLS runnable test script, real DB test pending if accounts unavailable. Do not fake AI output; user notes/plan manually saved, repoURL reference only. No public signup UI; instructions disable signup precreated users. No local data migration.
- README deploy steps root apps/workbench-cloud outputdist environment SUPABASE_URL + SUPABASE_PUBLISHABLE_KEY, noAIkey；setup migration + signupdisable + manualuser creation; private host evidence notpublish. Preserve targetaccount/login/liveRLS/CRUD blockers; mayproduce candidate but notdeclare GatePASS/deployed when missing.
- Save selfreview + manifest bound actual task_started execution ID and exact hashes; finite checks/lint-syntax/test/build/audit as applicable；no skippedtest or caught failures claimedPASS。
