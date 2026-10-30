const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const http = require('node:http');
const net = require('node:net');
const path = require('node:path');
const fs = require('node:fs');
const { spawn } = require('node:child_process');
const { saveIndex } = require('../rag/lib/store');
const { embed } = require('../rag/lib/embed');

const ROOT = path.resolve(__dirname, '..');
const runningChildren = new Set();

async function freePort() {
  const server = net.createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address();
  server.close();
  await once(server, 'close');
  return port;
}

async function startApp(overrides = {}) {
  const port = await freePort();
  const child = spawn(process.execPath, ['server.js'], {
    cwd: ROOT,
    env: {
      ...process.env,
      PORT: String(port),
      CHAT_API_URL: '',
      CHAT_API_KEY: '',
      CHAT_BACKEND_TOKEN: '',
      CHAT_MODEL: '',
      CHAT_KNOWLEDGE_FILE: 'knowledge/oceanpower-approved-knowledge.md',
      ALLOWED_ORIGINS: '',
      RAG_FAKE_EMBEDDINGS: '1',
      ...overrides,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  runningChildren.add(child);

  let output = '';
  child.stdout.on('data', (chunk) => { output += chunk; });
  child.stderr.on('data', (chunk) => { output += chunk; });

  await Promise.race([
    new Promise((resolve, reject) => {
      const check = () => {
        if (output.includes('Oceanpower website running')) return resolve();
        if (child.exitCode !== null) return reject(new Error(`Server exited early: ${output}`));
        setTimeout(check, 20);
      };
      check();
    }),
    new Promise((_, reject) => setTimeout(() => reject(new Error(`Server start timed out: ${output}`)), 5000)),
  ]);

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    output: () => output,
    async stop() {
      if (child.exitCode === null) {
        child.kill();
        await Promise.race([once(child, 'exit'), new Promise((resolve) => setTimeout(resolve, 2000))]);
      }
      runningChildren.delete(child);
    },
  };
}

async function postChat(baseUrl, message, locale = 'en', history = []) {
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, locale, history }),
  });
  return { response, body: await response.json() };
}

test.after(async () => {
  for (const child of runningChildren) {
    if (child.exitCode === null) child.kill();
  }
});

test('haichuan persona: without a built kb index, falls back to the haichuan local answer', async (t) => {
  const app = await startApp({ CHAT_PERSONA: 'haichuan', HAICHUAN_KB_NAME: `missing-kb-${Date.now()}` });
  t.after(() => app.stop());

  const health = await (await fetch(`${app.baseUrl}/api/health`)).json();
  assert.equal(health.mode, 'catalogue-demo');

  const result = await postChat(app.baseUrl, 'What products do you sell?');
  assert.equal(result.body.mode, 'catalogue-demo');
  assert.match(result.body.answer, /Haichuan/i);
});

test('haichuan persona: with a built kb index, retrieves chunks into the system prompt', async (t) => {
  process.env.RAG_FAKE_EMBEDDINGS = '1';
  const kbName = `test-haichuan-${Date.now()}`;
  const kbDir = path.join(ROOT, 'rag', 'knowledge-bases', kbName);
  t.after(() => { fs.rmSync(kbDir, { recursive: true, force: true }); delete process.env.RAG_FAKE_EMBEDDINGS; });

  const chunkText = 'Haichuan warm-mix asphalt additive reduces mixing temperature.';
  saveIndex(path.join(kbDir, 'index.json'), {
    kbName,
    builtAt: new Date().toISOString(),
    chunks: [{ source: 'warm-mix-manual.pdf', chunkIndex: 0, lang: 'en', text: chunkText, embedding: await embed(chunkText) }],
  });

  let capturedSystemPrompt = '';
  const mockPort = await freePort();
  const mock = http.createServer((request, response) => {
    let body = '';
    request.on('data', (chunk) => { body += chunk; });
    request.on('end', () => {
      const payload = JSON.parse(body);
      capturedSystemPrompt = payload.messages[0].content;
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ choices: [{ message: { content: 'Mock Haichuan answer' } }] }));
    });
  });
  mock.listen(mockPort, '127.0.0.1');
  await once(mock, 'listening');
  t.after(() => new Promise((resolve) => mock.close(resolve)));

  const app = await startApp({
    CHAT_PERSONA: 'haichuan',
    HAICHUAN_KB_NAME: kbName,
    CHAT_API_URL: `http://127.0.0.1:${mockPort}/v1/chat/completions`,
    CHAT_API_KEY: 'mock-test-key',
    CHAT_MODEL: 'mock-model',
  });
  t.after(() => app.stop());

  const health = await (await fetch(`${app.baseUrl}/api/health`)).json();
  assert.equal(health.mode, 'knowledge-base');

  const result = await postChat(app.baseUrl, 'Tell me about warm-mix asphalt additives');
  assert.equal(result.body.answer, 'Mock Haichuan answer');
  assert.match(capturedSystemPrompt, /Haichuan warm-mix asphalt additive reduces mixing temperature/);
  assert.match(capturedSystemPrompt, /warm-mix-manual\.pdf/);
});

test('oceanpower persona (default) is unaffected by CHAT_PERSONA changes', async (t) => {
  const app = await startApp();
  t.after(() => app.stop());

  const definition = await postChat(app.baseUrl, 'What is sand-coated GFRP rebar?');
  assert.equal(definition.response.status, 200);
  assert.match(definition.body.answer, /glass fiber and a resin matrix/i);
});
