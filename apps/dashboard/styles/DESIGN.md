# Mekong — Claude Design System

A warm, editorial, Anthropic-flavored visual language for the Mekong dashboard
and landing site. Cream paper, ink text, clay accent, restrained shadows,
serif headlines.

The token file is the source of truth:
[`apps/dashboard/styles/tokens/claude-design.css`](./tokens/claude-design.css).

## Palette

| Role | Token | Light | Dark |
| --- | --- | --- | --- |
| Page bg | `--surface-page` | `#faf9f5` cream | `#1a1916` warm dark |
| Raised | `--surface-raised` | `#f5f1e8` | `#211f1b` |
| Card | `--surface-card` | `#ffffff` paper | `#25231e` |
| Primary text | `--text-primary` | `#1f1f1c` ink | `#f3eee0` |
| Secondary | `--text-secondary` | `#6b6a64` ash | `#b6b1a3` |
| Muted | `--text-muted` | `#8a8983` | `#8e8a7e` |
| Border | `--border-default` | `#e8e1d4` | `#34322c` |
| Accent | `--accent` | `#d97757` clay | same |
| Accent deep | `--accent-hover` | `#c96342` | same |

The accent (clay/orange) is the only saturated color. Avoid blues, neons,
gradients, drop shadows beyond `--shadow-md`.

## Typography

- Headlines / display → **serif**, `var(--font-serif)`
  (Tiempos → Iowan Old Style → Apple Garamond → Source Serif → Georgia).
  Anything labeled `claude-h1`, `claude-h2`, `claude-display`, `claude-prose`.
- Body / UI → **sans**, `var(--font-sans)` (Söhne → Inter → system).
- Code / data → **mono**, `var(--font-mono)` (Söhne Mono → JetBrains Mono → Menlo).

Sizes use the `--font-3xs … --font-4xl` ramp. Tracking uses
`--tracking-tight` for big headlines and `--tracking-loose` for eyebrow caps.

## Utility classes

Drop-in replacements when you don't want to compose six Tailwind tokens:

| Class | What it is |
| --- | --- |
| `claude-eyebrow` | Small caps clay-colored label above a heading |
| `claude-display` / `claude-h1` / `claude-h2` / `claude-h3` | Heading scale |
| `claude-body` / `claude-body-lg` / `claude-prose` | Body copy (last one is serif, for long-form) |
| `claude-card` / `claude-card-tight` | Surface card with border + radius |
| `claude-btn` / `claude-btn--primary` / `claude-btn--ghost` | Pill buttons |
| `claude-chip` | Small uppercase tag |
| `claude-divider` | 1-px hairline rule |
| `claude-mono` | Monospace text |
| `claude-paper-grain` | Subtle warm dotted texture |

Existing pages that already use `var(--surface-card)`, `var(--text-primary)`,
`var(--spacing-xl)`, `var(--font-2xl)`, etc. reskin automatically — those
variables are now Claude-flavored.

## Light / dark switching

The root layout no longer hard-codes `className="dark"`. Default is the
cream/ink light theme. To opt into dark mode at runtime add `dark` to the
`<html>` element:

```html
<html class="dark">…</html>
```

A typical pattern:

```tsx
// in layout.tsx or a small client script tag
<script dangerouslySetInnerHTML={{ __html: `
  try {
    var t = localStorage.getItem('theme');
    if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
  } catch (_) {}
`}} />
```

## Do / Don't

**Do**
- Lead with serif for any first-screen / hero headline.
- Pair sans body copy with serif headings — never reverse.
- Keep accent usage to ~5% of any view (one button, one underline, one chip).
- Use generous whitespace — `--spacing-xl` between major blocks.
- Borders before shadows. If you must shadow, use `--shadow-md` max.

**Don't**
- Don't introduce new colors. If you need one, derive it from `--claude-clay`
  or extend the token file.
- Don't use Tailwind `bg-slate-*`, `bg-zinc-*`, `bg-gray-*` — they fight the
  warm palette. Use `bg-[var(--surface-...)]`.
- Don't use `text-blue-500`-style hard-coded link colors. Use
  `var(--text-accent)`.
- Don't use heavy shadows or hard borders — the system is paper-soft.

## Landing site parity

`landing/tailwind.config.js` mirrors the same palette/fonts/scale. Use the
component classes in `landing/input.css` (`h-display`, `h-1`, `h-2`,
`eyebrow`, `lede`, `surface-card`, `band-paper`, `band-cream`, `btn`,
`btn-primary`, `chip`).

## Adding a new token

1. Open `apps/dashboard/styles/tokens/claude-design.css`.
2. Add the variable in the right block (Surfaces / Text / Borders / Spacing / …).
3. If it has a different value in dark mode, mirror it inside the `.dark`
   block at the bottom.
4. If the landing site needs it, add the equivalent under
   `landing/tailwind.config.js` `theme.extend.*` and (if necessary) a class
   in `landing/input.css`.

## Verification

Static check (run from repo root):

```bash
python3 -c "
import re, os
defined = set(m.group(1) for m in
  re.finditer(r'(--[a-z0-9-]+)\s*:',
              open('apps/dashboard/styles/tokens/claude-design.css').read(), re.I))
referenced = set()
for root, _, files in os.walk('apps/dashboard/app'):
    for fn in files:
        if fn.endswith(('.tsx', '.ts')):
            for m in re.finditer(r'var\(\s*(--[a-z0-9-]+)\s*\)',
                                 open(os.path.join(root, fn)).read(), re.I):
                referenced.add(m.group(1))
missing = referenced - defined
print('missing tokens:', sorted(missing) or 'none')"
```

Then preview live:

```bash
cd apps/dashboard && npm run dev
# open http://localhost:3000
```
