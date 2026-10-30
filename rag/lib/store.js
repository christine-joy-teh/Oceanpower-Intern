const fs = require('node:fs');
const path = require('node:path');

function saveIndex(indexPath, index) {
  fs.mkdirSync(path.dirname(indexPath), { recursive: true });
  fs.writeFileSync(indexPath, JSON.stringify(index));
}

function loadIndex(indexPath) {
  const raw = fs.readFileSync(indexPath, 'utf8');
  return JSON.parse(raw);
}

function cosineSimilarity(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  const length = Math.min(a.length, b.length);
  for (let i = 0; i < length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function cosineSearch(index, queryVector, topK = 5) {
  const scored = index.chunks.map((chunk) => ({
    text: chunk.text,
    source: chunk.source,
    chunkIndex: chunk.chunkIndex,
    score: cosineSimilarity(chunk.embedding, queryVector),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

module.exports = { saveIndex, loadIndex, cosineSimilarity, cosineSearch };
