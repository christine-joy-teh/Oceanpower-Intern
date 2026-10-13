# Migration validation

The build generates 52 localized content routes (36 from the reference route table, 12 product pages, four demo pages) and a 404 page.

Validation commands:

- npm test: legacy server and enquiry engine regressions (14 tests).
- npm run build: Astro diagnostics, production build, metadata/JSON-LD/local-resource/anchor/private-file checks across all 52 routes.
- node tools/check-translations.mjs: retained customer-facing text coverage in Chinese, Spanish and French.
- npm run test:site: actual headless Chromium/Edge checks of all 52 routes at 1440 px, plus all routes at 360 and 768 px (104 phone/tablet views); console/page errors; four-language enquiry review/edit/completion; product return links; language routing; specification tabs and local catalogue answers. External font requests are replaced with an empty stylesheet to keep tests deterministic, so screenshots use fallback fonts.
- npm audit: installed dependency advisories.

The browser suite serves the production build with the generated Content-Security-Policy. Screenshots are stored in ignored tmp/site-browser. This is not a comprehensive accessibility certification or a physical-device/onscreen-keyboard test.

Cloudflare credentials, domain binding and actual deployment are not tested because no account/project access was supplied. GitHub workflow configuration is provided but has not been run on GitHub. Spanish/French copy requires native-language and company review before launch. Real enquiry delivery remains intentionally unconnected.

## AI chatbot reconnection

The Astro dev/preview middleware reuses the original Node chat API. Added integration tests cover the middleware, Pages bridge routing/origin/body limits/secret handling and unavailable-backend responses. Browser checks exercise the real local fallback plus a mocked live-provider response, conversation history, selected locale and safe text rendering. Tests never call a paid provider. Company source content and catalogue specifications were not edited for this change. Cloudflare hosting and a real provider response still require deployment/configuration validation.

Launch verification: Astro dev was checked through its actual HTTP endpoint /api/health/. API requests use trailing slashes to comply with the documented site routing. npm run preview uses an explicit dist server because Astro static preview excludes user plugins. The production-preview integration test covers built pages, chat health and private-file isolation.
