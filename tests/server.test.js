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

  for (const publicPath of ['/', '/index.html', '/demo.html', '/styles.css', '/lab.css', '/script.js', '/rfq.js', '/rfq-ui.js', '/translations.js', '/specifications.js', '/navigation.js', '/catalogue.pdf', '/assets/gfrp-rebar.jpg']) {
    const response = await fetch(`${app.baseUrl}${publicPath}`);
    assert.equal(response.status, 200, publicPath);
  }

  const privatePaths = [
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

  const head = await fetch(`${app.baseUrl}/script.js`, { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
  assert.equal((await fetch(`${app.baseUrl}/api/health`)).status, 200);
});

test('reported catalogue-demo questions return safe product-specific answers', async (t) => {
  const app = await startApp();
  t.after(() => app.stop());

  const definition = await postChat(app.baseUrl, 'What is sand-coated GFRP rebar?');
  assert.equal(definition.response.status, 200);
  assert.match(definition.body.answer, /glass fiber and a resin matrix/i);
  assert.match(definition.body.sources[0].detail, /printed pp\. 11-12/i);
  assert.equal(definition.body.sourceStatus, 'catalogue-reference-draft');

  const definitionZh = await postChat(app.baseUrl, '什么是覆砂 GFRP 玻璃纤维筋？', 'zh');
  assert.match(definitionZh.body.answer, /玻璃纤维与树脂基体/);
  assert.match(definitionZh.body.sources[0].detail, /11-12/);

  const approval = await postChat(app.baseUrl, 'Can the chatbot approve an engineering design?');
  assert.match(approval.body.answer, /^No\./);
  assert.match(approval.body.answer, /cannot approve an engineering design/i);
  assert.doesNotMatch(approval.body.answer, /info@/i);
  assert.equal(approval.body.sourceStatus, 'draft-knowledge-reference');

  const approvalZh = await postChat(app.baseUrl, '聊天机器人可以批准工程设计吗？', 'zh');
  assert.match(approvalZh.body.answer, /^不可以/);

  const commercial = await postChat(app.baseUrl, 'What is the exact price and delivery date?');
  assert.match(commercial.body.answer, /neither a current price nor a confirmed delivery date/i);
  assert.deepEqual(commercial.body.sources, []);

  const commercialZh = await postChat(app.baseUrl, '准确价格和交货日期是什么？', 'zh');
  assert.match(commercialZh.body.answer, /既不包含现行价格，也不包含已确认的交货日期/);
  assert.deepEqual(commercialZh.body.sources, []);

  const ambiguousRockbolt = await postChat(app.baseUrl, 'What is the tensile strength of a 20 mm GFRP rockbolt?');
  assert.match(ambiguousRockbolt.body.answer, /not specific enough/i);
  assert.match(ambiguousRockbolt.body.nextQuestion, /general solid.*MGSL20/i);
  assert.doesNotMatch(ambiguousRockbolt.body.answer, /sand-coated GFRP rebar: 4-12/i);
  assert.equal(ambiguousRockbolt.body.sources.length, 2);
  assert.ok(ambiguousRockbolt.body.sources.every((source) => /printed pp\. 9-10/i.test(source.detail)));

  const ambiguousRockboltZh = await postChat(app.baseUrl, '20 毫米 GFRP 锚杆的抗拉强度是多少？', 'zh');
  assert.match(ambiguousRockboltZh.body.answer, /不足以确定强度值/);
  assert.match(ambiguousRockboltZh.body.nextQuestion, /MGSL20/);

  const solidRockbolt = await postChat(app.baseUrl, 'What is the tensile strength of the 20 mm general solid GFRP rockbolt?');
  assert.match(solidRockbolt.body.answer, /700 MPa/);
  assert.match(solidRockbolt.body.answer, /200 kN/);
  assert.match(solidRockbolt.body.sources[0].detail, /General solid.*printed pp\. 9-10/i);

  const miningRockbolt = await postChat(app.baseUrl, 'What is the tensile strength of the MGSL20 all-thread GFRP rockbolt?');
  assert.match(miningRockbolt.body.answer, /500 MPa/);
  assert.match(miningRockbolt.body.answer, /160 kN/);

  const unsupported = await postChat(app.baseUrl, 'Who won an unrelated football match?');
  assert.deepEqual(unsupported.body.sources, []);
  assert.equal(unsupported.body.sourceStatus, 'none');
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
