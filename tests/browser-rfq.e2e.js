const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const { once } = require('node:events');
const { spawn } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const EDGE_CANDIDATES = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
];

async function freePort() {
  const server = net.createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address();
  server.close();
  await once(server, 'close');
  return port;
}

async function waitFor(check, timeout = 10_000) {
  const deadline = Date.now() + timeout;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const result = await check();
      if (result) return result;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw lastError || new Error('Timed out waiting for browser state');
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (response) => {
      let body = '';
      response.on('data', (chunk) => { body += chunk; });
      response.on('end', () => {
        try { resolve(JSON.parse(body)); } catch (error) { reject(error); }
      });
    }).on('error', reject);
  });
}

class CdpClient {
  constructor(url) {
    this.nextId = 0;
    this.pending = new Map();
    this.events = [];
    this.socket = new WebSocket(url);
    this.socket.onmessage = ({ data }) => {
      const message = JSON.parse(data);
      if (message.id) {
        const request = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) request.reject(new Error(message.error.message));
        else request.resolve(message.result);
      } else {
        this.events.push(message);
      }
    };
  }

  async open() {
    if (this.socket.readyState === WebSocket.OPEN) return;
    await new Promise((resolve, reject) => {
      this.socket.onopen = resolve;
      this.socket.onerror = reject;
    });
  }

  send(method, params = {}) {
    const id = ++this.nextId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const result = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result.value;
  }

  close() {
    this.socket.close();
  }
}

async function run() {
  const executable = EDGE_CANDIDATES.find((candidate) => fs.existsSync(candidate));
  if (!executable) throw new Error('Edge or Chrome was not found');
  const appPort = await freePort();
  const debugPort = await freePort();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'oceanpower-browser-'));
  const screenshotPath = path.join(os.tmpdir(), `oceanpower-rfq-${Date.now()}.png`);
  const server = spawn(process.execPath, ['server.js'], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(appPort), CHAT_API_URL: '', CHAT_API_KEY: '', CHAT_MODEL: '' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let serverOutput = '';
  server.stdout.on('data', (chunk) => { serverOutput += chunk; });
  server.stderr.on('data', (chunk) => { serverOutput += chunk; });
  const browser = spawn(executable, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    `--remote-debugging-port=${debugPort}`, `--user-data-dir=${profile}`, 'about:blank',
  ], { stdio: 'ignore', windowsHide: true });
  let client;
  try {
    await waitFor(() => serverOutput.includes('Oceanpower website running'));
    const targets = await waitFor(() => getJson(`http://127.0.0.1:${debugPort}/json/list`));
    const page = targets.find((target) => target.type === 'page');
    assert.ok(page?.webSocketDebuggerUrl, 'Browser page target is available');
    client = new CdpClient(page.webSocketDebuggerUrl);
    await client.open();
    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await client.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 950, deviceScaleFactor: 1, mobile: false });
    await client.send('Page.navigate', { url: `http://127.0.0.1:${appPort}/` });
    await waitFor(() => client.evaluate("document.readyState === 'complete' && Boolean(document.querySelector('[data-rfq-start]'))"));

    await client.evaluate("document.querySelector('[data-rfq-start]').click()");
    await waitFor(() => client.evaluate("!document.querySelector('.rfq-draft').hidden"));
    const enquiry = 'Sand-coated GFRP rebar, 16 mm, 2,000 metres, for a coastal retaining wall in Johor, Malaysia. Requested delivery: November 2026.';
    await client.evaluate(`(() => { const input = document.querySelector('#chat-question'); input.value = ${JSON.stringify(enquiry)}; document.querySelector('.chat-form').requestSubmit(); return true; })()`);
    await waitFor(() => client.evaluate("document.querySelector('[data-rfq-field=quantity]').value === '2,000 metres'"));
    assert.equal(await client.evaluate("document.querySelector('[data-rfq-field=destination]').value"), 'Johor, Malaysia');
    assert.equal(await client.evaluate("document.querySelector('[data-rfq-field=requestedDelivery]').value"), 'November 2026');
    await client.evaluate(`(() => { const input = document.querySelector('[data-rfq-field=company]'); input.value = 'Meridian Coastworks (demonstration)'; input.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
    assert.equal(await client.evaluate("document.querySelector('[data-rfq-field=company]').value"), 'Meridian Coastworks (demonstration)');

    const correction = 'Actually, make that 1,500 metres.';
    await client.evaluate(`(() => { const input = document.querySelector('#chat-question'); input.value = ${JSON.stringify(correction)}; document.querySelector('.chat-form').requestSubmit(); return true; })()`);
    await waitFor(() => client.evaluate("document.querySelector('[data-rfq-field=quantity]').value === '1,500 metres'"));
    await client.evaluate("document.querySelector('.language-toggle').click()");
    assert.equal(await client.evaluate('document.documentElement.lang'), 'zh-CN');
    assert.equal(await client.evaluate("document.querySelector('[data-rfq-field=quantity]').value"), '1,500 metres');

    await client.evaluate("document.querySelector('.rfq-confirm').click()");
    await waitFor(() => client.evaluate("document.querySelector('.rfq-status').textContent.includes('可供工作人员审核')"));
    assert.match(await client.evaluate("document.querySelector('.rfq-send-note').textContent"), /尚未向 Oceanpower 发送/);
    await client.evaluate("document.querySelector('.rfq-copy').click()");
    await waitFor(() => client.evaluate("document.querySelector('.rfq-copy').textContent.includes('已复制')"));
    await client.evaluate("document.querySelector('.chat-close').click(); document.querySelector('.chat-launcher').click()");
    assert.equal(await client.evaluate("document.querySelector('[data-rfq-field=quantity]').value"), '1,500 metres');

    const screenshot = await client.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    fs.writeFileSync(screenshotPath, Buffer.from(screenshot.data, 'base64'));
    const exceptions = client.events.filter((event) => event.method === 'Runtime.exceptionThrown');
    assert.equal(exceptions.length, 0, 'No uncaught browser exceptions');
    await client.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await waitFor(() => client.evaluate("document.querySelector('.chat-panel').getBoundingClientRect().width <= window.innerWidth"));
    assert.equal(await client.evaluate('document.documentElement.scrollWidth <= window.innerWidth'), true);
    const mobileMetrics = await client.evaluate("({ innerWidth: window.innerWidth, panelWidth: document.querySelector('.chat-panel').getBoundingClientRect().width, media: matchMedia('(max-width: 850px)').matches })");
    assert.ok(mobileMetrics.panelWidth <= mobileMetrics.innerWidth, `RFQ panel ${mobileMetrics.panelWidth}px exceeds mobile viewport ${mobileMetrics.innerWidth}px (media matched: ${mobileMetrics.media})`);
    await client.evaluate("document.querySelector('.chat-reset').click()");
    assert.equal(await client.evaluate("document.querySelector('.rfq-draft').hidden"), true);
    console.log(`Browser RFQ flow passed. Screenshot: ${screenshotPath}`);
  } finally {
    client?.close();
    server.kill();
    browser.kill();
    await new Promise((resolve) => setTimeout(resolve, 250));
    if (profile.startsWith(os.tmpdir())) fs.rmSync(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  }
}

run().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
