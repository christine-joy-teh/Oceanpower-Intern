const fs = require('node:fs');
const path = require('node:path');
const pdfParse = require('pdf-parse');

// A product manual page always yields far more than this from a real text
// layer; a small value here let a PDF with only a stray embedded caption
// (e.g. one image's alt-text-like fragment) wrongly skip the OCR-free
// transcript fallback and return nearly-empty text instead.
const MIN_TEXT_LAYER_LENGTH = 200;

function transcriptPathFor(filePath) {
  const pdfsDir = path.dirname(filePath);
  const kbDir = path.dirname(pdfsDir);
  const base = path.basename(filePath, path.extname(filePath));
  return path.join(kbDir, 'transcripts', `${base}.txt`);
}

function englishTranscriptPathFor(filePath) {
  const pdfsDir = path.dirname(filePath);
  const kbDir = path.dirname(pdfsDir);
  const base = path.basename(filePath, path.extname(filePath));
  return path.join(kbDir, 'transcripts-en', `${base}.txt`);
}

// Optional English counterpart to a PDF's (Chinese) text. Returns null when
// none exists — most knowledge bases won't have one, and that's fine: this
// just lets build-index.js also embed an English chunk set when a
// translation has been provided, so English queries can match English text
// directly instead of relying on cross-lingual embedding similarity alone.
function extractEnglishText(filePath) {
  const transcriptPath = englishTranscriptPathFor(filePath);
  if (fs.existsSync(transcriptPath)) {
    return fs.readFileSync(transcriptPath, 'utf8');
  }
  return null;
}

async function extractPdfText(filePath) {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  const text = data.text || '';
  if (text.replace(/\s/g, '').length >= MIN_TEXT_LAYER_LENGTH) {
    return text;
  }

  const transcriptPath = transcriptPathFor(filePath);
  if (fs.existsSync(transcriptPath)) {
    return fs.readFileSync(transcriptPath, 'utf8');
  }

  throw new Error(
    `No embedded text layer in ${filePath}, and no manual transcript found at ${transcriptPath}. ` +
    'This PDF\'s text was likely flattened to images or outlines at export time. ' +
    'Add a manual transcript at that path (read the PDF and save its text) and try again.',
  );
}

module.exports = { extractPdfText, extractEnglishText };
