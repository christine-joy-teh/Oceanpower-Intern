const test = require('node:test');
const assert = require('node:assert/strict');
const { fakeEmbed } = require('../rag/lib/embed');

test('fakeEmbed is deterministic for the same input', () => {
  const a = fakeEmbed('hello');
  const b = fakeEmbed('hello');
  assert.deepEqual(a, b);
});

test('fakeEmbed returns a normalized 16-dimensional vector', () => {
  const v = fakeEmbed('some text');
  assert.equal(v.length, 16);
  const norm = Math.sqrt(v.reduce((sum, x) => sum + x * x, 0));
  assert.ok(Math.abs(norm - 1) < 1e-9);
});

test('fakeEmbed differs for different input', () => {
  const a = fakeEmbed('hello');
  const b = fakeEmbed('goodbye');
  assert.notDeepEqual(a, b);
});
