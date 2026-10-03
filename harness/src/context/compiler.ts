import { defineCoreValue } from "../core/domain.js";
import { encodeUtf8, hashCanonicalValue, sha256Hex } from "../core/hash/index.js";
import { HarnessError } from "../errors/index.js";
import { extractMarkdownSection } from "./markdown.js";
import {
  isCanonicalPathInsideRoot,
  isSensitiveContextPath,
  matchesScope,
  normalizeRepositoryPath,
} from "./path.js";
import type {
  ContextBudget,
  ContextBudgetDelta,
  ContextClass,
  ContextCompilerInput,
  ContextManifestEntry,
  ContextReadBoundary,
  ContextReadPolicy,
  ContextSourceProvider,
  ContextSourceRef,
  ContextTier,
  ContextUsage,
  ExcludedRef,
  ExecutionContextManifest,
  OnDemandContextDecision,
  OnDemandContextRequest,
} from "./types.js";

const ABSOLUTE_HARD_CEILING = Object.freeze({
  max_bytes: 20 * 1024 * 1024,
  max_files: 200,
  max_sections: 1_000,
});
const SINGLE_FILE_HARD_CEILING = 1024 * 1024;
const MAX_EXPLICIT_SOURCES = 20_000;
const HASH_PATTERN = /^sha256:[0-9a-f]{64}$/;
const TIER_ORDER: Readonly<Record<ContextTier, number>> = Object.freeze({
  TIER_0_BOOTSTRAP: 0,
  TIER_1_MANDATORY: 1,
  TIER_2_ON_DEMAND: 2,
});
const CLASS_ORDER: Readonly<Record<ContextClass, number>> = Object.freeze({
  bootstrap: 0,
  governance: 1,
  delivery: 2,
  source: 3,
  design: 4,
  work_item: 5,
});
const AUTHORITY_ORDER: Readonly<Record<ContextClass, number>> = Object.freeze({
  governance: 0,
  work_item: 1,
  delivery: 2,
  design: 3,
  source: 4,
  bootstrap: 5,
});

interface LoadedEntry {
  readonly entry: ContextManifestEntry;
  readonly context_class: ContextClass;
  readonly bytes: number;
}

function compare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function selectorKey(path: string, section?: string, anchor?: string): string {
  return `${path}\0${section ?? ""}\0${anchor ?? ""}`;
}

function sortRefs(left: ContextSourceRef, right: ContextSourceRef): number {
  return TIER_ORDER[left.tier] - TIER_ORDER[right.tier]
    || CLASS_ORDER[left.context_class] - CLASS_ORDER[right.context_class]
    || compare(left.path, right.path)
    || compare(left.section ?? "", right.section ?? "")
    || compare(left.anchor ?? "", right.anchor ?? "")
    || compare(left.reason, right.reason);
}

function sortLoaded(left: LoadedEntry, right: LoadedEntry): number {
  return TIER_ORDER[left.entry.tier] - TIER_ORDER[right.entry.tier]
    || CLASS_ORDER[left.context_class] - CLASS_ORDER[right.context_class]
    || compare(left.entry.path, right.entry.path)
    || compare(left.entry.section ?? "", right.entry.section ?? "")
    || compare(left.entry.anchor ?? "", right.entry.anchor ?? "");
}

function validateBudget(budget: ContextBudget, label: string): void {
  for (const [field, value] of Object.entries(budget)) {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new TypeError(`${label}.${field} must be a non-negative safe integer.`);
    }
  }
}

function budgetWithin(left: ContextBudget, right: ContextBudget): boolean {
  return left.max_bytes <= right.max_bytes
    && left.max_files <= right.max_files
    && left.max_sections <= right.max_sections;
}

function usageWithin(usage: ContextUsage, budget: ContextBudget): boolean {
  return usage.bytes <= budget.max_bytes
    && usage.files <= budget.max_files
    && usage.sections <= budget.max_sections;
}

function contextFailure(
  code: "HNS-CTX-001" | "HNS-CTX-002",
  executionId: string,
  failure: string,
  path?: string,
): HarnessError {
  const safeExecutionId = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(executionId)
    ? executionId
    : "context-compiler";
  return new HarnessError(code, {
    correlationId: safeExecutionId,
    causeCategory: "context.compiler",
    details: {
      failure,
      ...(path === undefined ? {} : { path }),
    },
  });
}

function normalizeSelector(value: string | undefined): string | undefined {
  const normalized = value?.trim().normalize("NFC");
  return normalized === undefined || normalized.length === 0 ? undefined : normalized;
}

function authorizePath(path: string, tier: ContextTier, boundary: ContextReadBoundary): string | undefined {
  if (matchesScope(path, boundary.forbidden_scope)) {
    return "FORBIDDEN_SCOPE";
  }
  if (!matchesScope(path, boundary.policy_read_scope)) {
    return "POLICY_READ_SCOPE_DENIED";
  }
  if (tier !== "TIER_0_BOOTSTRAP" && !matchesScope(path, boundary.read_scope)) {
    return "WORK_ITEM_READ_SCOPE_DENIED";
  }
  return undefined;
}

function usageOf(entries: readonly LoadedEntry[]): ContextUsage {
  return Object.freeze({
    bytes: entries.reduce((total, item) => total + item.bytes, 0),
    files: new Set(entries.map((item) => item.entry.path)).size,
    sections: entries.filter((item) => item.entry.section !== undefined || item.entry.anchor !== undefined).length,
  });
}

function entryArrays(entries: readonly LoadedEntry[]): Readonly<Record<ContextClass, readonly ContextManifestEntry[]>> {
  const grouped: Record<ContextClass, ContextManifestEntry[]> = {
    bootstrap: [], governance: [], delivery: [], source: [], design: [], work_item: [],
  };
  for (const item of entries) {
    grouped[item.context_class].push(item.entry);
  }
  return grouped;
}

function hashManifest(manifest: Omit<ExecutionContextManifest, "context_hash">): string {
  return `sha256:${hashCanonicalValue(manifest)}`;
}

function calculateManifestHash(manifest: ExecutionContextManifest): string {
  const { context_hash: ignored, ...base } = manifest;
  void ignored;
  return hashManifest(base);
}

function buildManifest(
  input: ContextCompilerInput,
  entries: readonly LoadedEntry[],
  excluded: readonly ExcludedRef[],
  deferred: readonly ExcludedRef[],
): ExecutionContextManifest {
  const ordered = [...entries].sort(sortLoaded);
  const grouped = entryArrays(ordered);
  const workItems = grouped.work_item;
  if (workItems.length !== 1 || workItems[0] === undefined) {
    throw contextFailure("HNS-CTX-002", input.execution_id, "EXACTLY_ONE_WORK_ITEM_REQUIRED");
  }
  const base = {
    schema_version: "harness.context/v3" as const,
    execution_id: input.execution_id,
    task_id: input.work_item.id,
    role: input.work_item.role,
    risk_class: input.work_item.risk_class,
    ...(input.work_item.review_profile === null ? {} : { review_profile: input.work_item.review_profile }),
    feature: input.work_item.feature,
    phase: input.work_item.phase,
    bootstrap_context: grouped.bootstrap,
    governance_context: grouped.governance,
    delivery_context: grouped.delivery,
    source_context: grouped.source,
    design_context: grouped.design,
    work_item: workItems[0],
    excluded_context: [...excluded].sort((a, b) => compare(a.path, b.path) || compare(a.reason, b.reason)),
    deferred_context: [...deferred].sort((a, b) => compare(a.path, b.path) || compare(a.reason, b.reason)),
    initial_budget: input.initial_budget,
    hard_safety_ceiling: input.hard_safety_ceiling,
    context_usage: usageOf(ordered),
    spec_versions: input.spec_versions ?? {},
  };
  return defineCoreValue({ ...base, context_hash: hashManifest(base) }) as ExecutionContextManifest;
}

function bytesOf(content: string | Uint8Array): Uint8Array {
  return typeof content === "string" ? encodeUtf8(content) : Uint8Array.from(content);
}

function utf8Of(content: string | Uint8Array): string {
  if (typeof content === "string") {
    return content;
  }
  let result = "";
  for (let index = 0; index < content.length;) {
    const first = content[index];
    if (first === undefined) {
      break;
    }
    let codePoint: number;
    let continuationCount: number;
    if (first <= 0x7f) {
      codePoint = first;
      continuationCount = 0;
    } else if (first >= 0xc2 && first <= 0xdf) {
      codePoint = first & 0x1f;
      continuationCount = 1;
    } else if (first >= 0xe0 && first <= 0xef) {
      codePoint = first & 0x0f;
      continuationCount = 2;
    } else if (first >= 0xf0 && first <= 0xf4) {
      codePoint = first & 0x07;
      continuationCount = 3;
    } else {
      throw new TypeError("Context content must be valid UTF-8.");
    }
    if (index + continuationCount >= content.length) {
      throw new TypeError("Context content must be valid UTF-8.");
    }
    for (let offset = 1; offset <= continuationCount; offset += 1) {
      const next = content[index + offset];
      if (next === undefined || (next & 0xc0) !== 0x80) {
        throw new TypeError("Context content must be valid UTF-8.");
      }
      codePoint = (codePoint << 6) | (next & 0x3f);
    }
    if ((continuationCount === 2 && codePoint < 0x800)
      || (continuationCount === 3 && codePoint < 0x10000)
      || codePoint > 0x10ffff
      || (codePoint >= 0xd800 && codePoint <= 0xdfff)) {
      throw new TypeError("Context content must be valid UTF-8.");
    }
    result += String.fromCodePoint(codePoint);
    index += continuationCount + 1;
  }
  return result;
}

export class ContextCompiler {
  readonly #provider: ContextSourceProvider;

  constructor(provider: ContextSourceProvider) {
    this.#provider = provider;
  }

  async #load(
    ref: ContextSourceRef,
    repositoryRoot: string,
    executionId: string,
  ): Promise<LoadedEntry> {
    let canonicalPath: string;
    try {
      canonicalPath = await this.#provider.resolve(ref.path);
    } catch {
      throw contextFailure("HNS-CTX-002", executionId, "SOURCE_RESOLUTION_FAILED", ref.path);
    }
    if (!isCanonicalPathInsideRoot(repositoryRoot, canonicalPath)) {
      throw contextFailure("HNS-CTX-001", executionId, "CANONICAL_PATH_OUTSIDE_REPOSITORY", ref.path);
    }
    let content: string | Uint8Array;
    try {
      content = await this.#provider.read(canonicalPath);
    } catch {
      throw contextFailure("HNS-CTX-002", executionId, "SOURCE_UNAVAILABLE", ref.path);
    }
    const documentBytes = bytesOf(content);
    if (documentBytes.byteLength > SINGLE_FILE_HARD_CEILING) {
      throw contextFailure("HNS-CTX-001", executionId, "SINGLE_FILE_HARD_CEILING_EXCEEDED", ref.path);
    }
    const documentHash = `sha256:${sha256Hex(documentBytes)}`;
    if (ref.expected_content_sha256 !== undefined && ref.expected_content_sha256 !== documentHash) {
      throw contextFailure("HNS-CTX-001", executionId, "CONCURRENT_HASH_DRIFT", ref.path);
    }

    let extracted;
    try {
      extracted = extractMarkdownSection(
        utf8Of(content),
        ref.section,
        ref.anchor,
        ref.allow_full_document_fallback === true,
      );
    } catch {
      throw contextFailure("HNS-CTX-001", executionId, "INVALID_UTF8_CONTEXT", ref.path);
    }
    if (extracted === undefined) {
      throw contextFailure("HNS-CTX-002", executionId, "SECTION_OR_ANCHOR_UNRESOLVED", ref.path);
    }
    const selectedBytes = encodeUtf8(extracted.content);
    return Object.freeze({
      context_class: ref.context_class,
      bytes: selectedBytes.byteLength,
      entry: Object.freeze({
        path: ref.path,
        ...(ref.section === undefined ? {} : { section: ref.section }),
        ...(ref.anchor === undefined ? {} : { anchor: ref.anchor }),
        content_sha256: `sha256:${sha256Hex(selectedBytes)}`,
        reason: ref.reason,
        tier: ref.tier,
        ...(extracted.fallback_reason === undefined
          ? {} : { full_document_fallback_reason: extracted.fallback_reason }),
      }),
    });
  }

  async compile(input: ContextCompilerInput): Promise<ExecutionContextManifest> {
    if (!input.repository.root.startsWith("/")
      || [input.execution_id, input.repository.identity, input.repository.branch, input.repository.commit]
        .some((value) => value.trim().length === 0)) {
      throw contextFailure("HNS-CTX-001", input.execution_id, "INVALID_REPOSITORY_ASSERTION");
    }
    validateBudget(input.initial_budget, "initial_budget");
    validateBudget(input.hard_safety_ceiling, "hard_safety_ceiling");
    if (!budgetWithin(input.initial_budget, input.hard_safety_ceiling)
      || !budgetWithin(input.hard_safety_ceiling, ABSOLUTE_HARD_CEILING)) {
      throw contextFailure("HNS-CTX-001", input.execution_id, "INVALID_CONTEXT_BUDGET");
    }
    if (input.sources.length > MAX_EXPLICIT_SOURCES) {
      throw contextFailure("HNS-CTX-001", input.execution_id, "EXPLICIT_SOURCE_INDEX_CEILING_EXCEEDED");
    }
    const activeGates = [...input.required_gates].sort(compare);
    const workItemGates = [...input.work_item.required_gates].sort(compare);
    if (activeGates.length !== workItemGates.length
      || activeGates.some((gate, index) => gate !== workItemGates[index])) {
      throw contextFailure("HNS-CTX-002", input.execution_id, "ACTIVE_GATE_UNRESOLVED");
    }

    const normalized: ContextSourceRef[] = [];
    const excluded: ExcludedRef[] = [];
    const deferred: ExcludedRef[] = [];
    for (const source of input.sources) {
      const path = normalizeRepositoryPath(source.path);
      const section = normalizeSelector(source.section);
      const anchor = normalizeSelector(source.anchor);
      const required = source.required !== false;
      const reason = source.reason.trim().normalize("NFC");
      const tierClassValid = source.tier === "TIER_0_BOOTSTRAP"
        ? source.context_class === "bootstrap"
        : source.context_class !== "bootstrap";
      if (!tierClassValid
        || (source.context_class === "work_item" && source.tier !== "TIER_1_MANDATORY")) {
        throw contextFailure("HNS-CTX-001", input.execution_id, "INVALID_TIER_CLASSIFICATION", path);
      }
      if (reason.length === 0) {
        throw contextFailure("HNS-CTX-001", input.execution_id, "EMPTY_CONTEXT_REASON", path);
      }
      if (path === undefined) {
        if (required) {
          throw contextFailure("HNS-CTX-001", input.execution_id, "INVALID_REPOSITORY_PATH");
        }
        excluded.push(Object.freeze({ path: source.path, reason: "INVALID_REPOSITORY_PATH" }));
        continue;
      }
      if (source.expected_content_sha256 !== undefined && !HASH_PATTERN.test(source.expected_content_sha256)) {
        throw contextFailure("HNS-CTX-001", input.execution_id, "INVALID_EXPECTED_HASH", path);
      }
      const denied = source.sensitivity === "SENSITIVE" || isSensitiveContextPath(path)
        ? "SENSITIVE_CONTEXT_DENIED"
        : authorizePath(path, source.tier, input.boundary);
      if (denied !== undefined) {
        if (required) {
          throw contextFailure("HNS-CTX-002", input.execution_id, denied, path);
        }
        excluded.push(Object.freeze({ path, reason: denied }));
        continue;
      }
      if (source.tier === "TIER_2_ON_DEMAND") {
        deferred.push(Object.freeze({ path, reason: "TIER_2_REQUIRES_ON_DEMAND_REQUEST" }));
        continue;
      }
      normalized.push(Object.freeze({ ...source, path, reason, ...(section === undefined ? {} : { section }), ...(anchor === undefined ? {} : { anchor }) }));
    }

    normalized.sort(sortRefs);
    const uniqueRefs = new Map<string, ContextSourceRef>();
    for (const ref of normalized) {
      const key = selectorKey(ref.path, ref.section, ref.anchor);
      const existing = uniqueRefs.get(key);
      if (existing !== undefined) {
        if (existing.tier !== ref.tier
          || existing.context_class !== ref.context_class
          || existing.allow_full_document_fallback !== ref.allow_full_document_fallback) {
          throw contextFailure("HNS-CTX-001", input.execution_id, "CONFLICTING_SOURCE_CLASSIFICATION", ref.path);
        }
        if (existing.expected_content_sha256 !== undefined
          && ref.expected_content_sha256 !== undefined
          && existing.expected_content_sha256 !== ref.expected_content_sha256) {
          throw contextFailure("HNS-CTX-001", input.execution_id, "CONCURRENT_HASH_DRIFT", ref.path);
        }
        if (existing.expected_content_sha256 === undefined && ref.expected_content_sha256 !== undefined) {
          uniqueRefs.set(key, Object.freeze({ ...existing, expected_content_sha256: ref.expected_content_sha256 }));
        }
        continue;
      }
      uniqueRefs.set(key, ref);
    }

    const loaded: LoadedEntry[] = [];
    for (const ref of uniqueRefs.values()) {
      loaded.push(await this.#load(ref, input.repository.root, input.execution_id));
    }
    loaded.sort((left, right) =>
      AUTHORITY_ORDER[left.context_class] - AUTHORITY_ORDER[right.context_class]
      || sortLoaded(left, right));
    const contentHashes = new Set<string>();
    const deduplicated: LoadedEntry[] = [];
    for (const item of loaded) {
      if (contentHashes.has(item.entry.content_sha256)) {
        excluded.push(Object.freeze({ path: item.entry.path, reason: "DUPLICATE_CANONICAL_CONTENT" }));
      } else {
        contentHashes.add(item.entry.content_sha256);
        deduplicated.push(item);
      }
    }
    const usage = usageOf(deduplicated);
    if (!usageWithin(usage, input.hard_safety_ceiling)) {
      throw contextFailure("HNS-CTX-001", input.execution_id, "HARD_SAFETY_CEILING_EXCEEDED");
    }
    if (!usageWithin(usage, input.initial_budget)) {
      throw contextFailure("HNS-CTX-001", input.execution_id, "INITIAL_CONTEXT_BUDGET_EXCEEDED");
    }
    return buildManifest(input, deduplicated, excluded, deferred);
  }

  async requestContext(
    manifest: ExecutionContextManifest,
    request: OnDemandContextRequest,
    policy: ContextReadPolicy,
    repositoryRoot: string,
  ): Promise<OnDemandContextDecision> {
    validateBudget(policy.context_budget, "context_budget");
    if (calculateManifestHash(manifest) !== manifest.context_hash) {
      throw contextFailure("HNS-CTX-001", request.execution_id, "CONTEXT_HASH_MISMATCH");
    }
    const before = manifest.context_usage;
    const unchangedAudit = (reason: string, status: "DENIED" | "DEFERRED"): OnDemandContextDecision =>
      defineCoreValue({
        request_id: request.request_id,
        status,
        reason,
        audit: {
          before_context_hash: manifest.context_hash,
          after_context_hash: manifest.context_hash,
          budget_before: before,
          budget_after: before,
          budget_delta: { bytes: 0, files: 0, sections: 0 },
        },
      }) as OnDemandContextDecision;

    if (request.execution_id !== manifest.execution_id) {
      return unchangedAudit("EXECUTION_ID_MISMATCH", "DENIED");
    }
    const path = normalizeRepositoryPath(request.requested_path);
    if (path === undefined) {
      return unchangedAudit("INVALID_REPOSITORY_PATH", "DENIED");
    }
    if (isSensitiveContextPath(path)) {
      return unchangedAudit("SENSITIVE_CONTEXT_DENIED", "DENIED");
    }
    const denied = authorizePath(path, "TIER_2_ON_DEMAND", policy);
    if (denied !== undefined) {
      return unchangedAudit(denied, "DENIED");
    }
    if (!budgetWithin(policy.context_budget, manifest.hard_safety_ceiling)) {
      return unchangedAudit("POLICY_BUDGET_EXCEEDS_HARD_CEILING", "DENIED");
    }

    const section = normalizeSelector(request.section);
    const anchor = normalizeSelector(request.anchor);
    if (request.expected_content_sha256 !== undefined && !HASH_PATTERN.test(request.expected_content_sha256)) {
      return unchangedAudit("INVALID_EXPECTED_HASH", "DENIED");
    }
    const requestReason = request.reason.trim().normalize("NFC");
    if (requestReason.length === 0) {
      return unchangedAudit("EMPTY_CONTEXT_REASON", "DENIED");
    }
    const existing = [
      ...manifest.bootstrap_context,
      ...manifest.governance_context,
      ...manifest.delivery_context,
      ...manifest.source_context,
      ...manifest.design_context,
      manifest.work_item,
    ];
    const existingEntry = existing.find((entry) => selectorKey(entry.path, entry.section, entry.anchor) === selectorKey(path, section, anchor));
    if (existingEntry !== undefined) {
      return defineCoreValue({
        request_id: request.request_id,
        status: "LOADED" as const,
        manifest_entry: existingEntry,
        reason: "ALREADY_PRESENT",
        resulting_context_hash: manifest.context_hash,
        resulting_manifest: manifest,
        audit: {
          before_context_hash: manifest.context_hash,
          after_context_hash: manifest.context_hash,
          budget_before: before,
          budget_after: before,
          budget_delta: { bytes: 0, files: 0, sections: 0 },
        },
      }) as OnDemandContextDecision;
    }

    let loaded: LoadedEntry;
    try {
      loaded = await this.#load({
        path,
        context_class: "source",
        tier: "TIER_2_ON_DEMAND",
        reason: requestReason,
        ...(section === undefined ? {} : { section }),
        ...(anchor === undefined ? {} : { anchor }),
        ...(request.expected_content_sha256 === undefined ? {} : { expected_content_sha256: request.expected_content_sha256 }),
        ...(request.allow_full_document_fallback === true ? { allow_full_document_fallback: true } : {}),
      }, repositoryRoot, manifest.execution_id);
    } catch (error) {
      if (error instanceof HarnessError && error.code === "HNS-CTX-002") {
        const failure = error.details.failure;
        return unchangedAudit(
          typeof failure === "string" ? failure : "MISSING_REQUIRED_CONTEXT",
          "DENIED",
        );
      }
      throw error;
    }

    const sameContent = existing.find((entry) => entry.content_sha256 === loaded.entry.content_sha256);
    if (sameContent !== undefined) {
      return defineCoreValue({
        request_id: request.request_id,
        status: "LOADED" as const,
        manifest_entry: sameContent,
        reason: "DUPLICATE_CANONICAL_CONTENT",
        resulting_context_hash: manifest.context_hash,
        resulting_manifest: manifest,
        audit: {
          before_context_hash: manifest.context_hash,
          after_context_hash: manifest.context_hash,
          budget_before: before,
          budget_after: before,
          budget_delta: { bytes: 0, files: 0, sections: 0 },
        },
      }) as OnDemandContextDecision;
    }

    const pathAlreadyPresent = existing.some((entry) => entry.path === path);
    const delta: ContextBudgetDelta = Object.freeze({
      bytes: loaded.bytes,
      files: pathAlreadyPresent ? 0 : 1,
      sections: section === undefined && anchor === undefined ? 0 : 1,
    });
    const after = Object.freeze({
      bytes: before.bytes + delta.bytes,
      files: before.files + delta.files,
      sections: before.sections + delta.sections,
    });
    if (!usageWithin(after, policy.context_budget) || !usageWithin(after, manifest.hard_safety_ceiling)) {
      return unchangedAudit("CONTEXT_BUDGET_EXCEEDED", "DEFERRED");
    }

    const existingLoaded: LoadedEntry[] = existing.map((entry) => ({
      entry,
      context_class: entry === manifest.work_item ? "work_item"
        : manifest.bootstrap_context.includes(entry) ? "bootstrap"
          : manifest.governance_context.includes(entry) ? "governance"
            : manifest.delivery_context.includes(entry) ? "delivery"
              : manifest.design_context.includes(entry) ? "design" : "source",
      bytes: 0,
    }));
    const grouped = entryArrays([...existingLoaded, loaded].sort(sortLoaded));
    const base = {
      schema_version: manifest.schema_version,
      execution_id: manifest.execution_id,
      task_id: manifest.task_id,
      role: manifest.role,
      risk_class: manifest.risk_class,
      ...(manifest.review_profile === undefined ? {} : { review_profile: manifest.review_profile }),
      feature: manifest.feature,
      phase: manifest.phase,
      bootstrap_context: grouped.bootstrap,
      governance_context: grouped.governance,
      delivery_context: grouped.delivery,
      source_context: grouped.source,
      design_context: grouped.design,
      work_item: manifest.work_item,
      excluded_context: manifest.excluded_context,
      deferred_context: manifest.deferred_context.filter((item) => item.path !== path),
      initial_budget: manifest.initial_budget,
      hard_safety_ceiling: manifest.hard_safety_ceiling,
      context_usage: after,
      spec_versions: manifest.spec_versions,
    };
    const resultingManifest = defineCoreValue({ ...base, context_hash: hashManifest(base) }) as ExecutionContextManifest;
    return defineCoreValue({
      request_id: request.request_id,
      status: "LOADED" as const,
      manifest_entry: loaded.entry,
      reason: "AUTHORIZED_AND_LOADED",
      resulting_context_hash: resultingManifest.context_hash,
      resulting_manifest: resultingManifest,
      audit: {
        before_context_hash: manifest.context_hash,
        after_context_hash: resultingManifest.context_hash,
        budget_before: before,
        budget_after: after,
        budget_delta: delta,
      },
    }) as OnDemandContextDecision;
  }
}
