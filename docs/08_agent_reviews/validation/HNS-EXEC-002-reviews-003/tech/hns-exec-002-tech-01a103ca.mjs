import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
const repo='/Users/ivan/Documents/Codex/系統開發框架/.orchestration/hns-core-005-r4.hn6GJU/repo';
const base=repo+'/docs/08_agent_reviews/validation/HNS-EXEC-002-resume-002/';
const prefix='/private/tmp/hns-exec-002-tech-01a103ca';
const runtime='/private/tmp/hns-exec-runtime.56wper/node-v24.19.0-darwin-arm64/bin';
const candidate='bdcd60bb36e30e63855f06bbcb06923eb9b02e1f';
const sha=b=>createHash('sha256').update(b).digest('hex');
const json=p=>JSON.parse(readFileSync(p));
const git=(...args)=>execFileSync('git',args,{cwd:repo,encoding:'utf8'}).trim();
const start=new Date().toISOString();
const inputs=json(base+'inputs.json');
const results=json(base+'results.json');
assert.equal(results.candidate,candidate);
assert.equal(sha(readFileSync(base+'inputs.json')),results.input_sha256);
const differences=[];
for(const [p,h] of inputs){
 assert.equal(sha(readFileSync(repo+'/'+p)),h,p+' current');
 const blob=execFileSync('git',['show',candidate+':'+p],{cwd:repo});
 if(sha(blob)!==h) differences.push(p);
}
assert.deepEqual(differences,['work-items/HNS-EXEC-002.md']);
const executable=git('ls-tree','-r','--name-only',candidate,'harness/src','harness/tests','harness/package.json','harness/package-lock.json','harness/tsconfig.json').split('\n');
const listed=new Set(inputs.map(([p])=>p));
assert.deepEqual(executable.filter(p=>!listed.has(p)),[]);
assert.equal(git('diff',candidate,'--','harness'),'');
const manifestPath='docs/08_agent_reviews/manifests/HNS-EXEC-002-implementation-r2.md';
const manifest=readFileSync(repo+'/'+manifestPath,'utf8');
assert.equal(sha(manifest),'eae9aa1501c359f18b02d71e5ba09df3675445c01c7de19dff222f2bdea91c72');
for(const match of manifest.matchAll(/\| `(harness\/[^`]+)` \| `sha256:([a-f0-9]{64})` \|/g)) assert.equal(sha(readFileSync(repo+'/'+match[1])),match[2]);
assert.equal(git('rev-parse',candidate+'^{tree}'),'d11d92ffd07bff68100dad7d390bb79c009ce339');
assert.equal(git('rev-parse',candidate+'^'),'ee569fc0d8244bd6fcf78f2aeca5ccf40992093d');
const commands={node:['--version'],npm:['--version'],ci:['ci'],build:['run','build'],typecheck:['run','typecheck'],test:['test'],context:['--test','tests/unit/context/compiler.test.mjs'],audit:['audit','--audit-level=high','--json']};
assert.deepEqual(results.results.map(r=>r.name),Object.keys(commands));
let priorEnd=null;
for(const r of results.results){
 assert.equal(r.exit,0); assert.equal(r.signal,null);
 assert.equal(r.cwd,repo+'/harness');
 assert.equal(r.executable,runtime+'/'+(['node','context'].includes(r.name)?'node':'npm'));
 assert.deepEqual(r.args,commands[r.name]);
 assert.ok(r.start<=r.end && r.end<=start);
 if(priorEnd) assert.ok(r.start>=priorEnd); priorEnd=r.end;
 for(const stream of ['stdout','stderr']) assert.equal(sha(readFileSync(base+r.name+'.'+stream+'.log')),r[stream+'_sha256']);
 assert.equal(readFileSync(base+r.name+'.stderr.log','utf8'),'');
}
assert.equal(readFileSync(base+'node.stdout.log','utf8').trim(),'v24.19.0');
assert.equal(readFileSync(base+'npm.stdout.log','utf8').trim(),'11.17.0');
for(const [name,count] of [['test',181],['context',11]]) {
 const out=readFileSync(base+name+'.stdout.log','utf8');
 assert.match(out,new RegExp('(?:# |[ℹ] )tests '+count));
 assert.match(out,/(?:# |ℹ )fail 0/);
}
assert.equal(json(base+'audit.stdout.log').metadata.vulnerabilities.total,0);
const dist=json(base+'dist-inputs.json');
for(const [p,h] of dist) assert.equal(sha(readFileSync(repo+'/'+p)),h,p+' dist');
const beforeStatus=git('status','--porcelain');
const freshStart=new Date().toISOString();
const focused=spawnSync(runtime+'/node',['--test','tests/unit/context/compiler.test.mjs'],{cwd:repo+'/harness',encoding:'utf8',env:{...process.env,PATH:runtime+':'+process.env.PATH},timeout:20000});
writeFileSync(prefix+'.focused.stdout.log',focused.stdout??'');
writeFileSync(prefix+'.focused.stderr.log',focused.stderr??'');
assert.equal(focused.status,0,focused.stderr);
assert.match(focused.stdout,/(?:# |ℹ )tests 11/);
assert.match(focused.stdout,/(?:# |ℹ )fail 0/);
const report={start,end:new Date().toISOString(),reviewer:process.env.CODEX_THREAD_ID,candidate,head:git('rev-parse','HEAD'),branch:git('branch','--show-current'),inputs:inputs.length,executableInputs:executable.length,candidateDifferences:differences,inputHash:results.input_sha256,manifestHash:sha(manifest),distFiles:dist.length,distInventoryHash:sha(readFileSync(base+'dist-inputs.json')),reusedCommands:results.results.length,reusedTests:181,reusedContext:11,auditVulnerabilities:0,freshStart,freshEnd:new Date().toISOString(),freshExit:focused.status,freshTests:11,statusBefore:beforeStatus,statusAfter:git('status','--porcelain'),candidateToHeadPaths:git('diff','--name-only',candidate,'HEAD').split('\n'),rootWorkItemDiff:git('diff',candidate,'--','work-items/HNS-EXEC-002.md'),candidateScope:git('diff','--name-only','77f93daef6f880ac9a548ac0a088137f51c74041',candidate),remediationScope:git('diff','--name-only','ee569fc0d8244bd6fcf78f2aeca5ccf40992093d',candidate)};
writeFileSync(prefix+'.verification.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
