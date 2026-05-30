# MekongMind — Design Guidelines

## Brand Colors

| Token | Hex | Usage |
|-------|-----|-------|
| Primary | `#059669` | CTAs, links, active states |
| Secondary | `#10B981` | Accent, icons, highlights |
| Light | `#D1FAE5` | Subtle backgrounds, badges |
| Dark | `#064E3B` | Dark mode accents, hover states |
| Surface | `#0F172A` | Card/section backgrounds |
| Border | `#1E293B` | Dividers, card borders |
| Text Primary | `#F8FAFC` | Headings, body text |
| Text Secondary | `#94A3B8` | Subtle copy, descriptions |

## Typography

- **Headings:** Inter (700–800 weight). Google Fonts: `Inter:wght@400;500;600;700;800`.
- **Body:** Inter 400 weight, 16px base.
- **Code:** JetBrains Mono (500–600 weight) for code blocks, CLI output, inline `code` snippets.
- **Fallback stack:** `Inter, system-ui, -apple-system, sans-serif`.

## Spacing

- **Base unit:** 4px grid.
- **Standard increments:** 8, 16, 24, 32, 48, 64, 96 (px).
- **Section padding:** 96px top/bottom on desktop, 72px on tablet, 48px on mobile.
- **Content gap:** 16px between related elements, 24px between groups.

## Layout

- **Max content width:** 1120px (nav/footer/inner sections).
- **Alignment:** Centered with auto margins. Section titles left-aligned at desktop, centered at mobile.
- **Responsive breakpoints:** 900px (tablet), 600px (mobile).
- **Grid:** 2-column feature grids, 4-column pricing cards, collapse to single column on mobile.

## Tone & Voice

- **Technical, confident, minimal.** Developer-first copy. No fluffy marketing language.
- **Precise terminology.** CLI commands, API endpoints, and technical specs use monospace.
- **Active voice.** "Route developer missions" not "Missions are routed."

## Logo

- **Wordmark:** "MekongMind" with "Mekong" in white and "Mind" in accent green (`#10B981`).
- **Monochrome variant:** All white or all accent green for simple use cases (favicon, social cards).
- **Minimum clear space:** 16px around the wordmark on all sides.
- **No icon/logo mark.** The wordmark is the sole identity element.
