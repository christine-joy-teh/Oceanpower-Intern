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

const state = { history: [], pending: false, mode: 'catalogue-demo', serviceIssue: null, lastFocused: null };

const copy = {
  en: {
    nav: ['Products', 'Performance', 'Applications', 'Company'],
    heroTitle: 'Built for the <em>elements.</em>',
    heroText: 'Advanced fiber-reinforced polymer reinforcement for infrastructure that cannot afford corrosion, weight, or magnetic interference.',
    quote: 'Request a quote', products: 'Reinforcement, re-engineered.', company: 'Materials science for the real world.',
    intelligence: 'A faster path from project brief to the right reinforcement.', contact: "Let's reinforce<br />what's next.",
    welcome: 'Welcome to Oceanpower. I can answer catalogue-based questions about GFRP, BFRP, CFRP and rockbolt systems, or help prepare an RFQ for human review.',
    placeholder: 'Ask about your project...', quick: ['Tunnel project', 'GFRP data', 'Prepare an RFQ'],
    serviceLive: 'Live AI · draft knowledge', serviceDemo: 'Catalogue demo', serviceFallback: 'Catalogue fallback', serviceConfig: 'Catalogue demo · configuration issue', serviceOffline: 'Service unavailable',
    sourceDraft: 'Catalogue references · draft', sourceKnowledge: 'Pilot knowledge · draft', sourceProvider: 'Provider references · not verified', sourceDefault: 'Sources',
    waiting: 'Checking approved Oceanpower material',
    error: 'I could not reach the knowledge service. Please try again, or email info@jsopmaterial.com.',
    newChat: 'New chat',
    disclaimer: 'AI-generated catalogue guidance. An Oceanpower engineer must confirm final specifications and quotations.',
  },
  zh: {
    nav: ['产品中心', '性能参数', '应用领域', '关于我们'],
    heroTitle: '为严苛环境<br /><em>而生。</em>', heroText: '面向严苛基础设施的高性能纤维增强聚合物筋材，解决腐蚀、重量和磁干扰难题。',
    quote: '获取报价', products: '重新定义工程加固。', company: '材料科学，服务真实工程。',
    intelligence: '从项目需求到合适筋材，更快一步。', contact: '让我们一起加固<br />未来。',
    welcome: '欢迎来到 Oceanpower。我可以根据产品目录回答 GFRP、BFRP、CFRP 和锚杆系统的问题，或整理询价需求交由人工审核。',
    placeholder: '输入您的项目问题...', quick: ['隧道项目', 'GFRP 数据', '准备询价'],
    serviceLive: '实时 AI · 草案知识', serviceDemo: '目录演示模式', serviceFallback: '目录备用模式', serviceConfig: '目录演示 · 配置问题', serviceOffline: '服务暂不可用',
    sourceDraft: '目录参考 · 草案', sourceKnowledge: '试点知识 · 草案', sourceProvider: '模型服务参考 · 未核验', sourceDefault: '参考资料',
    waiting: '正在查询已批准的 Oceanpower 资料',
    error: '暂时无法连接知识服务。请重试，或发送邮件至 info@jsopmaterial.com。',
    newChat: '新对话', disclaimer: 'AI 生成的目录参考信息。最终技术规格和报价必须由 Oceanpower 工程师确认。',
  },
};

const scenarioCopy = {
  engineer: {
    en: 'I am designing a metro tunnel in Germany. Which FRP product should I consider, and what technical data is available?',
    zh: '我正在为德国的地铁隧道做设计。应该考虑哪种 FRP 产品？有哪些技术数据？',
  },
  contractor: {
    en: 'We are building a coastal bridge in the Middle East and need corrosion-resistant reinforcement. Help me prepare an RFQ.',
    zh: '我们正在中东建设沿海桥梁，需要耐腐蚀加固材料。请帮我准备询价。',
  },
  distributor: {
    en: 'I distribute construction materials in Southeast Asia. What FRP products can Oceanpower supply?',
    zh: '我在东南亚经销建筑材料。Oceanpower 可以供应哪些 FRP 产品？',
  },
};

const currentLanguage = () => document.documentElement.lang === 'zh-CN' ? 'zh' : 'en';
const uiCopy = () => copy[currentLanguage()];

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
    heading.textContent = options.sourceStatus === 'provider-reported-unverified'
      ? uiCopy().sourceProvider
      : options.sourceStatus === 'draft-knowledge-reference'
        ? uiCopy().sourceKnowledge
      : options.sourceStatus === 'catalogue-reference-draft'
        ? uiCopy().sourceDraft
        : uiCopy().sourceDefault;
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

async function askAssistant(message) {
  if (!message || state.pending) return;
  addMessage(message, 'user');
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
  } catch (error) {
    waiting.remove();
    addMessage(uiCopy().error, 'bot').classList.add('message-error');
    console.error('[Oceanpower chat]', error);
    state.mode = 'unavailable';
    state.serviceIssue = null;
    updateModeLabel();
  } finally {
    setPending(false);
    chatInput?.focus();
  }
}

function openChat(prompt) {
  state.lastFocused = document.activeElement;
  chatPanel.classList.add('open');
  chatPanel.setAttribute('aria-hidden', 'false');
  if (prompt) askAssistant(prompt); else chatInput?.focus();
}

function closeChat() {
  chatPanel.classList.remove('open');
  chatPanel.setAttribute('aria-hidden', 'true');
  if (state.lastFocused instanceof HTMLElement) state.lastFocused.focus();
}

function resetChat() {
  state.history = [];
  chatStream.innerHTML = '';
  addMessage(uiCopy().welcome, 'bot');
  const quickReplies = document.createElement('div');
  quickReplies.className = 'quick-replies';
  const prompts = currentLanguage() === 'zh'
    ? ['我正在做隧道项目，应该考虑哪种 FRP 产品？', '请提供 GFRP 性能数据', '我需要准备询价']
    : ['Which FRP product should I consider for a tunnel?', 'Show me GFRP performance data', 'I need an RFQ'];
  uiCopy().quick.forEach((label, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.dataset.prompt = prompts[index];
    quickReplies.append(button);
  });
  chatStream.append(quickReplies);
  bindPromptButtons(quickReplies);
  chatInput?.focus();
}

function bindPromptButtons(root = document) {
  root.querySelectorAll('[data-prompt],[data-chat-prompt]').forEach((button) => {
    if (button.dataset.chatBound) return;
    button.dataset.chatBound = 'true';
    button.addEventListener('click', () => openChat(button.dataset.prompt || button.dataset.chatPrompt));
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

chatLauncher?.addEventListener('click', () => openChat());
chatClose?.addEventListener('click', closeChat);
chatReset?.addEventListener('click', resetChat);
chatForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const value = chatInput.value.trim();
  if (!value) return;
  chatInput.value = '';
  askAssistant(value);
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
  document.querySelector('.header-cta').childNodes[0].textContent = `${content.quote} `;
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
  resetChat();
}

const savedLanguage = localStorage.getItem('oceanpower-language') === 'zh' ? 'zh' : 'en';
setLanguage(savedLanguage);
languageToggle?.addEventListener('click', () => setLanguage(currentLanguage() === 'zh' ? 'en' : 'zh'));

document.querySelectorAll('[data-scenario]').forEach((button) => button.addEventListener('click', () => {
  const scenario = scenarioCopy[button.dataset.scenario];
  if (scenario) openChat(scenario[currentLanguage()]);
}));

bindPromptButtons();
checkService();
