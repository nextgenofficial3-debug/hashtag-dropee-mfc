import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Minus, Trash2, ArrowRight, MapPin, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Cart() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Dummy Cart State for UI
  const [cartItems, setCartItems] = useState<any[]>([
    { id: 1, name: "Truffle Burger", price: 350, quantity: 2, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=200&auto=format&fit=crop" },
    { id: 2, name: "Iced Latte", price: 150, quantity: 1, image: "https://images.unsplash.com/photo-1461023058943-07cb1ce8db83?q=80&w=200&auto=format&fit=crop" },
  ]);
  
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Address
  const [address, setAddress] = useState("Loading...");

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const tax = subtotal * 0.05; // 5% GST
  const total = subtotal + tax;

  const updateQuantity = (id: number, delta: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === id) {
        const newQ = item.quantity + delta;
        return newQ > 0 ? { ...item, quantity: newQ } : item;
      }
      return item;
    }));
  };

  const removeItem = (id: number) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const startCheckout = async () => {
    if (!user) {
      toast.error("Please login to proceed");
      return;
    }
    // Fetch user address
    const { data } = await supabase.from('user_addresses').select('full_address').eq('user_id', user.id).eq('is_default', true).single();
    if (data) setAddress(data.full_address);
    else setAddress("No default address set.");
    
    setIsCheckoutOpen(true);
  };

  const placeOrder = async () => {
    setLoading(true);
    try {
      // Simulate order placement
      await new Promise(r => setTimeout(r, 1500));
      
      toast.success("Order Placed Successfully!");
      setCartItems([]);
      setIsCheckoutOpen(false);
      navigate("/profile");
    } catch (err) {
      toast.error("Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center pt-20 pb-24 px-6 text-center space-y-6">
        <div className="w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center">
          <ReceiptText className="w-10 h-10 text-muted-foreground/50" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Your cart is empty</h2>
          <p className="text-muted-foreground mt-2">Looks like you haven't added anything yet.</p>
        </div>
        <Button asChild className="w-full h-14 rounded-2xl text-base font-semibold">
          <Link to="/shop">Start Browsing</Link>
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
             <div className="w-20 h-20 rounded-2xl shrink-0 overflow-hidden">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
             </div>
             <div className="flex-1 flex flex-col justify-between py-1">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold line-clamp-1">{item.name}</h4>
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
            <span>Item Total</span>
            <span className="font-semibold text-foreground">₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Taxes & GST (5%)</span>
            <span className="font-semibold text-foreground">₹{tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2 mt-2 text-base font-bold text-foreground">
            <span>To Pay</span>
            <span className="text-primary">₹{total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Checkout Floating Bar */}
      <div className="fixed bottom-16 left-0 right-0 p-4 pb-6 bg-background/80 backdrop-blur-md border-t border-border z-10">
        <Button className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/25" onClick={startCheckout}>
          Proceed to Checkout <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </div>

      {/* Checkout Bottom Sheet */}
      <Sheet open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl pt-10 pb-safe px-0 flex flex-col">
          <SheetHeader className="px-6 mb-4 text-left">
            <SheetTitle className="text-2xl font-bold">Checkout</SheetTitle>
          </SheetHeader>
          
          <div className="px-6 flex-1 overflow-y-auto space-y-6 pb-20">
            {/* Delivery Address */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Delivery Details</h4>
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-muted/40 border border-border">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">Delivery Address</p>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{address}</p>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Payment Method</h4>
              <div className="space-y-2">
                <label className="flex items-center justify-between p-4 rounded-2xl border-2 border-primary bg-primary/5 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border-4 border-primary" />
                    <span className="font-bold">Cash on Delivery</span>
                  </div>
                </label>
                <label className="flex items-center justify-between p-4 rounded-2xl border-2 border-border opacity-50 cursor-not-allowed">
                  <div className="flex items-center gap-3">
                     <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />
                     <span className="font-semibold">UPI / Card</span>
                  </div>
                  <span className="text-xs bg-muted px-2 py-1 rounded-md">Coming Soon</span>
                </label>
              </div>
            </div>

            {/* Summary List */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Order Summary</h4>
               {cartItems.map(item => (
                 <div key={item.id} className="flex justify-between items-center text-sm">
                   <span className="font-medium">{item.quantity}x {item.name}</span>
                   <span className="font-semibold text-muted-foreground">₹{item.price * item.quantity}</span>
                 </div>
               ))}
               <div className="border-t border-border pt-3 mt-3 flex justify-between items-center font-bold text-lg">
                 <span>Grand Total</span>
                 <span className="text-primary">₹{total.toFixed(2)}</span>
               </div>
            </div>

          </div>

          <div className="p-6 bg-background border-t border-border">
            <Button 
              className="w-full h-14 rounded-2xl font-bold text-base shadow-lg shadow-primary/25"
              onClick={placeOrder}
              disabled={loading}
            >
              {loading ? "Placing Order..." : `Place Order (₹${total.toFixed(2)})`}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
