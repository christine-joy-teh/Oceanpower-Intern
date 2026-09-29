// One reusable modal owns the form, review, focus handling and email handoff.
(() => {
  const dialog = document.querySelector('#rfq-drawer');
  const form = dialog.querySelector('#rfq-form');
  const intro = dialog.querySelector('#rfq-intro');
  const review = dialog.querySelector('#rfq-review');
  const fields = [...form.querySelectorAll('input,select,textarea')];
  const touched = new Set();
  const errorSummary = dialog.querySelector('#rfq-errors');
  const labels = { name: 'Your name', company: 'Company name', email: 'Business email', application: 'Project', material: 'Material', diameter: 'Target diameter', quantity: 'Quantity', destination: 'Delivery', date: 'Required delivery date', notes: 'Additional requirements' };
  let opener, scrollY = 0, brief = '', savedBodyStyle = null;
  const triggers = [...document.querySelectorAll('[data-rfq-open]')];
  for (const trigger of triggers) {
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-controls', 'rfq-drawer');
    trigger.addEventListener('click', () => open(trigger));
  }
  function focusable() {
    return [...dialog.querySelectorAll('button,a[href],input,select,textarea,[tabindex="0"]')]
      .filter(element => !element.disabled && !element.closest('[hidden]') && element.getClientRects().length);
  }
  function open(trigger) {
    if (dialog.open) return;
    opener = trigger;
    if (trigger.dataset.product) form.elements.material.value = trigger.dataset.product;
    // The existing mobile menu closes before opening. Chat must not overlap the modal.
    closeChat(false);
    intro.hidden = false; form.hidden = false; review.hidden = true;
    dialog.setAttribute('aria-labelledby', 'rfq-title');
    dialog.setAttribute('aria-describedby', 'rfq-description');
    scrollY = window.scrollY;
    savedBodyStyle = document.body.getAttribute('style');
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    Object.assign(document.body.style, { position: 'fixed', top: `-${scrollY}px`, width: '100%', overflow: 'hidden' });
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
    dialog.showModal();
    dialog.scrollTop = 0;
    dialog.querySelector('#rfq-title').focus({ preventScroll: true });
  }
  function close() { if (dialog.open) dialog.close(); }
  dialog.querySelector('.rfq-close').addEventListener('click', close);
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
  let backdropPointer = false;
  const outside = event => {
    const bounds = dialog.getBoundingClientRect();
    return event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
  };
  dialog.addEventListener('pointerdown', event => { backdropPointer = event.target === dialog && outside(event); });
  dialog.addEventListener('click', event => {
    if (backdropPointer && event.target === dialog && outside(event)) close();
    backdropPointer = false;
  });
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const items = focusable();
    const first = items[0], last = items.at(-1);
    if (!first) { event.preventDefault(); return; }
    if (event.shiftKey && (document.activeElement === first || !items.includes(document.activeElement))) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !items.includes(document.activeElement))) {
      event.preventDefault(); first.focus();
    }
  });
  dialog.addEventListener('close', () => {
    if (savedBodyStyle === null) document.body.removeAttribute('style');
    else document.body.setAttribute('style', savedBodyStyle);
    window.scrollTo({ top: scrollY, behavior: 'instant' });
    // A mobile-menu or chat trigger may be hidden after its container closes.
    const returnTarget = opener?.closest('.chat-panel') ? document.querySelector('.chat-launcher')
      : opener?.getClientRects().length ? opener : document.querySelector('.menu-toggle');
    if (returnTarget) returnTarget.hidden = false;
    returnTarget?.focus({ preventScroll: true });
  });
  function errorFor(field) {
    if (field.required && !field.value.trim()) return t('Error: Please complete this field.');
    if (field.validity.typeMismatch) return t('Error: Enter a valid email address.');
    if (field.validity.badInput) return t('Error: Enter a valid value.');
    if (field.validity.tooLong) return t('Error: Please shorten this entry.');
    return '';
  }
  function validateField(field) {
    const message = touched.has(field.name) ? errorFor(field) : '';
    const error = dialog.querySelector(`#rfq-${field.name}-error`);
    error.textContent = message; error.hidden = !message;
    field.setAttribute('aria-invalid', String(Boolean(message)));
    return !message;
  }
  function refreshErrors() {
    fields.forEach(validateField);
    if (!errorSummary.hidden) {
      errorSummary.textContent = t('Please correct the highlighted fields before continuing.');
      errorSummary.hidden = fields.every(field => !errorFor(field));
    }
  }
  for (const field of fields) {
    field.addEventListener('blur', () => { touched.add(field.name); validateField(field); });
    field.addEventListener('input', () => { if (touched.has(field.name)) validateField(field); refreshErrors(); });
  }
  function renderSummary() {
    const data = new FormData(form);
    const summary = dialog.querySelector('#rfq-summary');
    summary.replaceChildren();
    const lines = [t('Oceanpower RFQ'), ''];
    for (const [key, label] of Object.entries(labels)) {
      let value = String(data.get(key) || '').trim();
      if (key === 'material' && value === 'Advice') value = t('I need advice');
      value ||= t('Not specified');
      const group = document.createElement('div');
      if (key === 'notes') group.className = 'rfq-wide';
      const term = document.createElement('dt'), detail = document.createElement('dd');
      term.textContent = t(label); detail.textContent = value;
      group.append(term, detail); summary.append(group);
      lines.push(`${t(label)}: ${value}`);
    }
    brief = lines.join('\r\n');
    dialog.querySelector('#rfq-send').setAttribute('href', 'mailto:info@jsopmaterial.com?subject=' + encodeURIComponent(t('Oceanpower RFQ')) + '&body=' + encodeURIComponent(brief));
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    fields.forEach(field => touched.add(field.name));
    fields.forEach(validateField);
    const invalid = fields.find(field => errorFor(field));
    errorSummary.hidden = !invalid;
    if (invalid) {
      errorSummary.textContent = t('Please correct the highlighted fields before continuing.');
      invalid.focus(); return;
    }
    renderSummary(); intro.hidden = true; form.hidden = true; review.hidden = false;
    dialog.setAttribute('aria-labelledby', 'rfq-review-title');
    dialog.removeAttribute('aria-describedby');
    dialog.scrollTop = 0;
    dialog.querySelector('#rfq-review-title').focus({ preventScroll: true });
  });
  dialog.querySelector('#rfq-edit').addEventListener('click', () => {
    intro.hidden = false; form.hidden = false; review.hidden = true;
    dialog.setAttribute('aria-labelledby', 'rfq-title');
    dialog.setAttribute('aria-describedby', 'rfq-description');
    dialog.scrollTop = 0;
    fields[0].focus({ preventScroll: true });
  });
  dialog.querySelector('#rfq-download').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob(['\ufeff', brief], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'Oceanpower-RFQ.txt';
    document.body.append(link); link.click(); link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  document.addEventListener('oceanpower:languagechange', () => {
    refreshErrors();
    if (!review.hidden) renderSummary();
  });
})();



