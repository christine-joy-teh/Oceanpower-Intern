const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { saveIndex } = require('../rag/lib/store');
const { embed } = require('../rag/lib/embed');
const { retrieve } = require('../rag/retrieve');

test('retrieve loads a kb index by name and returns the closest match', async (t) => {
  process.env.RAG_FAKE_EMBEDDINGS = '1';
  t.after(() => { delete process.env.RAG_FAKE_EMBEDDINGS; });

  const kbName = `test-kb-${Date.now()}`;
  const kbDir = path.join(__dirname, '..', 'rag', 'knowledge-bases', kbName);
  t.after(() => fs.rmSync(kbDir, { recursive: true, force: true }));

  const chunks = [
    { source: 'a.pdf', chunkIndex: 0, text: 'warm mix asphalt additive', embedding: await embed('warm mix asphalt additive') },
    { source: 'b.pdf', chunkIndex: 0, text: 'flame retardant for pavement', embedding: await embed('flame retardant for pavement') },
  ];
  saveIndex(path.join(kbDir, 'index.json'), { kbName, builtAt: new Date().toISOString(), chunks });

  const results = await retrieve(kbName, 'warm mix asphalt additive', 1);
  assert.equal(results.length, 1);
  assert.equal(results[0].text, 'warm mix asphalt additive');
});
