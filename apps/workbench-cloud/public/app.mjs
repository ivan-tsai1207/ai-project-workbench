import {Workbench} from './client.mjs';
import {validateConfig} from './config-validation.mjs';
const $=id=>document.getElementById(id);let app,lastView='',ready=false;
for(const b of document.querySelectorAll('button'))if(!b.closest('dialog'))b.disabled=true;
function element(tag,value){const n=document.createElement(tag);n.textContent=value;return n;}
function render(s){$('navigation').hidden=!s.user;for(const v of ['login','home','new','project'])$(v+'-view').hidden=s.view!==v;$('error').textContent=s.error;$('error').hidden=!s.error;$('status').textContent=s.loading?'正在載入，請稍候。':s.busy?'保存／登入處理中…':s.status;$('restore').hidden=!s.user||!app.recovery;
 $('projects').replaceChildren();if(!s.projects.length)$('projects').append(element('p',s.loading?'正在載入專案…':'還沒有專案，開始保存你的第一個想法。'));
 for(const p of s.projects){const card=element('article','');card.append(element('h2',p.name),element('p',p.summary),element('small',new Date(p.created_at).toLocaleString('zh-TW')));const b=element('button','開啟專案');b.type='button';b.disabled=s.busy;b.onclick=()=>navigate(()=>app.open(p.id));card.append(b);$('projects').append(card);}
 $('project-title').textContent=s.project?.name||(s.loading?'正在開啟專案…':'專案暫時無法開啟');$('project-summary').textContent=s.project?.summary||'';for(const f of ['plan','note','repo'])if($(f).value!==s.draft[f])$(f).value=s.draft[f];$('notes').replaceChildren();for(const n of s.notes){const card=element('article',n.content);card.append(element('small',new Date(n.created_at).toLocaleString('zh-TW')));$('notes').append(card);}if(!s.notes.length)$('notes').append(element('p','尚無紀錄。'));
 for(const b of document.querySelectorAll('button')){if(b.closest('dialog'))continue;b.disabled=!ready||s.busy||(b.closest('#project-view')&&(!s.project||s.loading));}for(const f of ['plan','note','repo'])$(f).disabled=s.busy||!s.project||s.loading;
 for(const input of document.querySelectorAll('input,textarea'))input.disabled=!ready||s.busy||Boolean(input.closest('#project-view')&&(!s.project||s.loading));
 if(s.view==='new'){for(const f of ['name','summary'])$(f).value=s.newDraft[f];}if(s.view==='login'){$('plan').value='';$('note').value='';$('repo').value='';$('name').value='';$('summary').value='';}
 if(lastView!==s.view){lastView=s.view;$(s.view+'-view').querySelector('h1').focus();}}
function dirty(){const s=app.state;return s.view==='new'?Boolean($('name').value||$('summary').value):s.project&&Boolean(s.draft.note||s.draft.plan!==s.project.plan||s.draft.repo!==s.project.repo_url);}
async function navigate(fn){if(app.state.busy)return;if(dirty()){const dialog=$('discard'),origin=document.activeElement;dialog.returnValue='cancel';dialog.showModal();const answer=await new Promise(resolve=>dialog.addEventListener('close',()=>resolve(dialog.returnValue),{once:true}));origin?.focus();if(answer!=='discard')return;}$('name').value='';$('summary').value='';await attempt(fn);}
async function attempt(fn){try{await fn();}catch(error){app.state.error=error.message;app.emit();$('error').focus();}}
for(const f of ['plan','note','repo'])$(f).oninput=()=>{if(app.state.project)app.state.draft[f]=$(f).value;};
for(const f of ['name','summary'])$(f).oninput=()=>{if(app.state.view==='new')app.state.newDraft[f]=$(f).value;};
$('login-form').onsubmit=e=>{e.preventDefault();const email=$('email').value,password=$('password').value;$('password').value='';attempt(()=>app.login(email,password));};
$('new-form').onsubmit=e=>{e.preventDefault();attempt(()=>app.create($('name').value,$('summary').value));};
for(const [id,kind]of [['plan-form','plan'],['note-form','note'],['repo-form','repo']])$(id).onsubmit=e=>{e.preventDefault();attempt(()=>app.save(kind));};
$('home').onclick=()=>navigate(()=>app.home());$('new').onclick=()=>navigate(()=>app.newProject());$('logout').onclick=()=>navigate(()=>app.logout());$('reload').onclick=()=>attempt(()=>app.home());$('restore').onclick=()=>attempt(()=>app.restoreDraft());
(async()=>{try{const {default:config}=await import('./config.mjs');if(config.configured===false)throw Error('missing');const safe=validateConfig(config.url,config.key);ready=true;app=new Workbench(safe,{changed:render});render(app.state);await app.resume();}catch(error){ready=false;$('error').textContent='工作台尚未完成設定，請聯絡管理員。';$('error').hidden=false;$('login').disabled=true;}})();
