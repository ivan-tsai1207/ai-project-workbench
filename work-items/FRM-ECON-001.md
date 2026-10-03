# Work Item Contract

| Field | Value |
|---|---|
| Schema Version | `harness.work-item/v2` |
| ID | `FRM-ECON-001` |
| Title | Bound Framework Execution Cost and Review Loops |
| Role | `PRODUCT_ARCHITECT` |
| Feature | `execution-economy` |
| Phase | `SPEC` |
| Status | `DONE` |
| Spec Version | `execution-economy-v1` |
| Design Version | `N/A` |
| Risk Class | `MEDIUM` |
| Review Profile | `N/A` |
| Reviewed Artifact | `N/A` |
| Reviewed Artifact Hash | `N/A` |
| Maker Execution ID | `N/A` |

## Objective

Make framework execution finite, least-context and risk-proportional through bounded operating rules, without removing required independent review, Gates, artifact binding or security validation.

## Requirement References

- Requirement IDs: `AC-FRM-ECON-001-001`, `AC-FRM-ECON-001-002`, `AC-FRM-ECON-001-003`, `AC-FRM-ECON-001-004`
- Feature Spec: `N/A`
- Screen IDs / Screen Specs: `N/A`
- ADR: `N/A`
- Architecture / SDD sections: `docs/harness_v0.1_SDD.md` Section 43
- Review / Evidence references: `.ai/WORKFLOW.md`, `.ai/HARNESS_CONTRACT.md` Sections 4, 11-13

## Read Scope

- `AGENTS.md`
- `.ai/CONSTITUTION.md`
- `.ai/AUTHORITY.md`
- `.ai/WORKFLOW.md`
- `.ai/HARNESS_CONTRACT.md`
- `.ai/roles/product-architect.md`
- `.ai/roles/reviewer.md`
- `.ai/gates/spec-gate.md`
- `LLM_OPERATING_RULES.md`
- `templates/Work_Item.md`
- `docs/harness_v0.1_SDD.md`
- `work-items/FRM-ECON-001.md`

## Write Scope

- `AGENTS.md`
- `.ai/WORKFLOW.md`
- `.ai/HARNESS_CONTRACT.md`
- `LLM_OPERATING_RULES.md`
- `templates/Work_Item.md`
- `docs/harness_v0.1_SDD.md`
- `docs/09_session_logs/2026-10-04-execution-economy.md`

## Forbidden Scope

- `.ai/CONSTITUTION.md`
- `.ai/AUTHORITY.md`
- `.ai/roles/**`
- `.ai/gates/**`
- `harness/**`
- `work-items/**`
- `docs/08_agent_reviews/**`
- `docs/harness_implementation_architecture.md`
- `main`

## Scope

- Put canonical bounded execution rules in Workflow; other edited documents reference that rule rather than duplicate a competing policy.
- Default to one primary Work Item per batch; retain already-authorized explicit finite milestone scope, never infer open-ended continuation. Count generated required review Work Items inside the parent execution budget, not as recursive new projects.
- Set finite defaults for batch/work-item time, aggregate token target and execution count, with explicit host telemetry limitations, minimum-of-limits precedence and non-resetting counters across retries, role changes, resume or new conversation.
- Record the budget in existing Work Item Notes and host audit; do not change schema enums or create a new required section, Role, Gate or architecture.
- One automatic remediation maximum; new unrelated MAJOR/BLOCKING or a failed re-review stops for Human decision. Human extra-cycle approval must name the Finding and finite added budget; it is not accepted risk.
- Required independent reviewers are artifact/risk aligned; freeze assignments before dispatch; no speculative fuzzing or duplicated profile work.
- Narrow context by direct references and bounded retrieval; no complete historical review log. Do not duplicate passed validation without an explicit identity/freshness reason, and never reuse old reviewer PASS for changed artifacts or skip explicitly required validation.
- Treat pure control-plane status/evidence normalization as a scoped closure correction when reviewed artifacts remain unchanged; source/tests/dependencies/security findings still require their normal owner/review/Gate path. Reuse an authorized parent handoff instead of creating a recursive governance chain; no permissions expansion.
- Report blocked state, completed work, remaining work and used/remaining known budget concisely, then stop on completed batch or exhausted budget.

## Out of Scope

- Minimal Execution Engine continuation, dependency remediation, runtime enforcement implementation, adapters, Pilot, audit A/B, product architecture, permission changes, risk downgrades or release.

## Acceptance Criteria

- [x] `AC-FRM-ECON-001-001`: A finite plan and budgets exist before dispatch; defaults, precedence, telemetry fallback and stop/continuation behavior are unambiguous.
- [x] `AC-FRM-ECON-001-002`: Review/remediation/context/validation reuse rules prevent duplicate or unbounded work while preserving required independent reviews, exact hashes, required tests, findings and Gates.
- [x] `AC-FRM-ECON-001-003`: Router, Workflow, Harness Contract, operating rules, Work Item template and SDD references agree without schema/architecture/source changes.
- [x] `AC-FRM-ECON-001-004`: A bounded scenario matrix covers normal task, explicit milestone, remediation, changed/stale artifact, closure-only correction, missing token telemetry, budget exhaustion and security failure; independent SPEC review and Spec Gate bind exact candidate hashes.

## Required Gates

- `SPEC_GATE`

## Dependencies

- Existing canonical governance and Harness contracts

## Blockers

- None for documentation; the independent dependency security block on the execution milestone remains unresolved and outside this Work Item.

## Notes

- Human authorization: the user's explicit request to revise the framework to prevent waste authorizes this dedicated framework-document maintenance scope. It supersedes the prior freeze only for these operating rules; runtime Role defaults and security permissions are unchanged.
- Risk rationale: MEDIUM operational specification change, no runtime/source/credential/production/security-boundary capability change. Required primary profile: SPEC_REVIEWER; no code or behavior-triggered QA/Security execution assigned.
- Maker execution: `EXE-FRM-ECON-001-MAKER-001`; fresh context.
- Batch: this primary Work Item only; maximum one automatic remediation and two independent SPEC review rounds. Do not resume HNS-EXEC-002/003/004.
- Required validation: documentation scope/whitespace/reference checks and the bounded AC scenario matrix; no npm validation is applicable to unchanged runtime code or dependencies. No assertion that the separate failed npm audit has passed.
- Completion: `REV-FRM-ECON-001-SPEC-001` PASS, `SG-FRM-ECON-001-001` PASS, merge `669ed70640831683d1fd1defa6f1f2185fd1c401`; post-merge candidate/manifest integrity and protected-path checks PASS. Closure evidence: `LC-FRM-ECON-001-001`.
- Final allocation snapshot `2026-10-04T04:07:47+08:00`: 2/4 Agent executions used, remediation 0/1; original conservative origin `2026-10-03T19:45:00Z`, elapsed 22m47s, remaining WI wallclock 7m13s and batch 37m13s. Token actual/remaining and complete aggregate active-time telemetry unavailable; finite count/time fallback, no hard-token enforcement claim. Unused allocation does not authorize a successor task.
