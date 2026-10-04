# Work Item Contract

| Field | Value |
|---|---|
| Schema Version | `harness.work-item/v2` |
| ID | `WBP3-DESIGN` |
| Title | `WBP3-DESIGN local Workbench delivery` |
| Role | `UX_DESIGNER` |
| Feature | `workbench` |
| Phase | `DESIGN` |
| Status | `IN_PROGRESS` |
| Spec Version | `workbench-v0.4` |
| Design Version | `workbench-v0.4` |
| Risk Class | `MEDIUM` |
| Review Profile | `N/A` |
| Reviewed Artifact | `N/A` |
| Reviewed Artifact Hash | `N/A` |
| Maker Execution ID | `N/A` |

## Objective

Deliver assigned local Workbench milestone with exact artifact-bound independent evidence.

## Requirement References

- Requirement IDs: `AC-WB-001`, `AC-WB-002`, `AC-WB-003`, `AC-WB-004`, `AC-WB-005`, `AC-WB-006`, `AC-WB-007`, `AC-WB-008`, `AC-WB-009`, `AC-WB-010`, `AC-WB-011`, `AC-WB-012`, `AC-WB-013`, `AC-WB-014`, `AC-WB-015`
- Feature Spec: `specs/workbench/spec.md#workbench-onboarding-v04`
- Screen IDs / Screen Specs: `SCR-WB-001` / `design/workbench/screens/SCR-WB-001.md`
- ADR: `N/A`
- Architecture / SDD sections: `docs/04_system/SDD.md#workbench-onboarding-v04`
- Review / Evidence references: `N/A`

## Read Scope

- `.ai/CONSTITUTION.md`
- `.ai/AUTHORITY.md`
- `.ai/WORKFLOW.md`
- `.ai/roles/ux-designer.md`
- `.ai/gates/**`
- `work-items/WBP3-DESIGN.md`
- `specs/workbench/spec.md`
- `docs/02_product/**`
- `docs/03_requirements/SRS.md`
- `docs/04_system/**`
- `design/workbench/screens/SCR-WB-001.md`
- `design/workbench/Design_Source_Map.md`
- `design/workbench/wireframe-v04.html`

## Write Scope

- `design/workbench/screens/SCR-WB-001.md`
- `design/workbench/Design_Source_Map.md`
- `design/workbench/wireframe-v04.html`

## Forbidden Scope

- `.ai/**`
- `harness/**`
- `main`
- `apps/**`

## Scope

- Complete this milestone against WB-001..015; record all seven AC coverage, limitations, exact hashes and independent decision.

## Out of Scope

- Production, cloud, auto-editing, business-project storage here, governance bypass or full Harness adapter/enforcement claims.

## Acceptance Criteria

- [ ] `AC-WBP3-DESIGN-001`: Exact current artifact, scope, identities and references verified.
- [ ] `AC-WBP3-DESIGN-002`: All fifteen applicable Workbench ACs assessed with material failure coverage.
- [ ] `AC-WBP3-DESIGN-003`: Complete evidence, limitations and decision persisted within finite allocation.

## Required Gates

- `DESIGN_GATE`

## Dependencies

- `work-items/WBP3-SPEC.md`

## Blockers

- None

## Notes

- Public source candidate for AI Project Workbench v0.4. Full local validation records, screenshots, operational budgets and reviewer transcripts are excluded from this public source publication. Release approval, delivery assurance and default-branch merge remain pending; this document does not claim completed approval.
