# Oceanpower content migration — 13 October 2026

Reference: http://www.oceanpower.com/index_en.aspx

The old site is a content reference only. The existing Astro design, product catalogue, AI assistant and enquiry draft remain in use. Source text is paraphrased and organised into readable sections. New copy supports English, Chinese, Spanish and French.

## Added or edited

| Source content | Destination and treatment |
| --- | --- |
| Company Profile (`About_Index`), including its 42-image presentation | Added concise group overview and wider activities to `/about/`. Covers industrial investment, intelligent water systems, transport, energy/commodities, supply-chain cooperation and social responsibility. No presentation layouts copied. |
| CEO Message (`About_CEO`) | Added leadership message to the existing About page; no unverified current executive attribution. |
| Corporate Culture (`About_Culture`) | Added culture and employee-development overview to About. |
| Environmental Policy (`About_Policy`) | Added operational commitments, supplier responsibility, resource efficiency, training, emergency preparation and feedback to About. |
| R&D Platform, Central Research Institute, Standard Institute, R&D Environment (`Research_RDP`, `Research_CRI`, `Research_SI`, `Research_RDE`) | Created `/research/` covering the research system, subject areas, institute, testing capabilities, standardisation functions and Heyuan production technology centre. Historical statistics and individual records omitted. |
| Talent Strategy (`Human_TS`) | Created `/careers/` with people strategy, selection principles and career-development overview. |
| Contact Information (`Contact_Index`) | Added Shenzhen headquarters address, postal code, telephone, fax and hotline to existing Contact page; distinguished these from the existing Jiangsu FRP sales contact. |
| Legal Declaration (`Contact_Declaration`) | Created `/legal/` with an attributed summary of the old site's IP, information limitations, links, privacy and applicable-law declaration. It is explicitly about the legacy website, not an assertion that the prototype has adopted its policies. |
| Navigation | Added Research to the header; Research, Careers and Website Information to the footer; contextual links from About. |
| Localisation and validation | Added translations, localised metadata, sitemap routes and build-time checks for content, source links, translations and duplicate sections. |

All paths above have `/en/`, `/es/` and `/fr/` counterparts; Chinese uses the root path.

## Reused, not duplicated

- The four business company profiles and their existing cards already cover the source's New Material, Food, Environment and Information pages.
- Existing FRP products, technical comparisons, applications, Jiangsu company introduction, contact details and enquiry draft remain the only copies of those sections.
- Existing catalogue-based certificate/partner sections were not expanded or removed. No new certificate gallery was imported.
- The existing news route remains pending; no duplicate news section was created.

## Deferred for database-backed work

| Collection | Reason for deferral |
| --- | --- |
| Certifications and Quality System (`About_Cer`, `About_Quality`) | Certificate images, validity periods, issuers, scope and document files belong in managed records. The Quality System page is a certificate list, not a separate policy narrative. |
| Company News, Exhibition Reports, International Communication | Dated articles, events, images and pagination need a content collection. |
| Research projects, patents, publications, awards, equipment inventories and committee rosters | Record-based material with historical figures, appointments and dates. General research functions are included; individual records are not. |
| Group presentation project cases, member/partner logos, milestones, award documents and activity galleries | These are collection items; only the general activities were summarised. Conflicting dates and historic statistics were not presented as current figures. |
| Recruitment announcements and Joining Us submissions | Vacancy records and application storage are deferred. No form that pretends to submit an application was added. |
| Online Feedback submissions | No second enquiry form or backend storage was created; the existing local enquiry draft remains available. |
| Friendship Links | The English page has no populated content; a managed directory of associated sites is deferred. |

## Source notes

- Read the public page HTML and the same public JSON endpoints used by the website: `api/Manage/TuWen_Category_Second_Links/`. Static pages use `Links`; research pages additionally use `ID=0&CurrLang=En`.
- Read the 42 images embedded in the English Company Profile. Some slides contain Chinese text even on the English page. No source presentation or legacy styling was embedded in the website.
- The source mixes historic research plans and newer group presentations. Numeric records, names of committee officers and dated plans were not converted into current operational claims. Existing catalogue content was preserved, not independently recertified.
- Local audit downloads and visual review files are under ignored `tmp/`; they are not shipped as website content.
- Nothing was committed, pushed or deployed as part of this content edit.

## Validation

- Production build: 65 pages, including the 404 page; Astro reported zero errors or warnings.
- Validated 64 language routes, local links, anchors, metadata, sitemap assets and private-file isolation.
- Corporate and business content checks passed in English, Chinese, Spanish and French.
- All 17 automated tests passed.
- Browser suite passed across the route manifest at desktop, mobile and tablet sizes, including enquiry flows and language switching. Updated its summary to report the actual route count rather than the previous hard-coded count.
- Visually reviewed Research and Contact on desktop and Research in French on mobile.

## Follow-up: CEO, contact and header

- Restored the complete original English CEO message and portrait with a translated director caption; added Chinese, Spanish and French translations. The message uses a blue title and light-grey frame with the portrait beside the text.
- Replaced the homepage and Contact page blue FRP contact blocks with the Shenzhen headquarters address, telephone, fax and hotline. Removed the separate white headquarters section to avoid duplication.
- Added Careers to the header. Business and Research were already present. Removed the three cross-page links from the About sidebar; its section anchors remain.

### Careers completeness follow-up
Expanded Talent Strategy with management philosophy, employee share ownership, eight recruitment qualities, promotion procedures and role-change criteria from Human_TS. Added Joining us with an explicit link to the original Feedback_01_En.aspx?Human_JoiningUs_ application form. Application collection and storage remain deferred. All additions translated into Chinese, Spanish and French alongside English.

Joining us now includes a responsive 14-field local application form, translated in all four languages, required-field and word-limit validation, text-file download and reset. It does not submit or persist applicant data; backend submission and CAPTCHA remain deferred.

The Joining us form now opens in a modal dialog from Apply now. Includes a sticky close button, Escape/backdrop dismissal, focus restoration, page scroll lock and retained inputs when closed.

### Products overview
Added Products to the header and a localized /products/ overview with one representative item from each of the seven opxincai.com categories. GFRP reuses the existing detail page; other cards link to original details. Five official images downloaded; the solutions and colour-card image hosts returned 403, so those cards use category covers. Source: http://www.opxincai.com/pro.aspx?FId=n3:3:3

### Rad Spunrie internal detail
Added /products/rad-spunrie/ in four languages and changed its overview card to an internal link. Migrated the source overview, uses, mixing process, performance figures, dosage, pavement structure, compatibility table and summarized project examples. Historical performance is attributed to the reference; certificates/report collections remain deferred. Source: http://www.opxincai.com/prod_view.aspx?TypeId=50035&Id=191&FId=t3:50035:3

### Empty category pages
All seven overview links now open internal category pages with headings only. Existing standalone product pages remain available separately. New monitoring, infrastructure, additives and colour-swatch SVG illustrations are in public/category-images. Add future paragraph text to each entry's content.en, content.zh, content.es and content.fr arrays in src/content/product-examples.json. There is no browser editing interface.

### Category photographs
Replaced the four category illustrations with real photographs. Monitoring equipment and tunnel-project photographs come from the original opxincai.com catalogue. Representative laboratory photograph: https://www.pexels.com/photo/scientists-experimenting-in-the-laboratory-9243576/ ; representative colour swatches: https://www.pexels.com/photo/a-spread-of-paint-color-swatches-6583367/ . Stock images illustrate the categories and do not depict Oceanpower facilities or staff.
