import chatPlugin from './tools/chat-plugin.mjs';
import { defineConfig } from 'astro/config';
export default defineConfig({
 site: process.env.SITE_URL || 'https://www.oceanpower.com',
 output: 'static', trailingSlash: 'always',
 i18n: { defaultLocale: 'zh', locales: ['zh','en','es','fr'], routing: { prefixDefaultLocale: false } },
 vite: { plugins: [chatPlugin()], build: { assetsInlineLimit: 0 }, server: { fs: { strict: true } } },
});
