import fs from "node:fs";
import crypto from "node:crypto";
import {execFileSync} from "node:child_process";
const repo=process.argv[2], dir=process.argv[3];
const h=b=>crypto.createHash("sha256").update(b).digest("hex");
const read=p=>fs.readFileSync(repo+"/"+p);
const results=JSON.parse(read(dir+"/results.json"));
if(h(read(dir+"/inputs.json"))!==results.input_sha256) throw Error("input inventory digest");
const inputs=JSON.parse(read(dir+"/inputs.json"));
for(const [p,d] of inputs) if(h(read(p))!==d) throw Error("input drift: "+p);
let logs=0;
for(const x of results.results){
 if(x.exit!==0||x.signal!==null) throw Error("command failure: "+x.name);
 for(const s of ["stdout","stderr"]){
  if(h(read(dir+"/"+x.name+"."+s+".log"))!==x[s+"_sha256"]) throw Error("log digest: "+x.name+s);
  logs++;
 }
}
if(read(dir+"/node.stdout.log").toString().trim()!=="v24.19.0"||read(dir+"/npm.stdout.log").toString().trim()!=="11.17.0") throw Error("runtime");
if(JSON.parse(read(dir+"/audit.stdout.log")).metadata.vulnerabilities.total!==0) throw Error("audit");
const sdd="docs/harness_v0.1_SDD.md", manifest="docs/08_agent_reviews/manifests/HNS-EXEC-003-contract-clarification-r2.md";
const artifacts=[[sdd,"90bbe07a15f8d4bd2ef33238b2300434ca600e02ae078561b1aabc0aa52c5933"],[manifest,"db2166dbd8ed45734f14c5d20a91626989e4d51c16bd952c6823a23be6ccfed8"]];
for(const [p,d] of artifacts) if(h(read(p))!==d)throw Error("artifact drift: "+p);
const original=execFileSync("git",["show","b699b3f1081d885e5a8e990f86612c89edcdfeaa:"+sdd],{cwd:repo});
if(h(original)!==artifacts[0][1]) throw Error("saved candidate binding");
const protectedDiff=execFileSync("git",["diff","1b6fdfca5507c5274a893d0074c602b98ff2cb99","--name-only","--","harness",".ai","AGENTS.md"],{cwd:repo,encoding:"utf8"}).trim();
if(protectedDiff)throw Error("protected path drift: "+protectedDiff);
execFileSync("git",["diff","--check"],{cwd:repo});
console.log(JSON.stringify({ok:true,candidate:results.candidate,inputs:inputs.length,commands:results.results.length,logs,artifacts,protectedDiff},null,2));

