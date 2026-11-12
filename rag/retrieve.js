const path = require('node:path');
const { loadIndex, cosineSearch } = require('./lib/store');
const { embed } = require('./lib/embed');

const indexCache = new Map();

function getIndex(kbName) {
  if (!indexCache.has(kbName)) {
    const indexPath = path.join(__dirname, 'knowledge-bases', kbName, 'index.json');
    indexCache.set(kbName, loadIndex(indexPath));
  }
  return indexCache.get(kbName);
}

async function retrieve(kbName, question, topK = 5) {
  const index = getIndex(kbName);
  const queryVector = await embed(question);
  const modelIds = [...new Set((String(question).toUpperCase().match(/\b(?=[A-Z0-9-]*\d)[A-Z]{2,}[A-Z0-9-]*\b/g) || []))];
  if (modelIds.length === 0) return cosineSearch(index, queryVector, topK);

  // Small embedding models can rank a similar machine above the exact model.
  // Keep semantic ordering within each exact-identifier match tier.
  const scored = cosineSearch(index, queryVector, index.chunks.length);
  const countMatches = (text) => modelIds.filter((id) => new RegExp(`\\b${id}\\b`, 'i').test(text)).length;
  scored.sort((a, b) => countMatches(b.text) - countMatches(a.text) || b.score - a.score);
  return scored.slice(0, topK);
}

module.exports = { retrieve };
