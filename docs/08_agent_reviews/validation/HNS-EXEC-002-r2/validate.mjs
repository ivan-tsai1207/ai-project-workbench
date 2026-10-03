import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
const repo = '/Users/ivan/Documents/Codex/系統開發框架/.orchestration/hns-core-005-r4.hn6GJU/repo';
const dir = '/private/tmp/hns-exec-002-remediation-20261003T2142';
const bin = '/private/tmp/hns-exec-runtime.56wper/node-v24.19.0-darwin-arm64/bin';
const env = { ...process.env, PATH: `${bin}:${process.env.PATH}` };
const inventory = [];
function collect(path) { for (const e of readdirSync(join(repo, path), { withFileTypes: true })) { const p = `${path}/${e.name}`; if(e.isDirectory()) collect(p); else inventory.push([p, createHash('sha256').update(readFileSync(join(repo,p))).digest('hex')]); } }
for (const p of ['harness/src','harness/tests']) collect(p);
for (const p of ['harness/package.json','harness/package-lock.json','harness/tsconfig.json','work-items/HNS-EXEC-002.md','docs/harness_v0.1_SDD.md']) inventory.push([p, createHash('sha256').update(readFileSync(join(repo,p))).digest('hex')]);
writeFileSync(join(dir,'inputs.json'), JSON.stringify(inventory.sort(),null,2));
const results = [];
for (const [name, executable, args] of [
 ['node',`${bin}/node`,['--version']], ['npm',`${bin}/npm`,['--version']],
 ['ci',`${bin}/npm`,['ci']], ['build',`${bin}/npm`,['run','build']],
 ['typecheck',`${bin}/npm`,['run','typecheck']], ['test',`${bin}/npm`,['test']],
 ['context',`${bin}/node`,['--test','tests/unit/context/compiler.test.mjs']],
 ['audit',`${bin}/npm`,['audit','--json']]
]) {
 if (Date.now() >= Date.parse('2026-10-03T21:43:20Z')) { results.push({name,stopped:'deadline checkpoint'}); break; }
 const start = new Date().toISOString();
 const r = spawnSync(executable,args,{cwd:join(repo,'harness'),env,encoding:'utf8',timeout:Math.max(1,Date.parse('2026-10-03T21:43:20Z')-Date.now())});
 writeFileSync(join(dir,`${name}.stdout.log`),r.stdout ?? '');
 writeFileSync(join(dir,`${name}.stderr.log`),r.stderr ?? '');
 results.push({name,executable,args,cwd:join(repo,'harness'),start,end:new Date().toISOString(),exit:r.status,signal:r.signal,error:r.error?.message});
 writeFileSync(join(dir,'results.json'),JSON.stringify({runtime:bin,input_sha256:createHash('sha256').update(readFileSync(join(dir,'inputs.json'))).digest('hex'),results},null,2));
 console.log(name,r.status, (r.stdout ?? '').slice(-500),r.stderr ?? '');
}
