
ALTER TABLE public.store_settings 
ADD COLUMN IF NOT EXISTS packaging_fee numeric NOT NULL DEFAULT 60,
ADD COLUMN IF NOT EXISTS base_delivery_fee numeric NOT NULL DEFAULT 100,
ADD COLUMN IF NOT EXISTS per_km_delivery_fee numeric NOT NULL DEFAULT 50,
ADD COLUMN IF NOT EXISTS customers_served text DEFAULT '2000+',
ADD COLUMN IF NOT EXISTS years_running text DEFAULT '5+',
ADD COLUMN IF NOT EXISTS average_rating text DEFAULT '4.8',
ADD COLUMN IF NOT EXISTS menu_images text[] DEFAULT '{}'::text[];
