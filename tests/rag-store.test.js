const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { cosineSimilarity, cosineSearch, saveIndex, loadIndex } = require('../rag/lib/store');

test('cosineSimilarity returns 1 for identical vectors', () => {
  const v = [1, 2, 3];
  assert.ok(Math.abs(cosineSimilarity(v, v) - 1) < 1e-9);
});

test('cosineSimilarity returns 0 for orthogonal vectors', () => {
  assert.ok(Math.abs(cosineSimilarity([1, 0], [0, 1])) < 1e-9);
});

test('cosineSimilarity returns 0 when a vector is all zeros', () => {
  assert.equal(cosineSimilarity([0, 0], [1, 1]), 0);
});

test('cosineSearch ranks chunks by similarity, highest first', () => {
  const index = {
    chunks: [
      { text: 'low match', source: 'a.pdf', chunkIndex: 0, embedding: [0, 1] },
      { text: 'high match', source: 'b.pdf', chunkIndex: 0, embedding: [1, 0] },
      { text: 'medium match', source: 'c.pdf', chunkIndex: 0, embedding: [0.7, 0.7] },
    ],
  };
  const results = cosineSearch(index, [1, 0], 3);
  assert.equal(results[0].text, 'high match');
  assert.equal(results[2].text, 'low match');
  assert.equal(results.length, 3);
});

test('cosineSearch passes through a chunk\'s lang field when present', () => {
  const index = {
    chunks: [
      { text: 'zh text', source: 'a.pdf', chunkIndex: 0, lang: 'zh', embedding: [1, 0] },
      { text: 'en text', source: 'a.pdf', chunkIndex: 0, lang: 'en', embedding: [0, 1] },
    ],
  };
  const results = cosineSearch(index, [1, 0], 2);
  assert.equal(results.find((r) => r.text === 'zh text').lang, 'zh');
  assert.equal(results.find((r) => r.text === 'en text').lang, 'en');
});

test('cosineSearch respects topK', () => {
  const index = {
    chunks: [
      { text: 'one', source: 'a.pdf', chunkIndex: 0, embedding: [1, 0] },
      { text: 'two', source: 'a.pdf', chunkIndex: 1, embedding: [0.9, 0.1] },
      { text: 'three', source: 'a.pdf', chunkIndex: 2, embedding: [0, 1] },
    ],
  };
  const results = cosineSearch(index, [1, 0], 2);
  assert.equal(results.length, 2);
});

test('saveIndex and loadIndex round-trip a knowledge base index', () => {
  const tmpFile = path.join(os.tmpdir(), `rag-store-test-${Date.now()}.json`);
  const original = {
    kbName: 'test',
    builtAt: '2026-01-01T00:00:00.000Z',
    chunks: [{ text: 'x', source: 'a.pdf', chunkIndex: 0, embedding: [1, 2, 3] }],
  };
  saveIndex(tmpFile, original);
  const loaded = loadIndex(tmpFile);
  assert.deepEqual(loaded, original);
  fs.unlinkSync(tmpFile);
});
