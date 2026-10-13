# Oceanpower structure audit and migration

Source: oceanpower.com 网站焕新的完整闭环方案.docx. Read the complete document text and route table. This is a structure summary, not source code or a backend API specification.

## Document requirements
Chinese is unprefixed; English, Spanish and French use /en/, /es/ and /fr/. Nine route families: home, about, business overview, new-material, food, environment, information, news and contact. The table yields 36 routes; the separate claim of 34 pages is inconsistent. The document names components, BaseLayout, i18n/ui.ts, styles, public sitemap/robots/security headers, Astro, Tailwind and Wrangler. It does not provide component code, framework versions, database, CMS, lead destination or AI endpoints.

## Existing project
Separate HTML pages and shared CSS/browser JS; English-first home plus GFRP/BFRP/CFRP and buyer demo pages. English/Chinese runtime text replacement. A Node server with an optional protected AI proxy and catalogue fallback. In-memory enquiry demo, no real submission. No Astro build, localized URLs, reusable layout, canonical/hreflang/OG, sitemap, Pages configuration or CI deployment.

## Migration
- Retain design classes, images, tables and source copy in src/content/reference-pages.json, rendered through reusable Astro section components and src/lib/content.ts. Original root files remain the legacy implementation.
- Shared Header, Footer, LanguageSwitcher, SEO, BaseLayout, Hero, ProductGrid, ProductComparison, Company, Applications, BusinessCards, ContentSection and DemoTools.
- 36 documented routes, 12 product routes and four demo routes: 52 localized content routes, plus 404.
- No invented business descriptions, news, projects or certifications. Food, environment, information and news use explicit pending-content states and noindex.
- Existing catalogue facts are carried forward, not newly verified. Spanish/French are draft translations for company review.
- Language links retain the corresponding page. Translated content is rendered into HTML at build time. No automatic browser-language redirect.
- Current Astro and Tailwind are lockfile-pinned. Tailwind preflight is omitted to preserve existing styling; tailwind.config.mjs supplies existing design tokens.
- Generated sitemap.xml, robots.txt, _headers and old .html URL redirects. Demo is noindex by default. Set PUBLIC_INDEXABLE=true only after review, and configure SITE_URL for the correct origin. Schema.org uses WebPage/WebSite without invented offers, prices or reviews.
- Cloudflare serves static dist output plus a narrow /api/* Pages Function bridge to a separately hosted Node chatbot. server.js and provider secrets are not published as static files.
- The Astro site retains the original AI backend through server-only dev/preview middleware, and a Pages bridge for deployment. Live AI uses the existing provider configuration and company knowledge; clearly labelled catalogue fallback remains available. Conversation history and source labels are preserved. Four-language enquiry editing/review/copy/completion remains a demo with real submission deferred. The original full RFQ parser remains in legacy mode.

## External setup
Cloudflare account/project, approved domain ownership, GitHub secrets and deployment environment are not supplied. The workflow validates pushes and PRs; remote deployment remains disabled until enabled by repository variables. No DNS, cloud account, publication or GitHub push occurs as part of this migration.

## Configuration references

- https://docs.astro.build/en/guides/internationalization/
- https://docs.astro.build/en/guides/styling/
- https://developers.cloudflare.com/pages/framework-guides/deploy-an-astro-site/
- https://developers.cloudflare.com/pages/functions/wrangler-configuration/
- https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/
