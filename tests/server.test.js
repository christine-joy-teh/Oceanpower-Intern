const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const http = require('node:http');
const net = require('node:net');
const path = require('node:path');
const { spawn } = require('node:child_process');

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

test('only intended public files and assets are served', async (t) => {
  const app = await startApp();
  t.after(() => app.stop());

  for (const publicPath of ['/', '/index.html', '/en/products/', '/assets/oceanpower-logo.gif']) {
    const response = await fetch(`${app.baseUrl}${publicPath}`);
    assert.equal(response.status, 200, publicPath);
  }

  const privatePaths = ['/catalogue.pdf', '/gfrp.html', '/bfrp.html', '/cfrp.html', '/assets/gfrp-rebar.jpg',
    '/.env',
    '/.env.example',
    '/server.js',
    '/tests/rfq.test.js',
    '/tests/rfq.browser.js',
    '/package.json',
    '/README_REVIEW.md',
    '/knowledge/oceanpower-approved-knowledge.md',
    '/docs/README.md',
    '/Understanding%20of%20Oceanpower%20Corporation.docx',
    '/Oceanpower%20New%20Material---FRP%20Rebar%20Catalog.pdf',
    '/%2e%2e/server.js',
    '/%252e%252e/server.js',
    '/assets/%2e%2e/server.js',
    '/assets%2f..%2fserver.js',
    '/assets/%5c..%5cserver.js',
    '/assets/%00gfrp-rebar.jpg',
  ];
  for (const privatePath of privatePaths) {
    const response = await fetch(`${app.baseUrl}${privatePath}`);
    assert.equal(response.status, 404, privatePath);
  }

  const head = await fetch(`${app.baseUrl}/en/`, { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
  assert.match(head.headers.get('cache-control'), /no-cache/);
  assert.equal((await fetch(`${app.baseUrl}/api/health`)).status, 200);
});

test('retired product questions return current product guidance', async (t) => {
  const app = await startApp(); t.after(() => app.stop());
  for (const question of ['What is GFRP rebar?', 'Compare BFRP and CFRP', '20 mm rockbolt strength', 'What products are available?']) {
    const result = await postChat(app.baseUrl, question);
    assert.equal(result.response.status, 200);
    assert.doesNotMatch(result.body.answer, /gfrp|bfrp|cfrp|rebar|rockbolt|MPa/i);
    assert.match(result.body.answer, /asphalt/i);
    assert.deepEqual(result.body.sources, []);
  }
});

test('provider references remain unverified and failures use the local fallback', async (t) => {
  let calls = 0;
  let authorizationSeen = false;
  const mockPort = await freePort();
  const mock = http.createServer((request, response) => {
    let body = '';
    request.on('data', (chunk) => { body += chunk; });
    request.on('end', () => {
      calls += 1;
      authorizationSeen = request.headers.authorization === 'Bearer mock-test-key';
      const payload = JSON.parse(body);
      const question = payload.messages.at(-1).content;
      if (question === 'force mock failure') {
        response.writeHead(503, { 'Content-Type': 'application/json' });
        return response.end(JSON.stringify({ error: 'mock failure' }));
      }
      const withReference = question === 'mock answer with reference';
      response.writeHead(200, { 'Content-Type': 'application/json' });
      return response.end(JSON.stringify({
        choices: [{ message: { content: 'Mock provider answer' } }],
        ...(withReference ? { citations: [{ title: 'Provider reference', page: 'mock page' }] } : {}),
      }));
    });
  });
  mock.listen(mockPort, '127.0.0.1');
  await once(mock, 'listening');
  t.after(() => new Promise((resolve) => mock.close(resolve)));

  const app = await startApp({
    CHAT_API_URL: `http://127.0.0.1:${mockPort}/v1/chat/completions`,
    CHAT_API_KEY: 'mock-test-key',
    CHAT_MODEL: 'mock-model',
  });
  t.after(() => app.stop());

  const health = await (await fetch(`${app.baseUrl}/api/health`)).json();
  assert.equal(health.mode, 'knowledge-base');

  const noReference = await postChat(app.baseUrl, 'mock answer without reference', 'en', [
    { role: 'user', content: 'Earlier question' },
    { role: 'assistant', content: 'Earlier answer' },
  ]);
  assert.equal(noReference.body.mode, 'knowledge-base');
  assert.deepEqual(noReference.body.sources, []);
  assert.equal(noReference.body.sourceStatus, 'none');
  assert.match(noReference.body.citationNotice, /no verifiable answer citations/i);
  assert.equal(authorizationSeen, true);

  const withReference = await postChat(app.baseUrl, 'mock answer with reference');
  assert.equal(withReference.body.sources.length, 1);
  assert.equal(withReference.body.sourceStatus, 'provider-reported-unverified');
  assert.match(withReference.body.citationNotice, /has not verified/i);

  const failure = await postChat(app.baseUrl, 'force mock failure');
  assert.equal(failure.body.mode, 'catalogue-demo');
  assert.equal(failure.body.serviceIssue, 'provider-fallback');
  assert.match(failure.body.notice, /local catalogue fallback/i);
  assert.equal(calls, 3);
});

test('missing knowledge and invalid model identifiers prevent provider calls', async (t) => {
  let calls = 0;
  const mockPort = await freePort();
  const mock = http.createServer((request, response) => {
    calls += 1;
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ choices: [{ message: { content: 'This must not be called' } }] }));
  });
  mock.listen(mockPort, '127.0.0.1');
  await once(mock, 'listening');
  t.after(() => new Promise((resolve) => mock.close(resolve)));

  const common = {
    CHAT_API_URL: `http://127.0.0.1:${mockPort}/v1/chat/completions`,
    CHAT_API_KEY: 'mock-test-key',
  };

  const missingKnowledge = await startApp({
    ...common,
    CHAT_MODEL: 'mock-model',
    CHAT_KNOWLEDGE_FILE: 'knowledge/does-not-exist.md',
  });
  const missingResponse = await postChat(missingKnowledge.baseUrl, 'What products does Oceanpower provide?');
  assert.equal(missingResponse.body.mode, 'catalogue-demo');
  assert.equal(missingResponse.body.serviceIssue, 'configuration');
  assert.match(missingResponse.body.notice, /knowledge file is missing or empty/i);
  await missingKnowledge.stop();

  const invalidModel = await startApp({ ...common, CHAT_MODEL: 'Oceanpower Sales Assistant' });
  const invalidHealth = await (await fetch(`${invalidModel.baseUrl}/api/health`)).json();
  assert.equal(invalidHealth.mode, 'catalogue-demo');
  assert.equal(invalidHealth.serviceIssue, 'configuration');
  const invalidResponse = await postChat(invalidModel.baseUrl, 'What products does Oceanpower provide?');
  assert.equal(invalidResponse.body.mode, 'catalogue-demo');
  assert.match(invalidResponse.body.notice, /valid model identifier/i);
  await invalidModel.stop();

  assert.equal(calls, 0);
});
