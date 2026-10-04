import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { StringDecoder } from 'node:string_decoder';
import { isTerminalExecutionState } from '../../harness/dist/index.js';
import { fingerprint, redact, safeEnvironment, validateProject } from './safety.mjs';
import { MODELS } from './projects.mjs';

export function resolveCodex() {
  if (process.env.WORKBENCH_CODEX) return process.env.WORKBENCH_CODEX;
  const found = spawnSync('/usr/bin/which', ['codex'], { encoding: 'utf8', env: safeEnvironment() });
  if (found.status === 0) return found.stdout.trim();
  const bundled = '/Applications/ChatGPT.app/Contents/Resources/codex-cli/CodexCLI.app/Contents/MacOS/codex';
  return existsSync(bundled) ? bundled : null;
}

export function readiness(executable) {
  if (!executable || process.platform === 'win32') return { ready: false, reason: '需要支援 POSIX 的本機 Codex CLI。' };
  const help = spawnSync(executable, ['exec', '--help'], { encoding: 'utf8', timeout: 5000, maxBuffer: 128 * 1024, env: safeEnvironment() });
  const auth = spawnSync(executable, ['login', 'status'], { encoding: 'utf8', timeout: 5000, maxBuffer: 8192, env: safeEnvironment() });
  const ready = help.status === 0 && ['--ignore-user-config', '--ephemeral', '--json', '--sandbox'].every(flag => help.stdout.includes(flag)) && auth.status === 0 && /Logged in using ChatGPT/.test(auth.stdout + auth.stderr);
  return { ready, reason: ready ? '' : '請先安裝新版 Codex，並使用 ChatGPT 登入。' };
}

export class Runtime {
  constructor(store, { executable = resolveCodex(), timeoutMs = 180000, outputLimit = 512 * 1024, testCommand = null } = {}) {
    this.store = store; this.executable = executable; this.timeoutMs = timeoutMs; this.outputLimit = outputLimit;
    this.testCommand = testCommand; // Host-only dependency injection, unavailable through HTTP or production launcher.
    this.active = null; this.fatal = null; this.queue = []; this.closing = false;
  }
  start(project, prompt, model = 'gpt-6-luna') {
    if (this.fatal) throw Error('儲存服務失敗；請重新啟動工作台。');
    if (this.active) { const error = Error('已有任務執行中。'); error.statusCode = 409; throw error; }
    if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 8000) throw Error('任務需為 1 至 8,000 字。');
    project = validateProject(project);
    const before = fingerprint(project);
    if (!MODELS.includes(model)) throw Error('此模型未在工作台允許清單。');
    const task = this.store.create(project, prompt.trim(), model);
    this.store.transition(task.id, 'CONTEXT_READY');
    const job = { id: task.id, project, before, model, cancelled: false, failure: '', child: null, ended: false, killTimer: null, timeout: null };
    this.active = job;
    this.launch(job, prompt.trim());
    return this.store.get(task.id);
  }
  enqueue(project, prompt, model = 'gpt-6-luna') {
    if (this.fatal || this.closing) throw Error('工作台正在停止或儲存服務失敗。');
    if (this.queue.length >= 20) throw Error('等待佇列已達 20 項，請稍後再送出。');
    if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 8000) throw Error('任務需為 1 至 8,000 字。');
    if (!MODELS.includes(model)) throw Error('此模型未在工作台允許清單。');
    project = validateProject(project); fingerprint(project);
    const task = this.store.create(project, prompt.trim(), model);
    this.store.append(task.id, 'QUEUED', { message: '已排隊，等待本機執行。' });
    this.queue.push({ id: task.id, project, prompt: prompt.trim(), model });
    // Persist project message association before any process can begin.
    setImmediate(() => this.drain());
    return this.store.get(task.id);
  }
  drain() {
    if (this.active || this.fatal || this.closing || !this.queue.length) return;
    const next = this.queue.shift();
    try {
      const before = fingerprint(next.project);
      this.store.transition(next.id, 'CONTEXT_READY');
      const job = { ...next, before, cancelled: false, failure: '', child: null, ended: false, killTimer: null, timeout: null };
      this.active = job; this.launch(job, next.prompt);
    } catch {
      try { this.store.transition(next.id, 'FAILED_RUNTIME', { error: '排隊專案內容無法讀取，任務未啟動。' }); }
      catch { this.fatal = '排隊任務儲存失敗，請重新啟動。'; }
      setImmediate(() => this.drain());
    }
  }
  kill(job) {
    if (!job.child?.pid) return;
    const signal = name => {
      try { process.kill(-job.child.pid, name); }
      catch (error) { if (error.code !== 'ESRCH') { this.fatal = '無法終止任務程序群組。'; job.failure ||= this.fatal; } }
    };
    signal('SIGTERM');
    if (!job.killTimer) job.killTimer = setTimeout(() => signal('SIGKILL'), 2000);
  }
  fail(job, reason) { job.failure ||= reason; this.kill(job); }
  cancel(id) {
    const index = this.queue.findIndex(task => task.id === id);
    if (index >= 0) { this.queue.splice(index, 1); return this.store.transition(id, 'CANCELLED', { error: '已取消排隊任務，未啟動程序。' }); }
    const job = this.active;
    if (!job || job.id !== id) return this.store.get(id);
    job.cancelled = true;
    this.kill(job);
    return this.store.get(id);
  }
  async launch(job, prompt) {
    let buffer = '', bytes = 0, completed = false, turnStarted = false, finalText = '', events = 0, protocolFailed = false;
    const decoder = new StringDecoder('utf8');
    const persist = (type, payload) => {
      try { this.store.append(job.id, type, payload); }
      catch { this.fatal = '任務儲存失敗；執行已停止。'; this.fail(job, this.fatal); }
    };
    const line = text => {
      if (!text.trim() || job.failure || job.cancelled) return;
      if (++events > 3900) { this.fail(job, '任務事件超過上限。'); return; }
      let event;
      try { event = JSON.parse(text); }
      catch { protocolFailed = true; this.fail(job, 'Codex 回傳無效事件。'); return; }
      if (!event || typeof event.type !== 'string') { protocolFailed = true; this.fail(job, 'Codex 回傳無效事件。'); return; }
      if (event.type === 'turn.started') {
        if (turnStarted || completed) { this.fail(job, 'Codex 回傳事件順序無效。'); return; }
        turnStarted = true;
      }
      if ((event.type === 'turn.completed' || event.type.startsWith('item.')) && (!turnStarted || completed)) { this.fail(job, 'Codex 回傳事件順序無效。'); return; }
      if (event.type === 'turn.completed') { completed = true; persist('AGENT_COMPLETED', { message: 'Agent 已回傳，正在確認執行結果。' }); }
      else if (event.type === 'turn.failed' || event.type === 'error') this.fail(job, 'Codex 任務失敗；請檢查登入、模型權限或連線。');
      else if (event.type === 'item.completed' && event.item?.type === 'agent_message') {
        if (typeof event.item.text !== 'string') this.fail(job, 'Codex 回傳無效結果。');
        else { finalText = redact(event.item.text); persist('AGENT_MESSAGE', { text: finalText }); }
      } else if (event.type === 'item.started' || event.type === 'item.completed') {
        persist('PROGRESS', { message: 'Agent 正在處理專案任務。', item_type: String(event.item?.type ?? 'unknown').slice(0, 80) });
      } else if (event.type === 'thread.started' || event.type === 'turn.started') persist('PROGRESS', { message: '已連接本機 Codex，任務開始執行。' });
      // Unknown vendor event kinds are not persisted; required terminal events are still mandatory.
    };
    try {
      this.store.transition(job.id, 'RUNNING');
      const command = this.testCommand ?? { executable: this.executable, args: ['exec', '--ignore-user-config', '--ephemeral', '--sandbox', 'read-only', '--json', '-C', job.project, '-m', job.model, '-c', 'approval_policy="never"', '-'] };
      const child = spawn(command.executable, command.args, { cwd: job.project, env: safeEnvironment(), detached: true, stdio: ['pipe', 'pipe', 'pipe'], shell: false });
      job.child = child;
      job.timeout = setTimeout(() => this.fail(job, '任務超過 180 秒，已停止。'), this.timeoutMs);
      child.stdout.on('data', chunk => {
        bytes += chunk.length;
        if (bytes > this.outputLimit) { this.fail(job, '任務輸出超過上限。'); return; }
        buffer += decoder.write(chunk);
        let index;
        while ((index = buffer.indexOf('\n')) >= 0) { line(buffer.slice(0, index)); buffer = buffer.slice(index + 1); }
      });
      child.stderr.on('data', chunk => { bytes += chunk.length; if (bytes > this.outputLimit) this.fail(job, '任務輸出超過上限。'); });
      child.stdin.on('error', () => this.fail(job, 'Codex 未能接收任務。'));
      child.stdin.end('This is a read-only project analysis task. Do not modify files or request elevated permissions. Return your answer in Traditional Chinese.\n\n' + redact(prompt));
      const exit = await new Promise(resolve => {
        child.once('error', () => { job.failure ||= '無法啟動 Codex；請確認本機安裝。'; });
        child.once('close', (code, signal) => resolve({ code, signal }));
      });
      buffer += decoder.end();
      if (buffer.trim()) line(buffer);
      clearTimeout(job.timeout);
      // A parent may exit before its descendants. Terminate the group before any terminal result.
      if (child.pid) {
        try { process.kill(-child.pid, 'SIGKILL'); }
        catch (error) { if (error.code !== 'ESRCH') job.failure ||= '無法確認子程序已停止。'; }
      }
      clearTimeout(job.killTimer);
      if (this.fatal) return;
      if (job.cancelled) this.store.transition(job.id, 'CANCELLED', { error: '使用者已取消任務。' });
      else if (job.failure || exit.code !== 0 || !completed || !finalText.trim() || protocolFailed) this.store.transition(job.id, 'FAILED_RUNTIME', { error: job.failure || 'Codex 未回傳完整成功結果。' });
      else if (fingerprint(job.project) !== job.before) this.store.transition(job.id, 'FAILED_RUNTIME', { error: '專案內容在任務期間改變，結果未被接受。' });
      else {
        this.store.transition(job.id, 'VALIDATING');
        this.store.append(job.id, 'EXECUTION_CHECKS', { exit: 0, turn_completed: true, project_unchanged: true, formal_review: 'NOT_RUN' });
        this.store.transition(job.id, 'COMPLETED', { result: finalText });
      }
    } catch {
      this.kill(job);
      if (!this.fatal) {
        try { if (!isTerminalExecutionState(this.store.get(job.id).status)) this.store.transition(job.id, 'FAILED_RUNTIME', { error: '執行或證據檢查失敗；請重新啟動後檢查。' }); }
        catch { this.fatal = '任務儲存失敗；請重新啟動工作台。'; }
      }
    } finally { clearTimeout(job.timeout); job.ended = true; this.active = null; setImmediate(() => this.drain()); }
  }
  async shutdown() {
    this.closing = true;
    for (const task of this.queue.splice(0)) this.store.transition(task.id, 'CANCELLED', { error: '工作台關閉，排隊任務未啟動。' });
    const job = this.active;
    if (!job) return;
    job.cancelled = true; this.kill(job);
    const deadline = Date.now() + 4000;
    while (!job.ended && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 25));
    if (!job.ended) throw Error('程序仍在停止中；資料庫暫不關閉。');
  }
}
