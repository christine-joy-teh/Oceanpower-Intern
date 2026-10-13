const dict=JSON.parse(document.getElementById('ui-dictionary').textContent);
const label=key=>dict[key]||key;
const header=document.querySelector('.site-header');
const toggle=document.querySelector('.menu-toggle');
function closeMenu(){header.classList.remove('open');toggle.setAttribute('aria-expanded','false');toggle.textContent=label('Menu');}
toggle.addEventListener('click',()=>{const open=header.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));toggle.textContent=label(open?'Close':'Menu');});
header.querySelectorAll('nav a,nav button').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&header.classList.contains('open')){closeMenu();toggle.focus();}});
const enquiry=document.getElementById('enquiry-dialog');
const catalogue=document.getElementById('catalogue-dialog');
const form=document.getElementById('enquiry-form');
const review=document.getElementById('enquiry-review');
const status=document.getElementById('enquiry-status');
let opener=null;
function open(dialog){if(!enquiry.open&&!catalogue.open)opener=document.activeElement;document.querySelectorAll('dialog[open]').forEach(d=>d.close());dialog.showModal();dialog.querySelector('input,button').focus();}
function close(dialog){dialog.close();opener?.focus();}
document.querySelectorAll('[data-dialog-close]').forEach(button=>button.addEventListener('click',()=>close(button.closest('dialog'))));
for(const d of [enquiry,catalogue])d.addEventListener('cancel',()=>opener?.focus());
document.querySelectorAll('[data-rfq-start]').forEach(button=>button.addEventListener('click',()=>{if(button.dataset.product)form.elements.product.value=button.dataset.product+' rebar';open(enquiry);}));
document.querySelectorAll('[data-open-catalogue]').forEach(button=>button.addEventListener('click',()=>open(catalogue)));
document.querySelectorAll('[data-unknown]').forEach(button=>button.addEventListener('click',()=>{const input=form.elements[button.dataset.unknown];const on=button.getAttribute('aria-pressed')!=='true';button.setAttribute('aria-pressed',String(on));input.value=on?label('Not sure yet'):'';input.readOnly=on;}));
form.addEventListener('input',()=>{status.textContent='';});
form.addEventListener('submit',event=>{event.preventDefault();const dl=review.querySelector('dl');dl.replaceChildren();for(const input of form.querySelectorAll('input')){const dt=document.createElement('dt');dt.textContent=form.querySelector('label[for="'+input.id+'"]').textContent;const dd=document.createElement('dd');dd.textContent=input.value||'—';dl.append(dt,dd);}form.hidden=true;review.hidden=false;status.textContent='';review.focus();});
document.querySelector('[data-edit]').addEventListener('click',()=>{form.hidden=false;review.hidden=true;status.textContent='';form.elements.application.focus();});
document.querySelector('[data-complete]').addEventListener('click',()=>{status.textContent=label('Demo completed. Nothing has been sent.');status.focus();});
document.querySelector('[data-copy]').addEventListener('click',async()=>{const text=[...review.querySelectorAll('dt')].map(dt=>dt.textContent+': '+dt.nextElementSibling.textContent).join('\n');try{await navigator.clipboard.writeText(text);status.textContent=label('Copied. Nothing has been sent.');}catch{const area=review.querySelector('textarea');area.hidden=false;area.value=text;area.focus();area.select();status.textContent=label('Select and copy the text below.');}});
const chatForm=document.getElementById('catalogue-form');
const chatMode=document.getElementById('chat-mode');
const chatHistory=[];
const locale=document.documentElement.lang.split('-')[0];
let chatBusy=false;
function setMode(mode){chatMode.textContent=label(mode==='knowledge-base'?'Live AI · Company knowledge':mode==='catalogue-demo'?'Catalogue fallback · No live AI':'Assistant unavailable · Local catalogue only');}
async function checkChat(){
 try{const response=await fetch('/api/health/',{signal:AbortSignal.timeout(5000)});if(!response.ok)throw Error();const data=await response.json();setMode(data.mode);}
 catch{setMode('unavailable');}
}
document.querySelectorAll('[data-open-catalogue]').forEach(button=>button.addEventListener('click',checkChat));
function localCatalogue(question){
 const match=question.match(/gfrp|bfrp|cfrp/i);
 const unsupported=/price|cost|quote|delivery|stock|precio|prix|livraison|entrega|价格|报价|交期|库存/i.test(question);
 return match&&!unsupported?dict.products[match[0].toLowerCase()]?.text:label('I cannot confirm that from the supplied catalogue. Please contact Oceanpower for a technical review.');
}
chatForm.addEventListener('submit',async event=>{
 event.preventDefault();
 if(chatBusy)return;
 const input=document.getElementById('catalogue-question');
 const message=input.value.trim();if(!message)return;
 const stream=catalogue.querySelector('.chat-stream');
 const question=document.createElement('p');question.className='user-message';question.textContent=message;
 const answer=document.createElement('p');answer.className='bot-message';answer.textContent=label('Thinking…');
 stream.append(question,answer);input.value='';
 chatBusy=true;chatForm.querySelector('button').disabled=true;stream.setAttribute('aria-busy','true');
 stream.scrollTop=stream.scrollHeight;
 try{
  const response=await fetch('/api/chat/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message,locale,history:chatHistory.slice(-8)}),signal:AbortSignal.timeout(35000)});
  if(response.status===429){answer.textContent=label('Too many questions. Please wait a few minutes and try again.');return;}
  if(!response.ok)throw Error('Assistant unavailable');
  const data=await response.json();
  if(typeof data.answer!=='string'||!data.answer.trim())throw Error('Invalid assistant response');
  setMode(data.mode);
  // The original catalogue fallback is bilingual. Use the existing translated
  // catalogue on Spanish/French pages; live AI receives the selected locale.
  const text=data.mode==='catalogue-demo'&&['es','fr'].includes(locale)?localCatalogue(message):data.answer;
  answer.textContent=text;
  if(data.nextQuestion&&!(data.mode==='catalogue-demo'&&['es','fr'].includes(locale)))answer.append(document.createTextNode(' '+data.nextQuestion));
  if(data.notice){const notice=document.createElement('small');notice.textContent=label('The AI service is unavailable. This answer uses the local catalogue.');answer.append(document.createElement('br'),notice);}
  if(Array.isArray(data.sources)&&data.sources.length){
   const sources=document.createElement('small');
   sources.textContent=label(data.mode==='knowledge-base'?'Provider references are unverified. Engineering review is required.':'Catalogue reference · Engineering review required');
   for(const source of data.sources.slice(0,4)){const row=document.createElement('span');row.textContent=String(source.label||'')+' — '+String(source.detail||'');sources.append(document.createElement('br'),row);}
   // Spanish/French local answers already contain their own matching sources.
   if(!(data.mode==='catalogue-demo'&&['es','fr'].includes(locale)))answer.append(document.createElement('br'),sources);
  }else if(data.mode==='knowledge-base'){
   const note=document.createElement('small');note.textContent=label('Provider references are unverified. Engineering review is required.');answer.append(document.createElement('br'),note);
  }
  chatHistory.push({role:'user',content:message},{role:'assistant',content:text});
  if(chatHistory.length>8)chatHistory.splice(0,chatHistory.length-8);
 }catch{
  setMode('unavailable');
  answer.textContent=localCatalogue(message);
  const notice=document.createElement('small');notice.textContent=label('The AI service is unavailable. This answer uses the local catalogue.');answer.append(document.createElement('br'),notice);
 }finally{
  chatBusy=false;chatForm.querySelector('button').disabled=false;stream.removeAttribute('aria-busy');stream.scrollTop=stream.scrollHeight;
  if(catalogue.open)input.focus();
 }
});
const tabs=[...document.querySelectorAll('.spec-tabs [role="tab"]')];
function selectTab(tab){for(const item of tabs){const chosen=item===tab;item.setAttribute('aria-selected',String(chosen));item.tabIndex=chosen?0:-1;document.getElementById(item.getAttribute('aria-controls')).hidden=!chosen;}const quote=document.querySelector('.spec-cta');if(quote)quote.dataset.product=tab.dataset.fiber.toUpperCase();}
tabs.forEach((tab,index)=>{tab.addEventListener('click',()=>selectTab(tab));tab.addEventListener('keydown',event=>{let next;if(event.key==='ArrowRight')next=(index+1)%tabs.length;else if(event.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=tabs.length-1;else return;event.preventDefault();selectTab(tabs[next]);tabs[next].focus();});});
