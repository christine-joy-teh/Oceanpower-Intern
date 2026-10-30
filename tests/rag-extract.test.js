const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { extractPdfText } = require('../rag/lib/extract');

test('extractPdfText reads the embedded text layer directly when one exists', async () => {
  const samplePdf = path.join(
    __dirname, '..', 'rag', 'knowledge-bases', 'haichuan', 'pdfs',
    '海川机场道面解决方案2.pdf',
  );
  const text = await extractPdfText(samplePdf);
  assert.equal(typeof text, 'string');
  assert.ok(text.length > 500, `expected substantial extracted text, got ${text.length} characters`);
  assert.ok(/[一-鿿]/.test(text), 'expected extracted text to contain Chinese characters');
});

test('extractPdfText falls back to a manual transcript file when the text layer is empty', async (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rag-extract-test-'));
  t.after(() => fs.rmSync(tmpDir, { recursive: true, force: true }));

  const pdfsDir = path.join(tmpDir, 'pdfs');
  const transcriptsDir = path.join(tmpDir, 'transcripts');
  fs.mkdirSync(pdfsDir);
  fs.mkdirSync(transcriptsDir);

  // A real image-only PDF (no text layer) from the knowledge base, reused
  // here purely as "any PDF with no embedded text" — its content is not
  // asserted on, only that the transcript file wins.
  const imageOnlyPdf = path.join(
    __dirname, '..', 'rag', 'knowledge-bases', 'haichuan', 'pdfs',
    '海川新材料再生剂产品手册.pdf',
  );
  fs.copyFileSync(imageOnlyPdf, path.join(pdfsDir, 'sample.pdf'));
  fs.writeFileSync(path.join(transcriptsDir, 'sample.txt'), '手动抄录的产品说明文本。', 'utf8');

  const text = await extractPdfText(path.join(pdfsDir, 'sample.pdf'));
  assert.equal(text, '手动抄录的产品说明文本。');
});

test('extractPdfText throws a clear error when there is no text layer and no transcript', async (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rag-extract-test-'));
  t.after(() => fs.rmSync(tmpDir, { recursive: true, force: true }));

  const pdfsDir = path.join(tmpDir, 'pdfs');
  fs.mkdirSync(pdfsDir);
  const imageOnlyPdf = path.join(
    __dirname, '..', 'rag', 'knowledge-bases', 'haichuan', 'pdfs',
    '海川新材料再生剂产品手册.pdf',
  );
  fs.copyFileSync(imageOnlyPdf, path.join(pdfsDir, 'sample.pdf'));

  await assert.rejects(
    () => extractPdfText(path.join(pdfsDir, 'sample.pdf')),
    /no manual transcript found/i,
  );
});
