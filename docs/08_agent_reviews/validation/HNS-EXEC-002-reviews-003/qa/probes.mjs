import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ContextCompiler} from '/Users/ivan/Documents/Codex/系統開發框架/.orchestration/hns-core-005-r4.hn6GJU/repo/harness/dist/context/compiler.js';
const started=new Date().toISOString();
const root='/qa-fixture';
const paths=['work-items/QA.md','docs/spec.md','docs/alias.md','docs/extra.md','docs/public.md','docs/private/x.md','.env','outside/x.md'];
const content=Object.fromEntries(paths.map((p,i)=>[p,'# '+i+'\n\nfixture '+i+'\n']));
content['docs/spec.md']='# Specification\n\n## 1. Required\n\nselected\n\n## 2. Unrelated\n\nunselected\n';
const wi={id:'QA',role:'REVIEWER',risk_class:'HIGH',review_profile:'QA_REVIEWER',feature:'minimal-execution-engine',phase:'REVIEW',read_scope:['work-items/**','docs/**'],forbidden_scope:['docs/private/**'],required_gates:['IMPLEMENTATION_GATE']};
const boundary={read_scope:['work-items/**','docs/**'],policy_read_scope:['work-items/**','docs/**'],forbidden_scope:['docs/private/**']};
const ref=(path,extra={})=>({path,context_class:'delivery',tier:'TIER_1_MANDATORY',reason:'QA direct reference',...extra});
const w=ref('work-items/QA.md',{context_class:'work_item'});
const spec=ref('docs/spec.md',{section:'1'});
const input=(sources=[w,spec],overrides={})=>({execution_id:'qa-independent-003',repository:{root,identity:'qa',branch:'review',commit:'fixed'},work_item:wi,boundary,sources,required_gates:wi.required_gates,initial_budget:{max_bytes:4096,max_files:16,max_sections:24},hard_safety_ceiling:{max_bytes:8192,max_files:20,max_sections:30},...overrides});
function provider(alias={},data=content){const reads=[];return {reads,async resolve(p){if(!(p in data))throw Error('unavailable');return alias[p]??root+'/'+p;},async read(p){reads.push(p.slice(root.length+1));return data[p.slice(root.length+1)];}};}
const failure=reason=>e=>{assert.equal(e.details.failure,reason);assert.ok(!JSON.stringify(e).includes('fixture'));return true;};
const results=[];
async function group(name,fn){await fn();results.push({name,result:'PASS'});}
await group('AC001 ordering and immutable snapshot',async()=>{
 const a=await new ContextCompiler(provider()).compile(input());
 const b=await new ContextCompiler(provider()).compile(input([spec,w]));
 assert.equal(JSON.stringify(a),JSON.stringify(b));assert.equal(a.context_hash,b.context_hash);
 assert.ok(Object.isFrozen(a.delivery_context[0]));assert.throws(()=>{a.delivery_context[0].reason='changed';},TypeError);
});
await group('AC002 section hash, tier deferral and zero unrelated reads',async()=>{
 const p=provider();const c=new ContextCompiler(p);const m=await c.compile(input([w,spec,ref('docs/extra.md',{tier:'TIER_2_ON_DEMAND'})]));
 assert.deepEqual(p.reads.sort(),['docs/spec.md','work-items/QA.md']);assert.equal(m.context_usage.sections,1);assert.equal(m.deferred_context.length,1);
 const altered={...content,'docs/spec.md':content['docs/spec.md'].replace('unselected','unrelated changed')};
 assert.equal((await new ContextCompiler(provider({},altered)).compile(input())).context_hash,(await c.compile(input())).context_hash);
});
await group('AC003 canonical target denials before read and allowed controls',async()=>{
 const cases=[['.env','SENSITIVE_CONTEXT_DENIED'],['docs/private/x.md','FORBIDDEN_SCOPE'],['outside/x.md','POLICY_READ_SCOPE_DENIED'],['docs/public.md',null]];
 for(const [target,reason] of cases){
  const p=provider({'docs/alias.md':root+'/'+target});const c=new ContextCompiler(p);
  if(reason){await assert.rejects(c.compile(input([ref('docs/alias.md'),w])),failure(reason));assert.equal(p.reads.length,0);}
  else assert.equal((await c.compile(input([ref('docs/alias.md'),w]))).delivery_context.length,1);
  const q=provider({'docs/alias.md':root+'/'+target});const d=new ContextCompiler(q);const m=await d.compile(input([w]));
  const decision=await d.requestContext(m,{request_id:'alias',execution_id:m.execution_id,requested_path:'docs/alias.md',reason:'affected regression'},{...boundary,context_budget:m.hard_safety_ceiling},root);
  assert.equal(decision.status,reason?'DENIED':'LOADED');
  if(reason){assert.equal(decision.reason,reason);assert.deepEqual(q.reads,['work-items/QA.md']);assert.equal(decision.audit.after_context_hash,m.context_hash);assert.deepEqual(decision.audit.budget_delta,{bytes:0,files:0,sections:0});}
 }
 const p=provider({'docs/alias.md':root+'/docs/public.md'});
 await assert.rejects(new ContextCompiler(p).compile(input([ref('docs/alias.md'),w],{work_item:{...wi,read_scope:['work-items/**','docs/alias.md']}})),failure('WORK_ITEM_READ_SCOPE_DENIED'));assert.equal(p.reads.length,0);
});
await group('AC003 missing required section, boundary overflow and recovery',async()=>{
 const c=new ContextCompiler(provider());
 await assert.rejects(c.compile(input([w,ref('docs/spec.md',{section:'99'})])),failure('SECTION_OR_ANCHOR_UNRESOLVED'));
 const m=await c.compile(input());
 const exact={max_bytes:m.context_usage.bytes,max_files:m.context_usage.files,max_sections:m.context_usage.sections};
 assert.equal((await c.compile(input(undefined,{initial_budget:exact}))).context_hash.length,71);
 await assert.rejects(c.compile(input(undefined,{initial_budget:{...exact,max_bytes:exact.max_bytes-1}})),failure('INITIAL_CONTEXT_BUDGET_EXCEEDED'));
 assert.equal((await c.compile(input())).context_hash,m.context_hash);
});
await group('AC004 defer then recover, repeated selection and execution mismatch',async()=>{
 const c=new ContextCompiler(provider());const m=await c.compile(input());const request={request_id:'recovery',execution_id:m.execution_id,requested_path:'docs/extra.md',reason:'required QA recovery'};
 const limited={...boundary,context_budget:{max_bytes:m.context_usage.bytes,max_files:20,max_sections:30}};
 const deferred=await c.requestContext(m,request,limited,root);assert.equal(deferred.status,'DEFERRED');assert.deepEqual(deferred.audit.budget_delta,{bytes:0,files:0,sections:0});assert.equal(deferred.audit.after_context_hash,m.context_hash);
 const policy={...boundary,context_budget:m.hard_safety_ceiling};const loaded=await c.requestContext(m,request,policy,root);const again=await c.requestContext(m,request,policy,root);
 assert.deepEqual(loaded,again);assert.equal(loaded.status,'LOADED');assert.notEqual(loaded.resulting_context_hash,m.context_hash);assert.ok(Object.isFrozen(loaded.audit));
 const repeated=await c.requestContext(loaded.resulting_manifest,request,policy,root);assert.equal(repeated.reason,'ALREADY_PRESENT');assert.deepEqual(repeated.audit.budget_delta,{bytes:0,files:0,sections:0});
 const denied=await c.requestContext(m,{...request,execution_id:'different'},policy,root);assert.equal(denied.status,'DENIED');assert.equal(denied.reason,'EXECUTION_ID_MISMATCH');assert.equal(denied.audit.after_context_hash,m.context_hash);
});
const report={started,ended:new Date().toISOString(),groups:results.length,results,alias_cases:9,status:'PASS'};
fs.writeFileSync('/private/tmp/HNS-EXEC-002-QA-003.OGx1da/probes.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
