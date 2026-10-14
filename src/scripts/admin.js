const state={csrf:'',kind:'product',entries:[],current:null};
const $=selector=>document.querySelector(selector);
const loginView=$('#login-view');const adminView=$('#admin-view');const loginForm=$('#login-form');const form=$('#entry-form');
const loginStatus=$('#login-status');const editorStatus=$('#editor-status');const entryList=$('#entry-list');
const headings={page:'首页与公司页面',business:'业务介绍',product:'产品',news:'新闻',document:'下载资料'};
const statusLabels={draft:'草稿',published:'已发布'};
const errorLabels=new Map([
 ['The content database is not configured.','内容数据库尚未配置，请检查本地 .env 文件。'],
 ['The admin login is not configured in the local environment.','管理员账号尚未配置，请在 .env 中填写 CMS_ADMIN_USERNAME 和 CMS_ADMIN_PASSWORD。'],
 ['The content service could not complete this request.','无法连接本地内容数据库，请检查 MySQL 服务和 .env 配置。'],
 ['Username or password is incorrect.','用户名或密码不正确。'],
 ['Too many login attempts. Try again later.','登录尝试次数过多，请稍后再试。'],
 ['Sign in to manage website content.','请先登录后再管理网站内容。'],
 ['Your session ended. Sign in again.','登录已过期，请重新登录。'],
 ['Your session could not be verified. Refresh and try again.','无法验证登录状态，请刷新页面后重试。'],
 ['A URL slug is required.','请填写网址名称。'],
 ['Add an English or Chinese title.','请至少填写中文或英文标题。'],
 ['That content type already uses this slug.','该内容类型已使用这个网址名称。'],
 ['Content entry not found.','找不到该内容，请刷新列表后重试。'],
 ['Request is too large.','上传内容过大。'],
 ['Upload a JPG, PNG, WebP, GIF or PDF file.','请上传 JPG、PNG、WebP、GIF 图片或 PDF 文件。'],
 ['Choose a non-empty file.','请选择一个非空文件。']
]);
function localError(message){return errorLabels.get(message)||'操作未完成，请检查本地 MySQL 配置后重试。';}

async function api(url,options={}){
 const headers={...(options.headers||{})};if(state.csrf&&options.method&&!['GET','HEAD'].includes(options.method))headers['X-CSRF-Token']=state.csrf;
 const response=await fetch(url,{credentials:'same-origin',...options,headers});let data={};try{data=await response.json();}catch{}
 if(response.status===401&&url!=='/api/cms/login'){showLogin();const error=new Error('登录已过期，请重新登录。');error.status=401;throw error;}
 if(!response.ok){const error=new Error(localError(data.error));error.status=response.status;throw error;}return data;
}
function message(element,text,error=false){element.textContent=text;element.dataset.error=String(error);}
function showLogin(){adminView.hidden=true;loginView.hidden=false;state.csrf='';$('#admin-password').value='';}
function showAdmin(session){loginView.hidden=true;adminView.hidden=false;state.csrf=session.csrfToken;$('#signed-in-user').textContent=session.user.username;selectKind(state.kind);}
async function restoreSession(){try{showAdmin(await api('/api/cms/session'));}catch(error){showLogin();if(error.status!==401)message(loginStatus,error.message,true);}}

loginForm.addEventListener('submit',async event=>{event.preventDefault();message(loginStatus,'正在验证账号…');const body=Object.fromEntries(new FormData(loginForm));try{showAdmin(await api('/api/cms/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}));loginForm.reset();}catch(error){message(loginStatus,error.message,true);}});
$('#logout-button').addEventListener('click',async()=>{try{await api('/api/cms/logout',{method:'POST'});}finally{showLogin();}});

async function selectKind(kind){state.kind=kind;document.querySelectorAll('[data-kind]').forEach(button=>button.setAttribute('aria-current',String(button.dataset.kind===kind)));$('#entries-heading').textContent=headings[kind];form.elements.kind.value=kind;await loadEntries();}
document.querySelectorAll('[data-kind]').forEach(button=>button.addEventListener('click',()=>selectKind(button.dataset.kind)));

async function loadEntries(){entryList.setAttribute('aria-busy','true');entryList.innerHTML='<p class="empty-state">正在读取网站内容…</p>';try{const data=await api('/api/cms/admin/entries?kind='+encodeURIComponent(state.kind));state.entries=data.entries;renderEntries();}catch(error){entryList.innerHTML='';const p=document.createElement('p');p.className='empty-state error';p.textContent=error.message;entryList.append(p);}finally{entryList.removeAttribute('aria-busy');}}
function renderEntries(){entryList.replaceChildren();$('#entry-count').textContent=`共 ${state.entries.length} 项`;if(!state.entries.length){const p=document.createElement('p');p.className='empty-state';p.textContent=`暂无${headings[state.kind]}。点击“新增内容”创建第一项。`;entryList.append(p);return;}for(const entry of state.entries){const button=document.createElement('button');button.type='button';button.className='entry-row';button.dataset.id=entry.id;button.innerHTML='<span></span><small></small><b></b>';button.querySelector('span').textContent=entry.translations?.zh?.title||entry.translations?.en?.title||entry.slug;button.querySelector('small').textContent=entry.slug;button.querySelector('b').textContent=statusLabels[entry.status]||entry.status;button.addEventListener('click',()=>editEntry(entry));entryList.append(button);}}

function clearForm(){form.reset();form.elements.id.value='';form.elements.kind.value=state.kind;form.elements.sortOrder.value='0';form.elements.status.value='draft';state.current=null;$('#editor-heading').textContent='新增内容';$('#delete-entry').hidden=true;$('#image-name').textContent='尚未选择图片。';$('#document-name').textContent='尚未选择文件。';message(editorStatus,'');form.elements.slug.focus();}
$('#new-entry').addEventListener('click',clearForm);
function editEntry(entry){state.current=entry;const en=entry.translations?.en||{};const zh=entry.translations?.zh||{};const values={id:entry.id,kind:entry.kind,slug:entry.slug,status:entry.status,sortOrder:entry.sort_order,titleEn:en.title||'',summaryEn:en.summary||'',bodyEn:en.body||'',titleZh:zh.title||'',summaryZh:zh.summary||'',bodyZh:zh.body||'',metadata:JSON.stringify(entry.metadata||{},null,2),publishedAt:entry.published_at?new Date(entry.published_at).toISOString().slice(0,16):'',featuredImageId:entry.featured_image_id||'',attachmentId:entry.attachment_id||''};for(const [key,value] of Object.entries(values))if(form.elements[key])form.elements[key].value=value;form.elements.specs.value=(entry.specs||[]).map(spec=>[spec.labelEn,spec.labelZh,spec.value,spec.unit,spec.source].join(' | ')).join('\n');$('#image-name').textContent=entry.image_name||'尚未选择图片。';$('#document-name').textContent=entry.attachment_name||'尚未选择文件。';$('#editor-heading').textContent='编辑：'+(zh.title||en.title||entry.slug);$('#delete-entry').hidden=false;message(editorStatus,'');form.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});}

function parseSpecs(value){return value.split(/\r?\n/).map((line,index)=>{const [labelEn='',labelZh='',specValue='',unit='',source='']=line.split('|').map(part=>part.trim());return{labelEn,labelZh,value:specValue,unit,source,sortOrder:index};}).filter(spec=>spec.labelEn||spec.labelZh||spec.value);}
function formBody(){let metadata={};const raw=form.elements.metadata.value.trim();if(raw){try{metadata=JSON.parse(raw);}catch{throw new Error('JSON 扩展设置格式不正确，请检查后重试。');}}return{kind:form.elements.kind.value,slug:form.elements.slug.value,status:form.elements.status.value,sortOrder:Number(form.elements.sortOrder.value)||0,publishedAt:form.elements.publishedAt.value||null,featuredImageId:form.elements.featuredImageId.value||null,attachmentId:form.elements.attachmentId.value||null,metadata,specs:parseSpecs(form.elements.specs.value),translations:{en:{title:form.elements.titleEn.value,summary:form.elements.summaryEn.value,body:form.elements.bodyEn.value},zh:{title:form.elements.titleZh.value,summary:form.elements.summaryZh.value,body:form.elements.bodyZh.value}}};}
form.addEventListener('submit',async event=>{event.preventDefault();message(editorStatus,'正在保存网站内容…');try{const id=form.elements.id.value;const data=await api('/api/cms/admin/entries'+(id?'/'+id:''),{method:id?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(formBody())});state.kind=data.entry.kind;await loadEntries();editEntry(data.entry);message(editorStatus,'内容已保存。已发布内容会立即显示在网站上。');}catch(error){message(editorStatus,error.message,true);editorStatus.focus();}});
$('#delete-entry').addEventListener('click',async()=>{const id=form.elements.id.value;if(!id)return;const name=form.elements.titleZh.value||form.elements.titleEn.value||form.elements.slug.value;if(!confirm(`确定删除“${name}”吗？删除后无法恢复。`))return;message(editorStatus,'正在删除内容…');try{await api('/api/cms/admin/entries/'+id,{method:'DELETE'});clearForm();await loadEntries();message(editorStatus,'内容已删除。');}catch(error){message(editorStatus,error.message,true);}});

async function upload(input,idField,nameElement){const file=input.files[0];if(!file)return;message(editorStatus,`正在上传 ${file.name}…`);try{const data=await api('/api/cms/admin/files',{method:'POST',headers:{'Content-Type':file.type,'X-File-Name':encodeURIComponent(file.name)},body:file});form.elements[idField].value=data.file.id;$(nameElement).textContent=data.file.originalName;message(editorStatus,'文件已上传。请保存当前内容以使用该文件。');}catch(error){input.value='';message(editorStatus,error.message,true);}}
$('#image-upload').addEventListener('change',event=>upload(event.target,'featuredImageId','#image-name'));
$('#document-upload').addEventListener('change',event=>upload(event.target,'attachmentId','#document-name'));
restoreSession();
