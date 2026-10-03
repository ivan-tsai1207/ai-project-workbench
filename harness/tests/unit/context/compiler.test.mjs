import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { ContextCompiler } from "../../../dist/index.js";
import { canonicalStringify } from "../../../dist/core/hash/index.js";
import { HarnessError } from "../../../dist/errors/index.js";

const sectioned = await readFile(new URL("../../fixtures/context/sectioned.md", import.meta.url), "utf8");
const root = "/virtual/repository";
const workItem = Object.freeze({
  schema_version: "harness.work-item/v2",
  id: "HNS-EXEC-002",
  title: "Context compiler fixture",
  role: "IMPLEMENTER",
  feature: "minimal-execution-engine",
  phase: "IMPLEMENTATION",
  status: "TODO",
  spec_version: "harness-v0.1-review",
  design_version: "N/A",
  risk_class: "HIGH",
  review_profile: null,
  reviewed_artifact: null,
  reviewed_artifact_hash: null,
  maker_execution_id: null,
  objective: "Compile context.",
  requirement_references: [],
  read_scope: [".ai/**", "docs/**", "work-items/HNS-EXEC-002.md", "harness/src/**"],
  write_scope: ["harness/src/context/**"],
  forbidden_scope: ["harness/src/policy/**"],
  scope: ["Compile context."],
  out_of_scope: ["Policy compiler."],
  acceptance_criteria: [],
  required_gates: ["IMPLEMENTATION_GATE"],
  dependencies: [],
  blockers: [],
  notes: [],
  source_path: "work-items/HNS-EXEC-002.md",
  document_hash: `sha256:${"a".repeat(64)}`,
});

function provider(files, canonicalPaths = {}) {
  const reads = [];
  return {
    reads,
    async resolve(path) {
      if (!(path in files)) {
        throw new Error("missing fixture");
      }
      return canonicalPaths[path] ?? `${root}/${path}`;
    },
    async read(canonicalPath) {
      const path = canonicalPath.startsWith(`${root}/`)
        ? canonicalPath.slice(root.length + 1)
        : canonicalPath;
      reads.push(path);
      if (!(path in files)) {
        throw new Error("missing fixture");
      }
      return files[path];
    },
  };
}

const files = Object.freeze({
  "AGENTS.md": "# Router\n\nRoute only.\n",
  ".ai/CONSTITUTION.md": "# Constitution\n\nCanonical rules.\n",
  ".ai/gates/implementation-gate.md": "# Implementation Gate\n\nChecks.\n",
  "docs/harness.md": sectioned,
  "docs/duplicate.md": "# Constitution\n\nCanonical rules.\n",
  "work-items/HNS-EXEC-002.md": "# Work Item\n\nAssigned delta.\n",
  "harness/src/context/extra.ts": "# Extra\n\n## API\n\nOn demand.\n",
  "harness/src/context/large.ts": "x".repeat(512),
});

const baseSources = Object.freeze([
  { path: "AGENTS.md", context_class: "bootstrap", tier: "TIER_0_BOOTSTRAP", reason: "repository router" },
  { path: ".ai/CONSTITUTION.md", context_class: "governance", tier: "TIER_1_MANDATORY", reason: "mandatory governance" },
  { path: ".ai/gates/implementation-gate.md", context_class: "governance", tier: "TIER_1_MANDATORY", reason: "active gate" },
  { path: "docs/harness.md", context_class: "delivery", tier: "TIER_1_MANDATORY", section: "Section 2", reason: "direct SDD section" },
  { path: "docs/duplicate.md", context_class: "source", tier: "TIER_1_MANDATORY", reason: "duplicate fixture" },
  { path: "work-items/HNS-EXEC-002.md", context_class: "work_item", tier: "TIER_1_MANDATORY", reason: "assigned work item" },
  { path: "harness/src/context/extra.ts", context_class: "source", tier: "TIER_2_ON_DEMAND", reason: "possible implementation detail" },
]);

function input(sources = baseSources, overrides = {}) {
  return {
    execution_id: "exec-context-002",
    work_item: workItem,
    repository: { root, identity: "repo-1", branch: "feature/context", commit: "abc123" },
    sources,
    boundary: {
      read_scope: [".ai/**", "docs/**", "work-items/HNS-EXEC-002.md", "harness/src/context/**"],
      policy_read_scope: ["AGENTS.md", ".ai/**", "docs/**", "work-items/**", "harness/src/context/**"],
      forbidden_scope: ["harness/src/policy/**"],
    },
    required_gates: ["IMPLEMENTATION_GATE"],
    initial_budget: { max_bytes: 4096, max_files: 12, max_sections: 8 },
    hard_safety_ceiling: { max_bytes: 8192, max_files: 20, max_sections: 20 },
    spec_versions: { harness: "v0.1-review" },
    ...overrides,
  };
}

function expectHarnessError(code, failure) {
  return (error) => {
    assert.ok(error instanceof HarnessError);
    assert.equal(error.code, code);
    assert.equal(error.details.failure, failure);
    assert.equal(JSON.stringify(error).includes("Canonical rules"), false);
    return true;
  };
}

test("compile is immutable, order-independent, section-bounded, deduplicated, and excludes deferred sources", async () => {
  const firstProvider = provider(files);
  const secondProvider = provider(files);
  const first = await new ContextCompiler(firstProvider).compile(input(baseSources));
  const second = await new ContextCompiler(secondProvider).compile(input([...baseSources].reverse()));

  assert.deepEqual(second, first);
  assert.equal(canonicalStringify(second), canonicalStringify(first));
  assert.equal(second.context_hash, first.context_hash);
  assert.equal(Object.isFrozen(first), true);
  assert.equal(Object.isFrozen(first.delivery_context), true);
  assert.equal(first.delivery_context[0].section, "Section 2");
  assert.equal(first.context_usage.sections, 1);
  assert.equal(first.excluded_context.some(({ path, reason }) => path === "docs/duplicate.md" && reason === "DUPLICATE_CANONICAL_CONTENT"), true);
  assert.deepEqual(first.deferred_context, [{ path: "harness/src/context/extra.ts", reason: "TIER_2_REQUIRES_ON_DEMAND_REQUEST" }]);
  assert.equal(firstProvider.reads.includes("harness/src/context/extra.ts"), false);
  assert.equal(firstProvider.reads.includes("docs/unrelated.md"), false);
  assert.throws(() => first.source_context.push({}), TypeError);
});

test("AST section extraction records deterministic full-document fallback only when explicitly allowed", async () => {
  const sources = baseSources.map((source) => source.path === "docs/harness.md"
    ? { ...source, section: "Section 99", allow_full_document_fallback: true }
    : source);
  const manifest = await new ContextCompiler(provider(files)).compile(input(sources));
  assert.equal(manifest.delivery_context[0].full_document_fallback_reason, "SECTION_UNRESOLVED");

  const deniedFallback = sources.map((source) => source.path === "docs/harness.md"
    ? { ...source, allow_full_document_fallback: false }
    : source);
  await assert.rejects(
    new ContextCompiler(provider(files)).compile(input(deniedFallback)),
    expectHarnessError("HNS-CTX-002", "SECTION_OR_ANCHOR_UNRESOLVED"),
  );
});

test("path, forbidden, policy, sensitivity, canonical-root, and unavailable-source boundaries fail closed", async () => {
  const cases = [
    [{ ...baseSources[0], path: "../AGENTS.md" }, "HNS-CTX-001", "INVALID_REPOSITORY_PATH"],
    [{ ...baseSources[0], path: "credentials.json" }, "HNS-CTX-002", "SENSITIVE_CONTEXT_DENIED"],
    [{ ...baseSources[0], path: "harness/src/policy/compiler.ts" }, "HNS-CTX-002", "FORBIDDEN_SCOPE"],
    [{ ...baseSources[1], path: "outside/not-readable.md" }, "HNS-CTX-002", "POLICY_READ_SCOPE_DENIED"],
    [{ ...baseSources[1], path: "work-items/OTHER.md" }, "HNS-CTX-002", "WORK_ITEM_READ_SCOPE_DENIED"],
    [{ ...baseSources[1], path: ".ai/missing.md" }, "HNS-CTX-002", "SOURCE_RESOLUTION_FAILED"],
  ];
  for (const [source, code, failure] of cases) {
    await assert.rejects(
      new ContextCompiler(provider(files)).compile(input([source, baseSources[5]])),
      expectHarnessError(code, failure),
    );
  }

  const escapedProvider = provider(files, { ".ai/CONSTITUTION.md": "/outside/CONSTITUTION.md" });
  await assert.rejects(
    new ContextCompiler(escapedProvider).compile(input([baseSources[1], baseSources[5]])),
    expectHarnessError("HNS-CTX-001", "CANONICAL_PATH_OUTSIDE_REPOSITORY"),
  );
});

test("expected hash drift, conflicting duplicate hashes, required gates, and budgets fail closed", async () => {
  const stale = { ...baseSources[1], expected_content_sha256: `sha256:${"0".repeat(64)}` };
  await assert.rejects(
    new ContextCompiler(provider(files)).compile(input([stale, baseSources[5]])),
    expectHarnessError("HNS-CTX-001", "CONCURRENT_HASH_DRIFT"),
  );

  const duplicateDrift = [
    { ...baseSources[1], expected_content_sha256: `sha256:${"1".repeat(64)}` },
    { ...baseSources[1], expected_content_sha256: `sha256:${"2".repeat(64)}` },
    baseSources[5],
  ];
  await assert.rejects(
    new ContextCompiler(provider(files)).compile(input(duplicateDrift)),
    expectHarnessError("HNS-CTX-001", "CONCURRENT_HASH_DRIFT"),
  );

  await assert.rejects(
    new ContextCompiler(provider(files)).compile(input(baseSources, { required_gates: [] })),
    expectHarnessError("HNS-CTX-002", "ACTIVE_GATE_UNRESOLVED"),
  );
  await assert.rejects(
    new ContextCompiler(provider(files)).compile(input(baseSources, {
      initial_budget: { max_bytes: 8, max_files: 12, max_sections: 8 },
    })),
    expectHarnessError("HNS-CTX-001", "INITIAL_CONTEXT_BUDGET_EXCEEDED"),
  );
  await assert.rejects(
    new ContextCompiler(provider(files)).compile(input(baseSources, {
      initial_budget: { max_bytes: 4096, max_files: 2, max_sections: 8 },
    })),
    expectHarnessError("HNS-CTX-001", "INITIAL_CONTEXT_BUDGET_EXCEEDED"),
  );
  await assert.rejects(
    new ContextCompiler(provider(files)).compile(input(baseSources, {
      initial_budget: { max_bytes: 4096, max_files: 12, max_sections: 0 },
    })),
    expectHarnessError("HNS-CTX-001", "INITIAL_CONTEXT_BUDGET_EXCEEDED"),
  );
  await assert.rejects(
    new ContextCompiler(provider(files)).compile(input(baseSources, {
      hard_safety_ceiling: { max_bytes: 20 * 1024 * 1024 + 1, max_files: 200, max_sections: 1000 },
    })),
    expectHarnessError("HNS-CTX-001", "INVALID_CONTEXT_BUDGET"),
  );
  await assert.rejects(
    new ContextCompiler(provider(files)).compile(input([
      { ...baseSources[0], context_class: "governance" },
      baseSources[5],
    ])),
    expectHarnessError("HNS-CTX-001", "INVALID_TIER_CLASSIFICATION"),
  );

  const oversizedFiles = {
    ...files,
    "docs/oversized.md": "x".repeat((1024 * 1024) + 1),
  };
  await assert.rejects(
    new ContextCompiler(provider(oversizedFiles)).compile(input([
      { ...baseSources[1], path: "docs/oversized.md" },
      baseSources[5],
    ], {
      initial_budget: { max_bytes: 2 * 1024 * 1024, max_files: 12, max_sections: 8 },
      hard_safety_ceiling: { max_bytes: 2 * 1024 * 1024, max_files: 20, max_sections: 20 },
    })),
    expectHarnessError("HNS-CTX-001", "SINGLE_FILE_HARD_CEILING_EXCEEDED"),
  );
});

test("optional unrelated candidates are excluded before resolve or read", async () => {
  const sourceProvider = provider(files);
  const unrelated = {
    path: "other/unrelated.md",
    context_class: "source",
    tier: "TIER_1_MANDATORY",
    reason: "unrelated candidate",
    required: false,
  };
  const manifest = await new ContextCompiler(sourceProvider).compile(input([...baseSources, unrelated]));
  assert.equal(manifest.excluded_context.some(({ path, reason }) =>
    path === "other/unrelated.md" && reason === "POLICY_READ_SCOPE_DENIED"), true);
  assert.equal(sourceProvider.reads.includes("other/unrelated.md"), false);
});

test("the explicit-source ceiling bounds large repositories without scanning", async () => {
  const excessive = Array.from({ length: 20_001 }, () => baseSources[0]);
  const sourceProvider = provider(files);
  await assert.rejects(
    new ContextCompiler(sourceProvider).compile(input(excessive)),
    expectHarnessError("HNS-CTX-001", "EXPLICIT_SOURCE_INDEX_CEILING_EXCEEDED"),
  );
  assert.equal(sourceProvider.reads.length, 0);
});

test("on-demand load, deny, dedup, and defer decisions include immutable audit hashes and budget deltas", async () => {
  const sourceProvider = provider(files);
  const compiler = new ContextCompiler(sourceProvider);
  const manifest = await compiler.compile(input(baseSources));
  const policy = {
    read_scope: ["harness/src/context/**"],
    policy_read_scope: ["harness/src/context/**"],
    forbidden_scope: ["harness/src/context/private/**"],
    context_budget: { max_bytes: 8192, max_files: 20, max_sections: 20 },
  };
  await assert.rejects(
    compiler.requestContext({ ...manifest, context_hash: `sha256:${"f".repeat(64)}` }, {
      request_id: "request-tampered",
      execution_id: manifest.execution_id,
      requested_path: "harness/src/context/extra.ts",
      reason: "must reject stale manifest",
    }, policy, root),
    expectHarnessError("HNS-CTX-001", "CONTEXT_HASH_MISMATCH"),
  );
  const loaded = await compiler.requestContext(manifest, {
    request_id: "request-1",
    execution_id: manifest.execution_id,
    requested_path: "harness/src/context/extra.ts",
    section: "API",
    reason: "implementation requires exact API",
  }, policy, root);

  assert.equal(loaded.status, "LOADED");
  assert.equal(loaded.reason, "AUTHORIZED_AND_LOADED");
  assert.notEqual(loaded.audit.after_context_hash, loaded.audit.before_context_hash);
  assert.deepEqual(loaded.audit.budget_delta, { bytes: loaded.audit.budget_after.bytes - loaded.audit.budget_before.bytes, files: 1, sections: 1 });
  assert.equal(loaded.resulting_manifest.context_hash, loaded.resulting_context_hash);
  assert.equal(manifest.source_context.length, 0);
  assert.equal(Object.isFrozen(loaded), true);

  const readsBeforeDeny = sourceProvider.reads.length;
  const denied = await compiler.requestContext(manifest, {
    request_id: "request-2",
    execution_id: manifest.execution_id,
    requested_path: "harness/src/context/private/internal.ts",
    reason: "not permitted",
  }, policy, root);
  assert.equal(denied.status, "DENIED");
  assert.equal(denied.reason, "FORBIDDEN_SCOPE");
  assert.equal(denied.audit.after_context_hash, manifest.context_hash);
  assert.equal(sourceProvider.reads.length, readsBeforeDeny);

  const deferred = await compiler.requestContext(manifest, {
    request_id: "request-3",
    execution_id: manifest.execution_id,
    requested_path: "harness/src/context/large.ts",
    reason: "bounded optional detail",
  }, { ...policy, context_budget: {
    max_bytes: manifest.context_usage.bytes + 4,
    max_files: manifest.context_usage.files + 1,
    max_sections: manifest.context_usage.sections + 1,
  } }, root);
  assert.equal(deferred.status, "DEFERRED");
  assert.equal(deferred.reason, "CONTEXT_BUDGET_EXCEEDED");
  assert.deepEqual(deferred.audit.budget_delta, { bytes: 0, files: 0, sections: 0 });

  const alreadyPresent = await compiler.requestContext(loaded.resulting_manifest, {
    request_id: "request-4",
    execution_id: manifest.execution_id,
    requested_path: "harness/src/context/extra.ts",
    section: "API",
    reason: "repeat",
  }, policy, root);
  assert.equal(alreadyPresent.status, "LOADED");
  assert.equal(alreadyPresent.reason, "ALREADY_PRESENT");
  assert.equal(alreadyPresent.resulting_context_hash, loaded.resulting_context_hash);
});

test("production context code has no scan, write, process, network, credential, policy, or adapter capability", async () => {
  const compilerSource = await readFile(new URL("../../../src/context/compiler.ts", import.meta.url), "utf8");
  const pathSource = await readFile(new URL("../../../src/context/path.ts", import.meta.url), "utf8");
  const source = `${compilerSource}\n${pathSource}`;
  assert.doesNotMatch(source, /(?:node:fs|node:child_process|node:http|node:https|node:net)/);
  assert.doesNotMatch(source, /(?:readdir|glob|writeFile|appendFile|spawn|exec|fetch)\s*\(/);
  assert.doesNotMatch(source, /(?:from|import\s*\()["'](?:\.\.\/)*(?:policy|adapters|enforcement|audit)\//);
  assert.doesNotMatch(source, /\bprocess\s*\./);
});
