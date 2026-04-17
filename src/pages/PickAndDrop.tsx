import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, MapPin, Package, Truck, Loader2, Phone,
  ChevronRight, AlignLeft, Info,
} from "lucide-react";

const VEHICLE_TYPES = [
  { id: "bike", label: "Bike", emoji: "🏍️", description: "Small packages, fast" },
  { id: "car", label: "Car", emoji: "🚗", description: "Medium packages" },
  { id: "van", label: "Van", emoji: "🚐", description: "Large / bulky items" },
];

const SIZE_TYPES = [
  { id: "small", label: "Small", subtitle: "Fits in a backpack" },
  { id: "medium", label: "Medium", subtitle: "Shoebox size" },
  { id: "large", label: "Large", subtitle: "Bulky / heavy" },
];

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
  const [quote, setQuote] = useState<number | null>(null);

  const getQuote = () => {
    // Simple local fee calculation
    const base = vehicle === "bike" ? 40 : vehicle === "car" ? 80 : 150;
    const sizeMult = size === "small" ? 1 : size === "medium" ? 1.5 : 2.2;
    setQuote(Math.ceil(base * sizeMult));
  };

  const placeOrder = async () => {
    if (!pickup.trim() || !dropoff.trim()) {
      toast({ title: "Please enter both pickup and drop-off addresses", variant: "destructive" });
      return;
    }

    setPlacing(true);
    try {
      const fee = quote ?? 60;
      const { data, error } = await supabase
        .from("delivery_orders")
        .insert({
          user_id: user?.id,
          customer_phone: phone || null,
          pickup_address: pickup,
          drop_address: dropoff,
          notes: notes || null,
          vehicle_type: vehicle,
          package_size: size,
          total_fee: fee,
          status: "pending_assignment",
        })
        .select()
        .single();

      if (error) throw error;
      toast({ title: "✅ Pick & Drop request placed!" });
      navigate(`/orders/${data.id}`, { replace: true });
    } catch (err: any) {
      console.error("P&D error:", err);
      toast({ title: err.message || "Failed to place request", variant: "destructive" });
    }
    setPlacing(false);
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-base font-bold text-foreground">Pick &amp; Drop</h1>
          <p className="text-xs text-muted-foreground">Send anything across Ukhrul</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Route */}
        <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5" /> Route
          </p>
          <div className="relative">
            <div className="absolute left-5 top-11 bottom-11 w-px bg-border" />
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0 mt-0.5 z-10">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                </div>
                <textarea
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  placeholder="Pickup address..."
                  rows={2}
                  className="flex-1 px-4 py-3 rounded-xl bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                />
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5 z-10">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                </div>
                <textarea
                  value={dropoff}
                  onChange={(e) => setDropoff(e.target.value)}
                  placeholder="Drop-off address..."
                  rows={2}
                  className="flex-1 px-4 py-3 rounded-xl bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                />
              </div>
            </div>
          </div>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Your phone number"
            className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {/* Vehicle */}
        <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Truck className="w-3.5 h-3.5" /> Vehicle Type
          </p>
          <div className="grid grid-cols-3 gap-2">
            {VEHICLE_TYPES.map(({ id, label, emoji, description }) => (
              <button
                key={id}
                onClick={() => { setVehicle(id); setQuote(null); }}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                  vehicle === id ? "border-primary bg-primary/10" : "border-border bg-secondary"
                }`}
              >
                <span className="text-2xl">{emoji}</span>
                <span className={`text-xs font-semibold ${vehicle === id ? "text-primary" : "text-foreground"}`}>{label}</span>
                <span className="text-[10px] text-muted-foreground text-center">{description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Package Size */}
        <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Package className="w-3.5 h-3.5" /> Package Size
          </p>
          <div className="space-y-2">
            {SIZE_TYPES.map(({ id, label, subtitle }) => (
              <button
                key={id}
                onClick={() => { setSize(id); setQuote(null); }}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${
                  size === id ? "border-primary bg-primary/10" : "border-border bg-secondary"
                }`}
              >
                <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${size === id ? "border-primary" : "border-muted-foreground"}`}>
                  {size === id && <div className="w-2 h-2 rounded-full bg-primary" />}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${size === id ? "text-primary" : "text-foreground"}`}>{label}</p>
                  <p className="text-xs text-muted-foreground">{subtitle}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <AlignLeft className="w-3.5 h-3.5" /> Notes
          </p>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Fragile, handle with care. Call on arrival."
            className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {/* Price Quote */}
        {quote !== null && (
          <div className="bg-primary/10 rounded-2xl border border-primary/30 p-4 flex items-center gap-3">
            <Info className="w-5 h-5 text-primary shrink-0" />
            <div>
              <p className="text-sm font-bold text-primary">Estimated Fee: ₹{quote}</p>
              <p className="text-xs text-muted-foreground">Final price depends on distance and agent</p>
            </div>
          </div>
        )}

        {!quote && (
          <button
            onClick={getQuote}
            className="w-full py-3.5 rounded-2xl border-2 border-dashed border-primary/40 text-primary text-sm font-semibold hover:border-primary transition-all"
          >
            Get Price Estimate
          </button>
        )}
      </div>

      {/* CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
        <button
          onClick={placeOrder}
          disabled={placing || !pickup.trim() || !dropoff.trim()}
          className="w-full h-14 rounded-2xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {placing ? <Loader2 className="w-5 h-5 animate-spin" /> : (
            <><Truck className="w-5 h-5" /> Request Pick &amp; Drop{quote ? ` • ₹${quote}` : ""}</>
          )}
        </button>
      </div>
    </div>
  );
}
