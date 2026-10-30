const fs = require('node:fs');
const path = require('node:path');
const { extractPdfText } = require('./lib/extract');
const { chunkText } = require('./lib/chunk');
const { embed } = require('./lib/embed');
const { saveIndex } = require('./lib/store');

async function buildIndexForDir(kbName, kbDir) {
  const pdfsDir = path.join(kbDir, 'pdfs');
  const indexPath = path.join(kbDir, 'index.json');

  if (!fs.existsSync(pdfsDir)) {
    throw new Error(`No pdfs folder found at ${pdfsDir}`);
  }
  const pdfFiles = fs.readdirSync(pdfsDir).filter((file) => file.toLowerCase().endsWith('.pdf'));
  if (pdfFiles.length === 0) {
    throw new Error(`No PDF files found in ${pdfsDir}`);
  }

  const chunks = [];
  for (const file of pdfFiles) {
    const filePath = path.join(pdfsDir, file);
    console.log(`[build-index] Extracting ${file}...`);
    const text = await extractPdfText(filePath);
    const pieces = chunkText(text);
    console.log(`[build-index] ${file}: ${pieces.length} chunks`);
    pieces.forEach((piece, chunkIndex) => {
      chunks.push({ source: file, chunkIndex, text: piece });
    });
  }

  console.log(`[build-index] Embedding ${chunks.length} chunks...`);
  for (const chunk of chunks) {
    chunk.embedding = await embed(chunk.text);
  }

  const index = { kbName, builtAt: new Date().toISOString(), chunks };
  saveIndex(indexPath, index);
  return index;
}

async function buildIndex(kbName) {
  const kbDir = path.join(__dirname, 'knowledge-bases', kbName);
  return buildIndexForDir(kbName, kbDir);
}

module.exports = { buildIndex, buildIndexForDir };

if (require.main === module) {
  const kbName = process.argv[2];
  if (!kbName) {
    console.error('Usage: node rag/build-index.js <kbName>');
    process.exit(1);
  }
  buildIndex(kbName)
    .then((index) => console.log(`[build-index] Wrote ${index.chunks.length} chunks for "${kbName}" to rag/knowledge-bases/${kbName}/index.json`))
    .catch((error) => {
      console.error('[build-index] Failed:', error);
      process.exit(1);
    });
}
