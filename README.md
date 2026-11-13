# Shenzhen Oceanpower website — functionality and developer guide

This repository is a **review preview of the Shenzhen Oceanpower group website**. It presents four business areas: new materials, food, environment, and information technology. It is separate from the earlier Jiangsu GFRP project. Company staff must review company names, product facts, qualifications, translations, images, and contacts before treating the preview as approved company content. This guide describes the current source code, not necessarily the deployed version.

## What visitors can use

| Feature | Current behaviour | Source / limits |
| --- | --- | --- |
| Four-language site | Chinese at `/`, English at `/en/`, Spanish at `/es/`, French at `/fr/`; switcher keeps the corresponding route | `src/content/routes.json`, `src/lib/routes.ts`, `LanguageSwitcher.astro`, `src/i18n/` |
| Navigation | Desktop header and smaller-screen menu; Escape closes the menu | `Header.astro`, `Footer.astro`, `src/scripts/navigation.js` |
| Homepage | Shenzhen group hero, four business cards, news area, headquarters contacts | `Hero.astro`, `BusinessCards.astro`, `HomeNews.astro`, `HeadquartersContact.astro` |
| Business profiles | New Materials, Food, Environment, Information detail pages | `BusinessProfile.astro`, `src/content/businesses.json` |
| New-materials products | Six category pages, featured products, searchable/group-filtered official-site archive, source links | `ProductOverview.astro`, `ProductCategory.astro`, `OfficialProductArchive.astro`, `src/content/product-examples.json`, `catalogue.ts`, `official-products.json` |
| Food catalogue | Structured powder, soft-serve machine, and related-product sections with PDF page references | `FoodCatalogue.astro`; source-built, not individual CMS product records |
| Corporate pages | About, Research, Careers, Legal | `CorporateContent.astro`, `src/content/corporate.json` |
| News / downloads | Published CMS news and document links; empty states when nothing is published | `News.astro`, `HomeNews.astro`, `src/scripts/cms-public.js` |
| Contact | Headquarters telephone, fax, hotline and telephone links | `HeadquartersContact.astro`; no public submission form |
| SEO | Titles, descriptions, canonical URLs, alternate-language links, social metadata, structured data | `SEO.astro`; see `SITE_URL` and `PUBLIC_INDEXABLE` below |
| Admin | Chinese interface for editing and publishing selected content | `src/pages/admin.astro`, `src/scripts/admin.js`, `cms/`; one shared account |
| Chat / RFQ | Older backend and source files still exist | **No chatbot launcher or RFQ flow is mounted on current public Astro pages** |

`src/content/routes.json` lists 20 public routes per language (80 in total). `src/pages/[...path].astro` composes them. The public paths are: `/`, `/about/`, `/research/`, `/careers/`, `/legal/`, `/business/`, `/business/new-material/`, `/business/food/`, `/business/environment/`, `/business/information/`, `/news/`, `/contact/`, `/products/`, `/products/rad-spunrie/`, `/products/asphalt-based-products/`, `/products/cement-based-products/`, `/products/safety-monitoring-systems/`, `/products/integrated-solutions/`, `/products/functional-additives/`, and `/products/colour-systems/`. Add `/en`, `/es`, or `/fr` before a path for those languages.

The public UI has responsive layouts, a skip link, keyboard focus styling, and horizontally scrollable wide tables. Browser checks cover desktop, phone, and tablet, but this is not a full accessibility audit.

## Product and company information

- `src/content/businesses.json` and `corporate.json` hold initial group and business copy. Their source labels do not prove company approval.
- `product-examples.json` defines six category cards. `catalogue.ts` and related files define featured products. `official-products.json` stores an archive from the new-materials official site; `official-product-translations.json` supplies translated display text. Archive entries link to source URLs.
- `FoodCatalogue.astro` integrates the Food PDF into structured sections rather than raw PDF text. It shows page references. Editing those tables requires a code change and rebuild.
- `src/i18n/` provides interface translations. CMS database translations exist only for Chinese and English.
- `public/` contains public assets prepared by `tools/prepare-public.mjs`.

## How database edits appear

Astro builds the initial site as static HTML. On Chinese and English pages, `src/scripts/cms-public.js` fetches `GET /api/cms/public?locale=zh` or `?locale=en` and overlays **published** entries onto matching sections. If the CMS request fails or MySQL is unavailable, the source-built website remains visible. Spanish and French do not fetch CMS entries.

| CMS entry | Visible result after publishing and refreshing | Boundary |
| --- | --- | --- |
| Page `home` | Hero heading and summary | Does not edit full layout or business cards |
| Page `contact` | Contact heading, summary, body, telephone, fax, hotline | Does not update every contact reference elsewhere |
| Other matching page | Existing corporate heading, intro, body | Does not create a new route |
| Business with matching slug | Detail title, lead, body; featured photo replaces its card and detail-header images | Does not rewrite the Food catalogue |
| Product | Latest Products card on `/products/`; `?product=slug` displays body and specifications with units/source labels | Does not automatically join a source-built category page or navigation |
| News | Published news cards | Does not create a permanent article route |
| Document | Download link on `/products/` | Does not create a new document page |

Gallery images, one video, and a PDF attachment can appear with supported published entries. A business's **featured image** replaces its card and detail-header images; extra gallery images appear separately. To diagnose an invisible upload, check the entry's type, slug, status, featured/gallery slot, page language, and whether the running site uses the same database and file storage. Uploading a file alone is insufficient: attach it, save the entry as Published, and refresh a Chinese or English page. Drafts are not returned by the public CMS API.

The CMS edits selected marked sections. It is not a full page builder. A product's category field does not create a new category route.

## Chinese admin workflow

Open `/admin/` with the Node server and MySQL running. One username and password come from environment variables; `CMS_ADMIN_*` takes precedence over legacy `CMS_BOOTSTRAP_*`. No admin password is read from the MySQL `cms_users` table. Sessions are stored in MySQL; write requests require CSRF validation. See `cms/router.js` and `cms/security.js`.

1. Choose pages, businesses, products, news, or downloads in the sidebar.
2. Select or create an entry. Set slug, display order, status, Chinese and English title/summary/body. Contact has telephone fields. Products can include category and specification rows containing label, value, unit, and source.
3. Upload or select a featured image, PDF attachment, up to 12 gallery images, and one MP4/WebM video. Uploads enter the media library immediately; save the entry to attach them. Removing an association does not delete the uploaded file; the library has a separate delete action.
4. Preview Chinese and English text. Save as Draft for internal work or Published for immediate display on supported public pages. The preview is text-focused, not a pixel-accurate page preview.
5. Existing entries have saved revisions that can be restored. Deleting an entry requires browser confirmation and is permanent. The shared account does not identify individual editors.

`cms/schema.sql` defines `cms_entries`, `cms_translations`, `cms_product_specs`, `cms_files`, `cms_entry_revisions`, and `cms_admin_sessions`. `cms/repository.js` handles SQL and file storage; `cms/router.js` handles the API and validates uploads. Media bytes live in `uploads/` or `CMS_UPLOAD_DIR`, while metadata lives in MySQL. Back up **both**. [CMS_SETUP.md](CMS_SETUP.md) lists upload limits and deployment requirements.

The admin's manual **Update chatbot knowledge** control writes a snapshot of published CMS products for the legacy backend. Publishing a product does not automatically refresh it. The current public site has no chatbot launcher. This control does not update Dify or the separate PDF RAG index.

## API and architecture

```text
src/content + Astro components ──build──> dist/ static pages
browser ──GET page───────────────────────> Node preview server
browser (zh/en) ──GET /api/cms/public────> cms/router.js ──> MySQL
admin browser ─────/api/cms/admin/*──────> cms/router.js ──> MySQL + uploads/
```

`astro.config.mjs` configures Astro. `tools/preview.mjs` serves only `dist/` and attaches API middleware from `tools/chat-plugin.mjs`, which calls `server.js`. `server.js` dispatches CMS, health, and legacy chat routes. The preview server does not serve the entire repository as public files. Never put private files in `public/`.

| API route | Purpose |
| --- | --- |
| `GET /api/cms/public?locale=zh|en` | Published entries; retired reinforcement content is filtered |
| `GET /api/cms/files/:id` | Serve permitted uploaded media |
| `POST /api/cms/login`, `GET /api/cms/session`, `POST /api/cms/logout` | Admin authentication |
| `/api/cms/admin/entries`, `/api/cms/admin/entries/:id` | Authenticated entry CRUD |
| `/api/cms/admin/files`, `/api/cms/admin/files/:id` | Authenticated media library |
| `/api/cms/admin/entries/:id/revisions` and restore path | Revision history and restoration |
| `/api/cms/admin/chat-knowledge` | Manual legacy product snapshot |

`SEO.astro` generates page metadata. `PUBLIC_INDEXABLE=true` enables indexable page metadata; `tools/prepare-public.mjs` writes `robots.txt` and headers. Set `SITE_URL` to the actual origin for accurate canonicals and sitemap. This does not confirm search-engine indexing.

### Older assistant and RFQ files

`server.js`, `rag/`, older root-level JavaScript, tests, and `/api/chat` remain. The chat route is **disabled by default** and returns 404 unless `ENABLE_LEGACY_CHAT=true` is set. `server.js` includes earlier Oceanpower/Jiangsu prompt material and a Haichuan persona path, provider configuration, and local fallback logic. The current Astro pages do **not** mount that UI. No paid model request is needed to build or use the current public site or CMS. The old RFQ source is also not in the present page flow. Reintroducing either requires a separate company/product scope review. Dify is not part of this build.

## Local setup

Use Node.js **22.12 or newer**, npm, and MySQL 8+ if you need the CMS. Run from the repository root. Keep actual credentials out of Git and shared documentation.

```powershell
npm ci
npm run dev              # Astro development server: http://127.0.0.1:4321/
npm run build            # Prepare assets, Astro check, build and validate dist/
npm start                # Build and start Node preview; default port 8000
npm run cms:migrate      # Create/update CMS tables
npm run cms:seed         # Create draft starter entries
```

Use `npm start` for a production-style local CMS check on one origin; admin is at `/admin/`. If port 8000 is occupied, stop the other process or change `PORT`. Review seed drafts before publishing. See [CMS_SETUP.md](CMS_SETUP.md) for MySQL and Render setup.

| Environment variable names | Purpose |
| --- | --- |
| `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD` | CMS database connection |
| `MYSQL_SSL_MODE`, `MYSQL_SSL_CA_FILE` | Hosted database TLS |
| `CMS_ADMIN_USERNAME`, `CMS_ADMIN_PASSWORD` | Shared login; legacy `CMS_BOOTSTRAP_USERNAME` and `CMS_BOOTSTRAP_PASSWORD` are fallbacks |
| `CMS_UPLOAD_DIR` | Media bytes and legacy product snapshot |
| `HOST`, `PORT` | Preview listen address and port |
| `SITE_URL`, `PUBLIC_INDEXABLE` | Generated origin and indexing control |
| `ENABLE_LEGACY_CHAT`, `CHAT_API_URL`, `CHAT_API_KEY`, `CHAT_MODEL`, `CHAT_PERSONA`, `CHAT_KNOWLEDGE_FILE`, `CHAT_BACKEND_TOKEN`, `HAICHUAN_KB_NAME`, `ALLOWED_ORIGINS` | Legacy chat API; leave disabled for the current public site |

## Checks and open limits

```powershell
npm run check                 # JavaScript syntax
npm test                      # Node regression tests, including legacy modules
npm run build                 # Astro checks, build and route validation
npm run test:site             # Local desktop, phone, tablet and CMS checks
npm run test:admin-browser    # Local admin browser checks
```

The optional `npm run test:browser` and `npm run test:browser:playwright` target legacy RFQ behaviour; they do not prove the current public site offers RFQ. Browser tests need a Chromium-compatible browser. `test:site` writes ignored screenshots to `tmp/site-browser/`.

Previous local verification of this working tree reported: `npm run check` passed; `npm run build` generated 82 pages and validated 80 localised public routes; `npm test` passed 58/58; `npm run test:site` covered 80 routes at desktop, phone, and tablet sizes plus a mocked CMS overlay; `npm run test:admin-browser` passed. A local MySQL login and temporary draft create/edit/delete check also passed. These are **local** results; they do not establish that the deployed Render site has this branch or persistent media storage.

- Only Chinese and English are editable in admin. Spanish and French remain source-based.
- CMS entries overlay selected sections. Navigation, full layout, Food tables, category routes, and most static copy are not universally editable.
- News needs published entries. There is no public contact form, email/CRM integration, cart, or editorial approval workflow.
- One shared admin account cannot attribute edits to individuals. Publishing takes effect immediately on supported public views.
- Hosted uploaded files need persistent storage. A database record without its media bytes cannot display an image.
- Product specifications and company claims need staff verification. Source labels and filenames are not approval records.
- The public site has no chat or RFQ UI. The legacy backend chat API is disabled by default and needs a separate scope review before it is enabled.
- The local branch and deployed website may differ. Check the deployment commit and environment before comparing them.

## Files to inspect next

Start with `src/pages/[...path].astro` for page composition, `src/scripts/cms-public.js` for exactly where published edits appear, `src/scripts/admin.js` and `cms/router.js` for the edit/publish path, `cms/repository.js` and `cms/schema.sql` for storage, and `tools/preview.mjs` for serving the website. Read [CMS_SETUP.md](CMS_SETUP.md) for database/hosting operations and [DESIGN.md](DESIGN.md) for visual direction.
