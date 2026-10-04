import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const repo = '/Users/ivan/Documents/Codex/系統開發框架/.orchestration/hns-core-005-r4.hn6GJU/repo';
const dir = '/private/tmp/hns-exec-002-maker.QFMdL9';
const git = (...args) => {
  const result = spawnSync('git', args, { cwd: repo, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr);
  return result.stdout.trim();
};
const hash = value => createHash('sha256').update(value).digest('hex');
const mandatory = ['AGENTS.md', '.ai/CONSTITUTION.md', '.ai/AUTHORITY.md', '.ai/WORKFLOW.md', '.ai/roles/implementer.md', '.ai/gates/implementation-gate.md', 'work-items/HNS-EXEC-002.md', '.ai/HARNESS_CONTRACT.md'];
const artifacts = ['harness/src/context/compiler.ts', 'harness/src/context/index.ts', 'harness/src/context/markdown.ts', 'harness/src/context/path.ts', 'harness/src/context/types.ts', 'harness/src/index.ts', 'harness/tests/fixtures/context/sectioned.md', 'harness/tests/unit/context/compiler.test.mjs'];
const sdd = readFileSync(`${repo}/docs/harness_v0.1_SDD.md`, 'utf8').split('\n');
const ranges = [[463,569],[1141,1223],[1549,1585],[1727,1753],[1784,1812],[1902,1938],[1956,1974]];
const selections = mandatory.map(path => ({ path, kind: 'whole-file', bytes: readFileSync(`${repo}/${path}`).length }));
for (const [start,end] of ranges) selections.push({ path: 'docs/harness_v0.1_SDD.md', kind: 'section', start, end, bytes: Buffer.byteLength(sdd.slice(start-1,end).join('\n')+'\n') });
const initial = { unique_files: 9, selected_units: 15, bytes: selections.reduce((sum,x)=>sum+x.bytes,0) };
for (const path of [...artifacts, 'harness/package.json']) selections.push({ path, kind: 'on-demand-whole-file', bytes: readFileSync(`${repo}/${path}`).length, reason: path.endsWith('package.json') ? 'Inspect available validation commands only; no edit authorization' : 'Maker review of assigned candidate artifacts' });
const inputRows = JSON.parse(readFileSync(`${dir}/final-inputs.json`, 'utf8'));
const currentRows = inputRows.map(({path}) => ({path, sha256: hash(readFileSync(`${repo}/${path}`))}));
if (JSON.stringify(currentRows) !== JSON.stringify(inputRows)) throw new Error('Validation input drift');
const report = {
  execution_id: 'HNS-EXEC-002-MAKER-FRESH-20261003T212235Z', role: 'IMPLEMENTER', work_item: 'HNS-EXEC-002',
  started: '2026-10-03T21:22:35Z', evidence_created: new Date().toISOString(),
  preflight_commit: 'eb8347b4bf8874df49f8f52bf00a75876e16d2b1', commit: git('rev-parse','HEAD'), tree: git('rev-parse','HEAD^{tree}'), parents: git('show','-s','--format=%P','HEAD'),
  base: '77f93daef6f880ac9a548ac0a088137f51c74041', old_candidate: '4f2bc723d8fd2338ae08d8bae10413d21c0d50fa',
  artifacts: artifacts.map(path=>({path,sha256:hash(readFileSync(`${repo}/${path}`))})),
  changes_since_develop: git('diff','--name-status','77f93daef6f880ac9a548ac0a088137f51c74041','HEAD'),
  own_changed_files: ['harness/src/context/compiler.ts','harness/tests/unit/context/compiler.test.mjs'],
  input_hash: hash(JSON.stringify(inputRows)), input_hash_verified_after_validation: true,
  commands: JSON.parse(readFileSync(`${dir}/final-commands.json`,'utf8')),
  tests: { canonical: {pass:181,fail:0,skipped:0}, focused: {pass:10,fail:0,skipped:0}, original_focused:{pass:8,fail:0}, regression_before_fix:{pass:8,fail:2} },
  ac_mapping: {
    '001': 'Existing immutable/order-independent canonical serialization/hash regression remains passing; changes do not alter output ordering.',
    '002': 'Existing tier/extraction/fallback/dedup/unrelated exclusion/explicit-source ceiling cases plus one-document multi-section snapshot regression.',
    '003': 'Existing path/sensitivity/scope/containment/hash/gate/budget cases plus repeated selection content drift and expected hash rejection; one compile reads each normalized document once.',
    '004': 'Existing load/deny/defer/tamper/dedup audit tests plus unchanged repeat hashes/zero deltas; permission checks precede revalidation.'
  },
  self_review: { result:'Maker candidate ready for independent review; no Gate approval', scope:'Only two authorized code/test files staged; host metadata untouched', checks:'Diff reviewed, no new dependency/API/capability, no TODO/placeholder/skip/unsafe suppression added; required runtime validations passed; git diff --check exit 0', findings_resolved:'Two initial-validation AC gaps corrected together in this fresh Maker execution; failing regression evidence retained', lint:'No lint/formatter script configured in package.json', integration:'No separate integration command configured; canonical npm test executed as required' },
  context: { initial, all_selections: selections, total_unique_files:18, total_selected_units:24, total_bytes: selections.reduce((sum,x)=>sum+x.bytes,0), accounting:'Unique selected content bytes; excludes duplicate rereads/tool wrappers/metadata/heading navigation listing. Initial counts use original selections; current source lengths include small authorized edits.', deviations:['64 KiB operational TARGET exceeded by full mandatory context plus direct SDD selections; target not claimed met; below SDD host defaults/hard ceilings.', 'On-demand assigned source/tests plus package script inspection increase total files to 18.', 'SDD Section 46 table was read whole (1956-1974) instead of only Phase 3 row; only Phase 3 used for implementation. Erroneous docs/04_system/SDD.md heading lookup returned missing-file without content.'] },
  limitations: ['Host supplies validated WorkItem, explicit source references, effective read boundary, and provider canonical realpath; this module is not a policy compiler or hard sandbox.', 'Tests use bounded virtual provider fixtures; no symlink runtime enforcement claim.', 'npm test excludes context tests; separate focused command recorded.', 'No independent reviewer or Gate result asserted; Parent owns manifest/reviews.', 'Complete historical and parent aggregate execution/time/token telemetry unavailable; this Maker contributes one dispatched execution, no additional agents; token actual/remaining null.'],
  final_status: 'FIXED_MAKER_CANDIDATE', no_push_merge_closure:true,
};
writeFileSync(`${dir}/maker-evidence.json`, JSON.stringify(report,null,2));
const table = '| Artifact | SHA-256 |\n|---|---|\n'+report.artifacts.map(x=>`| ${x.path} | ${x.sha256} |`).join('\n')+'\n';
writeFileSync(`${dir}/artifact-hashes.md`,table);
console.log(JSON.stringify({commit:report.commit,tree:report.tree,parents:report.parents,initial:report.context.initial,total_files:18,total_units:24,total_bytes:report.context.total_bytes,input_hash:report.input_hash}));
