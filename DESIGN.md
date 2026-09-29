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

## Enquiry workspace

- “Prepare enquiry” is a distinct action; ordinary catalogue questions remain normal chat messages.
- Desktop expands the existing chat panel into conversation and draft columns. Mobile stacks the draft below the conversation.
- RFQ fields use the same industrial-editorial type, navy action treatment, aqua accent, square controls, and visible focus rings as the existing interface.
- Unknown and missing information must remain explicit. Requested delivery is always labelled as a customer request, never a delivery promise.
- Confirmation means “ready for staff review” only. The interface must state that nothing was sent.
- The pilot draft remains in memory for the current page only; closing the panel or switching language preserves it, while reset or page reload clears it.

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

## Project-specific bans

- No API keys in browser JavaScript.
- No unsourced technical claims.
- No final engineering approval or automated quotation.
- No unnecessary personal-data collection.
- No three equal feature cards on desktop.
- No emoji decoration.

## Last updated

2026-09-29 - Added the bilingual, editable in-memory RFQ workspace and confirmation states.
2026-09-22 - Added integration-ready catalogue-grounded AI sales assistant states and accessibility rules.
