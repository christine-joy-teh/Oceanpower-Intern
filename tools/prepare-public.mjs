import manifest from '../src/content/routes.json' with { type: 'json' };
import { loadEnvFile } from 'node:process';
try { loadEnvFile('.env'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
import fs from 'node:fs/promises';
const locales=manifest.locales;
const routes=manifest.routes;
const pending=new Set([...manifest.pending,'demo']);
const site=(process.env.SITE_URL||'https://www.oceanpower.com').replace(/\/$/,'');
if(!/^https?:\/\/[^\s]+$/.test(site))throw new Error('SITE_URL must be an absolute HTTP(S) URL');
const path=(lang,route)=>'/'+(lang==='zh'?'':lang+'/')+(route?route+'/':'');
await fs.mkdir('public',{recursive:true});await fs.cp('assets','public/assets',{recursive:true});
await fs.copyFile('Oceanpower New Material---FRP Rebar Catalog.pdf','public/catalogue.pdf');
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const entries=routes.filter(r=>!pending.has(r)).flatMap(route=>locales.map(lang=>'<url><loc>'+escape(site+path(lang,route))+'</loc>'+locales.map(other=>'<xhtml:link rel="alternate" hreflang="'+(other==='zh'?'zh-CN':other)+'" href="'+escape(site+path(other,route))+'"/>').join('')+'<xhtml:link rel="alternate" hreflang="x-default" href="'+escape(site+path('zh',route))+'"/></url>'));
await fs.writeFile('public/sitemap.xml','<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'+entries.join('')+'</urlset>');
await fs.writeFile('public/robots.txt','User-agent: *\n'+(process.env.PUBLIC_INDEXABLE==='true'?'Allow: /':'Disallow: /')+'\nSitemap: '+site+'/sitemap.xml\n');
await fs.writeFile('public/_headers',"/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: SAMEORIGIN\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n  Content-Security-Policy: default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'self'; form-action 'self'\n"+(process.env.PUBLIC_INDEXABLE==='true'?'':'  X-Robots-Tag: noindex, nofollow\n'));
await fs.writeFile('public/_redirects','/index.html /en/ 301\n/gfrp.html /en/products/gfrp/ 301\n/bfrp.html /en/products/bfrp/ 301\n/cfrp.html /en/products/cfrp/ 301\n/demo.html /en/demo/ 301\n');
console.log('Prepared public assets, sitemap, robots, security headers and legacy redirects.');
