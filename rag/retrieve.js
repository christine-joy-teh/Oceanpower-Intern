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
  return cosineSearch(index, queryVector, topK);
}

module.exports = { retrieve };
