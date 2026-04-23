import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, Loader2, MapPin, ShoppingCart, Trash2, Wallet2, Banknote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { clearCart, readCart } from "@/lib/cart";
import type { CartItem, StoreSettings, UserAddress } from "@/types/app";

const PAYMENT_METHODS = [
  { id: "cod", label: "Cash on Delivery", icon: Banknote },
  { id: "upi", label: "UPI Payment", icon: Wallet2 },
  { id: "card", label: "Credit / Debit Card", icon: CreditCard },
];

interface CouponState {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_order_amount: number | null;
  max_uses: number | null;
  used_count: number | null;
}

export default function Checkout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState(user?.user_metadata?.phone || "");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [placing, setPlacing] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<CouponState | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);

  useEffect(() => {
    setCart(readCart());
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    async function preloadCheckoutData() {
      const [{ data: settings }, { data: defaultAddress }] = await Promise.all([
        supabase.from("mfc_store_settings").select("*").single(),
        supabase
          .from("mfc_user_addresses")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_default", true)
          .maybeSingle(),
      ]);

      if (settings) {
        setStoreSettings(settings);
      }

      if (defaultAddress) {
        setAddress((defaultAddress as UserAddress).full_address);
      }
    }

    preloadCheckoutData();
  }, [user]);

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );
  const deliveryFee = subtotal > 0 ? Number(storeSettings?.base_delivery_fee || 0) : 0;
  const packagingFee = subtotal > 0 ? Number(storeSettings?.packaging_fee || 0) : 0;
  const total = Math.max(0, subtotal + deliveryFee + packagingFee - discountAmount);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;

    setValidatingCoupon(true);
    try {
      const { data, error } = await supabase
        .from("mfc_coupons")
        .select("*")
        .eq("code", couponCode.trim().toUpperCase())
        .eq("is_active", true)
        .single();

      if (error || !data) {
        throw new Error("Invalid or expired coupon");
      }

      if (data.min_order_amount && subtotal < data.min_order_amount) {
        throw new Error(`Minimum order amount is ₹${data.min_order_amount}`);
      }

      if (data.max_uses && data.used_count && data.used_count >= data.max_uses) {
        throw new Error("Coupon usage limit reached");
      }

      const amount =
        data.discount_type === "percentage"
          ? subtotal * (data.discount_value / 100)
          : data.discount_value;

      setAppliedCoupon(data as CouponState);
      setDiscountAmount(amount);
      toast({ title: `Coupon applied: ₹${amount.toFixed(2)} off` });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to apply coupon";
      toast({ title: message, variant: "destructive" });
      setAppliedCoupon(null);
      setDiscountAmount(0);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setCouponCode("");
    setAppliedCoupon(null);
    setDiscountAmount(0);
  };

  const placeOrder = async () => {
    if (!user) {
      navigate("/auth/login");
      return;
    }

    if (!address.trim()) {
      toast({ title: "Please enter your delivery address", variant: "destructive" });
      return;
    }

    if (!phone.trim()) {
      toast({ title: "Please enter your phone number", variant: "destructive" });
      return;
    }

    setPlacing(true);

    try {
      const { data: order, error } = await supabase
        .from("mfc_orders")
        .insert({
          user_id: user.id,
          customer_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Guest",
          customer_phone: phone,
          customer_address: address,
          special_instructions: notes || null,
          payment_method: paymentMethod,
          subtotal,
          discount: discountAmount,
          total,
          status: "pending",
          items: cart,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      clearCart();
      setCart([]);
      toast({ title: "Order placed successfully" });
      navigate(`/orders/${order.id}`, { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to place order";
      toast({ title: message, variant: "destructive" });
    } finally {
      setPlacing(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-8 pt-24">
        <ShoppingCart className="w-16 h-16 text-muted-foreground/30" />
        <p className="text-lg font-bold text-foreground">Your cart is empty</p>
        <p className="text-sm text-muted-foreground text-center">Add items from the menu before checking out</p>
        <button
          onClick={() => navigate("/shop")}
          className="mt-4 px-6 py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold"
        >
          Browse Menu
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="sticky top-0 z-20 bg-background border-b border-border px-4 py-3 flex items-center gap-3 pt-safe">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-bold text-foreground">Checkout</h1>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
          {cart.map((item) => (
            <div key={item.id} className="flex items-center gap-3 p-4">
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="w-14 h-14 rounded-xl object-cover shrink-0" />
              ) : null}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
              </div>
              <p className="font-bold text-foreground shrink-0">₹{item.price * item.quantity}</p>
            </div>
          ))}
        </div>

        <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">Delivery Address</p>
          </div>
          <textarea
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder="e.g. Ukhrul Town, near DC Office, Manipur 795842"
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
          />
          <input
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Phone number"
            className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <input
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Delivery notes (optional)"
            className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">Payment Method</p>
          </div>
          <div className="space-y-2">
            {PAYMENT_METHODS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setPaymentMethod(id)}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${
                  paymentMethod === id
                    ? "border-primary bg-primary/10"
                    : "border-border bg-secondary hover:border-primary/30"
                }`}
              >
                <Icon className={`w-5 h-5 ${paymentMethod === id ? "text-primary" : "text-muted-foreground"}`} />
                <span className={`text-sm font-medium ${paymentMethod === id ? "text-primary" : "text-foreground"}`}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">Have a coupon?</span>
          </div>
          {appliedCoupon ? (
            <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-xl p-3">
              <div>
                <p className="text-sm font-bold text-primary">{appliedCoupon.code}</p>
                <p className="text-xs text-primary/80">₹{discountAmount.toFixed(2)} saved</p>
              </div>
              <button onClick={removeCoupon} className="p-2 text-destructive hover:bg-destructive/10 rounded-xl">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                value={couponCode}
                onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
                placeholder="Enter code"
                className="flex-1 px-4 py-3 rounded-xl bg-secondary border border-border text-sm text-foreground uppercase placeholder:normal-case placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <button
                onClick={applyCoupon}
                disabled={validatingCoupon || !couponCode.trim()}
                className="px-5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 disabled:opacity-60 transition-all font-semibold whitespace-nowrap"
              >
                {validatingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
              </button>
            </div>
          )}
        </div>

        <div className="bg-card rounded-2xl border border-border p-4 space-y-2">
          <p className="text-sm font-semibold text-foreground mb-3">Order Summary</p>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="text-foreground">₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Delivery Fee</span>
            <span className="text-foreground">₹{deliveryFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Packaging Fee</span>
            <span className="text-foreground">₹{packagingFee.toFixed(2)}</span>
          </div>
          {discountAmount > 0 ? (
            <div className="flex justify-between text-sm">
              <span className="text-primary font-medium">Discount</span>
              <span className="text-primary font-medium">-₹{discountAmount.toFixed(2)}</span>
            </div>
          ) : null}
          <div className="h-px bg-border my-1" />
          <div className="flex justify-between text-base font-bold">
            <span className="text-foreground">Total</span>
            <span className="text-primary">₹{total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
        <button
          onClick={placeOrder}
          disabled={placing}
          className="w-full h-14 rounded-2xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {placing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            `Place Order • ₹${total.toFixed(2)}`
          )}
        </button>
      </div>
    </div>
  );
}
