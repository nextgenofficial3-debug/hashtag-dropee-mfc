

# MFC App-Style Redesign + Orders API + SEO Fix

## Summary
This is a multi-part update: (1) remove WhyChooseSection, (2) convert to app-like layout with PWA install, (3) redesign product cards, (4) build an orders system with API for delivery agents, (5) fix SEO for Google discoverability.

---

## 1. Remove WhyChooseSection
- Delete `src/components/home/WhyChooseSection.tsx`
- Remove import and usage from `src/pages/Index.tsx`

## 2. App-Style Layout + PWA Install
- Install `vite-plugin-pwa` and configure in `vite.config.ts` with manifest (name: "MFC", theme_color: #8B1A1A, icons)
- Add PWA meta tags to `index.html` (apple-touch-icon, theme-color, etc.)
- Add navigateFallbackDenylist for `/~oauth`
- Create `/install` page with install instructions and a "Download App" button that triggers the PWA install prompt (`beforeinstallprompt` event)
- Add "Install App" button in the Hero section and Header for visibility
- Make the layout feel more app-like: remove excessive decorative effects (film grain, cinematic loader can stay optional), tighten spacing, make bottom nav more prominent

## 3. Redesign Product Cards
Replace the current card with a modern, compact, food-delivery-app-style card:
- **Horizontal layout on mobile** (image left, details right) like Swiggy/Zomato
- **Vertical layout on desktop** with larger image
- Rounded image with subtle shadow, no heavy border
- Category as a small colored chip
- Bold product name, 1-line description
- Price prominently displayed with discount strike-through
- Large, always-visible "ADD" button (not hidden behind hover)
- Quantity stepper (+/-) appears after first add
- Smooth add-to-cart animation (button transforms)
- Remove hover-only interactions for mobile friendliness

## 4. Orders System + API for Delivery Agents

### Database Changes (migration)
```sql
-- Orders table to store every order
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  special_instructions TEXT,
  payment_method TEXT NOT NULL DEFAULT 'cod',
  items JSONB NOT NULL,
  subtotal NUMERIC NOT NULL,
  discount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- API keys table for delivery agent integrations
CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  name TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- RLS: Admins manage orders and API keys
CREATE POLICY "Admins can do everything with orders" ON public.orders FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can insert orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins manage API keys" ON public.api_keys FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Enable realtime for orders
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
```

### Edge Function: `orders-api`
- Accepts API key in `Authorization: Bearer <key>` header
- `GET /orders-api` — returns live pending/active orders for delivery agents
- Validates API key against `api_keys` table
- Returns order details (customer info, items, address, status)

### Admin Panel Changes
- **Admin Orders Page** (`/admin/orders`): View all orders, update status (pending → preparing → out for delivery → delivered)
- **API Keys Section** in Admin Settings: Generate API key, copy to clipboard, view active keys, revoke keys
- Add "Orders" nav item to AdminSidebar

### Checkout Flow Update
- On checkout submit, save order to `orders` table AND send WhatsApp message (existing behavior)
- This means every order is persisted in the database

## 5. SEO / Google Discoverability Fix
- Update `robots.txt` to be more comprehensive with explicit Allow rules
- Update `public/sitemap.xml` with correct `lastmod` dates
- Add `<meta name="google-site-verification">` tag to `index.html` (will need user to verify via Google Search Console)
- Improve structured data in `index.html`: add `url`, `image`, `geo`, `areaServed` fields
- Add `<link rel="icon">` and proper favicon references
- Ensure `og:url` and `og:image` are set (even a placeholder)

---

## Files to Create
1. `src/pages/Install.tsx` — PWA install page
2. `src/pages/admin/AdminOrders.tsx` — Orders management page
3. `supabase/functions/orders-api/index.ts` — API endpoint for delivery agents

## Files to Edit
1. `src/pages/Index.tsx` — remove WhyChooseSection
2. `src/components/products/ProductCard.tsx` — full redesign
3. `src/components/products/ProductGrid.tsx` — adjust grid for new card style
4. `src/components/home/HeroSection.tsx` — add Install App button
5. `src/pages/Checkout.tsx` — save order to database on submit
6. `src/pages/admin/AdminSettings.tsx` — add API keys management section
7. `src/components/admin/AdminSidebar.tsx` — add Orders nav item
8. `src/App.tsx` — add Install and AdminOrders routes
9. `vite.config.ts` — add PWA plugin
10. `index.html` — add PWA meta tags, improve SEO meta
11. `public/robots.txt` — improve for crawlability
12. `public/sitemap.xml` — update dates

## Files to Delete
1. `src/components/home/WhyChooseSection.tsx`

## No Changes To
- Cart system (preserved)
- Admin auth (preserved)
- Reviews system (preserved)
- WhatsApp integration (preserved, enhanced with DB save)

