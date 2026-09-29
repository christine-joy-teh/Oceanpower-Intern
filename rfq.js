(function exposeRfqModule(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.OceanpowerRFQ = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  const FIELD_DEFINITIONS = Object.freeze([
    {
      key: 'application',
      required: true,
      label: { en: 'Application / project use', zh: '应用 / 项目用途' },
      question: {
        en: 'What is the application or project use?',
        zh: '该产品将用于什么应用或项目？',
      },
    },
    {
      key: 'productFamily',
      required: true,
      label: { en: 'Product family', zh: '产品系列' },
      question: {
        en: 'Which product family do you need: rebar, rockbolt, mesh, tie rod, or anchor cable?',
        zh: '您需要哪个产品系列：筋材、锚杆、网格、拉杆还是锚索？',
      },
    },
    {
      key: 'productVariant',
      required: false,
      label: { en: 'Product variant', zh: '产品型号 / 类型' },
      question: {
        en: 'Which product variant do you mean?',
        zh: '您指的是哪一种产品型号或类型？',
      },
    },
    {
      key: 'dimensions',
      required: true,
      label: { en: 'Diameter / dimensions', zh: '直径 / 尺寸' },
      question: {
        en: 'What diameter or dimensions do you require, including the unit?',
        zh: '所需直径或尺寸是多少？请包括单位。',
      },
    },
    {
      key: 'quantity',
      required: true,
      label: { en: 'Quantity', zh: '数量' },
      question: {
        en: 'What quantity do you require, including its unit (for example, metres, pieces, or tonnes)?',
        zh: '所需数量是多少？请包括单位（例如米、根、件或吨）。',
      },
    },
    {
      key: 'destination',
      required: true,
      label: { en: 'Destination', zh: '交付目的地' },
      question: {
        en: 'What is the delivery destination (city, country, or port)?',
        zh: '交付目的地是哪里（城市、国家或港口）？',
      },
    },
    {
      key: 'requestedDelivery',
      required: true,
      label: { en: 'Requested delivery', zh: '客户要求的交付时间' },
      question: {
        en: 'What delivery date or timeframe are you requesting? This will be recorded as a request, not a promise.',
        zh: '您希望的交付日期或时间范围是什么？这只会记录为客户要求，并非交付承诺。',
      },
    },
    {
      key: 'company',
      required: false,
      label: { en: 'Company (optional)', zh: '公司（可选）' },
      question: { en: '', zh: '' },
    },
    {
      key: 'contact',
      required: false,
      label: { en: 'Contact (optional)', zh: '联系人（可选）' },
      question: { en: '', zh: '' },
    },
  ]);

  const FIELD_KEYS = FIELD_DEFINITIONS.map(({ key }) => key);
  const UNKNOWN_PATTERN = /^(?:unknown|not sure|unsure|tbc|to be confirmed|not decided|i don'?t know|do not know|未知|不确定|待确认|不知道|尚未确定)[.!。！]?$/i;
  const RFQ_INTENT_PATTERN = /(?:prepare|start|build|create|need|want).{0,18}(?:enquiry|inquiry|rfq|quotation)|(?:enquiry|inquiry|rfq).{0,18}(?:draft|brief)|准备.{0,8}(?:询价|需求)|(?:询价|需求).{0,8}(?:草稿|信息)/i;
  const PRODUCT_QUESTION_PATTERN = /\?|？|^(?:what|which|how|can|does|do|is|are|tell me|show me)\b|(?:tensile|strength|modulus|specification|performance|price|产品|是什么|多少|能否|可以|规格|性能|强度|价格)/i;

  function createDraft() {
    return {
      application: '',
      productFamily: '',
      productVariant: '',
      dimensions: '',
      quantity: '',
      destination: '',
      requestedDelivery: '',
      company: '',
      contact: '',
      unknownFields: [],
      pendingField: null,
      status: 'idle',
      confirmed: false,
    };
  }

  function resetDraft(draft) {
    const empty = createDraft();
    Object.keys(empty).forEach((key) => {
      draft[key] = Array.isArray(empty[key]) ? [] : empty[key];
    });
    return draft;
  }

  function isUnknown(value) {
    return UNKNOWN_PATTERN.test(String(value || '').trim());
  }

  function isVariantRequired(draft) {
    return /rockbolt|gfrp rebar|玻璃纤维筋|锚杆/i.test(draft.productFamily || '');
  }

  function requiredFields(draft) {
    const fields = FIELD_DEFINITIONS.filter(({ required }) => required).map(({ key }) => key);
    if (isVariantRequired(draft)) fields.splice(2, 0, 'productVariant');
    return fields;
  }

  function setField(draft, key, value, options = {}) {
    if (!FIELD_KEYS.includes(key)) return draft;
    const cleaned = String(value || '').trim().replace(/[.;，。]+$/, '').trim();
    draft.confirmed = false;
    if (draft.status === 'confirmed') draft.status = 'collecting';
    draft.unknownFields = draft.unknownFields.filter((field) => field !== key);
    if (options.unknown || isUnknown(cleaned)) {
      draft[key] = '';
      if (!draft.unknownFields.includes(key)) draft.unknownFields.push(key);
    } else {
      draft[key] = cleaned;
    }
    return draft;
  }

  function normalizeProduct(text) {
    const lower = text.toLowerCase();
    if (/sand[- ]?coated|覆砂/.test(lower) && /(?:gfrp|glass|玻璃纤维).{0,12}(?:rebar|筋)/.test(lower)) {
      return { productFamily: 'GFRP rebar', productVariant: 'Sand-coated' };
    }
    if (/(?:gfrp|glass|玻璃纤维).{0,12}(?:rockbolt|rock bolt|锚杆)/.test(lower)) {
      const result = { productFamily: 'GFRP rockbolt' };
      if (/general solid|solid soil nail|普通实心|通用实心/.test(lower)) result.productVariant = 'General solid';
      else if (/mgsl|all[- ]?thread|mining|全螺纹|矿用/.test(lower)) result.productVariant = 'All-thread mining / tunnel';
      else if (/self[- ]?drilling|自钻/.test(lower)) result.productVariant = 'Self-drilling hollow';
      else if (/hollow|中空/.test(lower)) result.productVariant = 'Hollow';
      return result;
    }
    if (/(?:gfrp|glass|玻璃纤维).{0,12}(?:rebar|筋)/.test(lower)) return { productFamily: 'GFRP rebar' };
    if (/(?:bfrp|basalt|玄武岩).{0,12}(?:rebar|筋)/.test(lower)) return { productFamily: 'BFRP rebar' };
    if (/(?:cfrp|carbon|碳纤维).{0,12}(?:rebar|筋)/.test(lower)) return { productFamily: 'CFRP rebar' };
    if (/(?:anchor cable|锚索)/.test(lower)) return { productFamily: 'GFRP anchor cable' };
    if (/(?:tie rod|form tie|拉杆)/.test(lower)) return { productFamily: 'GFRP tie rod' };
    if (/(?:mesh|网格)/.test(lower)) return { productFamily: 'GFRP mesh' };
    if (/(?:rockbolt|rock bolt|锚杆)/.test(lower)) return { productFamily: 'GFRP rockbolt' };
    return {};
  }

  function normalizeVariant(text) {
    const lower = text.toLowerCase();
    if (/sand[- ]?coated|覆砂/.test(lower)) return 'Sand-coated';
    if (/general solid|solid soil nail|普通实心|通用实心/.test(lower)) return 'General solid';
    if (/mgsl|all[- ]?thread|mining|全螺纹|矿用/.test(lower)) return 'All-thread mining / tunnel';
    if (/self[- ]?drilling|自钻/.test(lower)) return 'Self-drilling hollow';
    if (/hollow|中空/.test(lower)) return 'Hollow';
    return String(text || '').trim();
  }

  function hasQuantityUnit(value) {
    return /(?:metres?|meters?|\bm\b|pieces?|\bpcs?\b|tonnes?|tons?|kilograms?|\bkg\b|米|根|件|吨|公斤)/i.test(value);
  }

  function hasDimensionUnit(value) {
    return /(?:mm|millimet(?:re|er)s?|cm|centimet(?:re|er)s?|毫米|厘米)/i.test(value);
  }

  function extractFields(text) {
    const values = {};
    const source = String(text || '').trim();
    const product = normalizeProduct(source);
    Object.assign(values, product);

    const dimensions = source.match(/(?:diameter|dia\.?|直径|尺寸)?\s*(\d+(?:\.\d+)?\s*(?:mm|millimet(?:re|er)s?|cm|centimet(?:re|er)s?|毫米|厘米))\b/i);
    if (dimensions) values.dimensions = dimensions[1].replace(/\s+/g, ' ').trim();

    const quantity = source.match(/((?:\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)\s*(?:metres?|meters?|\bm\b|pieces?|\bpcs?\b|tonnes?|tons?|kilograms?|\bkg\b|米|根|件|吨|公斤))/i);
    if (quantity) values.quantity = quantity[1].replace(/\s+/g, ' ').trim();

    const delivery = source.match(/(?:requested\s+delivery|delivery\s+(?:date|timeframe)|required\s+(?:date|by)|希望交付|要求交付|交付时间|交货时间)\s*[:：]?\s*([^.;。；]+)/i);
    if (delivery) values.requestedDelivery = delivery[1].trim();

    const destinationLabel = source.match(/(?:destination|deliver(?:y)?\s+to|ship\s+to|目的地|交付至|运往)\s*[:：]?\s*([^.;。；]+)/i);
    if (destinationLabel) values.destination = destinationLabel[1].trim();
    if (!values.destination) {
      const location = source.match(/\bin\s+([A-Z][A-Za-z' -]+,\s*[A-Z][A-Za-z' -]+?)(?=\.|,?\s*(?:requested|delivery|required)|$)/);
      if (location) values.destination = location[1].trim();
    }
    const destinationZh = source.match(/(?:位于|地点在|项目在)\s*([^，。；]+(?:，[^，。；]+)?)/);
    if (!values.destination && destinationZh) values.destination = destinationZh[1].trim();

    const applicationLabel = source.match(/(?:application|project\s+use|used?\s+for|用途|应用|项目用途)\s*[:：]?\s*([^.;。；]+)/i);
    if (applicationLabel) values.application = applicationLabel[1].trim();
    if (!values.application) {
      const application = source.match(/\bfor\s+(?:a|an|the)?\s*([^.;]+?)(?=\s+in\s+[A-Z][A-Za-z' -]+,|,?\s*(?:requested|delivery|required)|\.|$)/i);
      if (application) values.application = application[1].trim();
    }
    const applicationZh = source.match(/用于\s*([^，。；]+?)(?=项目(?:位于|在)|，|。|；|$)/);
    if (!values.application && applicationZh) values.application = applicationZh[1].trim();

    const company = source.match(/(?:company|公司)\s*[:：]\s*([^,.;，。；]+)/i);
    if (company) values.company = company[1].trim();
    const contact = source.match(/(?:contact|联系人)\s*[:：]\s*([^,.;，。；]+)/i);
    if (contact) values.contact = contact[1].trim();
    return values;
  }

  function assignPendingAnswer(draft, text) {
    const key = draft.pendingField;
    if (!key) return { applied: false };
    if (isUnknown(text)) {
      setField(draft, key, '', { unknown: true });
      return { applied: true, key };
    }

    const cleaned = String(text || '').trim();
    if (key === 'productFamily') {
      const product = normalizeProduct(cleaned);
      if (!product.productFamily) return { applied: false, clarification: true };
      setField(draft, 'productFamily', product.productFamily);
      if (product.productVariant) setField(draft, 'productVariant', product.productVariant);
      return { applied: true, key };
    }
    if (key === 'productVariant') {
      setField(draft, key, normalizeVariant(cleaned));
      return { applied: true, key };
    }
    if (key === 'dimensions' && !hasDimensionUnit(cleaned)) return { applied: false, clarification: true };
    if (key === 'quantity' && !hasQuantityUnit(cleaned)) return { applied: false, clarification: true };
    setField(draft, key, cleaned);
    return { applied: true, key };
  }

  function nextMissingField(draft) {
    return requiredFields(draft).find((key) => !draft[key] && !draft.unknownFields.includes(key)) || null;
  }

  function getUnresolvedFields(draft) {
    return requiredFields(draft).filter((key) => !draft[key] || draft.unknownFields.includes(key));
  }

  function questionFor(key, locale = 'en') {
    const field = FIELD_DEFINITIONS.find((item) => item.key === key);
    return field?.question[locale === 'zh' ? 'zh' : 'en'] || '';
  }

  function nextQuestion(draft, locale = 'en') {
    const key = nextMissingField(draft);
    draft.pendingField = key;
    return key ? questionFor(key, locale) : '';
  }

  function isProductQuestion(text) {
    const source = String(text || '').trim();
    if (!PRODUCT_QUESTION_PATTERN.test(source)) return false;
    if (/^(?:actually|change|update|correction|更正|改成|修改)/i.test(source)) return false;
    return Boolean(Object.keys(normalizeProduct(source)).length || /(?:frp|rebar|rockbolt|strength|product|catalog|筋|锚杆|产品|强度|目录)/i.test(source));
  }

  function processMessage(draft, message, locale = 'en') {
    const text = String(message || '').trim();
    if (!text) return { kind: 'empty', updatedFields: [], question: nextQuestion(draft, locale) };
    if (draft.status === 'idle') draft.status = 'collecting';

    if (isProductQuestion(text) && !/^(?:actually|change|update|correction|更正|改成|修改)/i.test(text)) {
      return { kind: 'product-question', updatedFields: [], question: nextQuestion(draft, locale) };
    }

    const extracted = extractFields(text);
    const updatedFields = [];
    Object.entries(extracted).forEach(([key, value]) => {
      setField(draft, key, value);
      updatedFields.push(key);
    });

    if (!updatedFields.length && draft.pendingField) {
      const pending = assignPendingAnswer(draft, text);
      if (pending.applied) updatedFields.push(pending.key);
      else if (pending.clarification) {
        const clarification = locale === 'zh'
          ? `请为${FIELD_DEFINITIONS.find((field) => field.key === draft.pendingField)?.label.zh || '此项'}提供数值和单位，或回复“不确定”。`
          : `Please include a value and unit for ${FIELD_DEFINITIONS.find((field) => field.key === draft.pendingField)?.label.en.toLowerCase() || 'this field'}, or reply “unknown”.`;
        return { kind: 'clarification', updatedFields, question: clarification };
      }
    }

    const question = nextQuestion(draft, locale);
    return { kind: 'rfq-update', updatedFields, question };
  }

  function fieldDisplay(draft, key, locale) {
    if (draft.unknownFields.includes(key)) return locale === 'zh' ? '不确定' : 'Unknown';
    return draft[key] || (locale === 'zh' ? '未提供' : 'Not provided');
  }

  function formatDraft(draft, locale = 'en') {
    const language = locale === 'zh' ? 'zh' : 'en';
    const title = language === 'zh' ? 'Oceanpower 询价草稿（演示）' : 'Oceanpower enquiry draft (demonstration)';
    const lines = [title];
    FIELD_DEFINITIONS.forEach((field) => {
      lines.push(`${field.label[language]}: ${fieldDisplay(draft, field.key, language)}`);
    });
    lines.push('');
    lines.push(language === 'zh'
      ? '状态：供工作人员审核；尚未发送。客户要求的交付时间并非 Oceanpower 的交付承诺。'
      : 'Status: for staff review; nothing has been sent. Requested delivery is a customer request, not an Oceanpower delivery promise.');
    return lines.join('\n');
  }

  function confirmDraft(draft) {
    draft.status = 'confirmed';
    draft.confirmed = true;
    draft.pendingField = null;
    return draft;
  }

  return {
    FIELD_DEFINITIONS,
    createDraft,
    resetDraft,
    setField,
    extractFields,
    processMessage,
    nextMissingField,
    nextQuestion,
    getUnresolvedFields,
    formatDraft,
    confirmDraft,
    isProductQuestion,
    isRfqIntent: (text) => RFQ_INTENT_PATTERN.test(String(text || '')),
  };
}));
