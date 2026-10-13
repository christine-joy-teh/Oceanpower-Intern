import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {load} from 'cheerio';
import content from '../src/content/corporate.json' with {type:'json'};
import common from '../src/i18n/common.json' with {type:'json'};
for(const locale of ['en','zh','es','fr']) {
  const dictionary=locale==='en'?{}:JSON.parse(await fs.readFile(`src/i18n/${locale}.json`,'utf8'));
  const translate=key=>{
    if(locale==='en')return key;
    const value=common[key]?.[locale]||dictionary[key];
    assert.ok(value?.trim(),`${locale}: missing corporate translation for ${key}`);
    return value;
  };
  const prefix=locale==='zh'?'':locale+'/';
  for(const [route,page] of Object.entries(content)) {
    const $=load(await fs.readFile(`dist/${prefix}${route}/index.html`,'utf8'));
    if(route==='contact'){
      assert.equal($('.headquarters-contact').length,1);
      assert.equal($('[data-corporate-page="contact"]').length,0,'Avoid duplicated headquarters details');
      assert.equal($('.headquarters-contact h2').text(),translate(page.title));
      assert.equal($('#headquarters>p').text(),translate(page.sections[0].paragraphs[0]));
      assert.equal($('a[href="tel:+8675583300666"]').length,1);
      assert.equal($('a[href="mailto:info@jsopmaterial.com"]').length,0);
      continue;
    }
    const root=$(`[data-corporate-page="${route}"]`);
    assert.equal(root.length,1,`${locale}/${route}: expected one corporate section`);
    assert.equal(root.find('.corporate-heading h1,.corporate-heading h2').text(),translate(page.title));
    assert.equal(root.find('.corporate-heading>p:last-child').text(),translate(page.intro));
    assert.equal(root.find('.corporate-article').length,page.sections.length);
    for(const section of page.sections) {
      const block=root.find('#'+section.id);
      assert.equal(block.children('h2').text(),translate(section.title));
      assert.deepEqual(block.find('p').toArray().map(p=>$(p).text()),section.paragraphs.map(translate));
      if(section.id==='leadership'){
        assert.equal(block.find('img').attr('src'),'/assets/oceanpower-ceo.jpg');
        assert.equal(block.find('figcaption').text(),translate('Directors : Polo He'));
      }
      assert.ok(block.find('.corporate-source').attr('href').endsWith('?'+section.source+'_'));
    }
    assert.equal($('.business-profile-card').length,0,'Do not duplicate the business overview on corporate pages');
    if(route==='about')assert.equal($('#company').length,1,'Existing FRP company section must appear only once');
    if(route==='contact'){assert.equal($('#contact').length,1);assert.equal($('a[href="tel:+8675583300666"]').length,1);}
    for(const link of ['research','careers','legal'])assert.equal($(`footer a[href="/${prefix}${link}/"]`).length,1);
  }
}
console.log('Validated corporate content, translations, source links, contact details and non-duplicated sections in four languages.');
