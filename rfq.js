/* Deterministic, in-memory RFQ state. No network, storage, or technical selection. */
(function expose(factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else globalThis.OceanpowerRFQ = api;
})(function createRFQEngine() {
  'use strict';

  // Provisional pilot requirements: edit this schema after the management meeting.
  const fields = [
    { id: 'application', required: true, label: { en: 'Application / project use', zh: '应用场景 / 项目用途' }, question: { en: 'What will the reinforcement be used for?', zh: '这些加固材料将用于什么项目？' } },
    { id: 'product', required: true, label: { en: 'Product family and variant', zh: '产品类别和型号' }, question: { en: 'Which product family and variant are you requesting?', zh: '您需要哪类产品及具体型号？' } },
    { id: 'dimensions', required: true, label: { en: 'Diameter / dimensions with units', zh: '直径 / 尺寸（含单位）' }, question: { en: 'What diameter or dimensions do you need? Please include units.', zh: '您需要什么直径或尺寸？请注明单位。' } },
    { id: 'quantity', required: true, label: { en: 'Quantity with unit', zh: '数量（含单位）' }, question: { en: 'What quantity do you need? Please include metres, pieces, or tonnes.', zh: '您需要多少？请注明米、根、件或吨等单位。' } },
    { id: 'destination', required: true, label: { en: 'Destination', zh: '交付目的地' }, question: { en: 'What is the destination country, city, or port?', zh: '交付目的地是哪个国家、城市或港口？' } },
    { id: 'delivery', required: true, label: { en: 'Requested delivery timeframe', zh: '期望交付日期 / 时间范围' }, question: { en: 'When would you like delivery? This records your request, not a delivery commitment.', zh: '您期望何时交付？这里仅记录您的期望，交期需由销售确认。' } },
    { id: 'company', required: false, label: { en: 'Company (optional)', zh: '公司（选填）' } },
    { id: 'contact', required: false, label: { en: 'Contact (optional)', zh: '联系方式（选填）' } },
  ];

  const familyLabels = {
    gfrp: { en: 'GFRP product', zh: 'GFRP 产品' },
    rebar: { en: 'GFRP rebar', zh: 'GFRP 筋材' },
    bfrp: { en: 'BFRP rebar', zh: 'BFRP 筋材' },
    cfrp: { en: 'CFRP rebar', zh: 'CFRP 筋材' },
    rockbolt: { en: 'GFRP rockbolt', zh: 'GFRP 锚杆' },
    mesh: { en: 'GFRP mesh', zh: 'GFRP 网格' },
    tie: { en: 'GFRP form tie rod', zh: 'GFRP 模板拉杆' },
    cable: { en: 'GFRP anchor cable', zh: 'GFRP 锚索' },
  };
  const variantLabels = {
    sand: { en: 'Sand-coated', zh: '覆砂' },
    threaded: { en: 'Threaded', zh: '螺纹' },
    durable: { en: 'High-durability', zh: '高耐久' },
    solid: { en: 'General solid', zh: '普通实心' },
    mining: { en: 'All-thread mining/tunnel', zh: '全螺纹矿山 / 隧道' },
    hollow: { en: 'Hollow', zh: '中空' },
    drilling: { en: 'Self-drilling', zh: '自钻式' },
  };
  const clean = (value) => String(value ?? '').normalize('NFKC').trim().replace(/[。.!;；]+$/, '').trim().slice(0, 240);
  const language = (locale) => String(locale).startsWith('zh') ? 'zh' : 'en';
  const isUnknown = (value) => /^(?:unknown|not (?:yet )?(?:known|sure)|unsure|tbd|to be (?:confirmed|determined)|i (?:do not|don't) know(?: yet)?|skip(?: this)?|待定|未知|不确定|暂不确定|暂时不知道|不知道|不清楚|跳过)$/i.test(clean(value));
  const isQuestion = (value) => /[?？]|^(?:what|how|why|which|can|could|does|do|is|are|will|when|where|tell me|show me)\b|什么|多少|如何|能否|是否|可以.*吗|请问|请(?:提供|介绍|说明)|数据|性能参数/i.test(value.trim());
  const isStartRequest = (value) => /\b(?:prepare|start|create|build|make|need|want)\b[^?\n]{0,35}\b(?:rfq|enquiry|inquiry)\b|(?:准备|开始|整理|创建|需要).{0,12}(?:询价|询盘)/i.test(value);
  const isQuantity = (value) => /(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?\s*(?:metres?\b|meters?\b|m\b|pieces?\b|pcs\b|tonnes?\b|tons?\b|t\b|米(?!米)|根|支|件|吨|噸)/i.test(value);
  const isDimension = (value) => /\d\s*(?:mm\b|cm\b|m\b|millimet(?:er|re)s?\b|centimet(?:er|re)s?\b|met(?:er|re)s?\b|inches?\b|inch\b|ft\b|feet\b|毫米|厘米|米|英寸|英尺)/i.test(value);

  function productFrom(value, previous = {}) {
    const text = clean(value);
    const candidates = [];
    if (/rock\s?bolt|soil nail|锚杆|土钉|mgsl\d*/i.test(text)) candidates.push('rockbolt');
    if (/anchor cable|cable[- ]?bolt|锚索|索锚杆/i.test(text)) candidates.push('cable');
    if (/tie rod|formwork|form tie|拉杆/i.test(text)) candidates.push('tie');
    if (/mesh|网格|网片/i.test(text)) candidates.push('mesh');
    if (/rebar|reinforcing bars?|筋材|玻璃纤维筋|(?:gfrp|bfrp|cfrp)\s*筋/i.test(text)) candidates.push('rebar');
    const materials = ['gfrp', 'bfrp', 'cfrp'].filter((name) => new RegExp(name, 'i').test(text));
    if (candidates.length > 1 || materials.length > 1) return { value: text, status: 'unresolved', family: '', variant: '', model: '' };
    let family = candidates[0] || '';
    if ((family && family !== 'rebar' && materials.some((material) => material !== 'gfrp')) || /\bsteel\b|钢筋/i.test(text)) {
      return { value: text, status: 'unresolved', family: '', variant: '', model: '' };
    }
    const hasRebarVariant = /sand[- ]?coated|high[- ](?:performance|durability)|high performance durability|覆砂|喷砂|高耐久/i.test(text);
    const hasRockVariant = /general solid|hollow|self[- ]drilling|all[- ]thread|普通实心|通用实心|实心|中空|自钻|全螺纹/i.test(text);
    if (!family && hasRebarVariant) family = 'rebar';
    if (!family && hasRockVariant && previous.family === 'rockbolt') family = 'rockbolt';
    if (!family && /\bthreaded\b|螺纹/i.test(text) && previous.family === 'rebar') family = 'rebar';
    if ((!family || family === 'rebar') && /bfrp|basalt|玄武岩/i.test(text)) family = 'bfrp';
    if ((!family || family === 'rebar') && /cfrp|carbon|碳纤维/i.test(text)) family = 'cfrp';
    if (!family && /gfrp|glass fi(?:b|br)e?r|玻璃纤维|玻纤/i.test(text)) family = 'gfrp';
    if (!family) return null;
    const variants = [];
    if (family === 'rockbolt') {
      if (/general solid|solid|soil nail|普通实心|通用实心|实心|土钉/i.test(text)) variants.push('solid');
      if (/all[- ]thread|mgsl\d*|全螺纹/i.test(text)) variants.push('mining');
      if (/hollow|中空/i.test(text)) variants.push('hollow');
      if (/self[- ]drilling|自钻/i.test(text)) variants.push('drilling');
    } else if (family === 'rebar') {
      if (/sand[- ]?coated|覆砂|喷砂/i.test(text)) variants.push('sand');
      if (/high[- ](?:performance|durability)|high performance durability|高耐久/i.test(text)) variants.push('durable');
      if (/\bthreaded\b|螺纹/i.test(text)) variants.push('threaded');
    }
    const variant = variants.length === 1 ? variants[0] : '';
    const model = text.match(/\bMGSL\d+\b/i)?.[0].toUpperCase() || '';
    const status = family === 'gfrp' || ((family === 'rebar' || family === 'rockbolt') && !variant) ? 'unresolved' : 'known';
    return { value: text, family, variant, model, status };
  }

  function createDraft() {
    const values = {};
    fields.forEach((field) => { values[field.id] = { value: '', status: 'missing' }; });
    return { active: false, fields: values, pendingField: null, confirmed: false, revision: 0 };
  }

  function nextField(draft) {
    if (fields.find((field) => field.id === 'product')?.required && draft.fields.product.status === 'unresolved') return 'product';
    return fields.find((field) => field.required && ['missing', 'unresolved'].includes(draft.fields[field.id].status))?.id || null;
  }

  function finish(draft) {
    draft.pendingField = nextField(draft);
    return draft;
  }

  function start(draft) {
    return finish({ ...draft, active: true });
  }

  function fieldValue(id, value, previous = {}) {
    const text = clean(value);
    if (!text) return { value: '', status: 'missing' };
    if (isUnknown(text)) return { ...previous, value: previous.family ? previous.value : '', status: 'unknown' };
    if (id === 'product') return productFrom(text, previous) || { value: text, status: 'unresolved', family: '', variant: '', model: '' };
    if (id === 'quantity' && (!isQuantity(text) || /\bor\b|或者|或|\//i.test(text) || Number(text.match(/[\d,.]+/)?.[0].replaceAll(',', '')) <= 0)) return { value: text, status: 'unresolved' };
    if (id === 'dimensions' && (!isDimension(text) || /\bor\b|或者|或|\//i.test(text))) return { value: text, status: 'unresolved' };
    return { value: text, status: 'known' };
  }

  function edit(draft, id, value) {
    if (!fields.some((field) => field.id === id)) return draft;
    const replacement = fieldValue(id, value, draft.fields[id]);
    if (JSON.stringify(replacement) === JSON.stringify(draft.fields[id])) return draft;
    return finish({ ...draft, fields: { ...draft.fields, [id]: replacement }, confirmed: false, revision: draft.revision + 1 });
  }

  function markUnknown(draft, id) {
    return edit(draft, id, 'unknown');
  }

  function extract(message, draft) {
    const text = message.normalize('NFKC');
    const labelPattern = /(?:^|[;；\n,.，。])\s*(application|project use|product(?: family)?|diameter|dimensions?|quantity|destination|requested delivery(?: date| timeframe)?|delivery(?: date| timeframe)?|company|contact|应用场景|项目用途|用途|产品(?:类别)?|直径|尺寸|数量|目的地|交付目的地|期望交付(?:日期)?|期望交期|交期|公司|联系方式)\s*[:：]\s*/gi;
    const labels = [...text.matchAll(labelPattern)];
    // Never mine a labelled field for a different field (e.g. 6 m rod length is not an order quantity).
    const natural = labels.length ? text.slice(0, labels[0].index) : text;
    const result = {};
    const product = productFrom(natural, draft.fields.product);
    if (product) result.product = product;
    const dimensions = [...natural.matchAll(/\b\d+(?:\.\d+)?(?:\s*(?:x|×|\/|or|或)\s*\d+(?:\.\d+)?){0,2}\s*(?:mm\b|cm\b|millimet(?:er|re)s?\b|毫米|厘米)/gi)];
    if (dimensions.length === 1) result.dimensions = fieldValue('dimensions', dimensions[0][0]);
    else if (dimensions.length > 1) result.dimensions = { value: dimensions.map((match) => match[0]).join(' / '), status: 'unresolved' };
    const quantities = [...natural.matchAll(/(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?\s*(?:metres?\b|meters?\b|m\b|pieces?\b|pcs\b|tonnes?\b|tons?\b|t\b|米(?!米)|根|支|件|吨|噸)/gi)];
    if (quantities.length === 1) result.quantity = fieldValue('quantity', quantities[0][0]);
    else if (quantities.length > 1) result.quantity = { value: quantities.map((match) => match[0]).join(' / '), status: 'unresolved' };

    // Explicit labels take precedence over conservative free-text extraction.
    const labelIds = { application: 'application', 'project use': 'application', product: 'product', 'product family': 'product', diameter: 'dimensions', dimension: 'dimensions', dimensions: 'dimensions', quantity: 'quantity', destination: 'destination', company: 'company', contact: 'contact', 应用场景: 'application', 项目用途: 'application', 用途: 'application', 产品: 'product', 产品类别: 'product', 直径: 'dimensions', 尺寸: 'dimensions', 数量: 'quantity', 目的地: 'destination', 交付目的地: 'destination', 公司: 'company', 联系方式: 'contact' };
    labels.forEach((match, index) => {
      const id = labelIds[match[1].toLowerCase()] || 'delivery';
      const value = text.slice(match.index + match[0].length, labels[index + 1]?.index ?? text.length);
      result[id] = fieldValue(id, value, draft.fields[id]);
    });

    if (!result.delivery) {
      const date = natural.match(/\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(?:\d{1,2},?\s+)?\d{4}\b|\b\d{4}-\d{1,2}-\d{1,2}\b|\b(?:in\s+)?(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|twelve)\s+(?:weeks?|months?|days?)\b|\bnext (?:week|month)\b|\d{4}年\d{1,2}月(?:\d{1,2}[日号])?|(?:下个月|下月|下周)|(?:[一二三四五六七八九十两\d]+)(?:个)?(?:星期|周|月|天)(?:后|内)/i);
      if (date) result.delivery = fieldValue('delivery', date[0]);
    }
    if (!result.destination) {
      const destination = natural.match(/(?:\b(?:deliver|delivery|ship) to\s+)([^;.。；\n]+)|\bin\s+([A-Z][^;.。；\n]+)|(?:目的地(?:是|为)|交付到|运往|送到)([^;.。；\n]+)/);
      const value = destination && (destination[1] || destination[2] || destination[3]);
      if (value && !/\d{4}|\b(?:weeks?|months?|days?)\b/.test(value)) result.destination = fieldValue('destination', value);
    }
    if (!result.application) {
      const application = natural.match(/\bfor\s+(?:(?:a|an|the)\s+)?(.+?)(?=\s+in\s+|[;.。；\n]|$)|(?:用于|应用于)(.+?)(?=,|[;.。；\n]|$)/i);
      const value = application && (application[1] || application[2]);
      if (value && !isQuantity(value) && !/^(?:human|staff|sales) review$/i.test(value)) result.application = fieldValue('application', value);
    }
    return result;
  }

  function applyMessage(draft, message) {
    if (!draft.active) return { draft, handled: false, changed: [] };
    const text = clean(message);
    // Questions never become customer requirements, dimensions, or requested quantities.
    if (isQuestion(text)) return { draft, handled: false, changed: [] };
    if (isUnknown(text) && draft.pendingField) return { draft: markUnknown(draft, draft.pendingField), handled: true, changed: [draft.pendingField] };
    // A short length answer belongs to the dimension question, not the order quantity.
    if (draft.pendingField === 'dimensions' && /^[\d.,\sx×/]+(?:mm|cm|m|millimet(?:er|re)s?|centimet(?:er|re)s?|met(?:er|re)s?|inches?|inch|ft|feet|毫米|厘米|米|英寸|英尺)$/i.test(text)) {
      return { draft: edit(draft, 'dimensions', text), handled: true, changed: ['dimensions'] };
    }
    const extracted = extract(String(message), draft);
    const ids = Object.keys(extracted);
    if (!ids.length && draft.pendingField && text && !isStartRequest(text)) {
      const id = draft.pendingField;
      extracted[id] = fieldValue(id, text, draft.fields[id]);
    }
    const changed = Object.keys(extracted).filter((id) => JSON.stringify(extracted[id]) !== JSON.stringify(draft.fields[id]));
    if (!changed.length) return { draft, handled: Object.keys(extracted).length > 0 || isStartRequest(text), changed };
    const next = finish({ ...draft, fields: { ...draft.fields, ...extracted }, confirmed: false, revision: draft.revision + 1 });
    return { draft: next, handled: true, changed };
  }

  function valueText(field, locale = 'en') {
    const lang = language(locale);
    if (!field.family) return field.value;
    return [variantLabels[field.variant]?.[lang], familyLabels[field.family]?.[lang], field.model].filter(Boolean).join(' ');
  }

  function gaps(draft) {
    return fields.filter((field) => field.required && draft.fields[field.id].status !== 'known').map((field) => field.id);
  }

  function question(draft, locale = 'en') {
    const lang = language(locale);
    const id = draft.pendingField;
    if (!id) return lang === 'zh' ? '请查看下方询价草稿，修改后确认。标为未知的信息仍需补充。' : 'Review and edit the enquiry draft below, then confirm it. Any unknown details remain open for follow-up.';
    if (id === 'product' && draft.fields.product.status === 'unresolved') {
      const family = draft.fields.product.family;
      if (family === 'rockbolt') return lang === 'zh' ? '您需要普通实心、MGSL 全螺纹、中空，还是自钻式锚杆？不确定时可以选择“未知”。' : 'Which rockbolt variant: general solid, MGSL all-thread, hollow, or self-drilling? You can mark it unknown.';
      if (family === 'rebar') return lang === 'zh' ? '您需要覆砂、螺纹，还是高耐久 GFRP 筋材？不确定时可以选择“未知”。' : 'Which GFRP rebar variant: sand-coated, threaded, or high-durability? You can mark it unknown.';
      return lang === 'zh' ? '请明确一个产品类别和型号，或标为未知。不同产品将单独整理询价。' : 'Please identify one product family and variant, or mark it unknown. Use a separate draft for each product.';
    }
    return fields.find((field) => field.id === id).question[lang];
  }

  function confirm(draft) {
    const hasDetails = fields.some((field) => draft.fields[field.id].status !== 'missing');
    return hasDetails ? { ...draft, confirmed: true } : draft;
  }

  function toText(draft, locale = 'en') {
    const lang = language(locale);
    const lines = [lang === 'zh' ? 'Oceanpower 询价草稿 — 试点演示' : 'Oceanpower RFQ draft — pilot demonstration'];
    lines.push(lang === 'zh' ? '仅在当前页面临时保存。尚未发送给销售。' : 'Held temporarily on this page. Nothing has been sent to sales.');
    lines.push(draft.confirmed ? (lang === 'zh' ? '访客已确认草稿，供工作人员后续审核。' : 'Visitor confirmed the draft for subsequent staff review.') : (lang === 'zh' ? '访客尚未确认草稿。' : 'Draft not yet confirmed by the visitor.'));
    for (const field of fields) {
      const item = draft.fields[field.id];
      if (!field.required && item.status === 'missing') continue;
      const status = { missing: lang === 'zh' ? '待补充' : 'Missing', unknown: lang === 'zh' ? '未知，待跟进' : 'Unknown; follow-up needed', unresolved: lang === 'zh' ? '需要澄清' : 'Needs clarification' }[item.status];
      lines.push(`${field.label[lang]}: ${[valueText(item, lang), status].filter(Boolean).join(' — ')}`);
    }
    lines.push(lang === 'zh' ? '日期为客户期望，并非交期承诺。本草稿不构成报价、工程认可或销售确认。' : 'Dates are customer requests, not delivery commitments. This draft is not a quotation, engineering approval, or sales confirmation.');
    return lines.join('\n');
  }

  return { fields, createDraft, start, edit, markUnknown, applyMessage, question, valueText, gaps, confirm, toText, isQuestion, isStartRequest };
});
