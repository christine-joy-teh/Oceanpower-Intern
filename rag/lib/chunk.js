function chunkText(text, { maxChars = 800, overlapChars = 150 } = {}) {
  const normalized = String(text || '').replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];

  const step = maxChars - overlapChars;
  const chunks = [];
  // A form feed marks a source-page or product-section boundary in curated
  // image-PDF transcripts. Never blend specifications from adjacent sections.
  for (const section of normalized.split('\f')) {
    const trimmed = section.trim();
    for (let start = 0; start < trimmed.length; start += step) {
      const end = Math.min(start + maxChars, trimmed.length);
      const piece = trimmed.slice(start, end).trim();
      if (piece) chunks.push(piece);
      if (end >= trimmed.length) break;
    }
  }
  return chunks;
}

module.exports = { chunkText };
