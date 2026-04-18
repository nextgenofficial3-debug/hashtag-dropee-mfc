import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Navigation, AlertCircle } from "lucide-react";

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualAddress, setManualAddress] = useState("");
  const [formData, setFormData] = useState({
    name: user?.user_metadata?.full_name || "",
    phone: "",
    address: "",
    lat: null as number | null,
    lng: null as number | null,
  });

  const handleFetchLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            address: "Current Location (GPS)",
          }));
        },
        (err) => {
          console.error("Geolocation error", err);
        }
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError(null);
    setLoading(true);

    try {
      // 1. Update user auth metadata
      const { error: authErr } = await supabase.auth.updateUser({
        data: {
          full_name: formData.name,
          phone: formData.phone,
          onboarded: true,
        },
      });
      if (authErr) throw authErr;

      // 2. Save address if GPS or manual address provided
      const finalAddress = formData.address || manualAddress;
      if (formData.lat && formData.lng) {
        await supabase.from("mfc_user_addresses").insert({
          user_id: user.id,
          address_type: "Home",
          full_address: finalAddress,
          lat: formData.lat,
          lng: formData.lng,
          is_default: true,
        });
      } else if (manualAddress.trim()) {
        await supabase.from("mfc_user_addresses").insert({
          user_id: user.id,
          address_type: "Home",
          full_address: manualAddress,
          lat: null,
          lng: null,
          is_default: true,
        });
      }

      // 3. Request notifications permission
      if ("Notification" in window) {
        await Notification.requestPermission();
      }

      navigate("/");
    } catch (err: any) {
      console.error("Onboarding save error:", err);
      setError("Save failed: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 pt-16 relative">
      <div className="max-w-md mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Complete Profile</h1>
          <p className="text-muted-foreground mt-2">Just a few more details before you can order.</p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="Your name"
              value={formData.name}
              onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              placeholder="+91..."
              value={formData.phone}
              onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Delivery Address <span className="text-muted-foreground font-normal">(optional)</span></Label>

            {/* Manual address text input */}
            <Input
              type="text"
              placeholder="Type your address manually (optional)"
              value={manualAddress}
              onChange={(e) => setManualAddress(e.target.value)}
            />

            {/* GPS pin location */}
            <div className="rounded-xl border border-border p-4 bg-muted/30">
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <MapPin className={`w-6 h-6 ${formData.lat ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Pin Your Location</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {formData.address || "Optional — tap Locate to use GPS"}
                  </p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={handleFetchLocation}>
                  <Navigation className="w-4 h-4 mr-2" />
                  Locate
                </Button>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-14 text-base font-semibold rounded-2xl"
            disabled={loading || !formData.phone}
          >
            {loading ? "Saving..." : "Start Ordering"}
          </Button>
        </form>
      </div>
    </div>
  );
}
