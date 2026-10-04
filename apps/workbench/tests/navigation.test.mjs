import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

class Node {
 constructor(text=''){this.textContent=text;this.value='';this.children=[];this.hidden=false;this.disabled=false;this.dataset={};}
 append(...nodes){this.children.push(...nodes);}
 replaceChildren(...nodes){this.children=nodes;this.textContent=nodes.map(n=>n.textContent||'').join('');}
 setAttribute(){}
 focus(){}
}
function harness(){
 const nodes=new Map(),posts=[];let rejectB=true,holdB=null;
 const node=id=>{if(!nodes.has(id))nodes.set(id,new Node());return nodes.get(id);};
 const response=value=>({ok:true,json:async()=>value});
 const context=vm.createContext({document:{getElementById:node,createElement:()=>new Node(),querySelectorAll:()=>[]},Option:class extends Node{constructor(text,value){super(text);this.value=value;}},setInterval:()=>{},fetch:async(path,options)=>{
  if(options?.method==='POST'){posts.push({path,body:JSON.parse(options.body)});return response({id:'task-B',status:'CREATED'});}
  if(path==='/api/bootstrap')return response({ready:true,csrf:'fixture',models:['gpt-6-luna']});
  if(path==='/api/projects'||path==='/api/tasks')return response([]);
  if(path==='/api/projects/B'){if(holdB)await holdB;if(rejectB)throw Error('offline');return response({id:'B',name:'B',summary:'only-B',provision_state:'DRAFT',messages:[]});}
  if(path==='/api/projects/B/skills')return response([]);
  throw Error('Unexpected fixture route '+path);
 }});
 vm.runInContext(readFileSync(new URL('../public/app.js',import.meta.url),'utf8'),context);
 return {context,node,posts,run:s=>vm.runInContext(s,context),success:()=>{rejectB=false;},hold:p=>{holdB=p;}};
}
test('AC015 A to B loading failure clears A and blocks retry/chat with no wrong-project transmission',async()=>{
 const h=harness();await new Promise(setImmediate);h.run("projectId='A';project={id:'A',summary:'only-A',messages:[]};view='workspace';");h.node('outcome').textContent='A result';h.node('prompt').value='A draft';h.node('skill').value='A skill';h.node('users').value='A users';h.node('approve-repo').hidden=false;
 let release;h.hold(new Promise(resolve=>release=resolve));const loading=h.run("openProject('B')");
 assert.equal(h.node('outcome').textContent,'');assert.equal(h.node('prompt').value,'');assert.equal(h.node('users').value,'');assert.equal(h.node('skill').children[0].value,'');assert.equal(h.node('approve-repo').hidden,true);assert.equal(h.node('start').disabled,true);assert.equal(h.node('retry-plan').disabled,true);assert.equal(h.run('project'),null);
 release();await assert.rejects(loading,/offline/);assert.equal(h.run('projectId'),'B');assert.equal(h.run('project'),null);await assert.rejects(h.run('generatePlan()'),/先成功開啟/);h.node('task-form').onsubmit({preventDefault(){},submitter:h.node('start')});assert.equal(h.posts.length,0);
 h.success();h.hold(null);await h.run("openProject('B')");assert.equal(h.run('project.id'),'B');assert.equal(h.node('start').disabled,false);await h.run('generatePlan()');assert.equal(h.posts.length,1);assert.equal(h.posts[0].path,'/api/projects/B/messages');assert.match(h.posts[0].body.text,/only-B/);assert.doesNotMatch(h.posts[0].body.text,/only-A/);
});
test('AC015 explicit retry is single-flight and does not create another project',async()=>{
 const h=harness();await new Promise(setImmediate);h.success();await h.run("openProject('B')");h.node('retry-plan').onclick();h.node('retry-plan').onclick();await new Promise(setImmediate);assert.equal(h.posts.length,1);assert.equal(h.posts[0].path,'/api/projects/B/messages');
});
