const test = require('node:test');
const assert = require('node:assert/strict');
const rfq = require('../rfq.js');

const demonstrationEnquiry = 'Sand-coated GFRP rebar, 16 mm, 2,000 metres, for a coastal retaining wall in Johor, Malaysia. Requested delivery: November 2026.';

test('extracts several RFQ fields from one natural-language message', () => {
  const draft = rfq.createDraft();
  draft.status = 'collecting';
  const result = rfq.processMessage(draft, demonstrationEnquiry, 'en');

  assert.equal(result.kind, 'rfq-update');
  assert.equal(draft.productFamily, 'GFRP rebar');
  assert.equal(draft.productVariant, 'Sand-coated');
  assert.equal(draft.dimensions, '16 mm');
  assert.equal(draft.quantity, '2,000 metres');
  assert.equal(draft.application, 'coastal retaining wall');
  assert.equal(draft.destination, 'Johor, Malaysia');
  assert.equal(draft.requestedDelivery, 'November 2026');
  assert.equal(result.question, '');
});

test('uses a short answer for the pending product-variant clarification', () => {
  const draft = rfq.createDraft();
  draft.status = 'collecting';
  rfq.setField(draft, 'application', 'tunnel ground support');
  rfq.setField(draft, 'productFamily', 'GFRP rockbolt');
  assert.equal(rfq.nextQuestion(draft, 'en'), 'Which product variant do you mean?');

  const result = rfq.processMessage(draft, 'general solid', 'en');
  assert.equal(result.kind, 'rfq-update');
  assert.equal(draft.productVariant, 'General solid');
  assert.ok(!result.question.includes('variant'));
});

test('applies quantity corrections without changing or converting the unit', () => {
  const draft = rfq.createDraft();
  draft.status = 'collecting';
  rfq.processMessage(draft, demonstrationEnquiry, 'en');
  rfq.processMessage(draft, 'Actually, make that 1,500 metres.', 'en');

  assert.equal(draft.quantity, '1,500 metres');
  assert.notEqual(draft.quantity, '1500 m');
});

test('product questions interrupt collection and resume the same missing field', () => {
  const draft = rfq.createDraft();
  draft.status = 'collecting';
  rfq.setField(draft, 'application', 'coastal retaining wall');
  const before = structuredClone(draft);
  const result = rfq.processMessage(draft, 'What is sand-coated GFRP rebar?', 'en');

  assert.equal(result.kind, 'product-question');
  assert.equal(result.question, 'Which product family do you need: rebar, rockbolt, mesh, tie rod, or anchor cable?');
  assert.deepEqual({ ...draft, pendingField: before.pendingField }, before);
});

test('unknown answers remain visible as unresolved in an incomplete draft', () => {
  const draft = rfq.createDraft();
  draft.status = 'collecting';
  draft.pendingField = 'requestedDelivery';
  const result = rfq.processMessage(draft, 'unknown', 'en');

  assert.equal(result.kind, 'rfq-update');
  assert.ok(draft.unknownFields.includes('requestedDelivery'));
  assert.ok(rfq.getUnresolvedFields(draft).includes('requestedDelivery'));
  assert.match(rfq.formatDraft(draft, 'en'), /Requested delivery: Unknown/);
});

test('summary edits survive language formatting, confirmation, and explicit reset', () => {
  const draft = rfq.createDraft();
  draft.status = 'collecting';
  rfq.processMessage(draft, demonstrationEnquiry, 'en');
  rfq.setField(draft, 'quantity', '1,500 metres');

  assert.match(rfq.formatDraft(draft, 'en'), /Quantity: 1,500 metres/);
  assert.match(rfq.formatDraft(draft, 'zh'), /数量: 1,500 metres/);
  rfq.confirmDraft(draft);
  assert.equal(draft.confirmed, true);
  assert.equal(draft.status, 'confirmed');

  rfq.resetDraft(draft);
  assert.deepEqual(draft, rfq.createDraft());
});
