import { readFileSync } from 'node:fs';
import { GateRunner, ReviewAssignmentResolver } from '../../../dist/index.js';
import { fixture, hash, rawHash } from '../risk/fixtures.mjs';
export function gateFixture() {
  const f = fixture();
  const artifact = { kind: 'implementation', path: 'harness/src/example.ts' };
  let artifactHash = hash('artifact');
  const current = { work_item_id: f.wi.id, risk: f.classifier.classify(f.input, f.policy), maker_role: 'IMPLEMENTER', maker_execution_ids: ['maker'], artifact, artifact_hash: artifactHash, security_trigger: true, qa_required: true, required_profiles: [], registry: ['TECH_REVIEWER','QA_REVIEWER','SECURITY_REVIEWER'].map(profile => ({ profile, execution_id: profile, required_checks: ['check'], required_evidence: ['proof'] })) };
  const resolver = new ReviewAssignmentResolver({ current: () => current, artifactHash: () => artifactHash }, f.classifier);
  const bytes = readFileSync(new URL('../../../../.ai/gates/implementation-gate.md', import.meta.url),'utf8');
  const criteria = bytes.split('## 檢查項目')[1].split('\n## ')[0].split('\n').filter(x=>x.startsWith('- ')).map(x=>({ criterion:x.slice(2).trim(), status:'PASS', evidence:'canonical-check' }));
  const admission = { work_item: f.wi, required_gates:['IMPLEMENTATION_GATE'], mandatory_gates:['IMPLEMENTATION_GATE'], definition:{path:'.ai/gates/implementation-gate.md',bytes,hash:rawHash(bytes)}, criteria, reviews:resolver.resolve(f.wi.id).map(a=>({schema_version:'harness.role-evidence/v1',evidence_id:a.review_profile,execution_id:a.review_profile,work_item_id:f.wi.id,role:'REVIEWER',review_profile:a.review_profile,artifact_refs:[artifact],artifact_hashes:[artifactHash],spec_references:[],checks_performed:[{id:'check',method:'unit',result:'PASS',evidence_reference:'proof'}],tests_performed:[],findings:[],known_limitations:[],result:'PASS',timestamp:'2026-10-04T14:00:00Z'})), findings:[], reviewer:'host-gate' };
  return { runner:new GateRunner({current:()=>admission},resolver), admission, current, id:f.wi.id, artifact, drift:()=>artifactHash=hash('changed') };
}
