import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';

const root = path.resolve('dist');
const server = http.createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    const file = path.join(root, pathname.endsWith('/') ? pathname + 'index.html' : pathname);
    const data = await fs.readFile(file);
    response.writeHead(200, { 'Content-Type': { '.html':'text/html', '.js':'text/javascript', '.css':'text/css' }[path.extname(file)] || 'application/octet-stream' });
    response.end(data);
  } catch { response.writeHead(404); response.end(); }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const candidates = [process.env.CHROMIUM_EXECUTABLE_PATH, 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].filter(Boolean);
let executablePath;
for (const candidate of candidates) if (await fs.access(candidate).then(() => true, () => false)) { executablePath = candidate; break; }
let browser;
try {
  browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  const page = await browser.newPage({ viewport: { width: 1280, height: 850 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  let upload = 0;
  let saved;
  await page.route('**/api/cms/**', async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;
    let body = {};
    if (pathname === '/api/cms/session') body = { user: { username: 'demo' }, csrfToken: 'test-token' };
    else if (pathname === '/api/cms/admin/entries' && request.method() === 'GET') body = { entries: [] };
    else if (pathname === '/api/cms/admin/files' && request.method() === 'GET') body = { files: [] };
    else if (pathname === '/api/cms/admin/files' && request.method() === 'POST') body = { file: { id: `00000000-0000-0000-0000-${String(++upload).padStart(12, '0')}`, originalName: decodeURIComponent(request.headers()['x-file-name']), url: `/api/cms/files/${upload}` } };
    else if (pathname === '/api/cms/admin/chat-knowledge' && request.method() === 'GET') body = { current: false, publishedCount: 1, productCount: 0, builtAt: null };
    else if (pathname === '/api/cms/admin/chat-knowledge' && request.method() === 'POST') body = { current: true, publishedCount: 1, productCount: 1, builtAt: new Date().toISOString() };
    else if (pathname === '/api/cms/admin/entries' && request.method() === 'POST') { saved = request.postDataJSON(); body = { entry: { id: 1, kind: saved.kind, slug: saved.slug, status: saved.status, sort_order: 0, metadata: saved.metadata, translations: saved.translations, specs: saved.specs } }; }
    else if (pathname.endsWith('/revisions')) body = { revisions: [] };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
  await page.goto(origin + '/admin/');
  await page.locator('#admin-view').waitFor({ state: 'visible' });
  await page.locator('#new-entry').click();
  await page.locator('[name=slug]').fill('demo-food-machine');
  await page.locator('[name=titleZh]').fill('演示冰淇淋机');
  await page.locator('[name=titleEn]').fill('Demo ice cream machine');
  await page.locator('#gallery-upload').setInputFiles({ name: 'demo.png', mimeType: 'image/png', buffer: Buffer.from([137,80,78,71,13,10,26,10]) });
  await page.locator('#gallery-list .media-row').waitFor();
  await page.locator('#video-upload').setInputFiles({ name: 'demo.mp4', mimeType: 'video/mp4', buffer: Buffer.from('0000ftypisom') });
  await page.locator('#video-slot .media-row').waitFor();
  await page.locator('#preview-entry').click();
  assert.equal(await page.locator('#preview-title-zh').textContent(), '演示冰淇淋机');
  assert.equal(await page.locator('#preview-title-en').textContent(), 'Demo ice cream machine');
  await page.locator('#save-entry').click();
  await page.waitForFunction(() => document.querySelector('#editor-status')?.textContent.includes('已保存'));
  assert.equal(saved.metadata.galleryIds.length, 1);
  assert.ok(saved.metadata.videoId);
  await page.locator('#knowledge-sync').click();
  await page.waitForFunction(() => document.querySelector('#knowledge-status')?.textContent.includes('更新成功'));
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
  await page.route('**/api/chat/', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ answer: 'OP130: 30 L/h', mode: 'catalogue-demo', sourceStatus: 'staff-published', sources: [{ label: 'Published website product entry', detail: 'op130' }] }) }));
  await page.goto(origin + '/en/products/');
  await page.locator('.chat-launcher').click();
  await page.locator('#catalogue-question').fill('OP130 output?');
  await page.locator('#catalogue-form button').click();
  await page.waitForFunction(() => document.querySelector('#chat-mode')?.textContent.includes('Published website product information'));
  assert.match(await page.locator('.chat-stream').textContent(), /OP130: 30 L\/h/);
  assert.deepEqual(errors, []);
  console.log('Admin browser: gallery, video, bilingual preview, save, manual sync, chat source label and mobile width passed.');
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}
