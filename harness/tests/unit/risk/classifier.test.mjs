import assert from "node:assert/strict";
import test from "node:test";
import { ReviewAssignmentResolver, RiskClarificationError } from "../../../dist/index.js";
import { fixture, hash } from "./fixtures.mjs";
import { canonicalStringify } from "../../../dist/core/hash/index.js";

test("R1 highest risk, normalized inputs, immutable deterministic assignment", () => {
  const f = fixture("MEDIUM", ["fixture.pay", "fixture.auth"]);
  const a = f.classifier.classify(f.input, f.policy);
  const b = f.classifier.classify({ ...f.input, trigger_facts: [" fixture.auth ", "fixture.pay", "fixture.auth"] }, { ...f.policy, rules: [...f.policy.rules].reverse() });
  assert.equal(a.risk_class, "CRITICAL"); assert.deepEqual(a, b); assert.ok(Object.isFrozen(a.source_hashes));
  assert.ok(a.source_hashes.includes(f.policy.policy_hash));
});
test("R2 directory-prefix OR matching and canonical baseline", () => {
  for (const [path, expected] of [["harness/src/auth/login.ts", "HIGH"], ["harness/src/authorize.ts", "LOW"]]) {
    const f = fixture("LOW", [], [path]); assert.equal(f.classifier.classify(f.input, f.policy).risk_class, expected);
  }
  const f = fixture("LOW", []); f.input.artifact_type = "payment";
  assert.equal(f.classifier.classify(f.input, f.policy).risk_class, "CRITICAL");
});
test("R3 unknown facts never yield usable assignment and preserve CRITICAL", () => {
  for (const baseline of ["LOW", "CRITICAL"]) {
    const f = fixture(baseline, ["fixture.unknown"]);
    assert.throws(() => f.classifier.classify(f.input, f.policy), error => error instanceof RiskClarificationError && error.diagnostic_risk === (baseline === "LOW" ? "HIGH" : "CRITICAL"));
  }
});
test("R4 malformed/noncanonical/duplicate rows and unsafe paths reject", () => {
  const f = fixture();
  for (const rules of [[...f.policy.rules, f.policy.rules[0]], ["{"], [" " + f.policy.rules[0]],
    [f.policy.rules[0].replace('"trigger_id":', '"code":"execute","trigger_id":')],
    [f.policy.rules[0].replace("harness/src/auth/", "../auth/")],
    [f.policy.rules[0].replace('"trigger_id":"fixture.auth"', '"trigger_id":"fixture.auth","trigger_id":"fixture.auth"')]]) {
    assert.throws(() => f.classifier.classify(f.input, { ...f.policy, rules, policy_hash: hash({ version: f.policy.version, rules }) }));
  }
  for (const path of ["../a", "/a", "a\\b", "a//b", "a/*", "a/./b"]) assert.throws(() => f.classifier.classify({ ...f.input, changed_paths: [path] }, f.policy));
});
test("R5 self-hashed policy changes, stale raw source, omitted facts and tampered assignment reject", () => {
  const f = fixture(); const original = f.classifier.classify(f.input, f.policy);
  const rules = [canonicalStringify({ trigger_id: "fixture.auth", risk_class: "LOW", artifact_types: [], path_prefixes: [] })];
  assert.throws(() => f.classifier.classify(f.input, { ...f.policy, rules, policy_hash: hash({ version: f.policy.version, rules }) }));
  assert.throws(() => f.classifier.classify({ ...f.input, trigger_facts: [] }, f.policy));
  assert.throws(() => f.classifier.verify({ ...original, risk_class: "LOW" }, f.wi.id));
  f.files[".ai/policy.md"] += "changed"; assert.throws(() => f.classifier.verify(original, f.wi.id));
});
test("review assignments are role-aligned, sorted, fully Maker-bound and reject collisions/stale artifacts", () => {
  for (const [role, basic] of [["IMPLEMENTER", "TECH_REVIEWER"], ["PRODUCT_ARCHITECT", "SPEC_REVIEWER"], ["UX_DESIGNER", "UX_REVIEWER"]]) {
    const f = fixture(); const risk = f.classifier.classify(f.input, f.policy);
    const registry = [basic, "QA_REVIEWER", "SECURITY_REVIEWER"].map(profile => ({ profile, execution_id: `review-${profile}`, required_checks: ["canonical"], required_evidence: ["hash"] }));
    const input = { work_item_id: f.wi.id, risk, maker_role: role, maker_execution_ids: ["maker-2", "maker-1"], artifact: { kind: "implementation", path: "harness/src/risk/index.ts" }, artifact_hash: hash("artifact"), security_trigger: true, qa_required: true, required_profiles: [], registry };
    const resolver = new ReviewAssignmentResolver({ current: () => input, artifactHash: () => hash("artifact") }, f.classifier);
    const assignments = resolver.resolve(f.wi.id); assert.equal(assignments.length, 3); assert.ok(assignments.some(a => a.review_profile === basic));
    assert.deepEqual(assignments, resolver.resolve(f.wi.id)); assert.ok(Object.isFrozen(assignments[0].maker_execution_ids));
    registry[0].execution_id = "maker-2"; assert.throws(() => resolver.resolve(f.wi.id));
    registry[0].execution_id = registry[1].execution_id; assert.throws(() => resolver.resolve(f.wi.id));
    registry[0].execution_id = "independent"; input.artifact_hash = hash("stale"); assert.throws(() => resolver.resolve(f.wi.id));
  }
});
