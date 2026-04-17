import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, MapPin, Package, Truck, CheckCircle2, Clock, Phone, MessageCircle, XCircle } from "lucide-react";

interface Order {
  id: string;
  status: string;
  created_at: string;
  delivery_address: string | null;
  pickup_address: string | null;
  drop_address: string | null;
  customer_phone: string | null;
  total_amount: number | null;
  total_fee: number | null;
  items: any[] | null;
  notes: string | null;
}

const STATUS_STEPS = [
  { key: "pending", label: "Order Placed", icon: Clock },
  { key: "confirmed", label: "Confirmed", icon: CheckCircle2 },
  { key: "preparing", label: "Preparing", icon: Package },
  { key: "in_transit", label: "On the Way", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle2 },
];

const STATUS_ORDER = STATUS_STEPS.map((s) => s.key);

export default function OrderTracking() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      // Try orders table first, then delivery_orders
      let data: Order | null = null;

      const { data: orderData } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .maybeSingle();

      if (orderData) {
        data = orderData as Order;
      } else {
        const { data: deliveryData } = await supabase
          .from("delivery_orders")
          .select("*")
          .eq("id", orderId)
          .maybeSingle();
        if (deliveryData) data = deliveryData as Order;
      }

      setOrder(data);
      setLoading(false);
    };

    fetchOrder();

    // Realtime subscription
    const channel = supabase
      .channel(`mfc-order-${orderId}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "orders",
        filter: `id=eq.${orderId}`,
      }, (payload) => setOrder((prev) => prev ? { ...prev, ...payload.new } : prev))
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "delivery_orders",
        filter: `id=eq.${orderId}`,
      }, (payload) => setOrder((prev) => prev ? { ...prev, ...payload.new } : prev))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-8">
        <XCircle className="w-14 h-14 text-destructive/50" />
        <p className="text-base font-bold text-foreground">Order not found</p>
        <Link to="/orders" className="px-6 py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold">
          Back to Orders
        </Link>
      </div>
    );
  }

  const currentStepIdx = STATUS_ORDER.indexOf(order.status);
  const isCancelled = order.status === "cancelled";
  const deliveryAddress = order.delivery_address || order.drop_address;
  const totalAmount = order.total_amount || order.total_fee;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate("/orders")} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-foreground">
            Order #{order.id.slice(0, 8).toUpperCase()}
          </h1>
          <p className="text-xs text-muted-foreground">
            {new Date(order.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
          </p>
        </div>
        {isCancelled && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-destructive/15 text-destructive">
            Cancelled
          </span>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Status Timeline */}
        {!isCancelled && (
          <div className="bg-card rounded-2xl border border-border p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-5">
              Tracking Progress
            </p>
            <div className="relative">
              {/* Connector line */}
              <div className="absolute left-4 top-4 bottom-4 w-px bg-border" />
              <div className="space-y-5">
                {STATUS_STEPS.map((step, idx) => {
                  const isCompleted = idx <= currentStepIdx;
                  const isActive = idx === currentStepIdx;
                  const Icon = step.icon;
                  return (
                    <div key={step.key} className="flex items-center gap-4 relative">
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center z-10 transition-all ${
                        isCompleted
                          ? "bg-primary border-primary"
                          : "bg-secondary border-border"
                      }`}>
                        <Icon className={`w-4 h-4 ${isCompleted ? "text-primary-foreground" : "text-muted-foreground"}`} />
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${isActive ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground"}`}>
                          {step.label}
                        </p>
                        {isActive && (
                          <p className="text-xs text-muted-foreground animate-pulse">In progress...</p>
                        )}
                      </div>
                      {isActive && (
                        <div className="ml-auto">
                          <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Delivery Address */}
        {deliveryAddress && (
          <div className="bg-card rounded-2xl border border-border p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-primary" /> Delivery Address
            </p>
            <p className="text-sm text-foreground">{deliveryAddress}</p>
          </div>
        )}

        {/* Order Items */}
        {Array.isArray(order.items) && order.items.length > 0 && (
          <div className="bg-card rounded-2xl border border-border p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <Package className="w-3.5 h-3.5 text-primary" /> Items
            </p>
            <div className="space-y-2">
              {order.items.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-foreground">{item.name} {item.quantity > 1 ? `×${item.quantity}` : ""}</span>
                  <span className="text-muted-foreground">₹{(item.price || 0) * (item.quantity || 1)}</span>
                </div>
              ))}
            </div>
            {totalAmount != null && (
              <>
                <div className="h-px bg-border my-3" />
                <div className="flex justify-between font-bold">
                  <span className="text-foreground">Total</span>
                  <span className="text-primary">₹{totalAmount}</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Notes */}
        {order.notes && (
          <div className="bg-card rounded-2xl border border-border p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Notes</p>
            <p className="text-sm text-foreground">{order.notes}</p>
          </div>
        )}

        {/* Help */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Need Help?</p>
          <div className="grid grid-cols-2 gap-3">
            <a
              href="https://wa.me/918974073350"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/40 transition-all"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-400">WhatsApp</span>
            </a>
            <a
              href="tel:+918974073350"
              className="flex items-center gap-2 p-3.5 rounded-xl bg-primary/10 border border-primary/20 hover:border-primary/40 transition-all"
            >
              <Phone className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-primary">Call Support</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
