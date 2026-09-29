const test = require('node:test');
const assert = require('node:assert/strict');
const rfq = require('../rfq');

const EXAMPLE = 'Sand-coated GFRP rebar, 16 mm, 2,000 metres, for a coastal retaining wall in Johor, Malaysia. Requested delivery: November 2026.';
const begin = () => rfq.start(rfq.createDraft());
const say = (draft, message) => rfq.applyMessage(draft, message).draft;

test('the fictional enquiry captures all six fields without a provider', () => {
  const draft = say(begin(), EXAMPLE);
  assert.equal(draft.fields.application.value, 'coastal retaining wall');
  assert.equal(draft.fields.product.family, 'rebar');
  assert.equal(draft.fields.product.variant, 'sand');
  assert.equal(draft.fields.dimensions.value, '16 mm');
  assert.equal(draft.fields.quantity.value, '2,000 metres');
  assert.equal(draft.fields.destination.value, 'Johor, Malaysia');
  assert.equal(draft.fields.delivery.value, 'November 2026');
  assert.deepEqual(rfq.gaps(draft), []);
  assert.equal(draft.pendingField, null);
});

test('quantity corrections preserve units and invalidate visitor confirmation', () => {
  let draft = rfq.confirm(say(begin(), EXAMPLE));
  assert.equal(draft.confirmed, true);
  draft = say(draft, 'Actually, make that 1,500 metres.');
  assert.equal(draft.fields.quantity.value, '1,500 metres');
  assert.equal(draft.fields.dimensions.value, '16 mm');
  assert.equal(draft.confirmed, false);
  draft = say(draft, 'Actually 50 pieces');
  assert.equal(draft.fields.quantity.value, '50 pieces');
  draft = say(draft, 'Quantity: 2 tonnes');
  assert.equal(draft.fields.quantity.value, '2 tonnes');
});

test('a short rockbolt variant answer uses the pending question', () => {
  let draft = say(begin(), 'I need 20 mm GFRP rockbolts');
  assert.equal(draft.pendingField, 'product');
  assert.match(rfq.question(draft), /general solid.*MGSL/);
  draft = say(draft, 'the general solid one');
  assert.equal(draft.fields.product.variant, 'solid');
  assert.equal(draft.fields.product.status, 'known');
  assert.equal(draft.fields.dimensions.value, '20 mm');
  assert.equal(draft.pendingField, 'application');
  draft = say(draft, 'tunnel support');
  assert.equal(draft.fields.application.value, 'tunnel support');
  assert.equal(draft.pendingField, 'quantity');
  draft = say(draft, 'MGSL20 instead');
  assert.equal(draft.fields.product.family, 'rockbolt');
  assert.equal(draft.fields.product.variant, 'mining');
});

test('product questions never overwrite requirements or the pending field', () => {
  const draft = say(begin(), 'Sand-coated GFRP rebar, 16 mm, for a coastal wall');
  const result = rfq.applyMessage(draft, 'What is the strength of a 20 mm GFRP rockbolt?');
  assert.equal(result.handled, false);
  assert.equal(result.draft, draft);
  assert.equal(result.draft.pendingField, 'quantity');
  assert.equal(say(result.draft, '2,000 metres').fields.quantity.value, '2,000 metres');
});

test('unknown fields are kept as explicit gaps and skipped in qualification', () => {
  let draft = say(begin(), 'unknown');
  assert.equal(draft.fields.application.status, 'unknown');
  assert.equal(draft.pendingField, 'product');
  draft = say(draft, 'GFRP rebar');
  draft = say(draft, 'not sure');
  assert.equal(draft.fields.product.status, 'unknown');
  assert.equal(draft.fields.product.family, 'rebar');
  assert.equal(draft.pendingField, 'dimensions');
  draft = rfq.confirm(draft);
  assert.equal(draft.confirmed, true);
  const summary = rfq.toText(draft);
  assert.match(summary, /GFRP rebar — Unknown/);
  assert.match(summary, /Diameter.*Missing/);
  assert.match(summary, /Nothing has been sent/);
  assert.match(summary, /not a quotation/);
});

test('bilingual structured input and clarification keep distinct products', () => {
  let draft = say(begin(), '用途：沿海挡土墙；产品：覆砂 GFRP 筋材；直径：16 毫米；数量：2,000 米；目的地：马来西亚柔佛；期望交付日期：2026年11月。');
  assert.deepEqual(rfq.gaps(draft), []);
  assert.equal(draft.fields.quantity.value, '2,000 米');
  draft = say(draft, '改为1,500米');
  assert.equal(draft.fields.quantity.value, '1,500米');
  assert.match(rfq.toText(draft, 'zh'), /尚未发送给销售/);
  let bolt = say(begin(), '20 毫米 GFRP 锚杆');
  assert.equal(bolt.pendingField, 'product');
  bolt = say(bolt, '普通实心');
  assert.equal(bolt.fields.product.variant, 'solid');
  const result = rfq.applyMessage(bolt, '什么是覆砂筋材？');
  assert.equal(result.handled, false);
  assert.equal(result.draft.fields.product.family, 'rockbolt');
});

test('editing the summary updates the same object and confirmation state', () => {
  let draft = rfq.confirm(say(begin(), EXAMPLE));
  draft = rfq.edit(draft, 'destination', 'Singapore');
  assert.equal(draft.confirmed, false);
  assert.equal(draft.fields.destination.value, 'Singapore');
  assert.match(rfq.toText(draft), /Destination: Singapore/);
  assert.doesNotMatch(rfq.toText(draft), /Johor/);
  draft = rfq.edit(draft, 'quantity', '');
  assert.equal(draft.pendingField, 'quantity');
  assert.equal(draft.fields.quantity.status, 'missing');
});

test('ambiguous or unitless values remain unresolved, with no unit conversion', () => {
  let draft = rfq.edit(begin(), 'quantity', '1500');
  assert.equal(draft.fields.quantity.status, 'unresolved');
  draft = rfq.edit(draft, 'quantity', '0 pieces');
  assert.equal(draft.fields.quantity.status, 'unresolved');
  draft = rfq.edit(draft, 'dimensions', '16');
  assert.equal(draft.fields.dimensions.status, 'unresolved');
  draft = say(draft, '16 mm or 20 mm');
  assert.equal(draft.fields.dimensions.status, 'unresolved');
  draft = say(draft, '1,500 metres or 500 pieces');
  assert.equal(draft.fields.quantity.status, 'unresolved');
  draft = say(draft, 'GFRP rebar or rockbolts');
  assert.equal(draft.fields.product.status, 'unresolved');
  draft = say(draft, 'BFRP rebar');
  assert.equal(draft.fields.product.family, 'bfrp');
  assert.equal(draft.fields.product.status, 'known');
  draft = say(draft, 'BFRP rockbolt');
  assert.equal(draft.fields.product.status, 'unresolved');
  assert.equal(draft.fields.product.value, 'BFRP rockbolt');
  assert.equal(draft.fields.product.family, '', 'never relabel an unsupported material as GFRP');
});

test('explicit dimension labels do not become order quantities', () => {
  let draft = say(begin(), 'Dimensions: 6 m');
  assert.equal(draft.fields.dimensions.value, '6 m');
  assert.equal(draft.fields.quantity.status, 'missing');
  draft = say(begin(), 'Application: tunnel support; Product: general solid GFRP rockbolt');
  assert.equal(draft.pendingField, 'dimensions');
  draft = say(draft, '6 metres');
  assert.equal(draft.fields.dimensions.value, '6 metres');
  assert.equal(draft.fields.quantity.status, 'missing');
  assert.equal(draft.pendingField, 'quantity');
});

test('ordinary questions do not start enquiry capture and reset clears data', () => {
  const draft = rfq.createDraft();
  const response = rfq.applyMessage(draft, EXAMPLE);
  assert.equal(response.draft, draft);
  assert.equal(response.handled, false);
  assert.equal(rfq.isStartRequest('What is sand-coated GFRP rebar?'), false);
  assert.equal(rfq.isStartRequest('I need an RFQ'), true);
  assert.equal(rfq.isStartRequest('请帮我准备询价'), true);
  const reset = rfq.createDraft();
  assert.equal(reset.active, false);
  assert.ok(rfq.fields.every((field) => reset.fields[field.id].status === 'missing'));
});
