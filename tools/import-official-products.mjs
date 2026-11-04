import fs from 'node:fs/promises';
import {load} from 'cheerio';

const baseUrl='https://www.opxincai.com/';
const categories=[
  {id:'frp',typeId:50076,route:'products/fibre-reinforced-composites',name:{zh:'纤维增强复合材料',en:'Fibre-reinforced composites'}},
  {id:'asphalt',typeId:50027,route:'products/asphalt-based-products',name:{zh:'沥青基产品',en:'Asphalt-based products'}},
  {id:'cement',typeId:50026,route:'products/cement-based-products',name:{zh:'水泥基产品',en:'Cement-based products'}},
  {id:'monitoring',typeId:50028,route:'products/safety-monitoring-systems',name:{zh:'安全监测系统',en:'Safety-monitoring systems'}},
  {id:'solutions',typeId:50024,route:'products/integrated-solutions',name:{zh:'解决方案',en:'Engineering solutions'}},
  {id:'additives',typeId:50060,route:'products/functional-additives',name:{zh:'功能助剂产品',en:'Functional-additive applications'}},
  {id:'colour',typeId:50059,route:'products/colour-systems',name:{zh:'色彩系统产品',en:'Colour-system products'}},
];

const subgroupLabels={
  '50078':{zh:'荣誉资质',en:'Credentials'},'50079':{zh:'产品简介',en:'Products'},'50080':{zh:'产品应用',en:'Applications'},'50081':{zh:'工程案例',en:'Project cases'},
  '50034':{zh:'纤维',en:'Fibres'},'50035':{zh:'混合料改性剂',en:'Mixture modifiers'},'50036':{zh:'彩色沥青',en:'Coloured asphalt'},
  '50030':{zh:'纤维',en:'Fibres'},'50031':{zh:'外加剂',en:'Admixtures'},'50032':{zh:'土工材料',en:'Geotechnical materials'},
  '50053':{zh:'光纤光栅传感器',en:'FBG sensors'},'50054':{zh:'光纤光栅监测系统',en:'FBG monitoring systems'},'50055':{zh:'光纤光栅信号处理器',en:'FBG signal processors'},
  '50044':{zh:'位移监测',en:'Displacement monitoring'},'50045':{zh:'应变监测',en:'Strain monitoring'},'50046':{zh:'应力监测',en:'Stress monitoring'},'50047':{zh:'倾斜监测',en:'Tilt monitoring'},'50048':{zh:'振动监测',en:'Vibration monitoring'},'50049':{zh:'环境监测',en:'Environmental monitoring'},'50050':{zh:'数据采集系统',en:'Data acquisition'},'50052':{zh:'客户端软件平台',en:'Monitoring software'},
  '50056':{zh:'沥青基解决方案',en:'Asphalt solutions'},'50057':{zh:'安全监测解决方案',en:'Safety-monitoring solutions'},'50058':{zh:'水泥基解决方案',en:'Cement-based solutions'},
  '50065':{zh:'建筑涂料领域',en:'Architectural coatings'},'50066':{zh:'水性工业漆领域',en:'Waterborne industrial coatings'},'50067':{zh:'聚合物砂浆领域',en:'Polymer mortars'},
  '50061':{zh:'色卡产品系列',en:'Colour cards'},'50062':{zh:'调色设备系列',en:'Tinting equipment'},'50063':{zh:'配色软件与工具',en:'Colour software and tools'},
};

function clean(value=''){return value.replace(/\u00a0/g,' ').replace(/[ \t]+/g,' ').replace(/\n[ \t]+/g,'\n').replace(/\n{3,}/g,'\n\n').trim();}
function textWithBreaks(html=''){
  const prepared=html
    .replace(/<script[\s\S]*?<\/script>/gi,'')
    .replace(/<style[\s\S]*?<\/style>/gi,'')
    .replace(/<br\s*\/?\s*>/gi,'\n')
    .replace(/<\/p\s*>/gi,'\n\n')
    .replace(/<\/h[1-6]\s*>/gi,'\n\n')
    .replace(/<\/li\s*>/gi,'\n')
    .replace(/<\/tr\s*>/gi,'\n')
    .replace(/<\/t[dh]\s*>/gi,' | ');
  return clean(load(`<div>${prepared}</div>`)('div').first().text());
}
function productKey(url){const parsed=new URL(url);return `${parsed.searchParams.get('TypeId')}:${parsed.searchParams.get('Id')}`;}

async function getHtml(url){
  const response=await fetch(url,{headers:{'user-agent':'Oceanpower catalogue archival importer/1.0'}});
  if(!response.ok)throw new Error(`${response.status} ${url}`);
  return response.text();
}

async function listCategory(category){
  const entries=new Map();
  for(let page=1;page<=12;page++){
    const url=new URL(`pro.aspx?FId=t3:${category.typeId}:3&TypeId=${category.typeId}${page>1?`&pageindex=${page}`:''}`,baseUrl).href;
    const doc=load(await getHtml(url));
    doc('.n_pro_main').each((_,element)=>{
      const anchor=doc(element).find('.n_pro_main_name a').first();
      const title=clean(anchor.text());
      const href=anchor.attr('href');
      if(!title||!href)return;
      const sourceUrl=new URL(href,url).href;
      const typeId=new URL(sourceUrl).searchParams.get('TypeId')||'';
      const listSummary=clean(doc(element).find('.n_pro_main_cnt').text());
      entries.set(productKey(sourceUrl),{title,sourceUrl,typeId,listSummary});
    });
    const hasNext=doc('a[href*=pageindex]').toArray().some(anchor=>(doc(anchor).attr('href')||'').includes(`pageindex=${page+1}`));
    if(!hasNext)break;
  }
  return [...entries.values()];
}

async function hydrate(entry){
  const doc=load(await getHtml(entry.sourceUrl));
  const title=clean(doc('h1').first().text())||entry.title;
  const releaseDate=clean(doc('.prod_view_time').text()).replace(/^上市日期[：:]\s*/, '');
  const summary=clean(doc('.prod_view_ms').text());
  const detailRoot=doc('.prod_js').first();
  detailRoot.find('script,style,noscript').remove();
  const description=textWithBreaks(detailRoot.html()||'')||summary||entry.listSummary;
  const sourceImages=detailRoot.find('img').toArray().map(image=>doc(image).attr('data-original')||doc(image).attr('src')).filter(Boolean).filter(src=>!/(incsp1_products|leftarrow|rightarrow)/i.test(src)).map(src=>new URL(src,entry.sourceUrl).href);
  const {listSummary,...baseEntry}=entry;
  return {...baseEntry,title,releaseDate,summary:summary||listSummary,description,sourceImages,subgroup:subgroupLabels[entry.typeId]||{zh:'其他',en:'Other'}};
}

async function mapConcurrent(items,limit,worker){
  const results=new Array(items.length);let cursor=0;
  async function run(){while(cursor<items.length){const index=cursor++;results[index]=await worker(items[index]);}}
  await Promise.all(Array.from({length:Math.min(limit,items.length)},run));
  return results;
}

const output={source:{name:'深圳海川新材料科技股份有限公司',url:baseUrl,fetchedAt:new Date().toISOString().slice(0,10),status:'Official-site archive; verify current availability and specifications with Oceanpower staff.'},categories:[]};
for(const category of categories){
  const listed=await listCategory(category);
  process.stdout.write(`[official-products] ${category.id}: ${listed.length} entries\n`);
  const entries=await mapConcurrent(listed,6,hydrate);
  output.categories.push({...category,entries});
}
await fs.writeFile(new URL('../src/content/official-products.json',import.meta.url),`${JSON.stringify(output,null,2)}\n`,'utf8');
process.stdout.write(`[official-products] wrote ${output.categories.reduce((sum,category)=>sum+category.entries.length,0)} entries\n`);
