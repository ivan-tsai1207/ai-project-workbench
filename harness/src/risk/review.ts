import { defineCoreValue, REVIEW_PROFILES, type ArtifactReference, type ReviewProfile, type WorkItemRole } from "../core/domain.js";
import type { RiskClassifier } from "./classifier.js";
import type { ReviewAssignment, RiskAssignment } from "./types.js";
import { hashField, hashValue, identifier, relativePath, requireCondition, schema, sorted } from "./validation.js";

export interface ReviewAdmission {
  readonly work_item_id: string;
  readonly risk: RiskAssignment;
  readonly maker_role: Exclude<WorkItemRole, "REVIEWER">;
  readonly maker_execution_ids: readonly string[];
  readonly artifact: ArtifactReference;
  readonly artifact_hash: string;
  readonly security_trigger: boolean;
  readonly qa_required: boolean;
  readonly required_profiles: readonly ReviewProfile[];
  readonly registry: readonly {
    readonly profile: ReviewProfile;
    readonly execution_id: string;
    readonly required_checks: readonly string[];
    readonly required_evidence: readonly string[];
  }[];
}
export interface ReviewAuthority {
  current(workItemId: string): ReviewAdmission;
  artifactHash(artifact: ArtifactReference): string;
}
export class ReviewAssignmentResolver {
  readonly #authority: ReviewAuthority;
  readonly #classifier: RiskClassifier;
  constructor(authority: ReviewAuthority, classifier: RiskClassifier) {
    this.#authority = authority; this.#classifier = classifier;
  }
  resolve(workItemId: string): readonly ReviewAssignment[] {
    const input = defineCoreValue(this.#authority.current(identifier(workItemId)));
    requireCondition(input.work_item_id === identifier(workItemId), "Review task mismatch");
    this.#classifier.verify(input.risk, workItemId);
    const basic = { PRODUCT_ARCHITECT: "SPEC_REVIEWER", UX_DESIGNER: "UX_REVIEWER", IMPLEMENTER: "TECH_REVIEWER" } as const;
    requireCondition(input.maker_role in basic, "Invalid Maker role");
    const required: ReviewProfile[] = [basic[input.maker_role], ...input.required_profiles];
    if (input.qa_required || ["HIGH", "CRITICAL"].includes(input.risk.risk_class)) required.push("QA_REVIEWER");
    if (input.security_trigger || input.risk.risk_class === "CRITICAL") required.push("SECURITY_REVIEWER");
    if (input.risk.risk_class === "CRITICAL") required.push("DELIVERY_ASSURANCE_REVIEWER");
    requireCondition(required.every(profile => REVIEW_PROFILES.includes(profile)), "Unknown review profile");
    const makers = sorted(input.maker_execution_ids);
    requireCondition(makers.length > 0, "Missing Maker identities");
    relativePath(input.artifact.path);
    requireCondition(hashField(input.artifact_hash) === this.#authority.artifactHash(input.artifact), "Stale reviewed artifact");
    const executions = new Set<string>();
    const profiles = new Set<ReviewProfile>();
    for (const entry of input.registry) {
      const execution = identifier(entry.execution_id);
      requireCondition(!makers.includes(execution) && !executions.has(execution) && !profiles.has(entry.profile), "Maker/reviewer or assignment collision");
      executions.add(execution); profiles.add(entry.profile);
    }
    return defineCoreValue([...new Set(required)].sort().map(profile => {
      const entry = input.registry.find(entry => entry.profile === profile);
      requireCondition(entry !== undefined, "Required reviewer profile unassigned");
      const payload = {
        schema_version: "harness.review-assignment/v1" as const,
        assignment_id: `${input.work_item_id}:${profile}:${identifier(entry.execution_id)}`,
        work_item_id: input.work_item_id, risk_class: input.risk.risk_class, review_profile: profile,
        maker_role: input.maker_role, maker_execution_ids: makers,
        reviewed_artifact: input.artifact, reviewed_artifact_hash: input.artifact_hash,
        required_checks: sorted(entry.required_checks), required_evidence: sorted(entry.required_evidence),
      };
      requireCondition(payload.required_checks.length > 0 && payload.required_evidence.length > 0, "Missing review requirements");
      const assignment = { ...payload, assignment_hash: hashValue(payload) };
      schema(assignment); return assignment;
    }));
  }
}
