const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { buildIndexForDir } = require('../rag/build-index');
const { loadIndex, cosineSearch } = require('../rag/lib/store');
const { embed } = require('../rag/lib/embed');

test('buildIndexForDir extracts, chunks, embeds and saves a real PDF end-to-end', async (t) => {
  process.env.RAG_FAKE_EMBEDDINGS = '1';
  t.after(() => { delete process.env.RAG_FAKE_EMBEDDINGS; });

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rag-build-index-'));
  t.after(() => fs.rmSync(tmpDir, { recursive: true, force: true }));
  const pdfsDir = path.join(tmpDir, 'pdfs');
  fs.mkdirSync(pdfsDir);
  // Uses the one real PDF with an embedded text layer (see Task 6's probe
  // result) so this test never needs a transcript file — it stays fast and offline.
  const sourcePdf = path.join(
    __dirname, '..', 'rag', 'knowledge-bases', 'haichuan', 'pdfs',
    '海川机场道面解决方案2.pdf',
  );
  fs.copyFileSync(sourcePdf, path.join(pdfsDir, '海川机场道面解决方案2.pdf'));

  const index = await buildIndexForDir('fixture-kb', tmpDir);
  assert.ok(index.chunks.length > 0);
  for (const chunk of index.chunks) {
    assert.equal(chunk.embedding.length, 16);
    assert.equal(chunk.source, '海川机场道面解决方案2.pdf');
  }

  const saved = loadIndex(path.join(tmpDir, 'index.json'));
  assert.equal(saved.chunks.length, index.chunks.length);

  const queryVector = await embed('机场道面解决方案');
  const results = cosineSearch(saved, queryVector, 3);
  assert.ok(results.length > 0);
  assert.ok(results[0].text.length > 0);
});
