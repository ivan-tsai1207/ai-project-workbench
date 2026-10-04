import assert from "node:assert/strict";
import test from "node:test";
import { ContextCompiler, ExecutionProfileBuilder, ReviewAssignmentResolver } from "../../../dist/index.js";
import { fixture, hash, rawHash } from "../risk/fixtures.mjs";

function setup(configure = () => {}) {
  const f = fixture();
  let repository = { identity: "repo-1", root: "/virtual/repo", branch: "feature/test", commit: "a".repeat(40) };
  const payload = { schema_version: "harness.policy/v1", sources: [{ path: ".ai/policy.md", sha256: rawHash(f.files[".ai/policy.md"]) }],
    filesystem: { read: [".ai/**", "work-items/**"], write: [], deny_write: [] }, tools: { allow: [], deny: [] },
    commands: { safe_read: [], development_write: [], restricted: [] }, environment: { allowed: [], denied: [] }, approval_required: { operations: [] } };
  const options = { f, repository, payload, execution_id: "maker-1", adapter_requirements: [],
    audit: { sink: "host", redaction_policy: "canonical", required_fields: ["execution_id"] }, gates: f.wi.required_gates };
  configure(options);
  for (const group of [payload.filesystem, payload.tools, payload.commands, payload.environment, payload.approval_required]) {
    for (const values of Object.values(group)) values.sort();
  }
  const policy = { ...payload, policy_hash: hash(payload) };
  const binding = { status: "ACTIVE", work_item: f.wi, policy, risk: f.classifier.classify(f.input, f.policy) };
  const host = { repository: () => repository, binding: () => binding, risk: f.authority,
    source: path => ({ canonical_path: `${repository.root}/${path}`, bytes: f.files[path] }) };
  if (options.review) {
    const admission = { work_item_id: f.wi.id, risk: binding.risk, maker_role: "IMPLEMENTER", maker_execution_ids: ["original-maker"],
      artifact: { kind: "implementation", path: "harness/src/risk/index.ts" }, artifact_hash: hash("artifact"),
      security_trigger: true, qa_required: true, required_profiles: [], registry: ["TECH_REVIEWER", "QA_REVIEWER", "SECURITY_REVIEWER"].map(profile => ({
        profile, execution_id: profile === options.review ? options.execution_id : `other-${profile}`, required_checks: ["canonical"], required_evidence: ["hash"] })) };
    options.configureReview?.(admission);
    let artifactHash = admission.artifact_hash;
    host.review = { current: () => admission, artifactHash: () => artifactHash };
    binding.review_assignment = new ReviewAssignmentResolver(host.review, f.classifier).resolve(f.wi.id).find(a => a.review_profile === options.review);
    Object.assign(f.wi, { role: "REVIEWER", review_profile: options.review, reviewed_artifact: admission.artifact,
      reviewed_artifact_hash: admission.artifact_hash, maker_execution_id: admission.maker_execution_ids[0] });
    options.reviewAdmission = admission;
    options.changeArtifact = () => { artifactHash = hash("changed artifact"); };
  }
  const compile = { execution_id: options.execution_id, work_item: f.wi, repository,
    sources: Object.keys(f.files).map(path => ({ path, context_class: path.startsWith("work-items/") ? "work_item" : "governance", tier: "TIER_1_MANDATORY", reason: "canonical fixture" })),
    boundary: { read_scope: f.wi.read_scope, policy_read_scope: f.wi.read_scope, forbidden_scope: [] }, required_gates: f.wi.required_gates,
    initial_budget: { max_bytes: 4096, max_files: 10, max_sections: 10 }, hard_safety_ceiling: { max_bytes: 8192, max_files: 20, max_sections: 20 } };
  const builder = new ExecutionProfileBuilder(host);
  const build = context => ({ execution: { execution_id: options.execution_id, task_id: f.wi.id, role: f.wi.role, risk_class: f.wi.risk_class, feature: f.wi.feature, phase: f.wi.phase, adapter: options.adapter ?? "fixture",
    ...(f.wi.review_profile === null ? {} : { review_profile: f.wi.review_profile }) },
    repository: { identity: repository.identity, root: repository.root, branch: repository.branch, commit_before: repository.commit },
    work_item: { path: f.wi.source_path, hash: f.wi.document_hash }, context, policy, gates: options.gates,
    ...(binding.review_assignment === undefined ? {} : { review_assignment: binding.review_assignment }),
    adapter_requirements: options.adapter_requirements, audit: options.audit });
  return { ...f, binding, host, compile, builder, build, options, move: () => { repository = { ...repository, commit: "b".repeat(40) }; } };
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

const reviewer = options => { options.review = "TECH_REVIEWER"; options.execution_id = "review-TECH_REVIEWER"; };
test("C5 final compile source repository/binding movement rejects without registering a receipt", async () => {
  for (const movement of ["repository", "binding"]) {
    const f = setup();
    const repository = f.host.repository();
    const source = f.host.source;
    let repositoryReads = 0;
    let moved = false;
    f.host.repository = () => { repositoryReads++; return repository; };
    f.host.source = path => {
      const result = source(path);
      if (!moved && repositoryReads === 2) {
        moved = true;
        if (movement === "repository") repository.commit = "b".repeat(40);
        else f.binding.status = "CLOSED";
      }
      return result;
    };
    await assert.rejects(f.builder.compile(f.compile), /Host changed before registration/);
    assert.ok(moved);
    repository.commit = "a".repeat(40); f.binding.status = "ACTIVE";
    f.host.source = source;
    // A same-key compile must succeed: the rejected transaction left no receipt.
    const context = await f.builder.compile(f.compile);
    assert.equal(f.builder.build(f.build(context)).repository.commit_before, repository.commit);
  }
});

for (const target of ["work-item", "policy", "binding", "authority"]) {
  test(`C5 final build ${target} movement rejects without admitting a profile`, async () => {
    const f = setup(); const context = await f.builder.compile(f.compile);
    const input = f.build(context);
    const repository = f.host.repository();
    const source = f.host.source;
    const current = f.host.risk.current;
    let repositoryReads = 0;
    let moved = false;
    f.host.repository = () => { repositoryReads++; return repository; };
    const move = () => {
      moved = true;
      if (target === "binding") f.binding.status = "SUPERSEDED";
      else repository.commit = "b".repeat(40);
    };
    f.host.source = path => {
      const result = source(path);
      const selected = target === "policy" ? ".ai/policy.md" : f.wi.source_path;
      if (!moved && target !== "authority" && repositoryReads > 0 && path === selected) move();
      return result;
    };
    if (target === "authority") f.host.risk.current = (...args) => {
      const result = current(...args); if (!moved && repositoryReads > 0) move(); return result;
    };
    assert.throws(() => f.builder.build(input), /Host changed before registration\/admission/);
    assert.ok(moved);
    repository.commit = "a".repeat(40); f.binding.status = "ACTIVE";
    f.host.source = source; f.host.risk.current = current;
    // A different valid profile proves the failed admission did not reserve its hash.
    const recovered = { ...input, audit: { ...input.audit, sink: "recovered" } };
    assert.equal(f.builder.build(recovered).audit.sink, "recovered");
    assert.deepEqual(f.builder.build(recovered), f.builder.build(recovered));
  });
}

test("Reviewer admission independently rechecks current artifact, registry, profile and execution", async () => {
  const positive = setup(reviewer); const context = await positive.builder.compile(positive.compile);
  const profile = positive.builder.build(positive.build(context));
  assert.equal(profile.review.reviewed_artifact_hash, positive.binding.review_assignment.reviewed_artifact_hash);
  assert.ok(Object.isFrozen(profile.review.maker_execution_ids));
  const negatives = [
    f => f.options.changeArtifact(),
    f => { delete f.host.review; },
    f => { f.options.reviewAdmission.registry[0].execution_id = "another-reviewer"; },
    f => { f.options.reviewAdmission.registry[0].execution_id = "original-maker"; },
    f => { f.options.reviewAdmission.registry.pop(); },
    f => { f.options.reviewAdmission.registry[0].profile = "QA_REVIEWER"; },
    f => { f.options.reviewAdmission.registry[0].required_checks = ["new-check"]; },
  ];
  for (const mutate of negatives) {
    const f = setup(reviewer); const current = await f.builder.compile(f.compile); mutate(f);
    assert.throws(() => f.builder.build({ ...f.build(current), artifact_hash: f.binding.review_assignment.reviewed_artifact_hash, verifier: () => true }));
  }
  const f = setup(reviewer);
  const original = f.binding.review_assignment;
  const { assignment_hash, ...payload } = original;
  const forged = { ...payload, required_checks: ["caller-check"] };
  f.binding.review_assignment = { ...forged, assignment_hash: hash(forged) };
  const forgedContext = await f.builder.compile(f.compile);
  assert.throws(() => f.builder.build(f.build(forgedContext)), /Unadmitted review assignment/);
});

const valueAt = (value, path) => path.split(".").reduce((current, key) => current?.[key], value);
const fieldChanges = [
  ["execution.execution_id", o => { o.execution_id = "maker-new"; }],
  ["execution.task_id", o => { o.f.wi.id = "HNS-EXEC-OTHER"; o.f.input.work_item_id = o.f.wi.id; }],
  ["execution.role", o => { o.f.wi.role = "PRODUCT_ARCHITECT"; }],
  ["execution.risk_class", o => { o.f.wi.risk_class = "CRITICAL"; o.f.admission.baseline = "CRITICAL"; }],
  ["execution.feature", o => { o.f.wi.feature = "another-feature"; }],
  ["execution.phase", o => { o.f.wi.phase = "SPEC"; }],
  ["execution.adapter", o => { o.adapter = "another-adapter"; }],
  ...["identity", "root", "branch", "commit"].map(field => [`repository.${field === "commit" ? "commit_before" : field}`, o => {
    o.repository[field] = field === "commit" ? "b".repeat(40) : field === "root" ? "/virtual/other" : "other";
  }]),
  ["work_item.path", o => { const previous = o.f.wi.source_path; o.f.wi.source_path = "work-items/HNS-EXEC-OTHER.md";
    o.f.files[o.f.wi.source_path] = o.f.files[previous]; delete o.f.files[previous]; }],
  ["work_item.hash", o => { o.f.files[o.f.wi.source_path] += "changed\n"; o.f.wi.document_hash = rawHash(o.f.files[o.f.wi.source_path]); o.f.input.source_hashes = [o.f.wi.document_hash]; }],
  ["context.manifest_ref", o => { o.execution_id = "maker-new"; }],
  ["context.context_hash", o => { o.f.files[".ai/extra.md"] = "# Additional context\n"; }],
  ...[["filesystem", "read"], ["filesystem", "write"], ["filesystem", "deny_write"], ["tools", "allow"], ["tools", "deny"],
    ["commands", "safe_read"], ["commands", "development_write"], ["commands", "restricted"], ["environment", "allowed"], ["environment", "denied"]]
    .map(([group, field]) => [`${group}.${field}`, o => { o.payload[group][field].push(group === "filesystem" ? "harness/**" : "fixture-value"); }]),
  ["gates.required", o => { o.gates = ["IMPLEMENTATION_GATE", "SPEC_GATE"]; }],
  ["adapter_requirements", o => { o.adapter_requirements = [{ capability: "event_stream", minimum: "soft" }]; }],
  ["adapter_requirements.0.capability", o => { o.adapter_requirements = [{ capability: "termination", minimum: "soft" }]; }, "capability"],
  ["adapter_requirements.0.minimum", o => { o.adapter_requirements = [{ capability: "event_stream", minimum: "hard" }]; }, "capability"],
  ["audit.sink", o => { o.audit.sink = "another-sink"; }],
  ["audit.redaction_policy", o => { o.audit.redaction_policy = "another-redaction"; }],
  ["audit.required_fields", o => { o.audit.required_fields.push("task_id"); }],
  ["execution.review_profile", o => { o.review = "QA_REVIEWER"; }, "review"],
  ["review", o => {}, "review-presence"],
  ["review.assignment_ref", o => { o.execution_id = "new-reviewer"; }, "review"],
  ["review.assignment_hash", o => { o.configureReview = a => { a.registry[0].required_checks.push("another-check"); }; }, "review"],
  ["review.maker_execution_ids", o => { o.configureReview = a => { a.maker_execution_ids.push("another-maker"); }; }, "review"],
  ["review.reviewed_artifact_hash", o => { o.configureReview = a => { a.artifact_hash = hash("new-artifact"); }; }, "review"],
];
for (const [field, mutate, baseline] of fieldChanges) {
  test(`positive canonical Profile hash changes: ${field}`, async () => {
    const configureBase = o => {
      if (baseline === "review" || baseline === "review-presence") reviewer(o);
      if (baseline === "capability") o.adapter_requirements = [{ capability: "event_stream", minimum: "soft" }];
    };
    const a = setup(configureBase);
    const b = setup(o => { configureBase(o); if (baseline === "review-presence") { delete o.review; o.execution_id = "maker-1"; } mutate(o); });
    const first = a.builder.build(a.build(await a.builder.compile(a.compile)));
    const changed = b.builder.build(b.build(await b.builder.compile(b.compile)));
    assert.notDeepEqual(valueAt(first, field), valueAt(changed, field));
    assert.notEqual(first.profile_hash, changed.profile_hash);
    for (const profile of [first, changed]) {
      const { profile_hash, ...payload } = profile; assert.equal(profile_hash, hash(payload));
      assert.ok(Object.isFrozen(profile));
    }
  });
}

test("changed context requires actual fresh compile, supersedes old receipt and a fresh execution after admission", async () => {
  const f = setup(); const oldContext = await f.builder.compile(f.compile);
  const oldProfile = f.builder.build(f.build(oldContext));
  f.files[".ai/extra.md"] = "# New context\n";
  const expanded = { ...f.compile, sources: [...f.compile.sources, { path: ".ai/extra.md", context_class: "governance", tier: "TIER_1_MANDATORY", reason: "changed context" }] };
  const pure = await new ContextCompiler({ resolve: async path => f.host.source(path).canonical_path,
    read: async path => f.files[path.slice("/virtual/repo/".length)] }).compile(expanded);
  assert.notEqual(pure.context_hash, oldContext.context_hash);
  assert.throws(() => f.builder.build(f.build(pure)), /compile receipt/);
  const changed = await f.builder.compile(expanded);
  assert.throws(() => f.builder.build(f.build(oldContext)), /superseded/);
  assert.throws(() => f.builder.build(f.build(changed)), /new execution/);
  const fresh = await f.builder.compile({ ...expanded, execution_id: "maker-fresh" });
  const input = f.build(fresh); input.execution.execution_id = "maker-fresh";
  const profile = f.builder.build(input);
  assert.notEqual(profile.context.context_hash, oldProfile.context.context_hash);
  assert.notEqual(profile.profile_hash, oldProfile.profile_hash);
  assert.deepEqual(profile, f.builder.build(input));
});

test("fresh actual compile admits changed context before initial admission and invalidates the prior receipt", async () => {
  const f = setup(); const previous = await f.builder.compile(f.compile);
  f.files[".ai/extra.md"] = "# Additional context\n";
  const context = await f.builder.compile({ ...f.compile, sources: [...f.compile.sources,
    { path: ".ai/extra.md", context_class: "governance", tier: "TIER_1_MANDATORY", reason: "fresh actual compile" }] });
  assert.notEqual(context.context_hash, previous.context_hash);
  assert.throws(() => f.builder.build(f.build(previous)), /superseded/);
  assert.equal(f.builder.build(f.build(context)).context.context_hash, context.context_hash);
});
