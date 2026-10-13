// Section navigation and a mobile chat launcher that yields to page actions.
(() => {
  const links = [...document.querySelectorAll('.site-header nav a[href^="#"]')];
  const targets = links.map(link => ({ link, section: document.querySelector(link.getAttribute('href')) })).filter(item => item.section);
  let frame = 0;
  function updateNavigation() {
    frame = 0;
    const anchor = document.querySelector('.site-header').getBoundingClientRect().bottom + 80;
    const current = targets.filter(item => item.section.getBoundingClientRect().top <= anchor)
      .sort((a,b) => b.section.offsetTop - a.section.offsetTop)[0];
    targets.forEach(item => {
      if (item === current) item.link.setAttribute('aria-current', 'location');
      else item.link.removeAttribute('aria-current');
    });
  }
  window.addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(updateNavigation); }, { passive: true });
  window.addEventListener('resize', updateNavigation);
  updateNavigation();
  const launcher = document.querySelector('.chat-launcher');
  const panel = document.querySelector('.chat-panel');
  const mobile = window.matchMedia('(max-width:850px)');
  const protectedAreas = [...document.querySelectorAll('.spec-footer,.rfq-cta,#contact,footer')];
  const visible = new Set();
  function updateLauncher() {
    // Never remove the control while it has focus or while it is needed to toggle chat.
    launcher.hidden = mobile.matches && visible.size > 0 && panel.hidden && document.activeElement !== launcher;
  }
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.isIntersecting ? visible.add(entry.target) : visible.delete(entry.target));
      updateLauncher();
    }, { rootMargin: '0px 0px 60px 0px' });
    protectedAreas.forEach(area => observer.observe(area));
  }
  mobile.addEventListener('change', updateLauncher);
  launcher.addEventListener('blur', updateLauncher);
  document.addEventListener('oceanpower:chatstate', updateLauncher);
})();
