# Harness v0.1 Software Design Document

## SDD Metadata

| Field | Value |
|---|---|
| Document | Harness v0.1 Software Design Document |
| Status | Approved |
| Scope | Implementation-level design for Project Orchestration Plane and Task Execution Plane |
| Architecture | `docs/harness_implementation_architecture.md` |
| Project Intake Contract | `.ai/PROJECT_INTAKE_CONTRACT.md` |
| Harness Contract | `.ai/HARNESS_CONTRACT.md` |
| Work Item Contract | `templates/Work_Item.md` |
| Implementation | Not started |
| Final Approval | Independent Review PASS |
| Approval Evidence | `docs/08_agent_reviews/review_log.md#rev-hns-sdd-001---harness-v01-sdd-independent-review` |

## 1. Document Role

本文件是 Harness v0.1 的 implementation-level Software Design Document。它將已核准 Architecture 與 Contract 轉成可拆分工程工作的 module、interface、schema、algorithm、error、security 與 test design。

本文件不是 Governance Authority、Product Specification、Project Intake Contract、Harness Contract、Work Item Contract 或 Architecture replacement。它不得重定義 intent、lifecycle、role、gate、authority、Work Item schema 或 product requirement。

若本文件與上層內容衝突，處理方式是：

```text
SPEC CONFLICT
→ identify conflicting sources and affected modules
→ stop affected design / implementation
→ resolve through existing Authority and Change Request rules
```

不得由 SDD 自行修改上層 Contract。

## 2. Implementation Technology

| Concern | v0.1 Decision |
|---|---|
| Runtime | Node.js；implementation kickoff 選定一個仍受支援的 LTS major 並在開發環境與 package metadata pin |
| Language | TypeScript，`strict: true`；禁止以大範圍 `any` 或 unchecked cast 繞過 domain validation |
| Architecture style | Modular monolith CLI；Project Orchestration 與 Task Execution 共用 process，但以 ports 與 Work Item boundary 分離 |
| Module system | ESM；TypeScript 使用 Node-compatible module / resolution policy，整個 package 只採一種 module system |
| Build target | 對齊已 pin 的 Node LTS baseline；不得輸出需要更高 runtime 的語法或 API |
| Package management | npm；提交 lockfile；CI 與 developer install 使用 lockfile-preserving mode |
| Core | Vendor-neutral；core/domain/application 不 import Claude、Codex 或 GitHub concrete adapter |
| Adapters | Claude、Codex、GitHub、Git、filesystem、process 與 audit store 都透過 ports 接入 |
| Configuration | YAML 作 human-authored config；啟動時轉成 validated immutable config object |
| Schema validation | JSON Schema Draft 2020-12-compatible schemas；所有 external / persisted input 在進入 domain 前驗證 |
| Markdown parsing | 使用 AST-based Markdown parser behind `WorkItemDocumentParser` port；禁止以 ad hoc regex 解析完整 Work Item |
| Logging | Structured JSON event per line；human CLI renderer 消費同一 event model；禁止直接散落 `console.log` |
| Testing | Node built-in test runner 作單一基礎 runner；TypeScript 先 build 或由受控 test transform 執行；unit / contract / integration 共用同一 runner |
| Deployment | Local-first CLI；v0.1 不建立 cloud service |

Dependency selection policy：

1. 優先 Node standard library與小型、單一責任 dependency。
2. 每個 runtime dependency 必須有明確 owner、替代方案、license、maintenance 與 supply-chain review。
3. Schema、Markdown、YAML 等 parser 必須使用 structured parser，不自行以字串切割取代。
4. Vendor SDK / CLI wrapper 只能存在 infrastructure adapter。
5. Dependency version 由 lockfile 固定；重大升級需通過 adapter / contract tests。
6. 不為 convenience 引入第二套 logger、schema、CLI、test 或 DI framework。

任何尚未由現有 Architecture / Contract 證實的 vendor capability，SDD 一律標示 `ADAPTER CAPABILITY TO VERIFY`，不得硬編 CLI flag、permission option 或 event field。

## 3. Proposed Source Structure

以下是未來 implementation placement；本次不建立這些目錄：

```text
harness/
  package.json
  package-lock.json
  tsconfig.json
  src/
    cli/
    application/
    orchestration/
    intake/
    repository/
    bootstrap/
    specs/
    risk/
    work-items/
    reviews/
    findings/
    assurance/
    dispatch/
    core/
    context/
    policy/
    execution/
    enforcement/
    adapters/
      claude/
      codex/
      github/
    gates/
    audit/
    approval/
    git/
    schemas/
    config/
    errors/
    utils/
  tests/
    unit/
    integration/
    contract/
    security/
    failure/
    fixtures/
```

Directory responsibility：

| Directory | Purpose | Allowed Dependencies | Forbidden Dependencies |
|---|---|---|---|
| `cli/` | Parse commands、render output、map exit codes | application use cases、config、errors | adapters directly、domain mutation、vendor CLI assumptions |
| `application/` | Use-case interfaces、transaction coordination | domain/core、ports | concrete adapters、shell、filesystem globals |
| `orchestration/` | Two-Plane high-level coordination and handoff | application、intake、work-items、dispatch ports | launching vendor process directly |
| `intake/` | Intent、state machine、Project Context / Proposal flows | core、schemas、repository ports | Agent adapters、GitHub concrete client |
| `repository/` | Repository provisioning use cases and ports | core、approval、bootstrap、git ports | credentials in domain objects、vendor client outside adapter |
| `bootstrap/` | Manifest validation and deterministic bootstrap plan | schemas、core、filesystem / git ports | floating framework source、destructive cleanup |
| `specs/` | Specification-generation orchestration | work-items、dispatch、gate ports | writing product logic directly |
| `risk/` | Deterministic risk classification and trigger evaluation | core、work-items、host policy ports | Agent-selected downgrade、vendor assumptions |
| `work-items/` | Generator、Markdown parser、normalizer、validator | core、schemas、role / gate registries | vendor adapter、GitHub client |
| `reviews/` | Reviewer Profile registry、assignment resolver、independence validation | core、risk、work-items、audit ports | changing reviewed artifact、self-selected profile |
| `findings/` | Append-only finding lifecycle and accepted-risk validation | core、audit、authority reader ports | Agent-owned deletion、artifact mutation |
| `assurance/` | Delivery candidate manifest and final assurance coordination | reviews、findings、gates、audit ports | release approval、artifact production |
| `dispatch/` | Role-to-capability matching and Harness invocation | execution ports、adapter registry types | changing Role、Phase、Scope or Gate |
| `core/` | Vendor-neutral domain types、hashing contracts、invariants | standard library abstractions only | infrastructure、CLI、vendor packages |
| `context/` | Context compiler and deterministic manifest | core、work-items、repository-reader ports | Claude / Codex adapters |
| `policy/` | Permission intersection and immutable policy | core、work-items、host baseline ports | vendor-specific permission syntax |
| `execution/` | Profile builder、lifecycle、runtime coordinator | context、policy、ports、audit | orchestration product decisions |
| `enforcement/` | Hard-boundary ports and host implementation | execution policy、process / filesystem ports | prompt-only security claims |
| `adapters/claude/` | Map Execution Profile to Claude runtime | adapter interface、enforcement ports | domain rule redefinition |
| `adapters/codex/` | Map Execution Profile to Codex runtime | adapter interface、enforcement ports | domain rule redefinition |
| `adapters/github/` | GitHub RepositoryProvisioner port implementation | repository / git ports、secure credential source | exposing token to Agent / audit |
| `gates/` | Resolve gate docs、run reviewer / validator、record results | core、audit、repository-reader ports | duplicating gate criteria |
| `audit/` | Host-owned append-only events and final records | core、redaction、state store ports | Agent-writable storage |
| `approval/` | Project and runtime approval records | core、audit、secure human channel | self-approval by Agent / adapter |
| `git/` | GitIntegration port and controlled process adapter | core、command runner、policy | direct-to-main bypass |
| `schemas/` | Versioned JSON Schemas and schema registry | core schema identifiers | business orchestration |
| `config/` | Config loader、merge、validation、secret reference policy | schemas、OS path resolver | credential values in project config |
| `errors/` | Canonical error catalog and exit mapping | core | module-local ad hoc exit codes |
| `utils/` | Narrow pure helpers with explicit owners | standard library | catch-all business logic |
| `tests/**` | Unit、contract、integration、security、failure evidence | public interfaces、fakes、fixtures | production credential / live destructive resource |

## 4. Dependency Direction

```text
CLI
↓
Application / Orchestration
↓
Domain / Core
↓
Ports
↑
Infrastructure / Vendor Adapters
```

Dependency matrix：

| From \ To | CLI | Application | Core | Ports | Infrastructure Adapters |
|---|---:|---:|---:|---:|---:|
| CLI | Allow | Allow | Types only | No | No |
| Application / Orchestration | No | Allow | Allow | Allow | No |
| Core / Domain | No | No | Allow | Port-neutral value types only | No |
| Ports | No | No | Allow | Allow | No |
| Infrastructure / Adapters | No | No | Allow | Implement | Allow within same adapter boundary |

Rules：

- `ContextCompiler → ClaudeAdapter` 禁止；`ClaudeAdapter → ExecutionProfile / AgentAdapter` 才允許。
- Application 透過 constructor / factory 注入 ports，不 import concrete implementation。
- Cross-module communication 使用 immutable types，禁止共享 mutable singleton。
- `utils/` 不得成為逆向依賴或隱藏 service locator。
- Circular import 在 build 與 architecture test 中視為 failure。

### 4.1 Module Port Registry

以下pseudo interfaces補齊logical component boundary；具體domain types由Section 5定義：

```ts
interface ProjectIntakeOrchestrator {
  start(input: StartProjectInput): Promise<IntakeSession>;
  handleEvent(sessionId: string, event: IntakeEvent): Promise<IntakeSession>;
  resume(sessionId: string): Promise<IntakeSession>;
  cancel(sessionId: string, actor: string): Promise<IntakeSession>;
}

interface DiscoveryManager {
  analyze(request: string, sources: readonly SourceReference[], current?: ProjectContext): Promise<DiscoveryResult>;
  nextClarifications(result: DiscoveryResult): readonly ClarificationQuestion[];
}

interface ProjectContextBuilder {
  build(input: DiscoveryResult, previous?: ProjectContext): ProjectContext;
}

interface ProjectProposalBuilder {
  build(context: ProjectContext, framework: FrameworkVersionPin): ProjectProposal;
}

interface ProjectApprovalCoordinator {
  decide(proposal: ProjectProposal, decision: ProjectApprovalDecision, actor: string): Promise<ProjectApproval>;
  verify(approval: ProjectApproval, proposal: ProjectProposal): void;
}

interface ProjectBootstrapManager {
  validate(manifest: BootstrapManifest, framework: FrameworkVersionPin): Promise<BootstrapPlan>;
  execute(plan: BootstrapPlan, transaction: ProvisioningTransaction): Promise<BootstrapResult>;
}

interface SpecificationGenerationOrchestrator {
  createSpecWorkItem(context: ProjectContext, repo: RepositoryIdentity): Promise<WorkItem>;
  dispatchAndReview(item: WorkItem): Promise<GateResult>;
}

interface RiskClassifier {
  classify(input: RiskClassificationInput, policy: RiskPolicy): RiskAssignment;
}

interface ReviewAssignmentResolver {
  resolve(item: WorkItem, makerEvidence: RoleCompletionEvidence, risk: RiskClass): readonly ReviewAssignment[];
  validateIndependence(assignment: ReviewAssignment, reviewerExecutionId: string): void;
}

interface FindingRegistry {
  append(finding: ReviewFinding): Promise<void>;
  transition(findingId: string, status: FindingStatus, evidence: string, actor: string): Promise<ReviewFinding>;
  listOpenBlocking(deliveryId: string): Promise<readonly ReviewFinding[]>;
}

interface DeliveryAssuranceCoordinator {
  buildCandidate(input: DeliveryCandidateInput): Promise<HashedFileRef>;
  createAssuranceWorkItem(candidate: HashedFileRef): Promise<WorkItem>;
  validateResult(result: DeliveryAssuranceResult, candidate: HashedFileRef): Promise<void>;
}

interface DispatchCoordinator {
  selectAdapter(item: WorkItem, capabilities: readonly AdapterCapability[]): AdapterSelection;
  dispatch(item: WorkItem, repository: RepositoryIdentity): Promise<ExecutionHandle>;
}

interface HarnessInputValidator {
  validate(input: HarnessInvocation): Promise<ValidatedHarnessInput>;
}

interface RoleResolver {
  resolve(item: WorkItem, governance: GovernanceIndex): Promise<ResolvedRole>;
}

interface PolicyCompiler {
  compile(sources: readonly PolicySource[], capability: AdapterCapability): ExecutionPolicy;
}

interface RuntimeMonitor {
  consume(events: AsyncIterable<RuntimeEvent>, profile: ExecutionProfile): Promise<RuntimeOutcome>;
  requestTermination(reason: string): Promise<void>;
}

interface ApprovalHandler {
  request(input: ApprovalRequest): Promise<ApprovalDecisionRecord>;
  verifyForExecution(record: ApprovalDecisionRecord, operationHash: string, policyHash: string): void;
}

interface AuditRecorder {
  append(event: RuntimeEvent): Promise<void>;
  recordGate(result: GateResult): Promise<void>;
  recordApproval(result: ApprovalDecisionRecord): Promise<void>;
  recordRoleEvidence(evidence: RoleCompletionEvidence): Promise<void>;
  recordFinding(finding: ReviewFinding): Promise<void>;
  recordAssurance(result: DeliveryAssuranceResult): Promise<void>;
  finalize(record: AuditRecord): Promise<void>;
}
```

`IntentClassifier`、`RepositoryProvisioner`、`WorkItemGenerator / Parser`、`ContextCompiler`、`ExecutionProfileBuilder`、`AgentAdapter`、`EnforcementBackend`、`GateRunner`與`GitIntegration`的完整signatures分別位於Sections 9、13、16-18、21-22、25、29、37。

## 5. Core Domain Types

所有 persisted / external data 先以 schema 驗證，再轉為 readonly domain value。`?` 表示 optional；其餘欄位 required。

### 5.1 Project Orchestration Types

```ts
type ProjectIntent =
  | "NEW_PROJECT"
  | "EXISTING_PROJECT_CHANGE"
  | "BUG_FIX"
  | "DESIGN_CHANGE"
  | "TECHNICAL_TASK"
  | "RESEARCH_ONLY";

type ProjectIntakeState =
  | "RECEIVED" | "CLASSIFIED" | "DISCOVERY" | "REQUIREMENTS_READY"
  | "PROJECT_PROPOSED" | "AWAITING_REPO_APPROVAL" | "REPO_PROVISIONING"
  | "SPEC_GENERATION" | "SPEC_REVIEW" | "READY_FOR_DESIGN"
  | "BLOCKED_MISSING_INFO" | "BLOCKED_CONFLICT" | "REPO_CREATION_FAILED"
  | "SPEC_GATE_FAILED" | "CANCELLED";

interface RepositoryTarget {
  readonly provider: "github";
  readonly owner: string;
  readonly name: string;
  readonly visibility: "private" | "public";
  readonly default_branch: "main";
  readonly development_branch: "develop";
}

interface FrameworkVersionPin {
  readonly repository: string;
  readonly commit_sha: string;
  readonly release?: string;
}

interface ProjectContext {
  readonly schema_version: "harness.project-context/v1";
  readonly project_id: string;
  readonly project_name: string;
  readonly project_slug: string;
  readonly intent: "NEW_PROJECT";
  readonly summary: string;
  readonly business_goal: string;
  readonly target_users: readonly string[];
  readonly user_roles: readonly string[];
  readonly primary_workflows: readonly string[];
  readonly core_features: readonly string[];
  readonly constraints: readonly string[];
  readonly platforms: readonly string[];
  readonly integrations: readonly string[];
  readonly data_sources: readonly string[];
  readonly security_requirements: readonly string[];
  readonly non_functional_requirements: readonly string[];
  readonly known_unknowns: readonly string[];
  readonly assumptions: readonly string[];
  readonly out_of_scope: readonly string[];
  readonly preferred_stack: TechnologyRecommendation;
  readonly repository: RepositoryTarget;
  readonly status: ProjectIntakeState;
  readonly revision: number;
  readonly updated_at: string;
}

interface TechnologyRecommendation {
  readonly recommendation: string;
  readonly reason: string;
  readonly constraints: readonly string[];
  readonly alternatives_considered: readonly string[];
}

interface ProjectProposal {
  readonly proposal_id: string;
  readonly context_revision: number;
  readonly project_name: string;
  readonly repository_target: RepositoryTarget;
  readonly summary: string;
  readonly business_goal: string;
  readonly primary_users: readonly string[];
  readonly core_features: readonly string[];
  readonly platform: readonly string[];
  readonly recommended_stack: TechnologyRecommendation;
  readonly open_questions: readonly string[];
  readonly visibility: "private" | "public";
  readonly framework_version: FrameworkVersionPin;
  readonly proposal_hash: string;
}

type ProjectApprovalDecision = "APPROVE_PROJECT" | "REQUEST_CHANGES" | "CANCEL";

interface ProjectApproval {
  readonly approval_id: string;
  readonly proposal_hash: string;
  readonly repository_target: RepositoryTarget;
  readonly framework_version: FrameworkVersionPin;
  readonly decision: ProjectApprovalDecision;
  readonly decided_at: string;
  readonly decided_by: string;
}

type BootstrapOperationKind = "COPY" | "GENERATE" | "CREATE_DIRECTORY" | "OPTIONAL" | "EXCLUDE";

interface BootstrapOperation {
  readonly id: string;
  readonly kind: BootstrapOperationKind;
  readonly source?: string;
  readonly target: string;
  readonly condition?: string;
  readonly required: boolean;
  readonly hash?: string;
}

interface BootstrapManifest {
  readonly schema_version: "harness.bootstrap/v1";
  readonly framework: FrameworkVersionPin;
  readonly operations: readonly BootstrapOperation[];
  readonly manifest_hash: string;
}
```

| Type | Purpose | Owner | Mutability / Validation |
|---|---|---|---|
| `ProjectIntent` | Route request | Intent Classifier | Immutable enum；unknown rejected or clarified |
| `ProjectIntakeState` | Persist Contract state | Intake State Machine | Only transition validator creates next value |
| `ProjectContext` | Structured intermediate intake artifact | Project Context Builder | Revisioned immutable snapshot；not Product SOT |
| `ProjectProposal` | Human-readable approved candidate | Proposal Builder | Immutable after hash；changes create new proposal ID/hash |
| `ProjectApproval` | Bind decision to exact proposal and target | Approval Coordinator | Append-only immutable evidence |
| `RepositoryTarget` | Identify provisioning target | Project Context / Proposal | Slug、owner、branch、visibility schema validation |
| `FrameworkVersionPin` | Pin bootstrap source | Bootstrap Manager | Commit SHA required and immutable |
| `BootstrapManifest` / `BootstrapOperation` | Deterministic bootstrap plan | Bootstrap Manager | Schema + path + duplicate + hash validation |

### 5.2 Work Item Types

```ts
type WorkItemRole = "PRODUCT_ARCHITECT" | "UX_DESIGNER" | "IMPLEMENTER" | "REVIEWER";
type WorkItemPhase = "SPEC" | "DESIGN" | "IMPLEMENTATION" | "REVIEW" | "RELEASE";
type WorkItemStatus = "TODO" | "IN_PROGRESS" | "BLOCKED" | "REVIEW" | "DONE" | "CANCELLED";
type RiskClass = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type ReviewProfile =
  | "SPEC_REVIEWER" | "UX_REVIEWER" | "TECH_REVIEWER"
  | "QA_REVIEWER" | "SECURITY_REVIEWER" | "DELIVERY_ASSURANCE_REVIEWER";

interface WorkItem {
  readonly schema_version: "harness.work-item/v2";
  readonly id: string;
  readonly title: string;
  readonly role: WorkItemRole;
  readonly feature: string;
  readonly phase: WorkItemPhase;
  readonly status: WorkItemStatus;
  readonly spec_version: string;
  readonly design_version: string;
  readonly risk_class: RiskClass;
  readonly review_profile: ReviewProfile | null;
  readonly reviewed_artifact: ArtifactReference | null;
  readonly reviewed_artifact_hash: string | null;
  readonly maker_execution_id: string | null;
  readonly objective: string;
  readonly requirement_references: readonly ArtifactReference[];
  readonly read_scope: readonly string[];
  readonly write_scope: readonly string[];
  readonly forbidden_scope: readonly string[];
  readonly scope: readonly string[];
  readonly out_of_scope: readonly string[];
  readonly acceptance_criteria: readonly AcceptanceCriterion[];
  readonly required_gates: readonly GateId[];
  readonly dependencies: readonly ArtifactReference[];
  readonly blockers: readonly string[];
  readonly notes: readonly string[];
  readonly source_path: string;
  readonly document_hash: string;
}

interface ArtifactReference { readonly kind: string; readonly id?: string; readonly path: string; readonly anchor?: string; }
interface AcceptanceCriterion { readonly id: string; readonly description: string; readonly completed: boolean; }
type GateId = "SPEC_GATE" | "DESIGN_GATE" | "IMPLEMENTATION_GATE" | "DELIVERY_ASSURANCE_GATE" | "RELEASE_GATE";
```

`templates/Work_Item.md` 是 enum、required section 與 validation 的唯一來源；上述 TypeScript type 是 parser output mapping，不是第二套 Work Item Contract。Work Item Generator 擁有 draft creation；Work Item Parser 擁有 normalization；兩者輸出 immutable value。

### 5.3 Task Execution Types

```ts
type ExecutionState =
  | "CREATED" | "CONTEXT_READY" | "RUNNING" | "VALIDATING" | "COMPLETED"
  | "BLOCKED_SPEC_GAP" | "BLOCKED_SPEC_CONFLICT" | "BLOCKED_PERMISSION"
  | "FAILED_GATE" | "FAILED_RUNTIME" | "CANCELLED";

interface ExecutionContextManifest {
  readonly schema_version: "harness.context/v3";
  readonly execution_id: string;
  readonly task_id: string;
  readonly role: WorkItemRole;
  readonly risk_class: RiskClass;
  readonly review_profile?: ReviewProfile;
  readonly feature: string;
  readonly phase: WorkItemPhase;
  readonly bootstrap_context: readonly ContextManifestEntry[];
  readonly governance_context: readonly ContextManifestEntry[];
  readonly delivery_context: readonly ContextManifestEntry[];
  readonly source_context: readonly ContextManifestEntry[];
  readonly design_context: readonly ContextManifestEntry[];
  readonly work_item: ContextManifestEntry;
  readonly excluded_context: readonly ExcludedRef[];
  readonly deferred_context: readonly ExcludedRef[];
  readonly initial_budget: ContextBudget;
  readonly hard_safety_ceiling: ContextBudget;
  readonly context_usage: ContextUsage;
  readonly spec_versions: Readonly<Record<string, string>>;
  readonly context_hash: string;
}

type ContextTier = "TIER_0_BOOTSTRAP" | "TIER_1_MANDATORY" | "TIER_2_ON_DEMAND";

interface ContextManifestEntry {
  readonly path: string;
  readonly section?: string;
  readonly anchor?: string;
  readonly content_sha256: string;
  readonly reason: string;
  readonly tier: ContextTier;
  readonly full_document_fallback_reason?: string;
}

interface ContextBudget {
  readonly max_bytes: number;
  readonly max_files: number;
  readonly max_sections: number;
}

interface ContextUsage {
  readonly bytes: number;
  readonly files: number;
  readonly sections: number;
}

interface OnDemandContextRequest {
  readonly request_id: string;
  readonly execution_id: string;
  readonly requested_path: string;
  readonly section?: string;
  readonly anchor?: string;
  readonly reason: string;
}

interface OnDemandContextDecision {
  readonly request_id: string;
  readonly status: "LOADED" | "DENIED" | "DEFERRED";
  readonly manifest_entry?: ContextManifestEntry;
  readonly reason: string;
  readonly resulting_context_hash?: string;
}

interface ExecutionPolicy {
  readonly schema_version: "harness.policy/v1";
  readonly policy_hash: string;
  readonly sources: readonly HashedFileRef[];
  readonly filesystem: Readonly<{ read: readonly string[]; write: readonly string[]; deny_write: readonly string[] }>;
  readonly tools: Readonly<{ allow: readonly string[]; deny: readonly string[] }>;
  readonly commands: Readonly<{ safe_read: readonly string[]; development_write: readonly string[]; restricted: readonly string[] }>;
  readonly environment: Readonly<{ allowed: readonly string[]; denied: readonly string[] }>;
  readonly approval_required: Readonly<{ operations: readonly string[] }>;
}

interface ExecutionProfile {
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

interface HashedFileRef { readonly path: string; readonly sha256: string; }
interface ExcludedRef { readonly path: string; readonly reason: string; }
```

Context Compiler、Policy Compiler 與 Profile Builder各自擁有對應 artifact。每次 build 都建立新 immutable object；hash 後不得原地修改。

### 5.4 Adapter, Runtime, Gate, Approval, Audit, and Error Types

```ts
type CapabilityLevel = "hard" | "soft" | "unsupported";

interface AdapterCapability {
  readonly adapter_id: string;
  readonly filesystem_read_control: CapabilityLevel;
  readonly filesystem_write_control: CapabilityLevel;
  readonly tool_allowlist: CapabilityLevel;
  readonly tool_denylist: CapabilityLevel;
  readonly command_interception: CapabilityLevel;
  readonly network_control: CapabilityLevel;
  readonly approval_flow: CapabilityLevel;
  readonly event_stream: CapabilityLevel;
  readonly working_directory_control: CapabilityLevel;
  readonly termination: CapabilityLevel;
}

interface AdapterCapabilityRequirement { readonly capability: Exclude<keyof AdapterCapability, "adapter_id">; readonly minimum: "hard" | "soft"; }
interface AdapterResult { readonly execution_id: string; readonly exit_status: string; readonly final_output?: string; readonly artifacts: readonly string[]; readonly raw_reference?: string; }

type RuntimeEventType =
  | "PROCESS_STARTED" | "FILE_READ" | "FILE_WRITE" | "COMMAND_REQUEST" | "COMMAND_EXECUTED"
  | "TOOL_REQUEST" | "TOOL_EXECUTED" | "APPROVAL_REQUESTED" | "APPROVAL_RESOLVED"
  | "SPEC_GAP" | "SPEC_CONFLICT" | "POLICY_VIOLATION" | "PROCESS_EXITED";

interface RuntimeEvent {
  readonly sequence: number;
  readonly timestamp: string;
  readonly execution_id: string;
  readonly type: RuntimeEventType;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly policy_hash: string;
}

type GateResultStatus = "PASS" | "FAILED" | "NEEDS_CLARIFICATION";
interface GateResult { readonly gate_id: GateId; readonly status: GateResultStatus; readonly evidence: readonly string[]; readonly timestamp: string; readonly artifact_hashes: readonly string[]; readonly reviewer: string; }

type ApprovalDecision = "APPROVED" | "REJECTED" | "EXPIRED";
interface ApprovalRequest { readonly approval_id: string; readonly execution_id: string; readonly operation: string; readonly operation_hash: string; readonly risk_class: string; readonly reason: string; readonly requested_at: string; readonly expires_at: string; readonly policy_hash: string; }

interface AuditRecord { readonly schema_version: "harness.audit/v2"; readonly execution_id: string; readonly task_id: string; readonly profile_hash: string; readonly events_hash: string; readonly gate_results: readonly GateResult[]; readonly approvals: readonly ApprovalDecisionRecord[]; readonly role_evidence_refs: readonly string[]; readonly review_assignment_refs: readonly string[]; readonly finding_refs: readonly string[]; readonly delivery_assurance_ref?: string; readonly commit_before: string; readonly commit_after?: string; readonly final_status: ExecutionState; readonly finalized_at: string; }
interface ApprovalDecisionRecord { readonly request: ApprovalRequest; readonly decision: ApprovalDecision; readonly decided_at: string; readonly decided_by: string; }

interface HarnessError { readonly code: string; readonly message: string; readonly cause?: HarnessError; readonly retryable: boolean; readonly human_action_required: boolean; readonly lifecycle_mapping: string; readonly exit_code: number; readonly details?: Readonly<Record<string, unknown>>; }
```

Adapter owns capability report / raw result；Runtime Monitor owns normalized events；Gate Runner owns GateResult；Approval Handler owns decision record；Audit Recorder owns final AuditRecord；Error Factory owns HarnessError。所有 audit/event/error payload 在 persistence 前 redaction。

GateResult使用`PASS / FAILED / NEEDS_CLARIFICATION`；Review decision使用`PASS / REQUEST_CHANGES / BLOCK`。兩者是不同 domain type，不得互相代用。

### 5.5 Accountability and Assurance Types

```ts
type ReviewDecision = "PASS" | "REQUEST_CHANGES" | "BLOCK";
type FindingSeverity = "BLOCKING" | "MAJOR" | "MINOR" | "OBSERVATION";
type FindingStatus = "OPEN" | "RESOLVED" | "ACCEPTED_RISK" | "SUPERSEDED";

interface RiskAssignment {
  readonly schema_version: "harness.risk-assignment/v1";
  readonly risk_class: RiskClass;
  readonly trigger_ids: readonly string[];
  readonly source_hashes: readonly string[];
  readonly classifier_version: string;
  readonly assignment_hash: string;
}

interface RiskClassificationInput {
  readonly work_item_id: string;
  readonly artifact_type: string;
  readonly changed_paths: readonly string[];
  readonly trigger_facts: readonly string[];
  readonly source_hashes: readonly string[];
}

interface RiskPolicy { readonly version: string; readonly rules: readonly string[]; readonly policy_hash: string; }

interface ReviewAssignment {
  readonly schema_version: "harness.review-assignment/v1";
  readonly assignment_id: string;
  readonly work_item_id: string;
  readonly risk_class: RiskClass;
  readonly review_profile: ReviewProfile;
  readonly maker_role: Exclude<WorkItemRole, "REVIEWER"> | "MULTIPLE";
  readonly maker_execution_ids: readonly string[];
  readonly reviewed_artifact: ArtifactReference;
  readonly reviewed_artifact_hash: string;
  readonly required_checks: readonly string[];
  readonly required_evidence: readonly string[];
  readonly assignment_hash: string;
}

interface RoleCompletionEvidence {
  readonly schema_version: "harness.role-evidence/v1";
  readonly evidence_id: string;
  readonly execution_id: string;
  readonly work_item_id: string;
  readonly role: WorkItemRole;
  readonly review_profile?: ReviewProfile;
  readonly artifact_refs: readonly ArtifactReference[];
  readonly artifact_hashes: readonly string[];
  readonly spec_references: readonly ArtifactReference[];
  readonly checks_performed: readonly EvidenceCheck[];
  readonly tests_performed: readonly EvidenceCheck[];
  readonly findings: readonly string[];
  readonly known_limitations: readonly string[];
  readonly result: "READY_FOR_REVIEW" | "BLOCKED" | ReviewDecision;
  readonly timestamp: string;
  readonly commit_hash?: string;
  readonly changed_files?: readonly string[];
  readonly diff_scope?: readonly string[];
  readonly typecheck?: EvidenceCheck;
  readonly lint?: EvidenceCheck;
  readonly unit_test?: EvidenceCheck;
  readonly integration_test?: EvidenceCheck;
  readonly build?: EvidenceCheck;
  readonly security_check?: EvidenceCheck;
}

interface ReviewFinding {
  readonly schema_version: "harness.finding/v1";
  readonly finding_id: string;
  readonly review_profile: ReviewProfile;
  readonly owner_role: WorkItemRole;
  readonly work_item_id: string;
  readonly artifact_ref: ArtifactReference;
  readonly artifact_hash: string;
  readonly requirement_references: readonly ArtifactReference[];
  readonly description: string;
  readonly severity: FindingSeverity;
  readonly evidence_references: readonly string[];
  readonly required_action: string;
  readonly status: FindingStatus;
}

interface DeliveryAssuranceResult {
  readonly schema_version: "harness.delivery-assurance/v1";
  readonly delivery_id: string;
  readonly project: string;
  readonly commit: string;
  readonly reviewed_work_items: readonly string[];
  readonly required_reviews: readonly ReviewAssignment[];
  readonly completed_review_evidence: readonly string[];
  readonly gate_results: readonly GateResult[];
  readonly open_findings: readonly string[];
  readonly accepted_risk_references: readonly string[];
  readonly evidence_references: readonly string[];
  readonly result: "PASS" | "REQUEST_CHANGES" | "BLOCKED";
  readonly reviewer: string;
  readonly reviewer_execution_id: string;
  readonly timestamp: string;
}

interface EvidenceCheck { readonly id: string; readonly method: string; readonly result: string; readonly evidence_reference?: string; }
interface DeliveryCandidateInput { readonly project: string; readonly commit: string; readonly work_items: readonly string[]; readonly evidence_refs: readonly string[]; readonly gate_refs: readonly string[]; readonly finding_refs: readonly string[]; }
```

`ReviewProfile`是 `REVIEWER` subordinate binding，不擴張 permission。Review Assignment Resolver擁有 assignment；Maker / Reviewer executions各自擁有 RoleCompletionEvidence；Finding Registry擁有 ReviewFinding lifecycle；Delivery Assurance Coordinator擁有 candidate manifest，`DELIVERY_ASSURANCE_REVIEWER` execution產生 result。

#### RiskPolicy string-row representation

`CR-HNS-EXEC-003-001` clarification: the existing `RiskPolicy.rules: readonly string[]` carries declarative JSON rows, using representation `risk-json-rows/v1`. Each string is parsed with `JSON.parse`, then checked as a plain object with exactly these required members:

```text
{"artifact_types":["implementation"],"path_prefixes":["harness/src/auth/"],"risk_class":"HIGH","trigger_id":"fixture.auth"}
```

- `trigger_id` is a nonempty authority-owned identifier; `risk_class` is exactly `LOW`, `MEDIUM`, `HIGH`, or `CRITICAL`.
- `artifact_types` and `path_prefixes` are arrays of strings, possibly empty. Artifact types use exact identifiers. Each path prefix is a nonempty repository-relative directory ending in `/`; absolute paths, backslashes, empty segments, `.` / `..` segments and glob metacharacters are rejected. There is no regex, expression, code, wildcard or executable DSL evaluation.
- Identifiers are NFC-normalized and trimmed, remain nonempty and case-sensitive, and contain no control characters. Paths are NFC-normalized, case-sensitive and must already satisfy the relative-path form above; no filesystem access or path expansion occurs in classification. Changed paths use the same relative-segment checks without a required trailing `/`.
- Normalize and deduplicate each row's selector arrays, then sort them by ascending UTF-16 code unit order, matching the existing canonical serializer's key ordering. To avoid duplicate JSON member / alternate spelling ambiguity without another parser grammar, the supplied row string must exactly equal the existing canonical serializer's output for this normalized row. Noncanonical whitespace, member order, duplicate members, extra members, malformed JSON and wrong types are rejected. Producers serialize normalized rows before supplying them.
- Sort rows by normalized `trigger_id` using the same ordering; duplicate IDs, including normalization collisions, are rejected even when their payloads agree. The row list is nonempty. `RiskPolicy.version` is a nonempty NFC-normalized authority revision string, compared exactly to the host's admitted revision. `policy_hash` is lowercase 64-hex SHA-256 over canonical UTF-8 `{version, rules}`, with `rules` the sorted canonical row strings and the hash field excluded. Row-array order is insignificant; changing a selector, risk mapping or revision changes this hash.

The canonical authority supplies the actual identifiers and mappings through the existing host policy boundary. The host independently binds this policy to the currently admitted canonical source paths and raw-file SHA-256 values, checks source ownership and current revision, and recomputes `policy_hash`; a caller's matching hash alone is insufficient. Missing, stale, unapproved or Agent-selected policy fails closed. These source bindings are host inputs, not additional `RiskPolicy` fields. No mappings in the illustrative row above become global policy.

### 5.6 Type Contract Matrix

| Type | Purpose | Required / Optional | Validation | Owner | Mutability |
|---|---|---|---|---|---|
| `ProjectIntent` | Route top-level request | One enum value required | Contract enum only | Intent Classifier | Immutable |
| `ProjectIntakeState` | Track intake lifecycle | One Contract state required | Transition validator | Intake Orchestrator | New immutable snapshot per transition |
| `ProjectContext` | Intermediate structured intake | All fields required；arrays may empty only when non-blocking | project-context schema、revision、hash | Context Builder | Revisioned immutable |
| `ProjectProposal` | Present exact project for approval | All fields required | Context revision + proposal hash | Proposal Builder | Immutable |
| `ProjectApproval` | Bind human decision | All fields required | proposal / target / framework hashes | Approval Coordinator | Append-only immutable |
| `RepositoryTarget` | Identify Project Repo | All required | provider、owner、name、visibility、branch policy | Context / Proposal | Immutable value object |
| `FrameworkVersionPin` | Select immutable Framework source | repository + SHA required；release optional | SHA / release resolution | Bootstrap Manager | Immutable |
| `BootstrapManifest` | Version bootstrap plan | version、framework、operations、hash required | schema、duplicates、paths、hashes | Bootstrap Manager | Immutable after compile |
| `BootstrapOperation` | Describe one bootstrap action | source / condition / hash optional by kind | kind-specific field rules | Bootstrap Manager | Immutable |
| `WorkItemRole` | Bind active role | Required | Work Item Contract enum | Work Item Parser | Immutable |
| `WorkItemPhase` | Bind execution phase | Required | Work Item Contract enum | Work Item Parser | Immutable |
| `WorkItemStatus` | Track Work Item status | Required | Work Item Contract enum | Work Item workflow | New document revision on change |
| `WorkItem` | Normalize internal execution contract | All canonical sections required；notes may empty | Template validation + document hash | Parser / Generator | Immutable parsed value |
| `RiskClass` | Bind review risk | Required for every Work Item | Canonical trigger evaluation；no Agent downgrade | Risk Classifier | Immutable assignment |
| `RiskAssignment` | Prove deterministic Risk decision | All fields / source hashes required | highest trigger wins、classifier version / hash | Risk Classifier | Immutable |
| `ReviewProfile` | Bind Reviewer responsibility | Required only for REVIEWER | Profile registry；one primary profile | Review Assignment Resolver | Immutable |
| `ReviewAssignment` | Bind independent checker to artifact | All fields / hashes required | Maker / Reviewer separation、risk、artifact hash | Review Assignment Resolver | Immutable |
| `RoleCompletionEvidence` | Prove baseline / review work | Required fields；Implementer conditional fields | execution / artifact / commit binding | Evidence Collector | Append-only immutable |
| `ReviewFinding` | Track review issue lifecycle | All fields required | severity / status transition、authority for accepted risk | Finding Registry | Append-only state events |
| `DeliveryAssuranceResult` | Record final assurance decision | All aggregate fields required | candidate hash、reviews、gates、findings | Delivery Assurance Reviewer | Immutable per candidate |
| `ExecutionState` | Track runtime lifecycle | Required | Harness Contract transition | Execution Core | Transition creates new state event |
| `ExecutionContextManifest` | Freeze least context | Tier、path、section / anchor、reason、content hash與budgets required | references、deduplication、budget、versions、determinism | Context Compiler | Immutable；on-demand load creates new version |
| `ExecutionPolicy` | Freeze effective permissions | All policy dimensions required | intersection、deny union、hash | Policy Compiler | Immutable |
| `ExecutionProfile` | Adapter launch contract | All sections required | cross-hash / repository / gate consistency | Profile Builder | Deep-frozen immutable |
| `AdapterCapability` | Report effective controls | Adapter ID + every capability required | capability-level enum | Adapter | Immutable report per prepare |
| `AdapterResult` | Normalize vendor result | execution / status / artifacts required；output / raw ref optional | execution binding、size / redaction | Adapter | Immutable |
| `RuntimeEvent` | Record normalized runtime fact | All envelope fields required | sequence、timestamp、policy hash、payload schema | Runtime Monitor | Append-only immutable |
| `GateResult` | Record gate decision | All fields required | Gate ID、status mapping、artifact hashes | Gate Runner | Append-only immutable |
| `ApprovalRequest` | Bind risky operation | All fields required | operation / policy hashes、expiry | Approval Handler | Immutable |
| `ApprovalDecision` | Record human runtime decision | One enum required | approved / rejected / expired only | Approval Handler | Immutable |
| `AuditRecord` | Final execution evidence | Required fields；commit_after optional | hash chain、artifact references、final state | Audit Recorder | Immutable after finalize |
| `HarnessError` | Normalize failure | code、message、retry / human / lifecycle / exit required；cause / details optional | central catalog + redaction | Error Factory | Immutable |

## 6. Schema Versioning

Canonical schema IDs：

```text
harness.project-context/v1
harness.work-item/v2
harness.context/v3
harness.policy/v1
harness.execution-profile/v2
harness.audit/v2
harness.bootstrap/v1
harness.risk-assignment/v1
harness.review-assignment/v1
harness.role-evidence/v1
harness.finding/v1
harness.delivery-assurance/v1
```

Rules：

- 每個 persisted / transferred document必須有 `schema_version`；Markdown Work Item 的 normalized model由 parser加上版本，原始文件仍以 `templates/Work_Item.md` 為 contract。
- Same major (`v1`) 可新增 optional field，但不得改變既有 required field 語意。
- 新增 required field、刪除 field、enum semantic change 或 hash canonicalization change 是 breaking change，必須新 major。
- Migration 是顯式、單向、可測試 function；原始 artifact 保留，migration output 重新 hash。
- Runtime 只接受明列 supported versions；未知或較新 major 回傳 `HNS-INPUT-001` 或 domain-specific schema error並 fail closed。
- 不允許 adapter 私自 migration；migration 位於 schema registry / application boundary。
- Audit 記錄 input version、migration ID、before / after hash。
- `harness.work-item/v1 → v2` 是 breaking migration：Orchestrator必須重新計算 Risk並為 review task建立 explicit profile / artifact / hash / Maker identity；禁止以 default或 Agent assumption補值。v1可讀取做 migration，但不可直接 dispatch。
- `harness.context/v1 → v2`、`harness.execution-profile/v1 → v2`與 `harness.audit/v1 → v2`必須由 trusted migrator加入可證明的 Risk / review / evidence references並重新 hash；缺少來源 evidence時不得 migration或 launch。
- `harness.context/v2 → v3`是 breaking migration：trusted migrator必須為每個 entry建立 Tier、reason、section / anchor與content hash，加入Initial Context Budget及Hard Safety Ceiling並重新計算context hash。無法證明entry來源或full-document fallback reason時不得自動migration。

## 7. CLI Design

Global behavior：TTY 預設 human-readable；`--json` 輸出 structured result；所有 command共用第 34 節 exit code registry。CLI 不要求使用者輸入 Role、Feature、Phase、Risk、Reviewer、Gate、Read Scope 或 Write Scope。

| Command | Purpose | Arguments / Options | Input | Output | Exit Codes | Side Effects | Approval |
|---|---|---|---|---|---|---|---|
| `harness start [request]` | 開始或建立 intake session | optional request；`--source <path-or-url>` repeatable；`--json` | stdin / arg、source metadata、existing cwd context | session ID、clarifications、Project Proposal或 routed result | `0, 2, 7, 8` | Persist intake state；repo creation only after later approval | Proposal approval required before provisioning |
| `harness run --task <ID>` | 執行既有 canonical Work Item | required task ID；optional `--adapter <preference>` assertion；`--json` | current repo、Work Item、Governance | execution ID、state、gate / result summary | `0, 2, 3, 4, 5, 6, 7` | Agent process、allowed file / git operations | Restricted operations use Approval Handler |
| `harness status <ID>` | 顯示 intake session或 execution狀態 | session / execution ID；`--json` | host-owned state | state、pending action、last error | `0, 2, 5` | None | None |
| `harness resume <session-id>` | 恢復 intake / pending approval / retryable orchestration | session ID；optional new answer input | persisted state、integrity hash | resumed prompt / next legal action | `0, 2, 7, 8` | State revision；approved provisioning only when decision exists | Existing approval must still match proposal hash |
| `harness inspect <ID>` | 顯示 redacted context、policy、profile、audit摘要 | session / execution / task ID；`--artifact <kind>` | host-owned state / repo read | redacted diagnostic | `0, 2, 5` | None | None |
| `harness validate [--task <ID>]` | 驗證 config、Work Item、schemas、repo與 references | optional task；`--json` | repo / config | findings and exit code | `0, 2, 3, 4, 5, 6` | None | None |
| `harness doctor` | 檢查 Node、Git、credential source presence、adapter capability availability | optional `--adapter <id>` | host environment facts | redacted capability report | `0, 2, 5, 8` | Read-only checks | None |

v0.1 保留上述七個 command；不提供 cleanup、production deploy、automatic release或 direct vendor passthrough command。任何 vendor-specific launch option在 adapter implementation前標示 `ADAPTER CAPABILITY TO VERIFY`。

## 8. Natural Language Project Start

`harness start` use case：

```text
capture request / sources
→ create intake session
→ classify intent
→ infer safe facts
→ ask minimum material clarifications
→ persist Project Context revision
→ build Project Proposal
→ present proposal and decisions
→ wait for APPROVE_PROJECT / REQUEST_CHANGES / CANCEL
→ provision only after valid approval
```

Input capture：request argument與 stdin合併為 `original_request`，附件 / URL 只記 metadata與受控 source reference；未信任內容不直接改變 policy。若 request空白且是 TTY，提示一個開放式問題，不顯示完整 schema問卷。

Session state儲存在 host-owned state root：

```text
<state-root>/intake/<session-id>/
  session.json
  project-context.json
  proposals/<proposal-id>.json
  approvals.jsonl
  events.jsonl
```

- 每次回答建立新 context revision與 integrity hash。
- Clarification Manager每輪只問當下會影響 scope、permission、data、architecture或acceptance的最小問題集。
- `REQUEST_CHANGES` 保留舊 proposal，回到 Contract允許的 discovery / requirements state。
- Pending approval不會逾越 timeout自動核准；resume時重新驗證 proposal hash與framework pin。
- `CANCEL` 寫入 terminal event，不執行 repo side effect。
- Session recovery先驗證 event sequence與snapshot hash；損壞時 fail closed。

## 9. Intent Classifier Design

```ts
interface IntentClassificationInput {
  readonly original_request: string;
  readonly existing_repo_context?: Readonly<{ identity: string; branch: string; governance_present: boolean }>;
  readonly source_metadata: readonly Readonly<{ type: string; reference: string; trusted: boolean }>[];
}

interface IntentClassificationResult {
  readonly intent?: ProjectIntent;
  readonly confidence: number; // 0..1
  readonly reason: readonly string[];
  readonly requires_clarification: boolean;
  readonly clarification_question?: string;
}

classifyIntent(input: IntentClassificationInput): IntentClassificationResult;
```

Rules：

- Deterministic rules先解析 explicit intent與existing repo facts；model-assisted classification只能回傳structured candidate，仍須schema validation。
- Confidence threshold由config提供並寫入audit；低於threshold或候選互相衝突時 `requires_clarification = true`。
- Existing repo存在不代表一定是 change；request明確要求新專案時仍進 proposal流程。
- 無法判斷時回傳 `HNS-INTAKE-001 INTENT_UNCLEAR`，不得 fallback `IMPLEMENTER`。
- Reason只包含可展示判斷依據，不保留未遮罩的model chain-of-thought。

## 10. Project Intake State Machine

State enum與合法 lifecycle直接引用 `.ai/PROJECT_INTAKE_CONTRACT.md`。下表是 transition implementation mapping，不是第二套 lifecycle；Contract變更時此 validator必須同步並通過contract test。

| From | Event | Guard | To | Side Effect |
|---|---|---|---|---|
| `RECEIVED` | `INTENT_CLASSIFIED` | intent valid | `CLASSIFIED` | append classification event |
| `CLASSIFIED` | `DISCOVERY_STARTED` | `NEW_PROJECT` | `DISCOVERY` | create context revision 0 |
| `DISCOVERY` | `MATERIAL_REQUIREMENTS_READY` | no blocking unknown | `REQUIREMENTS_READY` | persist context snapshot |
| `DISCOVERY` | `MATERIAL_INFO_MISSING` | blocking unknown exists | `BLOCKED_MISSING_INFO` | persist questions |
| `REQUIREMENTS_READY` | `PROPOSAL_BUILT` | context hash valid | `PROJECT_PROPOSED` | persist immutable proposal |
| `PROJECT_PROPOSED` | `PROPOSAL_PRESENTED` | proposal render succeeds | `AWAITING_REPO_APPROVAL` | append presentation event |
| `AWAITING_REPO_APPROVAL` | `APPROVE_PROJECT` | approval proposal hash matches | `REPO_PROVISIONING` | authorize one provisioning transaction |
| `AWAITING_REPO_APPROVAL` | `REQUEST_CHANGES` | change request recorded | `DISCOVERY` or `REQUIREMENTS_READY` | create new context / proposal revision |
| Any non-terminal intake state | `CANCEL` | human decision | `CANCELLED` | revoke pending authorization |
| `REPO_PROVISIONING` | `REPO_READY` | bootstrap transaction READY | `SPEC_GENERATION` | persist repo identity / provenance |
| `REPO_PROVISIONING` | `REPO_FAILED` | provision failure | `REPO_CREATION_FAILED` | persist failure evidence |
| `SPEC_GENERATION` | `SPECS_GENERATED` | spec Work Item completed | `SPEC_REVIEW` | request `SPEC_GATE` |
| `SPEC_REVIEW` | `SPEC_GATE_PASS` | no material gap / conflict | `READY_FOR_DESIGN` | permit design Work Item generation |
| `SPEC_REVIEW` | `SPEC_GATE_FAIL` | findings exist | `SPEC_GATE_FAILED` | block design dispatch |
| Any active state | `SPEC_CONFLICT` | conflict evidence exists | `BLOCKED_CONFLICT` | stop affected orchestration |
| `BLOCKED_MISSING_INFO` | `CLARIFICATION_RECEIVED` | material answers recorded | `DISCOVERY` | create new context revision |
| `REPO_CREATION_FAILED` | `RETRY_PROVISIONING` | approval still exact and retry policy permits | `REPO_PROVISIONING` | create new provisioning attempt / transaction |
| `SPEC_GATE_FAILED` | `RETRY_SPEC_GENERATION` | findings addressed in authorized input | `SPEC_GENERATION` | create new spec Work Item / execution |
| `BLOCKED_CONFLICT` | `CONFLICT_RESOLVED` | Authority resolution recorded and affected canonical input updated | recorded restart checkpoint (`DISCOVERY` or `SPEC_GENERATION`) | create new attempt；never continue old execution |

Transition Validator必須檢查 current revision、event、guard、expected hash與side-effect authorization。Resume / retry不原地改舊event；建立新event與新attempt ID。Blocked state只有在Contract允許且阻擋原因已解除後才能轉回對應active state。

## 11. Project Context Storage

決策：Project Context存於 host-owned state root，不放在 Project Repo canonical specs中。

```text
<state-root>/intake/<session-id>/project-context.json
<state-root>/intake/<session-id>/history/project-context-r<revision>.json
```

| Concern | Design |
|---|---|
| Format | UTF-8 canonical JSON，schema `harness.project-context/v1` |
| Versioning | Monotonic `revision`；每次material update建立immutable snapshot |
| Integrity | SHA-256 over canonical serialization；hash寫入session event |
| Update | Optimistic revision check + atomic temp-write / rename by host state store |
| Relation to Audit | Intake events只記hash、changed fields與redacted summary；snapshot是intermediate evidence |
| Product SOT | Never；formal requirements必須由 Product Architect寫入Project Repo canonical specs |
| Cleanup | 依第44節retention；只允許human-initiated cleanup，v0.1無cleanup command |
| Access | Orchestration process read/write；Agent process預設不可見 |

### 11.1 Spec Handoff Projection

Harness Contract要求task context使用repository-relative paths，因此host-owned Project Context不能直接以外部filesystem path注入Agent。Project Bootstrap Manager必須透過approved Bootstrap Manifest的required `GENERATE` operation，在initial bootstrap commit中產生一份approved、redacted、immutable source snapshot：

```text
docs/01_sources/project-intake/<session-id>/project-context.json
docs/01_sources/project-intake/<session-id>/source-map.md
```

Projection規則：

- 只包含approved Project Context fields、proposal hash、context revision與host snapshot hash reference；移除不必要的sensitive conversation data。
- 使用`harness.project-context/v1` compatible payload加projection metadata，寫入後計算repository artifact SHA-256。
- Source Map登錄user-provided material；可安全保存的source可另存repo，外部source保留reference與integrity metadata。
- 這些檔案是intake source evidence，不是Product SOT，不得覆蓋PRD、SRS、Architecture、SDD或Feature Spec。
- Initial Spec Work Item的Requirement References / Read Scope明確引用上述repo-relative paths；Context Compiler仍不接受任意host path。
- Host snapshot hash、projection hash與Work Item hash寫入intake / execution audit，確保handoff可追溯。
- Projection生成失敗回傳`HNS-BOOT-001`，bootstrap不得成為`READY`；後續讀取時缺失則回傳`HNS-CTX-002`並阻止Spec Work Item dispatch。

## 12. Project Proposal Design

Proposal Builder只接受validated Project Context revision與resolved FrameworkVersionPin。`proposal_hash` 由不含rendering metadata的canonical fields計算。

Required fields：`project_name`、`repository_target`、`summary`、`business_goal`、`primary_users`、`core_features`、`platform`、`recommended_stack`、`open_questions`、`visibility`、`framework_version`、`proposal_hash`。

Approval flow：

```text
build immutable proposal
→ canonicalize and hash
→ render full proposal
→ collect APPROVE_PROJECT | REQUEST_CHANGES | CANCEL
→ bind decision to proposal_hash + repo target + framework pin
```

任何proposal field變更都產生新`proposal_id`與hash，舊approval失效。Repository Provisioner同時驗證approval與proposal hashes，防止核准Proposal A卻建立Proposal B。

## 13. Repository Provisioner Design

```ts
interface RepositoryProvisioner {
  checkAvailability(target: RepositoryTarget): Promise<AvailabilityResult>;
  createRepository(input: ApprovedProvisioningInput): Promise<RepositoryIdentity>;
  initializeDefaultBranch(repo: RepositoryIdentity): Promise<GitRefResult>;
  createDevelopmentBranch(repo: RepositoryIdentity, fromCommit: string): Promise<GitRefResult>;
  pushBootstrapCommit(repo: RepositoryIdentity, plan: BootstrapPlan): Promise<CommitIdentity>;
  readRepositoryIdentity(repo: RepositoryIdentity): Promise<RepositoryIdentity>;
}
```

`ApprovedProvisioningInput` required：exact `ProjectApproval`、proposal、target、visibility、FrameworkVersionPin、BootstrapManifest hash與transaction ID。

Operation design：

| Operation | Output | Failure / Retry | Idempotency Key |
|---|---|---|---|
| `checkAvailability` | available / conflict / inaccessible | read retry with bounded backoff | provider + owner + name |
| `createRepository` | immutable repo provider ID | retry only after read-back confirms absence / same transaction | transaction ID + proposal hash |
| `initializeDefaultBranch` | `main` ref | read-before-write；same commit is success | repo ID + bootstrap commit plan hash |
| `pushBootstrapCommit` | commit SHA | never duplicate if plan hash already recorded | repo ID + manifest hash + framework SHA |
| `createDevelopmentBranch` | `develop` ref | existing same ref is success；different ref is conflict | repo ID + source commit |
| `readRepositoryIdentity` | normalized identity | safe read retry | provider repo ID |

Credential policy：GitHub credential只由host environment / secure credential source交給GitHub adapter；不得寫入repo、plain-text audit、Project Context、Execution Profile或Agent environment。Adapter回傳sanitized provider error，不回傳token / authorization header。

Repository creation guard：decision必須是`APPROVE_PROJECT`，`proposal_hash`一致，owner / name / visibility / framework pin一致；visibility若不是proposal值立即拒絕。預設private來自Contract，公開需要proposal中的明確human approval。

Vendor API request shape、SDK method與CLI flag：`ADAPTER CAPABILITY TO VERIFY`，在GitHub adapter implementation前以official capability check / contract test確認。

## 14. Repository Transaction and Rollback

Provisioning不是atomic operation，使用host-owned transaction journal：

```text
PROVISIONING
→ BOOTSTRAPPING
→ READY

PROVISIONING | BOOTSTRAPPING
→ BOOTSTRAP_FAILED
```

Journal記錄transaction ID、proposal hash、repo provider ID、完成steps、manifest hash、framework SHA、branch refs與last error。`READY`只有repo identity、bootstrap commit、`main`、`develop`、metadata與provenance都read-back verified後才能寫入。

Compensating policy：

- Partial repo保留並標記`BOOTSTRAP_FAILED`，不回報成功、不進Spec Generation。
- Retry從journal與provider read-back重建current facts，只重做未完成且idempotent step。
- 自動刪除repo、force push、rewrite branch或覆蓋未知content一律禁止。
- Cleanup proposal只列出resource與影響；刪除partial repo必須取得新的destructive human approval。
- Approval target或manifest / framework pin改變時，建立新transaction，不重用舊approval。

## 15. Project Bootstrap Manifest

```ts
interface BootstrapManifestDocument {
  readonly schema_version: "harness.bootstrap/v1";
  readonly framework: FrameworkVersionPin;
  readonly operations: readonly BootstrapOperation[];
}
```

Operation validation：

| Field | Rule |
|---|---|
| `id` | unique, stable, non-empty |
| `kind` | `COPY`、`GENERATE`、`CREATE_DIRECTORY`、`OPTIONAL`、`EXCLUDE` only |
| `source` | required for COPY；must resolve inside pinned Framework tree |
| `target` | normalized project-relative path；unique effective writer |
| `condition` | declarative allowlisted predicate；no executable expression |
| `required` | missing required operation fails bootstrap |
| `hash` | required for copied immutable file；must match pinned source content |

Compiler steps：schema validate → resolve framework SHA → normalize paths → evaluate allowed conditions → detect duplicate / parent-child writer conflict → verify source and hash → build deterministic sorted plan → freeze / hash。

New Project manifest必須包含Section 11.1 intake source snapshot的required `GENERATE` operation；payload來自approved Project Context / Proposal，target固定在`docs/01_sources/project-intake/<session-id>/`下，並納入bootstrap commit與provenance。

Bootstrap governance COPY set必須包含 `REVIEWER` role、六個 subordinate profile、五個 Gate、Work Item v2與 Role Completion / Review Log template。漏掉任一 required governance artifact視為`HNS-BOOT-001`，不得建立可執行 Project Repo。

Fail closed conditions：duplicate target、`../`、absolute target、symlink escape、missing required source、hash mismatch、version pin mismatch、unknown operation、EXCLUDE 與 writer conflict。Manifest 不執行 shell。

## 16. Work Item Generator Design

```ts
interface GenerateWorkItemInput {
  readonly canonical_spec_references: readonly ArtifactReference[];
  readonly initial_spec_inputs?: readonly ArtifactReference[]; // repository-relative intake source projection
  readonly role: WorkItemRole;
  readonly feature: string;
  readonly phase: WorkItemPhase;
  readonly risk_assignment: Readonly<{ risk_class: RiskClass; source_hash: string; assigned_by: "ORCHESTRATOR" | "HARNESS" }>;
  readonly review_binding?: Readonly<{
    profile: ReviewProfile;
    reviewed_artifact: ArtifactReference;
    reviewed_artifact_hash: string;
    maker_execution_id?: string;
  }>;
  readonly traceability: readonly ArtifactReference[];
  readonly requested_scope: Readonly<{ read: readonly string[]; write: readonly string[]; forbidden: readonly string[] }>;
  readonly objective: string;
  readonly acceptance_descriptions: readonly string[];
}

generateWorkItem(input: GenerateWorkItemInput): WorkItemDocument;
```

Generation rules：

- Schema與enum只讀`templates/Work_Item.md`的versioned registry projection，不在generator硬編第二份authority。
- Generator只接受 Risk Classifier的 signed / hashed assignment；Agent-provided downgrade拒絕。`REVIEWER` task必須有完整 review binding，其他 Role必須輸出 `N/A` fields。
- ID格式由project-level ID allocator產生；prefix可供人讀但不得用來推導Role / Phase。Allocator使用repo lock與monotonic sequence，避免collision。
- Filename固定`<ID>.md`。
- AC IDs依input順序產生`AC-<ID>-001`起的zero-padded sequence；同一canonical input順序輸出deterministic。
- Default Gate mapping來自Work Item Contract；Governance-required gates只能增加不能移除。
- Read / write / forbidden先normalize，再與active Role boundary交集；forbidden union優先。
- Initial `SPEC` Work Item只可透過Section 11.1的repository-relative approved intake projection引用Project Context / Proposal / sources，不接受host absolute path，也不得宣稱它們是Product SOT。
- Output先render Markdown，再由WorkItemParser重新parse / validate；round-trip不一致即`HNS-WI-001`。

Generator禁止新增產品需求、擴張Role permission、自創Gate / Role / Phase、選擇較低 Risk、讓 Agent自選 Reviewer或補猜缺失metadata。

### 16.1 Risk and Review Orchestration

Risk Classifier以 canonical trigger table評估 artifact type、changed paths、auth / authorization、DB / migration、payment、external API、credential、production、destructive operation、security boundary與 data sensitivity，取最高 Risk。相同 normalized inputs與 classifier version必須產生相同 RiskAssignment hash；未知 sensitive trigger至少為`HIGH`並要求 clarification。

For the Section 5.5 JSON rows, the host supplies canonical trigger facts derived from the admitted Work Item, artifact and source evidence. An Agent cannot omit sensitive facts or assert their absence; missing required host fact/source evidence requires clarification. Normalize input identifiers as in Section 5.5, deduplicate/sort `trigger_facts`, normalize/deduplicate/sort `changed_paths`, and validate source hashes as lowercase 64-hex values. `work_item_id` and `artifact_type` are required nonempty identifiers. Validation precedes matching.

A row matches if its `trigger_id` is an exact input fact, OR its `artifact_types` contains the exact input artifact type, OR any changed path starts with one of its directory prefixes. A prefix `src/auth/` matches `src/auth/login.ts`, not `src/authorize.ts`; selectors are alternatives, not conjunctions. Empty selector arrays add no match. Collect every matching row ID; the order is `LOW < MEDIUM < HIGH < CRITICAL`. Effective risk is the maximum of matched row risks and the admitted Work Item's canonical Risk, which is independently host-bound and cannot be lowered. No match preserves that Work Item risk, provided facts and policy are complete and recognized. This describes table evaluation, not new domain-specific risk assignments.

Every input fact absent from the table is treated as potentially sensitive: the diagnostic minimum is the maximum of `HIGH`, the Work Item risk and matched risks, and clarification is mandatory. No usable RiskAssignment, review assignment or profile may be admitted until canonical authority resolves the unknown; `CRITICAL` is never reduced to `HIGH`. Invalid rows, missing facts/source binding or unverifiable policy likewise fail closed, rather than returning an accepted default.

On successful classification, `trigger_ids` is the sorted unique matched row IDs; `source_hashes` is the sorted unique union of independently verified input evidence hashes, canonical policy raw-source hashes and `policy_hash`. `classifier_version` is `risk-json-rows/v1`. Deep-freeze the resulting assignment; `assignment_hash` is SHA-256 of its canonical UTF-8 value excluding `assignment_hash`. Thus policy revision/content and source identity participate without changing Section 5.5 types. Hash verification is repeated before downstream assignment/profile admission, against the host's current policy/source bindings. A replay from a superseded policy/source binding is rejected even if its internal hash is valid.

Bounded contract examples (fixture mappings are test data, not production policy):

| Case | Input / authoritative fixture | Expected outcome |
|---|---|---|
| R1 positive | Work Item `MEDIUM`; rows `fixture.auth=HIGH` and `fixture.pay=CRITICAL`; facts contain both IDs in either order, with duplicates | `CRITICAL`; sorted two trigger IDs and identical assignment hash for normalized-equivalent inputs |
| R2 positive | The canonical Section 5.5 fixture row; `LOW` Work Item, artifact `spec`, no facts, changed path `harness/src/auth/login.ts` | `HIGH` by directory prefix; `harness/src/authorize.ts` instead leaves the canonical `LOW` baseline |
| R3 negative | Unknown fact `fixture.unknown`, even beside a recognized `LOW` row | Diagnostic at least `HIGH`, clarification, no admitted assignment/profile; existing `CRITICAL` baseline stays `CRITICAL` |
| R4 negative | Duplicate normalized row ID, noncanonical/duplicate-member JSON, extra `code` member, or `../` prefix | Reject before classification; nothing executes |
| R5 negative | Caller recomputes a hash after changing a risk row, but canonical source/revision is unchanged; or replays an old correctly hashed table | Host ownership/current-source comparison rejects; valid hash alone does not authorize policy |

Review Assignment Resolver先選 artifact-aligned basic Checker，再依 Risk增加 QA / Security；`CRITICAL`還要求 Delivery Assurance與既有 Governance指定的 Human high-risk approval。它輸出依 profile ID排序的 deterministic assignments，一個 assignment對應一個 primary profile與 execution。Maker execution collision、Agent-provided profile、Risk downgrade或 artifact hash缺失都 fail closed。

```text
Maker Role Completion Evidence
→ verify Self Review and artifact hash
→ classify Risk
→ resolve required profiles
→ generate REVIEWER Work Items
→ independent executions
→ validate evidence / findings
→ phase Gate
→ delivery candidate / assurance when applicable
```

## 17. Work Item Parser

```ts
interface WorkItemParseErrorDetail {
  readonly path: string;
  readonly section?: string;
  readonly field?: string;
  readonly expected: string;
  readonly actual?: string;
  readonly error_code: "HNS-WI-001";
}

interface WorkItemParser {
  parse(path: string, markdown: string): Result<WorkItem, WorkItemParseErrorDetail[]>;
}
```

Parsing algorithm：

1. Normalize / authorize repository-relative Work Item path。
2. Parse Markdown AST；禁止以heading substring或table row regex作完整parser。
3. Locate exactly one required Metadata table and every canonical section。
4. Convert metadata fields，validate `harness.work-item/v2`、Role / Feature / Phase / Status / versions / Risk與 review-only fields。
5. Validate filename equals Metadata ID。
6. Parse Requirement References / Dependencies into typed references and resolve paths / anchors。
7. Parse Read / Write / Forbidden lists；normalize pattern syntax但不compile policy。
8. Parse Acceptance Criteria checkbox and enforce `AC-<ID>-NNN` uniqueness。
9. Parse canonical Gate IDs and verify gate registry target exists。
10. 對 `REVIEWER`驗證 profile registry、reviewed artifact path / SHA-256與 Maker execution ID；對其他 Role驗證 review-only fields全為`N/A`。
11. Parse Scope、Out of Scope、Blockers、Notes without treating prose as permission。
12. Build canonical normalized representation，compute document hash，freeze。

Unknown required section、duplicate metadata、invalid enum、unresolvable reference、path escape、AC / gate / Risk / review binding error都回傳structured error detail。Parser不得由ID prefix、Title、filename或directory猜Role、Feature、Phase、Risk或 Reviewer Profile。v1只能交給 explicit migrator，不可 dispatch。

## 18. Context Compiler Design

```ts
interface ContextCompilerInput {
  readonly execution_id: string;
  readonly work_item: WorkItem;
  readonly bootstrap_entrypoints: readonly HashedFileRef[];
  readonly role_definition: HashedFileRef;
  readonly reviewer_profile_definition?: HashedFileRef;
  readonly repository: Readonly<{ root: string; identity: string; branch: string; commit: string }>;
  readonly governance_registry: readonly HashedFileRef[];
  readonly gate_registry: ReadonlyMap<GateId, string>;
  readonly traceability: TraceabilityIndex;
  readonly initial_budget: ContextBudget;
  readonly hard_safety_ceiling: ContextBudget;
}

interface ContextCompiler {
  compile(input: ContextCompilerInput): Promise<ExecutionContextManifest>;
  requestContext(
    manifest: ExecutionContextManifest,
    request: OnDemandContextRequest,
    policy: ExecutionPolicy,
  ): Promise<OnDemandContextDecision>;
}
```

### 18.1 Context Tier Model

| Tier | Purpose | Initial Context Rule |
|---|---|---|
| `TIER_0_BOOTSTRAP` | 極短的 repository / vendor router，例如 `AGENTS.md`、`CLAUDE.md` | Host或vendor可自動載入；Manifest記錄path、hash與reason，但不得再次複製完整Governance、Workflow、Skills或canonical specs |
| `TIER_1_MANDATORY` | 任務啟動所需的最小canonical contract | 只包含Constitution、Authority、Workflow、active Role、assigned Reviewer Profile、active Gate、assigned Work Item與其直接canonical requirement references |
| `TIER_2_ON_DEMAND` | 執行中證明確有需要的額外細節 | 例如額外SDD / API / DB section、source file、test或skill；初始package不得以「可能有用」為理由預載 |

Work Item直接引用的Feature / Screen / Architecture / SDD section屬Tier 1；執行中才發現需要的其他section、source、tests或專用skill屬Tier 2。禁止預設載入`docs/**`、`skills/**`、`templates/**`、`agent_roles/**`、`specs/**`或full repository。

### 18.2 Initial Compilation

1. Validate Work Item、repository identity / branch / commit，以及host提供的Initial Context Budget與Hard Safety Ceiling。
2. 將實際bootstrap entrypoints記為Tier 0；entrypoint只提供routing，不把其引用內容遞迴展開。
3. 加入Tier 1 Mandatory Governance：Constitution、Authority、Workflow、active Role、assigned Reviewer Profile when applicable、active Gates。
4. 加入assigned Work Item本身，解析Requirement References與必要traceability edges。
5. 只加入直接相關Feature Spec、UI-dependent task的Screen Spec / Design Contract，以及明確引用的Architecture / SDD sections。
6. 只加入Work Item直接要求且位於Read Scope的source / test files；其他候選延後為Tier 2。
7. Reviewer task加入exact reviewed artifact / manifest、Maker evidence與findings，並驗證SHA-256；Maker / Reviewer execution相同時停止。
8. 在讀取內容前排除forbidden、sensitive、unrelated、unsupported-size、version-mismatch與out-of-repo paths，並記錄reason。
9. Resolve canonical real path，read selected bytes once，calculate content SHA-256。
10. 先依normalized path + section / anchor合併重複reference，再依content hash去除從AGENTS、Work Item、SDD或prompt重複注入的同一canonical content；保留最高Authority的canonical source，Manifest只保留一份entry與deterministic reason。
11. 依Tier、context class、UTF-8 normalized path及section排序，套用Initial Context Budget。
12. 超出initial budget時依序使用section extraction、remove duplicate、defer optional Tier 2與on-demand loading。剩餘Tier 1仍超出時回傳explicit `HNS-CTX-001`並要求縮小reference或由host在Hard Safety Ceiling內調整budget；不得silent truncate或summarize canonical requirement。
13. 任何內容超過Hard Safety Ceiling一律fail closed。Canonical serialize manifest excluding `context_hash`，calculate hash，freeze。

### 18.3 Section-Level Extraction

可解析的heading、anchor或明確section reference必須優先產生section entry。例如Work Item引用`docs/harness_v0.1_SDD.md Section 6`時，只提供Section 6及維持語意所需的heading ancestry，不預設載入整份SDD。

只有anchor無法解析、跨section normative dependency無法被明確列舉，或抽取後會失去規格完整性時，才能載入full document。每次fallback都必須在`full_document_fallback_reason`記錄deterministic reason並進入Audit；「方便」或「可能有用」不是有效理由。不得以模型摘要替代canonical section。

### 18.4 Context Deduplication

每個Manifest entry至少包含`path`、`section / anchor`、`content_sha256`、`reason`與`tier`。相同canonical content hash不得因多個reference、bootstrap prose或prompt重述而在Context Package重複出現；same path / section在同一repository commit出現不同hash視為concurrent modification並終止compile。

### 18.5 On-Demand Loading

```text
request context
→ verify Work Item Read Scope
→ verify active Role
→ verify effective Policy
→ verify remaining Context Budget / Hard Safety Ceiling
→ section-extract and deduplicate
→ load or deny
→ append audit evidence
→ issue a new immutable context_hash
```

On-demand request不得擴張Write Scope、Role、Gate、tool permission或繞過Forbidden Scope。每次request、decision、path / section、reason、before / after context hash與budget delta都必須audit；拒絕或延後也需記錄。Agent不得直接讀取未進Manifest的額外內容。

`TraceabilityIndex` 是read-only mapping of requirement / feature / screen / test IDs to canonical paths；unresolved required edge回傳`HNS-CTX-002`。相同repository commit、Work Item hash、governance hashes、traceability、budget與compiler version必須產生相同initial `context_hash`。

Compiler不得無差別掃描整個repo；discovery先由references、scope與bounded file index縮小候選。File content在通過path、section、size、sensitivity與budget checks前不得送入Agent context。

## 19. Policy Compiler Design

Effective Permission：

```text
Governance
∩ Active Role
∩ Work Item
∩ Host Baseline
∩ Adapter Capability
```

Denied：所有來源deny的union；deny always wins。

```ts
interface PolicySource {
  readonly id: string;
  readonly hash: string;
  readonly filesystem_allow: Readonly<{ read: readonly string[]; write: readonly string[] }>;
  readonly filesystem_deny: readonly string[];
  readonly tool_allow: readonly string[];
  readonly tool_deny: readonly string[];
  readonly command_allow: readonly CommandClass[];
  readonly command_deny: readonly CommandClass[];
  readonly environment_allow: readonly string[];
  readonly environment_deny: readonly string[];
  readonly approval_required: readonly string[];
}
```

Pseudo algorithm：

```text
validate and hash all policy sources
→ normalize path patterns, tool IDs, command classes, env names
→ intersect every allow dimension
→ union every deny dimension
→ subtract deny from effective allow
→ map adapter capability; unsupported allow becomes deny or capability mismatch
→ validate no path / tool / command / env ambiguity
→ add approval-required union
→ canonical sort and deduplicate
→ freeze
→ hash canonical policy
```

Filesystem pattern intersection由typed path-pattern engine執行，不以字串prefix假裝set intersection。Work Item `Forbidden Scope`、Role deny、Governance deny、Host deny與Adapter unsupported全部進deny union。

Policy dimensions：

- Filesystem：read、write、deny_write，default deny。
- Tools：registered capability ID allow / deny，unknown tool denied。
- Commands：`SAFE_READ`、`DEVELOPMENT_WRITE`與restricted classes；command instance仍需第26節classifier。
- Environment：name allowlist + source classification，不把secret value放入policy hash。
- Approval-required：operation class / normalized resource pattern，approval不自動加入allow。

Reviewer Profile只增加 required checks與 context constraints，不增加 filesystem / tool / command permission。Policy Compiler必須讓 Reviewer保持 read-only，唯一可寫路徑是 Work Item明確授權的 review evidence sink；reviewed artifact write永遠 deny。Risk downgrade、profile self-selection與 same-execution Checker都視為 policy conflict。

互相矛盾且無法由deny-wins安全收斂的source回傳`HNS-POL-002`；缺失host baseline或critical adapter capability回傳對應fail-closed error。

## 20. Path Security

所有filesystem operation使用`PathResolver`：

```ts
interface ResolvedPath {
  readonly requested: string;
  readonly repository_relative: string;
  readonly lexical_absolute: string;
  readonly real_path: string;
  readonly case_normalized_key: string;
}
```

Resolution sequence：

1. Reject NUL、empty path與unsupported encoding。
2. Reject user-supplied absolute path unless API explicitly accepts host-owned path class。
3. Normalize separators and `.` segments；detect `..` before and after normalization。
4. Join toalready-resolved repository root，不依賴process cwd。
5. Resolve every existing parent and symlink chain with bounded depth；cycle fails。
6. For create target，resolve nearest existing parent then append validated non-symlink leaf。
7. Compare real path against repository root using platform-aware case semantics。
8. Convert tocanonical `/`-separated repository-relative path for policy matching。
9. Re-resolve immediately before write to defend symlink swap / TOCTOU；host hard boundary remains required。
10. Match compiled allow and deny；deny wins。

Case sensitivity由filesystem capability probe決定並固定於Execution Profile。Windows drive / UNC、macOS normalization與POSIX case behavior都由PathResolver adapter測試；跨platform manifest hash使用normalized repository-relative form，real path只用於enforcement。

## 21. Execution Profile Builder

```ts
interface ExecutionProfileBuilder {
  build(input: {
    execution: ExecutionProfile["execution"];
    repository: ExecutionProfile["repository"];
    work_item: ExecutionProfile["work_item"];
    context: ExecutionContextManifest;
    policy: ExecutionPolicy;
    gates: readonly GateId[];
    review_assignment?: ReviewAssignment;
    adapter_requirements: readonly AdapterCapabilityRequirement[];
    audit: ExecutionProfile["audit"];
  }): ExecutionProfile;
}
```

Builder驗證task / role / feature / phase / Risk / Review Profile在Work Item、Context與Policy sources一致；repository commit等於context compile commit；gate set包含mandatory gates；context / policy hash可重算。Reviewer task還必須驗證 assignment hash、Maker execution分離與 reviewed artifact hash。Canonical serialization使用固定key order、UTF-8、no insignificant whitespace與normalized arrays。

#### Host-owned compile provenance binding

`CR-HNS-EXEC-003-001` clarification: `context/v3` has no repository provenance. The existing host compile adapter records the supplied `ContextCompilerInput.repository` at the actual compile transaction, before profile admission. Through the existing repository/source boundary, the host independently verifies the canonical resolved root, repository identity, exact branch and full Git commit object ID against that supplied repository, both before compilation and after reads complete. A changed repository snapshot or unverified source read prevents receipt issuance. A standalone compiler result plus a later caller-asserted commit is insufficient.

For each successful actual compile, the host owns a deep-frozen receipt with exactly the logical payload below and `receipt_hash`:

```text
{execution_id, context_hash, repository: {identity, root, branch, commit}}
receipt_hash = SHA-256(canonical UTF-8 payload without receipt_hash)
```

`execution_id` is the actual compile input execution ID; `context_hash` is the recomputed SHA-256 of the actual returned manifest without its hash field. Repository fields are the verified actual compile input, not inferred from the manifest or reconstructed at build time. Root uses the existing canonical root resolution; identity and branch compare exactly, and commit uses the host repository's full lowercase Git object ID (40 or 64 hex, not a ref or abbreviated SHA). Hashes use lowercase 64 hex. The host binds the receipt to the exact returned immutable context snapshot and its compile transaction. This is a local host-boundary receipt, not a Context/Profile schema field, a new filesystem/store, signing service or enforcement subsystem; `spec_versions` remains specification versions only.

The Builder's existing host construction boundary provides a private, independently host-owned receipt lookup/verification dependency, keyed by `(execution_id, context_hash)`. Its wiring and records belong to the trusted host compile adapter; neither `build(input)` nor an Agent may supply, register, replace or authorize a receipt or verifier. The public Section 21 `build` shape and Sections 5.3/5.5 interface shapes are unchanged. The host verifies receipt origin against its own actual-compile record, not a caller-set owner flag or a callback returning `true`; receipt SHA-256 establishes integrity, never ownership by itself. Absent trusted host construction/actual-compile registration, the Builder must reject, including library callers who directly invoke the pure compiler.

Before returning a Profile, the Builder independently recomputes context and receipt hashes, obtains the exact host-owned record, and compares receipt execution to both context and profile execution; it compares all four receipt repository fields to `input.repository` (`commit` to `commit_before`) and the current independently host-verified repository snapshot. Mismatched root, identity, branch, commit, execution or context, mutable/tampered receipts, missing receipts, and superseded records fail closed even if a caller recomputes all supplied hashes. Existing task/role/policy/review/gate checks still apply.

Within a host execution correlation, the same key and identical payload/actual snapshot may be read repeatedly for an idempotent build before admission. The same key with a different repository payload or different compile origin is a collision and is rejected; it must never overwrite or select an arbitrary receipt. A new execution cannot reuse another execution's receipt. After profile admission, a stale, superseded or completed/cancelled execution record cannot authorize a fresh admission; retries follow Section 35's original execution correlation and must use the host's still-active identical compile record. Restart/loss of that trusted record requires fresh host compilation and execution binding, not reconstruction from caller data. A changed context hash (including on-demand expansion) requires its own verified host compile receipt before subsequent profile admission; the prior receipt cannot authorize it. These checks use existing host transaction/admission state and do not require a new persistence subsystem.

Bounded contract examples (`A` and `B` denote distinct full commit IDs, `h` an actual manifest hash):

| Case | Actual host record / build input | Expected outcome |
|---|---|---|
| C1 positive | Host compiled `(exec-1,h,repo-1,/repo,feature,A)`; all Builder fields and current host snapshot agree; hashes recompute | Admit immutable Profile with `commit_before=A`; identical active pre-admission read/build is idempotent |
| C2 negative | Same Context, caller asserts `B`, another root/repo/branch or `exec-2` | Reject each mismatch; caller-supplied assertions cannot substitute for actual compile provenance |
| C3 negative | Pure compiler produced a valid Context but no host receipt; caller supplies a valid self-hashed receipt or caller-controlled verifier | Reject missing independent host ownership/actual compile origin |
| C4 negative | Receipt payload changes without its hash; or attacker recomputes receipt hash after changing payload | Reject integrity failure in the first case and host-record mismatch in the second |
| C5 negative | A second compile claims `(exec-1,h)` for repo/commit `B`; or repository moves from `A` to `B` during compilation or before build | Reject collision or stale snapshot; do not issue/overwrite a receipt or admit a profile |
| C6 negative | Replay receipt after execution closure/supersession, after trusted host-record loss, or for changed context hash `h2` | Reject fresh admission; require actual host compile registration for the active execution/context |

Traceability: Section 5.5 / 16.1 closes `HNS-EXEC-003-PREFLIGHT-001` gap 1; this Section 21 binding closes gap 2. They support `AC-HNS-007`, `AC-HNS-EXEC-003-001`, `AC-HNS-EXEC-003-003`, `AC-HNS-EXEC-003-004` and clarification ACs `001-001` through `001-004` in `work-items/HNS-EXEC-003-CONTRACT-CLARIFICATION-001.md`. This candidate requires fresh independent SPEC/Security review and Spec Gate before canonical downstream use; historical approval metadata is not approval of these changed bytes. Runtime implementation and original EXEC-003 HIGH reviewer assignments remain separate.

`profile_hash = SHA-256(canonical profile without profile_hash)`。Profile deep-freeze後交給Adapter；任何field變更都必須建立新execution ID、重新compile context / policy並產生新hash。Adapter不得修改或補填permission。

## 22. Adapter Interface

```ts
interface AgentAdapter {
  readonly id: string;
  prepare(profile: ExecutionProfile): Promise<PreparedAdapter>;
  checkCapabilities(profile: ExecutionProfile): Promise<AdapterCapability>;
  applyPermissions(profile: ExecutionProfile, prepared: PreparedAdapter): Promise<EnforcementPlan>;
  launch(profile: ExecutionProfile, plan: EnforcementPlan): Promise<SessionHandle>;
  sendContext(session: SessionHandle, manifest: ExecutionContextManifest): Promise<void>;
  monitor(session: SessionHandle): AsyncIterable<RuntimeEvent>;
  terminate(session: SessionHandle, reason: string): Promise<TerminationResult>;
  collectResult(session: SessionHandle): Promise<AdapterResult>;
}
```

Adapter contract：

- `prepare` 不產生side effect beyond host-owned temporary plan。
- `checkCapabilities` 回報實際effective capability，不回報理論或prompt guidance。
- Required hard capability若為soft / unsupported，回傳`HNS-ADP-002 ADAPTER_CAPABILITY_MISMATCH`。
- `applyPermissions` 只能忠實映射或縮小Profile。
- `launch` 只能在EnforcementBackend確認hard plan後執行。
- Vendor events必須正規化；raw event可由redacted host reference保留，不直接當Audit schema。
- Unknown vendor behavior標示`ADAPTER CAPABILITY TO VERIFY`並阻止critical profile launch。

## 23. Claude Adapter Design

Inputs：immutable ExecutionProfile、resolved working directory、host enforcement plan、redacted context delivery bundle、adapter config reference。Credential只由host secure source提供給vendor process所需最小範圍，Agent context與audit不可見。

Process design：

1. Validate adapter ID and working directory。
2. Probe effective filesystem / tool / approval / event / termination capabilities。
3. Map tool allow / deny and permission policy only through verified vendor surface。
4. Apply host filesystem、environment、credential與command boundary before launch。
5. Launch child process / SDK session throughProcessPort。
6. Deliver explicit Context Manifest content；`CLAUDE.md`只作soft guidance。
7. Normalize events、capture exit、support timeout / termination。
8. Return AdapterResult with artifact references，not unbounded raw transcript。

`CLAUDE.md`、prompt或Agent自述不能承擔deny_write、secret isolation、repository escape或destructive command boundary。Future hook integration只能使用host-controlled、Agent不可寫設定；hook capability、vendor permission precedence、headless event completeness與exact launch mechanism均為`ADAPTER CAPABILITY TO VERIFY`，實作前不得虛構CLI option。

## 24. Codex Adapter Design

Inputs與security invariants同AgentAdapter。Codex adapter採受監控child process model；exact executable mode、JSON event shape、approval / sandbox option與configuration precedence均為`ADAPTER CAPABILITY TO VERIFY`。

Process design：

1. Set verified Project Repo working directory，不接受Agent改cwd到repo外。
2. Build host-controlled launch environment allowlist。
3. Map Profile sandbox / approval requirements to verified capability；host enforcement仍為critical boundary。
4. Deliver explicit governance、Work Item與Context Manifest，不只依賴`AGENTS.md` automatic discovery。
5. Ingest structured event stream when verified；unstructured fallback不能宣稱complete audit capability。
6. Enforce process timeout、signal escalation與process-tree termination。
7. Normalize result、files changed、commands、tools與exit reason。

Full access / sandbox bypass不屬v0.1 normal profile。無法證明write、credential、command或termination boundary時回傳capability mismatch / enforcement unavailable，不啟動Agent。

## 25. Enforcement Backend

```ts
interface EnforcementBackend {
  assess(profile: ExecutionProfile, capability: AdapterCapability): Promise<EnforcementAssessment>;
  apply(profile: ExecutionProfile, assessment: EnforcementAssessment): Promise<EnforcementPlan>;
  launch(plan: EnforcementPlan, request: ProcessLaunchRequest): Promise<EnforcedProcess>;
  terminate(process: EnforcedProcess, reason: string): Promise<TerminationResult>;
}
```

Soft enforcement：Prompt、`AGENTS.md`、`CLAUDE.md`、Context Package、Work Item、Gate instructions。它們說明intent，不構成security proof。

Hard boundary至少覆蓋：

- `deny_write` and repository escape。
- Secret / credential access and environment filtering。
- Destructive command interception / denial。
- Production resource / credential boundary。
- Process cwd、child tree、timeout與termination。

Backend capability來源可以是OS sandbox、host process wrapper或verified vendor enforcement。Critical control只要soft、unsupported或不可觀測，回傳`HNS-ENF-001 ENFORCEMENT_CAPABILITY_UNAVAILABLE`。Post-run diff只是detection，不得取代prevention。

## 26. Command Classifier

```ts
type CommandClass =
  | "SAFE_READ"
  | "DEVELOPMENT_WRITE"
  | "RESTRICTED_DESTRUCTIVE"
  | "RESTRICTED_DEPLOYMENT"
  | "RESTRICTED_CREDENTIAL";

interface CommandRequest {
  readonly executable: string;
  readonly args: readonly string[];
  readonly cwd: string;
  readonly env_names: readonly string[];
  readonly shell?: Readonly<{ source: string; ast?: unknown }>;
}

interface CommandClassification {
  readonly command: string;
  readonly args: readonly string[];
  readonly cwd: string;
  readonly env: readonly string[];
  readonly classification: CommandClass;
  readonly reason: readonly string[];
  readonly approval_required: boolean;
  readonly normalized_hash: string;
}
```

Strategy：

- Default使用`spawn(executable, args, { shell: false })`類型argv execution；不把整串user string交給shell。
- Registry以executable identity + parsed subcommand + option semantics + resource class判斷，不使用單純`contains("rm")`。
- 需要shell時先以完整shell grammar parser產生AST；parse failure直接restricted。
- Compound command逐node分類，整體取最高風險；`&&`、`||`、`;`不降低風險。
- Pipe兩側分別分類；資料流到write / network / credential sink提升風險。
- Redirect解析target path與mode；`>`、`>>`、heredoc、process substitution必須納入write / injection判斷。
- Subshell、command substitution、eval、dynamic executable與opaque script預設restricted。
- Quoting在parser AST階段處理；classifier不得自行strip quote後重新解讀。
- Environment assignment若涉及secret name或loader injection屬`RESTRICTED_CREDENTIAL`。

Classifier只判斷；Command Enforcement決定deny / approval / execute。未知command default deny或restricted，不自動視為safe read。

## 27. Runtime Monitor

RuntimeEvent type直接使用第5.4節enum。Monitor responsibilities：

```text
receive vendor / enforcement events
→ validate sequence and execution ID
→ normalize timestamp / payload
→ verify policy hash
→ redact
→ append audit event
→ evaluate stop conditions
→ continue / request approval / terminate
```

Sequence從1單調遞增；timestamp使用UTC RFC 3339；execution ID與policy hash每event required。Event reorder、duplicate、gap或hash mismatch產生runtime failure。Monitor對`POLICY_VIOLATION`、unauthorized write / tool、spec conflict、audit failure或termination-required stop condition呼叫EnforcementBackend terminate；不能只通知Agent自行停止。

## 28. Approval Handler

ApprovalRequest fields：approval ID、execution ID、operation、operation hash、risk class、reason、requested / expiry time、policy hash。Decision只允許`APPROVED`、`REJECTED`、`EXPIRED`。

Flow：

```text
normalize operation and resource
→ hash exact operation
→ persist REQUESTED
→ present risk and exact effect
→ human decision
→ persist decision
→ revalidate not expired + same policy / operation hash
→ execute once or deny
```

Approval record使用one-time nonce；operation args、resource、cwd、environment、policy hash或execution ID任一改變即失效。Production deploy approval不能重用於其他command。Agent、Adapter、Reviewer與Runtime Monitor都不能產生`APPROVED`。

Project Proposal approval由Project Approval Coordinator管理，不與runtime Approval Handler混用。

## 29. Gate Runner

```ts
interface GateRunner {
  resolveRequiredGates(workItem: WorkItem, governance: GovernanceIndex): Promise<readonly GateId[]>;
  resolveRequiredReviews(workItem: WorkItem, risk: RiskClass, artifact: HashedFileRef): Promise<readonly ReviewAssignment[]>;
  validateReviewEvidence(assignments: readonly ReviewAssignment[], evidence: readonly RoleCompletionEvidence[]): Promise<void>;
  runGate(gate: GateId, input: GateRunInput): Promise<GateResult>;
  recordGateResult(result: GateResult, audit: AuditSink): Promise<void>;
}
```

Runner只orchestrate `SPEC_GATE`、`DESIGN_GATE`、`IMPLEMENTATION_GATE`、`DELIVERY_ASSURANCE_GATE`、`RELEASE_GATE`；criteria只讀`.ai/gates/**`的active document與hash。Work Item可增加Gate，不能移除Workflow mandatory gate。`REVIEW` Work Item必須明列被審查artifact / delivery manifest、hash、profile與Gate。

GateResult status正規化為`PASS`、`FAILED`、`NEEDS_CLARIFICATION`，包含evidence、UTC timestamp、artifact / gate definition hashes與reviewer identity。`FAILED` / required clarification阻止execution進`COMPLETED`；record failure本身也fail closed。

Review evidence驗證先於 Gate criteria：Maker / Checker execution相同、profile非系統指派、required review缺失、artifact hash stale或 `OPEN BLOCKING` finding都直接阻止 Gate PASS。QA / Security requirement由 Risk Policy計算；Agent不能以 Work Item prose移除。

## 30. Audit Design

Host-owned conceptual layout；本次不建立：

```text
<state-root>/executions/<execution-id>/
  execution.json
  context.json
  policy.json
  profile.json
  events.jsonl
  gates.json
  review-assignments.json
  role-evidence.jsonl
  findings.jsonl
  delivery-assurance.json
  approvals.json
  result.json
```

Design：

- Directory不位於Agent writable repo；Agent只透過host event channel被觀察。
- `events.jsonl` append-only；每event含sequence、timestamp、previous event hash與current hash。
- Context、Policy、Profile、Gate definition / result與final result存content hash。
- Review assignment、Role Completion Evidence、Finding transition與 Delivery Assurance Result全部append-only / content-addressed；Agent不可寫 state root。
- Finalization以atomic write建立immutable`result.json`，內含events head hash；重複finalize相同hash為idempotent，不同內容衝突。
- Tamper detection重算hash chain、artifact hashes與final references；v0.1不宣稱WORM。
- Redaction在write前執行：token、credential、authorization、secret env value、sensitive path payload移除或不可逆摘要。
- Audit write / flush failure回傳`HNS-AUD-001`並終止execution。
- Retention依第44節；不同project / repo使用separate namespace與ownership metadata。

## 31. Configuration

Conceptual config locations：

```text
<user-config-root>/harness/config.yaml       # host / operator defaults
<project-repo>/.harness/config.yaml          # non-secret project constraints, optional
```

Project config只能縮小host policy，不能擴權。Merge precedence：built-in secure defaults → host config → project narrowing → invocation narrowing。Unknown key或schema version fail validation。

```yaml
schema_version: harness.config/v1
framework:
  repository: string
github:
  default_owner: string
  default_visibility: private
adapters:
  preference: [codex, claude]
audit:
  path: string
context:
  initial_max_files: 24
  initial_max_sections: 64
  initial_max_bytes: 1048576
  hard_max_files: 200
  hard_max_sections: 1000
  hard_max_bytes: 20971520
timeouts:
  process_seconds: number
environment:
  allowlist: [NAME]
```

Initial Context Budget採small-by-default且可由host設定；project config與invocation只能縮小，不能超過host Hard Safety Ceiling。Core只使用bytes、file count與section count，不依賴vendor tokenizer。Config禁止API key、GitHub PAT、Claude credential、OpenAI credential與其他secret value；只允許secure credential source identifier。Audit path必須是host-owned且不在Agent write scope。

## 32. Environment Variables

Environment分級：

| Class | Visibility | Examples / Rule |
|---|---|---|
| Harness-owned | Parent process only | state root、policy / audit internals、credential source references |
| Adapter-visible | Vendor launcher minimum | verified adapter configuration；secret only when vendor process strictly requires it |
| Agent-visible | Explicit allowlist | locale、non-secret tool settings、task-safe values |
| Denied | Never propagated | unrelated `process.env`、cloud / production / package registry / SSH credentials |

Child environment從空baseline建立，再逐項allowlist copy；不得`{...process.env}`全量傳遞。Secret value不進Context、Profile、log或Audit；Adapter-visible secret由short-lived host injection提供，且子process tree termination後撤銷 / 清除reference。

## 33. Error Model

所有module使用`HarnessError`與中央catalog；CLI不需要HTTP status。`cause`保留typed / redacted inner error，禁止將vendor raw secret寫入message。

| Code | Name / Default Message | Retryable | Human Action | Lifecycle Mapping | Exit |
|---|---|---:|---:|---|---:|
| `HNS-INPUT-001` | `INVALID_INPUT` | No after same input | Maybe | `FAILED_RUNTIME` / no start | 2 |
| `HNS-INTAKE-001` | `INTENT_UNCLEAR` | Yes after clarification | Yes | `BLOCKED_MISSING_INFO` | 2 |
| `HNS-INTAKE-002` | `MISSING_CRITICAL_REQUIREMENT` | Yes after answer | Yes | `BLOCKED_MISSING_INFO` | 2 |
| `HNS-REPO-001` | `REPOSITORY_NAME_CONFLICT` | Yes with approved target change | Yes | `REPO_CREATION_FAILED` | 8 |
| `HNS-REPO-002` | `REPOSITORY_CREATION_FAILED` | Conditional | Maybe | `REPO_CREATION_FAILED` | 8 |
| `HNS-BOOT-001` | `BOOTSTRAP_FAILED` | Conditional from journal | Maybe | `REPO_CREATION_FAILED` / provisioning failed | 8 |
| `HNS-WI-001` | `WORK_ITEM_INVALID` | No until corrected | Maybe | no execution / `FAILED_RUNTIME` | 2 |
| `HNS-CTX-001` | `CONTEXT_BUILD_FAILED` | Conditional | Maybe | `FAILED_RUNTIME` | 3 |
| `HNS-CTX-002` | `MISSING_REQUIRED_CONTEXT` | Yes after context fix | Maybe | no start / blocked | 3 |
| `HNS-POL-001` | `POLICY_BUILD_FAILED` | Conditional | Maybe | `FAILED_RUNTIME` | 4 |
| `HNS-POL-002` | `POLICY_CONFLICT` | No until policy resolved | Yes when governance conflict | `BLOCKED_PERMISSION` / conflict | 4 |
| `HNS-ADP-001` | `ADAPTER_UNAVAILABLE` | Yes with compatible adapter | No | `FAILED_RUNTIME` | 5 |
| `HNS-ADP-002` | `ADAPTER_CAPABILITY_MISMATCH` | Yes with capability change | Maybe | `FAILED_RUNTIME` | 5 |
| `HNS-ENF-001` | `ENFORCEMENT_CAPABILITY_UNAVAILABLE` | No in same environment | Yes | no launch / `FAILED_RUNTIME` | 5 |
| `HNS-PERM-001` | `UNAUTHORIZED_WRITE` | No for same operation | No | `BLOCKED_PERMISSION` | 4 |
| `HNS-PERM-002` | `UNAUTHORIZED_TOOL` | No for same operation | No | `BLOCKED_PERMISSION` | 4 |
| `HNS-CMD-001` | `RESTRICTED_COMMAND` | After valid approval / new task | Yes when approvable | running blocked / cancelled | 4 |
| `HNS-SPEC-001` | `SPEC_GAP` | After canonical spec update | Yes | `BLOCKED_SPEC_GAP` | 3 |
| `HNS-SPEC-002` | `SPEC_CONFLICT` | After authority resolution | Yes | `BLOCKED_SPEC_CONFLICT` | 3 |
| `HNS-GATE-001` | `GATE_FAILED` | After artifact correction | Maybe | `FAILED_GATE` | 6 |
| `HNS-RISK-001` | `RISK_DOWNGRADE_REJECTED` | New trusted classification only | Maybe | `BLOCKED_PERMISSION` | 4 |
| `HNS-RVW-001` | `SELF_APPROVAL_REJECTED` | Yes with independent execution | No | no review start / `FAILED_GATE` | 6 |
| `HNS-RVW-002` | `REQUIRED_REVIEW_MISSING` | Yes after assignment / review | Maybe | `FAILED_GATE` | 6 |
| `HNS-RVW-003` | `REVIEWED_ARTIFACT_CHANGED` | Yes with new artifact hash / review | No | `FAILED_GATE` | 6 |
| `HNS-FND-001` | `OPEN_BLOCKING_FINDING` | Yes after authorized resolution | Maybe | `FAILED_GATE` | 6 |
| `HNS-ASR-001` | `DELIVERY_ASSURANCE_FAILED` | Yes after findings / reviews resolved | Maybe | `FAILED_GATE` | 6 |
| `HNS-APR-001` | `APPROVAL_REQUIRED` | Yes after decision | Yes | waiting / no operation | 7 |
| `HNS-APR-002` | `APPROVAL_REJECTED` | No for same operation | Yes to create new request | `CANCELLED` or continue without optional op | 7 |
| `HNS-RUN-001` | `RUNTIME_FAILED` | Conditional | Maybe | `FAILED_RUNTIME` | 5 |
| `HNS-AUD-001` | `AUDIT_WRITE_FAILED` | No during unsafe continuation | Yes | `FAILED_RUNTIME` + terminate | 5 |

Module-specific details放`details`，但code / exit不自行發明。Error Factory要求每個throw site附execution / session correlation ID與safe cause category。

## 34. Exit Code Design

| Exit Code | Category | Meaning |
|---:|---|---|
| 0 | Success | Command完成且required gates / writes符合command semantics |
| 1 | Generic | 未分類internal failure；應視為需要補catalog的defect |
| 2 | Input / Intake / Work Item | CLI input、intent、requirement或Work Item invalid |
| 3 | Spec / Context | Spec gap / conflict、missing context、context build failure |
| 4 | Permission / Policy / Command | Policy conflict、unauthorized operation、restricted command |
| 5 | Adapter / Enforcement / Runtime / Audit | Adapter、hard enforcement、process或audit failure |
| 6 | Gate | Required Gate failed / needs clarification |
| 7 | Approval | Required approval pending、rejected或expired |
| 8 | Repository / Bootstrap | Repository target、creation、transaction或bootstrap failure |

CLI只有`errors/exit-code-registry`決定exit code；module回傳HarnessError，不直接`process.exit()`。`status` / `inspect`成功顯示failed record仍exit 0；執行command本身遇到該failure才回分類code。

## 35. Idempotency

| Operation | Deterministic / Idempotent Design | Retry Policy | Never Auto-Retry When |
|---|---|---|---|
| Project Proposal generation | Same Context revision + framework pin + builder version yields same canonical proposal hash | Safe before approval | Context / pin changed or prior proposal approved |
| Repository availability check | Read-only normalized result with timestamp outside identity hash | Bounded transient retry | Authentication / authorization denied |
| Repository creation | Transaction ID + proposal hash idempotency key and provider read-back | Conditional | Target exists with different provider ID / owner |
| Bootstrap | Manifest hash + framework SHA + repo ID; journaled steps | Resume incomplete idempotent steps | Unknown files、hash drift、destructive cleanup needed |
| Work Item generation | Canonical inputs + allocator reservation; render / parse round-trip | Retry before commit with same reservation | Specs / scope / role changed |
| Risk classification | Canonical trigger inputs + classifier version yield same assignment hash | Safe | Artifact / policy / trigger set changed |
| Review assignment | Maker evidence + Risk + artifact hash + profile registry yield sorted assignment set | Safe before dispatch | Artifact hash、Maker execution或 Risk changed |
| Finding transition | Finding ID + expected prior status + evidence hash | Safe same transition | Conflicting status / unauthorized accepted risk |
| Delivery assurance | Candidate manifest hash + required review / Gate evidence | Safe for same immutable candidate | Candidate、finding、review或 Gate changed |
| Context compilation | Pure for same commit / inputs / compiler version | Safe | Repository changed during read |
| Policy compilation | Pure canonical set operations | Safe | Source hash / host baseline changed |
| Gate recording | Gate result ID + artifact hashes; same payload no-op | Safe after read-back | Same ID has different result |
| Audit finalization | Execution ID + final event head hash | Same content only | Different final content / incomplete event flush |

所有write operation先read-back current state。Retry attempt有新attempt ID，但保留original transaction / execution correlation。

## 36. Concurrency

v0.1 invariants：

- 同一 Work Item同時最多一個active execution。
- 同一 review assignment同時最多一個active Reviewer execution；不同 required profiles可並行read-only review同一 immutable artifact hash。
- 任一 review期間 artifact hash改變，所有 affected review executions取消 / invalidate，Gate等待新 assignments完成。
- 同一intake session同時最多一個state-mutating command；`status` / `inspect`可並行read。
- 同一repo可並行read-only task；write task只有在branch不同、compiled write scopes可證明不重疊、Git index / worktree分離時才允許。
- Scope pattern無法證明disjoint時採conservative serialization。
- Repository provisioning以provider + owner + repo name取得exclusive transaction lock。

Lock design：

```text
<state-root>/locks/
  intake-<session-id>.lock
  work-item-<repo-id>-<task-id>.lock
  repo-write-<repo-id>-<scope-hash>.lock
  provision-<provider>-<owner>-<name>.lock
```

Lock record含owner process、host ID、execution ID、created / heartbeat / expiry timestamp與scope hash。Acquire使用OS atomic create / lock primitive；不能只靠檔案存在。Crash後只有確認owner process不存在且lease expired才能由recovery取代，並寫audit event。

Approval等待期間execution lock保持heartbeat，防止另一execution偷接同一Work Item；超時後execution轉failed / cancelled再釋放。每個execution用unique directory，Audit sequence由單一Recorder serialization，避免collision。

## 37. Git Design

```ts
interface GitIntegration {
  getRepositoryIdentity(cwd: string): Promise<RepositoryIdentity>;
  getBranch(repo: RepositoryIdentity): Promise<string>;
  getCommit(repo: RepositoryIdentity): Promise<string>;
  getStatus(repo: RepositoryIdentity): Promise<GitStatus>;
  createBranch(repo: RepositoryIdentity, name: string, from: string): Promise<GitRefResult>;
  stageFiles(repo: RepositoryIdentity, paths: readonly string[]): Promise<void>;
  commit(repo: RepositoryIdentity, message: string, expectedDiffHash: string): Promise<CommitIdentity>;
  push(repo: RepositoryIdentity, branch: string, expectedRemote: string): Promise<PushResult>;
  getDiff(repo: RepositoryIdentity, base?: string): Promise<GitDiff>;
}
```

Rules：

- All methods use argv execution, normalized repo root and sanitized output。
- `stageFiles`只接受Work Item Write Scope內的explicit paths；禁止default `add -A`。
- Commit前驗證diff hash、branch、Work Item scope與required checks evidence。
- 一般Agent不得commit / push `main`或`develop`；work branch從最新`develop`建立，透過PR回`develop`。
- Release到`main`依existing Git policy取得human approval。
- 唯一bootstrap exception只由Repository Provisioner使用，綁定approved transaction與manifest；一般GitIntegration caller不可請求此mode。
- Force push、history rewrite、remote delete屬restricted destructive operation。
- Credential由host Git / secure source使用，不進Agent environment或Audit plain text。

## 38. Security Design

| Threat | Control |
|---|---|
| Path traversal / `../` | Canonical PathResolver + repository-root containment + deny-first policy |
| Absolute / UNC / drive escape | Path class validation；project artifact只允許repo-relative |
| Symlink / chain / swap escape | Bounded realpath resolution + cycle detection + pre-write recheck + hard sandbox |
| Secret isolation failure | Empty child env baseline、secure source injection、redaction、no secret in Context / Profile |
| Environment leakage | Explicit name allowlist；deny cloud / SSH / registry / production variables |
| Subprocess escape | `shell:false` argv default、process-tree ownership、timeout、termination |
| Command injection | Full grammar parse for shell、unknown / dynamic command restricted |
| Shell metacharacter bypass | AST classification for pipe、redirect、subshell、compound commands |
| Unauthorized file write | Governance ∩ Role ∩ Work Item ∩ Host ∩ Adapter + hard enforcement |
| Tool bypass | Registered tool IDs、deny wins、unknown tool denied、Runtime Monitor |
| Credential leakage in logs | Structured redaction before persistence；raw vendor error sanitized |
| Audit tampering | Host-owned append-only store、hash chain、Agent no write access |
| Git credential theft | Git credential stays host-side；no command echo / env propagation |
| Main branch bypass | GitIntegration policy + host branch protection where available |
| Repository ownership confusion | Provider repo ID、remote URL、owner、branch、commit assertions before operation |
| Floating framework source | Immutable framework commit pin + source hash verification |
| Bootstrap supply-chain attack | Manifest allowlist、COPY hash、EXCLUDE、no executable condition / shell |
| Adapter compromise | Adapter trust boundary、least environment、host enforcement、capability verification |
| Prompt injection from source | Mark untrusted content、structured context classes、policy compiled outside model |
| Network escape | Deny unless Work Item + host + verified adapter capability explicitly allow；critical requirement unavailable fails |

Security-sensitive configuration、approval signing material、Audit store與credential source必須在Agent write boundary之外。Threat control沒有hard implementation proof時，SDD status必須保持unverified，不可宣稱secure。

## 39. Observability

Structured log envelope：

```ts
interface LogEvent {
  readonly timestamp: string;
  readonly level: "DEBUG" | "INFO" | "WARN" | "ERROR";
  readonly component: string;
  readonly event: string;
  readonly execution_id?: string;
  readonly session_id?: string;
  readonly task_id?: string;
  readonly role?: WorkItemRole;
  readonly phase?: WorkItemPhase;
  readonly adapter?: string;
  readonly state_transition?: Readonly<{ from: string; to: string }>;
  readonly duration_ms?: number;
  readonly gate_result?: GateResultStatus;
  readonly blocked_action?: string;
  readonly details?: Readonly<Record<string, unknown>>;
}
```

Levels：DEBUG是redacted diagnostic；INFO是lifecycle / normal side effect；WARN是recoverable anomaly / pending approval；ERROR是failed / blocked operation。每個Agent execution至少記start、state transitions、adapter capability result、blocked actions、gate results、duration與final status。Metric可由events離線彙整；v0.1不建remote telemetry。Secret、prompt全文、credential、authorization header與raw environment禁止log。

## 40. Test Design

Test pyramid：大量pure unit → port / adapter contract → bounded integration →少量end-to-end pilot。Live GitHub / vendor tests使用專用non-production account / fixture repo並需explicit opt-in；default suite不執行外部side effect。

### 40.1 Unit Tests

| Module | Main Scenarios |
|---|---|
| Intent Classifier | six intents、explicit existing repo、low confidence clarification、no Implementer fallback |
| State Transition | every legal transition、illegal transition、hash mismatch、retry / cancel |
| Project Context / Proposal | schema、revision、proposal hash changes、approval binding |
| Bootstrap Manifest / Planner | operation kinds、duplicate target、path / source / pin hash、deterministic plan |
| Repository Transaction | state journal、read-back、idempotent retry、partial failure、no destructive cleanup |
| Work Item Generator | v2 deterministic ID / AC、Risk assignment input、review fields、gate mapping、scope intersection、round-trip |
| Work Item Parser | v2 metadata、Risk、profile / artifact / hash、v1 migration rejection、references、AC、Gate、duplicate / missing fields |
| Risk Classifier | artifact / path / auth / migration / payment / credential / production / destructive triggers、highest-risk wins、downgrade rejection |
| Review Assignment Resolver | required profile calculation、Maker / Checker separation、one profile per execution、artifact hash binding |
| Finding Registry | severity / status transitions、accepted-risk authority、open blocking query、append-only history |
| Delivery Assurance Coordinator | candidate manifest、required reviews / gates、stale hash、open finding、release eligibility |
| Dispatch Coordinator / Role Resolver | role-only selection、capability mismatch、no vendor authority、no bypass |
| Context Compiler | Tier 0 / 1 / 2、initial budget、section extraction / fallback reason、content deduplication、on-demand authorization / audit、same hash、concurrent file drift |
| Policy Compiler | multi-source intersection、deny union、adapter shrink、conflict、stable hash |
| Path Resolver | traversal、absolute、case、Unicode、symlink chain / cycle / swap fixture |
| Command Classifier | argv、compound、pipe、redirect、subshell、quote、unknown command、env assignment |
| Profile Builder | cross-artifact mismatch、deep freeze、stable hash、gate requirements |
| Approval Handler | operation hash、expiry、one-time use、changed args rejection |
| Gate Runner | five canonical gates、mandatory review evidence、artifact hash、open finding、failure prevents complete |
| Runtime Monitor | event sequence / gap、policy hash、termination trigger、vendor normalization |
| Audit Recorder | sequence、hash chain、redaction、flush failure、idempotent finalize |
| Config / Environment | precedence only narrows、unknown key、secret rejection、empty child baseline |
| Lock Manager | single Work Item execution、scope overlap、stale owner recovery、approval wait |
| Error / Exit Registry | every catalog error maps exactly one exit code |

### 40.2 Contract Tests

| Port / Adapter | Contract Scenarios |
|---|---|
| Claude Adapter | immutable profile input、capability report、permission narrowing、event normalization、termination、unsupported hard control fails |
| Codex Adapter | same shared adapter suite plus cwd / timeout / result normalization |
| GitHub Repository Port | availability、create idempotency、read-back、credential redaction、provider failures |
| GitIntegration | explicit stage paths、branch policy、diff hash、main denial、bootstrap-only capability |
| Enforcement Backend | deny_write、env isolation、command interception、repo escape、terminate |
| Audit Store | append-only、atomic finalize、tamper detection、project namespace isolation |
| Intake State Store | atomic revision、resume integrity、cancel terminal state、corrupt snapshot failure |
| Command Runner | argv preservation、no implicit shell、timeout / process-tree termination |

### 40.3 Integration Tests

- Natural Language → classification → minimal clarification → Project Proposal。
- Proposal approval → mock Repository Provisioner → bootstrap journal READY。
- Host Project Context → redacted `docs/01_sources/**` projection → initial Spec Work Item reference。
- Bootstrap failure → partial repo marked failed, no automatic delete。
- Spec Work Item → parser → Context / Policy / Profile → fake PRODUCT_ARCHITECT adapter → Spec Gate。
- Spec Maker → self review → independent SPEC_REVIEWER → Spec Gate。
- Design Work Item → UX adapter → independent UX_REVIEWER → Design Gate。
- Implementation Work Item → Implementer adapter → TECH / risk-required QA / Security reviews → Implementation Gate。
- Delivery candidate → DELIVERY_ASSURANCE_REVIEWER → Delivery Assurance Gate → Release Gate。
- Existing Project Change → no repo creation → delta Work Item。
- Large fixture repo加入大量unrelated documents → identical Work Item initial Context Manifest不變。
- Referenced Architecture / SDD section → section-only Context entry；unresolvable integrity case記錄full-document fallback reason。
- Duplicate canonical content references → one Manifest entry；authorized on-demand request建立新context hash與audit evidence。
- Gate failure / approval rejection / Audit failure propagation。

### 40.4 Security and Failure Tests

- Path traversal、symlink escape / race、case bypass。
- Unauthorized write / tool、policy deny bypass、unknown command。
- Secret / process.env leakage、log / Audit redaction。
- Shell injection through quote、pipe、redirect、subshell。
- GitHub unavailable / name conflict / partial bootstrap。
- Adapter unavailable / capability mismatch / event gap / timeout。
- Gate failed、approval rejected / expired、Audit disk / permission failure。
- Self approval rejection、Maker / Checker execution identity collision。
- Artifact hash change invalidates prior review PASS。
- Risk assignment highest-trigger / Agent downgrade rejection。
- Required reviewer calculation；missing QA / Security review blocks applicable Gate。
- `OPEN BLOCKING` finding blocks Delivery Assurance。
- Delivery Assurance missing / failed blocks Release Gate。
- On-demand context request超出Role、Read Scope、Policy或Hard Safety Ceiling時被拒絕且留下audit evidence。

Fixtures必須synthetic且不含real token。Security regression test未通過不得release。

## 41. MVP Acceptance Criteria

- `AC-HNS-001`：使用者可由自然語言產生包含repo target、features、stack與open questions的Project Proposal。
- `AC-HNS-002`：缺少匹配`proposal_hash`的`APPROVE_PROJECT`時，RepositoryProvisioner不會create repo。
- `AC-HNS-003`：Approved Project可透過mock / verified provider初始化private Project Repo、`main`、`develop`與bootstrap commit。
- `AC-HNS-004`：Project metadata可追溯immutable framework repository + commit SHA。
- `AC-HNS-005`：Work Item由系統生成、可round-trip parse並通過`templates/Work_Item.md` validation。
- `AC-HNS-006`：相同repo commit與Context inputs產生相同`context_hash`。
- `AC-HNS-007`：Effective Policy不超過Governance、Role、Work Item、Host與Adapter任一allow boundary。
- `AC-HNS-008`：超出Write Scope或命中Forbidden Scope的write在hard boundary被阻擋並audit。
- `AC-HNS-009`：Claude Adapter可接受immutable Execution Profile；hard capability不足時fail closed。
- `AC-HNS-010`：Codex Adapter可接受immutable Execution Profile；hard capability不足時fail closed。
- `AC-HNS-011`：Required Gate為FAILED / NEEDS_CLARIFICATION時execution無法成為`COMPLETED`。
- `AC-HNS-012`：Audit artifacts與hash chain可重建context、policy、events、approval、gate與final evidence。
- `AC-HNS-013`：Existing Project Change / Bug / Design / Technical intent不呼叫RepositoryProvisioner create。
- `AC-HNS-014`：Denied secret與未allowlist environment variable不出現在Agent env、log或Audit。
- `AC-HNS-015`：正常`harness start` / generated task流程不要求使用者輸入Work Item、Role、Phase或scope。
- `AC-HNS-016`：Maker與 final Checker execution相同時，Review Assignment被拒絕。
- `AC-HNS-017`：Artifact hash變更後，先前 Review PASS與 dependent Gate evidence失效。
- `AC-HNS-018`：相同 canonical Risk inputs產生相同 Risk與 required Reviewer set；Agent無法降低。
- `AC-HNS-019`：Risk-required QA / Security evidence缺失或存在 `OPEN BLOCKING` finding時，對應 Gate無法 PASS。
- `AC-HNS-020`：缺少有效 `DELIVERY_ASSURANCE_GATE` PASS時，Release Gate無法 PASS。
- `AC-HNS-021`：大型fixture repo增加大量unrelated documents時，同一Work Item的initial Context Manifest不得因此加入unrelated documents或改變context hash。
- `AC-HNS-022`：可解析的Architecture / SDD section reference只載入referenced section與必要heading ancestry，不得預設載入full document。
- `AC-HNS-023`：同一canonical content不得因AGENTS、Work Item、SDD、prompt或多個reference而重複出現在Context Package。
- `AC-HNS-024`：On-demand context只能在active Role、Work Item Read Scope、effective Policy及Context Budget允許時加入，且request、decision與resulting context hash必須留下audit evidence。

## 42. Non-Functional Requirements

| Quality | Verifiable Target |
|---|---|
| Security | Every filesystem / command / tool operation is evaluated against immutable policy；critical hard capability unavailable prevents launch |
| Reliability | State-changing orchestration and provisioning use journal + idempotency keys；crash recovery never reports unverified success |
| Determinism | Same canonical Context / Policy / Risk / Review inputs and compiler version yield byte-identical artifact, assignment set and hash |
| Auditability | Every execution has contiguous event sequence、source hashes、approval / gate evidence and immutable final record or explicit audit failure |
| Portability | Core / schemas / ports run on selected Node LTS across supported OS；OS-specific enforcement isolated behind adapter and contract tests |
| Performance | Initial context small-by-default；Section 43 budgets在content delivery前enforced；no unbounded repo scan、duplicate canonical content或transcript accumulation |
| Maintainability | Dependency direction architecture test passes；one schema / logger / error / exit registry；strict TypeScript build has zero errors |
| Extensibility | New Agent / repository adapter implements port contract without core import of vendor package or Contract change |

## 43. Performance Boundary

Core budget使用vendor-neutral bytes、file count與section count，不使用vendor tokenizer作為correctness dependency。

Operational execution / context targets、aggregate token telemetry 與 stop / resume 依 `.ai/WORKFLOW.md#bounded-execution-economy`，只縮小下列 host defaults / ceilings；此文件修訂不代表 runtime enforcement 已實作。

### 43.1 Initial Context Budget

Initial Context採small-by-default。下列是host secure defaults；host可依環境調整，但不得超過Hard Safety Ceiling，project / invocation只能縮小：

| Initial Boundary | Default Target | Behavior When Exceeded |
|---|---:|---|
| Context files | 24 | Section extraction → deduplicate → defer Tier 2；mandatory Tier 1仍超過時explicit fail或由host調整budget |
| Extracted sections | 64 | 保留direct references，defer optional Tier 2；不得改載full document |
| Total context bytes | 1 MiB | 移除duplicate、defer optional content、改on-demand；不得silent truncate或summarize canonical requirement |

Initial Context Budget是正常execution target，不是安全極限。Manifest必須記錄實際使用量、deferred entries與選擇原因。

### 43.2 Hard Safety Ceiling

Hard Safety Ceiling是任何initial或on-demand Context都不可超過的host boundary：

| Boundary | Default | Behavior When Exceeded |
|---|---:|---|
| Indexed repository entries | 20,000 | Require narrower references / ignore rules；do not full-scan |
| Context files | 200 | `CONTEXT_BUILD_FAILED` with largest contributors |
| Extracted sections | 1,000 | Stop compile；require narrower references |
| Single context file | 1 MiB | Exclude optional；required file causes explicit failure |
| Total context bytes | 20 MiB | Stop compile；never truncate silently |
| Work Item Markdown | 256 KiB | `WORK_ITEM_INVALID` |
| Process runtime | 30 minutes | Graceful terminate then hard timeout escalation；Work Item / host may narrow |
| Runtime events per execution | 100,000 | Stop execution before audit loss |
| Audit bytes per execution | 100 MiB | Fail closed or approved external sink；do not drop security events |
| Symlink resolution depth | 32 | Reject path |

File index讀metadata first；content只在selection後讀。Large repo依canonical references、traceability與Work Item scope運作，不以「全部可能有用」為理由載入。On-demand loading也受相同Hard Safety Ceiling與剩餘budget約束。

## 44. Data Retention

- Host-owned intake / execution / audit state依project namespace分離，包含repo provider ID與owner metadata。
- v0.1預設不自動刪除evidence；保留到operator依組織policy手動cleanup，避免destructive background action。
- System在state root達到host-configured warning threshold時WARN；達hard limit時拒絕新execution，不刪舊audit。
- Manual cleanup必須在Harness外由authorized human執行，先列出session / execution、age、project與size；本次不設計cleanup command implementation。
- Secret redaction在寫入前完成；retention不使secret storage合法化。
- Project被刪除不自動刪host audit；兩者lifecycle獨立。

## 45. Deployment and Distribution Design

v0.1 runtime environment：developer workstation、pinned Node runtime、Git、GitHub secure credential、Claude / Codex executable or SDK where applicable。Harness以local parent process管理state、child process與approval terminal channel。

Distribution proposal：未來可發布private npm package / internal CLI，使用lockfile、integrity verification與pinned package version。Global command只是thin launcher；core state / config仍依OS app-data resolver。

不設計Production server、Kubernetes、Cloud SaaS或Docker isolation platform。Production deployment automation不在v0.1。Vendor executable discovery與minimum capability由`harness doctor`驗證，不因已安裝就假設安全。

## 46. Development Order

| Phase | Objective | Modules | Prerequisites | Acceptance / Dependency |
|---:|---|---|---|---|
| 1 | 建立typed foundation | `core`、accountability types、`schemas`、`errors`、`config`、canonical hash | Independently Approved SDD | Strict build；schema / error / hash tests；all later phases depend |
| 2 | Parse and generate Work Items | Work Item v2、Markdown AST port、Risk / review fields、fixtures | Phase 1、Work Item Contract | v2 round-trip、v1 migration rejection、all malformed tests pass |
| 3 | Compile deterministic Context | `context`、traceability index、PathResolver read side | Phases 1-2 | Same input hash、scope / size / path tests pass |
| 4 | Compile Policy | `policy`、path pattern algebra、host baseline port | Phases 1-3 | Intersection / deny / hash tests pass |
| 5 | Persist state and evidence | `audit`、role evidence、findings、review assignments、intake state、locks、approval records | Phase 1 | Append / hash / finding lifecycle / recovery / redaction / lock tests pass |
| 6 | Build task execution core | `execution`、profile builder、lifecycle、`enforcement` ports | Phases 3-5 | Fake enforced process runs; stop conditions / profile freeze pass |
| 7 | Add fake adapter, review / assurance, gates, Git port | fake `AgentAdapter`、Risk / Review Resolver、Finding Registry、Assurance、`gates`、`git` | Phases 2、5-6 | Work Item → independent review → five Gates without vendor side effect |
| 8 | Implement Codex adapter | `adapters/codex` capability mapping | Phase 6-7 + capability verification | Shared adapter contract suite and hard-boundary pilot pass |
| 9 | Implement Claude adapter | `adapters/claude` capability mapping | Phase 6-7 + capability verification | Shared adapter contract suite and hard-boundary pilot pass |
| 10 | Implement Project Intake | `intake`、`orchestration`、risk / review generation、proposal / session CLI | Phases 1、5、7 | Natural language → proposal / reviews / resume / cancel integration passes |
| 11 | Implement Repo Provisioning | `repository`、`bootstrap`、GitHub adapter、transaction journal | Phases 1、5、7、10 | Mock provider transaction / partial failure / approval tests pass |
| 12 | End-to-End Pilot | `dispatch` wiring、all CLI commands、packaging | Phases 1-11 | AC-HNS-001 through AC-HNS-024 pass in controlled pilot |

每Phase以work branch / PR進`develop`，不直接改`main`。Adapter phase前必須完成對應blocking capability decision；未解決不可用prompt substitute。

## 47. Technical Debt Prevention

| Risk | Prevention Rule |
|---|---|
| Vendor logic leaking into core | Architecture import test；vendor package只在`adapters/**` |
| Duplicate Work Item schema | `templates/Work_Item.md`唯一Contract；types / JSON schema為versioned projection with contract tests |
| Duplicate Authority | SDD / code只引用治理文件，不建立runtime override order |
| Prompt-only security | Critical controls require EnforcementBackend capability proof |
| Floating framework version | Bootstrap requires commit SHA and source hashes |
| Oversized context | References + bounded index + file / total limits；no silent truncation |
| Mutable Execution Profile | Canonical hash + deep freeze；change requires new execution |
| Silent fallback | Unknown intent / adapter / command / schema fail closed with catalog error |
| Catch-all errors | Central error catalog；exit 1 treated as missing design defect |
| Leaking `process.env` | Build child env from empty allowlist |
| Unsafe shell execution | argv default；shell AST parse or restricted |
| Agent-writable audit | State root outside repo and deny Agent access |
| Git `main` bypass | GitIntegration branch policy + host protection；bootstrap capability separate |
| Hardcoded project paths | RepositoryIdentity + PathResolver；all project paths relative |
| Adapter capability assumptions | Runtime capability report + contract tests + `ADAPTER CAPABILITY TO VERIFY` |
| God orchestrator | One use-case per component、ports、no business logic in CLI |
| Non-idempotent side effects | Transaction journal、idempotency key、read-back before retry |
| Self approval disguised as review | Maker / Checker execution identity validation；prompt label never establishes independence |
| Agent-selected Risk / Reviewer | Host-owned Risk Classifier and Review Assignment Resolver；downgrade fails closed |
| Stale review PASS | Artifact hash binding；change invalidates review and dependent Gate evidence |
| Gate / Review enum collapse | Distinct ReviewDecision and GateResultStatus types + contract tests |

## 48. Open Questions

### BLOCKING

1. **Initial hard-enforcement platform**：v0.1 首個正式支援的host OS / sandbox backend尚未由Contract指定。Phase 6前必須選定reference platform與可驗證deny-write、env isolation、process termination機制；其他OS可先fail capability check。
2. **Codex capability mapping**：filesystem sandbox、approval、structured events與termination的effective mapping仍是`ADAPTER CAPABILITY TO VERIFY`。Phase 8前需以official capability與spike / contract test確認。
3. **Claude capability mapping**：permission precedence、headless event completeness、host-controlled hook / termination boundary仍是`ADAPTER CAPABILITY TO VERIFY`。Phase 9前需確認。
4. **GitHub provisioning transport**：GitHub App、host PAT API client或host `gh` CLI何者作v0.1 production adapter尚未決定。Phase 11前需依credential isolation、idempotency與error observability選定一種；port不變。

### NON_BLOCKING

1. Internal npm package name與distribution registry可在Phase 12決定，不影響module design。
2. Model-assisted Intent Classifier provider可替換；v0.1可先用deterministic + pluggable classifier port。
3. Organization-specific audit retention period未定；v0.1安全預設是不自動刪除。
4. Remote WORM audit、GUI approval與additional agent adapters明確不在v0.1。

## 49. Traceability

| Upstream Requirement | Architecture Component | SDD Module / Section | Test Category |
|---|---|---|---|
| Project Intake Contract 1-3：purpose、UX、intent | Intent Classifier / Intake Orchestrator | `intake`；Sections 7-9 | Unit + Natural Language integration |
| Project Intake Contract 4-5：lifecycle、clarification | Discovery Manager / Intake Orchestrator | Sections 8、10 | State transition + clarification integration |
| Project Intake Contract 6-7：Project Context、naming | Project Context Builder | Sections 5.1、11 | Schema + revision + repo-relative source projection + naming tests |
| Project Intake Contract 8：Proposal / approval | Proposal Builder / Approval Coordinator | Sections 12、28 | Hash binding + rejection tests |
| Project Intake Contract 9：Provisioning | Repository Provisioner | Sections 13-14、37 | Repository contract + partial failure |
| Project Intake Contract 10：Bootstrap Manifest | Bootstrap Manager | Sections 15、20、38 | Manifest + path + hash security |
| Project Intake Contract 11：Initial specs | Specification Generation Orchestrator | Sections 16、18、29 | Spec Work Item integration |
| Project Intake review / Risk integration | Risk Classifier / Review Assignment Resolver | Sections 5.2、5.5、16-19、29 | Risk、self-approval、required review tests |
| Project Intake Contract 12-13：dispatch / work items | Work Item Generator / Dispatch Coordinator | Sections 16-17、22 | Work Item round-trip + adapter dispatch |
| Project Intake Contract 14-15：Git / human approvals | GitIntegration / Approval components | Sections 28、37 | Branch policy + approval reuse tests |
| Project Intake Contract 16-18：audit、failure、validation | Audit Recorder / Error Catalog | Sections 30、33-34、40-41 | Audit + failure + MVP acceptance |
| Harness Contract 1-3：purpose、input、role | Input Validator / Role Resolver | Sections 4-7、17、21 | Input / role / profile unit tests |
| Harness Contract 4：Context Compiler | Context Compiler | Sections 5.3、18、31、43 | Tier / budget、section extraction、deduplication、on-demand authorization、determinism tests |
| Harness Contract 5：Filesystem Boundary | Policy / Enforcement / Path Resolver | Sections 19-20、25 | Unauthorized write + escape security |
| Harness Contract 6：Tool Boundary | Policy Compiler / Adapter | Sections 19、22-25 | Tool deny + capability contract |
| Harness Contract 7：Command Boundary | Command Classifier / Enforcement | Sections 25-26 | Shell / restricted command security |
| Harness Contract 8-10：lifecycle、stop、CR | Execution Core / Runtime Monitor | Sections 21、27、33 | State / stop / spec conflict failure |
| Harness Contract 11：Gate Integration | Gate Runner | Section 29 | Gate failure prevents complete |
| Harness Contract 12：Audit | Audit Recorder | Sections 30、39、44 | Hash chain + redaction + retention |
| Harness Contract 13：Accountability / Assurance | Risk、Reviews、Findings、Assurance | Sections 5.5、16-19、29-30、33、40-41 | Separation / stale hash / assurance tests |
| Harness Contract 14-16：adapters / non-goals | AgentAdapter / Enforcement | Sections 22-25、45 | Shared adapter contract + capability fail |
| Architecture Project Orchestration Plane | Intake + Risk + Review Assignment + Assurance components | Sections 3、8-16、35-37 | End-to-end orchestration integration |
| Architecture Task Execution Plane | Runtime components | Sections 17-34 | Unit + contract + integration + security |
| Architecture v0.1 Boundary | Full modular monolith | Sections 2-4、41-47 | AC-HNS-001..024 + architecture checks |
| Work Item Contract v2 | Work Item Generator / Parser | Sections 5.2、6、16-17 | Canonical template / migration contract suite |
| Role Accountability canonical governance | Review / Finding / Assurance modules | Sections 5.5、18-19、29-30、40 | Professional evidence + independence tests |

## 50. Final Self Review

| Check | Result | Evidence |
|---|---|---|
| 1. Covers both Architectural Planes | PASS | Source tree、orchestration Sections 8-16、runtime Sections 18-30 |
| 2. Does not redefine Authority | PASS | Section 1 subordinates SDD and conflict handling |
| 3. Does not redefine Work Item schema | PASS | Sections 5.2、16-17 explicitly project from `templates/Work_Item.md` |
| 4. Every component has module owner | PASS | Sections 3-5 and Traceability matrix |
| 5. Every major module has interface | PASS | Port registry and pseudo interfaces in Sections 4.1、9、13、16-30、37 |
| 6. Major structures have schema | PASS | Sections 5-6、15、31 |
| 7. Failures have error code | PASS | Section 33 catalog + Section 34 exit registry |
| 8. Side effects have owner | PASS | Repository、Bootstrap、Git、Execution、Approval ports |
| 9. Restricted operations have approval | PASS | Sections 25-29、37-38 |
| 10. Path / secret / subprocess security exists | PASS | Sections 20、25-26、32、38 |
| 11. Claude / Codex remain adapters | PASS | Dependency rule + Sections 22-24 |
| 12. Project Intake and Task Runtime separated | PASS | Modules、Work Item handoff、separate state machines |
| 13. Can split into engineering tasks | PASS | Section 46 phases and acceptance dependencies |
| 14. No code implementation started | PASS | Governance / design / plan / Work Items only；no runtime source、package或 install |
| 15. Architecture / Contract conflict | NONE FOUND | Section 49 traceability; open questions are implementation choices |
| 16. SDD approval separation | REVIEW REQUIRED | Status is `Review`; this Maker execution does not approve it |
| 17. Context economy contract | PASS | Tier model、section extraction、content deduplication、on-demand audit、initial budget與hard ceiling位於Sections 5.3、18、31、40-43 |
