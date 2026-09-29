/* Optional browser regression: install Playwright + Chromium, then npm run test:browser:playwright. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const { once } = require('node:events');
const { spawn } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, 'tmp', 'rfq-browser');
fs.mkdirSync(OUTPUT, { recursive: true });
process.env.TMPDIR = OUTPUT;
if (!process.env.PLAYWRIGHT_BROWSERS_PATH && fs.existsSync(path.join(ROOT, 'tmp', 'playwright'))) {
  process.env.PLAYWRIGHT_BROWSERS_PATH = path.join(ROOT, 'tmp', 'playwright');
}
const { chromium } = require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES
  ? path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright') : 'playwright');

const EXAMPLE = 'Sand-coated GFRP rebar, 16 mm, 2,000 metres, for a coastal retaining wall in Johor, Malaysia. Requested delivery: November 2026.';

async function main() {
  const probe = net.createServer();
  probe.listen(0, '127.0.0.1');
  await once(probe, 'listening');
  const port = probe.address().port;
  await new Promise((resolve) => probe.close(resolve));
  const base = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, ['server.js'], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(port), CHAT_API_URL: '', CHAT_API_KEY: '', CHAT_MODEL: '', ALLOWED_ORIGINS: '' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let browser;
  try {
    let ready = false;
    for (let attempt = 0; attempt < 50 && !ready; attempt += 1) {
      ready = await fetch(`${base}/api/health`).then((response) => response.ok).catch(() => false);
      if (!ready) await new Promise((resolve) => setTimeout(resolve, 100));
    }
    assert.equal(ready, true, 'local server started');
    browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || undefined });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, permissions: ['clipboard-read', 'clipboard-write'] });
    // This suite never contacts external sites, AI providers, or integration services.
    await context.route('**/*', (route) => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
    const page = await context.newPage();
    page.setDefaultTimeout(7000);
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    let chatRequests = 0;
    page.on('request', (request) => { if (request.url() === `${base}/api/chat`) chatRequests += 1; });
    const send = async (text) => {
      await page.locator('#chat-question').fill(text);
      await page.locator('.chat-form button').click();
      await page.waitForFunction(() => document.querySelector('.chat-stream').getAttribute('aria-busy') === 'false');
    };

    await page.goto(base);
    await page.locator('.chat-launcher').click();
    await send('What is sand-coated GFRP rebar?');
    assert.match(await page.locator('.chat-stream').innerText(), /glass fiber and a resin matrix/);
    assert.equal(await page.locator('.rfq-section').isVisible(), false, 'ordinary question did not start RFQ');

    const beforeRFQ = chatRequests;
    await page.locator('.prepare-enquiry').click();
    await send(EXAMPLE);
    assert.equal(await page.locator('#rfq-dimensions').inputValue(), '16 mm');
    assert.equal(await page.locator('#rfq-destination').inputValue(), 'Johor, Malaysia');
    assert.equal(await page.locator('#rfq-delivery').inputValue(), 'November 2026');
    assert.match(await page.locator('.rfq-progress').innerText(), /6\/6/);
    await send('Actually, make that 1,500 metres.');
    assert.equal(await page.locator('#rfq-quantity').inputValue(), '1,500 metres');
    await page.locator('.language-toggle').click();
    assert.equal(await page.locator('html').getAttribute('lang'), 'zh-CN');
    assert.equal(await page.locator('#rfq-quantity').inputValue(), '1,500 metres');
    assert.match(await page.locator('.rfq-title').innerText(), /询价草稿/);
    await page.locator('.chat-close').click();
    await page.locator('.chat-launcher').click();
    assert.equal(await page.locator('#rfq-quantity').inputValue(), '1,500 metres');
    await page.locator('.rfq-confirm').click();
    assert.equal(await page.locator('.rfq-status').getAttribute('data-confirmed'), 'true');
    assert.match(await page.locator('.rfq-status').innerText(), /尚未发送/);
    await page.locator('.rfq-copy').click();
    await page.waitForFunction(() => document.querySelector('.rfq-copy-feedback').textContent.includes('已复制'));
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    assert.match(copied, /1,500 metres/);
    assert.match(copied, /尚未发送给销售/);
    await page.locator('#rfq-quantity').fill('700 pieces');
    await page.locator('#rfq-destination').click();
    assert.equal(await page.locator('.rfq-status').getAttribute('data-confirmed'), 'false');
    await page.locator('.rfq-confirm').click();
    await page.locator('.chat-panel').screenshot({ path: path.join(OUTPUT, 'desktop-confirmed.png') });
    assert.equal(chatRequests, beforeRFQ, 'RFQ capture/edit/confirm makes no chat API calls');
    assert.deepEqual(await page.evaluate(() => Object.keys(localStorage)), ['oceanpower-language']);
    assert.deepEqual(await page.evaluate(() => Object.keys(sessionStorage)), []);
    console.log('PASS desktop: enquiry, correction, language, reopen, copy, edit, confirmation, no RFQ storage/API');

    await page.reload();
    await page.locator('.chat-launcher').click();
    assert.equal(await page.locator('.rfq-section').isVisible(), false, 'reload clears draft');
    await page.locator('.language-toggle').click();
    await page.locator('.prepare-enquiry').click();
    await send('I need 20 mm GFRP rockbolts');
    assert.match(await page.locator('.chat-stream').innerText(), /Which rockbolt variant/);
    await send('the general solid one');
    await send('What is its tensile strength?');
    assert.match(await page.locator('.chat-stream').innerText(), /700 MPa/);
    assert.match(await page.locator('.chat-stream .bot-message').last().innerText(), /What will the reinforcement be used for/);
    await send('tunnel support');
    await send('unknown');
    await send('Singapore');
    await send('unknown');
    assert.match(await page.locator('#rfq-quantity-status').innerText(), /Unknown/);
    assert.match(await page.locator('#rfq-delivery-status').innerText(), /Unknown/);
    assert.equal(await page.locator('#rfq-application').inputValue(), 'tunnel support');
    await page.locator('.rfq-confirm').click();
    assert.match(await page.locator('.rfq-status').innerText(), /Nothing has been sent/);
    await page.locator('.chat-reset').click();
    assert.equal(await page.locator('.rfq-section').isVisible(), false);
    assert.doesNotMatch(await page.locator('.chat-stream').innerText(), /Singapore|700 MPa/);
    console.log('PASS conversation: short variant, product-question interruption, unknowns, incomplete confirmation, reset');

    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('.prepare-enquiry').click();
    await send(EXAMPLE);
    await page.locator('.rfq-confirm').click();
    const bounds = await page.locator('.chat-panel').boundingBox();
    assert.ok(bounds.x >= 0 && bounds.y >= 0 && bounds.x + bounds.width <= 390 && bounds.y + bounds.height <= 844, 'mobile panel fits viewport');
    await page.evaluate(() => { navigator.clipboard.writeText = async () => { throw new Error('Test clipboard refusal'); }; });
    await page.locator('.rfq-copy').click();
    await page.locator('.rfq-copy-manual').waitFor({ state: 'visible' });
    assert.match(await page.locator('.rfq-copy-manual').inputValue(), /2,000 metres/);
    await page.locator('.chat-panel').screenshot({ path: path.join(OUTPUT, 'mobile-confirmed.png') });
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.chat-panel').getAttribute('aria-hidden'), 'true');
    assert.deepEqual(errors, [], 'no browser JavaScript errors');
    console.log('PASS mobile: edit/review controls, viewport, clipboard fallback, Escape; no browser errors');
  } finally {
    if (browser) await browser.close();
    if (child.exitCode === null) {
      child.kill();
      await once(child, 'exit');
    }
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
