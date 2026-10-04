import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
const repo="/Users/ivan/Documents/Codex/系統開發框架/.orchestration/hns-core-005-r4.hn6GJU/repo";
const out=process.argv[2];
const bin='/private/tmp/hns-exec-runtime.56wper/node-v24.19.0-darwin-arm64/bin';
const deadline=Number(process.argv[3]);
const hash=b=>createHash('sha256').update(b).digest('hex');
const env={...process.env,PATH:bin+':'+process.env.PATH};
mkdirSync(out,{recursive:true});
const paths=JSON.parse(readFileSync(join(repo,'docs/08_agent_reviews/validation/HNS-EXEC-002-r2/inputs.json'),'utf8')).map(x=>x[0]);
const inputs=paths.map(p=>[p,hash(readFileSync(join(repo,p)))]);
writeFileSync(join(out,'inputs.json'),JSON.stringify(inputs,null,2));
const result={candidate:'bdcd60bb36e30e63855f06bbcb06923eb9b02e1f',runtime:bin,input_sha256:hash(readFileSync(join(out,'inputs.json'))),environment:{NODE_OPTIONS:env.NODE_OPTIONS??null,NODE_PATH:env.NODE_PATH??null,TZ:env.TZ??null},results:[]};
const cmds=[['node',bin+'/node',['--version']],['npm',bin+'/npm',['--version']],['ci',bin+'/npm',['ci']],['build',bin+'/npm',['run','build']],['typecheck',bin+'/npm',['run','typecheck']],['test',bin+'/npm',['test']],['context',bin+'/node',['--test','tests/unit/context/compiler.test.mjs']],['audit',bin+'/npm',['audit','--audit-level=high','--json']]];
for(const [name,exe,args] of cmds){
 if(Date.now()>=deadline) throw Error('deadline');
 const start=new Date().toISOString();
 const r=spawnSync(exe,args,{cwd:join(repo,'harness'),env,encoding:'utf8',timeout:Math.min(120000,deadline-Date.now()),maxBuffer:8*1024*1024});
 const stdout=r.stdout??'',stderr=r.stderr??'';
 writeFileSync(join(out,name+'.stdout.log'),stdout);writeFileSync(join(out,name+'.stderr.log'),stderr);
 result.results.push({name,executable:exe,args,cwd:join(repo,'harness'),start,end:new Date().toISOString(),exit:r.status,signal:r.signal,error:r.error?.message,stdout_sha256:hash(stdout),stderr_sha256:hash(stderr)});
 writeFileSync(join(out,'results.json'),JSON.stringify(result,null,2));
 console.log(name,r.status,stdout.slice(-220),stderr.slice(-220));
 if(r.status!==0) process.exit(1);
}
const dist=[];
function collect(p){for(const e of readdirSync(join(repo,p),{withFileTypes:true})){const q=p+'/'+e.name;if(e.isDirectory())collect(q);else dist.push([q,hash(readFileSync(join(repo,q)))]);}}
collect('harness/dist');
writeFileSync(join(out,'dist-inputs.json'),JSON.stringify(dist.sort(),null,2));
if(inputs.some(([p,h])=>hash(readFileSync(join(repo,p)))!==h))throw Error('input drift');
console.log('inputs stable; fresh clean install/build; dist inventory',dist.length);
