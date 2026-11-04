'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const mysql = require('mysql2/promise');

let pool;

// Set CMS_UPLOAD_DIR to a persistent disk mount on hosts with an ephemeral filesystem (Render).
function uploadDirectory() {
  return path.resolve(process.env.CMS_UPLOAD_DIR || path.join(__dirname, '..', 'uploads'));
}

function inputError(message) {
  return Object.assign(new Error(message), { status: 400 });
}

function configured() {
  return Boolean(process.env.MYSQL_DATABASE && process.env.MYSQL_USER);
}

function sslConfig() {
  const mode = String(process.env.MYSQL_SSL_MODE || '').trim().toUpperCase();
  if (!mode || mode === 'DISABLED') return undefined;
  const caFile = String(process.env.MYSQL_SSL_CA_FILE || '').trim();
  if (caFile) return { ca: fs.readFileSync(path.resolve(caFile), 'utf8'), rejectUnauthorized: true };
  if (mode === 'VERIFY_CA' || mode === 'VERIFY_IDENTITY') {
    throw new Error('MYSQL_SSL_CA_FILE is required for verified MySQL TLS.');
  }
  return { rejectUnauthorized: false };
}

function connectionOptions(extra = {}) {
  const ssl = sslConfig();
  return {
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT || 3306),
    database: process.env.MYSQL_DATABASE,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD || '',
    charset: 'utf8mb4',
    ...(ssl ? { ssl } : {}),
    ...extra,
  };
}

function getPool() {
  if (!configured()) throw new Error('MySQL is not configured. Add the MYSQL_* values to .env.');
  if (!pool) {
    pool = mysql.createPool(connectionOptions({
      connectionLimit: 6,
      // Fail before the browser's 5 s fallback instead of holding requests for the 10 s default.
      connectTimeout: 4000,
      timezone: 'Z',
      decimalNumbers: true,
    }));
  }
  return pool;
}

async function migrate() {
  const connection = await mysql.createConnection(connectionOptions({
    multipleStatements: true,
  }));
  try {
    await connection.query(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
  } finally {
    await connection.end();
  }
}

function normaliseEntry(row) {
  const translations = typeof row.translations === 'string' ? JSON.parse(row.translations || '{}') : row.translations || {};
  const specs = typeof row.specs === 'string' ? JSON.parse(row.specs || '[]') : row.specs || [];
  const metadata = typeof row.metadata === 'string' ? JSON.parse(row.metadata || '{}') : row.metadata || {};
  return { ...row, metadata, translations, specs };
}

const entrySelect = `
  SELECT e.*,
    COALESCE((SELECT JSON_OBJECTAGG(t.locale, JSON_OBJECT('title',t.title,'summary',t.summary,'body',t.body)) FROM cms_translations t WHERE t.entry_id=e.id), JSON_OBJECT()) translations,
    COALESCE((SELECT JSON_ARRAYAGG(JSON_OBJECT('id',s.id,'labelEn',s.label_en,'labelZh',s.label_zh,'value',s.value_text,'unit',s.unit,'source',s.source_reference,'sortOrder',s.sort_order)) FROM cms_product_specs s WHERE s.entry_id=e.id), JSON_ARRAY()) specs,
    image.original_name image_name, attachment.original_name attachment_name
  FROM cms_entries e
  LEFT JOIN cms_files image ON image.id=e.featured_image_id
  LEFT JOIN cms_files attachment ON attachment.id=e.attachment_id`;

async function listEntries({ kind, publishedOnly = false } = {}) {
  const where = [];
  const values = [];
  if (kind) { where.push('e.kind=?'); values.push(kind); }
  if (publishedOnly) where.push("e.status='published'");
  const [rows] = await getPool().query(`${entrySelect}${where.length ? ` WHERE ${where.join(' AND ')}` : ''} ORDER BY e.kind,e.sort_order,e.updated_at DESC`, values);
  return rows.map(normaliseEntry);
}

async function getEntry(id) {
  const [rows] = await getPool().query(`${entrySelect} WHERE e.id=?`, [id]);
  return rows[0] ? normaliseEntry(rows[0]) : null;
}

function cleanEntry(input) {
  const allowedKinds = new Set(['page', 'business', 'product', 'news', 'document']);
  const kind = String(input.kind || 'page');
  if (!allowedKinds.has(kind)) throw inputError('Unsupported content type.');
  const slug = String(input.slug || '').trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '').slice(0, 160);
  if (!slug) throw inputError('A URL slug is required.');
  const translations = {};
  for (const locale of ['en', 'zh']) {
    const source = input.translations?.[locale] || {};
    translations[locale] = {
      title: String(source.title || '').trim().slice(0, 255),
      summary: String(source.summary || '').trim().slice(0, 4000),
      body: String(source.body || '').trim().slice(0, 100_000),
    };
  }
  if (!translations.en.title && !translations.zh.title) throw inputError('Add an English or Chinese title.');
  const metadata = input.metadata && typeof input.metadata === 'object' && !Array.isArray(input.metadata) ? input.metadata : {};
  const specs = Array.isArray(input.specs) ? input.specs.slice(0, 100).map((spec, index) => ({
    labelEn: String(spec.labelEn || '').trim().slice(0, 180), labelZh: String(spec.labelZh || '').trim().slice(0, 180),
    value: String(spec.value || '').trim().slice(0, 255), unit: String(spec.unit || '').trim().slice(0, 40),
    source: String(spec.source || '').trim().slice(0, 255), sortOrder: Number.isFinite(Number(spec.sortOrder)) ? Number(spec.sortOrder) : index,
  })).filter((spec) => spec.labelEn || spec.labelZh || spec.value) : [];
  return { kind, slug, status: input.status === 'published' ? 'published' : 'draft', sortOrder: Number(input.sortOrder) || 0,
    publishedAt: input.publishedAt ? new Date(input.publishedAt) : null, featuredImageId: input.featuredImageId || null,
    attachmentId: input.attachmentId || null, metadata, translations, specs };
}

function entryToInput(entry) {
  return { kind: entry.kind, slug: entry.slug, status: entry.status, sortOrder: entry.sort_order,
    publishedAt: entry.published_at, featuredImageId: entry.featured_image_id, attachmentId: entry.attachment_id,
    metadata: entry.metadata, translations: entry.translations,
    specs: entry.specs.map((spec) => ({ labelEn: spec.labelEn, labelZh: spec.labelZh, value: spec.value, unit: spec.unit, source: spec.source, sortOrder: spec.sortOrder })) };
}

async function saveEntry(id, input) {
  const data = cleanEntry(input);
  const previous = id ? await getEntry(id) : null;
  if (id && !previous) throw Object.assign(new Error('Content entry not found.'), { status: 404 });
  const galleryIds = data.metadata.galleryIds;
  if (galleryIds !== undefined) {
    if (!Array.isArray(galleryIds) || galleryIds.length > 12 || galleryIds.some((value) => typeof value !== 'string' || !/^[a-f0-9-]{36}$/i.test(value))) throw inputError('Choose up to 12 uploaded images.');
    for (const fileId of galleryIds) {
      const file = await getFile(fileId);
      if (!file?.mime_type.startsWith('image/')) throw inputError('Gallery items must be uploaded images.');
    }
  }
  if (data.metadata.videoId) {
    const file = await getFile(data.metadata.videoId);
    if (!file?.mime_type.startsWith('video/')) throw inputError('Choose an uploaded video.');
  }
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    let entryId = id ? Number(id) : null;
    if (entryId) {
      await connection.execute('INSERT INTO cms_entry_revisions (entry_id,snapshot) VALUES (?,?)', [entryId, JSON.stringify(entryToInput(previous))]);
      const [result] = await connection.execute('UPDATE cms_entries SET kind=?,slug=?,status=?,sort_order=?,published_at=?,featured_image_id=?,attachment_id=?,metadata=? WHERE id=?',
        [data.kind,data.slug,data.status,data.sortOrder,data.publishedAt,data.featuredImageId,data.attachmentId,JSON.stringify(data.metadata),entryId]);
      if (!result.affectedRows) throw Object.assign(new Error('Content entry not found.'), { status: 404 });
    } else {
      const [result] = await connection.execute('INSERT INTO cms_entries (kind,slug,status,sort_order,published_at,featured_image_id,attachment_id,metadata) VALUES (?,?,?,?,?,?,?,?)',
        [data.kind,data.slug,data.status,data.sortOrder,data.publishedAt,data.featuredImageId,data.attachmentId,JSON.stringify(data.metadata)]);
      entryId = result.insertId;
    }
    for (const locale of ['en','zh']) {
      const value = data.translations[locale];
      await connection.execute(`INSERT INTO cms_translations (entry_id,locale,title,summary,body) VALUES (?,?,?,?,?)
        ON DUPLICATE KEY UPDATE title=VALUES(title),summary=VALUES(summary),body=VALUES(body)`, [entryId,locale,value.title,value.summary,value.body]);
    }
    await connection.execute('DELETE FROM cms_product_specs WHERE entry_id=?', [entryId]);
    for (const spec of data.specs) await connection.execute('INSERT INTO cms_product_specs (entry_id,label_en,label_zh,value_text,unit,source_reference,sort_order) VALUES (?,?,?,?,?,?,?)',
      [entryId,spec.labelEn,spec.labelZh,spec.value,spec.unit,spec.source,spec.sortOrder]);
    await connection.commit();
    return getEntry(entryId);
  } catch (error) {
    await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') throw Object.assign(new Error('That content type already uses this slug.'), { status: 409 });
    throw error;
  } finally {
    connection.release();
  }
}

async function listRevisions(entryId) {
  const [rows] = await getPool().execute('SELECT id,saved_at,snapshot FROM cms_entry_revisions WHERE entry_id=? ORDER BY id DESC LIMIT 20', [Number(entryId)]);
  return rows.map((row) => ({ id: row.id, savedAt: row.saved_at, snapshot: typeof row.snapshot === 'string' ? JSON.parse(row.snapshot) : row.snapshot }));
}

async function restoreRevision(entryId, revisionId) {
  const [rows] = await getPool().execute('SELECT snapshot FROM cms_entry_revisions WHERE entry_id=? AND id=?', [Number(entryId), Number(revisionId)]);
  if (!rows.length) throw Object.assign(new Error('Revision not found.'), { status: 404 });
  const snapshot = typeof rows[0].snapshot === 'string' ? JSON.parse(rows[0].snapshot) : rows[0].snapshot;
  return saveEntry(entryId, snapshot);
}

async function deleteEntry(id) {
  const [result] = await getPool().execute('DELETE FROM cms_entries WHERE id=?', [Number(id)]);
  return result.affectedRows > 0;
}

async function createSession(tokenHash, username, csrfToken) {
  await getPool().execute('DELETE FROM cms_admin_sessions WHERE expires_at < NOW()');
  await getPool().execute('INSERT INTO cms_admin_sessions (token_hash,username,csrf_token,expires_at) VALUES (?,?,?,DATE_ADD(NOW(), INTERVAL 8 HOUR))', [tokenHash,username,csrfToken]);
}

async function findSession(tokenHashValue) {
  const [rows] = await getPool().execute(`SELECT token_hash,username,csrf_token,expires_at
    FROM cms_admin_sessions WHERE token_hash=? AND expires_at>NOW()`, [tokenHashValue]);
  return rows[0] || null;
}

async function deleteSession(tokenHashValue) { await getPool().execute('DELETE FROM cms_admin_sessions WHERE token_hash=?', [tokenHashValue]); }

async function saveFile({ originalName, mimeType, bytes }) {
  const id = crypto.randomUUID();
  const extension = path.extname(originalName).toLowerCase().slice(0, 10);
  const storedName = `${id}${extension}`;
  const directory = uploadDirectory();
  await fs.promises.mkdir(directory, { recursive: true });
  await fs.promises.writeFile(path.join(directory, storedName), bytes, { flag: 'wx' });
  try {
    await getPool().execute('INSERT INTO cms_files (id,stored_name,original_name,mime_type,byte_size) VALUES (?,?,?,?,?)', [id,storedName,originalName,mimeType,bytes.length]);
  } catch (error) {
    await fs.promises.unlink(path.join(directory, storedName)).catch(() => {});
    throw error;
  }
  return { id, originalName, mimeType, byteSize: bytes.length, url: `/api/cms/files/${id}` };
}

async function getFile(id) {
  const [rows] = await getPool().execute('SELECT * FROM cms_files WHERE id=?', [String(id)]);
  if (!rows[0]) return null;
  return { ...rows[0], path: path.join(uploadDirectory(), rows[0].stored_name) };
}

async function fileIsPublic(id) {
  const [rows] = await getPool().execute(`SELECT id FROM cms_entries WHERE status='published' AND
    (featured_image_id=? OR attachment_id=? OR JSON_CONTAINS(COALESCE(metadata,JSON_OBJECT()),JSON_QUOTE(?),'$.galleryIds') OR
    JSON_UNQUOTE(JSON_EXTRACT(metadata,'$.videoId'))=?) LIMIT 1`, [id,id,id,id]);
  return rows.length > 0;
}

async function deleteFile(id) {
  const file = await getFile(id);
  if (!file) return false;
  const [references] = await getPool().execute(`SELECT id FROM cms_entries WHERE
    featured_image_id=? OR attachment_id=? OR JSON_CONTAINS(COALESCE(metadata,JSON_OBJECT()),JSON_QUOTE(?),'$.galleryIds') OR
    JSON_UNQUOTE(JSON_EXTRACT(metadata,'$.videoId'))=? LIMIT 1`, [id,id,id,id]);
  if (references.length) throw Object.assign(new Error('Remove this file from website content before deleting it.'), { status: 409 });
  await getPool().execute('DELETE FROM cms_files WHERE id=?', [id]);
  await fs.promises.rm(file.path, { force: true });
  return true;
}

async function listFiles() {
  const [rows] = await getPool().query('SELECT id,original_name,mime_type,byte_size,created_at FROM cms_files ORDER BY created_at DESC LIMIT 200');
  return rows.map((file) => ({ id: file.id, originalName: file.original_name, mimeType: file.mime_type, byteSize: file.byte_size, createdAt: file.created_at, url: `/api/cms/files/${file.id}` }));
}

async function close() {
  if (!pool) return;
  const activePool = pool;
  pool = undefined;
  await activePool.end();
}

module.exports = { configured, migrate, listEntries, getEntry, saveEntry, deleteEntry, listRevisions, restoreRevision, createSession, findSession, deleteSession, saveFile, getFile, fileIsPublic, deleteFile, listFiles, close };
