const fs=require("node:fs"),cp=require("node:child_process"),crypto=require("node:crypto"),assert=require("node:assert/strict");
const git=(...a)=>cp.execFileSync("git",a,{encoding:"utf8"}).trim();
const sha=b=>crypto.createHash("sha256").update(b).digest("hex");
const c="91544b88d9c55f9742b4f5d77b54a9ebe3cd78e7",b="f7919e9e1d6db60f35041497d482323a668a3ce9";
assert.equal(git("rev-parse",c+"^{tree}"),"3adacc74282fcc6a033a3de9a812fc484bed6527");
assert.equal(git("rev-parse",c+"^"),b);
cp.execFileSync("git",["merge-base","--is-ancestor",c,"HEAD"]);
assert.equal(git("diff",c,"HEAD","--","harness","work-items/HNS-EXEC-001.md"),"");
assert.equal(git("status","--porcelain"),"");
const prev=JSON.parse(git("show",b+":harness/package-lock.json")),now=JSON.parse(fs.readFileSync("harness/package-lock.json"));
const changed=Object.keys(now.packages).filter(k=>JSON.stringify(prev.packages[k])!==JSON.stringify(now.packages[k]));
assert.deepEqual(changed,["node_modules/fast-uri"]);assert.deepEqual(Object.keys(prev.packages),Object.keys(now.packages));
const p=prev.packages["node_modules/fast-uri"],n=now.packages["node_modules/fast-uri"];
assert.equal(n.version,"3.1.8");assert.deepEqual(Object.keys(n).filter(k=>JSON.stringify(n[k])!==JSON.stringify(p[k])),["version","resolved","integrity"]);
assert.equal(now.packages["node_modules/ajv"].version,"8.20.0");assert.equal(now.packages["node_modules/ajv"].dependencies["fast-uri"],"^3.0.1");
assert.equal(git("show",b+":harness/package.json"),fs.readFileSync("harness/package.json","utf8").trim());
const d="docs/08_agent_reviews/validation/HNS-EXEC-VALIDATION-FIX-001-r1/";
const h=JSON.parse(fs.readFileSync(d+"handoff.stdout.log"));let hashes=0;for(const [name,item]of Object.entries(h.logs)){assert.equal(sha(fs.readFileSync(d+name)),item.sha256,name);hashes++;}
for(const [path,item]of Object.entries(h.candidate.files)){assert.equal(sha(fs.readFileSync(path)),item.sha256);assert.equal(git("rev-parse",c+":"+path),item.blob);assert.equal(git("hash-object",path),item.blob);}
assert.equal(h.candidate.commit,c);assert.equal(h.execution,"EXE-HNS-EXEC-VALIDATION-FIX-001-MAKER-001");
const names=["ci","build","typecheck","test-final","focused-final","audit","diff-check"];for(const name of names){const m=JSON.parse(fs.readFileSync(d+name+".meta.json"));assert.equal(m.exit,0);assert.equal(m.signal,null);assert.equal(m.runtime,process.version);assert.equal(m.execPath,process.execPath);assert.equal(m.cwd,process.cwd()+"/harness");assert.ok(Date.parse(m.end)>=Date.parse(m.start)&&Date.parse(m.end)<Date.now());assert.equal(fs.readFileSync(d+name+".stderr.log","utf8"),"");const log=fs.readFileSync(d+name+".stdout.log","utf8");if(name.includes("final")){const count=name==="test-final"?181:32;for(const [k,v]of Object.entries({tests:count,pass:count,fail:0,cancelled:0,skipped:0,todo:0}))assert.match(log,new RegExp("ℹ "+k+" "+v+"(?:\\r?\\n|$)"));}console.log(JSON.stringify({name,command:m.command,exit:m.exit,start:m.start,end:m.end,sha256:sha(fs.readFileSync(d+name+".stdout.log"))}));}
const digest=sha(fs.readFileSync("work-items/HNS-EXEC-001.md"));assert.equal(digest,"6dd149a33b1dfa807890fbcc34f258e473ae42d7933555e90187cb59f584730c");assert.ok(fs.readFileSync("harness/tests/unit/work-items/parser.test.mjs","utf8").includes(digest));
const sec=fs.readFileSync("harness/tests/unit/schemas/fast-uri-security.test.mjs","utf8");assert.equal((sec.match(/^test\(/gm)||[]).length,6);assert.ok(JSON.parse(fs.readFileSync("harness/package.json")).scripts.test.includes("tests/unit/schemas/*.test.mjs"));
const installed=JSON.parse(fs.readFileSync("harness/node_modules/fast-uri/package.json"));assert.equal(installed.version,n.version);
console.log(JSON.stringify({structural:"PASS",hashesVerified:hashes,lockChanged:changed,lockFields:["version","resolved","integrity"],ajv:"8.20.0",binding:"^3.0.1",discoveredTests:6,parserHash:digest,installed:installed.version,node:process.version,execPath:process.execPath,reviewer:process.env.CODEX_THREAD_ID,head:git("rev-parse","HEAD"),branch:git("branch","--show-current")}));
