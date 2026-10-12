// Cloudflare Pages bridge to the existing Node chatbot; never expose provider keys.
const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export async function onRequest({request,env}) {
 const url=new URL(request.url);
 const route=url.pathname.replace(/\/$/,'');
 if(!['/api/chat','/api/health'].includes(route))return json({error:'Not found'},404);
 if(request.method!==(route==='/api/chat'?'POST':'GET'))return json({error:'Method not allowed'},405);
 const origin=request.headers.get('Origin');
 if(origin&&origin!==url.origin)return json({error:'Origin not allowed'},403);
 if(!env.CHAT_BACKEND_URL)return route==='/api/health'?json({ok:true,mode:'unavailable'}):json({error:'Chat backend is not configured'},503);
 let backend;
 try{backend=new URL(env.CHAT_BACKEND_URL);if(backend.protocol!=='https:'||backend.origin===url.origin||backend.username||backend.password)throw Error();}
 catch{return json({error:'Invalid chat backend configuration'},503);}
 try{
  let body;
  if(request.method==='POST'){
   if(Number(request.headers.get('Content-Length'))>50000)return json({error:'Request too large'},413);
   const reader=request.body?.getReader();const chunks=[];let size=0;
   if(reader){while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>50000){await reader.cancel();return json({error:'Request too large'},413);}chunks.push(value);}}
   body=new Uint8Array(size);let offset=0;for(const chunk of chunks){body.set(chunk,offset);offset+=chunk.length;}
  }
  const headers={'Content-Type':'application/json','Origin':url.origin};
  if(env.CHAT_BACKEND_TOKEN)headers.Authorization='Bearer '+env.CHAT_BACKEND_TOKEN;
  const upstream=await fetch(new URL(route,backend.origin),{method:request.method,headers,body,redirect:'error',signal:AbortSignal.timeout(33000)});
  // Never relay upstream headers, cookies or server error details.
  if(!upstream.ok)return json({error:'Chat service unavailable'},upstream.status===429?429:502);
  return json(await upstream.json());
 }catch{return json({error:'Chat service unavailable'},502);}
}
