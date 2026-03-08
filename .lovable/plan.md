
# MFC Premium 2026 Redesign

## Overview
A comprehensive visual and UX overhaul of the MFC website to transform it from a basic local restaurant page into a bold, high-converting, premium fast-food brand experience. All existing functionality (cart, admin, reviews, WhatsApp, open/close status) will be preserved.

## Color & Typography Upgrade

**Updated Palette:**
- Background: `#0a0a0a` (near-black) with warm undertones
- Primary: `#8B1A1A` (deep crimson) -- kept
- Gold accent: `#D4A853` (warm gold for CTAs and highlights)
- Card surfaces: `#141414` with subtle warm tint
- Text: `#F5F0EB` (warm white, not pure white)

**Font:** Keep Inter/Sora but enforce heavier weights (700-900 for headlines, 400-500 for body).

## Section-by-Section Changes

### 1. Hero Section (HeroSection.tsx) -- Full Rebuild
- Replace emoji-based hero with a bold typographic layout
- New headline: **"Ukhrul's Crispiest Fried Chicken"** with word-by-word animated reveal
- Subheadline: "Handcrafted daily. Loved by thousands."
- Three CTA buttons in a row: **Order Now** (gold, primary), **Get Directions** (outline), **Call Now** (green)
- Animated stats strip below CTAs: "2000+ Customers Served", "5+ Years", "4.8 Rating"
- Remove floating food emojis; replace with subtle radial gradient pulses and a warm golden light bloom
- Keep open/close badge and promo badge

### 2. "Why Choose MFC" Section (NEW component: WhyChooseSection.tsx)
- 4 value blocks in a grid with icons:
  - "Secret Spice Blend" (Flame icon)
  - "Fresh, Never Frozen" (Snowflake icon)
  - "Fast & Hot Delivery" (Truck icon)
  - "Family Recipe Since Day 1" (Heart icon)
- Glassmorphism cards with warm border glow on hover
- Scroll-triggered fade-up entrance

### 3. Menu Section (ProductGrid.tsx + ProductCard.tsx) -- Visual Upgrade
- Section title: "Our Best Sellers" with gold accent underline
- Product cards: darker card background (`#141414`), larger image area, golden price tag styling
- Hover effect: warm golden border glow instead of orange, subtle upward lift
- "Add to Cart" button uses gold accent on hover
- Remove ember spark animations (too busy), keep oil-shine sweep

### 4. Reviews Section (ReviewsSection.tsx) -- Polish
- Keep existing functionality
- Upgrade card styling: add subtle gold star glow, darker card backgrounds
- Add quote marks decoration to review text

### 5. Footer (Footer.tsx) -- Conversion-Focused Rebuild
- Add a bold pre-footer CTA section: "Ready to Order?" with gold "Order Now" button and "Call Now" secondary
- Add location text: "Viewland Zone II, Ukhrul"
- Keep existing contact info and hours grid
- Add subtle gold divider line

### 6. About Page (About.tsx) -- Typography & Layout Polish
- Use shared Header component instead of standalone back button
- Upgrade heading to use gold gradient text
- Add animated counter section (Years, Customers, Menu Items)

### 7. Contact Page (Contact.tsx) -- Same Treatment
- Use shared Header
- Upgrade card hover effects to match new gold accent system

### 8. Sticky Mobile Order Bar (NEW: MobileOrderBar.tsx)
- Fixed bottom bar on mobile only (below md breakpoint)
- Shows: "Order Now" button (gold), Phone icon, WhatsApp icon
- Appears after scrolling past hero section
- Glassmorphism background

### 9. Header (Header.tsx) -- Minor Polish
- Add gold accent to logo glow instead of crimson-only
- Remove "Admin" link from public nav (keep at /admin URL, just not in nav)
- Improve glassmorphism opacity values for better readability

### 10. Loading Screen (CinematicLoader.tsx) -- Keep As-Is
- Already has premium feel, no changes needed

## CSS Updates (index.css)
- Add `--brand-gold` as usable accent throughout
- Add `.shadow-gold-glow` utility
- Refine card surface colors for warmer dark tones
- Add `.text-warm-white` utility class

## Technical Details

### Files to Create:
1. `src/components/home/WhyChooseSection.tsx` -- 4-block value proposition grid
2. `src/components/common/MobileOrderBar.tsx` -- sticky bottom CTA bar for mobile

### Files to Modify:
1. `src/index.css` -- updated CSS variables, new utility classes
2. `src/components/home/HeroSection.tsx` -- full visual rebuild (same data hooks)
3. `src/components/products/ProductCard.tsx` -- styling upgrades, gold accents
4. `src/components/products/ProductGrid.tsx` -- section title upgrade
5. `src/components/home/ReviewsSection.tsx` -- card styling polish
6. `src/components/layout/Header.tsx` -- remove admin from nav, polish glassmorphism
7. `src/components/layout/Footer.tsx` -- add pre-footer CTA section
8. `src/pages/Index.tsx` -- add WhyChooseSection, MobileOrderBar
9. `src/pages/About.tsx` -- use shared Header, styling polish
10. `src/pages/Contact.tsx` -- use shared Header, styling polish

### No Changes To:
- Admin pages (keep functional, not customer-facing)
- Cart functionality
- Database/backend
- Checkout flow
- WhatsApp integration logic

## Performance Considerations
- Remove unnecessary emoji animations (reduce DOM nodes)
- Reduce ember/particle count in hero
- Use `will-change` sparingly and only on actively animated elements
- Keep Framer Motion `viewport={{ once: true }}` for all scroll animations
