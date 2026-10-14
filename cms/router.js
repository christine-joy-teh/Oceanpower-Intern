'use strict';

const fs = require('node:fs');
const path = require('node:path');
const repository = require('./repository');
const { constantTimeEqual, newToken, tokenHash, parseCookies } = require('./security');

const COOKIE_NAME = 'oceanpower_admin';
const loginAttempts = new Map();
const allowedFileTypes = new Set(['image/jpeg','image/png','image/webp','image/gif','application/pdf']);

function securityHeaders(response) {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('Referrer-Policy', 'same-origin');
}

function json(response, status, body, extraHeaders = {}) {
  securityHeaders(response);
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...extraHeaders });
  response.end(JSON.stringify(body));
}

function clientAddress(request) {
  return String(request.headers['x-forwarded-for'] || request.socket?.remoteAddress || 'unknown').split(',')[0].trim();
}

function sameOrigin(request) {
  const origin = request.headers.origin;
  if (!origin) return true;
  try {
    const forwarded = String(request.headers['x-forwarded-proto'] || '').split(',')[0].trim();
    const protocol = forwarded === 'https' || forwarded === 'http' ? forwarded : request.socket?.encrypted ? 'https' : 'http';
    const expected = `${protocol}://${request.headers.host}`;
    return new URL(origin).origin === expected;
  } catch { return false; }
}

function loginAllowed(request) {
  const key = clientAddress(request);
  const now = Date.now();
  const entry = loginAttempts.get(key);
  if (!entry || now - entry.startedAt > 15 * 60_000) {
    loginAttempts.set(key, { startedAt: now, count: 1 });
    return true;
  }
  entry.count += 1;
  return entry.count <= 8;
}

function clearLoginAttempts(request) {
  loginAttempts.delete(clientAddress(request));
}

function readBody(request, maximum) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let tooLarge = false;
    request.on('data', (chunk) => {
      size += chunk.length;
      if (size > maximum) {
        tooLarge = true;
        chunks.length = 0;
      } else if (!tooLarge) chunks.push(chunk);
    });
    request.on('end', () => {
      if (tooLarge) reject(Object.assign(new Error('Request is too large.'), { status: 413 }));
      else resolve(Buffer.concat(chunks));
    });
    request.on('error', reject);
  });
}

async function readJson(request) {
  const raw = await readBody(request, 1_000_000);
  try { return JSON.parse(raw.toString('utf8') || '{}'); }
  catch { throw Object.assign(new Error('The request must contain valid JSON.'), { status: 400 }); }
}

function sessionCookie(token) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=28800${secure}`;
}

function clearCookie() {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`;
}

async function authenticate(request, repo) {
  const token = parseCookies(request.headers.cookie)[COOKIE_NAME];
  if (!token) return null;
  const session = await repo.findSession(tokenHash(token));
  return session ? { ...session, token } : null;
}

function requireCsrf(request, session) {
  return session && request.headers['x-csrf-token'] && request.headers['x-csrf-token'] === session.csrf_token;
}

function publicEntry(entry, locale) {
  const selected = entry.translations[locale] || entry.translations.en || entry.translations.zh || { title:'', summary:'', body:'' };
  return {
    id: entry.id, kind: entry.kind, slug: entry.slug, status: entry.status, sortOrder: entry.sort_order,
    publishedAt: entry.published_at, title: selected.title, summary: selected.summary, body: selected.body,
    metadata: entry.metadata, specs: entry.specs.map((spec) => ({ label: locale === 'zh' ? spec.labelZh || spec.labelEn : spec.labelEn || spec.labelZh, value: spec.value, unit: spec.unit, source: spec.source })),
    image: entry.featured_image_id ? `/api/cms/files/${entry.featured_image_id}` : null,
    attachment: entry.attachment_id ? `/api/cms/files/${entry.attachment_id}` : null,
  };
}

function createCmsRouter(repo = repository, adminOverride = null) {
  return async function handleCms(request, response) {
    let url;
    try { url = new URL(request.url, 'http://localhost'); }
    catch { json(response, 400, { error: 'Invalid request URL.' }); return true; }
    if (!url.pathname.startsWith('/api/cms/')) return false;
    if (!sameOrigin(request)) { json(response, 403, { error: 'This request must come from the Oceanpower website.' }); return true; }

    try {
      if (!repo.configured()) {
        if (request.method === 'GET' && url.pathname === '/api/cms/public') {
          json(response, 200, { entries: [], database: 'not-configured' });
          return true;
        }
        json(response, 503, { error: 'The content database is not configured.', code: 'CMS_NOT_CONFIGURED' });
        return true;
      }

      if (request.method === 'GET' && url.pathname === '/api/cms/public') {
        const locale = url.searchParams.get('locale') === 'zh' ? 'zh' : 'en';
        const kind = url.searchParams.get('kind') || undefined;
        const entries = await repo.listEntries({ kind, publishedOnly: true });
        json(response, 200, { entries: entries.map((entry) => publicEntry(entry, locale)) });
        return true;
      }

      const fileMatch = url.pathname.match(/^\/api\/cms\/files\/([a-f0-9-]{36})$/i);
      if (request.method === 'GET' && fileMatch) {
        const file = await repo.getFile(fileMatch[1]);
        if (!file || !fs.existsSync(file.path)) { json(response, 404, { error: 'File not found.' }); return true; }
        securityHeaders(response);
        response.setHeader('Content-Type', file.mime_type);
        response.setHeader('Content-Length', file.byte_size);
        const downloadName = file.original_name.replace(/[^\x20-\x7E]/g, '_').replace(/["\r\n]/g, '');
        response.setHeader('Content-Disposition', `inline; filename="${downloadName}"`);
        response.writeHead(200);
        fs.createReadStream(file.path).pipe(response);
        return true;
      }

      if (request.method === 'POST' && url.pathname === '/api/cms/login') {
        if (!loginAllowed(request)) { json(response, 429, { error: 'Too many login attempts. Try again later.' }); return true; }
        const body = await readJson(request);
        const admin = adminOverride || {
          username: String(process.env.CMS_ADMIN_USERNAME || process.env.CMS_BOOTSTRAP_USERNAME || '').trim(),
          password: String(process.env.CMS_ADMIN_PASSWORD || process.env.CMS_BOOTSTRAP_PASSWORD || ''),
        };
        if (!admin.username || admin.password.length < 8) {
          json(response, 503, { error: 'The admin login is not configured in the local environment.', code: 'CMS_ADMIN_NOT_CONFIGURED' }); return true;
        }
        if (!constantTimeEqual(String(body.username || '').trim(), admin.username) || !constantTimeEqual(body.password, admin.password)) {
          json(response, 401, { error: 'Username or password is incorrect.' }); return true;
        }
        const token = newToken();
        const csrf = newToken();
        await repo.createSession(tokenHash(token), admin.username, csrf);
        clearLoginAttempts(request);
        json(response, 200, { user: { username: admin.username }, csrfToken: csrf }, { 'Set-Cookie': sessionCookie(token) });
        return true;
      }

      const session = await authenticate(request, repo);
      if (!session) { json(response, 401, { error: 'Sign in to manage website content.' }); return true; }

      if (request.method === 'GET' && url.pathname === '/api/cms/session') {
        json(response, 200, { user: { username: session.username }, csrfToken: session.csrf_token }); return true;
      }
      if (request.method === 'POST' && url.pathname === '/api/cms/logout') {
        if (!requireCsrf(request, session)) { json(response, 403, { error: 'Your session could not be verified. Refresh and try again.' }); return true; }
        await repo.deleteSession(tokenHash(session.token));
        json(response, 200, { ok: true }, { 'Set-Cookie': clearCookie() }); return true;
      }

      if (request.method === 'GET' && url.pathname === '/api/cms/admin/entries') {
        const entries = await repo.listEntries({ kind: url.searchParams.get('kind') || undefined });
        json(response, 200, { entries }); return true;
      }

      if (request.method === 'POST' && url.pathname === '/api/cms/admin/files') {
        if (!requireCsrf(request, session)) { json(response, 403, { error: 'Your session could not be verified. Refresh and try again.' }); return true; }
        const mimeType = String(request.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
        if (!allowedFileTypes.has(mimeType)) { json(response, 415, { error: 'Upload a JPG, PNG, WebP, GIF or PDF file.' }); return true; }
        const originalName = path.basename(decodeURIComponent(String(request.headers['x-file-name'] || 'upload'))).replace(/[^\p{L}\p{N}._ -]/gu, '_').slice(0, 255);
        const bytes = await readBody(request, 10 * 1024 * 1024);
        if (!bytes.length) { json(response, 400, { error: 'Choose a non-empty file.' }); return true; }
        json(response, 201, { file: await repo.saveFile({ originalName, mimeType, bytes }) }); return true;
      }

      const entryMatch = url.pathname.match(/^\/api\/cms\/admin\/entries(?:\/(\d+))?$/);
      if (entryMatch && ['POST','PUT','DELETE'].includes(request.method)) {
        if (!requireCsrf(request, session)) { json(response, 403, { error: 'Your session could not be verified. Refresh and try again.' }); return true; }
        if (request.method === 'DELETE') {
          if (!entryMatch[1]) { json(response, 400, { error: 'Choose content to delete.' }); return true; }
          const deleted = await repo.deleteEntry(entryMatch[1]);
          json(response, deleted ? 200 : 404, deleted ? { ok: true } : { error: 'Content entry not found.' }); return true;
        }
        const body = await readJson(request);
        const entry = await repo.saveEntry(entryMatch[1] || null, body);
        json(response, entryMatch[1] ? 200 : 201, { entry }); return true;
      }

      json(response, 404, { error: 'CMS endpoint not found.' });
      return true;
    } catch (error) {
      console.error('[cms]', error.message);
      json(response, error.status || 500, { error: error.status ? error.message : 'The content service could not complete this request.' });
      return true;
    }
  };
}

module.exports = { createCmsRouter, publicEntry };
