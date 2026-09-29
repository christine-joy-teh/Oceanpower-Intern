/* The RFQ object below is the single source of truth for chat and summary edits. */
(function initialiseRFQUI() {
  'use strict';
  const engine = globalThis.OceanpowerRFQ;
  let draft = engine.createDraft();
  let view = 'chat';
  let reviewing = false;
  let demoSubmitted = false;
  let validationAttempted = false;
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
  let dateUnknown, dateUnknownLabel, dateHelp;
  const today = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };
  const units = {};
  const measurementUnits = { dimensions: ['mm', 'cm', 'm', 'inches', 'ft'], quantity: ['m', 'pieces', 'tonnes'] };
  // ISO 3166-1 country/territory codes; names are localized by the browser.
  const countryCodes = 'AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'.split(' ');
  const countryNames = { en: new Intl.DisplayNames(['en'], { type: 'region' }), zh: new Intl.DisplayNames(['zh-CN'], { type: 'region' }) };
  let countryPicker;
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
      empty: 'Enter your project details in the fields below.',
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
      empty: '请在下方字段中填写项目资料。',
      caution: '日期仅代表您的期望。价格、交期及技术要求仍需由销售确认。',
      saved: '草稿已修改，请重新检查并确认。', optional: '公司 / 联系方式（选填）',
      textLabel: '供手动复制的询价文本', progress: '个必填字段已记录',
    },
  };
  const ui = () => copy[locale()];
  const bilingual = (en, zh) => locale() === 'zh' ? zh : en;
  const review = document.createElement('div');
  review.className = 'rfq-review';
  review.tabIndex = -1;
  editor.after(review);
  const editButton = document.createElement('button');
  editButton.type = 'button';
  const emailLink = document.createElement('button');
  emailLink.type = 'button';
  emailLink.className = 'rfq-email';
  confirmButton.after(editButton, emailLink);
  const confirmation = document.createElement('section');
  confirmation.className = 'rfq-demo-confirmation';
  confirmation.tabIndex = -1;
  confirmation.setAttribute('aria-labelledby', 'rfq-demo-heading');
  const confirmationHeading = document.createElement('h3');
  confirmationHeading.id = 'rfq-demo-heading';
  const confirmationMessage = document.createElement('p');
  confirmation.append(confirmationHeading, confirmationMessage);
  review.after(confirmation);
  emailLink.addEventListener('click', () => {
    if (!reviewing || demoSubmitted) return;
    const invalid = engine.fields.filter(field => field.required || field.reviewRequired).find(field => contactError(field.id));
    if (invalid) {
      reviewing = false;
      validationAttempted = true;
      render();
      inputs[invalid.id].focus();
      return;
    }
    demoSubmitted = true;
    render();
    confirmation.focus();
  });
  editButton.addEventListener('click', () => {
    demoSubmitted = false;
    reviewing = false;
    render();
    inputs.application.focus();
  });
  const examples = {
    application: ['Metro tunnel reinforcement', '地铁隧道加固'],
    product: ['GFRP sand-coated rebar', 'GFRP 覆砂筋材'],
    dimensions: ['16', '16'], quantity: ['5000', '5000'],
    destination: ['Search countries', '搜索国家或地区'], delivery: ['October 2026 or to be confirmed', '2026年10月或待定'],
    company: ['Company name', '公司名称'], contact: ['you@company.com', 'you@company.com'],
    name: ['Your full name', '您的姓名'], phone: ['Include country code, e.g. +65', '请包含国家区号，例如 +86'],
  };

  const optional = document.createElement('fieldset');
  optional.className = 'rfq-optional';
  const optionalHeading = document.createElement('legend');
  optional.append(optionalHeading);
  const groups = ['Project requirements', 'Delivery'].map(() => {
    const fieldset = document.createElement('fieldset');
    const legend = document.createElement('legend');
    fieldset.append(legend);
    editor.append(fieldset);
    return fieldset;
  });
  engine.fields.forEach((field) => {
    const row = document.createElement('div');
    row.className = 'rfq-field';
    row.dataset.field = field.id;
    const label = document.createElement('label');
    label.htmlFor = `rfq-${field.id}`;
    const input = document.createElement('input');
    input.id = `rfq-${field.id}`;
    input.name = field.id;
    input.type = field.id === 'delivery' ? 'date' : field.id === 'contact' ? 'email' : field.id === 'phone' ? 'tel' : 'text';
    input.maxLength = 240;
    input.autocomplete = ({ name: 'name', contact: 'email', company: 'organization', phone: 'tel' })[field.id] || 'off';
    input.required = Boolean(field.reviewRequired);
    input.setAttribute('aria-required', String(field.required || Boolean(field.reviewRequired)));
    const fieldStatus = document.createElement('small');
    fieldStatus.id = `rfq-${field.id}-status`;
    input.setAttribute('aria-describedby', fieldStatus.id);
    const controls = document.createElement('div');
    controls.className = 'rfq-field-controls';
    controls.append(input);
    if (measurementUnits[field.id]) {
      input.inputMode = 'decimal';
      input.pattern = '[0-9]+([.][0-9]+)?';
      controls.classList.add('rfq-measurement');
      const select = document.createElement('select');
      select.id = `${input.id}-unit`;
      for (const unit of measurementUnits[field.id]) {
        const option = document.createElement('option');
        option.value = unit;
        option.textContent = unit;
        select.append(option);
      }
      units[field.id] = select;
      controls.append(select);
      select.addEventListener('change', () => {
        draft = engine.edit(draft, field.id, input.value ? `${input.value} ${select.value}` : '');
        render();
      });
      input.addEventListener('beforeinput', event => {
        if (event.data && !/^[\d.]+$/.test(event.data)) event.preventDefault();
      });
    }
    if (field.id === 'destination') countryPicker = createCountryPicker(input, controls);
    if (field.id === 'delivery') {
      dateUnknown = document.createElement('input');
      dateUnknown.type = 'checkbox';
      dateUnknown.id = 'rfq-delivery-unknown';
      const wrapper = document.createElement('label');
      wrapper.className = 'rfq-date-unknown';
      wrapper.htmlFor = dateUnknown.id;
      dateUnknownLabel = document.createElement('span');
      wrapper.append(dateUnknown, dateUnknownLabel);
      dateHelp = document.createElement('small');
      dateHelp.id = 'rfq-delivery-help';
      input.setAttribute('aria-describedby', `${fieldStatus.id} ${dateHelp.id}`);
      controls.append(wrapper, dateHelp);
      dateUnknown.addEventListener('change', () => {
        draft = dateUnknown.checked ? engine.markUnknown(draft, 'delivery') : engine.edit(draft, 'delivery', '');
        render();
        if (!dateUnknown.checked) input.focus();
      });
    } else if (field.required) {
      const unknown = document.createElement('button');
      unknown.type = 'button';
      unknown.className = 'rfq-unknown';
      unknown.addEventListener('click', () => {
        draft = draft.fields[field.id].status === 'unknown' ? engine.edit(draft, field.id, '') : engine.markUnknown(draft, field.id);
        if (field.id === 'destination') countryPicker.close();
        render();
        document.dispatchEvent(new CustomEvent('rfq-prompt'));
      });
      controls.append(unknown);
      unknownButtons[field.id] = unknown;
    }
    input.addEventListener('input', () => {
      if (units[field.id]) {
        // Keep pasted numeric values such as 5,000 usable; never store text as a measurement.
        const candidate = input.value.replace(/,/g, '');
        input.value = /^\d*(?:\.\d*)?$/.test(candidate) ? candidate : (input.dataset.numericValue || '');
        input.dataset.numericValue = input.value;
      }
      const value = units[field.id] && input.value ? `${input.value} ${units[field.id].value}` : input.value;
      draft = engine.edit(draft, field.id, value);
      copyFeedback.textContent = '';
      render();
    });
    input.addEventListener('change', () => render());
    row.append(label, controls, fieldStatus);
    (field.required ? groups[['destination', 'delivery'].includes(field.id) ? 1 : 0] : optional).append(row);
    inputs[field.id] = input;
    statuses[field.id] = fieldStatus;
    labels[field.id] = label;
  });
  editor.append(optional);

  function createCountryPicker(input, controls) {
    const list = document.createElement('div');
    list.id = 'rfq-country-options';
    list.className = 'rfq-country-options';
    list.setAttribute('role', 'listbox');
    list.hidden = true;
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-controls', list.id);
    input.setAttribute('aria-expanded', 'false');
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'rfq-country-toggle';
    toggle.textContent = '▾';
    controls.classList.add('rfq-country');
    controls.append(toggle, list);
    let matches = [], active = -1;
    const fold = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    function close() {
      list.hidden = true;
      input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-activedescendant');
      active = -1;
    }
    function choose(code) {
      input.value = countryNames[locale()].of(code);
      draft = engine.edit(draft, 'destination', input.value);
      close(); render(); input.focus();
    }
    function open(all = false) {
      const query = all ? '' : fold(input.value);
      matches = countryCodes.filter(code => [countryNames.en.of(code), countryNames.zh.of(code)].some(name => fold(name).startsWith(query)))
        .sort((a,b) => countryNames[locale()].of(a).localeCompare(countryNames[locale()].of(b), locale()));
      active = -1;
      input.removeAttribute('aria-activedescendant');
      list.replaceChildren();
      for (const code of matches) {
        const option = document.createElement('div');
        option.id = `rfq-country-${code}`;
        option.setAttribute('role', 'option');
        option.setAttribute('aria-selected', 'false');
        option.textContent = countryNames[locale()].of(code);
        option.addEventListener('mousedown', event => event.preventDefault());
        option.addEventListener('click', () => choose(code));
        list.append(option);
      }
      if (!matches.length) {
        const empty = document.createElement('p');
        empty.setAttribute('role', 'status');
        empty.textContent = bilingual('No matching countries. Try another name.', '没有匹配结果，请尝试其他名称。');
        list.append(empty);
      }
      list.hidden = false;
      input.setAttribute('aria-expanded', 'true');
    }
    toggle.addEventListener('click', () => { if (list.hidden) { input.focus(); open(true); } else close(); });
    input.addEventListener('input', () => open());
    input.addEventListener('click', () => open(!input.value));
    input.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !list.hidden) { event.preventDefault(); event.stopPropagation(); close(); }
      if (event.key === 'Tab') close();
      if (event.key === 'Enter' && !list.hidden) { event.preventDefault(); if (active >= 0) choose(matches[active]); else if(matches.length === 1) choose(matches[0]); }
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        if (list.hidden) open(true);
        if (!matches.length) return;
        active = (active + (event.key === 'ArrowDown' ? 1 : -1) + matches.length) % matches.length;
        [...list.children].forEach((option, index) => option.setAttribute('aria-selected', String(index === active)));
        input.setAttribute('aria-activedescendant', `rfq-country-${matches[active]}`);
        list.children[active].scrollIntoView?.({ block: 'nearest' });
      }
    });
    controls.addEventListener('focusout', event => { if (!controls.contains(event.relatedTarget)) close(); });
    document.addEventListener('click', event => { if (!controls.contains(event.target)) close(); });
    return { close, localise() { toggle.setAttribute('aria-label', bilingual('Show all countries', '显示所有国家或地区')); } };
  }

  function contactError(id) {
    const field = engine.fields.find(field => field.id === id);
    if (field.required && draft.fields[id].status === 'unknown') return '';
    if (field.required && !inputs[id].value.trim()) return bilingual('Complete this field or mark Not sure yet.', '请填写此项或标记暂不确定。');
    if (id === 'delivery') {
      const value = inputs.delivery.value;
      const parsed = new Date(`${value}T12:00:00`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(parsed.getTime()) || parsed.getFullYear() !== Number(value.slice(0,4)) || parsed.getMonth() + 1 !== Number(value.slice(5,7)) || parsed.getDate() !== Number(value.slice(8,10)) || value < today()) return bilingual('Choose today or a future date, or mark Date not confirmed yet.', '请选择今天或未来日期，或标记日期尚未确定。');
    }
    if (units[id] && draft.fields[id].status !== 'unknown' && (!/^\d+(\.\d+)?$/.test(inputs[id].value) || !Number.isFinite(Number(inputs[id].value)) || Number(inputs[id].value) <= 0)) return bilingual('Enter a number greater than zero and choose a unit, or select Unknown.', '请输入大于零的数字并选择单位，或选择未知。');
    if (id === 'destination' && !countryCodes.some(code => [countryNames.en.of(code), countryNames.zh.of(code)].some(name => name.toLowerCase() === inputs.destination.value.trim().toLowerCase()))) return bilingual('Select a country from the list.', '请从列表中选择国家或地区。');
    if (id === 'name' && !inputs.name.value.trim()) return bilingual('Please enter your name.', '请填写您的姓名。');
    if (id === 'contact' && (!inputs.contact.value.trim() || inputs.contact.validity?.typeMismatch || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inputs.contact.value.trim()))) return bilingual('Please enter a valid business email, such as you@company.com.', '请填写有效的工作邮箱，例如 you@company.com。');
    return '';
  }

  function render() {
    const text = ui();
    inputs.delivery.min = today();
    dateUnknown.checked = draft.fields.delivery.status === 'unknown';
    inputs.delivery.disabled = dateUnknown.checked;
    dateUnknownLabel.textContent = bilingual('Date not confirmed yet', '日期尚未确定');
    dateHelp.textContent = bilingual('When would you like the materials to arrive? Delivery timing is subject to confirmation by Oceanpower.', '您希望材料何时到达？交付时间须由 Oceanpower 确认。');
    countryPicker.localise();
    groups[0].querySelector('legend').textContent = bilingual('Project requirements', '项目需求');
    groups[1].querySelector('legend').textContent = bilingual('Delivery', '交付');
    editor.hidden = reviewing;
    review.hidden = !reviewing || demoSubmitted;
    confirmation.hidden = !demoSubmitted;
    confirmationHeading.textContent = bilingual('Demo enquiry completed', '演示询价已完成');
    confirmationMessage.textContent = bilingual('Your enquiry has been prepared successfully. This is a demonstration—nothing has been sent to Oceanpower.', '您的询价已准备完成。这是演示流程，没有向 Oceanpower 发送任何资料。');
    editButton.hidden = !reviewing;
    emailLink.hidden = !reviewing || demoSubmitted;
    document.querySelector('.rfq-copy').hidden = !reviewing;
    editButton.textContent = bilingual('Edit details', '编辑资料');
    emailLink.textContent = bilingual('Submit demo enquiry', '提交演示询价');
    review.replaceChildren();
    const reviewHeading = document.createElement('h3');
    reviewHeading.textContent = bilingual('Review your enquiry', '检查您的询价');
    review.append(reviewHeading);
    const summary = document.createElement('dl');
    engine.fields.forEach(field => {
      const term = document.createElement('dt');
      const value = document.createElement('dd');
      term.textContent = field.label[locale()];
      value.textContent = draft.fields[field.id].status === 'unknown' ? bilingual('To be confirmed with sales', '待与销售确认') : engine.valueText(draft.fields[field.id], locale()) || (field.required || field.reviewRequired ? bilingual('Not provided — follow-up needed', '未提供 — 待跟进') : bilingual('Not provided', '未提供'));
      if (draft.fields[field.id].status === 'unresolved') {
        value.textContent += bilingual(' — Please clarify the product/variant or include units, as applicable.', ' — 请确认产品型号或补充单位。');
      }
      summary.append(term, value);
    });
    review.append(summary);
    copyFeedback.textContent = manualCopy.hidden ? '' : text.manual;
    section.hidden = view !== 'rfq';
    document.querySelector('.chat-conversation').hidden = view === 'rfq';
    document.querySelector('.chat-panel').dataset.view = view;
    section.setAttribute('aria-label', text.heading);
    document.querySelector('.chat-panel').classList.toggle('has-rfq', view === 'rfq');
    document.querySelector('.prepare-enquiry').textContent = draft.active ? text.resume : text.start;
    document.querySelector('.rfq-title').textContent = text.heading;
    document.querySelector('.rfq-note').textContent = bilingual('Tell us about your project. Your draft stays on this page until you reload. Nothing is sent automatically.', '请填写项目需求。刷新页面后草稿将清空，不会自动发送。');
    document.querySelector('.rfq-caution').textContent = bilingual('This is a demonstration. Submitting completes the demo only; no enquiry is sent to Oceanpower. Final product selection, pricing and technical confirmation are subject to review by an Oceanpower sales engineer.', '这是演示流程，提交仅完成演示，不会向 Oceanpower 发送询价。最终产品选择、价格及技术参数须由 Oceanpower 销售工程师审核。');
    document.querySelector('.rfq-copy').textContent = text.copy;
    confirmButton.textContent = bilingual('Review RFQ', '检查询价');
    confirmButton.hidden = reviewing;
    optionalHeading.textContent = bilingual('Your contact details', '您的联系资料');
    manualCopy.setAttribute('aria-label', text.textLabel);
    let known = 0;
    const required = engine.fields.filter((field) => field.required || field.reviewRequired).length;
    for (const field of engine.fields) {
      const item = draft.fields[field.id];
      labels[field.id].textContent = field.label[locale()];
      inputs[field.id].placeholder = examples[field.id][locale() === 'zh' ? 1 : 0];
      if (field.id === 'destination') labels[field.id].textContent = bilingual('Delivery country / region', '交付国家 / 地区');
      if (units[field.id]) {
        units[field.id].setAttribute('aria-label', `${field.label[locale()]} — ${bilingual('unit', '单位')}`);
        if (document.activeElement !== inputs[field.id]) {
          const match = item.value.match(/^([\d,.]+)\s+(.+)$/);
          inputs[field.id].value = match ? match[1].replace(/,/g, '') : '';
          inputs[field.id].dataset.numericValue = inputs[field.id].value;
          if (match && measurementUnits[field.id].includes(match[2])) units[field.id].value = match[2];
        }
      } else if (document.activeElement !== inputs[field.id] || (field.id === 'delivery' && dateUnknown.checked)) inputs[field.id].value = item.status === 'unknown' ? '' : engine.valueText(item, locale());
      const fieldStatus = item.status === 'unknown' ? text.unknownStatus : text[item.status];
      statuses[field.id].textContent = item.status === 'unknown' ? fieldStatus : '';
      statuses[field.id].dataset.status = item.status;
      inputs[field.id].setAttribute('aria-invalid', 'false');
      const error = validationAttempted ? contactError(field.id) : '';
      if (error) {
        statuses[field.id].textContent = error;
        inputs[field.id].setAttribute('aria-invalid', 'true');
      }
      if ((field.required || field.reviewRequired) && !contactError(field.id)) known += 1;
      if (unknownButtons[field.id]) {
        unknownButtons[field.id].textContent = bilingual('Not sure yet', '暂不确定');
        unknownButtons[field.id].setAttribute('aria-pressed', String(item.status === 'unknown'));
        unknownButtons[field.id].setAttribute('aria-label', `${field.label[locale()]}: ${bilingual('Not sure yet', '暂不确定')}`);
      }
    }
    document.querySelector('.rfq-progress').textContent = `${known}/${required} ${bilingual('required fields completed or marked not sure yet', '个必填项已填写或标记暂不确定')}`;
    const hasDetails = engine.fields.some((field) => draft.fields[field.id].status !== 'missing');
    confirmButton.disabled = false;
    status.hidden = demoSubmitted;
    status.textContent = reviewing ? bilingual('Review your details before completing the demo. Nothing will be sent.', '请检查资料后完成演示，不会发送任何内容。') : text.empty;
    status.dataset.confirmed = String(draft.confirmed);
    prompt.textContent = '';
    if (!manualCopy.hidden) manualCopy.value = engine.toText(draft, locale());
  }

  confirmButton.addEventListener('click', () => {
    validationAttempted = true;
    countryPicker.close();
    const invalid = engine.fields.filter(field => field.required || field.reviewRequired).map(field => field.id).find(id => contactError(id));
    if (invalid) {
      render();
      status.textContent = bilingual('Please check the highlighted fields below.', '请检查下方标记的字段。');
      inputs[invalid].focus();
      return;
    }
    reviewing = true;
    render();
    review.focus();
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
    getView: () => view,
    setView(next) { countryPicker.close(); view = next === 'rfq' ? 'rfq' : 'chat'; render(); },
    begin(product) {
      demoSubmitted = false;
      draft = engine.start(draft);
      reviewing = false;
      if (product) draft = engine.edit(draft, 'product', product === 'GFRP' ? 'GFRP sand-coated rebar' : `${product} rebar`);
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
      demoSubmitted = false;
      countryPicker.close();
      Object.entries(units).forEach(([id, select]) => { select.value = measurementUnits[id][0]; });
      reviewing = false;
      validationAttempted = false;
      draft = engine.createDraft();
      details.open = false;
      manualCopy.hidden = true;
      manualCopy.value = '';
      copyFeedback.textContent = '';
      render();
    },
  };
  render();
})();

