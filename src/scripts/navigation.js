const header = document.querySelector('.site-header');
const toggle = header?.querySelector('.menu-toggle');
if (header && toggle) {
  const label = toggle.querySelector('.menu-label');
  const closedLabel = label?.textContent || toggle.textContent;
  const close = () => {
    header.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    if (label) label.textContent = closedLabel;
  };
  toggle.addEventListener('click', () => {
    const open = header.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
    const closeLabels = { 'zh-CN': '关闭', en: 'Close', es: 'Cerrar', fr: 'Fermer' };
    if (label) label.textContent = open ? (closeLabels[document.documentElement.lang] || 'Close') : closedLabel;
  });
  header.querySelectorAll('nav a').forEach(link => link.addEventListener('click', close));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && header.classList.contains('open')) {
      close();
      toggle.focus();
    }
  });
}
