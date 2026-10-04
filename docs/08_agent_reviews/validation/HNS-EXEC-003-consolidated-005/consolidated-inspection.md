# Consolidated Pre-Review Inspection - HNS-EXEC-003

Decision: NOT_READY_FOR_REVIEW. One confirmed MAJOR integration defect. This is parent/Maker preflight evidence, not independent Reviewer approval.

## Scope and Inventory

- Frozen Minimal Execution Engine requirements only; active003 fourACs, Risk R1-R5, Profile C1-C6, current source/tests, existing resolved regressions and direct001/002 dependency interfaces.
- Source candidate8e4c06650d13ead12a66eb02cb9e681e862b504a; immutableR3 manifestsha256:6b92a4c829c0fdc70c00fc8ad3da65332ca1bd5fdd5d63d2fdf41829855adc02 preserved. Fresh validation testedmetadataHEAD525bbb2c737259155e13fcc71d3a7f70d269b9df.
- EXEC001/002 historicalDONE; EXEC003 notclosed; EXEC004 Gate Runner/minimalAudit remainsTODO. Its four requirements are existing remaining work, not defects or new requirements. No004implementation/adapters/Pilot.
- No fullreview_log, whole-repository scan or generalizedfuzzing. Canonical specification extraction only; optional overlarge multi-section output was followed by intact directsection reads.

## Consolidated Coverage

| Area | Checks | Result |
|---|---|---|
| Risk | Normalization, canonical JSON rows, OR matching/prefix, highest risk, unknownfacts, current source/policy, downgrade | Existing R1-R5 tests PASS; source inspected |
| Review assignment | Basic profile by Maker role, QA/security/critical triggers, immutable hash, artifact/registry/execution collision, Maker separation | Existing tests PASS; additional8 bounded riskclass/missing-reviewer scenarios PASS |
| Profile | All execution-relevant fields, canonical hash, schema, deepfreeze, current WorkItem/policy/review/gates | Existing38 positive field changes and negative cases PASS; source inspected |
| Provenance/lifecycle | C1-C6 receipts, compile origin, final-read drift, closure/supersession, copied context, changed context, admission recovery | Existing focused regressions PASS; known FND-TECH-002-001 remains technicallyRESOLVED |
| Real module composition | Load actual canonical WorkItem003, feed its unmodified scopes into actual ContextCompiler, read mandatory governance and assigned WorkItem | FAIL: both explicit required reads rejected asFORBIDDEN_SCOPE |
| Context/source boundary | Realpath/root containment, read/policy scope, explicit read-deny boundary, immutable context/hash interface | Read-deny remains valid; WorkItem write-forbidden conflated with read-deny is confirmed defect |
| Foundation state | Legal/terminal/stale transitions; no process/adapters/enforcement capability introduced | Existing foundation suite PASS; transition/hash boundary inspected |
| Hygiene/scope/dependencies | No TODO/FIXME/any/ignore/skip/only/catch in reviewed risk/profile paths, no new package/schema/governance edits | Hygiene search no matches (rg exit1 is empty result); source unchanged |
| Completion evidence | Candidate/source/runtime/fullinput/rawlogs/built-dist identity, required reviewers/Gate/merge/closure | Runtime PASS but preflight integration defect blocks new formal review and closure |

## Confirmed Finding

ID: FND-HNS-EXEC-003-PREFLIGHT-005-001
Severity: MAJOR
Status: OPEN
Discovery: consolidated parent/Maker preflight, not TECH/QA/Security Review
Owner: IMPLEMENTER, dependency module originally owned by HNS-EXEC-002
Requirement: templates/Work_Item.md Forbidden Scope comment/rule17; SDD18.1-18.2 mandatory governance and assigned WorkItem loading; AGENTS bootstrap; existing Context Compiler read boundary.

- Canonical WorkItem contract says Forbidden Scope prohibits modification and takes precedence over Write Scope. Active003 explicitly allows reading .ai/CONSTITUTION.md and its own WorkItem but forbids writes under .ai/** and work-items/**.
- harness/src/context/compiler.ts lines441-445 merges input.work_item.forbidden_scope into the read-only ContextReadBoundary.forbidden_scope. #load/authorizePath then reject the mandatory reads.
- Actual current repository WorkItem parsed successfully. With host read-forbidden=[], real canonical scopes and bounded filesystem provider, governance read fails HNS-CTX-002/FORBIDDEN_SCOPE at .ai/CONSTITUTION.md; assigned-WorkItem-only read fails the same at work-items/HNS-EXEC-003.md.
- Removing only WorkItem write-forbidden patterns in an isolated CONTROL fixture allows compile. This control is proof of the cause, NOT an authorized runtime permission change or remediation.
- Actual output at real-work-item-probe.result.json; exact executable reproducer real-work-item-probe.mjs. Probe exit0 means counterexample was reproduced, not canonical validationPASS.
- Existing risk/profile fixtures use forbidden_scope=[] and did not exercise actual canonical WorkItem metadata. Green isolated tests therefore missed this integration failure. This is a previous verification gap, not a new requirement.

## Single Proposed Remediation Scope

- Authorized owner execution must narrowly repair harness/src/context/compiler.ts and add regression coverage in harness/tests/unit/context/compiler.test.mjs.
- Separate operation-specific boundaries: preserve ContextReadBoundary.forbidden_scope as a real read prohibition, preserve WorkItem ReadScope/policyReadScope and every write prohibition; do not silently remove restrictions or treat deny-write as deny-read.
- Add real parsed WorkItem positive coverage for required governance and assignedWorkItem despite write-forbidden paths; retain negatives for explicit host read-forbidden and missingReadScope, path/source/hash/budget/security boundaries.
- No registry/schema/architecture/governance/package/adapter changes; no generic crawler. Batch all confirmed corrections/tests, full exact-runtime validation and Maker self-review BEFORE independent review.
- This source is outside current003 WriteScope; prior automatic correction1/1 and Human namedexception1/1 exhausted. Under existing newMAJOR stop rule, no repair dispatch until Human explicitly approves this named Finding/finite owner scope. No new Reviewer executions were dispatched.

## Validation and Limits

- Nodev24.19.0/npm11.17.0; fresh canonical npmci/build/typecheck/test233/233/focused69/69/audit-high0 all exit0, zero skipped/canceled/todo. Focused overlaps fullsuite;8 precheck cases are separate probes, not extra test-suite count.
- 96 captured inputs/116 built files/16 raw logs; stable before metadata checkpoint. Commands 2026-10-04T09:12:47.035Z-2026-10-04T09:12:52.406Z.
- Runtime results do not override reproduced integration failure. No claim of all unknown defects found or fullmilestonecomplete; known canonical inventory examined once and returned together.
- TECH003 prior actualtechnicalPASS preserved alongside21.770s final-report lateness; not a new code defect or timelycompletion/Gate waiver. Risk-required TECH/QA/Security and ImplementationGate remain required after repair/currenthash requalification.
- Shared finite allocation09:05:00Z(conservativepreflight)-09:35:00Z, originalhistory/counters retained. Attempt6 remains6, addedreviews0/3, noMaker dispatched, automatic1/1 andnamedHumanexception1/1 unchanged. Review time arrangement planned6min includingreport instead of5; unused review allocation canceled by newMAJOR stop, not reset or automatic continuation.
- TokenTARGET20,000 actualnull without completeaggregate telemetry; contexttarget not a precise token measure. Source/develop/main unchanged. No furtherprobes/retries/sourcewrites/reviews after confirmedMAJOR.
