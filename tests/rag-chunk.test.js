const test = require('node:test');
const assert = require('node:assert/strict');
const { chunkText } = require('../rag/lib/chunk');

test('chunkText returns a single chunk for short text', () => {
  const chunks = chunkText('hello world', { maxChars: 800, overlapChars: 150 });
  assert.deepEqual(chunks, ['hello world']);
});

test('chunkText returns an empty array for empty or whitespace-only text', () => {
  assert.deepEqual(chunkText(''), []);
  assert.deepEqual(chunkText('   \n\n  '), []);
});

test('chunkText splits long text into overlapping pieces no longer than maxChars', () => {
  const longText = 'A'.repeat(1000) + 'B'.repeat(1000);
  const chunks = chunkText(longText, { maxChars: 800, overlapChars: 150 });
  assert.ok(chunks.length >= 3, `expected at least 3 chunks, got ${chunks.length}`);
  for (const chunk of chunks) {
    assert.ok(chunk.length <= 800);
  }
  const overlapFromFirst = chunks[0].slice(-150);
  assert.ok(chunks[1].startsWith(overlapFromFirst.slice(0, 50)));
});

test('chunkText does not break Chinese text into invalid characters', () => {
  const chineseText = '海川新材料'.repeat(300);
  const chunks = chunkText(chineseText, { maxChars: 800, overlapChars: 150 });
  assert.ok(chunks.length > 1);
  for (const chunk of chunks) {
    assert.doesNotMatch(chunk, /�/);
  }
});
