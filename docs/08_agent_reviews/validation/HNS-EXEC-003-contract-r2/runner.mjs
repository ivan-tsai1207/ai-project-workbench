import {spawnSync,execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
const repo="/Users/ivan/Documents/Codex/系統開發框架/.orchestration/hns-core-005-r4.hn6GJU/repo",out=process.argv[2],deadline=Number(process.argv[3]);
const bin='/private/tmp/hns-exec-runtime.56wper/node-v24.19.0-darwin-arm64/bin';
const h=b=>createHash('sha256').update(b).digest('hex');
const env={...process.env,PATH:bin+':'+process.env.PATH};
mkdirSync(out,{recursive:true});
const candidate=execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim();
const paths=execFileSync('git',['ls-files','harness/src','harness/tests','harness/package.json','harness/package-lock.json','harness/tsconfig.json'],{cwd:repo,encoding:'utf8'}).trim().split('\n');
paths.push('docs/harness_v0.1_SDD.md','docs/05_decisions/CR-HNS-EXEC-003-001.md','work-items/HNS-EXEC-003-CONTRACT-CLARIFICATION-001.md','work-items/HNS-EXEC-001.md');
const inputs=[...new Set(paths)].sort().map(p=>[p,h(readFileSync(join(repo,p)))]);
writeFileSync(join(out,'inputs.json'),JSON.stringify(inputs,null,2));
const result={candidate,runtime:bin,input_sha256:h(readFileSync(join(out,'inputs.json'))),results:[]};
for(const[name,exe,args]of[['node',bin+'/node',['--version']],['npm',bin+'/npm',['--version']],['ci',bin+'/npm',['ci']],['build',bin+'/npm',['run','build']],['typecheck',bin+'/npm',['run','typecheck']],['test',bin+'/npm',['test']],['context',bin+'/node',['--test','tests/unit/context/compiler.test.mjs']],['audit',bin+'/npm',['audit','--audit-level=high','--json']]]){
 if(Date.now()>=deadline)throw Error('deadline');
 const start=new Date().toISOString();
 const r=spawnSync(exe,args,{cwd:join(repo,'harness'),env,encoding:'utf8',timeout:Math.min(120000,deadline-Date.now()),maxBuffer:8*1024*1024});
 const stdout=r.stdout??'',stderr=r.stderr??'';
 writeFileSync(join(out,name+'.stdout.log'),stdout);writeFileSync(join(out,name+'.stderr.log'),stderr);
 result.results.push({name,executable:exe,args,cwd:join(repo,'harness'),start,end:new Date().toISOString(),exit:r.status,signal:r.signal,stdout_sha256:h(stdout),stderr_sha256:h(stderr)});
 writeFileSync(join(out,'results.json'),JSON.stringify(result,null,2));
 console.log(name,r.status,stdout.slice(-210),stderr.slice(-150));if(r.status!==0)process.exit(1);
}
if(inputs.some(([p,d])=>h(readFileSync(join(repo,p)))!==d))throw Error('input drift');
console.log('PASS stable inputs',inputs.length,'candidate',candidate);
