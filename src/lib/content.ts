import { load } from 'cheerio';
import sources from '../content/reference-pages.json';
import { t } from '../i18n/ui';
import { urlFor, type Locale } from './routes';
export function fragment(page: keyof typeof sources, selector: string, locale: Locale) {
 const $ = load(sources[page]);
 const selected = $(selector).clone();
 selected.find('script').remove();
 const root = load('<div id="fragment"></div>'); root('#fragment').append(selected);
 root('#fragment').find('*').contents().each((_, node) => {
  if (node.type === 'text') { const key = node.data.trim(); if (key) node.data = node.data.replace(key,t(key,locale)); }
 });
 root('[href]').each((_, el) => {
  const a = root(el), href = a.attr('href') || '';
  if (/^(https?:|mailto:|tel:)/.test(href)) return;
  const product = href.match(/(?:^|\/)(gfrp|bfrp|cfrp)\.html/);
  if (product) a.attr('href',urlFor(locale,'products/'+product[1]));
  else if (href.includes('demo.html')) a.attr('href',urlFor(locale,'demo'));
  else if (href === '/' || href === '#top' || href.includes('index.html#top')) a.attr('href',urlFor(locale));
  else if (/^(?:\/?index.html|\/)?#(solutions|performance|applications|company|credentials|partners|contact|rfq)$/.test(href)) {
   const hash=href.split('#')[1];
   const routes: Record<string,string> = {company:'about',credentials:'about#credentials',partners:'about#partners',contact:'contact',solutions:'business/new-material#solutions',performance:'business/new-material#performance',applications:'business/new-material#applications',rfq:'contact'};
   const [route,anchor]=routes[hash].split('#'); a.attr('href',urlFor(locale,route)+(anchor?'#'+anchor:''));
  }
 });
 root('[src]').each((_,el)=>{const e=root(el);const src=e.attr('src')||'';if(src.startsWith('assets/'))e.attr('src','/'+src);});
 root('[alt]').each((_,el)=>{const e=root(el);const text=e.attr('alt')||'';const translated=t(text,locale);e.attr('alt',translated===text&&locale!=='en'?t('Catalogue image',locale):translated);});
 root('[aria-label]').each((_,el)=>{const e=root(el);e.attr('aria-label',t(e.attr('aria-label')||'',locale));});
 root('[data-chat-prompt],[data-scenario]').attr('data-open-catalogue','');
 return root('#fragment').html() || '';
}
