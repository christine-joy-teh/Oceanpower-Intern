import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';
import manifest from '../src/content/routes.json' with { type: 'json' };

const root = path.resolve('dist');
const server = http.createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    let file = path.resolve(root, '.' + pathname);
    if (!file.startsWith(root + path.sep) && file !== root) throw Error('Invalid path');
    if (pathname.endsWith('/')) file = path.join(file, 'index.html');
    const data = await fs.readFile(file);
    response.writeHead(200, { 'Content-Type': { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.jpg':'image/jpeg', '.webp':'image/webp' }[path.extname(file)] || 'application/octet-stream' });
    response.end(data);
  } catch { response.writeHead(404); response.end('Not found'); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const candidates = [process.env.CHROMIUM_EXECUTABLE_PATH,'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Google/Chrome/Application/chrome.exe'].filter(Boolean);
let executablePath;
for (const candidate of candidates) if (await fs.access(candidate).then(() => true, () => false)) { executablePath = candidate; break; }
let browser;
try {
  browser = await chromium.launch({headless:true,...(executablePath?{executablePath}:{})});
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror',error => errors.push(error.message));
  page.on('console',message => { if (message.type()==='error' && !/Failed to load resource/.test(message.text())) errors.push(message.text()); });
  await page.route('https://fonts.googleapis.com/**',route => route.fulfill({status:200,contentType:'text/css',body:''}));
  await page.route('**/api/cms/public?*',route => route.fulfill({json:{entries:[]}}));
  const forbidden = /\b(?:GFRP|BFRP|CFRP|FRP|rebar|rockbolt)\b|江苏海川/i;
  for (const locale of manifest.locales) {
    const prefix = locale==='zh' ? '/' : `/${locale}/`;
    for (const route of manifest.routes) {
      for (const width of [1440,768,390,375]) {
        await page.setViewportSize({width,height:900});
        const response = await page.goto(origin+prefix+(route?route+'/':''));
        assert.equal(response.status(),200,`${locale}/${route}`);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth<=innerWidth+1),true,`${locale}/${route} overflow at ${width}`);
        const text = await page.locator('main').innerText();
        if(route==='' && width===390 && locale==='es')assert.match(text,/Tecnología para la industria y la vida cotidiana/);
        if(route==='' && width===390 && locale==='fr')assert.match(text,/La technologie au service de l’industrie et du quotidien/);
        assert.doesNotMatch(text,forbidden,`${locale}/${route} still shows Jiangsu reinforcement`);
        assert.equal(await page.locator('.chat-launcher,[data-rfq-start]').count(),0,`${locale}/${route} still has the old assistant`);
      }
    }
  }
  await page.setViewportSize({width:375,height:844});
  await page.goto(origin+'/');
  await fs.mkdir('tmp/site-browser',{recursive:true});
  await page.screenshot({path:'tmp/site-browser/shenzhen-home-phone.png',fullPage:true});
  assert.equal(await page.locator('.hero-sector').count(),4);
  assert.equal(await page.locator('.hero-stats').count(),0);
  for (const selector of ['.menu-toggle','.language-menu summary']) {
    const box=await page.locator(selector).boundingBox();
    assert.ok(box && box.height>=44,`${selector} needs a 44px phone target`);
  }
  await page.locator('.menu-toggle').click();
  assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'true');
  await page.locator('#site-nav a[href="/business/"]').first().click();
  assert.equal(new URL(page.url()).pathname,'/business/');
  assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'false');
  await page.goto(origin+'/business/food/');
  assert.equal(await page.locator('.company-review-note').count(),1);
  await page.locator('.language-menu summary').click();
  await page.locator('.language-menu a[lang="en"]').click();
  assert.equal(new URL(page.url()).pathname,'/en/business/food/');
  assert.equal(await page.locator('.company-contact-link').getAttribute('href'),'/en/contact/');
  // Exercise the public CMS overlay without publishing test records to the shared database.
  await page.route('**/api/cms/public?*', route => route.fulfill({json:{entries:[
    {kind:'page',slug:'home',title:'CMS homepage check',summary:'CMS homepage summary'},
    {kind:'business',slug:'food',title:'CMS food business check',summary:'CMS business summary',image:'/assets/business-environment.jpg'},
    {kind:'news',slug:'fictional-test-news',title:'Fictional CMS news check',summary:'Demo only',body:'Test article body'},
  ]}}));
  await page.goto(origin+'/en/');
  await page.waitForFunction(() => document.querySelector('.hero h1')?.textContent === 'CMS homepage check');
  assert.equal(await page.locator('.hero-text').textContent(),'CMS homepage summary');
  await page.waitForFunction(() => document.querySelector('.business-profile-card[href="/en/business/food/"] img')?.getAttribute('src') === '/assets/business-environment.jpg');
  await page.goto(origin+'/en/business/food/');
  await page.waitForFunction(() => document.querySelector('.company-profile h1')?.textContent === 'CMS food business check');
  assert.equal(await page.locator('.company-profile-lead').textContent(),'CMS business summary');
  assert.equal(await page.locator('.company-profile-heading img').getAttribute('src'),'/assets/business-environment.jpg');
  assert.equal(await page.locator('.cms-page-media').count(),0,'Featured image should replace the business image instead of appearing again below the page');
  await page.goto(origin+'/en/news/');
  await page.waitForFunction(() => document.querySelector('[data-cms-news] h2')?.textContent === 'Fictional CMS news check');
  assert.equal(await page.locator('[data-cms-news] .cms-entry-card').count(),1);
  await page.goto(origin+'/es/');
  assert.notEqual(await page.locator('.hero h1').textContent(),'CMS homepage check');
  for(const route of ['products/gfrp','products/bfrp','products/cfrp','products/fibre-reinforced-composites'])assert.equal((await page.goto(origin+'/en/'+route+'/')).status(),404);
  assert.equal((await page.goto(origin+'/catalogue.pdf')).status(),404);
  assert.deepEqual(errors,[]);
  console.log(`Browser checks passed: ${manifest.routes.length*manifest.locales.length} routes at desktop, phone and tablet widths; four Shenzhen business links, mobile navigation, no public FRP pages or old chat controls.`);
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
