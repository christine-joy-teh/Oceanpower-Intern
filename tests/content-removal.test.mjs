import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { once } from 'node:events';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const {isRetiredContent}=require('../content-policy');
Object.assign(process.env,{CHAT_API_URL:'',CHAT_API_KEY:'',CHAT_MODEL:'',CHAT_BACKEND_TOKEN:'',ALLOWED_ORIGINS:''});

test('published site excludes reinforcement pages, downloads and product claims',async()=>{
  for (const file of await fs.readdir('dist',{recursive:true})) {
    if (!/\.(html|js|xml)$/.test(file)) continue;
    assert.equal(isRetiredContent(await fs.readFile('dist/'+file,'utf8')),false,file);
  }
  const {createPreviewServer}=await import('../tools/preview.mjs');
  const server=await createPreviewServer();server.listen(0,'127.0.0.1');await once(server,'listening');
  const base='http://127.0.0.1:'+server.address().port;
  try {
    for(const route of ['/catalogue.pdf','/gfrp.html','/assets/gfrp-product.jpg',...['','en/','es/','fr/'].flatMap(prefix=>['gfrp','bfrp','cfrp','fibre-reinforced-composites'].map(p=>'/'+prefix+'products/'+p+'/'))]) {
      assert.equal((await fetch(base+route)).status,404,route);
    }
    for(const locale of ['en','zh','es','fr']) {
      const result=await fetch(base+'/api/chat/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:'Compare GFRP, BFRP and CFRP strength',locale})}).then(r=>r.json());
      assert.ok(result.answer);assert.equal(isRetiredContent(result),false);assert.deepEqual(result.sources,[]);
    }
  }finally{await new Promise(resolve=>server.close(resolve));}
});

test('retired CMS entries are recognized in either language without excluding retained products',()=>{
  for(const record of [{slug:'fibre-reinforced-composites'},{metadata:{existingUrl:'/catalogue.pdf'}},{translations:{zh:{title:'玻璃纤维增强筋'}}},{title:'BFRP Rebar'}]) assert.equal(isRetiredContent(record),true);
  for(const title of ['Rad Spunrie asphalt modifier','Fibre Bragg grating temperature sensor','Polycarboxylate concrete admixture']) assert.equal(isRetiredContent({title}),false);
});
