const fs = require('node:fs');
const path = require('node:path');
const pdfParse = require('pdf-parse');

const MIN_TEXT_LAYER_LENGTH = 30;

function transcriptPathFor(filePath) {
  const pdfsDir = path.dirname(filePath);
  const kbDir = path.dirname(pdfsDir);
  const base = path.basename(filePath, path.extname(filePath));
  return path.join(kbDir, 'transcripts', `${base}.txt`);
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

module.exports = { extractPdfText };
