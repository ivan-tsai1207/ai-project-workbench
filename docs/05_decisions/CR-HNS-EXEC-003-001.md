# CR-HNS-EXEC-003-001

- Status: Approved
- Owner: PRODUCT_ARCHITECT
- Scope: two contract clarifications only
- Human authorization: user approved the specifically proposed canonical risk rule and Context compile provenance corrections by requesting the next step.
- Source: HNS-EXEC-003-PREFLIGHT-001
- Governance/Architecture: frozen; no redesign or permission change
- Canonical targets: docs/harness_v0.1_SDD.md Sections5.5/16.1 and21
- Downstream: HNS-EXEC-003 remains blocked until independent Spec/Security approval, Spec Gate and canonical merge.

## Required Correction

1. Specify the existing RiskPolicy.rules representation, evaluation and host authority/hash binding without an executable DSL or new Agent-selected policy.
2. Specify a host-owned immutable Context compile provenance port/receipt verifying context hash/execution and repository commit/identity, without modifying completed Context/Profile schema or inventing data in spec_versions.

## Limits

No source/tests/dependencies/governance/schema edits or runtime implementation. This approval does not waive independent reviews, Spec Gate, artifact invalidation or finite allocation. Actual accepted canonical version and downstream scope recorded after Gate/merge; runtime completion remains separate.
