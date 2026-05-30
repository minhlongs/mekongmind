<!-- CLEO:START -->
@.cleo/templates/AGENT-INJECTION.md
<!-- CLEO:END -->

# ANIMA 119 — 第十三篇 用間 (Yong Jian) — Scientific Intelligence

> **Inherits**: `../../CLAUDE.md` (Root Constitution)
> **Domain**: Fermented Oriental Medicine E-Commerce — Premium health supplements
> **Binh Phap**: 用間 — Intelligence through scientific credibility, Dr. Uh's research, 11 RCTs
> **Stack**: Next.js 16 + React 19 + Tailwind CSS 4 + Framer Motion + PayOS + Supabase

## Project Overview

ANIMA 119 is a premium food supplement brand from fermented Oriental medicine. Standalone e-commerce with PayOS payment (direct sales, NO affiliate/commission).

**Cloned from 84tea. Mission: REBRAND everything 84tea → ANIMA 119.**

## Brand Identity

### Product

- **Name**: ANIMA 119
- **Category**: Food Supplements from Fermented Oriental Medicine
- **Tagline EN**: "Balance the Metabolism of Bio-Energy Flow to Heal the Body"
- **Tagline VI**: "Cân Bằng Sinh Năng Lượng, Phục Hồi Cơ Thể"
- **Made in**: Korea
- **Manufacturer**: Korea Fermented Herbal Medicine Research Institute (Dr.Uh Hanbang BioPharmaceutical)
- **Distributor**: ZenX Holdings Joint Stock Company
- **Address**: 15/11 Duy Tan, Cau Giay Ward, Hanoi, Vietnam
- **Serving Size**: 3.5g

### 4 Core Benefits

1. Promotes healthy blood circulation (Tăng cường tuần hoàn máu)
2. Supports spine and bone health (Hỗ trợ xương khớp, cột sống)
3. Restores energy, reduces fatigue (Phục hồi năng lượng, giảm mệt mỏi)
4. Detoxifies and strengthens liver (Giải độc và bảo vệ gan)

### Design System — MUST FOLLOW

- **Primary**: Navy Blue `#0A1628` (deep dark), `#1A2744` (card bg)
- **Accent Gold**: `#C5A55A` (logo, headings, CTA borders)
- **Text**: White `#FFFFFF` on dark, `#E0E0E0` for body
- **Gradient**: Navy to deep blue cosmic sky
- **Visual Theme**: Cosmic meditation, golden energy mandala, starfield background
- **Logo**: Golden triskele/trinity knot symbol (use SVG or golden icon)
- **Typography**: Playfair Display (headings) + Inter (body) — already in project
- **Vibe**: Premium, mystical, scientific, Korean traditional medicine

## Website Pages (7 routes)

### 1. Homepage `/` (Hero + Overview)

- Full-screen hero with cosmic meditation visual
- ANIMA 119 logo + tagline
- 4 benefits grid with icons
- CTA: "Mua Ngay" / "Buy Now"
- Testimonials section
- Scientific credentials preview

### 2. Product Detail `/san-pham`

- Product gallery (box A2, label A4, banner)
- Nutrition Facts panel
- Ingredients list
- Usage instructions
- Add to Cart → PayOS checkout

### 3. Scientific Foundation `/khoa-hoc`

DEEP CONTENT — The crown jewel. Must be informative and trustworthy:

**Dr. Uh Bong-woo (어봉우 박사)**

- PhD from Kyung Hee University (Korean Medicine)
- 35+ years fermented herbal medicine research
- Director, Korea Fermented Herbal Medicine Research Institute (대한 발효 한약연구원)
- Advisor, Fermented Herbal Medicine Society of Korean Oriental Medical Doctors Assoc.
- 2023 Minister of Health & Welfare Award

**Fermentation Technology**

- "4th Fermentation, 3-Stage Low-Separation Method" — pioneered by Dr.Uh
- World's first health food using Korean medicine microorganisms
- Patents: arthritis treatment, obesity inhibition, prostate function, insomnia

**Scientific Evidence**

- Enhanced bioavailability: fermentation breaks complex compounds into absorbable forms
- Reduced toxicity: enzymatic degradation during fermentation
- New bioactive compounds: novel pharmacological activities
- Enhanced antioxidant properties (polyphenols, flavonoids, tannins)
- Immune modulation: increased immunological activities
- Gut microbiota enrichment
- Anti-inflammatory, anticancer, metabolic health benefits
- 11 Randomized Controlled Trials (2000-2011) confirming safety & efficacy

**Production Credentials**

- Insung Pharm (인성제약): FSSC 22000 certified, GMP production
- OEM/ODM with international R&D partnerships

### 4. Origin Story `/nguon-goc`

- Korean heritage of fermented medicine
- Dr.Uh's journey and research
- Baekyakbang (백약방) partnership context
- ZenX Holdings Vietnamese distribution
- Quality certifications

### 5. Purchase `/mua-hang`

- Product card with quantity selector
- Price display (placeholder: 990,000 VNĐ — confirm later)
- PayOS QR Code checkout
- Order confirmation

### 6. Contact `/lien-he`

- ZenX Holdings contact info
- Hotline + Zalo
- Google Maps embed (15/11 Duy Tan, Cau Giay)
- Contact form

### 7. Blog/News `/tin-tuc`

- Articles about fermented medicine industry
- Health tips
- Company news

## PayOS Integration (CRITICAL)

- Direct checkout — NO affiliate/commission system
- Remove ALL 84tea MLM/network/commission code
- Keep PayOS create-payment, webhook, get-payment, cancel-payment
- Simple: Product → Cart → PayOS QR → Payment → Order confirmed

## Tech Stack (inherited from 84tea)

- Next.js 16 + React 19
- Tailwind CSS 4
- Framer Motion (animations)
- next-intl (VI/EN)
- PayOS Node SDK
- Supabase (orders DB)
- PWA ready

## IMPORTANT RULES

1. **DELETE ALL 84tea content** — no tea references anywhere
2. **Navy + Gold only** — no other color scheme
3. **Vietnamese PRIMARY** — English secondary
4. **Premium feel** — this is traditional medicine, not casual tea
5. **Scientific credibility** — include citations, credentials, research data
6. **Mobile-first** — responsive design
7. **NO affiliate/MLM code** — pure e-commerce
8. **SEO optimized** — meta tags, structured data, sitemap

## Commands

```bash
npm install    # Install deps
npm run dev    # Dev server
npm run build  # Production build
npm run lint   # ESLint
```
