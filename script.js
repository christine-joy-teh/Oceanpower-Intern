const header = document.querySelector('.site-header');
const menuToggle = document.querySelector('.menu-toggle');
const chatPanel = document.querySelector('.chat-panel');
const chatLauncher = document.querySelector('.chat-launcher');
const chatClose = document.querySelector('.chat-close');
const chatReset = document.querySelector('.chat-reset');
const chatStream = document.querySelector('.chat-stream');
const chatForm = document.querySelector('.chat-form');
const chatInput = chatForm?.querySelector('input');
const chatMode = document.querySelector('.chat-mode');
const languageToggle = document.querySelector('.language-toggle');
const rfqPanel = document.querySelector('.rfq-draft');
const rfqFields = document.querySelector('.rfq-fields');
const rfqStatus = document.querySelector('.rfq-status');
const rfqGaps = document.querySelector('.rfq-gaps');
const rfqCopy = document.querySelector('.rfq-copy');
const rfqConfirm = document.querySelector('.rfq-confirm');
const rfqSendNote = document.querySelector('.rfq-send-note');

const state = {
  history: [], pending: false, mode: 'catalogue-demo', serviceIssue: null, lastFocused: null,
  rfq: OceanpowerRFQ.createDraft(),
};

const copy = {
  en: {
    nav: ['Products', 'Performance', 'Applications', 'Company'],
    heroTitle: 'Built for the <em>elements.</em>',
    heroText: 'Advanced fiber-reinforced polymer reinforcement for infrastructure that cannot afford corrosion, weight, or magnetic interference.',
    prepare: 'Prepare enquiry', products: 'Reinforcement, re-engineered.', company: 'Materials science for the real world.',
    intelligence: 'A faster path from project brief to the right reinforcement.', contact: "Let's reinforce<br />what's next.",
    welcome: 'Welcome to Oceanpower. I can answer catalogue-based questions about GFRP, BFRP, CFRP and rockbolt systems, or help prepare an enquiry draft for staff review.',
    placeholder: 'Ask about a product or your project...', quick: ['Tunnel project', 'GFRP data', 'Prepare enquiry'],
    serviceLive: 'Live AI · draft knowledge', serviceDemo: 'Catalogue demo', serviceFallback: 'Catalogue fallback', serviceConfig: 'Catalogue demo · configuration issue', serviceOffline: 'Service unavailable',
    sourceDraft: 'Catalogue references · draft', sourceKnowledge: 'Pilot knowledge · draft', sourceProvider: 'Provider references · not verified', sourceDefault: 'Sources',
    waiting: 'Checking Oceanpower draft material', error: 'I could not reach the knowledge service. Please try again, or email info@jsopmaterial.com.',
    newChat: 'Reset chat', disclaimer: 'Catalogue guidance and enquiry drafting only. Final specifications, quotations, and delivery require human review.',
    rfqKicker: 'PILOT RFQ', rfqTitle: 'Enquiry draft', rfqIntro: 'Edit any field. Provisional requirements are kept in this browser tab only.',
    unknown: 'Mark unknown', unmarkUnknown: 'Clear unknown', copyEnquiry: 'Copy enquiry', copied: 'Copied', confirm: 'Confirm for staff review',
    inProgress: 'In progress', complete: 'Draft complete', ready: 'Ready for staff review', nothingSent: 'Nothing has been sent to Oceanpower.',
    readyNotice: 'Ready for staff review. Nothing has been sent to Oceanpower.', missing: 'Missing or unresolved', noGaps: 'All provisional fields are recorded. You can still edit them.',
    startRfq: 'I’ll prepare a provisional enquiry draft. You can answer naturally, provide several details at once, or reply “unknown” to any question.',
    updated: 'I updated the enquiry draft.', captured: 'The provisional fields are recorded. Please review or edit the draft before confirming it for staff review.',
    continueRfq: 'Continuing the enquiry:', confirmed: 'The draft is marked ready for staff review. Nothing has been sent, received, reviewed, or approved.',
  },
  zh: {
    nav: ['产品中心', '性能参数', '应用领域', '关于我们'],
    heroTitle: '为严苛环境<br /><em>而生。</em>', heroText: '面向严苛基础设施的高性能纤维增强聚合物筋材，解决腐蚀、重量和磁干扰难题。',
    prepare: '准备询价', products: '重新定义工程加固。', company: '材料科学，服务真实工程。',
    intelligence: '从项目需求到合适筋材，更快一步。', contact: '让我们一起加固<br />未来。',
    welcome: '欢迎来到 Oceanpower。我可以根据产品目录回答 GFRP、BFRP、CFRP 和锚杆系统的问题，或整理询价草稿供工作人员审核。',
    placeholder: '询问产品或输入项目需求...', quick: ['隧道项目', 'GFRP 数据', '准备询价'],
    serviceLive: '实时 AI · 草稿知识', serviceDemo: '目录演示模式', serviceFallback: '目录备用模式', serviceConfig: '目录演示 · 配置问题', serviceOffline: '服务暂不可用',
    sourceDraft: '目录参考 · 草稿', sourceKnowledge: '试点知识 · 草稿', sourceProvider: '模型服务参考 · 未核验', sourceDefault: '参考资料',
    waiting: '正在查询 Oceanpower 草稿资料', error: '暂时无法连接知识服务。请重试，或发送邮件至 info@jsopmaterial.com。',
    newChat: '重置对话', disclaimer: '仅提供目录参考和询价草稿。最终规格、报价和交付时间须由工作人员确认。',
    rfqKicker: '询价试点', rfqTitle: '询价草稿', rfqIntro: '每个字段都可编辑。临时需求只保留在当前浏览器标签页中。',
    unknown: '标记为不确定', unmarkUnknown: '取消不确定', copyEnquiry: '复制询价', copied: '已复制', confirm: '确认供工作人员审核',
    inProgress: '整理中', complete: '草稿完整', ready: '可供工作人员审核', nothingSent: '尚未向 Oceanpower 发送任何信息。',
    readyNotice: '已准备供工作人员审核，但尚未向 Oceanpower 发送。', missing: '缺失或未确定', noGaps: '暂定字段均已记录，您仍可继续编辑。',
    startRfq: '我会整理一份暂定询价草稿。您可以自然描述、一次提供多个信息，或对任何问题回复“不确定”。',
    updated: '询价草稿已更新。', captured: '暂定字段均已记录。请在确认供工作人员审核前检查或编辑草稿。',
    continueRfq: '继续整理询价：', confirmed: '草稿已标记为可供工作人员审核。信息尚未发送、接收、审核或批准。',
  },
};

const scenarioCopy = {
  engineer: { en: 'I am designing a metro tunnel in Germany. Which FRP product should I consider, and what technical data is available?', zh: '我正在为德国的地铁隧道做设计。应该考虑哪种 FRP 产品？有哪些技术数据？' },
  contractor: { en: 'We are building a coastal bridge in the Middle East and need corrosion-resistant reinforcement. Help me prepare an RFQ.', zh: '我们正在中东建设沿海桥梁，需要耐腐蚀加固材料。请帮我准备询价。' },
  distributor: { en: 'I distribute construction materials in Southeast Asia. What FRP products can Oceanpower supply?', zh: '我在东南亚经销建筑材料。Oceanpower 可以供应哪些 FRP 产品？' },
};

const currentLanguage = () => document.documentElement.lang === 'zh-CN' ? 'zh' : 'en';
const uiCopy = () => copy[currentLanguage()];
const rfqIsActive = () => state.rfq.status !== 'idle';

menuToggle?.addEventListener('click', () => {
  const open = header.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.textContent = open ? 'Close' : 'Menu';
});

document.querySelectorAll('nav a').forEach((link) => link.addEventListener('click', () => {
  header.classList.remove('open');
  menuToggle?.setAttribute('aria-expanded', 'false');
  if (menuToggle) menuToggle.textContent = 'Menu';
}));

function addMessage(text, type, options = {}) {
  const wrapper = document.createElement('div');
  wrapper.className = `${type}-message`;
  wrapper.textContent = text;
  if (options.sources?.length) {
    const sources = document.createElement('div');
    sources.className = 'message-sources';
    const heading = document.createElement('span');
    heading.textContent = options.sourceStatus === 'provider-reported-unverified' ? uiCopy().sourceProvider
      : options.sourceStatus === 'draft-knowledge-reference' ? uiCopy().sourceKnowledge
        : options.sourceStatus === 'catalogue-reference-draft' ? uiCopy().sourceDraft : uiCopy().sourceDefault;
    sources.append(heading);
    options.sources.forEach((source) => {
      const item = document.createElement('small');
      item.textContent = `${source.label}${source.detail ? ` — ${source.detail}` : ''}`;
      sources.append(item);
    });
    wrapper.append(sources);
  }
  if (options.notice) {
    const notice = document.createElement('small');
    notice.className = 'message-notice';
    notice.textContent = options.notice;
    wrapper.append(notice);
  }
  chatStream.append(wrapper);
  chatStream.scrollTop = chatStream.scrollHeight;
  return wrapper;
}

function setPending(pending) {
  state.pending = pending;
  chatStream.setAttribute('aria-busy', String(pending));
  if (chatInput) chatInput.disabled = pending;
  const button = chatForm?.querySelector('button');
  if (button) button.disabled = pending;
}

function addWaitingMessage() {
  const element = document.createElement('div');
  element.className = 'bot-message chat-waiting';
  element.innerHTML = `<span></span><span></span><span></span><small>${uiCopy().waiting}</small>`;
  chatStream.append(element);
  chatStream.scrollTop = chatStream.scrollHeight;
  return element;
}

async function askAssistant(message, options = {}) {
  if (!message || state.pending) return;
  if (options.displayUser !== false) addMessage(message, 'user');
  const previousHistory = state.history.slice();
  state.history.push({ role: 'user', content: message });
  setPending(true);
  const waiting = addWaitingMessage();
  try {
    const response = await fetch('/api/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history: previousHistory, locale: currentLanguage() }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
    waiting.remove();
    const notice = [data.notice, data.citationNotice].filter(Boolean).join(' ');
    addMessage(data.answer, 'bot', { sources: data.sources, sourceStatus: data.sourceStatus, notice });
    if (data.nextQuestion) addMessage(data.nextQuestion, 'bot');
    state.history.push({ role: 'assistant', content: [data.answer, data.nextQuestion].filter(Boolean).join('\n') });
    state.mode = data.mode || state.mode;
    state.serviceIssue = data.serviceIssue || null;
    updateModeLabel();
    if (options.resumeQuestion && rfqIsActive()) addMessage(`${uiCopy().continueRfq} ${options.resumeQuestion}`, 'bot');
  } catch (error) {
    waiting.remove();
    addMessage(uiCopy().error, 'bot').classList.add('message-error');
    console.error('[Oceanpower chat]', error);
    state.mode = 'unavailable';
    state.serviceIssue = null;
    updateModeLabel();
    if (options.resumeQuestion && rfqIsActive()) addMessage(`${uiCopy().continueRfq} ${options.resumeQuestion}`, 'bot');
  } finally {
    setPending(false);
    chatInput?.focus();
  }
}

function openChat() {
  state.lastFocused = document.activeElement;
  chatPanel.classList.add('open');
  chatPanel.setAttribute('aria-hidden', 'false');
  chatInput?.focus();
}

function closeChat() {
  chatPanel.classList.remove('open');
  chatPanel.setAttribute('aria-hidden', 'true');
  if (state.lastFocused instanceof HTMLElement) state.lastFocused.focus();
}

function draftHasData() {
  return OceanpowerRFQ.FIELD_DEFINITIONS.some(({ key }) => state.rfq[key]) || state.rfq.unknownFields.length > 0;
}

function renderRfqSummary() {
  const active = rfqIsActive();
  rfqPanel.hidden = !active;
  chatPanel.classList.toggle('rfq-active', active);
  if (!active) return;
  const locale = currentLanguage();
  const language = uiCopy();
  document.querySelector('.rfq-kicker').textContent = language.rfqKicker;
  document.querySelector('#rfq-draft-title').textContent = language.rfqTitle;
  document.querySelector('.rfq-intro').textContent = language.rfqIntro;
  rfqCopy.textContent = language.copyEnquiry;
  rfqConfirm.textContent = language.confirm;
  rfqConfirm.disabled = !draftHasData();
  rfqFields.innerHTML = '';
  OceanpowerRFQ.FIELD_DEFINITIONS.forEach((definition) => {
    const unknown = state.rfq.unknownFields.includes(definition.key);
    const row = document.createElement('div');
    row.className = 'rfq-field';
    const label = document.createElement('label');
    const inputId = `rfq-${definition.key}`;
    label.htmlFor = inputId;
    label.textContent = definition.label[locale];
    const inputRow = document.createElement('div');
    inputRow.className = 'rfq-input-row';
    const input = document.createElement('input');
    input.id = inputId;
    input.dataset.rfqField = definition.key;
    input.value = unknown ? '' : state.rfq[definition.key];
    input.placeholder = unknown ? (locale === 'zh' ? '不确定' : 'Unknown') : '';
    input.setAttribute('aria-invalid', String(unknown));
    input.addEventListener('change', () => {
      OceanpowerRFQ.setField(state.rfq, definition.key, input.value);
      OceanpowerRFQ.nextQuestion(state.rfq, locale);
      renderRfqSummary();
    });
    const unknownButton = document.createElement('button');
    unknownButton.type = 'button';
    unknownButton.className = 'rfq-unknown-toggle';
    unknownButton.textContent = '?';
    unknownButton.setAttribute('aria-label', unknown ? language.unmarkUnknown : language.unknown);
    unknownButton.setAttribute('aria-pressed', String(unknown));
    unknownButton.addEventListener('click', () => {
      if (unknown) OceanpowerRFQ.setField(state.rfq, definition.key, '');
      else OceanpowerRFQ.setField(state.rfq, definition.key, '', { unknown: true });
      OceanpowerRFQ.nextQuestion(state.rfq, locale);
      renderRfqSummary();
    });
    inputRow.append(input, unknownButton);
    row.append(label, inputRow);
    rfqFields.append(row);
  });
  const unresolved = OceanpowerRFQ.getUnresolvedFields(state.rfq);
  const labels = unresolved.map((key) => OceanpowerRFQ.FIELD_DEFINITIONS.find((field) => field.key === key)?.label[locale]).filter(Boolean);
  rfqGaps.textContent = labels.length ? `${language.missing}: ${labels.join(' · ')}` : language.noGaps;
  rfqStatus.classList.toggle('is-ready', state.rfq.confirmed);
  rfqStatus.textContent = state.rfq.confirmed ? language.ready : labels.length ? language.inProgress : language.complete;
  rfqSendNote.classList.toggle('is-ready', state.rfq.confirmed);
  rfqSendNote.textContent = state.rfq.confirmed ? language.readyNotice : language.nothingSent;
}

function startEnquiry() {
  openChat();
  if (!rfqIsActive()) {
    state.rfq.status = 'collecting';
    addMessage(uiCopy().startRfq, 'bot');
    addMessage(OceanpowerRFQ.nextQuestion(state.rfq, currentLanguage()), 'bot');
  }
  renderRfqSummary();
}

function resetChat() {
  state.history = [];
  OceanpowerRFQ.resetDraft(state.rfq);
  chatStream.innerHTML = '';
  renderRfqSummary();
  addMessage(uiCopy().welcome, 'bot');
  const quickReplies = document.createElement('div');
  quickReplies.className = 'quick-replies';
  const prompts = currentLanguage() === 'zh'
    ? ['我正在做隧道项目，应该考虑哪种 FRP 产品？', '请提供 GFRP 性能数据']
    : ['Which FRP product should I consider for a tunnel?', 'Show me GFRP performance data'];
  uiCopy().quick.forEach((label, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    if (index === 2) button.dataset.rfqStart = '';
    else button.dataset.prompt = prompts[index];
    quickReplies.append(button);
  });
  chatStream.append(quickReplies);
  bindActionButtons(quickReplies);
  chatInput?.focus();
}

function handleRfqMessage(message) {
  addMessage(message, 'user');
  const result = OceanpowerRFQ.processMessage(state.rfq, message, currentLanguage());
  renderRfqSummary();
  if (result.kind === 'product-question') {
    askAssistant(message, { displayUser: false, resumeQuestion: result.question });
    return;
  }
  if (result.kind === 'clarification') {
    addMessage(result.question, 'bot');
    return;
  }
  if (result.updatedFields.length) addMessage(uiCopy().updated, 'bot');
  if (result.question) addMessage(result.question, 'bot');
  else addMessage(uiCopy().captured, 'bot');
}

function handleMessage(message) {
  if (!message || state.pending) return;
  if (rfqIsActive()) return handleRfqMessage(message);
  if (OceanpowerRFQ.isRfqIntent(message)) {
    addMessage(message, 'user');
    state.rfq.status = 'collecting';
    addMessage(uiCopy().startRfq, 'bot');
    const result = OceanpowerRFQ.processMessage(state.rfq, message, currentLanguage());
    renderRfqSummary();
    if (result.question) addMessage(result.question, 'bot');
    return;
  }
  askAssistant(message);
}

function bindActionButtons(root = document) {
  root.querySelectorAll('[data-prompt],[data-chat-prompt]').forEach((button) => {
    if (button.dataset.chatBound) return;
    button.dataset.chatBound = 'true';
    button.addEventListener('click', () => {
      openChat();
      handleMessage(button.dataset.prompt || button.dataset.chatPrompt);
    });
  });
  root.querySelectorAll('[data-rfq-start]').forEach((button) => {
    if (button.dataset.rfqBound) return;
    button.dataset.rfqBound = 'true';
    button.addEventListener('click', startEnquiry);
  });
}

function updateModeLabel() {
  if (!chatMode) return;
  if (state.mode === 'unavailable') chatMode.textContent = uiCopy().serviceOffline;
  else if (state.mode === 'knowledge-base') chatMode.textContent = uiCopy().serviceLive;
  else if (state.serviceIssue === 'configuration') chatMode.textContent = uiCopy().serviceConfig;
  else if (state.serviceIssue === 'provider-fallback') chatMode.textContent = uiCopy().serviceFallback;
  else chatMode.textContent = uiCopy().serviceDemo;
}

async function checkService() {
  try {
    const response = await fetch('/api/health', { cache: 'no-store' });
    if (!response.ok) throw new Error('Health check failed');
    const data = await response.json();
    state.mode = data.mode;
    state.serviceIssue = data.serviceIssue || null;
    updateModeLabel();
  } catch {
    state.mode = 'unavailable';
    if (chatMode) chatMode.textContent = uiCopy().serviceOffline;
  }
}

async function copyDraft() {
  const draftText = OceanpowerRFQ.formatDraft(state.rfq, currentLanguage());
  try {
    await navigator.clipboard.writeText(draftText);
  } catch {
    const temporary = document.createElement('textarea');
    temporary.value = draftText;
    temporary.setAttribute('readonly', '');
    temporary.style.position = 'fixed';
    temporary.style.opacity = '0';
    document.body.append(temporary);
    temporary.select();
    document.execCommand('copy');
    temporary.remove();
  }
  rfqCopy.textContent = uiCopy().copied;
  window.setTimeout(() => { rfqCopy.textContent = uiCopy().copyEnquiry; }, 1400);
}

function confirmRfq() {
  if (!draftHasData()) return;
  OceanpowerRFQ.confirmDraft(state.rfq);
  renderRfqSummary();
  addMessage(uiCopy().confirmed, 'bot');
}

chatLauncher?.addEventListener('click', openChat);
chatClose?.addEventListener('click', closeChat);
chatReset?.addEventListener('click', resetChat);
rfqCopy?.addEventListener('click', copyDraft);
rfqConfirm?.addEventListener('click', confirmRfq);
chatForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const value = chatInput.value.trim();
  if (!value) return;
  chatInput.value = '';
  handleMessage(value);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && chatPanel.classList.contains('open')) closeChat();
});

function setLanguage(language) {
  const content = copy[language];
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  document.querySelectorAll('nav a').forEach((link, index) => { link.textContent = content.nav[index]; });
  document.querySelector('.hero h1').innerHTML = content.heroTitle;
  document.querySelector('.hero-text').textContent = content.heroText;
  document.querySelectorAll('[data-rfq-start]').forEach((button) => {
    const textNode = [...button.childNodes].find((node) => node.nodeType === Node.TEXT_NODE);
    if (textNode) textNode.textContent = `${content.prepare} `;
  });
  document.querySelector('.products .section-head h2').textContent = content.products;
  document.querySelector('.intro-grid h2').textContent = content.company;
  document.querySelector('.sales-suite-heading h2').textContent = content.intelligence;
  document.querySelector('.contact h2').innerHTML = content.contact;
  languageToggle.textContent = language === 'zh' ? 'EN' : '中文';
  if (chatInput) chatInput.placeholder = content.placeholder;
  if (chatReset) chatReset.textContent = content.newChat;
  const disclaimer = document.querySelector('.chat-disclaimer');
  if (disclaimer) disclaimer.textContent = content.disclaimer;
  localStorage.setItem('oceanpower-language', language);
  updateModeLabel();
  renderRfqSummary();
}

const savedLanguage = localStorage.getItem('oceanpower-language') === 'zh' ? 'zh' : 'en';
setLanguage(savedLanguage);
resetChat();
languageToggle?.addEventListener('click', () => setLanguage(currentLanguage() === 'zh' ? 'en' : 'zh'));

document.querySelectorAll('[data-scenario]').forEach((button) => button.addEventListener('click', () => {
  const scenario = scenarioCopy[button.dataset.scenario];
  if (scenario) {
    openChat();
    handleMessage(scenario[currentLanguage()]);
  }
}));

bindActionButtons();
checkService();
