'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

function snapshotPath() {
  const uploads = path.resolve(process.env.CMS_UPLOAD_DIR || path.join(__dirname, '..', 'uploads'));
  return path.join(uploads, 'published-product-chat.json');
}

function productsFromEntries(entries) {
  return entries.filter((entry) => entry.kind === 'product' && entry.status === 'published')
    .map((entry) => ({
      slug: entry.slug,
      translations: {
        en: { title: entry.translations?.en?.title || '', summary: entry.translations?.en?.summary || '', body: entry.translations?.en?.body || '' },
        zh: { title: entry.translations?.zh?.title || '', summary: entry.translations?.zh?.summary || '', body: entry.translations?.zh?.body || '' },
      },
      specs: (entry.specs || []).map((spec) => ({ labelEn: spec.labelEn || '', labelZh: spec.labelZh || '', value: spec.value || '', unit: spec.unit || '', source: spec.source || '' })),
    })).sort((a, b) => a.slug.localeCompare(b.slug));
}

function fingerprint(products) {
  return crypto.createHash('sha256').update(JSON.stringify(products)).digest('hex');
}

function readSnapshot() {
  try {
    const data = JSON.parse(fs.readFileSync(snapshotPath(), 'utf8'));
    return Array.isArray(data.products) && typeof data.fingerprint === 'string' ? data : null;
  } catch { return null; }
}

async function writeSnapshot(entries) {
  const products = productsFromEntries(entries);
  const snapshot = { builtAt: new Date().toISOString(), fingerprint: fingerprint(products), products };
  const target = snapshotPath();
  await fs.promises.mkdir(path.dirname(target), { recursive: true });
  const temporary = `${target}.${crypto.randomUUID()}.tmp`;
  try {
    await fs.promises.writeFile(temporary, JSON.stringify(snapshot), { flag: 'wx', mode: 0o600 });
    await fs.promises.rename(temporary, target);
  } finally { await fs.promises.rm(temporary, { force: true }); }
  return snapshot;
}

function syncStatus(entries) {
  const snapshot = readSnapshot();
  const products = productsFromEntries(entries);
  return { builtAt: snapshot?.builtAt || null, productCount: snapshot?.products.length || 0,
    publishedCount: products.length, current: Boolean(snapshot && snapshot.fingerprint === fingerprint(products)) };
}

function normalise(text) { return String(text || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim(); }

function matchProduct(products, question) {
  const query = normalise(question);
  const candidates = products.map((product) => {
    const titles = Object.values(product.translations).map((t) => normalise(t.title)).filter(Boolean);
    const modelIds = [...new Set((`${product.slug} ${titles.join(' ')}`.toUpperCase().match(/\b(?=[A-Z0-9-]*\d)[A-Z]{2,}[A-Z0-9-]*\b/g) || []))];
    const modelMatch = modelIds.some((id) => new RegExp(`\\b${id}\\b`, 'i').test(question));
    const titleMatch = titles.some((title) => title.length >= 4 && query.includes(title));
    return { product, score: modelMatch ? 2 : titleMatch ? 1 : 0 };
  }).filter((item) => item.score);
  candidates.sort((a, b) => b.score - a.score);
  return candidates.length === 1 || (candidates[0]?.score > candidates[1]?.score) ? candidates[0]?.product : null;
}

function answerFromPublishedProducts(question, locale) {
  const snapshot = readSnapshot();
  if (!snapshot) return null;
  const product = matchProduct(snapshot.products, question);
  if (!product) return null;
  const zh = locale.startsWith('zh') || /[\u3400-\u9fff]/.test(question);
  const content = product.translations[zh ? 'zh' : 'en'];
  const fallback = product.translations[zh ? 'en' : 'zh'];
  const title = content.title || fallback.title;
  const source = { label: zh ? '网站已发布产品资料' : 'Published website product entry', detail: `${product.slug} · ${zh ? '管理员手动同步' : 'manually synced by admin'}` };
  let answer;
  if (/price|quote|cost|delivery|lead[ -]?time|ship|价格|报价|交期|交货|发货/.test(question.toLowerCase())) {
    answer = zh ? `目前没有可确认的 ${title} 价格或交期。请向销售人员询价并确认交付安排。` : `An exact price or delivery date for ${title} is not available in the published product information. Please ask sales to confirm both.`;
  } else if (/approve|engineering design|批准|审批|工程设计/.test(question.toLowerCase())) {
    answer = zh ? `网站资料不能批准 ${title} 的工程设计；须由具备资格的技术人员审核。` : `Website product information cannot approve an engineering design for ${title}. A qualified engineer must review it.`;
  } else {
    const summary = content.summary || content.body || fallback.summary || fallback.body;
    const specs = product.specs.slice(0, 8).map((spec) => `${(zh ? spec.labelZh || spec.labelEn : spec.labelEn || spec.labelZh) || ''}: ${spec.value}${spec.unit ? ` ${spec.unit}` : ''}${spec.source ? ` (${spec.source})` : ''}`);
    answer = [title, summary, ...specs].filter(Boolean).join('\n');
    if (!summary && !specs.length) answer += zh ? '\n暂无更多已发布的产品详情，请向工作人员确认。' : '\nNo further published details are available; please ask staff to confirm.';
  }
  return { answer, sources: [source], sourceStatus: 'staff-published', mode: 'catalogue-demo' };
}

module.exports = { productsFromEntries, fingerprint, readSnapshot, writeSnapshot, syncStatus, answerFromPublishedProducts, matchProduct };
