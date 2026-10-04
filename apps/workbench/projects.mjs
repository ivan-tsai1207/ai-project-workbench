import { execFile, spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, existsSync, lstatSync, readdirSync, realpathSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { randomUUID, randomBytes, createHash } from 'node:crypto';
import { safeEnvironment, redact, validateProject, git } from './safety.mjs';

export const MODELS = ['gpt-6-luna', 'gpt-6-sol', 'gpt-6-astra', 'gpt-6.1-sol'];
const digest = text => createHash('sha256').update(text).digest('hex');
export function repoName(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/.test(value) || value === '.' || value === '..' || value.endsWith('.git')) throw Error('請使用有效的 repo 名稱。');
  return value;
}
export function githubRepo(value) {
  const m = typeof value === 'string' && /^https:\/\/github\.com\/([A-Za-z0-9][A-Za-z0-9-]{0,38})\/([A-Za-z0-9][A-Za-z0-9._-]{0,99}?)(?:\.git)?\/?$/.exec(value);
  if (!m) throw Error('請貼上 https://github.com/擁有者/repo 網址。');
  return m[1] + '/' + repoName(m[2]);
}
const gitEnv = () => ({ ...safeEnvironment(), GIT_TERMINAL_PROMPT:'0', GIT_CONFIG_NOSYSTEM:'1', GIT_CONFIG_GLOBAL:'/dev/null', GIT_CONFIG_COUNT:'4', GIT_CONFIG_KEY_0:'core.hooksPath', GIT_CONFIG_VALUE_0:'/dev/null', GIT_CONFIG_KEY_1:'core.fsmonitor', GIT_CONFIG_VALUE_1:'false', GIT_CONFIG_KEY_2:'protocol.file.allow', GIT_CONFIG_VALUE_2:'never', GIT_CONFIG_KEY_3:'protocol.ext.allow', GIT_CONFIG_VALUE_3:'never', GH_PROMPT_DISABLED:'1' });
export function command(executable, args, cwd, input) {
  return new Promise((done, reject) => {
    let failedInput = false;
    const child = execFile(executable, args, { cwd, env:gitEnv(), maxBuffer:1024*1024, encoding:'utf8', shell:false, detached:true }, (error, stdout) => {
      clearTimeout(termTimer); clearTimeout(killTimer);
      signal('SIGKILL');
      if (error || failedInput || timedOut) { const failure = Error('GitHub 或 Git 操作未完成；本機資料已保留。'); failure.code = error?.code ?? 'COMMAND_FAILED'; reject(failure); }
      else done(stdout);
    });
    let timedOut = false;
    const signal = name => { if (child.pid) { try { process.kill(-child.pid,name); } catch (error) { if(error.code!=='ESRCH')failedInput=true; } } };
    const termTimer=setTimeout(()=>{timedOut=true;signal('SIGTERM');},28000);
    const killTimer=setTimeout(()=>{timedOut=true;signal('SIGKILL');},30000);
    child.stdin.on('error',()=>{failedInput=true;signal('SIGTERM');});
    child.stdin.end(input);
  });
}
export class Projects {
  constructor(store, runtime, { root, frameworkRoot, run = command, now = () => Date.now(), gh = null } = {}) {
    this.store = store; this.runtime = runtime; this.root = resolve(root ?? join(dirname(store.path), 'projects')); this.frameworkRoot = frameworkRoot; this.run = run; this.now = now;
    this.gh = gh ?? spawnSync('/usr/bin/which', ['gh'], {encoding:'utf8',env:safeEnvironment()}).stdout?.trim();
    this.tokens = new Map(); this.locks = new Set(); mkdirSync(this.root,{recursive:true,mode:0o700});
    this.root=realpathSync(this.root);
    store.db.exec('CREATE TABLE IF NOT EXISTS projects(id TEXT PRIMARY KEY,name TEXT,summary TEXT,path TEXT,repo TEXT,provision_state TEXT,approved_json TEXT,created_at TEXT); CREATE TABLE IF NOT EXISTS messages(id TEXT PRIMARY KEY,project_id TEXT REFERENCES projects(id),role TEXT,text TEXT,task_id TEXT REFERENCES tasks(id),model TEXT,skill TEXT,created_at TEXT);');
    // Normalize project identities only; immutable historical task/event data stays intact.
    for(const p of this.list()){try{const canonical=realpathSync(p.path);if(canonical!==p.path)store.db.prepare('UPDATE projects SET path=? WHERE id=?').run(canonical,p.id);}catch(error){if(!['ENOENT','ENOTDIR'].includes(error.code))throw error;}}
  }
  canonical(path){return realpathSync(path);}
  list() { return this.store.db.prepare('SELECT id,name,summary,path,repo,provision_state,created_at FROM projects ORDER BY created_at DESC').all(); }
  get(id) {
    const p = this.store.db.prepare('SELECT * FROM projects WHERE id=?').get(id);
    if (!p) throw Error('找不到這個專案。');
    return p;
  }
  save(p) { this.store.db.prepare('UPDATE projects SET repo=?,provision_state=?,approved_json=? WHERE id=?').run(p.repo,p.provision_state,p.approved_json,p.id); }
  records(id) {
    const rows = this.store.db.prepare('SELECT * FROM messages WHERE project_id=? ORDER BY rowid').all(id), messages=[];
    for (const row of rows) {
      const task = row.task_id ? this.store.get(row.task_id) : null;
      messages.push({...row,task});
      if (task?.status === 'COMPLETED' && task.integrity) messages.push({id:row.id+'-reply',role:'assistant',text:task.result,model:task.model,created_at:task.updated_at});
    }
    return messages;
  }
  view(id) { const p=this.get(id); return {...p,approved_json:undefined,lastPR:p.approved_json ? JSON.parse(p.approved_json).lastPR : null,messages:this.records(id)}; }
  busy(id) {
    if (this.locks.has(id)) return true;
    const path=this.canonical(this.get(id).path),same=value=>this.canonical(value)===path;
    if(this.runtime.active&&same(this.runtime.active.project) || this.runtime.queue.some(t=>same(t.project)))return true;
    const active=this.store.db.prepare("SELECT id,project FROM tasks WHERE status IN ('CREATED','CONTEXT_READY','RUNNING','VALIDATING')").all();
    const associated=new Set(this.store.db.prepare('SELECT task_id FROM messages WHERE project_id=?').all(id).map(m=>m.task_id));
    return active.some(t=>associated.has(t.id)||same(t.project));
  }
  guardLegacyPath(path) {
    const actual=this.canonical(path);
    for(const p of this.list()){if(!this.locks.has(p.id))continue;if(this.canonical(p.path)===actual){const e=Error('專案正在保存，請稍後再試。');e.statusCode=409;throw e;}}
  }
  async exclusive(id, fn) {
    if (this.busy(id)) throw Error('此專案仍有任務或同步操作，請稍後再試。');
    this.locks.add(id); try { return await fn(); } finally { this.locks.delete(id); }
  }
  async local(args,path) { return this.run('git',args,path); }
  async ghRun(args,input) { if (!this.gh) throw Error('請先安裝 GitHub CLI 並登入。'); return this.run(this.gh,args,this.root,input); }
  async api(path,body) { return JSON.parse(await this.ghRun(['api','--hostname','github.com',path,...(body ? ['--method','POST','--input','-'] : [])],body ? JSON.stringify(body) : undefined)); }
  async user() { const u=await this.api('user'); if(!/^[A-Za-z0-9][A-Za-z0-9-]{0,38}$/.test(u.login))throw Error('GitHub 帳號無效。');return u.login; }
  async create({name,summary}) {
    if(typeof name!=='string'||!name.trim()||name.length>100||typeof summary!=='string'||summary.length>8000)throw Error('請填寫專案名稱與最多 8,000 字的想法。');
    const id=randomUUID(),path=join(this.root,id);mkdirSync(path,{mode:0o700});
    const safeName=redact(name.trim()),safeSummary=redact(summary.trim());
    writeFileSync(join(path,'README.md'),'# '+safeName+'\n\n'+safeSummary+'\n\n本機草稿；需求尚待確認。\n');
    await this.local(['init','-b','main'],path);await this.local(['add','--','README.md'],path);await this.local(['-c','user.name=Workbench','-c','user.email=workbench@localhost','commit','-m','Initialize project idea'],path);
    this.store.db.prepare('INSERT INTO projects VALUES(?,?,?,?,?,?,?,?)').run(id,safeName,safeSummary,path,'','DRAFT','',new Date().toISOString());return this.view(id);
  }
  async import({url}) {
    const repo=githubRepo(url),id=randomUUID(),path=join(this.root,id);
    await this.ghRun(['repo','clone','https://github.com/'+repo,path,'--no-upstream','--','--no-recurse-submodules']);validateProject(path);
    this.store.db.prepare('INSERT INTO projects VALUES(?,?,?,?,?,?,?,?)').run(id,repo.split('/')[1],'匯入既有 GitHub 專案',path,repo,'LINKED','',new Date().toISOString());return this.view(id);
  }
  token(id,type,data) { if(this.tokens.size>=100)for(const[k,v]of this.tokens)if(v.expires<this.now())this.tokens.delete(k);if(this.tokens.size>=100)throw Error('確認操作過多，請稍後再試。');const approval=randomBytes(32).toString('hex');this.tokens.set(approval,{id,type,data,hash:digest(JSON.stringify(data)),expires:this.now()+300000});return {...data,approval}; }
  consume(id,type,approval) {const t=this.tokens.get(approval);this.tokens.delete(approval);if(!t||t.id!==id||t.type!==type||t.expires<this.now()||t.hash!==digest(JSON.stringify(t.data)))throw Error('確認已失效；請重新預覽。');return t.data;}
  async proposal(id,body) {
    const p=this.get(id);if(p.provision_state==='LINKED')throw Error('這個專案已連結 repo。');
    const owner=await this.user(), name=repoName(body.name);
    const data={provider:'github',owner,name,projectName:p.name,summary:p.summary,visibility:'private',defaultBranch:'main',developmentBranch:'develop'};
    for(const key of ['businessGoal','primaryUsers','coreFeatures','primaryPlatform','recommendedStack','openQuestions']) {
      const v=body[key]??'';if(typeof v!=='string'||v.length>2000)throw Error('專案確認欄位最多 2,000 字。');data[key]=redact(v.trim())||'TBD — 待確認';
    }
    if(Object.entries(data).some(([k,v])=>k!=='openQuestions'&&String(v).startsWith('TBD')))data.openQuestions+='\n尚有標示 TBD 的內容待釐清；初始規格尚未通過審查。';
    if(p.repo&&p.repo!==owner+'/'+name)throw Error('先前已開始建立另一個目標，請保留原 repo 名稱重試。');
    if(git(p.path,['status','--porcelain']).trim())throw Error('本機有未提交內容，請先整理草稿。');data.localHead=git(p.path,['rev-parse','HEAD']).trim();return this.token(id,'provision',data);
  }
  async remote(repo) {return JSON.parse(await this.ghRun(['repo','view',repo,'--json','nameWithOwner,isPrivate,description,defaultBranchRef']));}
  async bootstrapFiles(p,proposal) {
    const files={'README.md':'# '+p.name+'\n\n'+p.summary+'\n\n初始規格尚待確認與獨立審查。\n','AGENTS.md':'# Project bootstrap\n\nRead .ai/CONSTITUTION.md, .ai/AUTHORITY.md, .ai/WORKFLOW.md and the assigned Work Item/role/gate before execution. New intake follows .ai/PROJECT_INTAKE_CONTRACT.md. Canonical project specs govern this repository; no direct main push after bootstrap.\n','framework.json':JSON.stringify({framework:{repository:'ivan-tsai1207/ai-system-delivery-framework',version:git(this.frameworkRoot,['rev-parse','HEAD']).trim(),initialized_at:new Date().toISOString()},project:proposal,status:'SPEC_REVIEW_PENDING'},null,2)+'\n'};
    const base=['CONSTITUTION.md','AUTHORITY.md','WORKFLOW.md','PROJECT_INTAKE_CONTRACT.md','HARNESS_CONTRACT.md'];
    const roles=['product-architect','ux-designer','implementer','reviewer'];const profiles=['spec','ux','tech','qa','security','delivery-assurance'];const gates=['spec','design','implementation','delivery-assurance','release'];
    const manifest=[...base.map(x=>'.ai/'+x),...roles.map(x=>'.ai/roles/'+x+'.md'),...profiles.map(x=>'.ai/roles/reviewer-profiles/'+x+'-reviewer.md'),...gates.map(x=>'.ai/gates/'+x+'-gate.md')];
    for(const path of manifest)files[path]=readFileSync(join(this.frameworkRoot,path),'utf8');
    for(const path of ['docs/02_product/PRODUCT_VISION.md','docs/02_product/PRD.md','docs/03_requirements/SRS.md','docs/04_system/ARCHITECTURE.md','docs/04_system/SDD.md','specs/project/spec.md','design/README.md','work-items/README.md','traceability/README.md'])files[path]='# '+path.split('/').at(-1)+'\n\nStatus: TBD / SPEC_REVIEW_PENDING\n\n'+p.summary+'\n\n尚未定義或批准產品規則；不得據此自行實作。\n';
    files['bootstrap-manifest.json']=JSON.stringify({paths:Object.keys(files),governance:manifest},null,2)+'\n';return files;
  }
  async publishTree(repo,base,files,message) {
    const tree=await this.api('repos/'+repo+'/git/trees',{base_tree:base.commit.tree.sha,tree:Object.entries(files).map(([path,content])=>({path,mode:'100644',type:'blob',content}))});
    return this.api('repos/'+repo+'/git/commits',{message,tree:tree.sha,parents:[base.sha]});
  }
  async provision(id,approval) {return this.exclusive(id,async()=>{
    const p=this.get(id),a=this.consume(id,'provision',approval),owner=await this.user();
    if(a.provider!=='github'||a.visibility!=='private'||a.owner!==owner||a.projectName!==p.name||a.summary!==p.summary)throw Error('GitHub 身分或專案內容已變更，請重新確認。');
    if(git(p.path,['rev-parse','HEAD']).trim()!==a.localHead||git(p.path,['status','--porcelain']).trim())throw Error('本機草稿已改變，請重新確認。');
    const repo=owner+'/'+repoName(a.name);if(p.repo&&p.repo!==repo)throw Error('repo 目標已變更。');
    // Existing names are never silently adopted on the first creation attempt.
    if(!p.repo) {try {await this.remote(repo);throw Error('repo 名稱已存在，請換一個名稱。');}catch(e){if(e.message.includes('名稱已存在'))throw e;if(e.code!==1)throw e;}p.repo=repo;p.provision_state='CREATING';p.approved_json=JSON.stringify({proposal:a});this.save(p);}
    else {const prior=JSON.parse(p.approved_json).proposal;const comparable=x=>JSON.stringify(Object.fromEntries(Object.entries(x).filter(([k])=>k!=='localHead')));if(comparable(prior)!==comparable(a))throw Error('建立中的核准內容已變更，請使用原內容重試。');}
    try {
      let remote;try{remote=await this.remote(repo);}catch(e){if(e.code!==1)throw e;if(await this.user()!==a.owner)throw Error('GitHub 身分已變更，請重新確認。');await this.ghRun(['repo','create',repo,'--private','--add-readme','--description',p.summary.slice(0,200)+' [Workbench:'+id+']']);remote=await this.remote(repo);}
      if(remote.nameWithOwner!==repo||!remote.isPrivate||!remote.description.includes('[Workbench:'+id+']'))throw Error('無法確認先前建立的私人 repo 身分；請人工核對。');
      let branch=remote.defaultBranchRef?.name;if(!branch)throw Error('repo 尚未初始化，請稍後重試。');
      if(branch!=='main'){await this.api('repos/'+repo+'/branches/'+encodeURIComponent(branch)+'/rename',{new_name:'main'});branch='main';}
      const base=await this.api('repos/'+repo+'/commits/main');
      const normalized=base.commit?base:{sha:base.sha,commit:{tree:base.tree}};
      const saved=JSON.parse(p.approved_json), files=saved.bootstrapFiles??await this.bootstrapFiles(p,a);
      const commit=saved.bootstrapSha ? {sha:saved.bootstrapSha} : await this.publishTree(repo,normalized,files,'Bootstrap project governance and pending specifications');
      if(!saved.bootstrapSha){saved.bootstrapSha=commit.sha;saved.bootstrapFiles=files;p.approved_json=JSON.stringify(saved);this.save(p);}
      await this.ghRun(['api','--hostname','github.com','repos/'+repo+'/git/refs/heads/main','--method','PATCH','--input','-'],JSON.stringify({sha:commit.sha,force:false}));
      try{await this.api('repos/'+repo+'/git/refs',{ref:'refs/heads/develop',sha:commit.sha});}catch(e){if(e.code!==1)throw e;const ref=await this.api('repos/'+repo+'/git/ref/heads/develop');if(ref.object.sha!==commit.sha)throw Error('develop 已存在其他內容，請人工核對。');}
      if(git(p.path,['status','--porcelain']).trim())throw Error('本機草稿已改變；遠端 bootstrap 已保留，請先整理後重試。');
      for(const [path,text]of Object.entries(files)){let cursor=p.path;for(const part of path.split('/').slice(0,-1)){cursor=join(cursor,part);if(existsSync(cursor)&&lstatSync(cursor).isSymbolicLink())throw Error('本機 bootstrap 路徑不可有符號連結。');}const target=join(p.path,path);if(existsSync(target)&&(lstatSync(target).isSymbolicLink()||!lstatSync(target).isFile()))throw Error('本機 bootstrap 路徑衝突。');if(path!=='README.md'&&existsSync(target)&&readFileSync(target,'utf8')!==text)throw Error('本機已有不同的 bootstrap 內容，請人工核對。');}
      for(const [path,text]of Object.entries(files)){const target=join(p.path,path);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,text);}
      await this.local(['add','--',...Object.keys(files)],p.path);
      if(git(p.path,['diff','--cached','--name-only']).trim())await this.local(['-c','user.name=Workbench','-c','user.email=workbench@localhost','commit','-m','Bootstrap project governance'],p.path);
      p.provision_state='LINKED';this.save(p);return this.view(id);
    }catch(e){p.provision_state='PARTIAL';this.save(p);throw e;}
  });}
  skills(id) {
    const p=this.get(id),root=realpathSync(p.path),out=[];
    for(const base of ['.agents/skills','.claude/skills']) {
      let cursor=root,valid=true;for(const part of base.split('/')){cursor=join(cursor,part);if(!existsSync(cursor)){valid=false;break;}if(lstatSync(cursor).isSymbolicLink()||!lstatSync(cursor).isDirectory())throw Error('技能路徑不可使用符號連結。');}if(!valid)continue;
      const entries=readdirSync(cursor);if(entries.length>20)throw Error('技能目錄超過此版本的 20 項限制。');
      for(const name of entries){const dir=join(cursor,name);if(lstatSync(dir).isSymbolicLink())throw Error('技能不可使用符號連結。');if(!lstatSync(dir).isDirectory())continue;const file=join(dir,'SKILL.md');if(!existsSync(file))continue;const st=lstatSync(file);if(st.isSymbolicLink()||!st.isFile()||st.size>32768)throw Error('技能檔案超出安全範圍。');out.push({id:base+'/'+name+'/SKILL.md',name,platform:base.startsWith('.claude')?'Claude instructions':'Codex instructions',text:redact(readFileSync(file,'utf8'))});}
    }return out;
  }
  message(id,{text,model='gpt-6-luna',skill=''}) {
    const p=this.get(id);if(this.locks.has(id))throw Error('專案正在同步，請稍後再送出。');if(typeof text!=='string'||!text.trim()||text.length>8000)throw Error('對話需為 1 至 8,000 字。');if(!MODELS.includes(model))throw Error('此模型未在工作台允許清單。');
    let instruction='';if(skill){const s=this.skills(id).find(s=>s.id===skill);if(!s)throw Error('找不到可用的宣告式技能。');instruction='\nSelected declarative skill (no scripts or added permissions):\n'+s.text;}
    const context=this.records(id).filter(m=>m.role==='assistant'||m.task?.status==='COMPLETED').slice(-6).map(m=>m.role+': '+m.text.slice(0,500)).join('\n');
    const prompt='Project conversation (bounded recent context):\n'+context+'\n\nCurrent user message:\n'+redact(text.trim())+instruction;
    if(prompt.length>8000)throw Error('對話加上近期內容與技能超過 8,000 字，請縮短內容。');
    const task=this.runtime.enqueue(p.path,prompt,model);
    try{this.store.db.prepare('INSERT INTO messages VALUES(?,?,?,?,?,?,?,?)').run(randomUUID(),id,'user',redact(text.trim()),task.id,model,skill,new Date().toISOString());}
    catch(e){this.runtime.fatal='對話儲存失敗，後續執行已停止；請重新啟動後檢查。';this.runtime.cancel(task.id);throw e;}return task;
  }
  async preview(id,{includeChat=false}={}) {return this.exclusive(id,async()=>{
    if(typeof includeChat!=='boolean')throw Error('聊天同步選项無效。');const p=this.get(id);if(p.provision_state!=='LINKED'||!p.repo)throw Error('請先建立或匯入 GitHub repo。');
    if(git(p.path,['status','--porcelain']).trim())throw Error('本機有未提交內容；請先整理後再同步。');
    const head=git(p.path,['rev-parse','HEAD']).trim(),remote=await this.remote(p.repo),baseBranch=remote.defaultBranchRef?.name;if(!baseBranch)throw Error('遠端主要分支無效。');const base=await this.api('repos/'+p.repo+'/commits/'+encodeURIComponent(baseBranch));
    const files={'workbench/PROJECT.md':'# '+p.name+'\n\n'+p.summary+'\n','workbench/DECISIONS.md':'# 對話成果（尚待使用者確認）\n\n'+this.records(id).filter(m=>m.role==='assistant').map(m=>redact(m.text)).join('\n\n---\n\n')+'\n'};
    if(includeChat)files['workbench/CHAT.md']='# 完整對話（明確選擇同步）\n\n'+this.records(id).map(m=>m.role+': '+redact(m.text)).join('\n\n')+'\n';
    if(Buffer.byteLength(JSON.stringify(files))>512*1024)throw Error('同步內容超過 512KiB，請先縮減紀錄。');
    // Reject remote path collisions: only blobs previously published by this project are owned.
    const tree=await this.api('repos/'+p.repo+'/git/trees/'+base.commit.tree.sha+'?recursive=1');if(tree.truncated)throw Error('repo 檔案清單過大，無法安全同步。');
    for(const path of Object.keys(files)){const old=tree.tree.find(x=>x.path===path);if(old){const owned=p.approved_json?JSON.parse(p.approved_json).exports??{}:{};if(old.mode!=='100644'||old.type!=='blob'||owned[path]!==old.sha)throw Error('repo 已有不同的同名成果檔案；請先人工整理。');}if(tree.tree.some(x=>path.startsWith(x.path+'/')&&x.mode!=='040000'))throw Error('成果路徑包含檔案或符號連結。');}
    return this.token(id,'sync',{target:p.repo,isPrivate:remote.isPrivate,projectName:p.name,summary:p.summary,head,recordsHash:digest(JSON.stringify(this.records(id))),base:base.sha,tree:base.commit.tree.sha,baseBranch,files,digests:Object.fromEntries(Object.entries(files).map(([k,v])=>[k,digest(v)]))});
  });}
  async sync(id,approval) {return this.exclusive(id,async()=>{
    const p=this.get(id),a=this.consume(id,'sync',approval);if(p.repo!==a.target||p.name!==a.projectName||p.summary!==a.summary||digest(JSON.stringify(this.records(id)))!==a.recordsHash||git(p.path,['rev-parse','HEAD']).trim()!==a.head||git(p.path,['status','--porcelain']).trim())throw Error('同步預覽已過期，請重新預覽。');
    const currentRemote=await this.remote(p.repo);if(currentRemote.isPrivate!==a.isPrivate||currentRemote.nameWithOwner!==a.target)throw Error('repo 可見性或目標已變更，請重新預覽。');
    const base=await this.api('repos/'+p.repo+'/commits/'+encodeURIComponent(a.baseBranch));if(base.sha!==a.base)throw Error('遠端已更新，請重新預覽。');for(const[k,v]of Object.entries(a.files))if(digest(v)!==a.digests[k])throw Error('同步內容已變更。');
    const branch='workbench/'+id.slice(0,8)+'-'+randomBytes(6).toString('hex'),commit=await this.publishTree(p.repo,base,a.files,'Publish reviewed Workbench records');
    await this.api('repos/'+p.repo+'/git/refs',{ref:'refs/heads/'+branch,sha:commit.sha});
    const pr=await this.api('repos/'+p.repo+'/pulls',{title:'Workbench project records',head:branch,base:a.baseBranch,body:'Explicitly approved project record export. Agent remains read-only. Review the content before merging.'});
    const metadata=p.approved_json?JSON.parse(p.approved_json):{};metadata.exports=Object.fromEntries(Object.entries(a.files).map(([path,text])=>[path,createHash('sha1').update('blob '+Buffer.byteLength(text)+'\0').update(text).digest('hex')]));metadata.lastPR={branch,url:pr.html_url};p.approved_json=JSON.stringify(metadata);this.save(p);return {branch,url:pr.html_url,status:'PR_CREATED'};
  });}
}
