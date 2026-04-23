import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Clock, MapPin, MessageCircle, Package, Phone, Truck, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { CustomerOrderListItem, DeliveryOrder, FoodOrder } from "@/types/app";

const FOOD_STEPS = ["pending", "confirmed", "preparing", "in_transit", "delivered"];
const DELIVERY_STEPS = ["pending_assignment", "accepted", "picked_up", "in_transit", "delivered"];

export default function OrderTracking() {
  const { orderId } = useParams<{ orderId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<CustomerOrderListItem | null>(null);
  const [loading, setLoading] = useState(true);
  const kind = searchParams.get("kind");

  useEffect(() => {
    if (!orderId) {
      return;
    }

    async function fetchOrder() {
      setLoading(true);

      if (kind !== "delivery") {
        const { data: foodOrder } = await supabase.from("mfc_orders").select("*").eq("id", orderId).maybeSingle();

        if (foodOrder) {
          const mappedFoodOrder: CustomerOrderListItem = {
            id: foodOrder.id,
            kind: "food",
            status: foodOrder.status,
            created_at: foodOrder.created_at,
            total: foodOrder.total,
            customer_address: foodOrder.customer_address,
            pickup_address: null,
            delivery_address: foodOrder.customer_address,
            customer_phone: foodOrder.customer_phone,
            items: Array.isArray(foodOrder.items) ? (foodOrder.items as CustomerOrderListItem["items"]) : null,
            special_instructions: foodOrder.special_instructions,
            package_description: null,
          };

          setOrder(mappedFoodOrder);
          setLoading(false);
          return;
        }
      }

      const { data: deliveryOrder } = await supabase.from("delivery_orders").select("*").eq("id", orderId).maybeSingle();

      if (deliveryOrder) {
        const mappedDeliveryOrder: CustomerOrderListItem = {
          id: deliveryOrder.id,
          kind: "delivery",
          status: deliveryOrder.status,
          created_at: deliveryOrder.created_at,
          total: deliveryOrder.total_fee,
          customer_address: deliveryOrder.delivery_address,
          pickup_address: deliveryOrder.pickup_address,
          delivery_address: deliveryOrder.delivery_address,
          customer_phone: deliveryOrder.customer_phone,
          items: null,
          special_instructions: deliveryOrder.special_instructions,
          package_description: deliveryOrder.package_description,
        };

        setOrder(mappedDeliveryOrder);
      } else {
        setOrder(null);
      }

      setLoading(false);
    }

    fetchOrder();

    const tables = kind === "delivery" ? ["delivery_orders"] : ["mfc_orders", "delivery_orders"];
    const channels = tables.map((tableName) =>
      supabase
        .channel(`${tableName}-${orderId}`)
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: tableName, filter: `id=eq.${orderId}` }, fetchOrder)
        .subscribe()
    );

    return () => {
      channels.forEach((channel) => supabase.removeChannel(channel));
    };
  }, [kind, orderId]);

  const steps = useMemo(() => {
    const orderSteps = order?.kind === "delivery" ? DELIVERY_STEPS : FOOD_STEPS;
    return orderSteps.map((step) => ({
      key: step,
      label: step.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase()),
      icon: step === "delivered" ? CheckCircle2 : step.includes("transit") || step.includes("picked") ? Truck : step === "preparing" ? Package : Clock,
    }));
  }, [order?.kind]);

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

  const currentStepIdx = steps.findIndex((step) => step.key === order.status);
  const isCancelled = order.status === "cancelled";

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-20 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate("/orders")} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-foreground">
            {order.kind === "food" ? "Food Order" : "Delivery Request"} #{order.id.slice(0, 8).toUpperCase()}
          </h1>
          <p className="text-xs text-muted-foreground">
            {new Date(order.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
          </p>
        </div>
        {isCancelled ? (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-destructive/15 text-destructive">
            Cancelled
          </span>
        ) : null}
      </div>

      <div className="p-4 space-y-4">
        {!isCancelled ? (
          <div className="bg-card rounded-2xl border border-border p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-5">
              Tracking Progress
            </p>
            <div className="relative">
              <div className="absolute left-4 top-4 bottom-4 w-px bg-border" />
              <div className="space-y-5">
                {steps.map((step, index) => {
                  const isCompleted = currentStepIdx >= 0 && index <= currentStepIdx;
                  const isActive = index === currentStepIdx;
                  const Icon = step.icon;

                  return (
                    <div key={step.key} className="flex items-center gap-4 relative">
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center z-10 transition-all ${
                        isCompleted ? "bg-primary border-primary" : "bg-secondary border-border"
                      }`}>
                        <Icon className={`w-4 h-4 ${isCompleted ? "text-primary-foreground" : "text-muted-foreground"}`} />
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${isActive ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground"}`}>
                          {step.label}
                        </p>
                        {isActive ? (
                          <p className="text-xs text-muted-foreground animate-pulse">In progress...</p>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}

        {order.pickup_address ? (
          <div className="bg-card rounded-2xl border border-border p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-primary" /> Pickup Address
            </p>
            <p className="text-sm text-foreground">{order.pickup_address}</p>
          </div>
        ) : null}

        {order.delivery_address ? (
          <div className="bg-card rounded-2xl border border-border p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-primary" /> Delivery Address
            </p>
            <p className="text-sm text-foreground">{order.delivery_address}</p>
          </div>
        ) : null}

        {Array.isArray(order.items) && order.items.length > 0 ? (
          <div className="bg-card rounded-2xl border border-border p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <Package className="w-3.5 h-3.5 text-primary" /> Items
            </p>
            <div className="space-y-2">
              {order.items.map((item, index) => (
                <div key={`${item.id}-${index}`} className="flex justify-between text-sm">
                  <span className="text-foreground">
                    {item.name} {item.quantity > 1 ? `×${item.quantity}` : ""}
                  </span>
                  <span className="text-muted-foreground">₹{(item.price || 0) * (item.quantity || 1)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : order.package_description ? (
          <div className="bg-card rounded-2xl border border-border p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Package</p>
            <p className="text-sm text-foreground">{order.package_description}</p>
          </div>
        ) : null}

        {order.special_instructions ? (
          <div className="bg-card rounded-2xl border border-border p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Instructions</p>
            <p className="text-sm text-foreground">{order.special_instructions}</p>
          </div>
        ) : null}

        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="flex justify-between font-bold">
            <span className="text-foreground">Total</span>
            <span className="text-primary">₹{order.total || 0}</span>
          </div>
        </div>

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
