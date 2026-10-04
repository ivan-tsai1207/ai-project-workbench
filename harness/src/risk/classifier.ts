import { defineCoreValue, RISK_CLASSES, type RiskClass } from "../core/domain.js";
import { canonicalStringify } from "../core/hash/index.js";
import type { RiskAssignment, RiskClassificationInput, RiskPolicy } from "./types.js";
import { equal, hashField, hashValue, identifier, relativePath, requireCondition, schema, sorted } from "./validation.js";

interface Rule {
  readonly trigger_id: string;
  readonly risk_class: RiskClass;
  readonly artifact_types: readonly string[];
  readonly path_prefixes: readonly string[];
}
export interface RiskAdmission {
  readonly input: RiskClassificationInput;
  readonly baseline: RiskClass;
  readonly policy: RiskPolicy;
  readonly policy_sources: readonly { readonly path: string; readonly sha256: string }[];
}
export interface RiskAuthority {
  current(workItemId: string): RiskAdmission;
  sourceHash(path: string): string;
}
export class RiskClarificationError extends TypeError {
  constructor(readonly diagnostic_risk: RiskClass) { super("Unknown risk fact requires canonical clarification"); }
}
function maximum(values: readonly RiskClass[]): RiskClass {
  return RISK_CLASSES[Math.max(...values.map(value => {
    const rank = RISK_CLASSES.indexOf(value);
    requireCondition(rank >= 0, "Invalid risk class");
    return rank;
  }))]!;
}
function normalizeInput(input: RiskClassificationInput): RiskClassificationInput {
  return {
    work_item_id: identifier(input.work_item_id), artifact_type: identifier(input.artifact_type),
    changed_paths: sorted(input.changed_paths, value => relativePath(value)),
    trigger_facts: sorted(input.trigger_facts), source_hashes: sorted(input.source_hashes, hashField),
  };
}
function parsePolicy(policy: RiskPolicy): { policy: RiskPolicy; rows: Rule[] } {
  const version = identifier(policy.version);
  requireCondition(version === policy.version && policy.rules.length > 0, "Invalid policy revision/rows");
  const rows = policy.rules.map(text => {
    const value: unknown = JSON.parse(text);
    requireCondition(value !== null && typeof value === "object" && !Array.isArray(value), "Risk row must be an object");
    const row = value as Record<string, unknown>;
    requireCondition(equal(Object.keys(row).sort(), ["artifact_types", "path_prefixes", "risk_class", "trigger_id"]), "Exact risk row members required");
    requireCondition(typeof row.trigger_id === "string" && typeof row.risk_class === "string"
      && RISK_CLASSES.includes(row.risk_class as RiskClass) && Array.isArray(row.artifact_types)
      && row.artifact_types.every(value => typeof value === "string") && Array.isArray(row.path_prefixes)
      && row.path_prefixes.every(value => typeof value === "string"), "Invalid risk row types");
    const normalized: Rule = {
      trigger_id: identifier(row.trigger_id), risk_class: row.risk_class as RiskClass,
      artifact_types: sorted(row.artifact_types as string[]),
      path_prefixes: sorted(row.path_prefixes as string[], value => relativePath(value, true)),
    };
    requireCondition(canonicalStringify(normalized) === text, "Noncanonical risk row");
    return normalized;
  }).sort((a, b) => a.trigger_id < b.trigger_id ? -1 : a.trigger_id > b.trigger_id ? 1 : 0);
  requireCondition(new Set(rows.map(row => row.trigger_id)).size === rows.length, "Duplicate normalized trigger ID");
  const payload = { version, rules: rows.map(canonicalStringify) };
  requireCondition(hashField(policy.policy_hash) === hashValue(payload), "Risk policy hash mismatch");
  return { policy: { ...payload, policy_hash: policy.policy_hash }, rows };
}
export class RiskClassifier {
  readonly #authority: RiskAuthority;
  constructor(authority: RiskAuthority) { this.#authority = authority; }
  classify(input: RiskClassificationInput, policy: RiskPolicy): RiskAssignment {
    const normalized = normalizeInput(defineCoreValue(input));
    const admitted = defineCoreValue(this.#authority.current(normalized.work_item_id));
    const parsed = parsePolicy(policy);
    requireCondition(equal(normalized, normalizeInput(admitted.input)), "Facts/source evidence differ from admitted host input");
    requireCondition(equal(parsed.policy, parsePolicy(admitted.policy).policy), "Policy differs from current host admission");
    requireCondition(admitted.policy_sources.length > 0 && normalized.source_hashes.length > 0, "Missing canonical source evidence");
    const sourceHashes = admitted.policy_sources.map(source => {
      const path = relativePath(source.path);
      requireCondition(hashField(source.sha256) === hashField(this.#authority.sourceHash(path)), "Stale policy source");
      return source.sha256;
    });
    const matches = parsed.rows.filter(row => normalized.trigger_facts.includes(row.trigger_id)
      || row.artifact_types.includes(normalized.artifact_type)
      || normalized.changed_paths.some(path => row.path_prefixes.some(prefix => path.startsWith(prefix))));
    const risks = [admitted.baseline, ...matches.map(row => row.risk_class)];
    if (normalized.trigger_facts.some(fact => !parsed.rows.some(row => row.trigger_id === fact))) {
      throw new RiskClarificationError(maximum([...risks, "HIGH"]));
    }
    const payload = {
      schema_version: "harness.risk-assignment/v1" as const, risk_class: maximum(risks),
      trigger_ids: matches.map(row => row.trigger_id),
      source_hashes: sorted([...normalized.source_hashes, ...sourceHashes, parsed.policy.policy_hash], hashField),
      classifier_version: "risk-json-rows/v1",
    };
    const result = defineCoreValue({ ...payload, assignment_hash: hashValue(payload) });
    schema(result);
    return result;
  }
  verify(assignment: RiskAssignment, workItemId: string): void {
    const admitted = this.#authority.current(workItemId);
    requireCondition(equal(assignment, this.classify(admitted.input, admitted.policy)), "Stale/tampered risk assignment");
  }
}
