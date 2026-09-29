# Oceanpower International Website Prototype

A front-end concept site for **Jiangsu Oceanpower New Material Technology Co., Ltd.** The prototype reframes Oceanpower for overseas marketing: a premium "Digital Materials Lab" visual direction, bilingual English/Chinese content, and an AI sales-concierge demonstration.

## What this prototype demonstrates

- A modern English-first experience for overseas engineers, contractors, and distributors.
- A Chinese/English language switch in the top navigation. The choice is remembered in the browser.
- Catalog-based GFRP, BFRP, and CFRP product messaging and GFRP performance figures.
- A lightweight AI Sales Concierge demo with product questions and editable, bilingual RFQ drafts.
- Three clickable international buyer journeys:
  - German infrastructure engineer - technical tunnel inquiry.
  - Middle East coastal bridge contractor - corrosion-focused RFQ.
  - Southeast Asian distributor - partnership qualification.
- A visual sales path from discovery to qualified lead and sales review.

## Current pilot status

The AI concierge now has a working same-domain API layer with two modes:

- **Catalogue demo:** works immediately and answers common questions from draft catalogue content, with draft source labels.
- **Direct AI mode:** optionally connects server-side to an OpenAI-compatible endpoint and includes the draft Oceanpower knowledge file in the protected system prompt. A valid URL, key, model identifier, and non-empty knowledge file are required. Invalid configuration or provider failure produces an explained local fallback. Provider references remain unverified.

RFQ collection and editing work locally without an AI API key. Confirmation means the visitor has checked the draft for subsequent staff review; nothing is submitted or sent. It does not save leads, access a CRM, send emails, or generate real quotes.

The site is safe to present as a concept. Do not present it as a live technical-advice or quotation system until the production workflow is connected and approved.

## Open the site

Run the included Node server so the chat API and website use the same domain:

1. Open PowerShell in the `intern` website folder.
2. Run `npm start`.
3. Open `http://localhost:8000`.
4. Click **中文** in the header to switch the key website content and assistant to Chinese. Click **EN** to switch back.
5. Click **AI Sales Concierge** at the lower-right corner to test the assistant.
6. Scroll to **Live Demo Mode** and select a buyer scenario.

The site starts in catalogue-demo mode; leave provider settings empty for this milestone. If a provider is later authorized:

1. Copy `.env.example` to `.env`.
2. Set the approved provider's `CHAT_API_URL` and `CHAT_API_KEY` in `.env`.
3. Set `CHAT_MODEL` to a valid model identifier from that provider. The existing `knowledge/oceanpower-approved-knowledge.md` filename contains draft material despite its name.
4. Restart `npm start`.

Never put the API key in `script.js` or `index.html`.

## Editable RFQ pilot

Open the concierge and choose **Prepare enquiry / 准备询价**. Ordinary product questions do not start an RFQ. During collection, product questions still use the existing catalogue service and the next outstanding enquiry question resumes afterwards.

The `fields` array in `rfq.js` defines the provisional requirements, order, English/Chinese labels, and follow-up questions together: application, product family/variant, dimensions with units, quantity with unit, destination, and requested delivery timeframe. Company and contact are optional. Management has not approved these requirements.

One in-memory draft drives both the conversation and editable summary. Visitors can provide several details at once, answer short follow-ups, correct quantities, mark details **Unknown**, or edit any field in the summary. Missing, unknown, and ambiguous information stays visible and can remain in a confirmed incomplete draft. Editing a confirmed draft requires confirmation again. **Copy enquiry** copies readable text, with a manual-copy fallback when browser clipboard access is unavailable.

Language changes and closing/reopening chat preserve the draft. **Reset chat & draft** or a page reload clears it. Only the existing language preference uses browser storage; RFQ details do not.

### Fictional demonstration

1. Run `npm start`, open `http://localhost:8000`, and choose **Prepare enquiry**.
2. Paste: `Sand-coated GFRP rebar, 16 mm, 2,000 metres, for a coastal retaining wall in Johor, Malaysia. Requested delivery: November 2026.`
3. Send: `Actually, make that 1,500 metres.`
4. Switch to Chinese. Open the **询价草稿** summary if collapsed, and check that the quantity remains `1,500 metres`.
5. Choose **确认草稿，供工作人员审核**. The result says the draft is ready for staff review and **尚未发送** (nothing sent).
6. Try **复制询价**. Edit a field to demonstrate that confirmation is cleared until the visitor checks it again.

Dates stay customer requests, units are preserved without conversion, and the draft does not approve suitability, price, availability, or delivery. Use fictional details in demonstrations.

### Verification

Run `npm run check` and `npm test` for syntax, RFQ state/parser cases, and the existing server regressions (including private-file protections and mock-provider safeguards). These tests make no paid requests.

The browser regressions are separate so the website keeps zero runtime dependencies. The existing `npm run test:browser` command uses a locally installed Windows Edge or Chrome and Node's native WebSocket support (Node 22+). An existing browser binary can also be supplied through `CHROMIUM_EXECUTABLE_PATH`.

For the extended suite on any platform, install Playwright without changing the project manifest using `npm install --no-save --package-lock=false playwright`, then `npx playwright install chromium`, and run `npm run test:browser:playwright`. It starts its own server with provider settings disabled and blocks external requests. It covers the full fictional flow, summary edits, language and reopen preservation, reload/reset clearing, rockbolt clarification, question interruption, incomplete drafts, clipboard fallback, and a mobile viewport. Screenshots are written to the ignored `tmp/rfq-browser/` directory.

## Project files

| File / folder | Purpose |
| --- | --- |
| `index.html` | Page structure, sales sections, AI chat interface, and overseas buyer scenarios. |
| `styles.css` | Main responsive layout and core Oceanpower visual system. |
| `lab.css` | Digital Materials Lab visual layer: glass panels, clean surfaces, and demo-mode styling. |
| `script.js` | Mobile menu, language switching, AI demo responses, and buyer-journey interactions. |
| `rfq.js` | Shared deterministic draft state, provisional field schema, bilingual follow-ups, parsing, and plain-text export. |
| `rfq-ui.js` | Editable RFQ summary, unknown fields, copying, and visitor confirmation. |
| `server.js` | Static server, protected AI proxy, rate limit, provider adapter, and local catalogue fallback. |
| `tests/` | Server and RFQ regressions, plus the optional Playwright browser flow. |
| `knowledge/oceanpower-approved-knowledge.md` | Draft catalogue-grounded content to import into MaxKB after engineering review. |
| `docs/OCEANPOWER_AI_CHATBOT_PROPOSAL.md` | Management proposal, platform comparison, cost model, architecture, and rollout plan. |
| `assets/` | Images extracted from the supplied Oceanpower FRP Rebar Catalog. |
| `Oceanpower New Material---FRP Rebar Catalog.pdf` | Original supplied catalog source. |

## Content source and accuracy

The supplied catalog is the primary source for company background, product themes, GFRP performance values, applications, imagery, and contact information. Before publishing, Oceanpower should review every technical specification, contact detail, product name, standard, and project claim.

## Recommended presentation flow

Use this sequence when showing the prototype to management:

1. Start at the hero section: explain that it is designed for an overseas visitor arriving from Google, LinkedIn, an exhibition QR code, or a distributor referral.
2. Switch from English to Chinese, showing that local staff can use the same site.
3. Show products and engineering performance as proof of technical capability.
4. Open the AI Sales Concierge and choose **Tunnel project** or type a question.
5. Scroll to **Live Demo Mode** and select the Middle East coastal-bridge scenario.
6. Use **Prepare enquiry** to show an editable draft and visitor confirmation. Explain that the prototype does not send the draft to staff.

## Production AI plan

The recommended production workflow is:

```text
Website visitor
  -> Bilingual AI concierge
  -> Search approved Oceanpower product documents
  -> Ask project-qualification questions
  -> Generate structured RFQ / lead brief
  -> Sales-manager review
  -> CRM, email, WhatsApp, WeCom, or distributor follow-up
```

### Before building the live AI version

Collect these items from Oceanpower:

- Approved English and Chinese catalogues, datasheets, installation guides, certificates, and FAQs.
- Full current product list, specifications, dimensions, resin/material options, and standards.
- 6-10 approved overseas or domestic project case studies with photos.
- Official logo files, brand rules, factory photos, and export-market contact details.
- The lead destination: email inbox, Excel, HubSpot, Zoho, WeCom, WhatsApp, or another CRM.
- Clear sales-routing rules: product line, territory, language, project value, and urgency.
- Approval policy for quotations and outward-facing AI emails. Recommended: human approval before any quote or customer message is sent.

### Suggested technology choices

- **Website:** static site now; migrate to a hosted site when approved.
- **AI:** OpenAI API or another approved LLM provider, with English and Chinese system instructions.
- **Knowledge base:** approved Oceanpower documents only, indexed for search/retrieval.
- **Automation:** n8n to route qualified leads, create CRM records, notify sales, and request approval.
- **Security:** keep API keys server-side only. Never put a live API key in `script.js` or `index.html`.

## Deployment checklist

Before the site is public, complete these checks:

- [ ] Confirm legal company name, address, phone numbers, emails, and domain.
- [ ] Confirm all technical performance data with the engineering team.
- [ ] Add certificates, quality-control proof, and current project case studies.
- [ ] Review every Chinese and English translation with a native business/technical reviewer.
- [ ] Replace demo AI replies with a protected server-side AI integration.
- [ ] Add privacy policy, cookie notice, and form-consent language for overseas visitors.
- [ ] Set up analytics and conversion tracking.
- [ ] Connect RFQ submissions to the approved sales workflow.
- [ ] Test on mobile, desktop, English, and Chinese before launch.

## Current limitations

- A local Node server exists, but there is no database, authentication, or persistent lead storage.
- No live document retrieval. Direct AI is optional and remains unconfigured for this milestone.
- RFQ fields and product terminology are provisional. Collection uses deterministic English/Chinese patterns, not general natural-language understanding; use explicit field labels or the editor for complex phrasing.
- One product family/variant per draft. Multiple or ambiguous products require clarification or separate drafts. Requested dates are kept as entered, not interpreted as delivery commitments.
- Confirmation does not send anything or establish that staff have received, reviewed, or approved the enquiry. Drafts disappear on reset or reload.
- No automated CRM, email, WhatsApp, or WeCom handoff.
- The language switch covers the key customer-facing content and AI demo. A production release should translate every piece of visible content, metadata, downloadable asset, form, and error message.

## Contact details currently shown

The prototype contains contact details from the provided catalog. Reconfirm them before external publication:

- Jiangsu Oceanpower New Material Technology Co., Ltd.
- No. 6, Guangming Scientific-pioneer Park, Biancheng Town, Jurong City (Zhenjiang), Jiangsu Province, China.
- Telephone: 0086-87618886
- Fax: 0086-87618882
- Website shown in catalog: `www.jsopmaterial.com`
