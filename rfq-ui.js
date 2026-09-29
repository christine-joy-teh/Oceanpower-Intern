/* The RFQ object below is the single source of truth for chat and summary edits. */
(function initialiseRFQUI() {
  'use strict';
  const engine = globalThis.OceanpowerRFQ;
  let draft = engine.createDraft();
  const section = document.querySelector('.rfq-section');
  const details = document.querySelector('.rfq-details');
  const editor = document.querySelector('.rfq-fields');
  const prompt = document.querySelector('.rfq-prompt');
  const status = document.querySelector('.rfq-status');
  const copyFeedback = document.querySelector('.rfq-copy-feedback');
  const manualCopy = document.querySelector('.rfq-copy-manual');
  const confirmButton = document.querySelector('.rfq-confirm');
  const inputs = {};
  const statuses = {};
  const labels = {};
  const unknownButtons = {};
  const locale = () => document.documentElement.lang === 'zh-CN' ? 'zh' : 'en';
  const copy = {
    en: {
      start: 'Prepare enquiry', resume: 'Continue enquiry', heading: 'Enquiry draft',
      note: 'Provisional pilot fields. Use fictional details for this demo. This draft lasts only until the page reloads.',
      unknown: 'Unknown', missing: 'Missing', unresolved: 'Needs clarification', known: 'Recorded',
      unknownStatus: 'Unknown · follow-up needed', copy: 'Copy enquiry', copied: 'Enquiry copied. Nothing has been sent.',
      manual: 'Automatic copy is unavailable. Select and copy the text below.',
      confirm: 'Confirm draft for staff review', confirmed: 'Draft confirmed · ready for staff review. Nothing has been sent.',
      incomplete: 'Incomplete draft: outstanding details remain visible for follow-up.',
      ready: 'Details recorded. Review the fields and confirm your draft.',
      empty: 'Add project details in the conversation or edit the fields below.',
      caution: 'Requested dates are your preferences. Sales must confirm price, delivery, and technical requirements.',
      saved: 'Draft updated. Please review it again before confirming.', optional: 'Optional company / contact',
      textLabel: 'Enquiry text for manual copying', progress: 'required fields recorded',
    },
    zh: {
      start: '准备询价', resume: '继续询价', heading: '询价草稿',
      note: '试点暂定字段。演示请使用虚构信息。刷新页面后草稿将清空。',
      unknown: '未知', missing: '待补充', unresolved: '需要澄清', known: '已记录',
      unknownStatus: '未知 · 待跟进', copy: '复制询价', copied: '询价已复制，尚未发送。',
      manual: '无法自动复制，请选中并复制下方文本。',
      confirm: '确认草稿，供工作人员审核', confirmed: '草稿已确认 · 可供工作人员审核。尚未发送。',
      incomplete: '草稿尚不完整，待补充的信息将保留，供后续跟进。',
      ready: '所需信息已记录，请检查字段后确认草稿。',
      empty: '请在对话中提供项目资料，或直接编辑下方字段。',
      caution: '日期仅代表您的期望。价格、交期及技术要求仍需由销售确认。',
      saved: '草稿已修改，请重新检查并确认。', optional: '公司 / 联系方式（选填）',
      textLabel: '供手动复制的询价文本', progress: '个必填字段已记录',
    },
  };
  const ui = () => copy[locale()];

  const optional = document.createElement('details');
  optional.className = 'rfq-optional';
  const optionalHeading = document.createElement('summary');
  optional.append(optionalHeading);
  engine.fields.forEach((field) => {
    const row = document.createElement('div');
    row.className = 'rfq-field';
    row.dataset.field = field.id;
    const label = document.createElement('label');
    label.htmlFor = `rfq-${field.id}`;
    const input = document.createElement('input');
    input.id = `rfq-${field.id}`;
    input.name = field.id;
    input.type = 'text';
    input.maxLength = 240;
    input.autocomplete = 'off';
    input.setAttribute('aria-required', String(field.required));
    const fieldStatus = document.createElement('small');
    fieldStatus.id = `rfq-${field.id}-status`;
    input.setAttribute('aria-describedby', fieldStatus.id);
    const controls = document.createElement('div');
    controls.className = 'rfq-field-controls';
    controls.append(input);
    if (field.required) {
      const unknown = document.createElement('button');
      unknown.type = 'button';
      unknown.className = 'rfq-unknown';
      unknown.addEventListener('click', () => {
        draft = engine.markUnknown(draft, field.id);
        render();
        document.dispatchEvent(new CustomEvent('rfq-prompt'));
      });
      controls.append(unknown);
      unknownButtons[field.id] = unknown;
    }
    input.addEventListener('input', () => {
      draft = engine.edit(draft, field.id, input.value);
      copyFeedback.textContent = '';
      render();
    });
    input.addEventListener('change', () => render());
    row.append(label, controls, fieldStatus);
    (field.required ? editor : optional).append(row);
    inputs[field.id] = input;
    statuses[field.id] = fieldStatus;
    labels[field.id] = label;
  });
  editor.append(optional);

  function render() {
    const text = ui();
    copyFeedback.textContent = manualCopy.hidden ? '' : text.manual;
    section.hidden = !draft.active;
    section.setAttribute('aria-label', text.heading);
    document.querySelector('.chat-panel').classList.toggle('has-rfq', draft.active);
    document.querySelector('.prepare-enquiry').textContent = draft.active ? text.resume : text.start;
    document.querySelector('.rfq-title').textContent = text.heading;
    document.querySelector('.rfq-note').textContent = text.note;
    document.querySelector('.rfq-caution').textContent = text.caution;
    document.querySelector('.rfq-copy').textContent = text.copy;
    confirmButton.textContent = text.confirm;
    optionalHeading.textContent = text.optional;
    manualCopy.setAttribute('aria-label', text.textLabel);
    let known = 0;
    const required = engine.fields.filter((field) => field.required).length;
    for (const field of engine.fields) {
      const item = draft.fields[field.id];
      labels[field.id].textContent = field.label[locale()];
      if (document.activeElement !== inputs[field.id]) inputs[field.id].value = engine.valueText(item, locale());
      const fieldStatus = item.status === 'unknown' ? text.unknownStatus : text[item.status];
      statuses[field.id].textContent = fieldStatus;
      statuses[field.id].dataset.status = item.status;
      inputs[field.id].setAttribute('aria-invalid', String(item.status === 'unresolved'));
      if (field.required && item.status === 'known') known += 1;
      if (unknownButtons[field.id]) {
        unknownButtons[field.id].textContent = text.unknown;
        unknownButtons[field.id].setAttribute('aria-label', `${field.label[locale()]}: ${text.unknown}`);
      }
    }
    document.querySelector('.rfq-progress').textContent = `${known}/${required} ${text.progress}`;
    const hasDetails = engine.fields.some((field) => draft.fields[field.id].status !== 'missing');
    confirmButton.disabled = !hasDetails || draft.confirmed;
    status.textContent = draft.confirmed ? text.confirmed : !hasDetails ? text.empty : engine.gaps(draft).length ? text.incomplete : text.ready;
    status.dataset.confirmed = String(draft.confirmed);
    prompt.textContent = draft.confirmed ? '' : engine.question(draft, locale());
    if (!manualCopy.hidden) manualCopy.value = engine.toText(draft, locale());
  }

  confirmButton.addEventListener('click', () => {
    draft = engine.confirm(draft);
    render();
  });
  document.querySelector('.rfq-copy').addEventListener('click', async () => {
    const text = engine.toText(draft, locale());
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(text);
      copyFeedback.textContent = ui().copied;
      manualCopy.hidden = true;
    } catch {
      copyFeedback.textContent = ui().manual;
      manualCopy.hidden = false;
      manualCopy.value = text;
      manualCopy.focus();
      manualCopy.select();
    }
  });

  globalThis.OceanpowerRFQUI = {
    isActive: () => draft.active,
    begin() {
      draft = engine.start(draft);
      render();
      details.open = true;
    },
    handle(message) {
      const result = engine.applyMessage(draft, message);
      draft = result.draft;
      render();
      if (draft.active && !draft.pendingField) details.open = true;
      return result;
    },
    question: () => engine.question(draft, locale()),
    contextualQuestion(message) {
      const product = draft.fields.product;
      const dimensions = draft.fields.dimensions;
      if (draft.active && product.status === 'known' && /strength|modulus|tensile|shear|强度|模量|载荷/i.test(message) && !/gfrp|bfrp|cfrp|glass|basalt|carbon|rock\s?bolt|rebar|mesh|tie rod|anchor cable|锚杆|筋材|网格|锚索|拉杆|玻纤|玄武岩|碳纤/i.test(message)) {
        const hasDimensions = /\d\s*(?:mm|cm|毫米|厘米)/i.test(message);
        const dimensionContext = !hasDimensions && dimensions.status === 'known' ? ` Requested dimensions: ${dimensions.value}.` : '';
        return `${message}\nCustomer-requested product: ${engine.valueText(product, 'en')}.${dimensionContext}`;
      }
      return message;
    },
    localise() { copyFeedback.textContent = ''; render(); },
    reset() {
      draft = engine.createDraft();
      details.open = false;
      optional.open = false;
      manualCopy.hidden = true;
      manualCopy.value = '';
      copyFeedback.textContent = '';
      render();
    },
  };
  render();
})();
