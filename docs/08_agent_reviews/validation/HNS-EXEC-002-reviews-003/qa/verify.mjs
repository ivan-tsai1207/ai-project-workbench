import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync, spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
const repo='/Users/ivan/Documents/Codex/系統開發框架/.orchestration/hns-core-005-r4.hn6GJU/repo';
const out='/private/tmp/HNS-EXEC-002-QA-003.OGx1da';
const candidate='bdcd60bb36e30e63855f06bbcb06923eb9b02e1f';
const bin='/private/tmp/hns-exec-runtime.56wper/node-v24.19.0-darwin-arm64/bin';
const base=repo+'/docs/08_agent_reviews/validation/HNS-EXEC-002-resume-002/';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const read=p=>fs.readFileSync(p);
const git=(...a)=>execFileSync('git',a,{cwd:repo});
const result={start:new Date().toISOString(),reviewer:process.env.CODEX_THREAD_ID,candidate};
const inputs=JSON.parse(read(base+'inputs.json'));
const host=JSON.parse(read(base+'results.json'));
assert.equal(host.candidate,candidate);
assert.equal(hash(read(base+'inputs.json')),host.input_sha256);
const metadata=[];
for(const [p,h] of inputs){
 assert.equal(hash(read(repo+'/'+p)),h,p+' current');
 const ch=hash(git('show',candidate+':'+p));
 if(ch!==h){assert.equal(p,'work-items/HNS-EXEC-002.md');metadata.push({path:p,candidate_sha256:ch,current_sha256:h});}
}
const tracked=git('ls-files','harness/src','harness/tests','harness/package.json','harness/package-lock.json','harness/tsconfig.json').toString().trim().split('\n');
for(const p of tracked)assert.ok(inputs.some(([q])=>q===p),'unlisted executable input '+p);
assert.equal(git('diff',candidate,'--','harness').length,0);
const manifest='docs/08_agent_reviews/manifests/HNS-EXEC-002-implementation-r2.md';
assert.equal(hash(read(repo+'/'+manifest)),'eae9aa1501c359f18b02d71e5ba09df3675445c01c7de19dff222f2bdea91c72');
const manifestText=read(repo+'/'+manifest).toString();
for(const m of manifestText.matchAll(/\| `(harness\/[^`]+)` \| `sha256:([a-f0-9]{64})`/g))assert.equal(hash(read(repo+'/'+m[1])),m[2]);
assert.equal(git('rev-parse',candidate+'^{tree}').toString().trim(),'d11d92ffd07bff68100dad7d390bb79c009ce339');
assert.equal(git('rev-parse',candidate+'^').toString().trim(),'ee569fc0d8244bd6fcf78f2aeca5ccf40992093d');
result.input_count=inputs.length;result.executable_input_count=tracked.length;result.metadata_differences=metadata;
result.host_logs=[];
for(const r of host.results){
 assert.equal(r.cwd,repo+'/harness');assert.equal(r.exit,0);assert.equal(r.signal,null);
 assert.ok(r.executable.startsWith(bin+'/'));
 assert.ok(new Date(r.end)>=new Date(r.start));assert.ok(new Date(r.end)<new Date(result.start));
 const stdout=read(base+r.name+'.stdout.log'),stderr=read(base+r.name+'.stderr.log');
 assert.equal(hash(stdout),r.stdout_sha256,r.name+' stdout');assert.equal(hash(stderr),r.stderr_sha256,r.name+' stderr');
 assert.equal(stderr.length,0);
 result.host_logs.push({name:r.name,args:r.args,start:r.start,end:r.end,stdout_sha256:r.stdout_sha256,stderr_sha256:r.stderr_sha256});
}
assert.equal(read(base+'node.stdout.log').toString().trim(),'v24.19.0');
assert.equal(read(base+'npm.stdout.log').toString().trim(),'11.17.0');
for(const [name,count] of [['test',181],['context',11]]){
 const s=read(base+name+'.stdout.log').toString();
 assert.match(s,new RegExp('(?:#|\\u2139) tests '+count+'\\b'));assert.match(s,new RegExp('(?:#|\\u2139) pass '+count+'\\b'));
 for(const key of ['fail','cancelled','skipped','todo'])assert.match(s,new RegExp('(?:#|\\u2139) '+key+' 0\\b'));
}
assert.equal(JSON.parse(read(base+'audit.stdout.log')).metadata.vulnerabilities.total,0);
const dist=JSON.parse(read(base+'dist-inputs.json'));
for(const [p,h] of dist)assert.equal(hash(read(repo+'/'+p)),h,p+' dist');
result.dist_count=dist.length;result.dist_inventory_sha256=hash(read(base+'dist-inputs.json'));
result.package_lock_sha256=hash(read(repo+'/harness/package-lock.json'));
const installed=JSON.parse(read(repo+'/harness/node_modules/.package-lock.json'));
const lock=JSON.parse(read(repo+'/harness/package-lock.json'));
for(const [p,v] of Object.entries(installed.packages)){
 assert.ok(lock.packages[p],p);assert.equal(v.version,lock.packages[p].version,p);
 if(v.integrity)assert.equal(v.integrity,lock.packages[p].integrity,p+' integrity');
}
result.installed_lock_packages=Object.keys(installed.packages).length;
result.head=git('rev-parse','HEAD').toString().trim();
result.branch=git('branch','--show-current').toString().trim();
result.worktree_status=git('status','--short').toString();
result.scoped_diff=git('diff',candidate,'--','work-items/HNS-EXEC-002.md').toString();
result.environment={NODE_OPTIONS:process.env.NODE_OPTIONS??null,NODE_PATH:process.env.NODE_PATH??null,TZ:process.env.TZ??null};
assert.deepEqual(result.environment,host.environment);
for(const [name,exe,args] of [['node',bin+'/node',['--version']],['npm',bin+'/npm',['--version']],['focused',bin+'/node',['--test','tests/unit/context/compiler.test.mjs']]]){
 const start=new Date().toISOString();
 const r=spawnSync(exe,args,{cwd:repo+'/harness',env:{...process.env,PATH:bin+':'+process.env.PATH},encoding:'utf8'});
 fs.writeFileSync(out+'/'+name+'.stdout.log',r.stdout);fs.writeFileSync(out+'/'+name+'.stderr.log',r.stderr);
 result[name]={start,end:new Date().toISOString(),exit:r.status,signal:r.signal,executable:exe,args,cwd:repo+'/harness',stdout_sha256:hash(r.stdout),stderr_sha256:hash(r.stderr)};
 assert.equal(r.status,0);
}
result.end=new Date().toISOString();result.status='PASS';
fs.writeFileSync(out+'/verification.json',JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));
