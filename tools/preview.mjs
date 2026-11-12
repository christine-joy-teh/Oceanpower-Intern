import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import chatPlugin from './chat-plugin.mjs';
// Astro's static preview drops custom Vite plugins. Serve dist with the same
// server-only API middleware explicitly, without exposing project source files.
export async function createPreviewServer() {
 const root=path.resolve('dist');
 const headers=Object.fromEntries((await fs.readFile(path.join(root,'_headers'),'utf8')).split('\n').filter(line=>line.startsWith('  ')).map(line=>{const at=line.indexOf(':');return[line.slice(0,at).trim(),line.slice(at+1).trim()];}));
 let api;chatPlugin().configureServer({middlewares:{use(handler){api=handler;}}});
 return http.createServer((req,res)=>api(req,res,async()=>{
  try{
   if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
   const url=new URL(req.url,'http://localhost');
   const pathname=decodeURIComponent(url.pathname);
   if(pathname.includes('\\')||pathname.split('/').some(part=>part.startsWith('.'))){res.writeHead(404);res.end();return;}
   let file=path.resolve(root,'.'+pathname);
   if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(404);res.end();return;}
   if(pathname.endsWith('/'))file=path.join(file,'index.html');
   let data;let status=200;
   try{data=await fs.readFile(file);}catch{status=404;file=path.join(root,'404.html');data=await fs.readFile(file);}
   const type={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.xml':'application/xml','.txt':'text/plain','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.pdf':'application/pdf','.woff2':'font/woff2'}[path.extname(file)]||'application/octet-stream';
   res.writeHead(status,{'Content-Type':type,...headers,'Cache-Control':'no-store'});
   res.end(req.method==='HEAD'?undefined:data);
  }catch{res.writeHead(500);res.end('Preview error');}
 }));
}

export function previewListenOptions(argv=process.argv,env=process.env){
 const at=argv.indexOf('--port');
 const rawPort=at>=0?argv[at+1]:(env.PORT||'8000');
 const port=Number(rawPort);
 if(!Number.isInteger(port)||port<0||port>65535)throw new Error('PORT must be an integer from 0 to 65535.');
 return {port,host:env.HOST||'127.0.0.1'};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 const server=await createPreviewServer();
 const {port,host}=previewListenOptions();
 server.listen(port,host,()=>console.log('Oceanpower preview with AI chat: http://'+host+':'+server.address().port));
}
