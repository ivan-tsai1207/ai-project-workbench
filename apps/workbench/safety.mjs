import { execFileSync } from 'node:child_process';
import { realpathSync, statSync, lstatSync, readlinkSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

export function redact(value) {
  return String(value)
    .replace(/\b(?:sk-[A-Za-z0-9_-]{8,}|gh[pousr]_[A-Za-z0-9_]{8,}|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)\b/g, '[REDACTED]')
    .replace(/((?:password|passwd|secret|token|api[_-]?key|authorization)\s*[:=]\s*)(?:"[^"\n]*"|'[^'\n]*'|[^\s,;]+)/gi, '$1[REDACTED]')
    .replace(/\bBearer\s+[A-Za-z0-9._~-]+/gi, 'Bearer [REDACTED]');
}

export function safeEnvironment() {
  const keys = ['PATH', 'HOME', 'USER', 'TMPDIR', 'SHELL', 'CODEX_HOME'];
  return Object.fromEntries(keys.filter(k => process.env[k]).map(k => [k, process.env[k]]));
}

export function sanitizeValue(value) {
  if (typeof value === 'string') return redact(value);
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, /^(password|secret|token|api[_-]?key|authorization)$/i.test(key) ? '[REDACTED]' : sanitizeValue(item)]));
  return value;
}

export function git(project, args, encoding = 'utf8') {
  return execFileSync('git', ['--no-optional-locks', '-c', 'core.hooksPath=/dev/null', '-c', 'core.fsmonitor=false', '-c', 'protocol.file.allow=never', '-c', 'protocol.ext.allow=never', '-C', project, ...args], {
    encoding, timeout: 5000, maxBuffer: 2 * 1024 * 1024,
    env: { ...safeEnvironment(), GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

export function validateProject(project) {
  if (typeof project !== 'string' || !project.startsWith('/') || project.length > 4096 || project.includes('\0')) throw Error('請填寫有效的絕對專案路徑。');
  const actual = realpathSync(project);
  if (!statSync(actual).isDirectory() || git(actual, ['rev-parse', '--is-inside-work-tree']).trim() !== 'true') throw Error('此路徑必須是本機 Git 專案。');
  if (realpathSync(git(actual, ['rev-parse', '--show-toplevel']).trim()) !== actual) throw Error('請選擇 Git 專案根目錄。');
  return actual;
}

export function fingerprint(project) {
  const names = git(project, ['ls-files', '-z', '--cached', '--others', '--exclude-standard']).split('\0').filter(Boolean);
  if (names.length > 10000) throw Error('專案超過第一版的 10,000 檔案範圍。');
  const hash = createHash('sha256');
  let bytes = 0;
  hash.update(git(project, ['rev-parse', 'HEAD']));
  hash.update(git(project, ['status', '--porcelain=v1', '-z']));
  for (const name of [...new Set(names)].sort()) {
    const path = join(project, name);
    try {
      const stat = lstatSync(path);
      if (stat.isSymbolicLink()) { hash.update(name).update('\0LINK\0').update(readlinkSync(path)); continue; }
      if (!stat.isFile()) continue;
      bytes += stat.size;
      if (bytes > 32 * 1024 * 1024) throw Error('專案超過第一版的 32MiB 檢查範圍。');
      hash.update(name).update('\0').update(readFileSync(path));
    } catch (error) {
      if (error.code === 'ENOENT') hash.update(name).update('MISSING');
      else throw error;
    }
  }
  return hash.digest('hex');
}
