import { defineCoreValue, type GateId, type WorkItem, type WorkItemPhase, type WorkItemRole, type RiskClass, type ReviewProfile } from "../core/domain.js";
import { encodeUtf8, sha256Hex } from "../core/hash/index.js";
import { ContextCompiler } from "../context/compiler.js";
import type { ContextCompilerInput, ExecutionContextManifest } from "../context/types.js";
import { RiskClassifier, ReviewAssignmentResolver, type ReviewAuthority, type RiskAuthority, type RiskAssignment, type ReviewAssignment } from "../risk/index.js";
import { equal, hashField, hashValue, identifier, relativePath, requireCondition, schema, sorted, verifyHashed } from "../risk/validation.js";

export interface ExecutionPolicy {
  readonly schema_version: "harness.policy/v1";
  readonly policy_hash: string;
  readonly sources: readonly { readonly path: string; readonly sha256: string }[];
  readonly filesystem: Readonly<{ read: readonly string[]; write: readonly string[]; deny_write: readonly string[] }>;
  readonly tools: Readonly<{ allow: readonly string[]; deny: readonly string[] }>;
  readonly commands: Readonly<{ safe_read: readonly string[]; development_write: readonly string[]; restricted: readonly string[] }>;
  readonly environment: Readonly<{ allowed: readonly string[]; denied: readonly string[] }>;
  readonly approval_required: Readonly<{ operations: readonly string[] }>;
}
export interface AdapterCapabilityRequirement {
  readonly capability: "filesystem_read_control" | "filesystem_write_control" | "tool_allowlist" | "tool_denylist" | "command_interception" | "network_control" | "approval_flow" | "event_stream" | "working_directory_control" | "termination";
  readonly minimum: "hard" | "soft";
}
export interface ExecutionProfile {
  readonly schema_version: "harness.execution-profile/v2";
  readonly profile_hash: string;
  readonly execution: Readonly<{ execution_id: string; task_id: string; role: WorkItemRole; risk_class: RiskClass; review_profile?: ReviewProfile; feature: string; phase: WorkItemPhase; adapter: string }>;
  readonly repository: Readonly<{ identity: string; root: string; branch: string; commit_before: string }>;
  readonly work_item: Readonly<{ path: string; hash: string }>;
  readonly context: Readonly<{ manifest_ref: string; context_hash: string }>;
  readonly filesystem: ExecutionPolicy["filesystem"];
  readonly tools: ExecutionPolicy["tools"];
  readonly commands: ExecutionPolicy["commands"];
  readonly environment: ExecutionPolicy["environment"];
  readonly gates: Readonly<{ required: readonly GateId[] }>;
  readonly review?: Readonly<{ assignment_ref: string; assignment_hash: string; maker_execution_ids: readonly string[]; reviewed_artifact_hash: string }>;
  readonly adapter_requirements: readonly AdapterCapabilityRequirement[];
  readonly audit: Readonly<{ sink: string; redaction_policy: string; required_fields: readonly string[] }>;
}
export interface ProfileBuildInput {
  readonly execution: ExecutionProfile["execution"];
  readonly repository: ExecutionProfile["repository"];
  readonly work_item: ExecutionProfile["work_item"];
  readonly context: ExecutionContextManifest;
  readonly policy: ExecutionPolicy;
  readonly gates: readonly GateId[];
  readonly review_assignment?: ReviewAssignment;
  readonly adapter_requirements: readonly AdapterCapabilityRequirement[];
  readonly audit: ExecutionProfile["audit"];
}
export interface ProfileHostBinding {
  readonly status: "ACTIVE" | "CLOSED" | "SUPERSEDED";
  readonly work_item: WorkItem;
  readonly policy: ExecutionPolicy;
  readonly risk: RiskAssignment;
  readonly review_assignment?: ReviewAssignment;
}
export interface ProfileHostPorts {
  repository(): ContextCompilerInput["repository"];
  source(path: string): { readonly canonical_path: string; readonly bytes: string | Uint8Array };
  binding(executionId: string): ProfileHostBinding;
  readonly risk: RiskAuthority;
  readonly review?: ReviewAuthority;
}
interface CompileRecord {
  readonly context: ExecutionContextManifest;
  readonly binding: ProfileHostBinding;
  readonly sources: readonly { readonly path: string; readonly canonical_path: string; readonly sha256: string }[];
  readonly receipt: Readonly<{ execution_id: string; context_hash: string; repository: ContextCompilerInput["repository"]; receipt_hash: string }>;
}
function sourceHash(bytes: string | Uint8Array): string {
  return `sha256:${sha256Hex(typeof bytes === "string" ? encodeUtf8(bytes) : bytes)}`;
}
function verifyRepository(repository: ContextCompilerInput["repository"]): void {
  requireCondition(repository.root.startsWith("/") && !repository.root.endsWith("/")
    && !repository.root.split("/").slice(1).some(part => part === "" || part === "." || part === "..")
    && !repository.root.includes("\\"), "Noncanonical repository root");
  identifier(repository.identity); identifier(repository.branch);
  requireCondition(/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(repository.commit), "Full Git object ID required");
}
function verifyContext(context: ExecutionContextManifest): void {
  schema(context); verifyHashed({ ...context }, "context_hash");
}
function normalizedPolicy(policy: ExecutionPolicy): ExecutionPolicy {
  const normalized = {
    ...policy,
    sources: [...policy.sources].sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0),
    filesystem: { read: sorted(policy.filesystem.read), write: sorted(policy.filesystem.write), deny_write: sorted(policy.filesystem.deny_write) },
    tools: { allow: sorted(policy.tools.allow), deny: sorted(policy.tools.deny) },
    commands: { safe_read: sorted(policy.commands.safe_read), development_write: sorted(policy.commands.development_write), restricted: sorted(policy.commands.restricted) },
    environment: { allowed: sorted(policy.environment.allowed), denied: sorted(policy.environment.denied) },
    approval_required: { operations: sorted(policy.approval_required.operations) },
  };
  schema(normalized); verifyHashed({ ...normalized }, "policy_hash");
  return normalized;
}

// Only this host coordinator can mint a record, by running the actual compiler.
export class ExecutionProfileBuilder {
  readonly #host: ProfileHostPorts;
  readonly #risk: RiskClassifier;
  readonly #records = new Map<string, CompileRecord>();
  readonly #latest = new Map<string, string>();
  readonly #admitted = new Map<string, string>();
  #compiling = false;
  constructor(host: ProfileHostPorts) { this.#host = host; this.#risk = new RiskClassifier(host.risk); }
  async compile(input: ContextCompilerInput): Promise<ExecutionContextManifest> {
    requireCondition(!this.#compiling, "Concurrent compile transaction");
    const frozen = defineCoreValue(input);
    const before = defineCoreValue(this.#host.repository());
    verifyRepository(before);
    requireCondition(equal(before, frozen.repository), "Compile repository mismatch");
    const binding = defineCoreValue(this.#host.binding(input.execution_id));
    requireCondition(binding.status === "ACTIVE" && equal(binding.work_item, frozen.work_item), "Inactive or mismatched host Work Item");
    const sources = new Map<string, { path: string; canonical_path: string; sha256: string }>();
    const canonicalPaths = new Map<string, string>();
    const compiler = new ContextCompiler({
      resolve: async path => {
        const source = this.#host.source(path);
        const prior = sources.get(path);
        const evidence = { path, canonical_path: source.canonical_path, sha256: sourceHash(source.bytes) };
        requireCondition(prior === undefined || equal(prior, evidence), "Compile source changed");
        sources.set(path, evidence); canonicalPaths.set(source.canonical_path, path);
        return source.canonical_path;
      },
      read: async canonicalPath => {
        const path = canonicalPaths.get(canonicalPath);
        requireCondition(path !== undefined, "Unverified source read");
        const source = this.#host.source(path);
        requireCondition(equal(sources.get(path), { path, canonical_path: source.canonical_path, sha256: sourceHash(source.bytes) }), "Compile source drift");
        return typeof source.bytes === "string" ? source.bytes : source.bytes.slice();
      },
    });
    this.#compiling = true;
    try {
      const context = await compiler.compile(frozen);
      verifyContext(context);
      requireCondition(equal(before, this.#host.repository()) && equal(binding, this.#host.binding(input.execution_id)), "Host changed during compile");
      const payload = { execution_id: frozen.execution_id, context_hash: context.context_hash, repository: before };
      const key = `${frozen.execution_id}:${context.context_hash}`;
      requireCondition(!this.#records.has(key), "Compile origin collision");
      const record = defineCoreValue({ context, binding, sources: [...sources.values()], receipt: { ...payload, receipt_hash: hashValue(payload) } });
      this.#verifySources(record.sources);
      this.#verifyHost(before, binding, frozen.execution_id);
      // Preserve the compiler's exact immutable snapshot identity in the private record.
      this.#records.set(key, Object.freeze({ ...record, context }));
      this.#latest.set(frozen.execution_id, key);
      return context;
    } finally { this.#compiling = false; }
  }
  #verifySources(sources: CompileRecord["sources"]): void {
    for (const evidence of sources) {
      const current = this.#host.source(evidence.path);
      requireCondition(current.canonical_path === evidence.canonical_path && sourceHash(current.bytes) === evidence.sha256, "Stale canonical source");
    }
  }
  #verifyHost(repository: ContextCompilerInput["repository"], binding: ProfileHostBinding, executionId: string): void {
    const currentBinding = defineCoreValue(this.#host.binding(executionId));
    const currentRepository = defineCoreValue(this.#host.repository());
    verifyRepository(currentRepository);
    requireCondition(currentBinding.status === "ACTIVE" && equal(binding, currentBinding)
      && equal(repository, currentRepository), "Host changed before registration/admission");
  }
  build(input: ProfileBuildInput): ExecutionProfile {
    const key = `${input.execution.execution_id}:${input.context.context_hash}`;
    const record = this.#records.get(key);
    requireCondition(record !== undefined && this.#latest.get(input.execution.execution_id) === key
      && input.context === record.context, "Missing, lost, superseded, or foreign compile receipt");
    verifyContext(input.context); verifyHashed({ ...record.receipt }, "receipt_hash");
    const hostBinding = defineCoreValue(this.#host.binding(input.execution.execution_id));
    requireCondition(hostBinding.status === "ACTIVE" && equal(hostBinding, record.binding), "Inactive/stale host binding");
    this.#verifySources(record.sources);
    const currentRepository = this.#host.repository();
    verifyRepository(currentRepository);
    const assertedRepository = { identity: input.repository.identity, root: input.repository.root, branch: input.repository.branch, commit: input.repository.commit_before };
    requireCondition(equal(record.receipt.repository, assertedRepository) && equal(assertedRepository, currentRepository), "Receipt repository mismatch");
    const wi = hostBinding.work_item;
    schema(wi); this.#risk.verify(hostBinding.risk, wi.id);
    requireCondition(hostBinding.risk.risk_class === wi.risk_class, "Risk differs from admitted Work Item");
    requireCondition(input.work_item.path === wi.source_path && input.work_item.hash === wi.document_hash
      && input.context.work_item.path === wi.source_path && sourceHash(this.#host.source(wi.source_path).bytes) === wi.document_hash, "Work Item source/hash mismatch");
    for (const field of ["role", "feature", "phase", "risk_class"] as const) {
      requireCondition(input.execution[field] === wi[field] && input.context[field] === wi[field], `Cross-binding mismatch: ${field}`);
    }
    requireCondition(input.execution.task_id === wi.id && input.context.task_id === wi.id
      && input.execution.execution_id === input.context.execution_id, "Execution/task identity mismatch");
    requireCondition((input.execution.review_profile ?? null) === wi.review_profile
      && (input.context.review_profile ?? null) === wi.review_profile, "Review profile mismatch");
    const policy = normalizedPolicy(defineCoreValue(input.policy));
    requireCondition(equal(policy, normalizedPolicy(hostBinding.policy)) && policy.sources.length > 0, "Unadmitted effective policy");
    const entries = [...input.context.bootstrap_context, ...input.context.governance_context, ...input.context.delivery_context,
      ...input.context.source_context, ...input.context.design_context, input.context.work_item];
    for (const source of policy.sources) {
      relativePath(source.path); hashField(source.sha256);
      requireCondition(sourceHash(this.#host.source(source.path).bytes) === source.sha256
        && entries.some(entry => entry.path === source.path), "Policy/context source mismatch");
    }
    const gates = sorted(input.gates) as GateId[];
    requireCondition(wi.required_gates.every(gate => gates.includes(gate)), "Missing mandatory gate");
    const assignment = input.review_assignment;
    requireCondition(equal(assignment ?? null, hostBinding.review_assignment ?? null), "Unassigned review artifact");
    if (wi.role === "REVIEWER") {
      requireCondition(assignment !== undefined, "Missing reviewer assignment");
      requireCondition(this.#host.review !== undefined, "Missing trusted review authority");
      new ReviewAssignmentResolver(this.#host.review, this.#risk).verify(assignment, input.execution.execution_id);
      schema(assignment); verifyHashed({ ...assignment }, "assignment_hash");
      requireCondition(assignment.review_profile === wi.review_profile && assignment.risk_class === wi.risk_class
        && equal(assignment.reviewed_artifact, wi.reviewed_artifact)
        && assignment.reviewed_artifact_hash === wi.reviewed_artifact_hash
        && wi.maker_execution_id !== null && assignment.maker_execution_ids.includes(wi.maker_execution_id)
        && !assignment.maker_execution_ids.includes(input.execution.execution_id), "Reviewer cross-binding/separation mismatch");
    } else requireCondition(assignment === undefined, "Maker cannot select reviewer assignment");
    const base = {
      schema_version: "harness.execution-profile/v2" as const, execution: input.execution,
      repository: input.repository, work_item: input.work_item,
      context: { manifest_ref: `context:${input.execution.execution_id}`, context_hash: input.context.context_hash },
      filesystem: policy.filesystem, tools: policy.tools, commands: policy.commands, environment: policy.environment,
      gates: { required: gates },
      ...(assignment === undefined ? {} : { review: { assignment_ref: assignment.assignment_id,
        assignment_hash: assignment.assignment_hash, maker_execution_ids: assignment.maker_execution_ids,
        reviewed_artifact_hash: assignment.reviewed_artifact_hash } }),
      adapter_requirements: [...input.adapter_requirements].sort((a, b) => a.capability < b.capability ? -1 : a.capability > b.capability ? 1 : a.minimum < b.minimum ? -1 : 1),
      audit: { ...input.audit, required_fields: sorted(input.audit.required_fields) },
    };
    const profile = defineCoreValue({ ...base, profile_hash: hashValue(base) });
    schema(profile);
    const admittedHash = this.#admitted.get(input.execution.execution_id);
    requireCondition(admittedHash === undefined || admittedHash === profile.profile_hash, "Changed profile requires a new execution");
    this.#verifyHost(record.receipt.repository, record.binding, input.execution.execution_id);
    this.#admitted.set(input.execution.execution_id, profile.profile_hash);
    return profile;
  }
}
