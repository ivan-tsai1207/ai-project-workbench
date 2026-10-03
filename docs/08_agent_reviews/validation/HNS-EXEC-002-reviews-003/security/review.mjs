import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,readdirSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
const repo='/Users/ivan/Documents/Codex/系統開發框架/.orchestration/hns-core-005-r4.hn6GJU/repo';
const out='/private/tmp/hns-security-01a103ca-116f-7983-b8e0-79d4873b0401';
const bin='/private/tmp/hns-exec-runtime.56wper/node-v24.19.0-darwin-arm64/bin';
const candidate='bdcd60bb36e30e63855f06bbcb06923eb9b02e1f';
const deadline=Date.parse('2026-10-03T22:08:16.810Z');
const hash=b=>createHash('sha256').update(b).digest('hex');
const git=(...args)=>{const r=spawnSync('git',args,{cwd:repo});assert.equal(r.status,0);return r.stdout;};
const start=new Date().toISOString();
mkdirSync(out,{recursive:true});
const d=repo+'/docs/08_agent_reviews/validation/HNS-EXEC-002-resume-002/';
const inputs=JSON.parse(readFileSync(d+'inputs.json'));
const meta=JSON.parse(readFileSync(d+'results.json'));
assert.equal(meta.candidate,candidate);assert.equal(hash(readFileSync(d+'inputs.json')),meta.input_sha256);
let matched=0;const metadataOnly=[];
for(const [p,h] of inputs){assert.equal(hash(readFileSync(repo+'/'+p)),h,p+' current');const old=git('show',candidate+':'+p);if(hash(old)!==h){assert.equal(p,'work-items/HNS-EXEC-002.md');const normalize=s=>s.replace(/^\| Status \|.*$/m,'| Status | NORMALIZED |').replace(/## Blockers\n[\s\S]*?(?=## Notes)/,'## Blockers\nNORMALIZED\n\n').replace(/^- Human review-only continuation `HNS-EXEC-002-RESUME-002`:.*\n/m,'');assert.equal(normalize(readFileSync(repo+'/'+p,'utf8')),normalize(old.toString()));metadataOnly.push(p);}else matched++;}
const listed=new Set(inputs.map(x=>x[0]));let inventoryCount=0;
function collect(p){for(const e of readdirSync(repo+'/'+p,{withFileTypes:true})){const q=p+'/'+e.name;if(e.isDirectory())collect(q);else{assert.ok(listed.has(q),q+' unlisted');inventoryCount++;}}}
collect('harness/src');collect('harness/tests');for(const p of ['harness/package.json','harness/package-lock.json','harness/tsconfig.json'])assert.ok(listed.has(p));
assert.equal(git('diff',candidate,'--','harness').length,0);
const manifest='docs/08_agent_reviews/manifests/HNS-EXEC-002-implementation-r2.md';
assert.equal(hash(readFileSync(repo+'/'+manifest)),'eae9aa1501c359f18b02d71e5ba09df3675445c01c7de19dff222f2bdea91c72');
assert.equal(git('rev-parse',candidate+'^{tree}').toString().trim(),'d11d92ffd07bff68100dad7d390bb79c009ce339');
for(const r of meta.results){assert.equal(r.exit,0);assert.equal(r.signal,null);assert.equal(r.cwd,repo+'/harness');assert.equal(r.executable,bin+'/'+(r.name==='node'||r.name==='context'?'node':'npm'));assert.ok(Date.parse(r.start)>=Date.parse('2026-10-03T21:58:48.089Z'));assert.ok(Date.parse(r.end)<Date.parse(start));for(const stream of ['stdout','stderr'])assert.equal(hash(readFileSync(d+r.name+'.'+stream+'.log')),r[stream+'_sha256']);}
assert.equal(readFileSync(d+'node.stdout.log','utf8').trim(),'v24.19.0');assert.equal(readFileSync(d+'npm.stdout.log','utf8').trim(),'11.17.0');
assert.match(readFileSync(d+'test.stdout.log','utf8'),/pass 181/);assert.match(readFileSync(d+'context.stdout.log','utf8'),/pass 11/);
const audit=JSON.parse(readFileSync(d+'audit.stdout.log'));assert.equal(audit.metadata.vulnerabilities.total,0);
const dist=JSON.parse(readFileSync(d+'dist-inputs.json'));for(const [p,h] of dist)assert.equal(hash(readFileSync(repo+'/'+p)),h,p+' dist');
const provenance={start,end:new Date().toISOString(),candidate,head:git('rev-parse','HEAD').toString().trim(),input_sha256:meta.input_sha256,input_count:inputs.length,candidate_matches:matched,metadataOnly,inventoryCount,dist_count:dist.length,dist_input_sha256:hash(readFileSync(d+'dist-inputs.json')),reused_commands:meta.results.length,log_hashes:meta.results.length*2,git_status:git('status','--porcelain').toString(),scoped_diff:git('diff','--name-only',candidate,'HEAD').toString(),environment:meta.environment};
writeFileSync(out+'/provenance.json',JSON.stringify(provenance,null,2));console.log('PROVENANCE',JSON.stringify(provenance));
const fresh=[];for(const [name,exe,args] of [['context','node',['--test','tests/unit/context/compiler.test.mjs']],['audit','npm',['audit','--audit-level=high','--json']]]){assert.ok(Date.now()<deadline);const t=new Date().toISOString();const r=spawnSync(bin+'/'+exe,args,{cwd:repo+'/harness',env:{...process.env,PATH:bin+':'+process.env.PATH},timeout:Math.min(25000,deadline-Date.now())});writeFileSync(out+'/'+name+'.stdout.log',r.stdout);writeFileSync(out+'/'+name+'.stderr.log',r.stderr);fresh.push({name,executable:bin+'/'+exe,args,cwd:repo+'/harness',start:t,end:new Date().toISOString(),exit:r.status,signal:r.signal,stdout_sha256:hash(r.stdout),stderr_sha256:hash(r.stderr),environment:{NODE_OPTIONS:process.env.NODE_OPTIONS??null,NODE_PATH:process.env.NODE_PATH??null,TZ:process.env.TZ??null}});assert.equal(r.status,0);if(name==='audit')assert.equal(JSON.parse(r.stdout).metadata.vulnerabilities.total,0);else assert.match(r.stdout.toString(),/pass 11/);}
writeFileSync(out+'/fresh-results.json',JSON.stringify(fresh,null,2));console.log('FRESH',JSON.stringify(fresh));
const {ContextCompiler}=await import(pathToFileURL(repo+'/harness/dist/context/index.js'));
const root='/virtual/security';const wi='work-items/SECURITY.md';
const boundary={read_scope:['docs/**','work-items/SECURITY.md'],policy_read_scope:['docs/**','work-items/**'],forbidden_scope:['docs/private/**']};
const work_item={id:'SECURITY',role:'REVIEWER',risk_class:'HIGH',review_profile:'SECURITY_REVIEWER',feature:'context',phase:'REVIEW',read_scope:boundary.read_scope,forbidden_scope:boundary.forbidden_scope,required_gates:['IMPLEMENTATION_GATE']};
const base={path:wi,context_class:'work_item',tier:'TIER_1_MANDATORY',reason:'assigned'};
const input=(source,b=boundary,w=work_item)=>({execution_id:'security-review-003',work_item:w,repository:{root,identity:'security-fixture',branch:'review',commit:candidate},sources:source?[source,base]:[base],boundary:b,required_gates:['IMPLEMENTATION_GATE'],initial_budget:{max_bytes:4096,max_files:16,max_sections:8},hard_safety_ceiling:{max_bytes:8192,max_files:20,max_sections:10}});
const cases=[['sensitive','.env','SENSITIVE_CONTEXT_DENIED'],['forbidden','docs/private/blocked.md','FORBIDDEN_SCOPE'],['policy','outside/notallowed.md','POLICY_READ_SCOPE_DENIED'],['read','work-items/OTHER.md','WORK_ITEM_READ_SCOPE_DENIED'],['direct-sensitive','.env','SENSITIVE_CONTEXT_DENIED'],['outside-root','/virtual/security-other/target.md','CANONICAL_PATH_OUTSIDE_REPOSITORY'],['benign','docs/public.md',null]];
const probes=[];
for(const [name,target,failure] of cases){for(const mode of ['initial','onDemand']){assert.ok(Date.now()<deadline);const direct=name==='direct-sensitive';const path=direct?target:'docs/alias.md';const resolved=target.startsWith('/')?target:root+'/'+target;const reads=[];const p={resolve:async q=>q===wi?root+'/'+wi:resolved,read:async q=>{reads.push(q);return q===root+'/'+wi?'# Assigned WI\n':'# Target '+name+'\n';}};const c=new ContextCompiler(p);const ref={path,context_class:'delivery',tier:'TIER_1_MANDATORY',reason:name};const t=new Date().toISOString();if(mode==='initial'){if(failure)await assert.rejects(c.compile(input(ref)),e=>e.details?.failure===failure);else assert.equal((await c.compile(input(ref))).delivery_context.length,1);}else{const m=await c.compile(input());const req={request_id:name,execution_id:m.execution_id,requested_path:path,reason:name};const pol={...boundary,context_budget:m.hard_safety_ceiling};if(failure==='CANONICAL_PATH_OUTSIDE_REPOSITORY')await assert.rejects(c.requestContext(m,req,pol,root),e=>e.details?.failure===failure);else{const x=await c.requestContext(m,req,pol,root);assert.equal(x.status,failure?'DENIED':'LOADED');if(failure){assert.equal(x.reason,failure);assert.equal(x.audit.before_context_hash,x.audit.after_context_hash);assert.deepEqual(x.audit.budget_delta,{bytes:0,files:0,sections:0});}}}if(failure)assert.ok(!reads.includes(resolved),'DENIED TARGET READ');else assert.ok(reads.includes(resolved));probes.push({name,mode,target,failure,result:'PASS',reads,start:t,end:new Date().toISOString()});}}
// Isolate the initial Work Item boundary from a broader effective host boundary.
const reads=[];const c=new ContextCompiler({resolve:async p=>root+'/'+(p===wi?wi:'work-items/OTHER.md'),read:async p=>{reads.push(p);return '# data';}});
await assert.rejects(c.compile(input({path:'docs/alias.md',context_class:'delivery',tier:'TIER_1_MANDATORY',reason:'work-item-only'}, {...boundary,read_scope:['**'],policy_read_scope:['**']})),e=>e.details?.failure==='WORK_ITEM_READ_SCOPE_DENIED');assert.equal(reads.length,0);probes.push({name:'initial-work-item-only',result:'PASS',reads});
writeFileSync(out+'/probes.json',JSON.stringify({start,end:new Date().toISOString(),count:probes.length,probes},null,2));console.log('PROBES',JSON.stringify({count:probes.length,probes}));
for(const [p,h] of dist)assert.equal(hash(readFileSync(repo+'/'+p)),h);for(const [p,h] of inputs)assert.equal(hash(readFileSync(repo+'/'+p)),h);console.log('FINAL_BINDING PASS',new Date().toISOString());
