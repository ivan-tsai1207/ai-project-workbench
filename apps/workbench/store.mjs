import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, chmodSync, openSync, writeFileSync, closeSync, readFileSync, unlinkSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { transitionExecutionState, isTerminalExecutionState } from '../../harness/dist/index.js';
import { hashCanonicalValue as hashCoreValue } from '../../harness/dist/core/hash/index.js';
import { redact, sanitizeValue } from './safety.mjs';

export class Store {
  constructor(path) {
    this.path = path;
    this.lock = path + '.lock';
    mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    chmodSync(dirname(path), 0o700);
    try { this.acquire(); }
    catch (error) {
      if (error.code !== 'EEXIST') throw error;
      const pid = Number(readFileSync(this.lock, 'utf8'));
      if (!Number.isSafeInteger(pid) || pid <= 0) throw Error('資料鎖無效；請先確認沒有其他工作台執行。');
      try { process.kill(pid, 0); throw Error('這份資料已有工作台使用。'); }
      catch (failure) { if (failure.code !== 'ESRCH') throw failure; }
      unlinkSync(this.lock); this.acquire();
    }
    try {
      this.db = new DatabaseSync(path);
      chmodSync(path, 0o600);
      this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
        CREATE TABLE IF NOT EXISTS tasks(id TEXT PRIMARY KEY,project TEXT NOT NULL,prompt TEXT NOT NULL,model TEXT NOT NULL,status TEXT NOT NULL,result TEXT NOT NULL DEFAULT '',error TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS events(task_id TEXT REFERENCES tasks(id),sequence INTEGER,timestamp TEXT,type TEXT,payload_json TEXT,previous_hash TEXT,hash TEXT,PRIMARY KEY(task_id,sequence));`);
      for (const task of this.db.prepare('SELECT * FROM tasks').all()) {
        if (!isTerminalExecutionState(task.status)) this.transition(task.id, 'FAILED_RUNTIME', { error: '上次執行被中斷；未自動重啟。' });
      }
    } catch (error) { this.db?.close(); unlinkSync(this.lock); throw error; }
  }
  acquire() { const fd = openSync(this.lock, 'wx', 0o600); writeFileSync(fd, String(process.pid)); closeSync(fd); }
  transaction(fn) {
    this.db.exec('BEGIN IMMEDIATE');
    try { const value = fn(); this.db.exec('COMMIT'); return value; }
    catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  create(project, prompt, model = 'gpt-6-luna') {
    return this.transaction(() => {
      const id = randomUUID(), now = new Date().toISOString();
      this.db.prepare('INSERT INTO tasks(id,project,prompt,model,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?)').run(id, redact(project), redact(prompt), model, 'CREATED', now, now);
      this.appendInside(id, 'CREATED', { mode: 'read-only', formal_review: 'NOT_RUN', project_hash: hashCoreValue(redact(project)), prompt_hash: hashCoreValue(redact(prompt)), model });
      return this.get(id);
    });
  }
  appendInside(id, type, payload) {
    const last = this.db.prepare('SELECT sequence,hash FROM events WHERE task_id=? ORDER BY sequence DESC LIMIT 1').get(id);
    if ((last?.sequence ?? 0) >= 4000) throw Error('任務事件已達上限。');
    const content = { sequence: (last?.sequence ?? 0) + 1, timestamp: new Date().toISOString(), type, payload: sanitizeValue(payload), previous_hash: last?.hash ?? hashCoreValue([]) };
    this.db.prepare('INSERT INTO events VALUES(?,?,?,?,?,?,?)').run(id, content.sequence, content.timestamp, type, JSON.stringify(content.payload), content.previous_hash, hashCoreValue(content));
  }
  append(id, type, payload) { return this.transaction(() => this.appendInside(id, type, payload)); }
  transition(id, next, { result = '', error = '' } = {}) {
    return this.transaction(() => {
      const task = this.get(id);
      if (!task || !task.integrity) throw Error('任務證據不完整。');
      const state = transitionExecutionState(task.status, task.status, next);
      this.appendInside(id, 'STATE_TRANSITION', { from: task.status, to: state, result_hash: hashCoreValue(redact(result)), error_hash: hashCoreValue(redact(error)) });
      this.db.prepare('UPDATE tasks SET status=?,result=?,error=?,updated_at=? WHERE id=?').run(state, redact(result), redact(error), new Date().toISOString(), id);
      return this.get(id);
    });
  }
  list() { return sanitizeValue(this.db.prepare('SELECT id,project,prompt,model,status,created_at,updated_at FROM tasks ORDER BY created_at DESC').all()); }
  get(id) {
    const task = this.db.prepare('SELECT * FROM tasks WHERE id=?').get(id);
    if (!task) return null;
    const rows = this.db.prepare('SELECT * FROM events WHERE task_id=? ORDER BY sequence').all(id);
    let previous = hashCoreValue([]), integrity = rows.length > 0;
    const events = rows.map((row, i) => {
      const content = { sequence: row.sequence, timestamp: row.timestamp, type: row.type, payload: JSON.parse(row.payload_json), previous_hash: row.previous_hash };
      if (row.sequence !== i + 1 || row.previous_hash !== previous || hashCoreValue(content) !== row.hash) integrity = false;
      previous = row.hash;
      return { ...content, hash: row.hash };
    });
    const first = events[0]?.payload, lastState = events.filter(e => e.type === 'STATE_TRANSITION').at(-1)?.payload;
    if (first?.project_hash !== hashCoreValue(task.project) || first?.prompt_hash !== hashCoreValue(task.prompt) || first?.model !== task.model) integrity = false;
    if (lastState ? lastState.to !== task.status || lastState.result_hash !== hashCoreValue(task.result) || lastState.error_hash !== hashCoreValue(task.error) : task.status !== 'CREATED' || task.result || task.error) integrity = false;
    return { ...sanitizeValue(task), events: sanitizeValue(events), integrity, formal_review: 'NOT_RUN' };
  }
  close() { this.db.close(); unlinkSync(this.lock); }
}
