# Oceanpower International Website Prototype

A front-end concept site for **Jiangsu Oceanpower New Material Technology Co., Ltd.** The prototype reframes Oceanpower for overseas marketing: a premium "Digital Materials Lab" visual direction, bilingual English/Chinese content, and an AI sales-concierge demonstration.

## What this prototype demonstrates

- A modern English-first experience for overseas engineers, contractors, and distributors.
- A Chinese/English language switch in the top navigation. The choice is remembered in the browser.
- Catalog-based GFRP, BFRP, and CFRP product messaging and GFRP performance figures.
- A lightweight AI Sales Concierge demo with product questions, project matching, and RFQ guidance.
- Three clickable international buyer journeys:
  - German infrastructure engineer - technical tunnel inquiry.
  - Middle East coastal bridge contractor - corrosion-focused RFQ.
  - Southeast Asian distributor - partnership qualification.
- A visual sales path from discovery to qualified lead and sales review.

## Current pilot status

The AI concierge now has a working same-domain API layer with two modes:

- **Catalogue demo:** works immediately and answers common questions from approved catalogue facts.
- **Direct AI mode:** connects server-side to Qwen or another OpenAI-compatible endpoint and includes the approved Oceanpower knowledge file in the protected system prompt. MaxKB is optional rather than required for the pilot.

It does not yet save leads, access a CRM, send emails, or generate real quotes. Those actions remain human-reviewed.

The site is safe to present as a concept. Do not present it as a live technical-advice or quotation system until the production workflow is connected and approved.

## Open the site

Run the included Node server so the chat API and website use the same domain:

1. Open PowerShell in the `intern` website folder.
2. Run `npm start`.
3. Open `http://localhost:8000`.
4. Click **中文** in the header to switch the key website content and assistant to Chinese. Click **EN** to switch back.
5. Click **AI Sales Concierge** at the lower-right corner to test the assistant.
6. Scroll to **Live Demo Mode** and select a buyer scenario.

The site starts in catalogue-demo mode. To connect Qwen directly without MaxKB:

1. Copy `.env.example` to `.env`.
2. Set the Alibaba Cloud Model Studio China-region `CHAT_API_URL` and `CHAT_API_KEY` in `.env`.
3. Set `CHAT_MODEL=qwen-flash` and keep `CHAT_KNOWLEDGE_FILE=knowledge/oceanpower-approved-knowledge.md`.
4. Restart `npm start`.

Never put the API key in `script.js` or `index.html`.

## Project files

| File / folder | Purpose |
| --- | --- |
| `index.html` | Page structure, sales sections, AI chat interface, and overseas buyer scenarios. |
| `styles.css` | Main responsive layout and core Oceanpower visual system. |
| `lab.css` | Digital Materials Lab visual layer: glass panels, clean surfaces, and demo-mode styling. |
| `script.js` | Mobile menu, language switching, AI demo responses, and buyer-journey interactions. |
| `server.js` | Static server, protected AI proxy, rate limit, provider adapter, and local catalogue fallback. |
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
6. Explain that the final conversation creates a structured RFQ for sales review instead of leaving the visitor with a generic contact form.

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

- No backend, database, authentication, or persistent lead storage.
- No live document retrieval or real AI API connection.
- No automated CRM, email, WhatsApp, or WeCom handoff.
- The language switch covers the key customer-facing content and AI demo. A production release should translate every piece of visible content, metadata, downloadable asset, form, and error message.

## Contact details currently shown

The prototype contains contact details from the provided catalog. Reconfirm them before external publication:

- Jiangsu Oceanpower New Material Technology Co., Ltd.
- No. 6, Guangming Scientific-pioneer Park, Biancheng Town, Jurong City (Zhenjiang), Jiangsu Province, China.
- Telephone: 0086-87618886
- Fax: 0086-87618882
- Website shown in catalog: `www.jsopmaterial.com`
