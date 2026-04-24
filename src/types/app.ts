import type { Tables } from "@/integrations/supabase/types";

export type MenuCategory = Tables<"mfc_categories">;
export type MenuProduct = Tables<"mfc_products">;
export type MenuItem = MenuProduct & {
  image_url: string | null;
};
export type FoodOrder = Tables<"mfc_orders">;
export type DeliveryOrder = Tables<"delivery_orders">;
export type Reservation = Tables<"mfc_reservations">;
export type AdminWhitelistEntry = Tables<"mfc_admin_whitelist">;
export type StoreSettings = Tables<"mfc_store_settings">;
export type UserAddress = Tables<"mfc_user_addresses">;

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string | null;
  category_id: string | null;
  special_instructions?: string | null;
}

export interface CustomerOrderListItem {
  id: string;
  kind: "food" | "delivery";
  status: string;
  created_at: string;
  total: number | null;
  customer_address: string | null;
  pickup_address: string | null;
  delivery_address: string | null;
  customer_phone: string | null;
  items: CartItem[] | null;
  special_instructions: string | null;
  package_description: string | null;
}
