function chunkText(text, { maxChars = 800, overlapChars = 150 } = {}) {
  const normalized = String(text || '').replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];

  const step = maxChars - overlapChars;
  const chunks = [];
  for (let start = 0; start < normalized.length; start += step) {
    const end = Math.min(start + maxChars, normalized.length);
    const piece = normalized.slice(start, end).trim();
    if (piece) chunks.push(piece);
    if (end >= normalized.length) break;
  }
  return chunks;
}

module.exports = { chunkText };
