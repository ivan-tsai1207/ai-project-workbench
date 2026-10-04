import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const repo = '/Users/ivan/Documents/Codex/系統開發框架/.orchestration/hns-core-005-r4.hn6GJU/repo';
const dir = '/private/tmp/hns-exec-002-maker.QFMdL9';
const runtime = '/private/tmp/hns-exec-runtime.56wper/node-v24.19.0-darwin-arm64/bin';
const env = { ...process.env, PATH: `${runtime}:${process.env.PATH}` };
const phase = process.argv[2] ?? 'initial';
const tracked = spawnSync('git', ['ls-files', 'harness'], { cwd: repo, encoding: 'utf8' }).stdout.trim().split('\n');
const hashes = tracked.map(path => ({ path, sha256: createHash('sha256').update(readFileSync(`${repo}/${path}`)).digest('hex') }));
writeFileSync(`${dir}/${phase}-inputs.json`, JSON.stringify(hashes, null, 2));
const inputHash = createHash('sha256').update(JSON.stringify(hashes)).digest('hex');
const metadata = [];
const commands = phase === 'initial' ? [['npm', ['ci']], ['npm', ['run', 'build']], ['node', ['--test', 'tests/unit/context/compiler.test.mjs']]] : [['npm', ['ci']], ['npm', ['run', 'build']], ['npm', ['run', 'typecheck']], ['npm', ['test']], ['npm', ['audit', '--audit-level=high']], ['node', ['--test', 'tests/unit/context/compiler.test.mjs']]];
for (const [program, args] of [['node', ['--version']], ['npm', ['--version']], ...commands]) {
  const index = metadata.length;
  const started = new Date().toISOString();
  const result = spawnSync(`${runtime}/${program}`, args, { cwd: `${repo}/harness`, env, encoding: 'utf8', timeout: 60000, maxBuffer: 20 * 1024 * 1024 });
  const ended = new Date().toISOString();
  writeFileSync(`${dir}/${phase}-${index}.stdout`, result.stdout ?? '');
  writeFileSync(`${dir}/${phase}-${index}.stderr`, result.stderr ?? '');
  metadata.push({ command: `${program} ${args.join(' ')}`, executable: `${runtime}/${program}`, cwd: `${repo}/harness`, started, ended, exit: result.status, signal: result.signal, error: result.error?.message, input_hash: inputHash });
  writeFileSync(`${dir}/${phase}-commands.json`, JSON.stringify(metadata, null, 2));
  console.log(JSON.stringify(metadata.at(-1)));
}
