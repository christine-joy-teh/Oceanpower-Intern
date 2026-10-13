import zh from './zh.json';
import es from './es.json';
import fr from './fr.json';
import common from './common.json';
import type { Locale } from '../lib/routes';
const dictionaries: Record<string,Record<string,string>> = { zh, es, fr };
export function t(key: string, locale: Locale): string {
 const shared = (common as Record<string,Record<string,string>>)[key];
 return shared?.[locale] || dictionaries[locale]?.[key] || key;
}
export function clientDictionary(locale: Locale) { return Object.fromEntries(Object.keys(common).map(key => [key,t(key,locale)])); }
