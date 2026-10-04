import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { parseWorkItem } from '../../harness/dist/index.js';
import { Store } from './store.mjs';
import { Runtime, readiness, resolveCodex } from './runtime.mjs';
import { Projects, MODELS } from './projects.mjs';

export const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const assetRoot = join(dirname(fileURLToPath(import.meta.url)), 'public');

export function verifyContract() {
  const targets = ['specs/workbench/spec.md', 'docs/04_system/SDD.md', 'design/workbench/screens/SCR-WB-001.md', 'work-items/WBP3-SPEC.md', 'work-items/WBP3-DESIGN.md'];
  const parsed = parseWorkItem('work-items/WBP3-IMPL.md', readFileSync(join(repoRoot, 'work-items/WBP3-IMPL.md'), 'utf8'), { canonical_targets: targets.map(path => ({ path })) });
  if (!parsed.ok) throw Error('工作台的 canonical Work Item 無效，無法啟動。');
  return true;
}

export async function createWorkbench({ dataPath = join(homedir(), 'Library/Application Support/Framework Workbench/workbench.sqlite'), port = 4318, runtimeOptions = {}, runtimeReady = null, projectsOptions = {} } = {}) {
  verifyContract();
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw Error('本機連接埠無效。');
  const store = new Store(dataPath), runtime = new Runtime(store, runtimeOptions), csrf = randomBytes(32).toString('hex');
  const projects = new Projects(store, runtime, { frameworkRoot: repoRoot, ...projectsOptions });
  const available = runtimeReady ?? readiness(runtime.executable);
  let origin;
  const json = (res, status, payload) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(payload)); };
  const server = createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    if (req.headers.host !== new URL(origin).host) return json(res, 403, { error: '僅允許本機工作台網址。' });
    if (req.headers.origin && req.headers.origin !== origin) return json(res, 403, { error: '請從工作台頁面操作。' });
    try {
      const url = new URL(req.url, origin), path = url.pathname;
      let body;
      if (req.method === 'POST') {
        const token = req.headers['x-workbench-token'];
        if (req.headers.origin !== origin || typeof token !== 'string' || token.length !== csrf.length || !timingSafeEqual(Buffer.from(token), Buffer.from(csrf)) || req.headers['content-type'] !== 'application/json') return json(res, 403, { error: '操作權限失效；請重新整理工作台。' });
        const chunks = []; let size = 0;
        for await (const chunk of req) {
          size += chunk.length;
          if (size > 32768) return json(res, 413, { error: '任務資料超過上限。' });
          chunks.push(chunk);
        }
        try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
        catch { return json(res, 400, { error: '任務格式無效。' }); }
      }
      if (runtime.fatal && path.startsWith('/api/')) return json(res, 503, { error: runtime.fatal });
      if (req.method === 'GET' && path === '/api/bootstrap') return json(res, 200, { csrf, ...available, model: 'gpt-6-luna', models: MODELS, engines: [{id:'codex',available:true},{id:'claude',available:false},{id:'chatgpt',available:false}], mode: 'read-only', harness: 'parser/state/hash', defaultProject: repoRoot });
      if (req.method === 'GET' && path === '/api/projects') return json(res, 200, projects.list());
      const projectMatch = /^\/api\/projects\/([a-f0-9-]{36})(?:\/(skills|messages|proposal|provision|preview|sync))?$/.exec(path);
      const strict = allowed => { if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(k => !allowed.includes(k))) throw Error('專案操作欄位無效。'); };
      try {
        if (req.method === 'POST' && path === '/api/projects') { strict(['name','summary']); return json(res, 201, await projects.create(body)); }
        if (req.method === 'POST' && path === '/api/projects/import') { strict(['url']); return json(res, 201, await projects.import(body)); }
        if (projectMatch) {
          const [,id,action] = projectMatch;
          if (req.method === 'GET' && !action) return json(res, 200, projects.view(id));
          if (req.method === 'GET' && action === 'skills') return json(res, 200, projects.skills(id).map(({text,...skill})=>skill));
          if (req.method === 'POST') {
            const fields = {messages:['text','model','skill'],proposal:['name','businessGoal','primaryUsers','coreFeatures','primaryPlatform','recommendedStack','openQuestions'],provision:['approval'],preview:['includeChat'],sync:['approval']};
            if (fields[action]) {
              strict(fields[action]);
              if (action === 'messages') { if (!available.ready) return json(res, 503, {error:available.reason}); return json(res, 202, projects.message(id,body)); }
              if (action === 'proposal') return json(res, 200, await projects.proposal(id,body));
              if (action === 'provision') return json(res, 200, await projects.provision(id,body.approval));
              if (action === 'preview') return json(res, 200, await projects.preview(id,body));
              if (action === 'sync') return json(res, 200, await projects.sync(id,body.approval));
            }
          }
        }
      } catch (error) { return json(res, 400, {error: error.code ? '操作未完成；本機紀錄已保留，請確認 GitHub 登入與連線。' : error.message}); }
      if (req.method === 'GET' && path === '/api/tasks') return json(res, 200, store.list());
      const taskMatch = /^\/api\/tasks\/([a-f0-9-]{36})$/.exec(path);
      if (req.method === 'GET' && taskMatch) {
        const task = store.get(taskMatch[1]); return json(res, task ? 200 : 404, task ?? { error: '找不到這個任務。' });
      }
      const cancelMatch = /^\/api\/tasks\/([a-f0-9-]{36})\/cancel$/.exec(path);
      if (req.method === 'POST' && cancelMatch) {
        const task = runtime.cancel(cancelMatch[1]); return json(res, task ? 202 : 404, task ?? { error: '找不到這個任務。' });
      }
      if (req.method === 'POST' && path === '/api/tasks') {
        if (!available.ready) return json(res, 503, { error: available.reason });
        if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(k => !['project', 'prompt'].includes(k))) return json(res, 400, { error: '任務欄位無效。' });
        try { projects.guardLegacyPath(body.project); return json(res, 202, runtime.start(body.project, body.prompt)); }
        catch (error) { return json(res, error.statusCode ?? 400, { error: ['已有任務執行中。', '任務需為 1 至 8,000 字。', '請填寫有效的絕對專案路徑。'].includes(error.message) ? error.message : '無法開始任務；請確認 Git 專案路徑與儲存服務。' }); }
      }
      const assets = { '/': ['index.html', 'text/html'], '/app.js': ['app.js', 'text/javascript'], '/styles.css': ['styles.css', 'text/css'] };
      if (req.method === 'GET' && assets[path]) { res.setHeader('Content-Type', assets[path][1] + '; charset=utf-8'); res.end(readFileSync(join(assetRoot, assets[path][0]))); return; }
      return json(res, 404, { error: '找不到此頁面。' });
    } catch { if (!res.headersSent) json(res, 503, { error: '工作台暫時無法讀取資料；請重新啟動後檢查。' }); else res.end(); }
  });
  server.requestTimeout = 10000; server.headersTimeout = 10000;
  try { await new Promise((resolveListen, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolveListen); }); }
  catch (error) { store.close(); throw error; }
  origin = 'http://127.0.0.1:' + server.address().port;
  return { origin, store, runtime, projects, server, async close() { await runtime.shutdown(); await new Promise(done => server.close(done)); store.close(); } };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const app = await createWorkbench({ port: Number(process.env.WORKBENCH_PORT ?? 4318), ...(process.env.WORKBENCH_DATA_DIR ? { dataPath: join(process.env.WORKBENCH_DATA_DIR, 'workbench.sqlite') } : {}) });
    console.log('AI 工作台已啟動：' + app.origin);
    let closing = false;
    const close = async () => { if (closing) return; closing = true; try { await app.close(); process.exit(0); } catch { console.error('任務仍在停止中，請稍後再試。'); closing = false; } };
    process.on('SIGINT', close); process.on('SIGTERM', close);
  } catch { console.error('無法啟動工作台；請確認 Node 版本、Harness build、Codex 登入及本機資料鎖。'); process.exitCode = 1; }
}
