import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { createSchemaRegistry } from "../../../dist/schemas/index.js";
import { parseWorkItem as parseWorkItemWithContext } from "../../../dist/work-items/index.js";

const fixtureUrl = new URL("../../fixtures/work-items/HNS-FIXTURE-001.md", import.meta.url);
const assignedWorkItemUrl = new URL("../../../../work-items/HNS-EXEC-001.md", import.meta.url);
const packageUrl = new URL("../../../package.json", import.meta.url);
const packageLockUrl = new URL("../../../package-lock.json", import.meta.url);
const reviewedArtifactHash = `sha256:${"a".repeat(64)}`;

const fixtureContext = Object.freeze({
  canonical_targets: Object.freeze([
    Object.freeze({ path: "docs/harness_v0.1_SDD.md", anchors: Object.freeze(["Section 17"]) }),
    Object.freeze({ path: "harness/src/index.ts", reviewed_artifact_hash: reviewedArtifactHash }),
  ]),
});
const assignedContext = Object.freeze({
  canonical_targets: Object.freeze([
    Object.freeze({
      path: "docs/harness_v0.1_SDD.md",
      anchors: Object.freeze(["Sections 5.2-5.3, 17, 35, 40.1, 46 Phase 2"]),
    }),
    Object.freeze({ path: "work-items/HNS-CORE-005.md", anchors: Object.freeze(["lifecycle closure"]) }),
  ]),
});

function parseWorkItem(sourcePath, markdown, context) {
  const canonicalContext = context
    ?? (sourcePath === "work-items/HNS-EXEC-001.md" ? assignedContext : fixtureContext);
  return parseWorkItemWithContext(sourcePath, markdown, canonicalContext);
}

async function fixture() {
  return readFile(fixtureUrl, "utf8");
}

function expectFailure(result, predicate) {
  assert.equal(result.ok, false);
  assert.ok(result.error.length > 0);
  assert.equal(result.error.every((detail) => detail.error_code === "HNS-WI-001"), true);
  assert.ok(result.error.some(predicate), JSON.stringify(result.error, null, 2));
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.error), true);
}

function replaceOnce(markdown, before, after) {
  assert.ok(markdown.includes(before), `Fixture does not contain ${before}`);
  return markdown.replace(before, after);
}

function reviewerWorkItem(markdown, artifact = "harness/src/index.ts", hash = reviewedArtifactHash) {
  let reviewer = replaceOnce(markdown, "| Role | `IMPLEMENTER` |", "| Role | `REVIEWER` |");
  reviewer = replaceOnce(reviewer, "| Phase | `IMPLEMENTATION` |", "| Phase | `REVIEW` |");
  reviewer = replaceOnce(reviewer, "| Review Profile | `N/A` |", "| Review Profile | `TECH_REVIEWER` |");
  reviewer = replaceOnce(reviewer, "| Reviewed Artifact | `N/A` |", `| Reviewed Artifact | \`${artifact}\` |`);
  reviewer = replaceOnce(reviewer, "| Reviewed Artifact Hash | `N/A` |", `| Reviewed Artifact Hash | \`${hash}\` |`);
  return replaceOnce(reviewer, "| Maker Execution ID | `N/A` |", "| Maker Execution ID | `maker-001` |");
}

test("canonical assigned v2 Work Item parses into an immutable normalized value", async () => {
  const markdown = await readFile(assignedWorkItemUrl, "utf8");
  const result = parseWorkItem("work-items/HNS-EXEC-001.md", markdown);

  assert.equal(result.ok, true, result.ok ? undefined : JSON.stringify(result.error));
  const value = result.value;
  assert.equal(value.id, "HNS-EXEC-001");
  assert.equal(value.schema_version, "harness.work-item/v2");
  assert.equal(value.document_hash, "sha256:6dd149a33b1dfa807890fbcc34f258e473ae42d7933555e90187cb59f584730c");
  assert.deepEqual(value.required_gates, ["IMPLEMENTATION_GATE"]);
  assert.deepEqual(value.dependencies.map(({ path }) => path), [
    "work-items/HNS-CORE-005.md",
    "mdast-util-from-markdown@2.0.3",
  ]);
  assert.equal(Object.isFrozen(value), true);
  assert.equal(Object.isFrozen(value.acceptance_criteria), true);
  assert.equal(Object.isFrozen(value.acceptance_criteria[0]), true);
  assert.deepEqual(createSchemaRegistry().validateDocument(value), {
    status: "VALID",
    schemaId: "harness.work-item/v2",
  });
  assert.throws(() => value.read_scope.push("mutation"), TypeError);
});

test("equivalent parses are deterministic and preserve checkbox completion", async () => {
  const markdown = await fixture();
  const first = parseWorkItem("work-items/HNS-FIXTURE-001.md", markdown);
  const second = parseWorkItem("work-items/HNS-FIXTURE-001.md", markdown);

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.deepEqual(second, first);
  assert.deepEqual(first.value.acceptance_criteria.map(({ completed }) => completed), [false, true]);
  assert.equal(first.value.requirement_references[0].path, "AC-HNS-005");
  assert.equal(first.value.requirement_references[1].anchor, "Section 17");
});

test("document hash binds exact Markdown content", async () => {
  const markdown = await fixture();
  const changed = replaceOnce(markdown, "Exercise the canonical", "Exercise a canonical");
  const first = parseWorkItem("work-items/HNS-FIXTURE-001.md", markdown);
  const second = parseWorkItem("work-items/HNS-FIXTURE-001.md", changed);

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.notEqual(first.value.document_hash, second.value.document_hash);
});

test("the Markdown AST dependency is exact-pinned at 2.0.3", async () => {
  const packageMetadata = JSON.parse(await readFile(packageUrl, "utf8"));
  const packageLock = JSON.parse(await readFile(packageLockUrl, "utf8"));

  assert.equal(packageMetadata.dependencies["mdast-util-from-markdown"], "2.0.3");
  assert.equal(packageLock.packages[""].dependencies["mdast-util-from-markdown"], "2.0.3");
  assert.equal(packageLock.packages["node_modules/mdast-util-from-markdown"].version, "2.0.3");
});

test("parser production code has no adapter, enforcement, process, network, or credential capability", async () => {
  const source = await readFile(new URL("../../../src/work-items/parser.ts", import.meta.url), "utf8");

  assert.doesNotMatch(source, /(?:from|import\s*\()["'](?:\.\.\/)*(?:adapters|enforcement|gates|audit)\//);
  assert.doesNotMatch(source, /(?:node:child_process|node:http|node:https|node:net)/);
  assert.doesNotMatch(source, /\bprocess\s*\./);
  assert.doesNotMatch(source, /\b(?:fetch|spawn|writeFile)\s*\(/);
});

test("a valid REVIEWER binding parses with typed artifact identity", async () => {
  const markdown = reviewerWorkItem(await fixture());

  const result = parseWorkItem("work-items/HNS-FIXTURE-001.md", markdown);
  assert.equal(result.ok, true, result.ok ? undefined : JSON.stringify(result.error));
  assert.equal(result.value.review_profile, "TECH_REVIEWER");
  assert.deepEqual(result.value.reviewed_artifact, { kind: "reviewed-artifact", path: "harness/src/index.ts" });
  assert.equal(result.value.maker_execution_id, "maker-001");
});

test("REVIEWER artifacts must be safe registered canonical targets", async () => {
  const markdown = await fixture();
  for (const artifact of [
    "docs/not-real-reviewed-artifact.md",
    "harness/src/unregistered.ts",
    "../harness/src/index.ts",
    "/harness/src/index.ts",
  ]) {
    expectFailure(
      parseWorkItem("work-items/HNS-FIXTURE-001.md", reviewerWorkItem(markdown, artifact)),
      (detail) => detail.field === "Reviewed Artifact",
    );
  }
});

test("REVIEWER artifacts require supported target metadata and an exact registered hash", async () => {
  const markdown = await fixture();
  const reviewer = reviewerWorkItem(markdown);
  const unsupportedTarget = {
    canonical_targets: [
      { path: "docs/harness_v0.1_SDD.md", anchors: ["Section 17"] },
      { path: "harness/src/index.ts" },
    ],
  };
  expectFailure(
    parseWorkItemWithContext("work-items/HNS-FIXTURE-001.md", reviewer, unsupportedTarget),
    (detail) => detail.field === "Reviewed Artifact" && detail.expected.includes("hash metadata"),
  );

  const mismatchedTarget = {
    canonical_targets: [
      { path: "docs/harness_v0.1_SDD.md", anchors: ["Section 17"] },
      { path: "harness/src/index.ts", reviewed_artifact_hash: `sha256:${"b".repeat(64)}` },
    ],
  };
  expectFailure(
    parseWorkItemWithContext("work-items/HNS-FIXTURE-001.md", reviewer, mismatchedTarget),
    (detail) => detail.field === "Reviewed Artifact Hash"
      && detail.expected === `sha256:${"b".repeat(64)}`
      && detail.actual === reviewedArtifactHash,
  );

  const malformedTarget = {
    canonical_targets: [
      { path: "docs/harness_v0.1_SDD.md", anchors: ["Section 17"] },
      { path: "harness/src/index.ts", reviewed_artifact_hash: "sha256:not-a-hash" },
    ],
  };
  expectFailure(
    parseWorkItemWithContext("work-items/HNS-FIXTURE-001.md", reviewer, malformedTarget),
    (detail) => detail.field === "canonical_targets",
  );
});

test("malformed REVIEWER binding fields still fail closed", async () => {
  const markdown = await fixture();
  const malformed = reviewerWorkItem(markdown, "harness/src/index.ts", "sha256:not-a-hash")
    .replace("| Maker Execution ID | `maker-001` |", "| Maker Execution ID | `N/A` |");

  const result = parseWorkItem("work-items/HNS-FIXTURE-001.md", malformed);
  expectFailure(result, (detail) => detail.field === "Reviewed Artifact Hash");
  assert.ok(result.error.some((detail) => detail.field === "Maker Execution ID"));
});

test("v1 and unknown schema versions fail closed", async () => {
  const markdown = await fixture();
  for (const version of ["harness.work-item/v1", "harness.work-item/v3"]) {
    const result = parseWorkItem(
      "work-items/HNS-FIXTURE-001.md",
      replaceOnce(markdown, "harness.work-item/v2", version),
    );
    expectFailure(result, (detail) => detail.field === "Schema Version");
  }
});

test("absolute, traversing, noncanonical, and filename-mismatched source paths fail closed", async () => {
  const markdown = await fixture();
  for (const path of [
    "/work-items/HNS-FIXTURE-001.md",
    "../work-items/HNS-FIXTURE-001.md",
    "work-items/../HNS-FIXTURE-001.md",
    "work-items\\HNS-FIXTURE-001.md",
    "docs/HNS-FIXTURE-001.md",
    "work-items/HNS-OTHER-001.md",
  ]) {
    expectFailure(parseWorkItem(path, markdown), (detail) => detail.field === "path" || detail.field === "ID");
  }
});

test("missing, duplicate, and unknown sections fail closed", async () => {
  const markdown = await fixture();
  const missing = markdown.replace(/## Objective\n\nExercise the canonical Work Item parser\.\n\n/, "");
  const duplicate = `${markdown}\n## Objective\n\nDuplicate.\n`;
  const unknown = `${markdown}\n## Surprise\n\nUnknown.\n`;

  expectFailure(parseWorkItem("work-items/HNS-FIXTURE-001.md", missing), (detail) => detail.section === "Objective");
  expectFailure(parseWorkItem("work-items/HNS-FIXTURE-001.md", duplicate), (detail) => detail.section === "Objective" && detail.actual === "duplicate");
  expectFailure(parseWorkItem("work-items/HNS-FIXTURE-001.md", unknown), (detail) => detail.section === "Surprise");
});

test("malformed, duplicate, missing, and unknown metadata fail closed", async () => {
  const markdown = await fixture();
  const malformed = replaceOnce(markdown, "| Field | Value |", "| Field | Value | Extra |");
  const duplicatedField = replaceOnce(markdown, "| Title | Parser fixture |", "| Title | Parser fixture |\n| Title | Again |");
  const missingField = markdown.replace("| Feature | `fixture-feature` |\n", "");
  const unknownField = replaceOnce(markdown, "| Feature | `fixture-feature` |", "| Feature | `fixture-feature` |\n| Vendor | `none` |");

  for (const candidate of [malformed, duplicatedField, missingField, unknownField]) {
    expectFailure(parseWorkItem("work-items/HNS-FIXTURE-001.md", candidate), (detail) => detail.section === "Metadata");
  }
});

test("duplicate metadata tables fail closed", async () => {
  const markdown = await fixture();
  const table = markdown.slice(markdown.indexOf("| Field | Value |"), markdown.indexOf("\n\n## Objective"));
  const candidate = markdown.replace("\n\n## Objective", `\n\n${table}\n\n## Objective`);
  expectFailure(
    parseWorkItem("work-items/HNS-FIXTURE-001.md", candidate),
    (detail) => detail.section === "Metadata" && detail.actual === "2",
  );
});

test("invalid metadata enums fail closed without inference", async () => {
  const markdown = await fixture();
  const cases = [
    ["IMPLEMENTER", "DEVELOPER", "Role"],
    ["IMPLEMENTATION", "BUILD", "Phase"],
    ["TODO", "READY", "Status"],
    ["LOW", "NONE", "Risk Class"],
  ];
  for (const [before, after, field] of cases) {
    const candidate = replaceOnce(markdown, `\`${before}\``, `\`${after}\``);
    expectFailure(parseWorkItem("work-items/HNS-FIXTURE-001.md", candidate), (detail) => detail.field === field);
  }
});

test("invalid non-reviewer and reviewer-only bindings fail closed", async () => {
  const markdown = await fixture();
  const nonReviewer = replaceOnce(markdown, "| Review Profile | `N/A` |", "| Review Profile | `TECH_REVIEWER` |");
  expectFailure(parseWorkItem("work-items/HNS-FIXTURE-001.md", nonReviewer), (detail) => detail.field === "review-only fields");

  let reviewer = replaceOnce(markdown, "| Role | `IMPLEMENTER` |", "| Role | `REVIEWER` |");
  reviewer = replaceOnce(reviewer, "| Phase | `IMPLEMENTATION` |", "| Phase | `REVIEW` |");
  expectFailure(parseWorkItem("work-items/HNS-FIXTURE-001.md", reviewer), (detail) => detail.field === "Review Profile");
});

test("unsafe scope and dependency paths fail closed", async () => {
  const markdown = await fixture();
  const scopeEscape = replaceOnce(markdown, "`harness/src/**`", "`../harness/src/**`");
  const dependencyEscape = replaceOnce(markdown, "## Dependencies\n\n- None", "## Dependencies\n\n- `../outside.md`");
  expectFailure(parseWorkItem("work-items/HNS-FIXTURE-001.md", scopeEscape), (detail) => detail.section === "Read Scope");
  expectFailure(parseWorkItem("work-items/HNS-FIXTURE-001.md", dependencyEscape), (detail) => detail.section === "Dependencies");
});

test("Write Scope overlap with Forbidden Scope fails closed", async () => {
  const markdown = await fixture();
  const candidate = replaceOnce(markdown, "`docs/**`", "`harness/src/**`");
  expectFailure(
    parseWorkItem("work-items/HNS-FIXTURE-001.md", candidate),
    (detail) => detail.section === "Write Scope" && detail.expected.includes("no overlap"),
  );
});

test("unsupported embedded glob segments fail closed in both scope directions", async () => {
  const markdown = await fixture();
  for (const pattern of ["*.ts", "file?.ts", "[ab].ts", "{a,b}.ts", "@(a|b).ts", "!index.ts"]) {
    const writeGlob = replaceOnce(markdown, "`harness/src/work-items/**`", `\`harness/src/${pattern}\``);
    const forbiddenGlob = replaceOnce(markdown, "`docs/**`", `\`harness/src/${pattern}\``);

    expectFailure(parseWorkItem("work-items/HNS-FIXTURE-001.md", writeGlob), (detail) => detail.section === "Write Scope");
    expectFailure(parseWorkItem("work-items/HNS-FIXTURE-001.md", forbiddenGlob), (detail) => detail.section === "Forbidden Scope");
  }
});

test("supported segment globs detect overlap in both operand directions", async () => {
  const markdown = await fixture();
  const writeGlob = replaceOnce(
    replaceOnce(markdown, "`harness/src/work-items/**`", "`harness/src/*`"),
    "`docs/**`",
    "`harness/src/index.ts`",
  );
  const forbiddenGlob = replaceOnce(
    replaceOnce(markdown, "`harness/src/work-items/**`", "`harness/src/index.ts`"),
    "`docs/**`",
    "`harness/src/*`",
  );

  for (const candidate of [writeGlob, forbiddenGlob]) {
    expectFailure(
      parseWorkItem("work-items/HNS-FIXTURE-001.md", candidate),
      (detail) => detail.section === "Write Scope" && detail.expected.includes("no overlap"),
    );
  }
});

test("supported segment globs preserve non-overlap in both operand directions", async () => {
  const markdown = await fixture();
  const writeGlob = replaceOnce(markdown, "`harness/src/work-items/**`", "`harness/src/*`");
  const forbiddenGlob = replaceOnce(
    replaceOnce(markdown, "`harness/src/work-items/**`", "`docs/index.ts`"),
    "`docs/**`",
    "`harness/src/*`",
  );

  for (const candidate of [writeGlob, forbiddenGlob]) {
    const result = parseWorkItem("work-items/HNS-FIXTURE-001.md", candidate);
    assert.equal(result.ok, true, result.ok ? undefined : JSON.stringify(result.error));
  }
});

test("canonical Work Item dependencies, artifact paths, and anchors resolve or fail closed", async () => {
  const markdown = await fixture();
  const dependency = replaceOnce(markdown, "## Dependencies\n\n- None", "## Dependencies\n\n- `HNS-CORE-005`");
  const resolved = parseWorkItemWithContext("work-items/HNS-FIXTURE-001.md", dependency, {
    canonical_targets: [
      { path: "docs/harness_v0.1_SDD.md", anchors: ["Section 17"] },
      { path: "work-items/HNS-CORE-005.md" },
    ],
  });
  assert.equal(resolved.ok, true, resolved.ok ? undefined : JSON.stringify(resolved.error));

  const missingWorkItem = replaceOnce(markdown, "## Dependencies\n\n- None", "## Dependencies\n\n- `HNS-NOT-REAL-999`");
  expectFailure(
    parseWorkItem("work-items/HNS-FIXTURE-001.md", missingWorkItem),
    (detail) => detail.section === "Dependencies" && detail.actual === "work-items/HNS-NOT-REAL-999.md",
  );

  const missingPath = replaceOnce(markdown, "`docs/harness_v0.1_SDD.md`", "`docs/not-real.md`");
  expectFailure(
    parseWorkItem("work-items/HNS-FIXTURE-001.md", missingPath),
    (detail) => detail.section === "Requirement References" && detail.actual === "docs/not-real.md",
  );

  const missingAnchor = replaceOnce(markdown, "Section 17", "Section 999");
  expectFailure(
    parseWorkItem("work-items/HNS-FIXTURE-001.md", missingAnchor),
    (detail) => detail.section === "Requirement References" && detail.actual === "Section 999",
  );
});

test("malformed, duplicate, and mismatched acceptance criteria fail closed", async () => {
  const markdown = await fixture();
  const noCheckbox = replaceOnce(markdown, "- [ ] `AC-HNS-FIXTURE-001-001`", "- `AC-HNS-FIXTURE-001-001`");
  const duplicate = replaceOnce(markdown, "AC-HNS-FIXTURE-001-002", "AC-HNS-FIXTURE-001-001");
  const mismatched = replaceOnce(markdown, "AC-HNS-FIXTURE-001-001", "AC-HNS-OTHER-001-001");
  for (const candidate of [noCheckbox, duplicate, mismatched]) {
    expectFailure(parseWorkItem("work-items/HNS-FIXTURE-001.md", candidate), (detail) => detail.section === "Acceptance Criteria");
  }
});

test("DONE Work Items require every acceptance criterion to be checked", async () => {
  const markdown = replaceOnce(await fixture(), "| Status | `TODO` |", "| Status | `DONE` |");
  expectFailure(
    parseWorkItem("work-items/HNS-FIXTURE-001.md", markdown),
    (detail) => detail.section === "Acceptance Criteria" && detail.expected.includes("Status is DONE"),
  );
});

test("unknown, duplicate, and missing phase Gates fail closed", async () => {
  const markdown = await fixture();
  const unknown = replaceOnce(markdown, "`IMPLEMENTATION_GATE`", "`CUSTOM_GATE`");
  const duplicate = replaceOnce(markdown, "- `IMPLEMENTATION_GATE`", "- `IMPLEMENTATION_GATE`\n- `IMPLEMENTATION_GATE`");
  const missing = replaceOnce(markdown, "- `IMPLEMENTATION_GATE`", "- `SPEC_GATE`");
  for (const candidate of [unknown, duplicate, missing]) {
    expectFailure(parseWorkItem("work-items/HNS-FIXTURE-001.md", candidate), (detail) => detail.section === "Required Gates");
  }
});

test("missing and malformed requirement-reference fields fail closed", async () => {
  const markdown = await fixture();
  const missing = markdown.replace("- ADR: `N/A`\n", "");
  const malformed = replaceOnce(markdown, "- Feature Spec: `N/A`", "- Feature Spec: plain text");
  expectFailure(parseWorkItem("work-items/HNS-FIXTURE-001.md", missing), (detail) => detail.field === "ADR");
  expectFailure(parseWorkItem("work-items/HNS-FIXTURE-001.md", malformed), (detail) => detail.field === "Feature Spec");
});
