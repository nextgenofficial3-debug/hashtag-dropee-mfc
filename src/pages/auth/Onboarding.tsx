import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Navigation } from "lucide-react";

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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
            address: "Current Location (Map Pin Enabled)",
          }));
        },
        (error) => {
          console.error("Error fetching location", error);
        }
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      // 1. Update user auth metadata with phone and name
      await supabase.auth.updateUser({
        data: {
          full_name: formData.name,
          phone: formData.phone,
          onboarded: true,
        }
      });

      // 2. Save address map pin
      if (formData.lat && formData.lng) {
        await supabase.from("user_addresses").insert({
          user_id: user.id,
          label: "Home",
          full_address: formData.address,
          latitude: formData.lat,
          longitude: formData.lng,
          is_default: true,
        });
      }
      
      // Request notifications permission (browser)
      if ("Notification" in window) {
        await Notification.requestPermission();
      }

      navigate("/");
    } catch (err) {
      console.error(err);
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input 
              id="name" 
              placeholder="Your name" 
              value={formData.name}
              onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number (OTP Verification)</Label>
            <Input 
              id="phone" 
              placeholder="+91..." 
              value={formData.phone}
              onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Delivery Address (Pin Drop)</Label>
            <div className="rounded-xl border border-border p-4 bg-muted/30">
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Pin Your Location</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{formData.address || "No location set"}</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={handleFetchLocation}>
                  <Navigation className="w-4 h-4 mr-2" />
                  Locate
                </Button>
              </div>
            </div>
            {!formData.lat && <p className="text-xs text-destructive">Location is required for delivery</p>}
          </div>

          <Button 
            type="submit" 
            className="w-full h-14 text-base font-semibold rounded-2xl" 
            disabled={loading || !formData.lat || !formData.phone}
          >
            {loading ? "Saving..." : "Start Ordering"}
          </Button>
        </form>
      </div>
    </div>
  );
}
