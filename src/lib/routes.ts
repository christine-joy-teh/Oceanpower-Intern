import manifest from '../content/routes.json';
export const locales = ['zh','en','es','fr'] as const;
export type Locale = typeof locales[number];
export const routeKeys = manifest.routes;
export type RouteKey = typeof routeKeys[number];
export const pendingRoutes = new Set(manifest.pending);
export function urlFor(locale: Locale, key: string = '') { return '/' + (locale === 'zh' ? '' : locale + '/') + (key ? key + '/' : ''); }
export const languageNames = { zh:'中文', en:'English', es:'Español', fr:'Français' };
export const htmlLanguages = { zh:'zh-CN',en:'en',es:'es',fr:'fr' };
const configuredSite = import.meta.env.SITE_URL || 'https://www.oceanpower.com';
export const siteUrl = configuredSite.endsWith('/') ? configuredSite.slice(0,-1) : configuredSite;
