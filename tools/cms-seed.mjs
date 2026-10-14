import { createRequire } from 'node:module';
import fs from 'node:fs';
const require=createRequire(import.meta.url);
require('../server.js');
const repository=require('../cms/repository.js');
const corporate=JSON.parse(fs.readFileSync('src/content/corporate.json','utf8'));
const businesses=JSON.parse(fs.readFileSync('src/content/businesses.json','utf8'));
const products=JSON.parse(fs.readFileSync('src/content/product-examples.json','utf8'));
const zh=JSON.parse(fs.readFileSync('src/i18n/zh.json','utf8'));
const translate=value=>zh[value]||value;
const flatten=(sections,locale)=>sections.map(section=>[locale==='zh'?translate(section.title):section.title,...section.paragraphs.map(text=>locale==='zh'?translate(text):text)].join('\n\n')).join('\n\n');
if(!repository.configured())throw new Error('Configure MySQL in .env and run npm run cms:migrate first.');
const existing=await repository.listEntries();
const keys=new Set(existing.map(entry=>`${entry.kind}:${entry.slug}`));
const add=async entry=>{if(keys.has(`${entry.kind}:${entry.slug}`))return;await repository.saveEntry(null,entry);console.log(`Created draft ${entry.kind}:${entry.slug}`);};
await add({kind:'page',slug:'home',status:'draft',translations:{en:{title:'Built for the elements.',summary:'Advanced fiber-reinforced polymer reinforcement for infrastructure exposed to corrosion, weight or magnetic constraints.',body:''},zh:{title:translate('Built for the elements.'),summary:translate('Advanced fiber-reinforced polymer reinforcement for the infrastructure that cannot afford corrosion, weight, or magnetic interference.'),body:''}}});
for(const slug of ['about','contact']){const page=corporate[slug];await add({kind:'page',slug,status:'draft',metadata:slug==='contact'?{telephone:'+86 755 83300666',fax:'+86 755 83300726 / 83300727 / 83300728',hotline:'400-6686-126'}:{},translations:{en:{title:page.title,summary:page.intro,body:flatten(page.sections,'en')},zh:{title:translate(page.title),summary:translate(page.intro),body:flatten(page.sections,'zh')}}});}
for(const business of businesses)await add({kind:'business',slug:business.slug,status:'draft',metadata:{label:business.label},translations:{en:{title:business.name,summary:business.summary,body:flatten(business.sections,'en')},zh:{title:translate(business.name),summary:translate(business.summary),body:flatten(business.sections,'zh')}}});
for(const product of products){const slug=(product.route||product.category).split('/').filter(Boolean).at(-1).toLowerCase().replace(/[^a-z0-9]+/g,'-');await add({kind:'product',slug,status:'draft',metadata:{category:product.category,source:product.source||''},translations:{en:{title:product.category,summary:product.content.en?.[0]||'',body:(product.content.en||[]).join('\n\n')},zh:{title:translate(product.category),summary:product.content.zh?.[0]||'',body:(product.content.zh||[]).join('\n\n')}}});}
await add({kind:'document',slug:'frp-rebar-catalogue',status:'draft',metadata:{existingUrl:'/catalogue.pdf'},translations:{en:{title:'FRP Rebar Catalog',summary:'Oceanpower product and company catalogue.',body:''},zh:{title:'FRP 筋材产品目录',summary:'Oceanpower 产品与公司资料目录。',body:''}}});
console.log('Draft CMS content is ready. Review it in /admin before publishing.');
