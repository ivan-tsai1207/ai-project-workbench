import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { ContextCompiler } from '/Users/ivan/Documents/Codex/系統開發框架/.orchestration/hns-core-005-r4.hn6GJU/repo/harness/dist/context/compiler.js';

const root = '/virtual/repository';
const wi = { id: 'HNS-EXEC-002', role: 'IMPLEMENTER', risk_class: 'HIGH', review_profile: null, feature: 'minimal-execution-engine', phase: 'IMPLEMENTATION', required_gates: ['IMPLEMENTATION_GATE'] };
const boundary = { read_scope: ['docs/**', 'work-items/**'], policy_read_scope: ['docs/**', 'work-items/**'], forbidden_scope: ['docs/private/**'] };
const budgets = { max_bytes: 8192, max_files: 20, max_sections: 20 };
const workSource = { path: 'work-items/HNS-EXEC-002.md', context_class: 'work_item', tier: 'TIER_1_MANDATORY', reason: 'assigned WI' };
const source = { path: 'docs/alias.md', context_class: 'delivery', tier: 'TIER_1_MANDATORY', reason: 'direct reference' };
function fixture(target = root + '/docs/alias.md') {
  const reads = [];
  return { reads, async resolve(p) { return p === source.path ? target : root + '/' + p; }, async read(p) { reads.push(p); return p.includes('HNS-EXEC-002') ? '# Assigned WI\n' : 'PRIVATE_SENTINEL'; } };
}
function input(sources) { return { execution_id: 'security-fresh', work_item: wi, repository: { root, identity: 'repo-1', branch: 'feature/context', commit: '1f11ff00fae30415a12674fd56ddea71c34a16e3' }, sources, boundary, required_gates: wi.required_gates, initial_budget: budgets, hard_safety_ceiling: budgets }; }
const results = [];
for (const target of [root + '/.env', root + '/docs/private/secret.md']) {
  const p = fixture(target), c = new ContextCompiler(p);
  let decision, manifest;
  try { manifest = await c.compile(input([workSource, source])); decision = 'LOADED'; } catch (e) { decision = e.details?.failure ?? e.message; }
  results.push({ check: 'canonical-target-initial', target, decision, reads: p.reads, exposed_entry: manifest?.delivery_context[0] });
  const q = fixture(target), d = new ContextCompiler(q), base = await d.compile(input([workSource]));
  const ondemand = await d.requestContext(base, { request_id: 'alias-read', execution_id: base.execution_id, requested_path: source.path, reason: 'directly affected boundary probe' }, { ...boundary, context_budget: budgets }, root);
  results.push({ check: 'canonical-target-on-demand', target, decision: ondemand.status, reason: ondemand.reason, reads: q.reads, exposed_entry: ondemand.manifest_entry });
}
const deniedProvider = fixture();
await assert.rejects(new ContextCompiler(deniedProvider).compile(input([workSource, { ...source, path: '.env' }])));
assert.equal(deniedProvider.reads.length, 0);
results.push({ check: 'logical-sensitive-denied-before-read', result: 'PASS' });
const outsideProvider = fixture('/outside/secret.md');
await assert.rejects(new ContextCompiler(outsideProvider).compile(input([workSource, source])), e => e.details?.failure === 'CANONICAL_PATH_OUTSIDE_REPOSITORY');
assert.equal(outsideProvider.reads.includes('/outside/secret.md'), false);
results.push({ check: 'outside-realpath-denied-before-read', result: 'PASS' });
const report = { started: new Date().toISOString(), candidate: '1f11ff00fae30415a12674fd56ddea71c34a16e3', results };
writeFileSync(new URL('./security-probes.json', import.meta.url), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));
