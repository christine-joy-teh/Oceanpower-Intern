const header = document.querySelector('.site-header');
const toggle = header?.querySelector('.menu-toggle');
if (header && toggle) {
  const label = toggle.querySelector('.menu-label');
  const closedLabel = label?.textContent || toggle.textContent;
  const businessMenu = header.querySelector('[data-business-menu]');
  const businessToggle = businessMenu?.querySelector('.nav-business-toggle');
  const businessSubmenu = businessMenu?.querySelector('.business-submenu');
  const closeBusiness = () => {
    if (!businessToggle || !businessSubmenu) return;
    businessToggle.setAttribute('aria-expanded', 'false');
    businessSubmenu.hidden = true;
  };
  const close = () => {
    header.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    if (label) label.textContent = closedLabel;
    closeBusiness();
  };
  toggle.addEventListener('click', () => {
    const open = header.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
    const closeLabels = { 'zh-CN': '关闭', en: 'Close', es: 'Cerrar', fr: 'Fermer' };
    if (label) label.textContent = open ? (closeLabels[document.documentElement.lang] || 'Close') : closedLabel;
  });
  businessToggle?.addEventListener('click', () => {
    const open = businessToggle.getAttribute('aria-expanded') !== 'true';
    businessToggle.setAttribute('aria-expanded', String(open));
    businessSubmenu.hidden = !open;
  });
  document.addEventListener('click', event => {
    if (businessMenu && !businessMenu.contains(event.target)) closeBusiness();
  });
  header.querySelectorAll('nav a').forEach(link => link.addEventListener('click', close));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && businessToggle?.getAttribute('aria-expanded') === 'true') {
      closeBusiness();
      businessToggle.focus();
    } else if (event.key === 'Escape' && header.classList.contains('open')) {
      close();
      toggle.focus();
    }
  });
}

if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const reveal = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-visible');
      reveal.unobserve(entry.target);
    }
  }, { threshold: 0.08 });
  document.querySelectorAll('.business-card, .product-examples article').forEach(element => {
    if (element.getBoundingClientRect().top < window.innerHeight) return;
    element.classList.add('scroll-reveal');
    reveal.observe(element);
  });
}
