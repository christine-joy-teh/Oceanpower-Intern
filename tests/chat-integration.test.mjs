import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import { once } from 'node:events';
Object.assign(process.env,{CHAT_API_URL:'',CHAT_API_KEY:'',CHAT_MODEL:'',CHAT_BACKEND_TOKEN:'',ALLOWED_ORIGINS:''});
const {default:chatPlugin}=await import('../tools/chat-plugin.mjs');
const source=await fs.readFile(new URL('../functions/api/[[path]].js',import.meta.url),'utf8');
const {onRequest}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
test('Astro dev and preview use the original API without a second listening server',async()=>{
 for(const hook of ['configureServer','configurePreviewServer']){
  let middleware;chatPlugin()[hook]({middlewares:{use(handler){middleware=handler;}}});
  const server=http.createServer((req,res)=>middleware(req,res,()=>{res.writeHead(404);res.end();}));
  server.listen(0,'127.0.0.1');await once(server,'listening');
  const base='http://127.0.0.1:'+server.address().port;
  try{
   const health=await fetch(base+'/api/health/').then(r=>r.json());assert.equal(health.mode,'catalogue-demo');
   const result=await fetch(base+'/api/chat/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:'BFRP',locale:'en'})}).then(r=>r.json());
   assert.match(result.answer,/750/);assert.equal(result.mode,'catalogue-demo');
   assert.equal((await fetch(base+'/api/chat/')).status,405);
   assert.equal((await fetch(base+'/server.js')).status,404);
  }finally{await new Promise(resolve=>server.close(resolve));}
 }
});
test('Pages bridge restricts routes, origin, size and keeps backend secrets server-side',async()=>{
 const original=globalThis.fetch;const calls=[];
 globalThis.fetch=async(url,options)=>{calls.push({url:String(url),options});return Response.json({answer:'Catalogue test',mode:'catalogue-demo'});};
 const env={CHAT_BACKEND_URL:'https://backend.example',CHAT_BACKEND_TOKEN:'test-bridge-token'};
 const request=(path='/api/chat',body='{}',origin='https://site.example')=>new Request('https://site.example'+path,{method:'POST',headers:{Origin:origin},body});
 try{
  const response=await onRequest({request:request(),env});
  assert.equal(response.status,200);assert.equal(response.headers.get('Cache-Control'),'no-store');
  assert.equal(calls[0].url,'https://backend.example/api/chat');
  assert.equal(calls[0].options.headers.Authorization,'Bearer test-bridge-token');
  assert.equal(JSON.stringify(await response.json()).includes('test-bridge-token'),false);
  assert.equal((await onRequest({request:request('/api/private'),env})).status,404);
  assert.equal((await onRequest({request:request('/api/chat','{}','https://evil.example'),env})).status,403);
  assert.equal((await onRequest({request:request('/api/chat','x'.repeat(50001)),env})).status,413);
  assert.equal(calls.length,1);
  assert.equal((await onRequest({request:request(),env:{}})).status,503);
  const health=await onRequest({request:new Request('https://site.example/api/health'),env:{}});
  assert.equal((await health.json()).mode,'unavailable');
  globalThis.fetch=async()=>{throw Error('private upstream details');};
  const failure=await onRequest({request:request(),env});assert.equal(failure.status,502);assert.equal((await failure.text()).includes('private'),false);
 }finally{globalThis.fetch=original;}
});

test('production preview serves the built site and chatbot, not project sources',async()=>{
 const {createPreviewServer}=await import('../tools/preview.mjs');
 const server=await createPreviewServer();server.listen(0,'127.0.0.1');await once(server,'listening');
 const base='http://127.0.0.1:'+server.address().port;
 try{
  assert.equal((await fetch(base+'/en/')).status,200);
  assert.equal((await fetch(base+'/api/health/').then(r=>r.json())).mode,'catalogue-demo');
  for(const file of ['/server.js','/.env','/knowledge/oceanpower-approved-knowledge.md'])assert.equal((await fetch(base+file)).status,404);
 }finally{await new Promise(resolve=>server.close(resolve));}
});
