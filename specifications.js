(() => {
  const tabs = [...document.querySelectorAll('.spec-tabs [role="tab"]')];
  const quote = document.querySelector('.spec-cta');
  const diameterNote = document.querySelector('.spec-footer .spec-note');
  function selectFiber(id, focus = false) {
    if (!tabs.some(tab => tab.dataset.fiber === id)) return;
    for (const tab of tabs) {
      const selected = tab.dataset.fiber === id;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      document.getElementById(tab.getAttribute('aria-controls')).hidden = !selected;
      if (selected && focus) tab.focus({ preventScroll: true });
    }
    quote.dataset.product = id.toUpperCase();
    diameterNote.hidden = id !== 'gfrp';
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectFiber(tab.dataset.fiber));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else return;
      event.preventDefault();
      selectFiber(tabs[next].dataset.fiber, true);
    });
  });
  document.querySelectorAll('[data-spec]').forEach(link => {
    link.addEventListener('click', () => selectFiber(link.dataset.spec, true));
  });
})();
