# Design

> Source of truth for Oceanpower website typography, color, motion, layout, and interface behavior.
> Read this before changing the UI in a future session.

## Aesthetic direction

Industrial editorial - an engineering-materials laboratory with precise data presentation, restrained glass surfaces, and catalogue photography.

## Dials

- DESIGN_VARIANCE: 7 / 10
- MOTION_INTENSITY: 4 / 10
- VISUAL_DENSITY: 5 / 10

## Type stack

- Display and body: Manrope, weights 400-800.
- Technical labels and figures: DM Mono, weights 400-500.
- Loaded through Google Fonts in `index.html`.
- Maximum of two type families.

## Color tokens

- Ink: `#061b3d` - engineering navy.
- Blue: `#0758d5` - functional action color.
- Aqua: `#19dbc7` - material-science accent.
- Paper: `#f6f5f0` - warm neutral base.
- Line: `#d9ddd8` - dividers and table rules.

Use aqua as the single visual accent. Avoid purple gradients, neon effects, and decorative status colors.

## Motion

- CSS easing: `cubic-bezier(0.16, 1, 0.3, 1)`.
- Animate only opacity and transform.
- No bounce or elastic motion.
- Respect `prefers-reduced-motion`.

## Layout

- Split-screen, left-aligned hero.
- Maximum working width is controlled with section padding rather than a centered narrow column.
- Product and demo grids are intentionally asymmetric on desktop and single-column on mobile.
- Mobile interactive targets are at least 44 px.
- Chat is a fixed bottom-right panel with a maximum width of 410 px.

## Component inventory

- Sticky site header and mobile navigation.
- Split hero with catalogue-derived imagery and technical figures.
- Product platform cards.
- Specification table.
- Sales-assistant capability rows.
- Buyer-scenario controls.
- Accessible chatbot with loading, success, source, fallback, and error states.
- Expandable two-column enquiry workspace with conversational collection and an editable RFQ draft.
- Password-protected content manager using the same industrial editorial palette, typography and accessibility floor.

## Content manager

- The administration screen is a dense working interface: content types on the left, records in the middle and the editor on the right.
- Chinese and English fields are visible together so staff can compare translations before saving.
- Draft and published states use text labels rather than color alone.
- File uploads, empty lists, database errors and successful saves have explicit status text.
- Mobile collapses navigation, records and editor into a single vertical flow.
- The content manager is always `noindex` and never exposes database or account credentials to browser JavaScript.

## Enquiry workspace

- “Prepare enquiry” is a distinct action; ordinary catalogue questions remain normal chat messages.
- Desktop expands the existing chat panel into conversation and draft columns. Mobile stacks the draft below the conversation.
- RFQ fields use the same industrial-editorial type, navy action treatment, aqua accent, square controls, and visible focus rings as the existing interface.
- Unknown and missing information must remain explicit. Requested delivery is always labelled as a customer request, never a delivery promise.
- Confirmation means “ready for staff review” only. The interface must state that nothing was sent.
- The pilot draft remains in memory for the current page only; closing the panel or switching language preserves it, while reset or page reload clears it.
- The deterministic draft engine (`rfq.js`) and presentation layer (`rfq-ui.js`) remain separate so chat collection and direct field edits share one state object.
- The summary may collapse on smaller screens, but missing, unknown, and unresolved states must remain available for review. Clipboard failures expose a selectable plain-text fallback.

## Brand voice

- Direct, technical, careful, and internationally understandable.
- Treat technical figures as catalogue references, not final design approval.
- Never claim a certification, project, price, delivery date, or stock position without approved evidence.
- Use “preliminary match,” “catalogue reference,” and “human review” where appropriate.

## Accessibility floor

- WCAG 2.2 AA body-text contrast.
- Visible focus rings for every interactive control.
- Sequential headings and semantic controls.
- Labels for all form inputs.
- Escape closes the chat panel and focus returns to the launcher.
- Reduced-motion mode supported.

## Responsive behavior

- Phone and tablet layouts are first-class states for both the public website and content manager.
- Public navigation collapses before links become crowded; editorial grids become one column below 850 px.
- The content manager uses a two-column index at tablet width, then a single vertical workflow below 700 px.
- Phone forms use 16 px controls to prevent automatic iOS zoom, with at least 44 px touch targets and 8 px separation between adjacent actions.
- Long titles, URLs and filenames must wrap inside their own column without causing viewport-level horizontal scrolling.
- At narrow phone widths, destructive and primary editor actions stack to avoid cramped or accidental taps.

## Project-specific bans

- No API keys in browser JavaScript.
- No unsourced technical claims.
- No final engineering approval or automated quotation.
- No unnecessary personal-data collection.
- No three equal feature cards on desktop.
- No emoji decoration.

## Last updated

2026-10-14 - Hardened phone and tablet layouts for the public website and Chinese content manager, with automated overflow and touch-target checks.
2026-10-13 - Switched the content-manager interface and operational messages to Chinese-first copy with a Simplified Chinese typeface.
2026-10-13 - Added the local MySQL content-manager design for bilingual pages, businesses, products, news and documents.
2026-09-29 - Integrated catalogue credentials, partner artwork, fiber specification tabs and the separate buyer-demo page with the existing RFQ workspace.
2026-09-29 - Refined explicit RFQ field states, mobile review, and manual-copy fallback.
2026-09-29 - Added the bilingual, editable in-memory RFQ workspace and confirmation states.
2026-09-22 - Added integration-ready catalogue-grounded AI sales assistant states and accessibility rules.
