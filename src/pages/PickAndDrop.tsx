import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlignLeft, ArrowLeft, Info, Loader2, MapPin, Package, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const VEHICLE_TYPES = [
  { id: "bike", label: "Bike", description: "Small packages, fast" },
  { id: "car", label: "Car", description: "Medium packages" },
  { id: "van", label: "Van", description: "Large or bulky items" },
];

const SIZE_TYPES = [
  { id: "small", label: "Small", subtitle: "Fits in a backpack", weightKg: 1 },
  { id: "medium", label: "Medium", subtitle: "Shoebox size", weightKg: 3 },
  { id: "large", label: "Large", subtitle: "Bulky or heavy", weightKg: 7 },
];

function buildOrderCode() {
  return `PD-${Date.now().toString().slice(-6)}`;
}

export default function PickAndDrop() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [phone, setPhone] = useState(user?.user_metadata?.phone || "");
  const [notes, setNotes] = useState("");
  const [vehicle, setVehicle] = useState("bike");
  const [size, setSize] = useState("small");
  const [placing, setPlacing] = useState(false);

  const quote = useMemo(() => {
    const base = vehicle === "bike" ? 40 : vehicle === "car" ? 80 : 150;
    const sizeMultiplier = size === "small" ? 1 : size === "medium" ? 1.5 : 2.2;
    return Math.ceil(base * sizeMultiplier);
  }, [size, vehicle]);

  const placeOrder = async () => {
    if (!user) {
      navigate("/auth/login");
      return;
    }

    if (!pickup.trim() || !dropoff.trim()) {
      toast({ title: "Please enter both pickup and drop-off addresses", variant: "destructive" });
      return;
    }

    setPlacing(true);
    try {
      const selectedSize = SIZE_TYPES.find((item) => item.id === size);
      const packageDescription = `${vehicle.toUpperCase()} delivery for a ${size} package`;

      const { data, error } = await supabase
        .from("delivery_orders")
        .insert({
          customer_user_id: user.id,
          customer_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Customer",
          customer_phone: phone || null,
          pickup_address: pickup,
          delivery_address: dropoff,
          special_instructions: notes || null,
          package_description: packageDescription,
          package_weight_kg: selectedSize?.weightKg || 1,
          order_code: buildOrderCode(),
          total_fee: quote,
          base_fee: quote,
          status: "pending_assignment",
        })
        .select()
        .single();

      if (error) throw error;

      toast({ title: "Pick and drop request placed" });
      navigate(`/orders/${data.id}?kind=delivery`, { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to place request";
      toast({ title: message, variant: "destructive" });
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="sticky top-0 z-20 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-base font-bold text-foreground">Pick & Drop</h1>
          <p className="text-xs text-muted-foreground">Send anything across Ukhrul</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5" /> Route
          </p>
          <textarea
            value={pickup}
            onChange={(event) => setPickup(event.target.value)}
            placeholder="Pickup address..."
            rows={2}
            className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
          />
          <textarea
            value={dropoff}
            onChange={(event) => setDropoff(event.target.value)}
            placeholder="Drop-off address..."
            rows={2}
            className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
          />
          <input
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Your phone number"
            className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Truck className="w-3.5 h-3.5" /> Vehicle Type
          </p>
          <div className="grid grid-cols-3 gap-2">
            {VEHICLE_TYPES.map((item) => (
              <button
                key={item.id}
                onClick={() => setVehicle(item.id)}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                  vehicle === item.id ? "border-primary bg-primary/10" : "border-border bg-secondary"
                }`}
              >
                <span className={`text-xs font-semibold ${vehicle === item.id ? "text-primary" : "text-foreground"}`}>{item.label}</span>
                <span className="text-[10px] text-muted-foreground text-center">{item.description}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Package className="w-3.5 h-3.5" /> Package Size
          </p>
          <div className="space-y-2">
            {SIZE_TYPES.map((item) => (
              <button
                key={item.id}
                onClick={() => setSize(item.id)}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${
                  size === item.id ? "border-primary bg-primary/10" : "border-border bg-secondary"
                }`}
              >
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${size === item.id ? "text-primary" : "text-foreground"}`}>{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <AlignLeft className="w-3.5 h-3.5" /> Notes
          </p>
          <input
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Fragile, handle with care. Call on arrival."
            className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="bg-primary/10 rounded-2xl border border-primary/30 p-4 flex items-center gap-3">
          <Info className="w-5 h-5 text-primary shrink-0" />
          <div>
            <p className="text-sm font-bold text-primary">Estimated Fee: ₹{quote}</p>
            <p className="text-xs text-muted-foreground">The final fee can change if an admin adjusts the trip</p>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
        <button
          onClick={placeOrder}
          disabled={placing || !pickup.trim() || !dropoff.trim()}
          className="w-full h-14 rounded-2xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {placing ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Truck className="w-5 h-5" /> Request Pick & Drop • ₹{quote}</>}
        </button>
      </div>
    </div>
  );
}
