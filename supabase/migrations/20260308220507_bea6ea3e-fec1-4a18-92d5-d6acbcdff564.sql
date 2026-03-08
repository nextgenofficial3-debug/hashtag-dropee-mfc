ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_bestseller boolean DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_spicy boolean DEFAULT false;