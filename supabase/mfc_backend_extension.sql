-- ============================================================
-- MFC Backend Extension for Shared Supabase Database
-- Run this in the Supabase SQL Editor for project: mpqaictrrrncwqrkpdos
-- This extends the shared backend with all tables the MFC app
-- requires, and wires MFC orders into the agent's delivery_orders
-- table via a Postgres trigger (no edge functions needed).
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. ADMIN WHITELIST (RBAC)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mfc_admin_whitelist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.mfc_admin_whitelist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view whitelist" 
  ON public.mfc_admin_whitelist FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.mfc_admin_whitelist WHERE email = auth.jwt()->>'email'));

-- Seed hashtagdropee@gmail.com
INSERT INTO public.mfc_admin_whitelist (email, role)
VALUES ('hashtagdropee@gmail.com', 'super_admin')
ON CONFLICT (email) DO NOTHING;

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

CREATE POLICY IF NOT EXISTS "mfc: admins can manage categories"
  ON public.mfc_categories FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.mfc_admin_whitelist WHERE email = auth.jwt()->>'email'));

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

CREATE POLICY IF NOT EXISTS "mfc: admins can manage products"
  ON public.mfc_products FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.mfc_admin_whitelist WHERE email = auth.jwt()->>'email'));

-- ────────────────────────────────────────────────────────────
-- 4. STORE SETTINGS (Standardized)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mfc_store_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_name TEXT NOT NULL DEFAULT 'MFC Food',
  brand_logo_url TEXT,
  is_open BOOLEAN DEFAULT true,
  use_scheduled_hours BOOLEAN DEFAULT false,
  working_hours JSONB DEFAULT '{
    "mon": {"open": "09:00", "close": "21:00", "closed": false},
    "tue": {"open": "09:00", "close": "21:00", "closed": false},
    "wed": {"open": "09:00", "close": "21:00", "closed": false},
    "thu": {"open": "09:00", "close": "21:00", "closed": false},
    "fri": {"open": "09:00", "close": "21:00", "closed": false},
    "sat": {"open": "09:00", "close": "21:00", "closed": false},
    "sun": {"open": "09:00", "close": "21:00", "closed": true}
  }',
  upi_id TEXT DEFAULT '',
  whatsapp_primary TEXT DEFAULT '+919774046387',
  whatsapp_secondary TEXT DEFAULT '+919366372647',
  packaging_fee NUMERIC NOT NULL DEFAULT 60,
  base_delivery_fee NUMERIC NOT NULL DEFAULT 100,
  per_km_delivery_fee NUMERIC NOT NULL DEFAULT 50,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.mfc_store_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read store settings" 
  ON public.mfc_store_settings FOR SELECT USING (true);

CREATE POLICY "Admins can update store settings" 
  ON public.mfc_store_settings FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.mfc_admin_whitelist WHERE email = auth.jwt()->>'email'));

-- Seed default row
INSERT INTO public.mfc_store_settings (brand_name)
VALUES ('MFC Food')
ON CONFLICT DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 5. ORDERS
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
  hub_order_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mfc_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert orders" ON public.mfc_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage orders" ON public.mfc_orders FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.mfc_admin_whitelist WHERE email = auth.jwt()->>'email'));

-- ────────────────────────────────────────────────────────────
-- 6. USER ADDRESSES
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mfc_user_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  address_type TEXT NOT NULL CHECK (address_type IN ('Home', 'Work', 'Other')),
  full_address TEXT NOT NULL,
  lat NUMERIC,
  lng NUMERIC,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.mfc_user_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own addresses" ON public.mfc_user_addresses FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- 7. RESERVATIONS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mfc_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT,
  customer_phone TEXT,
  people_count INTEGER NOT NULL DEFAULT 1,
  reservation_time TIMESTAMPTZ NOT NULL,
  table_type TEXT DEFAULT 'indoor',
  special_requests TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.mfc_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reservations" ON public.mfc_reservations FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Everyone can create reservations" ON public.mfc_reservations FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage all reservations" ON public.mfc_reservations FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.mfc_admin_whitelist WHERE email = auth.jwt()->>'email'));

-- ────────────────────────────────────────────────────────────
-- 8. BRIDGE TRIGGER: mfc_orders → delivery_orders
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.mfc_bridge_order_to_delivery()
RETURNS TRIGGER AS $$
DECLARE
  v_order_code TEXT;
  v_delivery_order_id UUID;
  v_pickup_address TEXT := 'MFC - Makyo Fried Chicken, Ukhrul';
BEGIN
  v_order_code := 'MFC-' || upper(substring(replace(NEW.id::text, '-', ''), 1, 6));

  INSERT INTO public.delivery_orders (
    order_code, customer_name, customer_phone, delivery_address, pickup_address, 
    package_description, special_instructions, status, created_at, updated_at
  ) VALUES (
    v_order_code, NEW.customer_name, NEW.customer_phone, NEW.customer_address, v_pickup_address,
    (SELECT string_agg((item->>'name') || ' x' || (item->>'quantity'), ', ') FROM jsonb_array_elements(NEW.items) AS item),
    NEW.special_instructions, 'pending_assignment', NEW.created_at, now()
  )
  RETURNING id INTO v_delivery_order_id;

  UPDATE public.mfc_orders SET hub_order_id = v_delivery_order_id::text WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_mfc_bridge_order ON public.mfc_orders;
CREATE TRIGGER trg_mfc_bridge_order
  AFTER INSERT ON public.mfc_orders
  FOR EACH ROW EXECUTE FUNCTION public.mfc_bridge_order_to_delivery();
