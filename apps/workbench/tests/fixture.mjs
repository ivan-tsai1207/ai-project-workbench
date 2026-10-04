import { spawn } from 'node:child_process';
import { writeFileSync, appendFileSync } from 'node:fs';
const mode = process.argv[2];
const emit = item => process.stdout.write(JSON.stringify(item) + '\n');
if (mode === 'child') {
  process.on('SIGTERM', () => {});
  setInterval(() => appendFileSync(process.argv[3], 'tick\n'), 20);
} else if (mode === 'hang') {
  const child = spawn(process.execPath, [process.argv[1], 'child', process.argv[3]], { stdio: 'ignore' });
  writeFileSync(process.argv[4], String(child.pid));
  emit({ type: 'turn.started' });
  process.on('SIGTERM', () => {});
  setInterval(() => {}, 1000);
} else if (mode === 'malformed') process.stdout.write('invalid json\n');
else if (mode === 'oversized') process.stdout.write('x'.repeat(20000));
else if (mode === 'drift') { emit({type:'turn.started'}); writeFileSync('changed.txt', 'not allowed'); emit({ type:'item.completed', item:{ type:'agent_message',text:'done' } }); emit({type:'turn.completed'}); }
else {
  emit({type:'thread.started',thread_id:'test'}); emit({type:'turn.started'});
  const event = Buffer.from(JSON.stringify({type:'item.completed',item:{type:'agent_message',text:'這是測試結果。 password=demo-secret <script>alert(1)</script>'}})+'\n');
  const split = event.indexOf(Buffer.from('這'))+1;
  process.stdout.write(event.subarray(0,split));
  setTimeout(() => { process.stdout.write(event.subarray(split)); if (mode !== 'missing') emit({type:'turn.completed'}); if (mode === 'nonzero') process.exitCode=2; },10);
}
