import assert from "node:assert/strict";
import { readFileSync, realpathSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { parseWorkItem } from "../../../../harness/dist/work-items/index.js";
import { ContextCompiler } from "../../../../harness/dist/context/index.js";

const root = realpathSync(process.cwd());
const path = "work-items/HNS-EXEC-003.md";
const parsed = parseWorkItem(path, readFileSync(path, "utf8"), {
  canonical_targets: [
    { path: "docs/harness_v0.1_SDD.md", anchors: ["Sections 5.3, 5.5, 16.1, 21, 35, 38, 40.1, 46 Phases 6-7"] },
    { path: "work-items/HNS-EXEC-001.md" }, { path: "work-items/HNS-EXEC-002.md" },
  ],
});
assert.ok(parsed.ok, parsed.ok ? undefined : JSON.stringify(parsed.error));
const selected = new Set([path, ".ai/CONSTITUTION.md"]);
const compiler = new ContextCompiler({
  resolve: async p => { assert.ok(selected.has(p)); return realpathSync(root + "/" + p); },
  read: async p => { assert.ok([...selected].some(ref => root + "/" + ref === p)); return readFileSync(p); },
});
const budget = { max_bytes: 65536, max_files: 16, max_sections: 24 };
const input = includeGovernance => ({
  execution_id: "real-wi-preflight-005", work_item: parsed.value,
  repository: { root, identity: "ai-system-delivery-framework", branch: execFileSync("git", ["branch", "--show-current"], { encoding: "utf8" }).trim(), commit: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim() },
  sources: [
    { path, context_class: "work_item", tier: "TIER_1_MANDATORY", reason: "actual assigned Work Item" },
    ...(includeGovernance ? [{ path: ".ai/CONSTITUTION.md", context_class: "governance", tier: "TIER_1_MANDATORY", reason: "actual mandatory governance read" }] : []),
  ],
  boundary: { read_scope: parsed.value.read_scope, policy_read_scope: parsed.value.read_scope, forbidden_scope: [] },
  required_gates: parsed.value.required_gates, initial_budget: budget, hard_safety_ceiling: budget,
});
const outcomes = [];
for (const includeGovernance of [true, false]) {
  try { await compiler.compile(input(includeGovernance)); outcomes.push({ case: includeGovernance ? "mandatory-governance" : "assigned-work-item", actual: "ALLOWED" }); }
  catch (error) { outcomes.push({ case: includeGovernance ? "mandatory-governance" : "assigned-work-item", actual: "REJECTED", code: error.code, details: error.details }); }
}
assert.ok(outcomes.every(o => o.actual === "REJECTED" && o.details.failure === "FORBIDDEN_SCOPE"));
const original = input(true);
const control = await compiler.compile({ ...original, work_item: { ...parsed.value, forbidden_scope: [] } });
assert.equal(control.work_item.path, path);
console.log(JSON.stringify({ start: new Date().toISOString(), node: process.version, work_item: parsed.value.id, original_forbidden_scope: parsed.value.forbidden_scope, host_read_forbidden: [], outcomes, isolation_control: "Removing only Work Item write-forbidden patterns permits compilation; fixture isolation only, NOT authorized runtime remediation", canonical_expected: "Work Item Forbidden Scope forbids writes; explicitly allowed mandatory reads remain usable", defect_reproduced: true, required_validation_pass: false, source_writes: false }, null, 2));
