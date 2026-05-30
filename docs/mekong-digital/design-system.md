# Design System — Mekong Digital (placeholder)

**Status:** v0.1 design system spec (decision-independent — work as-is even if name/brand thay đổi)
**Date:** 2026-04-28
**Source:** UI/UX Pro Max search (B2B agency + Vietnamese typography + Trust pattern)
**Stack:** Astro 5 / Next.js 15 + Tailwind 4 + shadcn/ui

> ⚠️ **Lưu ý:** Đây là khung design system. Logo/illustration cuối cùng cần designer thực thi sau khi chốt tên + brand direction (xem `bootstrap-brief` Q5).

---

## 1. Brand Direction

### Personality
**Professional + Local + Modern + Trust-first**, KHÔNG playful, KHÔNG AI-purple-gradient.

| Attribute | Yes | No |
|---|---|---|
| Tone | Đáng tin, chuyên nghiệp, gần gũi | Hipster, cute, gaming |
| Visual | Clean B2B, hint of Mekong (water, gentle curves) | Generic SaaS template, neon |
| Vietnamese-first | Be Vietnam Pro, đầy đủ dấu | Lorem ipsum, ASCII fallback |

### Reference style
**"Trust & Authority"** pattern: badges, certifications, case studies với metrics, customer logos, testimonials với photo + role.

---

## 2. Color Palette

### 2.1. Primary palette

| Token | Hex | Usage | Tailwind class |
|---|---|---|---|
| `--brand-900` | `#0F172A` | Primary text, dark surfaces | `slate-900` |
| `--brand-700` | `#334155` | Secondary text, headings | `slate-700` |
| `--brand-500` | `#0369A1` | CTA, links, brand primary | `sky-700` |
| `--brand-400` | `#0284C7` | Hover state CTA | `sky-600` |
| `--brand-100` | `#E0F2FE` | Subtle highlight bg | `sky-100` |
| `--bg-canvas` | `#F8FAFC` | Page background | `slate-50` |
| `--bg-surface` | `#FFFFFF` | Card surface | `white` |
| `--text-primary` | `#020617` | Body main | `slate-950` |
| `--text-muted` | `#475569` | Captions, meta | `slate-600` |
| `--border` | `#E2E8F0` | Default border | `slate-200` |

### 2.2. Semantic colors

| Role | Hex | Tailwind |
|---|---|---|
| Success | `#16A34A` | `green-600` |
| Warning | `#D97706` | `amber-600` |
| Error | `#DC2626` | `red-600` |
| Info | `#0369A1` | `sky-700` |

### 2.3. Local accent (subtle Mekong reference)

| Token | Hex | Usage |
|---|---|---|
| `--accent-mekong` | `#0E7490` | Water/river motif accent (10% surface max) |
| `--accent-rice` | `#CA8A04` | Warm secondary (rice/harvest), use sparingly |

**Rule:** Accent < 5% total visual weight. Brand-500 dominant CTA color.

### 2.4. Contrast verified

| Pair | Ratio | WCAG |
|---|---|---|
| `text-primary` on `bg-canvas` | 17.4:1 | AAA |
| `brand-500` on white | 5.85:1 | AA Large + AA Normal |
| `text-muted` on white | 7.04:1 | AAA |
| White on `brand-500` | 5.85:1 | AA |

---

## 3. Typography

### 3.1. Font stack

```css
@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=Noto+Sans:wght@400;500;600&display=swap');
```

| Use | Font | Weight |
|---|---|---|
| Headings (h1-h3) | **Be Vietnam Pro** | 700 (h1), 600 (h2), 600 (h3) |
| Subheadings (h4-h6) | Be Vietnam Pro | 500 |
| Body | Be Vietnam Pro | 400 |
| Code/mono | JetBrains Mono | 400 |
| Fallback | Noto Sans, system-ui | — |

**Lý do chọn Be Vietnam Pro:** purpose-built cho dấu tiếng Việt (đảm bảo `Đ`, `ă`, `ơ`, `ư` render hoàn hảo, KHÔNG bị clipping). Alternatives Plus Jakarta Sans / Inter cũng OK nhưng Be Vietnam Pro ưu việt cho local market.

### 3.2. Type scale (tailwind tokens)

| Element | Size | Line-height | Weight |
|---|---|---|---|
| h1 hero | `text-5xl md:text-6xl` (48-60px) | `leading-tight` (1.1) | 700 |
| h1 page | `text-4xl md:text-5xl` (36-48px) | `leading-tight` | 700 |
| h2 | `text-3xl md:text-4xl` (30-36px) | `leading-snug` (1.25) | 600 |
| h3 | `text-2xl md:text-3xl` (24-30px) | `leading-snug` | 600 |
| h4 | `text-xl` (20px) | `leading-snug` | 500 |
| body large | `text-lg` (18px) | `leading-relaxed` (1.625) | 400 |
| body | `text-base` (16px) | `leading-relaxed` | 400 |
| caption | `text-sm` (14px) | `leading-normal` (1.5) | 400 |
| meta | `text-xs` (12px) | `leading-normal` | 500 |

### 3.3. Line-length & vertical rhythm

- Body text container `max-w-prose` (~65ch) — KHÔNG full-width body
- Section vertical spacing: `py-16 md:py-24`
- Paragraph margin: `mb-4` (16px)
- Heading margin top: `mt-8 mb-4` (32px / 16px)

---

## 4. Spacing & Layout

### 4.1. Spacing scale (tailwind default 4px-base)

`0, 1 (4px), 2 (8px), 3 (12px), 4 (16px), 6 (24px), 8 (32px), 12 (48px), 16 (64px), 24 (96px)`

### 4.2. Container

```html
<div class="container mx-auto px-4 md:px-6 max-w-6xl"><!-- content --></div>
```

- Mobile: `px-4` (16px gutter)
- Tablet+: `px-6` (24px)
- Max width: `max-w-6xl` (1152px) — chuẩn cho B2B landing

### 4.3. Grid system

- 12-col grid (Tailwind `grid-cols-12`) on desktop
- Stack vertically below `md` breakpoint
- Common patterns: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`

### 4.4. Breakpoints (Tailwind defaults)

| Token | Min width | Use |
|---|---|---|
| `sm` | 640px | Phone landscape |
| `md` | 768px | Tablet portrait |
| `lg` | 1024px | Tablet landscape, small laptop |
| `xl` | 1280px | Desktop |
| `2xl` | 1536px | Large desktop (giảm dùng) |

### 4.5. Z-index scale

```ts
zIndex: {
  10: 'sticky elements',
  20: 'dropdowns, tooltips',
  30: 'mobile menu overlay',
  40: 'modal backdrop',
  50: 'modal content',
  60: 'toast notifications',
}
```

---

## 5. Components

### 5.1. Buttons

```html
<!-- Primary CTA -->
<button class="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-700 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-sky-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
  Đăng ký tư vấn miễn phí
</button>

<!-- Secondary -->
<button class="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-900 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-sky-500 transition-colors duration-200 cursor-pointer">
  Xem dịch vụ
</button>

<!-- Ghost -->
<button class="inline-flex items-center gap-1.5 text-sm font-medium text-sky-700 hover:text-sky-800 cursor-pointer transition-colors">
  Đọc case study
  <svg class="h-4 w-4" /* arrow-right */></svg>
</button>
```

**Sizes:** `sm` (`px-3 py-1.5 text-sm`), `md` (default), `lg` (`px-8 py-4 text-lg`)

**Touch target:** minimum 44x44px (vertical padding ≥ 12px on default size).

### 5.2. Cards

```html
<div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer">
  <div class="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100">
    <!-- SVG icon, NOT emoji -->
  </div>
  <h3 class="mb-2 text-xl font-semibold text-slate-900">Title</h3>
  <p class="text-base text-slate-600 leading-relaxed">Description...</p>
</div>
```

**Hover:** shadow tăng (KHÔNG scale transform — gây layout shift).

### 5.3. Form input

```html
<div class="space-y-1.5">
  <label for="name" class="block text-sm font-medium text-slate-700">Họ tên *</label>
  <input
    id="name"
    name="name"
    type="text"
    required
    autocomplete="name"
    class="block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-2 focus:outline-offset-0 focus:outline-sky-500 transition-colors"
    placeholder="Nguyễn Văn A"
  />
  <p class="text-xs text-slate-500">VD: tên người liên hệ chính</p>
</div>
```

**Error state:** `border-red-500 outline-red-500`, error message bên dưới `text-sm text-red-600 mt-1`.

### 5.4. Navigation

```html
<header class="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200">
  <nav class="container mx-auto flex h-16 items-center justify-between px-4 md:px-6 max-w-6xl">
    <a href="/" class="text-xl font-bold text-slate-900">Mekong<span class="text-sky-700">.</span>Digital</a>
    <div class="hidden md:flex items-center gap-8">
      <a href="#services" class="text-sm font-medium text-slate-700 hover:text-sky-700 transition-colors">Dịch vụ</a>
      <a href="#cases" class="text-sm font-medium text-slate-700 hover:text-sky-700 transition-colors">Case study</a>
      <a href="#pricing" class="text-sm font-medium text-slate-700 hover:text-sky-700 transition-colors">Gói giá</a>
      <a href="#contact" class="rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600 transition-colors cursor-pointer">Liên hệ</a>
    </div>
    <button class="md:hidden p-2" aria-label="Open menu">/* hamburger SVG */</button>
  </nav>
</header>
```

### 5.5. Hero

```html
<section class="relative overflow-hidden bg-gradient-to-b from-sky-50 to-white py-20 md:py-32">
  <div class="container mx-auto px-4 md:px-6 max-w-6xl">
    <div class="max-w-3xl">
      <div class="mb-4 inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1 text-sm font-medium text-sky-800">
        <span class="h-2 w-2 rounded-full bg-sky-600 animate-pulse"></span>
        Dành cho doanh nghiệp ĐBSCL
      </div>
      <h1 class="text-5xl md:text-6xl font-bold tracking-tight text-slate-900 leading-tight">
        Số hoá doanh nghiệp miền Tây — <span class="text-sky-700">đơn giản, có ROI.</span>
      </h1>
      <p class="mt-6 text-lg md:text-xl text-slate-600 leading-relaxed max-w-2xl">
        Web, POS, marketing online & truy xuất nguồn gốc cho SME ĐBSCL. Triển khai trong 2-6 tuần, có on-site Cần Thơ.
      </p>
      <div class="mt-10 flex flex-col sm:flex-row gap-4">
        <a href="#contact" class="inline-flex items-center justify-center rounded-lg bg-sky-700 px-8 py-4 text-base font-semibold text-white hover:bg-sky-600 transition-colors cursor-pointer">
          Đăng ký tư vấn miễn phí
        </a>
        <a href="#cases" class="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-8 py-4 text-base font-semibold text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer">
          Xem case study
        </a>
      </div>
      <!-- Trust strip -->
      <div class="mt-12 pt-6 border-t border-slate-200">
        <p class="text-xs uppercase tracking-wider text-slate-500 mb-4">Đối tác đáng tin cậy</p>
        <div class="flex items-center gap-8 opacity-60 grayscale">
          <!-- Partner logos: VCCI, Misa, KiotViet, Cloudflare -->
        </div>
      </div>
    </div>
  </div>
</section>
```

### 5.6. Pricing card

```html
<div class="relative rounded-2xl border-2 border-slate-200 bg-white p-8 shadow-sm">
  <h3 class="text-xl font-semibold text-slate-900">Starter</h3>
  <p class="mt-2 text-sm text-slate-600">Web doanh nghiệp căn bản</p>
  <div class="mt-6 flex items-baseline gap-2">
    <span class="text-4xl font-bold text-slate-900">5-12<span class="text-2xl">tr</span></span>
    <span class="text-sm text-slate-500">VNĐ / setup</span>
  </div>
  <ul class="mt-6 space-y-3 text-sm text-slate-700">
    <li class="flex gap-2"><svg class="h-5 w-5 text-green-600 flex-shrink-0">/* check */</svg>Tối đa 5 trang</li>
    <li class="flex gap-2"><svg class="h-5 w-5 text-green-600 flex-shrink-0" />Responsive mobile</li>
    <li class="flex gap-2"><svg class="h-5 w-5 text-green-600 flex-shrink-0" />Zalo OA + form liên hệ</li>
  </ul>
  <a href="#contact" class="mt-8 block w-full text-center rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer">
    Bắt đầu
  </a>
</div>

<!-- Highlighted: Standard tier -->
<div class="relative rounded-2xl border-2 border-sky-700 bg-white p-8 shadow-lg">
  <span class="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-sky-700 px-3 py-1 text-xs font-semibold text-white">Phổ biến nhất</span>
  <!-- ... -->
</div>
```

### 5.7. Testimonial

```html
<figure class="rounded-2xl bg-slate-50 p-8">
  <blockquote class="text-lg text-slate-900 leading-relaxed">
    "Đội Mekong Digital triển khai POS + Zalo OA trong 2 tuần, doanh thu online tăng 35% sau 3 tháng."
  </blockquote>
  <figcaption class="mt-6 flex items-center gap-4">
    <img src="/avatar.jpg" alt="Anh Nguyễn Văn A" class="h-12 w-12 rounded-full object-cover" />
    <div>
      <div class="font-semibold text-slate-900">Anh Nguyễn Văn A</div>
      <div class="text-sm text-slate-600">Chủ chuỗi cafe XYZ, Cần Thơ</div>
    </div>
  </figcaption>
</figure>
```

---

## 6. Landing Page Structure (Mekong Digital MVP)

Pattern: **Hero + Trust + Problem/Solution + Pricing + Testimonials + CTA**

```
1. [Header sticky]                                — nav, CTA
2. [Hero]                                         — value prop + 2 CTA + trust strip
3. [Pain Points] (3 cards)                        — "Bạn đang gặp...?"
4. [Services] (5 cards: Web/POS/Marketing/Zalo/Vertical) — link to detail or anchor
5. [Pricing] (3 tier visible: Starter/Standard/Premium)
6. [Case Study] (1-2 lighthouse, lazy-load)
7. [Testimonials] (3-5 quotes)
8. [About / Founders] (1 short paragraph + photo)
9. [Lead Form] (CTA section, full-width bg-sky-50)
10. [FAQ] (5-7 items, accordion)
11. [Footer]                                      — Zalo OA, social, contact, legal
```

A/B test variants: hero heading thay đổi theo `?v=ocop|htx|tourism|generic`.

---

## 7. Animation Guidelines

### 7.1. Micro-interactions

| Element | Duration | Easing |
|---|---|---|
| Button hover (color) | 150ms | ease-out |
| Card hover (shadow) | 200ms | ease-out |
| Link color change | 150ms | ease-out |
| Modal/dropdown open | 200ms | ease-out |
| Page transition | 300ms | ease-in-out |

### 7.2. Performance

- Animate `transform` và `opacity` ONLY (KHÔNG `width/height/top/left`)
- Limit fade-in animations to ≤3 simultaneous
- Use `will-change: transform` SPARINGLY (chỉ khi cần)
- KHÔNG parallax scroll (mobile heavy)

### 7.3. Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

Tailwind: `motion-safe:animate-fade-in motion-reduce:animate-none`.

---

## 8. Accessibility (WCAG AA minimum)

### 8.1. Mandatory

- [ ] Color contrast 4.5:1 cho text thường (đã verify mục 2.4)
- [ ] Focus state visible on tất cả interactive (`focus-visible:outline-2 focus-visible:outline-sky-500`)
- [ ] Tab order = visual order
- [ ] All form inputs có `<label for="">`
- [ ] Icon-only buttons có `aria-label`
- [ ] All images có `alt` (decorative: `alt=""`)
- [ ] Touch target ≥ 44x44px
- [ ] Heading hierarchy không skip (h1 → h2 → h3, không nhảy)
- [ ] Skip-to-content link đầu trang

### 8.2. Vietnamese-specific

- Font phải hỗ trợ đầy đủ dấu (Be Vietnam Pro ✓)
- Test với: `Đặng Quỳnh Hương ở Cần Thơ — viết về dứa, mật ong & nông sản OCOP`
- Lang attribute: `<html lang="vi">`
- Form placeholder Vietnamese, không Anh-Việt mix

### 8.3. Screen reader

- Live regions cho form submission: `aria-live="polite"`
- Modal: `role="dialog" aria-modal="true" aria-labelledby="..."`
- Loading states: `aria-busy="true"`

---

## 9. Tailwind Config Snippet

```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{astro,tsx,jsx,html}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Be Vietnam Pro"', '"Noto Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        brand: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          400: '#38BDF8',
          500: '#0EA5E9',
          600: '#0284C7',
          700: '#0369A1',
          800: '#075985',
          900: '#0C4A6E',
        },
        accent: {
          mekong: '#0E7490',
          rice: '#CA8A04',
        },
      },
      maxWidth: {
        'content': '65ch',
      },
      animation: {
        'fade-in': 'fade-in 300ms ease-out',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography'), require('@tailwindcss/forms')],
} satisfies Config;
```

---

## 10. Anti-patterns (KHÔNG LÀM)

| Anti-pattern | Lý do | Thay thế |
|---|---|---|
| Emoji icons (🚀💼📊) | Render khác nhau OS, thiếu chuyên nghiệp | Heroicons, Lucide SVG |
| AI purple/pink gradients | Generic SaaS template, không trust | Solid sky-700 hoặc subtle slate gradient |
| Glassmorphism dark mode quá đậm | Khó đọc, không phù hợp B2B trust | White/slate cards với border |
| Scale-on-hover transform | Layout shift, gây jitter | Shadow elevation change |
| Animation `width`/`height` | GPU không accelerate | `transform: scale()` hoặc `opacity` |
| Vietnamese font không hỗ trợ dấu | Clipping `Đ`, `ư`, `ơ` | Be Vietnam Pro / Noto Sans VN |
| Placeholder làm label | Mất khi typing, accessibility kém | Real `<label>` riêng |
| Z-index random (9999, 99999) | Conflict không kiểm soát | Theo scale 10-60 |
| Border-only buttons cho CTA chính | Yếu visual hierarchy | Solid bg cho primary CTA |
| Cold corporate stock photos | Không kết nối local | Local photography (Cần Thơ markets, OCOP, HTX) |
| Multi-color gradient text | Khó đọc, không trust | Solid color hoặc subtle 2-stop |

---

## 11. Implementation Checklist (Pre-Launch)

### Visual quality
- [ ] No emojis as icons (SVG only)
- [ ] Brand color consistent across all components
- [ ] Vietnamese diacritics render correctly trong tất cả font sizes
- [ ] Logo placement consistent (header + footer)
- [ ] Photo treatment uniform (filter/aspect ratio)

### Interaction
- [ ] Tất cả clickable elements có `cursor-pointer`
- [ ] Hover transitions 150-300ms
- [ ] Focus-visible ring on tab navigation
- [ ] Form errors hiển thị gần input
- [ ] Loading buttons disabled trong async ops

### Performance
- [ ] LCP <2.5s mobile (Cloudflare Pages target)
- [ ] CLS <0.1 (reserve image space)
- [ ] Hero image WebP + responsive srcset
- [ ] Fonts preload (`<link rel="preload">`)
- [ ] No render-blocking resources

### Mobile
- [ ] No horizontal scroll
- [ ] Touch targets ≥44px
- [ ] Hamburger menu accessible
- [ ] Forms usable on 375px

### SEO
- [ ] `<title>`, `<meta description>` Vietnamese
- [ ] Open Graph tags
- [ ] Schema.org Organization markup
- [ ] Sitemap.xml + robots.txt
- [ ] `lang="vi"` on html

### Legal/Local
- [ ] Privacy policy page (Vietnamese)
- [ ] Terms of service
- [ ] Contact info: địa chỉ Cần Thơ, MST (sau khi có), email, Zalo, Hotline
- [ ] Cookie banner nếu có analytics

---

## 12. Open Items (cần input từ user/founder)

1. **Logo:** chữ wordmark (đề xuất) hay icon-only? Designer cần brief.
2. **Brand name final:** confirm `Mekong Digital` hay tên khác?
3. **Hero hero illustration:** abstract Mekong waves (subtle SVG) hay local photography?
4. **Founder photos:** placeholder hay real photo Y1?
5. **Tone Vietnamese:** "anh chị" thân mật hay "quý khách" formal?
6. **Local imagery:** dùng AI-generated images (cảnh quan ĐBSCL) hay outsource photographer thật ($)?

→ Trả lời 1-6 để designer/dev triển khai chính xác. Nếu auto-decide: **wordmark + slate underline accent + abstract Mekong waves SVG + placeholder founder + "anh chị" tone + AI-generated landscape ban đầu, swap photo thật khi có**.
