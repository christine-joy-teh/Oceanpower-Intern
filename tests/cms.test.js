'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { createCmsRouter } = require('../cms/router');
const { constantTimeEqual, tokenHash } = require('../cms/security');

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
    saveFile: async () => ({id:'file'})
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

test('administrator credentials use constant-time comparison and are not part of session tokens', () => {
  assert.equal(constantTimeEqual('local-demo-password','local-demo-password'),true);
  assert.equal(constantTimeEqual('local-demo-password','wrong-password'),false);
  assert.equal(tokenHash('session-token').length,64);
});
