import assert from "node:assert/strict";
import { ReviewAssignmentResolver } from "../../../../harness/dist/index.js";
import { fixture, hash } from "../../../../harness/tests/unit/risk/fixtures.mjs";

const profiles = ["TECH_REVIEWER", "QA_REVIEWER", "SECURITY_REVIEWER", "DELIVERY_ASSURANCE_REVIEWER"];
const expected = {
  LOW: ["TECH_REVIEWER"], MEDIUM: ["TECH_REVIEWER"],
  HIGH: ["QA_REVIEWER", "TECH_REVIEWER"],
  CRITICAL: [...profiles].sort(),
};
let cases = 0;
for (const baseline of Object.keys(expected)) {
  const f = fixture(baseline, []);
  const input = {
    work_item_id: f.wi.id, risk: f.classifier.classify(f.input, f.policy),
    maker_role: "IMPLEMENTER", maker_execution_ids: ["maker"],
    artifact: { kind: "implementation", path: "harness/src/risk/index.ts" }, artifact_hash: hash("artifact"),
    security_trigger: false, qa_required: false, required_profiles: [],
    registry: profiles.map(profile => ({ profile, execution_id: "independent-" + profile, required_checks: ["canonical"], required_evidence: ["hash"] })),
  };
  const resolver = new ReviewAssignmentResolver({ current: () => input, artifactHash: () => hash("artifact") }, f.classifier);
  const assignments = resolver.resolve(f.wi.id);
  assert.deepEqual(assignments.map(a => a.review_profile), expected[baseline]);
  for (const assignment of assignments) resolver.verify(assignment, "independent-" + assignment.review_profile);
  cases++;
  input.registry = input.registry.filter(entry => entry.profile !== "TECH_REVIEWER");
  assert.throws(() => resolver.resolve(f.wi.id), /unassigned/);
  cases++;
}
console.log(JSON.stringify({ runtime: process.version, cases, result: "PASS", boundaries: "four canonical risk classes; artifact-bound admission and missing basic reviewer", repository_writes: false }));
