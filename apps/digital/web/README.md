# @mekong/web — Landing Page

Astro 5 landing site cho Mekong Digital. 11-section single-page landing với A/B test 4 variants qua URL param `?v=`.

## Stack

- **Astro 5** — static site generator
- **Tailwind 4** — via `@tailwindcss/vite` plugin (NOT v3 syntax)
- **TypeScript strict** — no React/Vue islands
- **Be Vietnam Pro** — Google Fonts CDN with preload

## Development

```bash
# Install dependencies (from repo root)
pnpm install

# Run dev server
pnpm --filter @mekong/web dev

# Build
pnpm --filter @mekong/web build

# Type check
pnpm --filter @mekong/web typecheck
```

## Variants (A/B test)

Append `?v=` to URL to test different hero copy:

| URL | Variant |
|-----|---------|
| `/` | generic (default) |
| `/?v=ocop` | OCOP businesses |
| `/?v=htx` | HTX cooperatives |
| `/?v=tourism` | Homestay/tourism |

## Environment Variables

Create `.env` locally (NOT committed):

```env
PUBLIC_API_URL=https://lead-api.mekong-digital.workers.dev
```

## Structure

```
src/
├── layouts/Layout.astro     # Base HTML, fonts, meta, JSON-LD
├── pages/
│   ├── index.astro          # Home — 11 sections
│   └── thank-you.astro      # Post-form success
├── components/              # 10 Astro components (pure, no React)
├── lib/
│   ├── variant.ts           # Type + parseVariant()
│   └── content.ts           # Vietnamese copy per variant
└── styles/global.css        # Tailwind 4 @import + @theme tokens
```

## Sections (11)

1. Header (sticky)
2. Hero (variant-aware)
3. PainPoints (3 cards)
4. Services (5 cards)
5. Pricing (3 tiers)
6. Testimonials (3 cards — TODO: replace placeholders)
7. About (founders — TODO: replace placeholders)
8. LeadForm (POST to Worker API)
9. FAQ (5 items, native details accordion)
10. Footer
11. Thank-you page (separate route)
