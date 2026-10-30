# Oceanpower multilingual website

The optional local MySQL content manager is documented in [CMS_SETUP.md](CMS_SETUP.md). It provides a single administrator login for Chinese and English products, news, page content, business descriptions and downloadable documents.

Astro static site migration based on the supplied oceanpower.com 网站焕新的完整闭环方案.docx. The existing FRP design, images and catalogue specifications are retained. See [TECHNICAL-AUDIT.md](TECHNICAL-AUDIT.md) for the before/after audit and decisions.

## Run locally

Use Node 24 (minimum 22.12).

    npm ci
    npm run dev

Open http://localhost:4321. Chinese is the default at /. English is /en/, Spanish /es/ and French /fr/. npm start runs Astro on port 8000; stop any older Node server on that port first.

    npm run build
    npm run preview

The build runs Astro diagnostics, generates dist/, then validates every localized route, metadata, JSON-LD, local link and anchor. Preview serves the production build and original chat API at port 4321 through tools/preview.mjs (Astro’s default static preview omits custom API plugins).

## Routes

Each route exists in all four languages:

| Route without language prefix | Content |
| --- | --- |
| / | Homepage retaining the FRP design |
| /about/ | Existing company, historical credentials and partners |
| /business/ | Four divisions listed by the reference document |
| /business/new-material/ | Existing FRP products, comparison and applications |
| /business/food/ | Content awaiting company review |
| /business/environment/ | Content awaiting company review |
| /business/information/ | Content awaiting company review |
| /news/ | Content awaiting company review |
| /contact/ | Existing catalogue contact information and enquiry demo |
| /products/gfrp/ | Sand-coated GFRP product page |
| /products/bfrp/ | BFRP product page |
| /products/cfrp/ | CFRP product page |
| /demo/ | Buyer journey demonstration |

The document's table implies 36 core routes, despite a separate claim of 34. The retained products and demo add 16 routes: 52 content routes plus a 404 page. Language selection links to the same route in the selected language. Chinese is unprefixed; there is no /zh/ route.

## Source structure

- src/pages/[...path].astro: generates the localized routes.
- src/layouts/BaseLayout.astro: global shell and bundled client script.
- src/components/: reusable header, footer, language selector, SEO, business cards, enquiry tools and preserved frontend sections.
- src/i18n/ui.ts: translation helper; common.json and zh/es/fr.json hold text. Spanish/French are draft translations requiring company review.
- src/content/reference-pages.json: preserved source HTML used by section components. This is the current content source; root HTML files are legacy snapshots, not the Astro source.
- src/lib/content.ts: builds localized text and language-aware links from those sections.
- styles.css and lab.css: preserved design, imported by src/styles/global.css.
- tailwind.config.mjs: shared design tokens. Tailwind 4 uses the compatibility @config directive; preflight is omitted to avoid resetting the current appearance.
- public/: explicitly published assets, catalogue and generated SEO/Cloudflare files.
- tools/prepare-public.mjs: copies only public assets and generates sitemap, robots, headers and legacy redirects.

## Content and demo boundaries

All product numbers and existing company details come from the prior supplied-catalogue prototype, not independently verified facts. Historical certificates stay labelled historical. No new facts, prices, cases or claims have been added for divisions missing content.

The Astro enquiry form is entirely local: users can edit requirements, mark project details unknown, review/copy the draft and complete a demo. It does not send, store or email leads. Closing and reopening preserves the in-page draft; navigation/reload clears it. Use fictional details.

The AI chatbot is retained on every Astro page. Dev and preview connect directly to the original server.js /api/chat and /api/health handlers through server-only middleware. Existing CHAT_API_URL, CHAT_API_KEY, CHAT_MODEL and CHAT_KNOWLEDGE_FILE settings apply. No provider key or private knowledge file is included in the frontend.

The chat keeps the last eight messages in page memory, displays provider/catalogue references, and distinguishes live AI from fallback mode. The original catalogue answers are used for English/Chinese; Spanish/French use the existing translated product tables when live AI is unavailable. Live AI is instructed to use the selected website language. Reload/navigation clears chat history. The enquiry form still does not submit leads.

    npm run start:legacy

Legacy mode still serves the original root HTML with the same backend.

### Chat on Cloudflare Pages

The site remains an Astro static build, with functions/api/[[path]].js forwarding only /api/chat and /api/health to the existing Node backend. Host server.js separately on a Node-capable service, with the existing knowledge file and private CHAT_API_* environment settings. Set ALLOWED_ORIGINS to your actual Pages/custom origins.

Set CHAT_BACKEND_URL in Cloudflare Pages to that backend's HTTPS origin, and set the same secret CHAT_BACKEND_TOKEN on Pages and on the Node service. This token protects the backend bridge; it is distinct from the model provider API key. Do not set a public Vite/Astro environment variable for either key. The bridge only calls this configured origin, enforces request size and same-origin checks, and disables caching. public/_routes.json limits Functions to /api/*.

No backend hosting or credentials are provisioned automatically. Until configured, the chatbot stays visible and provides clearly labelled local catalogue answers. Test the deployed bridge after configuring it; local preview exercises the original Node handler directly, not Cloudflare's runtime.

## SEO

Set SITE_URL to the intended site's canonical origin. The document proposes https://www.oceanpower.com; no domain binding has been performed.

PUBLIC_INDEXABLE defaults to false: demo pages receive noindex, and robots.txt disallows crawling. After company approval, set it to true and rebuild. Pending-content pages and the buyer demo remain noindex and are excluded from sitemap.xml. Metadata includes localized titles/descriptions, canonical URLs, Open Graph, Twitter card, reciprocal hreflang plus x-default, and WebPage/WebSite JSON-LD. No fabricated Product offers, prices, reviews or certifications are emitted.

The source _headers file defines CSP and other security headers for Pages. Original .html URLs redirect to their English equivalents through _redirects. These redirects are interpreted by Cloudflare Pages, not by Astro's preview server.

## Cloudflare Pages

Choose ONE deployment method to avoid duplicate builds.

### Git integration from the reference document

1. Connect this repository in Cloudflare Pages.
2. Select Astro, build command npm run build and output directory dist.
3. Use Node 24 and ASTRO_TELEMETRY_DISABLED=1.
4. Set SITE_URL and leave PUBLIC_INDEXABLE=false for a demo.
5. Keep CLOUDFLARE_DEPLOY_ENABLED unset in GitHub when using Git integration.
6. Bind the proposed custom domain only after the company authorizes it and verifies ownership.

wrangler.toml declares the static output directory. No Astro adapter is required; the chatbot uses the Pages Function bridge described above. Private files, .env, server.js and knowledge sources are not copied to dist.

### GitHub Actions direct deployment

The website.yml workflow validates pushes/PRs and runs browser checks. Deployment runs only on main with CLOUDFLARE_DEPLOY_ENABLED=true.

Configure GitHub repository/environment variables: CLOUDFLARE_DEPLOY_ENABLED, CLOUDFLARE_PAGES_PROJECT, SITE_URL, PUBLIC_INDEXABLE. Configure secrets CLOUDFLARE_API_TOKEN (Pages deployment permissions) and CLOUDFLARE_ACCOUNT_ID. Create the Cloudflare Pages project first. Use the cloudflare-pages GitHub environment for approval controls. No credentials belong in code or public files.

No cloud project, secret, DNS record, remote push or production deployment is created by this migration.

## Validation

    npm test
    npm run build
    npx playwright install chromium
    npm run test:site

The legacy 14 server/RFQ tests remain, alongside three chatbot/preview integration tests. The new browser suite serves dist with the actual CSP, checks all 52 routes and console errors, exercises four-language enquiry flows, language navigation, product return links and specification tabs, and checks phone/tablet horizontal overflow. Browser screenshots are written under ignored tmp/site-browser. On Windows, an installed Edge/Chrome can be used automatically or set CHROMIUM_EXECUTABLE_PATH.

## RAG knowledge base toolkit (`rag/`)

`rag/` is a self-contained, standalone local-RAG toolkit — it has no dependency on anything Oceanpower-specific or on `server.js`, so it can be copied as-is into any other Node-based chatbot project.

What it does: extract PDF text, chunk it, embed it locally (no API key), store it as a JSON index, and retrieve the closest chunks for a question.

**To use it from any chatbot project:**

1. Copy the whole `rag/` folder (including `knowledge-bases/<name>/pdfs/` and any `knowledge-bases/<name>/transcripts/`) into the other project, or depend on it as a local path.
2. Install its one dependency there too: `npm install pdf-parse @xenova/transformers`.
3. Build the index once: `node rag/build-index.js <name>`.
4. From your chatbot's code, import and call the one function it needs:

   ```js
   const { retrieve } = require('./rag/retrieve');

   const chunks = await retrieve('haichuan', userQuestion, 5);
   // chunks: Array<{ text, source, chunkIndex, lang, score }>
   // Stuff chunk.text (and chunk.source for citations) into your own
   // chatbot's system prompt before calling your LLM provider.
   ```

**Notes:**

- Add a new knowledge base at any time: drop PDFs into `rag/knowledge-bases/<name>/pdfs/`, then run `npm run rag:build -- <name>` (or `node rag/build-index.js <name>` in a project without that npm script).
- Query a knowledge base directly from the command line: `node -e "require('./rag/retrieve').retrieve('<name>', '你的问题', 5).then(r => console.log(r))"`.
- Generated indexes (`rag/knowledge-bases/*/index.json`) are gitignored — they're derived data, regenerate them from the PDFs rather than committing them.
- The embedding model (`Xenova/bge-small-zh-v1.5`) downloads once (~100MB) on first real use, then runs fully offline — no API key, no per-query cost.
- **PDFs with no embedded text layer:** some PDFs (common with design-tool-exported brochures) have their text flattened to images or vector outlines, which no text-extraction library can recover. `extractPdfText` automatically falls back to a manual transcript file at `<kbDir>/transcripts/<pdf-basename>.txt` when a PDF's text layer comes back empty, and throws a clear error if neither exists. Produce a transcript however you like (read the PDF yourself, ask a vision-capable LLM, OCR it with a tool of your choice) and save it at that path — extraction picks it up automatically on the next build. The Haichuan knowledge base's 8 image-only manuals were handled this way; see `rag/knowledge-bases/haichuan/transcripts/`.
- **Cross-lingual queries:** the embedding model is Chinese-optimized, so an English question against Chinese-only content matches unreliably. Drop an optional English counterpart at `<kbDir>/transcripts-en/<pdf-basename>.txt` and `build-index.js` embeds it alongside the Chinese text as its own chunk set (tagged `lang: 'en'` vs `lang: 'zh'` in the returned results) — so an English query matches English text directly instead of relying on cross-lingual embedding similarity. The Haichuan knowledge base has English transcripts for the 8 Chinese-only manuals (the 9th already has native bilingual text, so needs no separate English file); see `rag/knowledge-bases/haichuan/transcripts-en/`.
- Automated tests never touch the real embedding model: they set `RAG_FAKE_EMBEDDINGS=1`, which swaps in a cheap deterministic fake embedding (see `rag/lib/embed.js`). Use the same env var if you add tests for this toolkit in another project.

### Example integration: the Haichuan persona in `server.js`

`server.js` demonstrates wiring `rag/` into a working chatbot via a second persona, selected with `CHAT_PERSONA=haichuan` (default is `oceanpower`, the original static-knowledge-file behavior, unchanged). When the Haichuan persona is active, each chat request calls `retrieve('haichuan', message, 5)`, builds a system prompt from the returned chunks, and sends it to the same upstream LLM provider the Oceanpower persona already uses (any OpenAI-compatible chat-completions endpoint — `.env.example` has it set up for Qwen via Alibaba Cloud Model Studio).

To try it locally:
1. Build the index once: `npm run rag:build -- haichuan`.
2. Set `CHAT_PERSONA=haichuan`, plus `CHAT_API_URL`/`CHAT_API_KEY`/`CHAT_MODEL` for your LLM provider, in `.env`.
3. `npm start`, then POST to `/api/chat` — the response is generated from retrieved Haichuan manual excerpts instead of the Oceanpower knowledge file.

This is also the reference pattern for wiring `rag/` into any other chatbot: retrieve chunks for the user's message, build a prompt from them, call your LLM.
