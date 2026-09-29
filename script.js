const header = document.querySelector('.site-header');
const toggle = document.querySelector('.menu-toggle');
toggle?.addEventListener('click', () => {
  const open = header.classList.toggle('open');
  toggle.setAttribute('aria-expanded', String(open));
  updateMenuLabel();
});
document.querySelectorAll('nav a, nav [data-rfq-open]').forEach((link) => link.addEventListener('click', () => {
  header.classList.remove('open');
  toggle.setAttribute('aria-expanded', 'false');
  updateMenuLabel();
}));

const chatPanel = document.querySelector('.chat-panel');
const chatLauncher = document.querySelector('.chat-launcher');
const chatClose = document.querySelector('.chat-close');
const chatStream = document.querySelector('.chat-stream');
const chatForm = document.querySelector('.chat-form');
const chatInput = chatForm?.querySelector('input');
const responses = [
  { test: /tunnel|metro|subway/i, text: 'For metro tunnels and shield works, GFRP is often selected for its cuttability, low weight, corrosion resistance and nonmagnetic properties. I can collect your diameter and environment requirements for an engineer.' },
  { test: /gfrp|performance|data/i, text: 'Catalog GFRP data: 4-12 mm is specified at 700-1000 MPa tensile strength; 13-16 mm at 600-900 MPa; 18-25 mm at 550-800 MPa. Guaranteed shear strength is 120-150 MPa and elasticity modulus is above 40 GPa.' },
  { test: /rfq|quote|price/i, text: 'Great - an RFQ brief should include application, rebar type, target diameter, quantity, delivery location and contact details. In the live workflow, this brief is scored and routed to the appropriate sales engineer for review.' },
  { test: /match|select|help|project/i, text: 'Tell me where the reinforcement will be used: tunnel/metro, coastal structure, bridge, mining, roadway or another environment. I will recommend the most relevant GFRP, BFRP or CFRP option.' },
];
const chineseResponses = [
  { test: /隧道|地铁|盾构/i, text: '对于地铁隧道和盾构工程，GFRP 常因可切削、轻量、耐腐蚀和无磁特性而被选用。请告诉我您需要的直径和使用环境。' },
  { test: /gfrp|性能|数据/i, text: '目录 GFRP 数据：4-12 mm 的保证抗拉强度为 700-1000 MPa；13-16 mm 为 600-900 MPa；18-25 mm 为 550-800 MPa。保证剪切强度为 120-150 MPa，弹性模量大于 40 GPa。' },
  { test: /询价|报价|价格/i, text: '询价需求通常包括应用场景、筋材类型、目标直径、数量、交付地点和联系方式。正式报价前，销售工程师会审核项目需求。' },
  { test: /选择|推荐|项目|帮助/i, text: '请告诉我您的应用场景：隧道/地铁、沿海结构、桥梁、矿山、道路或其他工程。我会推荐相关的 GFRP、BFRP 或 CFRP 方案。' },
];
function addMessage(text, type, chineseText) { const el = document.createElement('div'); el.className = type + '-message'; if (chineseText) { el.dataset.en = text; el.dataset.zh = chineseText; } el.textContent = chineseText && isChinese() ? chineseText : text; chatStream.append(el); chatStream.scrollTop = chatStream.scrollHeight; }
function answer(text) {
  const pool = isChinese() ? chineseResponses : responses;
  const index = pool.findIndex(item => item.test.test(text));
  const en = index < 0 ? 'Please contact our sales engineers or use the RFQ form below for project-specific requirements.' : responses[index].text;
  const zh = index < 0 ? '项目专用需求请联系销售工程师，或填写下方询价表单。' : chineseResponses[index].text;
  window.setTimeout(() => addMessage(en, 'bot', zh), 420);
}
let chatOpener = null;
function openChat(prompt) {
  if (chatPanel.hidden) chatOpener = document.activeElement;
  chatPanel.hidden = false;
  chatPanel.inert = false;
  chatPanel.classList.add('open');
  chatPanel.setAttribute('aria-hidden', 'false');
  chatLauncher.setAttribute('aria-expanded', 'true');
  if (prompt) { addMessage(prompt, 'user'); answer(prompt); }
  chatInput?.focus();
  document.dispatchEvent(new CustomEvent('oceanpower:chatstate'));
}
function closeChat(restoreFocus = true) {
  chatPanel.classList.remove('open');
  chatPanel.setAttribute('aria-hidden', 'true');
  chatPanel.hidden = true;
  chatPanel.inert = true;
  chatLauncher.setAttribute('aria-expanded', 'false');
  if (restoreFocus) {
    const target = chatOpener?.isConnected && chatOpener.getClientRects().length ? chatOpener : chatLauncher;
    if (target === chatLauncher) chatLauncher.hidden = false;
    target.focus({ preventScroll: true });
  }
}
document.addEventListener('focusout', () => { if (chatPanel.hidden) requestAnimationFrame(() => document.dispatchEvent(new CustomEvent('oceanpower:chatstate'))); });
chatLauncher?.addEventListener('click', () => chatPanel.hidden ? openChat() : closeChat());
chatClose?.addEventListener('click', () => closeChat());
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !chatPanel.hidden && !document.querySelector('#rfq-drawer')?.open) {
    event.preventDefault(); closeChat();
  }
});

document.querySelectorAll('[data-prompt],[data-chat-prompt]').forEach((button) => button.addEventListener('click', () => openChat(t(button.dataset.prompt || button.dataset.chatPrompt))));
chatForm?.addEventListener('submit', (event) => { event.preventDefault(); const value = chatInput.value.trim(); if (!value) return; addMessage(value, 'user'); chatInput.value = ''; answer(value); });

const scenarios = {
  engineer: [
    ['user', 'I am designing a metro tunnel in Germany. Which FRP rebar is suitable and what technical data can you provide?'],
    ['bot', 'For tunnel and metro shield works, GFRP rebar is a strong starting point because it is cuttable, nonmagnetic, lightweight and corrosion resistant.'],
    ['bot', 'Catalog data for 4-12 mm GFRP: 700-1000 MPa guaranteed tensile strength, 120-150 MPa shear strength and elasticity modulus above 40 GPa.'],
    ['bot', 'To prepare a technical brief, please confirm the design diameter, applicable standard and project delivery schedule. A sales engineer can then validate the final specification.']
  ],
  contractor: [
    ['user', 'We are building a coastal bridge in the Middle East and need corrosion-resistant reinforcement for a large quantity.'],
    ['bot', 'For a coastal environment, our AI would flag corrosion resistance as a priority and guide your team toward a suitable FRP reinforcement system.'],
    ['bot', 'I can prepare an RFQ brief. Please share target rebar diameter, estimated quantity, delivery port and required delivery date.'],
    ['bot', 'This lead is now classified as a high-value project inquiry and would be routed to the relevant Oceanpower sales engineer for review before a quote is sent.']
  ],
  distributor: [
    ['user', 'I distribute construction materials in Southeast Asia. What FRP products can Oceanpower supply?'],
    ['bot', 'Oceanpower’s FRP range includes GFRP rebar and rockbolt systems, BFRP rebar, CFRP rebar, GFRP mesh, formwork tie rods and customized solutions.'],
    ['bot', 'For partnership qualification, I can collect your country coverage, existing customer segments and the product categories you want to distribute.'],
    ['bot', 'A partnership brief is ready for the export sales team, including catalogue request and regional follow-up.']
  ]
};
const chineseScenarios = {
  engineer: [['user','我正在德国设计地铁隧道，哪种 FRP 筋材合适？可以提供哪些技术数据？'],['bot','对于地铁和隧道盾构工程，GFRP 筋材通常是优先选择：可切削、无磁、轻量且耐腐蚀。'],['bot','目录中 4-12 mm GFRP 的保证抗拉强度为 700-1000 MPa，剪切强度为 120-150 MPa，弹性模量大于 40 GPa。'],['bot','请确认设计直径、适用标准和交付计划，我们的销售工程师将核实最终技术规格。']],
  contractor: [['user','我们在中东建设沿海大桥，需要大量耐腐蚀加固材料。'],['bot','针对沿海环境，AI 会优先识别耐腐蚀需求，并引导您选择适合的 FRP 加固系统。'],['bot','我可以为您准备询价需求。请提供目标直径、预估数量、交付港口和期望交期。'],['bot','该询盘已被识别为高价值项目线索，报价发送前将由 Oceanpower 销售工程师审核。']],
  distributor: [['user','我在东南亚经销建筑材料。Oceanpower 可以提供哪些 FRP 产品？'],['bot','Oceanpower 的 FRP 产品包括 GFRP 筋材及锚杆系统、BFRP 筋材、CFRP 筋材、GFRP 网格、模板拉杆和定制化方案。'],['bot','为评估合作机会，我可以收集您的市场覆盖国家、现有客户类型和感兴趣的产品类别。'],['bot','合作需求摘要已准备完成，可发送给出口销售团队跟进。']]
};
function runScenario(name) {
  const messages = (document.documentElement.lang === 'zh-CN' ? chineseScenarios : scenarios)[name];
  if (!messages) return;
  openChat();
  chatStream.innerHTML = '';
  scenarioTimers.forEach(clearTimeout);
  scenarioTimers = scenarios[name].map(([type, text], index) => window.setTimeout(() => addMessage(text, type, chineseScenarios[name][index][1]), index * 560));
}
document.querySelectorAll('[data-scenario]').forEach((button) => button.addEventListener('click', () => runScenario(button.dataset.scenario)));

// Static copy and attributes are translated without replacing elements or form values.
let scenarioTimers = [];
const languageToggle = document.querySelector('.language-toggle');
const isChinese = () => document.documentElement.lang === 'zh-CN';
const t = text => isChinese() ? (chineseTranslations[text] || text) : text;
const localizedText = [];
const walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT);
while (walker.nextNode()) {
  const node = walker.currentNode;
  if (node.parentElement.closest('script,style,.language-toggle,.menu-toggle')) continue;
  const key = node.textContent.trim();
  if (Object.hasOwn(chineseTranslations, key)) localizedText.push({ node, original: node.textContent, key });
}
const localizedAttributes = [];
for (const element of document.querySelectorAll('[aria-label],[alt],[placeholder],meta[name="description"]')) {
  for (const name of ['aria-label', 'alt', 'placeholder', 'content']) {
    if (!element.hasAttribute(name)) continue;
    const original = element.getAttribute(name);
    if (Object.hasOwn(chineseTranslations, original)) localizedAttributes.push({ element, name, original });
  }
}
function updateMenuLabel() {
  const open = header.classList.contains('open');
  toggle.textContent = t(open ? 'Close' : 'Menu');
  toggle.setAttribute('aria-label', t(open ? 'Close navigation' : 'Open navigation'));
}
function setLanguage(language) {
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  for (const { node, original, key } of localizedText) node.textContent = isChinese() ? original.replace(key, t(key)) : original;
  for (const { element, name, original } of localizedAttributes) element.setAttribute(name, t(original));
  for (const message of chatStream.querySelectorAll('[data-en]')) message.textContent = isChinese() ? message.dataset.zh : message.dataset.en;
  languageToggle.textContent = isChinese() ? 'EN' : '中文';
  updateMenuLabel();
  document.dispatchEvent(new CustomEvent('oceanpower:languagechange'));
  try { localStorage.setItem('oceanpower-language', isChinese() ? 'zh' : 'en'); } catch { /* Storage may be disabled. */ }
}
languageToggle.addEventListener('click', () => setLanguage(isChinese() ? 'en' : 'zh'));
let savedLanguage = 'en';
try { savedLanguage = localStorage.getItem('oceanpower-language') || 'en'; } catch { /* Use English when storage is unavailable. */ }
setLanguage(savedLanguage);





// Show the scroll instruction only when the specification table needs it.
(() => {
  const region = document.querySelector('.spec-scroll');
  const hint = document.querySelector('#spec-help');
  if (!region || !hint) return;
  const updateHint = () => {
    const overflowing = region.scrollWidth > region.clientWidth + 1;
    hint.hidden = !overflowing;
    region.tabIndex = overflowing ? 0 : -1;
  };
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(updateHint);
    observer.observe(region);
    observer.observe(region.querySelector('table'));
  } else {
    window.addEventListener('resize', updateHint);
  }
  document.addEventListener('oceanpower:languagechange', updateHint);
  document.fonts?.ready.then(updateHint);
  updateHint();
})();


