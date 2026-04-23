import type { CartItem, MenuItem } from "@/types/app";

export const CART_STORAGE_KEY = "dropee_cart";

export function readCart(): CartItem[] {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored) as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeCart(items: CartItem[]) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}

export function clearCart() {
  localStorage.removeItem(CART_STORAGE_KEY);
}

export function getCartCount(items: CartItem[] = readCart()) {
  return items.reduce((sum, item) => sum + Math.max(0, item.quantity || 0), 0);
}

export function addCartItem(item: MenuItem, quantity: number, specialInstructions?: string) {
  const cart = readCart();
  const existing = cart.find((cartItem) => cartItem.id === item.id);

  if (existing) {
    existing.quantity += quantity;
    if (specialInstructions) {
      existing.special_instructions = specialInstructions;
    }
  } else {
    cart.push({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity,
      image_url: item.image_url,
      category_id: item.category_id,
      special_instructions: specialInstructions || null,
    });
  }

  writeCart(cart);
  return cart;
}
