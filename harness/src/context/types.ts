import type {
  GateId,
  ReviewProfile,
  RiskClass,
  WorkItem,
  WorkItemPhase,
  WorkItemRole,
} from "../core/domain.js";

export const CONTEXT_TIERS = [
  "TIER_0_BOOTSTRAP",
  "TIER_1_MANDATORY",
  "TIER_2_ON_DEMAND",
] as const;

export type ContextTier = (typeof CONTEXT_TIERS)[number];

export const CONTEXT_CLASSES = [
  "bootstrap",
  "governance",
  "delivery",
  "source",
  "design",
  "work_item",
] as const;

export type ContextClass = (typeof CONTEXT_CLASSES)[number];

export interface ContextBudget {
  readonly max_bytes: number;
  readonly max_files: number;
  readonly max_sections: number;
}

export interface ContextUsage {
  readonly bytes: number;
  readonly files: number;
  readonly sections: number;
}

export interface ContextManifestEntry {
  readonly path: string;
  readonly section?: string;
  readonly anchor?: string;
  readonly content_sha256: string;
  readonly reason: string;
  readonly tier: ContextTier;
  readonly full_document_fallback_reason?: string;
}

export interface ExcludedRef {
  readonly path: string;
  readonly reason: string;
}

export interface ExecutionContextManifest {
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

export interface ContextSourceRef {
  readonly path: string;
  readonly context_class: ContextClass;
  readonly tier: ContextTier;
  readonly reason: string;
  readonly section?: string;
  readonly anchor?: string;
  readonly expected_content_sha256?: string;
  readonly required?: boolean;
  readonly sensitivity?: "PUBLIC" | "SENSITIVE";
  readonly allow_full_document_fallback?: boolean;
}

export interface ContextSourceProvider {
  resolve(path: string): Promise<string>;
  read(canonicalPath: string): Promise<string | Uint8Array>;
}

export interface ContextReadBoundary {
  readonly read_scope: readonly string[];
  readonly policy_read_scope: readonly string[];
  readonly forbidden_scope: readonly string[];
}

export interface ContextCompilerInput {
  readonly execution_id: string;
  readonly work_item: WorkItem;
  readonly repository: Readonly<{
    readonly root: string;
    readonly identity: string;
    readonly branch: string;
    readonly commit: string;
  }>;
  readonly sources: readonly ContextSourceRef[];
  readonly boundary: ContextReadBoundary;
  readonly required_gates: readonly GateId[];
  readonly initial_budget: ContextBudget;
  readonly hard_safety_ceiling: ContextBudget;
  readonly spec_versions?: Readonly<Record<string, string>>;
}

export interface OnDemandContextRequest {
  readonly request_id: string;
  readonly execution_id: string;
  readonly requested_path: string;
  readonly section?: string;
  readonly anchor?: string;
  readonly reason: string;
  readonly expected_content_sha256?: string;
  readonly allow_full_document_fallback?: boolean;
}

export interface ContextReadPolicy extends ContextReadBoundary {
  readonly context_budget: ContextBudget;
}

export interface ContextBudgetDelta {
  readonly bytes: number;
  readonly files: number;
  readonly sections: number;
}

export interface OnDemandDecisionAudit {
  readonly before_context_hash: string;
  readonly after_context_hash: string;
  readonly budget_before: ContextUsage;
  readonly budget_after: ContextUsage;
  readonly budget_delta: ContextBudgetDelta;
}

export interface OnDemandContextDecision {
  readonly request_id: string;
  readonly status: "LOADED" | "DENIED" | "DEFERRED";
  readonly manifest_entry?: ContextManifestEntry;
  readonly reason: string;
  readonly resulting_context_hash?: string;
  readonly resulting_manifest?: ExecutionContextManifest;
  readonly audit: OnDemandDecisionAudit;
}
