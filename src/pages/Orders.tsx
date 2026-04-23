import { Link } from "react-router-dom";
import { ChevronRight, CheckCircle2, Clock, Package, Truck, XCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCustomerOrders } from "@/hooks/useCustomerOrders";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: "Pending", color: "text-amber-400 bg-amber-400/10", icon: Clock },
  confirmed: { label: "Confirmed", color: "text-primary bg-primary/10", icon: CheckCircle2 },
  preparing: { label: "Preparing", color: "text-orange-400 bg-orange-400/10", icon: Package },
  in_transit: { label: "On the way", color: "text-sky-400 bg-sky-400/10", icon: Truck },
  pending_assignment: { label: "Waiting for rider", color: "text-amber-400 bg-amber-400/10", icon: Clock },
  accepted: { label: "Accepted", color: "text-primary bg-primary/10", icon: CheckCircle2 },
  delivered: { label: "Delivered", color: "text-emerald-400 bg-emerald-400/10", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "text-destructive bg-destructive/10", icon: XCircle },
};

export default function Orders() {
  const { user } = useAuth();
  const { orders, loading } = useCustomerOrders(user?.id);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8 pt-24 text-center">
        <div>
          <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-base font-bold text-foreground">Sign in to view orders</p>
          <Link to="/auth/login" className="mt-6 inline-block px-6 py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 pt-20">
      <div className="px-4 mb-6">
        <h1 className="text-2xl font-extrabold text-foreground">My Orders</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Track your food and pick-and-drop orders</p>
      </div>

      {loading ? (
        <div className="px-4 space-y-3">
          {[1, 2, 3].map((item) => <div key={item} className="h-24 rounded-2xl bg-secondary/50 animate-pulse" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="px-4 py-16 text-center">
          <Package className="w-14 h-14 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-base font-bold text-foreground">No orders yet</p>
          <p className="text-sm text-muted-foreground mt-2 mb-6">
            Order food or request a pick and drop to get started
          </p>
          <Link to="/shop" className="inline-block px-6 py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="px-4 space-y-3">
          {orders.map((order) => {
            const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const Icon = config.icon;
            const itemCount = Array.isArray(order.items) ? order.items.length : 0;
            return (
              <Link key={`${order.kind}-${order.id}`} to={`/orders/${order.id}?kind=${order.kind}`} className="block">
                <div className="flex items-center gap-3 bg-card rounded-2xl border border-border p-4 hover:border-primary/30 transition-all">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${config.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-foreground truncate">
                        {order.kind === "food" ? "Food Order" : "Delivery Request"} #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${config.color}`}>
                        {config.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {order.kind === "food"
                        ? `${itemCount} item${itemCount === 1 ? "" : "s"}`
                        : order.package_description || "Pick and drop request"}
                      {order.total != null ? ` • ₹${order.total}` : ""}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      {new Date(order.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
