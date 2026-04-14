-- ============================================================
-- MFC Backend Extension for Shared Supabase Database
-- Run this in the Supabase SQL Editor for project: mpqaictrrrncwqrkpdos
-- This extends the shared backend with all tables the MFC app
-- requires, and wires MFC orders into the agent's delivery_orders
-- table via a Postgres trigger (no edge functions needed).
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. ENUM — extend app_role to include mfc_admin if not exists
-- ────────────────────────────────────────────────────────────
-- The shared DB already has app_role. We only need 'admin' for
-- MFC admin panel access which already exists.
-- No enum changes required.

-- ────────────────────────────────────────────────────────────
-- 2. CATEGORIES
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mfc_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.mfc_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "mfc: anyone can read categories"
  ON public.mfc_categories FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "mfc: admins can insert categories"
  ON public.mfc_categories FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY IF NOT EXISTS "mfc: admins can update categories"
  ON public.mfc_categories FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY IF NOT EXISTS "mfc: admins can delete categories"
  ON public.mfc_categories FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- default categories
INSERT INTO public.mfc_categories (name, display_order)
VALUES
  ('Chicken Items', 1),
  ('Combos', 2),
  ('Sides', 3),
  ('Beverages', 4)
ON CONFLICT DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 3. PRODUCTS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mfc_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  category_id UUID REFERENCES public.mfc_categories(id) ON DELETE SET NULL,
  images TEXT[] DEFAULT '{}',
  in_stock BOOLEAN DEFAULT true,
  is_bestseller BOOLEAN DEFAULT false,
  is_spicy BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.mfc_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "mfc: anyone can read products"
  ON public.mfc_products FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "mfc: admins can insert products"
  ON public.mfc_products FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY IF NOT EXISTS "mfc: admins can update products"
  ON public.mfc_products FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY IF NOT EXISTS "mfc: admins can delete products"
  ON public.mfc_products FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- updated_at trigger for mfc_products
CREATE OR REPLACE FUNCTION public.mfc_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_mfc_products_updated_at ON public.mfc_products;
CREATE TRIGGER trg_mfc_products_updated_at
  BEFORE UPDATE ON public.mfc_products
  FOR EACH ROW EXECUTE FUNCTION public.mfc_update_updated_at();

-- Storage bucket for product images (safe to run if already exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('mfc-product-images', 'mfc-product-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY IF NOT EXISTS "mfc: anyone can view product images"
  ON storage.objects FOR SELECT USING (bucket_id = 'mfc-product-images');

CREATE POLICY IF NOT EXISTS "mfc: authenticated can upload product images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'mfc-product-images');

CREATE POLICY IF NOT EXISTS "mfc: authenticated can update product images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'mfc-product-images');

CREATE POLICY IF NOT EXISTS "mfc: authenticated can delete product images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'mfc-product-images');

-- ────────────────────────────────────────────────────────────
-- 4. PROMOTIONS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mfc_promotions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  discount_percentage INTEGER DEFAULT 0,
  banner_image TEXT,
  is_active BOOLEAN DEFAULT true,
  applies_to_all BOOLEAN DEFAULT true,
  product_ids UUID[] DEFAULT '{}',
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.mfc_promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "mfc: anyone can read active promotions"
  ON public.mfc_promotions FOR SELECT USING (is_active = true);

CREATE POLICY IF NOT EXISTS "mfc: admins can read all promotions"
  ON public.mfc_promotions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY IF NOT EXISTS "mfc: admins can insert promotions"
  ON public.mfc_promotions FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY IF NOT EXISTS "mfc: admins can update promotions"
  ON public.mfc_promotions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY IF NOT EXISTS "mfc: admins can delete promotions"
  ON public.mfc_promotions FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ────────────────────────────────────────────────────────────
-- 5. STORE SETTINGS (singleton row)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mfc_store_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_open BOOLEAN DEFAULT true,
  use_scheduled_hours BOOLEAN DEFAULT false,
  opening_time TIME DEFAULT '09:00',
  closing_time TIME DEFAULT '21:00',
  open_days INTEGER[] DEFAULT '{0,1,2,3,4,5,6}',
  upi_id TEXT DEFAULT '',
  whatsapp_primary TEXT DEFAULT '+919774046387',
  whatsapp_secondary TEXT DEFAULT '+919366372647',
  admin_password_hash TEXT NOT NULL DEFAULT 'admin123',
  packaging_fee NUMERIC NOT NULL DEFAULT 60,
  base_delivery_fee NUMERIC NOT NULL DEFAULT 100,
  per_km_delivery_fee NUMERIC NOT NULL DEFAULT 50,
  customers_served TEXT DEFAULT '2000+',
  years_running TEXT DEFAULT '5+',
  average_rating TEXT DEFAULT '4.8',
  menu_images TEXT[] DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.mfc_store_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "mfc: anyone can read store settings"
  ON public.mfc_store_settings FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "mfc: admins can update store settings"
  ON public.mfc_store_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY IF NOT EXISTS "mfc: admins can insert store settings"
  ON public.mfc_store_settings FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS trg_mfc_store_settings_updated_at ON public.mfc_store_settings;
CREATE TRIGGER trg_mfc_store_settings_updated_at
  BEFORE UPDATE ON public.mfc_store_settings
  FOR EACH ROW EXECUTE FUNCTION public.mfc_update_updated_at();

-- Seed default singleton row
INSERT INTO public.mfc_store_settings (admin_password_hash, upi_id)
VALUES ('admin123', '')
ON CONFLICT DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 6. ORDERS (MFC source of truth)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mfc_orders (
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
  -- links to the agent delivery_orders table after trigger fires
  hub_order_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mfc_orders ENABLE ROW LEVEL SECURITY;

-- Anyone (anon customer) can place an order
CREATE POLICY IF NOT EXISTS "mfc: anyone can insert orders"
  ON public.mfc_orders FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Admins can manage all orders
CREATE POLICY IF NOT EXISTS "mfc: admins can manage orders"
  ON public.mfc_orders FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for live order dashboard
ALTER PUBLICATION supabase_realtime ADD TABLE public.mfc_orders;

-- ────────────────────────────────────────────────────────────
-- 7. COUPONS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mfc_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL DEFAULT 'flat' CHECK (discount_type IN ('flat', 'percentage')),
  discount_value NUMERIC NOT NULL,
  min_order_amount NUMERIC,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mfc_coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "mfc: anyone can read active coupons"
  ON public.mfc_coupons FOR SELECT USING (is_active = true);

CREATE POLICY IF NOT EXISTS "mfc: admins can manage coupons"
  ON public.mfc_coupons FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ────────────────────────────────────────────────────────────
-- 8. REVIEWS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mfc_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.mfc_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "mfc: anyone can read approved reviews"
  ON public.mfc_reviews FOR SELECT USING (is_approved = true);

CREATE POLICY IF NOT EXISTS "mfc: admins can read all reviews"
  ON public.mfc_reviews FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY IF NOT EXISTS "mfc: anyone can submit reviews"
  ON public.mfc_reviews FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "mfc: admins can update reviews"
  ON public.mfc_reviews FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY IF NOT EXISTS "mfc: admins can delete reviews"
  ON public.mfc_reviews FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ────────────────────────────────────────────────────────────
-- 9. SITE CONTENT (About / Contact)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mfc_site_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section TEXT NOT NULL UNIQUE CHECK (section IN ('about', 'contact')),
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  address TEXT,
  email TEXT,
  phone_1 TEXT,
  phone_2 TEXT,
  map_embed_url TEXT,
  directions_url TEXT,
  image_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.mfc_site_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "mfc: anyone can read site content"
  ON public.mfc_site_content FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "mfc: admins can insert site content"
  ON public.mfc_site_content FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY IF NOT EXISTS "mfc: admins can update site content"
  ON public.mfc_site_content FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.mfc_site_content (section, title, content)
VALUES
  ('about', 'About MFC', 'Welcome to Makyo Fried Chicken - where tradition meets taste.'),
  ('contact', 'Contact Us', 'We would love to hear from you! Reach out to us for orders, feedback, or just to say hello.')
ON CONFLICT (section) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 10. NOTIFICATION HISTORY
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mfc_notification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  sent_by UUID,
  sent_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.mfc_notification_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "mfc: admins can manage notification history"
  ON public.mfc_notification_history FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ────────────────────────────────────────────────────────────
-- 11. PUSH SUBSCRIPTIONS + VAPID KEYS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mfc_push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.mfc_push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "mfc: anyone can subscribe"
  ON public.mfc_push_subscriptions FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "mfc: admins can read subscriptions"
  ON public.mfc_push_subscriptions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY IF NOT EXISTS "mfc: anyone can delete own subscription"
  ON public.mfc_push_subscriptions FOR DELETE USING (true);

CREATE TABLE IF NOT EXISTS public.mfc_vapid_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_key TEXT NOT NULL,
  private_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.mfc_vapid_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "mfc: anyone can read vapid public key"
  ON public.mfc_vapid_keys FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "mfc: admins can manage vapid keys"
  ON public.mfc_vapid_keys FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ────────────────────────────────────────────────────────────
-- 12. BRIDGE TRIGGER: mfc_orders → delivery_orders
--
-- When an MFC order is inserted, this trigger automatically
-- creates a corresponding row in the agent app's delivery_orders
-- table so it can be picked up for dispatch without any edge
-- function call or HTTP round-trip.
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.mfc_bridge_order_to_delivery()
RETURNS TRIGGER AS $$
DECLARE
  v_order_code TEXT;
  v_delivery_order_id UUID;
  v_pickup_address TEXT := 'MFC - Makyo Fried Chicken, Ukhrul';
BEGIN
  -- Generate a short human-readable code like MFC-AB12CD
  v_order_code := 'MFC-' || upper(substring(replace(NEW.id::text, '-', ''), 1, 6));

  INSERT INTO public.delivery_orders (
    order_code,
    customer_name,
    customer_phone,
    delivery_address,
    pickup_address,
    package_description,
    special_instructions,
    status,
    created_at,
    updated_at
  ) VALUES (
    v_order_code,
    NEW.customer_name,
    NEW.customer_phone,
    NEW.customer_address,
    v_pickup_address,
    -- Serialize the JSONB items into a readable description
    (SELECT string_agg(
        (item->>'name') || ' x' || (item->>'quantity'),
        ', '
      )
     FROM jsonb_array_elements(NEW.items) AS item
    ),
    NEW.special_instructions,
    'pending_assignment',
    NEW.created_at,
    now()
  )
  RETURNING id INTO v_delivery_order_id;

  -- Write the delivery_order id back into hub_order_id so MFC
  -- can track the same record via the agent app.
  UPDATE public.mfc_orders
    SET hub_order_id = v_delivery_order_id::text
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_mfc_bridge_order ON public.mfc_orders;
CREATE TRIGGER trg_mfc_bridge_order
  AFTER INSERT ON public.mfc_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.mfc_bridge_order_to_delivery();

-- ────────────────────────────────────────────────────────────
-- DONE
-- The MFC app is now wired into the shared backend.
-- mfc_orders → triggers → delivery_orders (agent picks up)
-- ────────────────────────────────────────────────────────────
