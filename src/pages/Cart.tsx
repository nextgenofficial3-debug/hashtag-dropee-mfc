import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Minus, Plus, ReceiptText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { getCartCount, readCart, writeCart } from "@/lib/cart";
import type { CartItem } from "@/types/app";

export default function Cart() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setCartItems(readCart());
  }, []);

  const updateItems = (nextItems: CartItem[]) => {
    setCartItems(nextItems);
    writeCart(nextItems);
  };

  const updateQuantity = (id: string, delta: number) => {
    const nextItems = cartItems
      .map((item) =>
        item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
      )
      .filter((item) => item.quantity > 0);

    updateItems(nextItems);
  };

  const removeItem = (id: string) => {
    updateItems(cartItems.filter((item) => item.id !== id));
  };

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const itemCount = getCartCount(cartItems);

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center pt-20 pb-24 px-6 text-center space-y-6">
        <div className="w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center">
          <ReceiptText className="w-10 h-10 text-muted-foreground/50" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Your cart is empty</h2>
          <p className="text-muted-foreground mt-2">Add real menu items before checking out.</p>
        </div>
        <Button asChild className="w-full h-14 rounded-2xl text-base font-semibold">
          <Link to="/shop">View Menu</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32 pt-20 px-4">
      <h1 className="text-3xl font-extrabold tracking-tight mb-6">Your Cart</h1>

      <div className="space-y-4">
        {cartItems.map((item) => (
          <div key={item.id} className="flex gap-4 p-3 bg-card border border-border rounded-3xl shadow-sm">
            <div className="w-20 h-20 rounded-2xl shrink-0 overflow-hidden bg-muted">
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
              ) : null}
            </div>
            <div className="flex-1 flex flex-col justify-between py-1">
              <div className="flex justify-between items-start gap-3">
                <div>
                  <h4 className="font-bold line-clamp-1">{item.name}</h4>
                  {item.special_instructions ? (
                    <p className="text-xs text-muted-foreground mt-1">{item.special_instructions}</p>
                  ) : null}
                </div>
                <button onClick={() => removeItem(item.id)} className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex justify-between items-center mt-auto">
                <span className="font-bold text-primary">₹{item.price}</span>
                <div className="flex items-center gap-2 bg-muted rounded-xl p-1">
                  <button className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-background" onClick={() => updateQuantity(item.id, -1)}>
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-sm font-semibold w-4 text-center">{item.quantity}</span>
                  <button className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-background" onClick={() => updateQuantity(item.id, 1)}>
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 space-y-4">
        <h3 className="font-bold text-lg">Bill Details</h3>
        <div className="space-y-2 text-sm text-muted-foreground bg-muted/20 p-4 border border-border rounded-2xl">
          <div className="flex justify-between">
            <span>Items</span>
            <span className="font-semibold text-foreground">{itemCount}</span>
          </div>
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-semibold text-foreground">₹{subtotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="fixed bottom-16 left-0 right-0 p-4 pb-6 bg-background/80 backdrop-blur-md border-t border-border z-10">
        <Button className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/25" onClick={() => navigate("/checkout")}>
          Proceed to Checkout <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
