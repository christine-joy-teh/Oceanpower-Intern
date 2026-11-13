import chatPlugin from './tools/chat-plugin.mjs';
import { defineConfig } from 'astro/config';
const siteSetting = process.env.SITE_URL;
const localSite = /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?\/?$/.test(siteSetting || '');
const siteUrl = (localSite && process.env.RENDER_EXTERNAL_URL) || siteSetting || process.env.RENDER_EXTERNAL_URL || 'https://www.oceanpower.com';
export default defineConfig({
 site: siteUrl,
 output: 'static', trailingSlash: 'always',
 i18n: { defaultLocale: 'zh', locales: ['zh','en','es','fr'], routing: { prefixDefaultLocale: false } },
 vite: { plugins: [chatPlugin()], build: { assetsInlineLimit: 0 }, server: { fs: { strict: true } } },
});
