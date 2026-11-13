const discovery = document.querySelector('[data-product-discovery]');
if (discovery) {
  const search = discovery.querySelector('[data-product-search]');
  const category = discovery.querySelector('[data-product-category]');
  const count = discovery.querySelector('[data-product-count]');
  const empty = document.querySelector('[data-product-empty]');
  const cards = [...document.querySelectorAll('.product-examples article')];
  const normalize = value => String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().trim();
  const update = () => {
    const terms = normalize(search.value).split(/\s+/).filter(Boolean);
    let visible = 0;
    for (const card of cards) {
      const text = normalize(card.dataset.search || card.textContent);
      const route = card.querySelector('a[href]')?.getAttribute('href');
      const matches = (!category.value || route === category.value) && terms.every(term => text.includes(term));
      card.hidden = !matches;
      if (matches) visible += 1;
    }
    count.textContent = String(visible);
    empty.hidden = visible !== 0;
  };
  search.addEventListener('input', update);
  category.addEventListener('change', update);
}
