import type { ArtifactReference, ReviewProfile, RiskClass, WorkItemRole } from "../core/domain.js";

export interface RiskAssignment {
  readonly schema_version: "harness.risk-assignment/v1";
  readonly risk_class: RiskClass;
  readonly trigger_ids: readonly string[];
  readonly source_hashes: readonly string[];
  readonly classifier_version: string;
  readonly assignment_hash: string;
}
export interface RiskClassificationInput {
  readonly work_item_id: string;
  readonly artifact_type: string;
  readonly changed_paths: readonly string[];
  readonly trigger_facts: readonly string[];
  readonly source_hashes: readonly string[];
}
export interface RiskPolicy {
  readonly version: string;
  readonly rules: readonly string[];
  readonly policy_hash: string;
}
export interface ReviewAssignment {
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
