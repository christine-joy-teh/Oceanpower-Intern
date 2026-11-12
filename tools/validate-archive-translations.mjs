import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {load} from 'cheerio';
import source from '../src/content/official-products.json' with {type:'json'};
import translations from '../src/content/official-product-translations.json' with {type:'json'};
import policy from '../content-policy.js';

let count=0;
for(const category of source.categories.filter(item=>!policy.isRetiredContent(item.route))){
  const entries=category.entries.filter(entry=>!policy.isRetiredContent(entry));
  for(const locale of ['en','es','fr']){
    const $=load(await fs.readFile(`dist/${locale}/${category.route}/index.html`,'utf8'));
    const archive=$('[data-official-archive]');
    assert.equal(archive.find('[data-archive-entry]').length,entries.length);
    for(const [index,entry] of entries.entries()){
      const rendered=archive.find('[data-archive-entry]').eq(index);
      for(const [field,selector] of [['title','h3'],['summary','.entry-summary'],['description','.entry-detail>p:not(.language-note)']]){
        if(!entry[field]) continue;
        const expected=translations[locale][entry[field]];
        assert.ok(expected?.trim(),`${locale}: missing ${field} for ${entry.title}`);
        assert.doesNotMatch(expected,/[\u3400-\u9fff]/,`${locale}: Chinese remains in ${field}`);
        assert.equal(rendered.find(selector).text(),expected,`${locale}: untranslated ${field}`);
        assert.equal(rendered.find(selector).attr('lang'),locale);
      }
      assert.equal(rendered.find('.entry-actions a').attr('href'),entry.sourceUrl);
      count++;
    }
    assert.doesNotMatch(archive.find('.archive-controls').text(),/[\u3400-\u9fff]/,`${locale}: untranslated controls`);
  }
}
console.log(`Validated translations, language tags and source links for ${count} localized archive entries.`);
