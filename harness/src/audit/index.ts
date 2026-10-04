import { defineCoreValue, type GateId, type GateResult } from '../core/domain.js';
import { hashValue, identifier, requireCondition, schema, equal, hashField } from '../risk/validation.js';
import { transitionExecutionState, isTerminalExecutionState, type ExecutionState } from '../execution/state.js';
import { snapshotHarnessErrorDetails, type HarnessErrorDetails } from '../errors/safe-details.js';
import { createHarnessError } from '../errors/harness-error.js';
import type { ReviewAssignment } from '../risk/types.js';
import type { ReviewFinding } from '../core/domain.js';
import type { ReviewEvidence } from '../gates/index.js';
import { GateRunner, isRunnerGateResult } from '../gates/index.js';
export interface AuditHost { redact(payload: HarnessErrorDetails): HarnessErrorDetails; }
export interface AuditEvent {
  readonly sequence: number; readonly timestamp: string; readonly previous_hash: string;
  readonly hash: string; readonly type: string; readonly payload: HarnessErrorDetails;
}
export interface AuditIdentity {
  readonly execution_id: string; readonly task_id: string; readonly profile_hash: string; readonly commit_before: string;
}
export class AuditRecorder {
  readonly #host: AuditHost;
  readonly #identity: AuditIdentity;
  readonly #runner: GateRunner;
  readonly #gate: GateId;
  readonly #events: AuditEvent[] = [];
  readonly #gates = new Map<GateId, GateResult>();
  readonly #refs = { role_evidence_refs: [] as string[], review_assignment_refs: [] as string[], finding_refs: [] as string[] };
  #failed = false;
  #state: ExecutionState = 'CREATED';
  #final: Readonly<Record<string, unknown>> | undefined;
  constructor(host: AuditHost, identity: AuditIdentity, runner: GateRunner, gate: GateId) {
    this.#host = host; this.#identity = defineCoreValue(identity); this.#runner = runner; this.#gate = gate;
    identifier(identity.execution_id); identifier(identity.task_id); hashField(identity.profile_hash); identifier(identity.commit_before);
  }
  get state(): ExecutionState { return this.#state; }
  get events(): readonly AuditEvent[] { return defineCoreValue(this.#events); }
  #fail(reason: string): never { this.#failed = true; if (!isTerminalExecutionState(this.#state)) this.#state = transitionExecutionState(this.#state, this.#state, 'FAILED_RUNTIME'); throw createHarnessError('HNS-AUD-001', { correlationId: this.#identity.execution_id, causeCategory: reason }); }
  #redact(payload: HarnessErrorDetails): HarnessErrorDetails {
    let redacted: HarnessErrorDetails;
    try { redacted = snapshotHarnessErrorDetails(this.#host.redact(snapshotHarnessErrorDetails(payload))); }
    catch { this.#fail('AuditRedactionFailure'); } // Sanitize failures at this specific host audit boundary.
    return redacted;
  }
  append(type: string, payload: HarnessErrorDetails, timestamp: string): AuditEvent {
    if (this.#failed || this.#final !== undefined || !this.verify()) this.#fail('InvalidAuditState');
    requireCondition(Number.isFinite(Date.parse(timestamp)) && timestamp.endsWith('Z'), 'UTC timestamp required');
    const redacted = this.#redact(payload);
    const content = { sequence: this.#events.length + 1, timestamp, previous_hash: this.#events.at(-1)?.hash ?? hashValue([]), type: identifier(type), payload: redacted };
    const event = defineCoreValue({ ...content, hash: hashValue(content) }); this.#events.push(event); return event;
  }
  verify(events: readonly AuditEvent[] = this.#events): boolean {
    let previous = hashValue([]);
    for (let index = 0; index < events.length; index++) {
      const event = events[index]!; const { hash, ...content } = event;
      if (event.sequence !== index + 1 || event.previous_hash !== previous || hashValue(content) !== hash) return false;
      previous = hash;
    }
    return events.length === this.#events.length && previous === (this.#events.at(-1)?.hash ?? hashValue([]));
  }
  recordReference(kind: 'role_evidence_refs' | 'review_assignment_refs' | 'finding_refs', ref: string, timestamp: string): void {
    const value = identifier(ref); this.append(kind, { reference: value }, timestamp); this.#refs[kind].push(value);
  }
  recordEvidence(value: ReviewAssignment | ReviewEvidence | ReviewFinding, timestamp: string): void {
    const snapshot = defineCoreValue(value); schema(snapshot);
    const kind = snapshot.schema_version === 'harness.review-assignment/v1' ? 'review_assignment_refs'
      : snapshot.schema_version === 'harness.role-evidence/v1' ? 'role_evidence_refs' : 'finding_refs';
    const event = this.append(kind, { record: snapshot as unknown as HarnessErrorDetails }, timestamp);
    this.#refs[kind].push(event.hash);
  }
  recordGateResult(result: GateResult): void {
    if (!isRunnerGateResult(result, this.#identity.task_id, this.#runner)) this.#fail('UntrustedGateResult');
    const prior = this.#gates.get(result.gate_id);
    if (prior !== undefined) { if (!equal(prior, result)) this.#fail('GateResultConflict'); return; }
    this.append('GATE_RESULT', { result: result as unknown as HarnessErrorDetails }, result.timestamp);
    this.#gates.set(result.gate_id, result);
  }
  transition(expected: ExecutionState, next: ExecutionState, timestamp: string): void {
    const state = transitionExecutionState(this.#state, expected, next);
    if (next === 'COMPLETED') this.#checkCompletion();
    this.append('STATE_TRANSITION', { from: this.#state, to: state }, timestamp); this.#state = state;
  }
  #gateFailure(reason: string): never { throw createHarnessError('HNS-GATE-001', { correlationId: this.#identity.execution_id, causeCategory: reason }); }
  #checkCompletion(): void {
      const required = this.#runner.resolveRequiredGates(this.#identity.task_id, this.#gate);
      if (!this.verify() || !required.every(gate => this.#gates.get(gate)?.status === 'PASS')) this.#gateFailure('CompletionEvidenceIncomplete');
      for (const gate of required) {
        const recorded = this.#gates.get(gate)!;
        const current = this.#runner.runGate(gate, this.#identity.task_id, recorded.timestamp);
        if (!equal(current, recorded)) this.#gateFailure('StaleCompletionEvidence');
      }
  }
  finalize(timestamp: string): Readonly<Record<string, unknown>> {
    if (this.#failed || !isTerminalExecutionState(this.#state) || !this.verify()) this.#fail('InvalidFinalState');
    if (this.#state === 'COMPLETED') this.#checkCompletion();
    const content = defineCoreValue({ schema_version: 'harness.audit/v2', ...this.#identity,
      events_hash: this.#events.at(-1)?.hash ?? hashValue([]), gate_results: [...this.#gates.values()].sort((a,b) => a.gate_id < b.gate_id ? -1 : 1),
      approvals: [], ...this.#refs, final_status: this.#state, finalized_at: timestamp });
    const result = this.#redact(content as unknown as HarnessErrorDetails);
    schema(result);
    if (this.#final !== undefined) { if (!equal(this.#final, result)) this.#fail('FinalizationConflict'); return this.#final; }
    this.#final = result; return result;
  }
}
