import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { load } from 'cheerio';
import businesses from '../src/content/businesses.json' with { type: 'json' };
import common from '../src/i18n/common.json' with { type: 'json' };

const intro='Four areas of expertise. Discover our companies in new materials, food technology, environmental solutions and information technology.';
for (const locale of ['en','zh','es','fr']) {
  const dictionary=locale==='en'?{}:JSON.parse(await fs.readFile(`src/i18n/${locale}.json`,'utf8'));
  const translate=key=>{
    if(locale==='en')return key;
    const value=common[key]?.[locale]||dictionary[key];
    assert.ok(value?.trim(),`${locale}: missing translation for ${key}`);
    if(!(locale==='fr'&&key==='Information'))assert.notEqual(value,key,`${locale}: untranslated business content: ${key}`);
    return value;
  };
  const prefix=locale==='zh'?'':locale+'/';
  for(const route of ['', 'business/']) {
    const $=load(await fs.readFile(`dist/${prefix}${route}index.html`,'utf8'));
    assert.ok($('.business-section').text().includes(translate(intro)));
    assert.equal($('.business-profile-card').length,4);
    businesses.forEach((business,index)=>{
      const card=$('.business-profile-card').eq(index);
      assert.equal(card.find('h3').text(),translate(business.label));
      assert.equal(card.find('p').text(),translate(business.summary));
      assert.ok(card.find('b').text().startsWith(translate('View more')));
      assert.equal(card.attr('href'),`/${prefix}business/${business.slug}/`);
    });
  }
  for(const business of businesses) {
    const $=load(await fs.readFile(`dist/${prefix}business/${business.slug}/index.html`,'utf8'));
    assert.equal($('.company-profile h1').text(),translate(business.name));
    assert.equal($('.company-profile-lead').text(),translate(business.summary));
    assert.equal($('meta[name="description"]').attr('content'),translate(business.summary));
    assert.equal($('.business-breadcrumb').attr('aria-label'),translate('Breadcrumb'));
    if(locale!=='en')assert.equal($('.company-profile [lang="en"]').length,0);
    assert.equal($('.company-profile-section').length,business.sections.length);
    business.sections.forEach((section,index)=>{
      const block=$('.company-profile-section').eq(index);
      assert.equal(block.find('h2').text(),translate(section.title));
      assert.deepEqual(block.find('p').toArray().map(p=>$(p).text()),section.paragraphs.map(translate));
    });
  }
}
console.log('Validated business cards, profiles, links and translated metadata in all four languages.');
