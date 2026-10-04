import assert from "node:assert/strict";
import test from "node:test";
import { ContextCompiler, ExecutionProfileBuilder } from "../../../dist/index.js";
import { fixture, hash, rawHash } from "../risk/fixtures.mjs";

function setup() {
  const f = fixture();
  let repository = { identity: "repo-1", root: "/virtual/repo", branch: "feature/test", commit: "a".repeat(40) };
  const payload = { schema_version: "harness.policy/v1", sources: [{ path: ".ai/policy.md", sha256: rawHash(f.files[".ai/policy.md"]) }],
    filesystem: { read: [".ai/**", "work-items/**"], write: [], deny_write: [] }, tools: { allow: [], deny: [] },
    commands: { safe_read: [], development_write: [], restricted: [] }, environment: { allowed: [], denied: [] }, approval_required: { operations: [] } };
  const policy = { ...payload, policy_hash: hash(payload) };
  const binding = { status: "ACTIVE", work_item: f.wi, policy, risk: f.classifier.classify(f.input, f.policy) };
  const host = { repository: () => repository, binding: () => binding, risk: f.authority,
    source: path => ({ canonical_path: `${repository.root}/${path}`, bytes: f.files[path] }) };
  const compile = { execution_id: "maker-1", work_item: f.wi, repository,
    sources: Object.keys(f.files).map(path => ({ path, context_class: path.startsWith("work-items/") ? "work_item" : "governance", tier: "TIER_1_MANDATORY", reason: "canonical fixture" })),
    boundary: { read_scope: f.wi.read_scope, policy_read_scope: f.wi.read_scope, forbidden_scope: [] }, required_gates: f.wi.required_gates,
    initial_budget: { max_bytes: 4096, max_files: 10, max_sections: 10 }, hard_safety_ceiling: { max_bytes: 8192, max_files: 20, max_sections: 20 } };
  const builder = new ExecutionProfileBuilder(host);
  const build = context => ({ execution: { execution_id: "maker-1", task_id: f.wi.id, role: f.wi.role, risk_class: f.wi.risk_class, feature: f.wi.feature, phase: f.wi.phase, adapter: "fixture" },
    repository: { identity: repository.identity, root: repository.root, branch: repository.branch, commit_before: repository.commit },
    work_item: { path: f.wi.source_path, hash: f.wi.document_hash }, context, policy, gates: f.wi.required_gates, adapter_requirements: [], audit: { sink: "host", redaction_policy: "canonical", required_fields: ["execution_id"] } });
  return { ...f, binding, host, compile, builder, build, move: () => { repository = { ...repository, commit: "b".repeat(40) }; } };
}
test("C1 actual compile admits deterministic deep-frozen profile and rechecks canonical hash", async () => {
  const f = setup(); const context = await f.builder.compile(f.compile); const a = f.builder.build(f.build(context));
  assert.deepEqual(a, f.builder.build(f.build(context))); assert.ok(Object.isFrozen(a.audit.required_fields));
  const { profile_hash, ...payload } = a; assert.equal(profile_hash, hash(payload));
  assert.throws(() => f.builder.build({ ...f.build(context), audit: { ...a.audit, sink: "changed" } }));
});
test("C2 repository/execution/task/role/risk/feature/phase cross-binding and missing gates reject", async () => {
  const f = setup(); const context = await f.builder.compile(f.compile); const input = f.build(context);
  for (const [field, value] of [["commit_before", "b".repeat(40)], ["root", "/other"], ["identity", "other"], ["branch", "other"]]) assert.throws(() => f.builder.build({ ...input, repository: { ...input.repository, [field]: value } }));
  for (const [field, value] of [["execution_id", "other"], ["task_id", "other"], ["role", "PRODUCT_ARCHITECT"], ["risk_class", "LOW"], ["feature", "other"], ["phase", "SPEC"]]) assert.throws(() => f.builder.build({ ...input, execution: { ...input.execution, [field]: value } }));
  assert.throws(() => f.builder.build({ ...input, gates: [] }));
  assert.throws(() => f.builder.build({ ...input, work_item: { ...input.work_item, hash: hash("stale") } }));
});
test("C3/C4 pure library context, copied/rehashed contexts and caller receipts cannot authorize", async () => {
  const f = setup(); const pure = await new ContextCompiler({ resolve: async path => f.host.source(path).canonical_path,
    read: async path => f.files[path.slice('/virtual/repo/'.length)] }).compile(f.compile);
  assert.throws(() => f.builder.build({ ...f.build(pure), receipt: { receipt_hash: hash("self") }, verifier: () => true }));
  const context = await f.builder.compile(f.compile);
  assert.throws(() => f.builder.build(f.build({ ...context })));
  const { context_hash, ...payload } = context; const changed = { ...payload, feature: "tampered" };
  assert.throws(() => f.builder.build(f.build({ ...changed, context_hash: hash(changed) })));
});
test("C5 compile-origin collision, compile-time and admission-time repository drift reject", async () => {
  const f = setup(); const context = await f.builder.compile(f.compile);
  await assert.rejects(f.builder.compile(f.compile), /collision/); f.move(); assert.throws(() => f.builder.build(f.build(context)));
  const g = setup(); const source = g.host.source; g.host.source = path => { const result = source(path); g.move(); return result; };
  await assert.rejects(g.builder.compile(g.compile));
});
test("C6 closed/superseded/lost records, changed context and raw-source drift reject", async () => {
  for (const status of ["CLOSED", "SUPERSEDED"]) {
    const f = setup(); const context = await f.builder.compile(f.compile); f.binding.status = status;
    assert.throws(() => f.builder.build(f.build(context)));
  }
  const f = setup(); const context = await f.builder.compile(f.compile);
  assert.throws(() => new ExecutionProfileBuilder(f.host).build(f.build(context)));
  f.files[".ai/policy.md"] += "drift"; assert.throws(() => f.builder.build(f.build(context)));
});
test("unadmitted/self-hashed policy changes and Maker review self-selection reject", async () => {
  const f = setup(); const context = await f.builder.compile(f.compile); const input = f.build(context);
  const { policy_hash, ...payload } = input.policy; const changed = { ...payload, tools: { allow: ["other"], deny: [] } };
  assert.throws(() => f.builder.build({ ...input, policy: { ...changed, policy_hash: hash(changed) } }));
  assert.throws(() => f.builder.build({ ...input, review_assignment: {} }));
});
