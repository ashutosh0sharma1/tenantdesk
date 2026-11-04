import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import net from 'node:net';
import {setTimeout as delay} from 'node:timers/promises';
const require = createRequire(import.meta.url);
const socket = net.createServer();
await new Promise(resolve => socket.listen(0, '127.0.0.1', resolve));
const port = socket.address().port;
await new Promise(resolve => socket.close(resolve));
const base = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'start', '--hostname', '127.0.0.1', '--port', String(port)], {stdio: ['ignore', 'pipe', 'pipe'], env: {...process.env, TENANTDESK_ORIGIN: base}, windowsHide: true});
let output = '';
server.stdout.on('data', chunk => { output += chunk; });
server.stderr.on('data', chunk => { output += chunk; });
try {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (server.exitCode !== null) throw new Error(`Server exited: ${output}`);
    try { const response = await fetch(`${base}/api/me`); ready = response.status === 401; } catch { /* Starting. */ }
    if (ready) break;
    await delay(200);
  }
  if (!ready) throw new Error(`Server startup timeout: ${output}`);
  const tests = spawn(process.execPath, ['--test', 'tests/routes.test.mjs'], {stdio: 'inherit', env: {...process.env, TEST_BASE_URL: base}, windowsHide: true});
  process.exitCode = await new Promise(resolve => tests.once('exit', code => resolve(code ?? 1)));
} finally {
  server.kill();
}
