export interface Category {
  id: string;
  name: string;
  display_order: number;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category_id: string | null;
  images: string[];
  in_stock: boolean;
  is_bestseller: boolean;
  is_spicy: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductWithCategory extends Product {
  category?: Category | null;
}

export interface Promotion {
  id: string;
  title: string;
  description: string | null;
  discount_percentage: number;
  banner_image: string | null;
  is_active: boolean;
  applies_to_all: boolean;
  product_ids: string[];
  valid_from: string;
  valid_until: string | null;
  created_at: string;
}

export interface StoreSettings {
  id: string;
  is_open: boolean;
  use_scheduled_hours: boolean;
  opening_time: string;
  closing_time: string;
  open_days: number[];
  upi_id: string;
  whatsapp_primary: string;
  whatsapp_secondary: string;
  admin_password_hash: string;
  updated_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CheckoutFormData {
  name: string;
  phone: string;
  address: string;
  instructions: string;
  paymentMethod: 'gpay' | 'cod';
}
