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

## Important: prototype status

The AI concierge is currently a **front-end demonstration**, not a live AI service. It uses predefined English and Chinese responses to show how a real qualification conversation could work. It does not send emails, save leads, access a CRM, or generate real quotes.

The site is safe to present as a concept. Do not present it as a live technical-advice or quotation system until the production workflow is connected and approved.

## Open the site

This is a static website with no installation step.

1. Open `index.html` in a modern browser.
2. Click **中文** in the header to switch the full website interface and AI demo to Chinese. Click **EN** to switch back.
3. Click **AI Sales Concierge** at the lower-right corner to test the assistant.
4. Open **Explore the guided buyer demo** to visit `demo.html` and select a buyer scenario.

For a simple local web-server preview, run either of the following from this folder:

```powershell
py -m http.server 8000
```

or

```powershell
npx serve .
```

Then visit the URL printed in the terminal, usually `http://localhost:8000`.

## Project files

| File / folder | Purpose |
| --- | --- |
| `index.html` | Page structure, sales sections, AI chat interface, and overseas buyer scenarios. |
| `styles.css` | Main responsive layout and core Oceanpower visual system. |
| `lab.css` | Digital Materials Lab visual layer: glass panels, clean surfaces, and demo-mode styling. |
| `script.js` | Mobile menu, language switching, AI demo responses, and buyer-journey interactions. |
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
5. Open the separate buyer demo page and select the Middle East coastal-bridge scenario.
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
- The website interface, metadata, image descriptions, form validation, RFQ briefs, and generated demo replies support English and Chinese. User-entered text is preserved in its original language; supplied catalogue files are not translated.

## Contact details currently shown

The prototype contains contact details from the provided catalog. Reconfirm them before external publication:

- Jiangsu Oceanpower New Material Technology Co., Ltd.
- No. 6, Guangming Scientific-pioneer Park, Biancheng Town, Jurong City (Zhenjiang), Jiangsu Province, China.
- Telephone: 0086-87618886
- Fax: 0086-87618882
- Website shown in catalog: `www.jsopmaterial.com`


## Quote request flow

One native modal dialog (`#rfq-drawer`) is shared by the navigation, specification card, bottom CTA, RFQ builder, CFRP card and chat entry points. `rfq.js` owns its form/review state, inline field validation, focus cycling, Escape/backdrop dismissal, scroll lock and focus restoration. A closed dialog is removed from keyboard navigation; `showModal()` makes the background inert. Hidden mobile-menu/chat triggers return focus to their visible launcher instead.

The drawer uses two form columns on desktop and one at 850px and below. It retains the existing navy, aqua, Manrope and DM Mono design system. The bottom of the page now has a compact CTA, not a second form. Reduced-motion preferences disable its short entrance animation.

Review RFQ shows a structured summary. Edit details preserves entered values. Send enquiry opens a prefilled email to info@jsopmaterial.com; the visitor must send it in their email app. Download brief remains available as a fallback. No email delivery service, database or CRM submission has been added, and no success/submitted state is claimed. The final engineering-review note is displayed beside the handoff actions. All new interface copy and errors support English and Chinese.

The GFRP card retains the approved values and semantic row/column headers, with refined hierarchy, numeric alignment and contained horizontal scrolling. The surrounding performance gradient and heading are unchanged.

### Verification

- `npm run check` checks all four JavaScript files.
- DOM integration checks exercised the shared entry points, validation, review/edit, safe text rendering, encoded email draft, bilingual state, focus cycling/return, dismissal and scroll restoration.
- Source-level responsive checks cover 1440, 1024, 768, 390 and 360px. A connected browser was unavailable during implementation; visually confirm those sizes, native keyboard/scroll behavior and the operating system's email handoff before release.
- Direct server submission would require an approved destination, email/CRM service and delivery/error handling; the current email-draft flow needs none of these.

## Buyer experience and partner artwork

- The homepage now places Applications directly after Performance. Scripted buyer journeys are retained on `demo.html`, linked from the sales-assistance section. Both pages share the same chat, RFQ, translation and navigation scripts.
- Product cards use photograph-only crops from the supplied catalogue. GFRP and BFRP show the material; CFRP shows the catalogue's carbon-fiber production equipment. Original catalogue images remain available in `assets/`.
- The partner panels reproduce the source artwork from PDF page 20 (printed pages 35–36). These are catalogue-listed organisations, not newly verified endorsements. Links open the source document.
- Material tabs are sticky below the site header within the specification card. Header links expose the active location through `aria-current`.
- Closed chat is hidden and inert. Escape/Close returns focus to the opener; opening an RFQ closes chat. The mobile launcher is compact and is hidden near specification/contact/footer actions when not focused or open.
- Hero secondary text uses navy/deep teal for contrast on its light background. Contact telephone and footer contact links are interactive.
- Syntax and simulated DOM checks passed on both pages, including chat focus, RFQ handoff, launcher suppression, translations and asset references. Live browser visual testing remains pending.
