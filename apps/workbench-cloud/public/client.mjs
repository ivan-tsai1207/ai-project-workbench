const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function projectId(id){if(!uuid.test(id))throw Error('專案識別無效。');return id;}
export function text(value,min,max,label){if(typeof value!=='string'||value.trim().length<min||value.trim().length>max)throw Error(label+'長度不符。');return value.trim();}
export function repoURL(value){if(value==='')return '';if(typeof value!=='string'||!/^https:\/\/github\.com\/[A-Za-z0-9][A-Za-z0-9-]{0,38}\/[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/.test(value)||/\/(?:\.|\.\.)$/.test(value))throw Error('請填寫 GitHub HTTPS repo 連結，或留空。');return value;}
export class Workbench {
 constructor(config,{fetcher=fetch,storage=sessionStorage,now=()=>Date.now(),changed=()=>{}}={}){this.config=config;this.fetcher=fetcher;this.storage=storage;this.now=now;this.changed=changed;this.epoch=0;this.recovery=null;this.state=this.empty();}
 empty(){return {view:'login',session:null,user:null,projects:[],project:null,notes:[],draft:{plan:'',note:'',repo:''},newDraft:{name:'',summary:''},busy:false,loading:false,status:'',error:''};}
 emit(){this.changed(this.state);}
 async request(path,{method='GET',body,session=this.state.session}={}){
  if(session&&session.expiresAt<=this.now()){this.expire();throw Error('登入已過期，請重新登入。');}
  const headers={apikey:this.config.key};if(session)headers.Authorization='Bearer '+session.token;
  if(body!==undefined){headers['Content-Type']='application/json';headers.Prefer='return=representation';}
  const response=await this.fetcher(this.config.url+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
  if(!response.ok){if(session&&(response.status===401||response.status===403)&&session===this.state.session)this.expire();throw Error(response.status===401||response.status===403?'登入或存取權限失效，請重新登入。':'操作未完成；請確認網路與設定後重試。');}
  return response.status===204?null:response.json();
 }
 expire(){const s=this.state;if(s.user&&s.project)this.recovery={user:s.user.id,project:s.project.id,draft:{...s.draft}};else if(s.user&&s.view==='new')this.recovery={user:s.user.id,view:'new',draft:{...s.newDraft}};this.epoch++;this.storage.removeItem('wb-session');this.state=this.empty();this.state.error='登入已過期，未保存內容尚未送出。請重新登入。';this.emit();}
 async verify(session){const u=await this.request('/auth/v1/user',{session});if(!u||!uuid.test(u.id))throw Error('無法驗證登入者。');return u;}
 async login(email,password){if(this.state.busy)return;this.state.busy=true;this.state.error='';this.emit();const e=++this.epoch;try{
  const t=await this.request('/auth/v1/token?grant_type=password',{method:'POST',body:{email,password},session:null});
  if(typeof t.access_token!=='string'||!Number.isFinite(t.expires_in)||t.expires_in<=0)throw Error('登入回應無效。');
  const session={token:t.access_token,expiresAt:this.now()+t.expires_in*1000},user=await this.verify(session);if(e!==this.epoch)return;
  if(this.recovery&&this.recovery.user!==user.id)this.recovery=null;this.storage.setItem('wb-session',JSON.stringify(session));this.state={...this.empty(),session,user,view:'home'};await this.home();
 }catch(error){if(e===this.epoch){this.state.error='無法登入，請檢查帳號密碼或聯絡管理員。';}}finally{if(e===this.epoch){this.state.busy=false;this.emit();}}}
 async resume(){const raw=this.storage.getItem('wb-session');if(!raw)return;let session;try{session=JSON.parse(raw);}catch(error){this.storage.removeItem('wb-session');this.state.error='登入資料無效，請重新登入。';this.emit();return;}
  if(typeof session.token!=='string'||!Number.isFinite(session.expiresAt)){this.expire();return;}const e=++this.epoch;
  try{const user=await this.verify(session);if(e!==this.epoch)return;this.state={...this.empty(),session,user,view:'home'};await this.home();}catch(error){if(e===this.epoch)this.expire();}
 }
 async logout(){const session=this.state.session;this.recovery=null;this.epoch++;this.storage.removeItem('wb-session');this.state=this.empty();this.emit();if(session){try{await this.request('/auth/v1/logout',{method:'POST',session});}catch(error){this.state.error='本頁已登出；遠端登入撤銷未完成，請關閉此分頁。';this.emit();}}}
 async home(){if(this.state.busy)return;const e=++this.epoch;this.state.project=null;this.state.notes=[];this.state.draft={plan:'',note:'',repo:''};this.state.view='home';this.state.loading=true;this.state.error='';this.emit();try{const rows=await this.request('/rest/v1/wb_projects?select=*&order=created_at.desc');if(e!==this.epoch)return;if(!Array.isArray(rows)||rows.some(p=>p.owner_id!==this.state.user.id))throw Error('專案資料身分不一致。');this.state.projects=rows;}catch(error){if(e===this.epoch)this.state.error=error.message;}finally{if(e===this.epoch){this.state.loading=false;this.emit();}}}
 newProject(){if(this.state.busy)return;this.epoch++;this.state.project=null;this.state.notes=[];this.state.draft={plan:'',note:'',repo:''};this.state.newDraft={name:'',summary:''};this.state.loading=false;this.state.view='new';this.state.error='';this.state.status='';this.emit();}
 async open(id){if(this.state.busy)return;projectId(id);const e=++this.epoch;this.state.project=null;this.state.notes=[];this.state.draft={plan:'',note:'',repo:''};this.state.view='project';this.state.loading=true;this.state.error='';this.emit();try{
  const rows=await this.request('/rest/v1/wb_projects?id=eq.'+id+'&select=*');if(e!==this.epoch)return;const p=rows?.[0];if(rows.length!==1||p.id!==id||p.owner_id!==this.state.user.id)throw Error('無法存取這個專案，請返回所有專案。');
  const notes=await this.request('/rest/v1/wb_notes?project_id=eq.'+id+'&select=*&order=created_at.asc');if(e!==this.epoch)return;if(!Array.isArray(notes)||notes.some(n=>n.project_id!==id||n.owner_id!==this.state.user.id))throw Error('紀錄資料身分不一致。');this.state.project=p;this.state.notes=notes;this.state.draft={plan:p.plan,note:'',repo:p.repo_url};
 }catch(error){if(e===this.epoch)this.state.error=error.message;}finally{if(e===this.epoch){this.state.loading=false;this.emit();}}}
 async create(name,summary){const body={name:text(name,1,100,'名稱'),summary:text(summary,1,5000,'想法')};if(this.state.busy)return;const e=this.epoch;this.state.busy=true;this.state.status='保存中…';this.emit();let id;try{const rows=await this.request('/rest/v1/wb_projects',{method:'POST',body});if(e!==this.epoch)return;if(rows?.length!==1||rows[0].owner_id!==this.state.user.id)throw Error('尚未確認保存成功。');id=projectId(rows[0].id);this.state.status='已保存';}catch(error){if(e===this.epoch){this.state.error=error.message;this.state.status='尚未保存，內容保留，請重試。';}}finally{if(e===this.epoch){this.state.busy=false;this.emit();}}if(id)await this.open(id);}
 async save(kind){const s=this.state;if(s.busy||!s.project||s.loading||s.view!=='project'||!s.user)return;const id=projectId(s.project.id),e=this.epoch;let path='/rest/v1/wb_projects?id=eq.'+id,method='PATCH',body;
  if(kind==='plan'){if(typeof s.draft.plan!=='string'||s.draft.plan.length>12000)throw Error('計畫長度不符。');body={plan:s.draft.plan};}else if(kind==='repo')body={repo_url:repoURL(s.draft.repo.trim())};else if(kind==='note'){path='/rest/v1/wb_notes';method='POST';body={project_id:id,content:text(s.draft.note,1,8000,'紀錄')};}else throw Error('未知保存操作。');
  s.busy=true;s.error='';s.status='保存中…';this.emit();try{const rows=await this.request(path,{method,body});if(e!==this.epoch)return;const row=rows?.[0];if(rows?.length!==1||row.owner_id!==s.user.id||(kind==='note'?row.project_id!==id:row.id!==id))throw Error('無法存取或確認保存；內容未清除。');if(kind==='note'){s.notes.push(row);s.draft.note='';}else{s.project={...s.project,...row};}s.status='已保存';}catch(error){if(e===this.epoch){s.error=error.message;s.status='尚未保存，內容保留，請重試。';}}finally{if(e===this.epoch){s.busy=false;this.emit();}}}
 async restoreDraft(){const r=this.recovery;if(!r||r.user!==this.state.user?.id)return;if(r.view==='new'){this.newProject();this.state.newDraft={...r.draft};this.recovery=null;this.emit();return;}await this.open(r.project);if(this.state.project?.id===r.project&&this.state.user?.id===r.user){this.state.draft={...r.draft};this.recovery=null;this.state.status='已恢復未保存內容；請確認後手動保存。';this.emit();}}
}
