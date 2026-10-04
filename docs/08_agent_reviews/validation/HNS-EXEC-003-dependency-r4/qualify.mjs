import assert from "node:assert/strict";
import {readFileSync,writeFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {parseWorkItem} from "../../../../harness/dist/work-items/index.js";
const hash=b=>createHash("sha256").update(b).digest("hex");
const dir="docs/08_agent_reviews/validation/HNS-EXEC-003-dependency-r4";
const manifestPath="docs/08_agent_reviews/manifests/HNS-EXEC-003-implementation-r4.md";
const manifestHash="sha256:"+hash(readFileSync(manifestPath));
const results=JSON.parse(readFileSync(dir+"/results.json"));
const inputs=JSON.parse(readFileSync(dir+"/inputs.json"));
for(const[p,h]of inputs)assert.equal(hash(readFileSync(p)),h,p);
for(const[p,h]of JSON.parse(readFileSync(dir+"/dist.json")))assert.equal(hash(readFileSync(p)),h,p);
for(const c of results.results){assert.equal(c.exit,0);for(const t of ["stdout","stderr"])assert.equal(hash(readFileSync(dir+"/"+c.name+"."+t+".log")),c[t+"_sha256"]);}
assert.equal(hash(readFileSync(dir+"/inputs.json")),results.input_sha256);
const targets=[
 {path:"docs/harness_v0.1_SDD.md",anchors:["Sections 5.3, 5.5, 16.1, 21, 35, 38, 40.1, 46 Phases 6-7","Sections 5.3, 5.5, 16.1, 18, 21, 35, 38, 40.1"]},
 {path:manifestPath,reviewed_artifact_hash:manifestHash},
 {path:dir+"/results.json"},
 ...["HNS-EXEC-001","HNS-EXEC-002","HNS-EXEC-003"].map(id=>({path:"work-items/"+id+".md"}))
];
const ids=["HNS-EXEC-003","HNS-EXEC-003-TECH-REVIEW-004","HNS-EXEC-003-QA-REVIEW-003","HNS-EXEC-003-SECURITY-REVIEW-003"];
for(const id of ids){const path="work-items/"+id+".md",r=parseWorkItem(path,readFileSync(path,"utf8"),{canonical_targets:targets});assert.ok(r.ok,r.ok?undefined:JSON.stringify(r.error));}
const artifacts=[...readFileSync(manifestPath,"utf8").matchAll(/\| `(harness\/[^\`]+)` \| `sha256:([0-9a-f]{64})` \|/g)];
assert.equal(artifacts.length,12);for(const[,p,h]of artifacts)assert.equal(hash(readFileSync(p)),h,p);
writeFileSync(dir+"/qualification-checks.json",JSON.stringify({timestamp:new Date().toISOString(),manifestPath,manifestHash,inputs:inputs.length,dist:results.dist_file_count,logs:results.results.length*2,parsedWorkItems:ids,artifacts:artifacts.length,result:"PASS"},null,2)+"\n");
console.log("PASS qualification: 12 artifacts, inputs/dist/raw logs and 4 canonical Work Items");
