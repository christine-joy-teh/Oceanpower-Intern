'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createCmsRouter, publicEntry, validFileSignature } = require('../cms/router');
const { answerFromPublishedProducts } = require('../cms/chat-knowledge');
const { constantTimeEqual, tokenHash } = require('../cms/security');
const { retryDeadlockedWrite } = require('../cms/repository');

test('CMS writes retry InnoDB deadlocks but not validation failures', async () => {
  let attempts = 0;
  const result = await retryDeadlockedWrite(async () => {
    attempts += 1;
    if (attempts < 3) throw Object.assign(new Error('deadlock'), { code: 'ER_LOCK_DEADLOCK' });
    return 'saved';
  });
  assert.equal(result, 'saved');
  assert.equal(attempts, 3);
  attempts = 0;
  await assert.rejects(retryDeadlockedWrite(async () => {
    attempts += 1;
    throw Object.assign(new Error('invalid'), { status: 400 });
  }), /invalid/);
  assert.equal(attempts, 1);
});

function fixtureRepository() {
  const sessions = new Map();
  const entries = [];
  return {
    configured: () => true,
    createSession: async (hash,username,csrfToken) => sessions.set(hash,{ token_hash:hash,username,csrf_token:csrfToken }),
    findSession: async (hash) => sessions.get(hash) || null,
    deleteSession: async (hash) => sessions.delete(hash),
    listEntries: async ({kind,publishedOnly}={}) => entries.filter(entry=>(!kind||entry.kind===kind)&&(!publishedOnly||entry.status==='published')),
    saveEntry: async (id,input) => {
      const entry={id:id?Number(id):entries.length+1,kind:input.kind,slug:input.slug,status:input.status,sort_order:Number(input.sortOrder)||0,published_at:null,featured_image_id:null,attachment_id:null,metadata:input.metadata||{},translations:input.translations,specs:input.specs||[]};
      const at=entries.findIndex(item=>item.id===entry.id);if(at>=0)entries[at]=entry;else entries.push(entry);return entry;
    },
    deleteEntry: async (id) => { const at=entries.findIndex(entry=>entry.id===Number(id));if(at<0)return false;entries.splice(at,1);return true; },
    getFile: async () => null,
    fileIsPublic: async () => true,
    saveFile: async () => ({id:'file'}),
    listFiles: async () => [],
    deleteFile: async () => true,
    listRevisions: async () => [{ id: 7, savedAt: new Date('2026-01-01T00:00:00Z'), snapshot: { slug: 'older' } }],
    restoreRevision: async () => ({ id: 1, slug: 'older', kind: 'product', status: 'draft' }),
  };
}

async function withServer(repository, action, admin=null) {
  const router=createCmsRouter(repository,admin);
  const server=http.createServer(async (request,response)=>{if(!await router(request,response)){response.writeHead(404);response.end();}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try { await action(`http://127.0.0.1:${server.address().port}`); }
  finally { await new Promise(resolve=>server.close(resolve)); }
}

test('public website falls back quietly while admin reports missing MySQL configuration', async () => {
  await withServer({configured:()=>false},async base=>{
    const response=await fetch(base+'/api/cms/public?locale=en');
    assert.equal(response.status,200);
    assert.deepEqual(await response.json(),{entries:[],database:'not-configured'});
    const admin=await fetch(base+'/api/cms/session');
    assert.equal(admin.status,503);
    assert.deepEqual(await admin.json(),{error:'The content database is not configured.',code:'CMS_NOT_CONFIGURED'});
  });
});

test('a saved news draft is hidden until published, then appears in the public API', async () => {
  await withServer(fixtureRepository(), async (base) => {
    const login = await fetch(base + '/api/cms/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'editor', password: 'local-demo-password' }) });
    const session = await login.json();
    const headers = { Cookie: login.headers.get('set-cookie').split(';')[0], 'X-CSRF-Token': session.csrfToken, 'Content-Type': 'application/json' };
    const entry = { kind: 'news', slug: 'fictional-test-news', status: 'draft', translations: { en: { title: 'Fictional test news', summary: 'Demo only', body: '' }, zh: { title: '测试新闻', summary: '仅供测试', body: '' } } };
    const created = await fetch(base + '/api/cms/admin/entries', { method: 'POST', headers, body: JSON.stringify(entry) });
    assert.equal(created.status, 201);
    const { entry: saved } = await created.json();
    const publicNews = async () => (await (await fetch(base + '/api/cms/public?locale=en')).json()).entries.filter(item => item.kind === 'news');
    assert.equal((await publicNews()).length, 0);
    entry.status = 'published';
    const published = await fetch(base + '/api/cms/admin/entries/' + saved.id, { method: 'PUT', headers, body: JSON.stringify(entry) });
    assert.equal(published.status, 200);
    assert.equal((await publicNews())[0].title, 'Fictional test news');
  }, { username: 'editor', password: 'local-demo-password' });
});

test('revision restore and media deletion require an authenticated CSRF request', async () => {
  await withServer(fixtureRepository(), async (base) => {
    const login = await fetch(base + '/api/cms/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'editor', password: 'local-demo-password' }) });
    const session = await login.json();
    const cookie = login.headers.get('set-cookie').split(';')[0];
    const revisions = await fetch(base + '/api/cms/admin/entries/1/revisions', { headers: { Cookie: cookie } });
    assert.equal((await revisions.json()).revisions.length, 1);
    const restoreUrl = base + '/api/cms/admin/entries/1/revisions/7/restore';
    assert.equal((await fetch(restoreUrl, { method: 'POST', headers: { Cookie: cookie } })).status, 403);
    assert.equal((await fetch(restoreUrl, { method: 'POST', headers: { Cookie: cookie, 'X-CSRF-Token': session.csrfToken } })).status, 200);
    const deleteUrl = base + '/api/cms/admin/files/12345678-1234-1234-1234-123456789013';
    assert.equal((await fetch(deleteUrl, { method: 'DELETE', headers: { Cookie: cookie } })).status, 403);
    assert.equal((await fetch(deleteUrl, { method: 'DELETE', headers: { Cookie: cookie, 'X-CSRF-Token': session.csrfToken } })).status, 200);
  }, { username: 'editor', password: 'local-demo-password' });
});

test('admin manually syncs published products to the existing chatbot, with draft and stale states', async (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'oceanpower-chat-snapshot-'));
  const previous = process.env.CMS_UPLOAD_DIR;
  process.env.CMS_UPLOAD_DIR = directory;
  t.after(() => { if (previous === undefined) delete process.env.CMS_UPLOAD_DIR; else process.env.CMS_UPLOAD_DIR = previous; fs.rmSync(directory, { recursive: true, force: true }); });
  await withServer(fixtureRepository(), async (base) => {
    const login = await fetch(base + '/api/cms/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'editor', password: 'local-demo-password' }) });
    const session = await login.json();
    const headers = { Cookie: login.headers.get('set-cookie').split(';')[0], 'X-CSRF-Token': session.csrfToken, 'Content-Type': 'application/json' };
    const create = (slug, status) => fetch(base + '/api/cms/admin/entries', { method: 'POST', headers, body: JSON.stringify({
      kind: 'product', slug, status, translations: { en: { title: slug === 'op130' ? 'OP130 soft serve machine' : 'Unpublished machine', summary: 'Staff product summary', body: '' }, zh: { title: slug === 'op130' ? 'OP130 软冰淇淋机' : '未发布机器', summary: '员工产品摘要', body: '' } },
      specs: [{ labelEn: 'Output', labelZh: '产量', value: '30', unit: 'L/h', source: 'Food catalogue p. 18' }],
    }) });
    assert.equal((await create('op130', 'published')).status, 201);
    assert.equal((await create('draft-machine', 'draft')).status, 201);
    const before = await fetch(base + '/api/cms/admin/chat-knowledge', { headers });
    assert.equal((await before.json()).current, false);
    const blocked = await fetch(base + '/api/cms/admin/chat-knowledge', { method: 'POST', headers: { Cookie: headers.Cookie } });
    assert.equal(blocked.status, 403);
    const synced = await fetch(base + '/api/cms/admin/chat-knowledge', { method: 'POST', headers });
    const status = await synced.json();
    assert.equal(status.current, true);
    assert.equal(status.productCount, 1);
    assert.match(answerFromPublishedProducts('OP130 output?', 'en').answer, /30 L\/h/);
    assert.equal(answerFromPublishedProducts('Unpublished machine', 'en'), null);
    assert.match(answerFromPublishedProducts('OP130 exact price and delivery?', 'en').answer, /price or delivery date/);
    assert.equal((await create('another-published', 'published')).status, 201);
    const stale = await fetch(base + '/api/cms/admin/chat-knowledge', { headers });
    assert.equal((await stale.json()).current, false);
  }, { username: 'editor', password: 'local-demo-password' });
});

test('media signatures, public gallery URLs and video byte ranges are handled safely', async () => {
  assert.equal(validFileSignature('video/mp4', Buffer.from('0000ftypisom')), true);
  assert.equal(validFileSignature('video/mp4', Buffer.from('<script>alert(1)</script>')), false);
  assert.equal(validFileSignature('application/pdf', Buffer.from('%PDF-1.7')), true);
  const entry = { id: 1, kind: 'product', slug: 'op130', status: 'published', metadata: { galleryIds: ['12345678-1234-1234-1234-123456789012'], videoId: '12345678-1234-1234-1234-123456789013' }, translations: { en: { title: 'OP130' }, zh: { title: 'OP130' } }, specs: [] };
  const result = publicEntry(entry, 'en');
  assert.equal(result.gallery.length, 1);
  assert.match(result.video, /\/api\/cms\/files\//);
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'oceanpower-video-range-'));
  const filePath = path.join(directory, 'clip.mp4');
  fs.writeFileSync(filePath, Buffer.from('0000ftypisom'));
  try {
    const repo = fixtureRepository();
    repo.getFile = async () => ({ path: filePath, byte_size: 12, mime_type: 'video/mp4', original_name: 'clip.mp4' });
    await withServer(repo, async (base) => {
      const response = await fetch(base + '/api/cms/files/12345678-1234-1234-1234-123456789013', { headers: { Range: 'bytes=4-7' } });
      assert.equal(response.status, 206);
      assert.equal(await response.text(), 'ftyp');
      const invalid = await fetch(base + '/api/cms/files/12345678-1234-1234-1234-123456789013', { headers: { Range: 'bytes=100-200' } });
      assert.equal(invalid.status, 416);
    });
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});

test('environment-configured administrator can sign in and CRUD bilingual published content', async () => {
  await withServer(fixtureRepository(),async base=>{
    const login=await fetch(base+'/api/cms/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:'editor',password:'local-demo-password'})});
    assert.equal(login.status,200);
    const session=await login.json();
    const cookie=login.headers.get('set-cookie').split(';')[0];
    assert.ok(session.csrfToken);
    const entry={kind:'news',slug:'coastal-project',status:'published',sortOrder:1,metadata:{category:'Project'},translations:{en:{title:'Coastal project update',summary:'Project summary',body:'Project body'},zh:{title:'沿海项目更新',summary:'项目摘要',body:'项目内容'}},specs:[]};
    const created=await fetch(base+'/api/cms/admin/entries',{method:'POST',headers:{Cookie:cookie,'X-CSRF-Token':session.csrfToken,'Content-Type':'application/json'},body:JSON.stringify(entry)});
    assert.equal(created.status,201);
    const publicZh=await fetch(base+'/api/cms/public?locale=zh&kind=news');
    assert.equal(publicZh.status,200);
    assert.equal((await publicZh.json()).entries[0].title,'沿海项目更新');
    const list=await fetch(base+'/api/cms/admin/entries?kind=news',{headers:{Cookie:cookie}});
    assert.equal(list.status,200);
    assert.equal((await list.json()).entries.length,1);
    const blocked=await fetch(base+'/api/cms/admin/entries/1',{method:'DELETE',headers:{Cookie:cookie}});
    assert.equal(blocked.status,403);
    const removed=await fetch(base+'/api/cms/admin/entries/1',{method:'DELETE',headers:{Cookie:cookie,'X-CSRF-Token':session.csrfToken}});
    assert.equal(removed.status,200);
  },{username:'editor',password:'local-demo-password'});
});

test('session cookie is Secure when the request arrived over HTTPS through a proxy', async () => {
  await withServer(fixtureRepository(),async base=>{
    const login=await fetch(base+'/api/cms/login',{method:'POST',headers:{'Content-Type':'application/json','X-Forwarded-Proto':'https'},body:JSON.stringify({username:'editor',password:'local-demo-password'})});
    assert.equal(login.status,200);
    assert.match(login.headers.get('set-cookie'),/;\s*Secure/);
  },{username:'editor',password:'local-demo-password'});
});

test('login rate limit cannot be bypassed by rotating a client-supplied X-Forwarded-For', async () => {
  await withServer(fixtureRepository(),async base=>{
    const statuses=[];
    for(let i=0;i<10;i++){
      const response=await fetch(base+'/api/cms/login',{method:'POST',headers:{'Content-Type':'application/json','X-Forwarded-For':`203.0.113.${i}, 198.51.100.7`},body:JSON.stringify({username:'editor',password:'wrong-password'})});
      statuses.push(response.status);
    }
    assert.ok(statuses.includes(429),statuses.join(','));
  },{username:'editor',password:'local-demo-password'});
});

test('public entries fall back to the other language when the requested title is empty', () => {
  const entry={id:1,kind:'product',slug:'zh-only',status:'published',sort_order:0,published_at:null,metadata:{},specs:[],featured_image_id:null,attachment_id:null,
    translations:{en:{title:'',summary:'',body:''},zh:{title:'仅中文产品',summary:'中文摘要',body:''}}};
  assert.equal(publicEntry(entry,'en').title,'仅中文产品');
  assert.equal(publicEntry(entry,'zh').title,'仅中文产品');
  entry.translations.en={title:'English product',summary:'',body:''};
  assert.equal(publicEntry(entry,'en').title,'English product');
});

test('administrator credentials use constant-time comparison and are not part of session tokens', () => {
  assert.equal(constantTimeEqual('local-demo-password','local-demo-password'),true);
  assert.equal(constantTimeEqual('local-demo-password','wrong-password'),false);
  assert.equal(tokenHash('session-token').length,64);
});

test('public CMS omits retired products and catalogues without deleting stored records', async () => {
  const repo=fixtureRepository();
  for(const [slug,title] of [['gfrp','GFRP Rebar'],['frp-rebar-catalogue','Product catalogue'],['asphalt','Asphalt modifier']]) {
    await repo.saveEntry(null,{kind:'product',slug,status:'published',translations:{en:{title,summary:'',body:''}}});
  }
  await withServer(repo,async base=>{
    for(const locale of ['en','zh']) {
      const result=await fetch(base+'/api/cms/public?locale='+locale).then(r=>r.json());
      assert.deepEqual(result.entries.map(entry=>entry.slug),['asphalt']);
    }
    assert.equal((await repo.listEntries()).length,3);
  });
});

test('a retired attachment does not hide unrelated published news and photos', async () => {
  const repo = fixtureRepository();
  const news = await repo.saveEntry(null, { kind: 'news', slug: 'company-update', status: 'published', translations: { en: { title: 'Company update', summary: '', body: '' }, zh: { title: '公司动态', summary: '', body: '' } } });
  news.featured_image_id = '12345678-1234-1234-1234-123456789012';
  news.image_name = 'company-photo.png';
  news.attachment_id = '12345678-1234-1234-1234-123456789013';
  news.attachment_name = 'old-gfrp-catalogue.pdf';
  await withServer(repo, async base => {
    const result = await fetch(base + '/api/cms/public?locale=en').then(response => response.json());
    assert.equal(result.entries.length, 1);
    assert.equal(result.entries[0].image, '/api/cms/files/' + news.featured_image_id);
    assert.equal(result.entries[0].attachment, null);
  });
});
