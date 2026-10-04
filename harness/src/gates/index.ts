import { defineCoreValue, GATE_IDS, type GateId, type GateResult, type GateResultStatus, type ReviewFinding, type ArtifactReference, type ReviewProfile, type WorkItem } from '../core/domain.js';
import { encodeUtf8, sha256Hex } from '../core/hash/index.js';
import type { ReviewAssignment } from '../risk/types.js';
import type { ReviewAssignmentResolver } from '../risk/review.js';
import { equal, hashField, identifier, requireCondition, schema } from '../risk/validation.js';

export interface ReviewEvidence {
  readonly schema_version: 'harness.role-evidence/v1';
  readonly evidence_id: string;
  readonly execution_id: string;
  readonly work_item_id: string;
  readonly role: 'REVIEWER';
  readonly review_profile: ReviewProfile;
  readonly artifact_refs: readonly ArtifactReference[];
  readonly artifact_hashes: readonly string[];
  readonly spec_references: readonly ArtifactReference[];
  readonly checks_performed: readonly { readonly id: string; readonly method: string; readonly result: string; readonly evidence_reference?: string }[];
  readonly tests_performed: ReviewEvidence['checks_performed'];
  readonly findings: readonly string[];
  readonly known_limitations: readonly string[];
  readonly result: 'PASS' | 'REQUEST_CHANGES' | 'BLOCK';
  readonly timestamp: string;
}
export interface GateAdmission {
  readonly work_item: Pick<WorkItem, "id" | "role" | "phase" | "review_profile" | "required_gates">;
  readonly required_gates: readonly GateId[];
  readonly mandatory_gates: readonly GateId[];
  readonly definition: { readonly path: string; readonly bytes: string; readonly hash: string };
  readonly criteria: readonly { readonly criterion: string; readonly status: GateResultStatus; readonly evidence: string }[];
  readonly reviews: readonly ReviewEvidence[];
  readonly findings: readonly ReviewFinding[];
  readonly reviewer: string;
}
/** Implemented by the trusted host, outside the Agent input boundary. */
export interface GateAuthority { current(workItemId: string, gate: GateId): GateAdmission; }
const paths: Readonly<Record<GateId, string>> = {
  SPEC_GATE: '.ai/gates/spec-gate.md', DESIGN_GATE: '.ai/gates/design-gate.md',
  IMPLEMENTATION_GATE: '.ai/gates/implementation-gate.md',
  DELIVERY_ASSURANCE_GATE: '.ai/gates/delivery-assurance-gate.md', RELEASE_GATE: '.ai/gates/release-gate.md',
};
const authenticResults = new WeakMap<object, { readonly task: string; readonly runner: GateRunner }>();
export function isRunnerGateResult(result: GateResult, workItemId: string, runner: GateRunner): boolean { const origin = authenticResults.get(result); return origin?.task === workItemId && origin.runner === runner; }
export class GateRunner {
  readonly #authority: GateAuthority;
  readonly #reviews: ReviewAssignmentResolver;
  constructor(authority: GateAuthority, reviews: ReviewAssignmentResolver) { this.#authority = authority; this.#reviews = reviews; }
  resolveRequiredGates(workItemId: string, gate: GateId): readonly GateId[] {
    const current = defineCoreValue(this.#authority.current(identifier(workItemId), gate));
    requireCondition(current.work_item.id === workItemId && current.work_item.required_gates.every(id => current.required_gates.includes(id)), 'Work Item Gate binding mismatch');
    const defaults = { SPEC: 'SPEC_GATE', DESIGN: 'DESIGN_GATE', IMPLEMENTATION: 'IMPLEMENTATION_GATE', RELEASE: 'RELEASE_GATE' } as const;
    if (current.work_item.phase !== 'REVIEW') requireCondition(current.mandatory_gates.includes(defaults[current.work_item.phase]), 'Phase mandatory Gate missing');
    const gates = [...new Set([...current.mandatory_gates, ...current.required_gates])].sort();
    requireCondition(current.mandatory_gates.length > 0 && gates.every(id => GATE_IDS.includes(id)), 'Missing or unknown mandatory gates');
    return defineCoreValue(gates);
  }
  validateReviewEvidence(assignments: readonly ReviewAssignment[], evidence: readonly ReviewEvidence[]): void {
    requireCondition(assignments.length > 0, 'Required review missing');
    const seen = new Set<string>();
    for (const review of evidence) {
      schema(review);
      requireCondition(!seen.has(review.execution_id), 'Review execution collision'); seen.add(review.execution_id);
      const assignment = assignments.find(value => value.review_profile === review.review_profile);
      requireCondition(assignment !== undefined && review.work_item_id === assignment.work_item_id, 'Unassigned profile');
      this.#reviews.verify(assignment, review.execution_id);
    }
    for (const assignment of assignments) {
      const matches = evidence.filter(value => value.review_profile === assignment.review_profile);
      requireCondition(matches.length === 1, 'Required review missing or duplicated');
      const review = matches[0]!;
      requireCondition(review.result === 'PASS' && review.role === 'REVIEWER'
        && review.artifact_refs.some((ref, index) => equal(ref, assignment.reviewed_artifact) && review.artifact_hashes[index] === assignment.reviewed_artifact_hash), 'Failed or stale review');
      const checks = [...review.checks_performed, ...review.tests_performed];
      requireCondition(assignment.required_checks.every(id => checks.some(check => check.id === id && check.result === 'PASS'))
        && assignment.required_evidence.every(ref => checks.some(check => check.evidence_reference === ref && check.result === 'PASS')), 'Required review evidence incomplete');
    }
  }
  runGate(gate: GateId, workItemId: string, timestamp: string): GateResult {
    requireCondition(GATE_IDS.includes(gate) && gate !== 'RELEASE_GATE', 'Unsupported Gate execution');
    requireCondition(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(timestamp) && Number.isFinite(Date.parse(timestamp)), 'UTC timestamp required');
    const admission = defineCoreValue(this.#authority.current(identifier(workItemId), gate));
    requireCondition(admission.definition.path === paths[gate]
      && hashField(admission.definition.hash) === `sha256:${sha256Hex(encodeUtf8(admission.definition.bytes))}`, 'Stale Gate definition');
    requireCondition(this.resolveRequiredGates(workItemId, gate).includes(gate), 'Gate not required');
    if (gate === 'DELIVERY_ASSURANCE_GATE') requireCondition(admission.work_item.role === 'REVIEWER' && admission.work_item.phase === 'REVIEW' && admission.work_item.review_profile === 'DELIVERY_ASSURANCE_REVIEWER', 'Delivery assurance Work Item binding mismatch');
    const assignments = this.#reviews.resolve(workItemId);
    let status: GateResultStatus = 'PASS';
    const evidence: string[] = [];
    // Validation errors remain explicit failures rather than inferred review approval.
    try { this.validateReviewEvidence(assignments, admission.reviews); }
    catch (error: unknown) { if (!(error instanceof TypeError)) throw error; status = 'FAILED'; evidence.push('REVIEW_VALIDATION_FAILED'); }
    for (const finding of admission.findings) {
      schema(finding);
      if (finding.status === 'OPEN' && finding.severity === 'BLOCKING') status = 'FAILED';
    }
    requireCondition(admission.reviews.every(review => review.findings.every(id => admission.findings.some(f => f.finding_id === id))), 'Missing finding evidence');
    const section = admission.definition.bytes.split(gate === 'DELIVERY_ASSURANCE_GATE' ? '## Checks' : '## 檢查項目')[1]?.split('\n## ')[0];
    requireCondition(section !== undefined, 'Missing canonical Gate criteria');
    const required = section.split('\n').filter(line => line.startsWith('- ')).map(line => line.slice(2).trim());
    requireCondition(required.length > 0 && admission.criteria.length === required.length
      && required.every(criterion => admission.criteria.filter(check => check.criterion === criterion).length === 1), 'Canonical Gate checks incomplete');
    for (const criterion of admission.criteria) {
      requireCondition(['PASS', 'FAILED', 'NEEDS_CLARIFICATION'].includes(criterion.status), 'Invalid Gate decision');
      evidence.push(identifier(criterion.evidence));
      if (criterion.status === 'FAILED') status = 'FAILED';
      else if (criterion.status === 'NEEDS_CLARIFICATION' && status === 'PASS') status = 'NEEDS_CLARIFICATION';
    }
    evidence.push(...admission.reviews.map(review => review.evidence_id));
    const result = defineCoreValue({ gate_id: gate, status, evidence: [...new Set(evidence)].sort(), timestamp,
      artifact_hashes: [...new Set([...assignments.map(value => value.reviewed_artifact_hash), admission.definition.hash])].sort(), reviewer: identifier(admission.reviewer) });
    requireCondition(equal(admission, this.#authority.current(workItemId, gate)), 'Gate admission changed during validation');
    authenticResults.set(result, { task: workItemId, runner: this }); return result;
  }
}
