import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync, existsSync, realpathSync } from 'node:fs';
import { request } from 'node:http';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { Store } from '../store.mjs';
import { Runtime } from '../runtime.mjs';
import { createWorkbench, verifyContract } from '../server.mjs';
import { redact, safeEnvironment, validateProject } from '../safety.mjs';
const fixture = join(dirname(fileURLToPath(import.meta.url)), 'fixture.mjs');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(fn, limit=5000) { const end=Date.now()+limit; while(Date.now()<end){if(fn())return;await sleep(20);}throw Error('timeout'); }
function setup(mode='success', options={}) {
  const dir=mkdtempSync(join(tmpdir(),'wb-test-')), project=join(dir,'project');
  execFileSync('git',['init','-q',project]); writeFileSync(join(project,'README.md'),'fixture project');
  execFileSync('git',['-C',project,'add','.']); execFileSync('git',['-C',project,'-c','user.name=Test','-c','user.email=test@example.invalid','commit','-qm','fixture']);
  const data=join(dir,'data','store.sqlite'), store=new Store(data);
  const runtime=new Runtime(store,{testCommand:{executable:process.execPath,args:[fixture,mode,join(dir,'heartbeat'),join(dir,'childpid')]},...options});
  return {dir,project,data,store,runtime,async close(){await runtime.shutdown();store.close();rmSync(dir,{recursive:true,force:true});}};
}

test('AC001/006 canonical parser and validated Git root; invalid input never dispatches',async()=>{
 const x=setup();try{assert.equal(verifyContract(),true);assert.equal(validateProject(x.project),realpathSync(x.project));assert.throws(()=>x.runtime.start(x.project,''));assert.throws(()=>x.runtime.start(x.project,'x'.repeat(8001)));assert.throws(()=>x.runtime.start('relative','task'));assert.throws(()=>x.runtime.start(x.dir,'task'));assert.equal(x.store.list().length,0);}finally{await x.close();}
});
test('AC002/003/005 real process fixture completes unicode, redacts and persists through restart',async()=>{
 const x=setup();let open=true;try{const task=x.runtime.start(x.project,'分析 password="sensitive"');await until(()=>!x.runtime.active);const done=x.store.get(task.id);assert.equal(done.status,'COMPLETED');assert.match(done.result,/這是測試結果/);assert.ok(!JSON.stringify(done).includes('demo-secret'));assert.ok(!JSON.stringify(done).includes('sensitive'));assert.equal(done.integrity,true);assert.equal(done.formal_review,'NOT_RUN');x.store.close();open=false;const restored=new Store(x.data);assert.equal(restored.get(task.id).result,done.result);assert.equal(restored.get(task.id).status,'COMPLETED');restored.close();}finally{if(open)await x.close();else rmSync(x.dir,{recursive:true,force:true});}
});
for(const mode of ['missing','malformed','nonzero','drift','oversized'])test('AC003 fail closed on '+mode,async()=>{
 const x=setup(mode,{outputLimit:mode==='oversized'?1024:512*1024});try{const task=x.runtime.start(x.project,'task');await until(()=>!x.runtime.active);assert.equal(x.store.get(task.id).status,'FAILED_RUNTIME');assert.equal(x.store.get(task.id).result,'');}finally{await x.close();}
});
test('AC002 spawn failure cannot fabricate success',async()=>{
 const x=setup();x.runtime.testCommand={executable:'/does-not-exist',args:[]};try{const task=x.runtime.start(x.project,'task');await until(()=>!x.runtime.active);assert.equal(x.store.get(task.id).status,'FAILED_RUNTIME');}finally{await x.close();}
});
test('AC004 cancel kills parent and SIGTERM-resistant descendant; busy rejected',async()=>{
 const x=setup('hang');try{const task=x.runtime.start(x.project,'task');assert.throws(()=>x.runtime.start(x.project,'another'),/已有任務/);await until(()=>existsSync(join(x.dir,'childpid'))&&existsSync(join(x.dir,'heartbeat')));const pid=Number(readFileSync(join(x.dir,'childpid'),'utf8'));x.runtime.cancel(task.id);await until(()=>!x.runtime.active);assert.equal(x.store.get(task.id).status,'CANCELLED');const ticks=readFileSync(join(x.dir,'heartbeat'),'utf8');await sleep(100);assert.equal(readFileSync(join(x.dir,'heartbeat'),'utf8'),ticks);await until(()=>{try{process.kill(pid,0);return false;}catch(e){return e.code==='ESRCH';}},3000);}finally{await x.close();}
});
test('AC004 timeout fails rather than cancelled/success',async()=>{
 const x=setup('hang',{timeoutMs:100});try{const task=x.runtime.start(x.project,'task');await until(()=>!x.runtime.active);assert.equal(x.store.get(task.id).status,'FAILED_RUNTIME');}finally{await x.close();}
});
test('AC005 restart recovers interrupted tasks; duplicate server store lock rejected',async()=>{
 const x=setup();let open=true;try{const task=x.store.create(x.project,'task');x.store.transition(task.id,'CONTEXT_READY');assert.throws(()=>new Store(x.data),/已有工作台/);x.store.close();open=false;const restored=new Store(x.data);assert.equal(restored.get(task.id).status,'FAILED_RUNTIME');assert.match(restored.get(task.id).error,/中斷/);restored.close();}finally{if(open)await x.close();else rmSync(x.dir,{recursive:true,force:true});}
});
test('AC006 illegal state and event/result tampering rejected',async()=>{
 const x=setup();try{const task=x.store.create(x.project,'task');assert.throws(()=>x.store.transition(task.id,'COMPLETED'));x.store.db.prepare('UPDATE tasks SET result=? WHERE id=?').run('forged',task.id);assert.equal(x.store.get(task.id).integrity,false);assert.throws(()=>x.store.transition(task.id,'CONTEXT_READY'));x.store.db.prepare('UPDATE tasks SET result=? WHERE id=?').run('',task.id);x.store.db.prepare('UPDATE events SET hash=? WHERE task_id=?').run('forged',task.id);assert.equal(x.store.get(task.id).integrity,false);}finally{await x.close();}
});
test('AC005 database write failure prevents spawn',async()=>{
 const x=setup();try{x.store.db.exec('PRAGMA query_only=ON');assert.throws(()=>x.runtime.start(x.project,'task'));assert.equal(x.runtime.active,null);x.store.db.exec('PRAGMA query_only=OFF');}finally{await x.close();}
});
test('AC007 inherited credentials excluded and known secret patterns redacted',()=>{
 assert.equal(safeEnvironment().OPENAI_API_KEY,undefined);assert.equal(safeEnvironment().CODEX_API_KEY,undefined);assert.ok(!redact('token="super-secret" Bearer abcdef sk-123456789abcdef').includes('super-secret'));assert.ok(!redact('token="super-secret" Bearer abcdef sk-123456789abcdef').includes('abcdef'));
});
test('AC001/007 HTTP Host/Origin/CSRF/body boundary and actual task endpoints',async()=>{
 const x=setup();x.store.close();const app=await createWorkbench({dataPath:x.data,port:0,runtimeReady:{ready:true,reason:''},runtimeOptions:{testCommand:{executable:process.execPath,args:[fixture,'success']}}});
 try{
  const boot=await(await fetch(app.origin+'/api/bootstrap')).json();const headers={'Content-Type':'application/json','Origin':app.origin,'X-Workbench-Token':boot.csrf};
  const badHost = await new Promise((resolve,reject)=>{const req=request(app.origin+'/api/bootstrap',{headers:{Host:'evil.example'}},res=>{res.resume();resolve(res.statusCode);});req.on('error',reject);req.end();});assert.equal(badHost,403);
  assert.equal((await fetch(app.origin+'/api/bootstrap',{headers:{Origin:'https://evil.example'}})).status,403);
  assert.equal((await fetch(app.origin+'/api/tasks',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).status,403);
  assert.equal((await fetch(app.origin+'/api/tasks',{method:'POST',headers:{...headers,'X-Workbench-Token':'bad'},body:'{}'})).status,403);
  assert.equal((await fetch(app.origin+'/api/tasks',{method:'POST',headers,body:'bad'})).status,400);
  assert.equal((await fetch(app.origin+'/api/tasks',{method:'POST',headers,body:JSON.stringify({project:x.project,prompt:'task',executable:'evil'})})).status,400);
  assert.equal((await fetch(app.origin+'/api/tasks',{method:'POST',headers,body:'x'.repeat(40000)})).status,413);
  const response=await fetch(app.origin+'/api/tasks',{method:'POST',headers,body:JSON.stringify({project:x.project,prompt:'task'})});assert.equal(response.status,202);const task=await response.json();await until(()=>!app.runtime.active);const done=await(await fetch(app.origin+'/api/tasks/'+task.id)).json();assert.equal(done.status,'COMPLETED');assert.equal(done.integrity,true);
  const html=await fetch(app.origin);assert.match(html.headers.get('Content-Security-Policy'),/script-src 'self'/);assert.match(await html.text(),/AI 助手會整理與分析，這個版本還不會替你修改程式/);const js=await(await fetch(app.origin+'/app.js')).text();assert.ok(!js.includes('innerHTML'));
 }finally{await app.close();rmSync(x.dir,{recursive:true,force:true});}
});
