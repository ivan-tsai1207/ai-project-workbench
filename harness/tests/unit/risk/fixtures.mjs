import { RiskClassifier } from "../../../dist/index.js";
import { canonicalStringify, hashCanonicalValue, encodeUtf8, sha256Hex } from "../../../dist/core/hash/index.js";
export const hash = value => `sha256:${hashCanonicalValue(value)}`;
export const rawHash = value => `sha256:${sha256Hex(encodeUtf8(value))}`;
export function fixture(baseline = "HIGH", facts = ["fixture.auth"], paths = []) {
  const files = { "work-items/HNS-EXEC-003.md": "# Assigned Work Item\n", ".ai/policy.md": "# Canonical Policy\n", ".ai/gates/implementation-gate.md": "# Implementation Gate\n" };
  const wi = {
    schema_version: "harness.work-item/v2", id: "HNS-EXEC-003", title: "Risk/profile fixture", role: "IMPLEMENTER",
    feature: "minimal-execution-engine", phase: "IMPLEMENTATION", status: "IN_PROGRESS", spec_version: "harness-v0.1-review", design_version: "N/A",
    risk_class: baseline, review_profile: null, reviewed_artifact: null, reviewed_artifact_hash: null, maker_execution_id: null,
    objective: "Build risk/profile", requirement_references: [], read_scope: [".ai/**", "work-items/**"], write_scope: ["harness/src/risk/**"],
    forbidden_scope: [], scope: ["Risk/profile"], out_of_scope: ["Adapters"], acceptance_criteria: [], required_gates: ["IMPLEMENTATION_GATE"],
    dependencies: [], blockers: [], notes: [], source_path: "work-items/HNS-EXEC-003.md", document_hash: rawHash(files["work-items/HNS-EXEC-003.md"]),
  };
  const rules = [
    { trigger_id: "fixture.auth", risk_class: "HIGH", artifact_types: [], path_prefixes: ["harness/src/auth/"] },
    { trigger_id: "fixture.pay", risk_class: "CRITICAL", artifact_types: ["payment"], path_prefixes: [] },
  ].map(canonicalStringify);
  const policy = { version: "fixture-v1", rules, policy_hash: hash({ version: "fixture-v1", rules }) };
  const input = { work_item_id: wi.id, artifact_type: "implementation", changed_paths: paths, trigger_facts: facts, source_hashes: [wi.document_hash] };
  const admission = { input, baseline, policy, policy_sources: [{ path: ".ai/policy.md", sha256: rawHash(files[".ai/policy.md"]) }] };
  const authority = { current: () => admission, sourceHash: path => rawHash(files[path]) };
  return { wi, files, admission, input, policy, authority, classifier: new RiskClassifier(authority) };
}
