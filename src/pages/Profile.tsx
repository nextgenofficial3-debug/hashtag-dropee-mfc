import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Clock, Edit2, LogOut, MapPin, Receipt, ShieldAlert, User, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCustomerOrders } from "@/hooks/useCustomerOrders";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UserAddress } from "@/types/app";

export default function Profile() {
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { orders } = useCustomerOrders(user?.id);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [addressId, setAddressId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    setName(user.user_metadata?.full_name || "");
    setPhone(user.user_metadata?.phone || "");

    async function fetchProfileData() {
      const { data: addressData } = await supabase
        .from("mfc_user_addresses")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_default", true)
        .maybeSingle();

      if (addressData) {
        const currentAddress = addressData as UserAddress;
        setAddress(currentAddress.full_address);
        setAddressId(currentAddress.id);
      } else {
        setAddress("");
        setAddressId(null);
      }
    }

    fetchProfileData();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: name, phone },
      });

      if (authError) throw authError;

      if (address.trim()) {
        if (addressId) {
          const { error } = await supabase
            .from("mfc_user_addresses")
            .update({ full_address: address })
            .eq("id", addressId);

          if (error) throw error;
        } else {
          const { data, error } = await supabase
            .from("mfc_user_addresses")
            .insert({
              user_id: user.id,
              full_address: address,
              is_default: true,
              address_type: "Home",
            })
            .select()
            .single();

          if (error) throw error;
          setAddressId(data.id);
        }
      }

      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update profile";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center pt-20 px-6 text-center space-y-6">
        <User className="w-16 h-16 text-muted-foreground/50" />
        <div>
          <h2 className="text-2xl font-bold">Not Logged In</h2>
          <p className="text-muted-foreground mt-2">Login to view your profile and orders.</p>
        </div>
        <Button onClick={() => navigate("/auth/login")} className="w-full h-14 rounded-2xl">
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 pt-20 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">My Profile</h1>
        {!isEditing ? (
          <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
            <Edit2 className="w-5 h-5 text-primary" />
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)} disabled={loading}>
              <X className="w-5 h-5 text-muted-foreground" />
            </Button>
            <Button variant="default" size="icon" onClick={handleSave} disabled={loading}>
              <Check className="w-5 h-5" />
            </Button>
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm mb-6 relative overflow-hidden">
        {isAdmin ? (
          <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-xl z-10">
            ADMIN
          </div>
        ) : null}

        {isEditing ? (
          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label>Full Name</Label>
              <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" />
            </div>
            <div className="space-y-1">
              <Label>Phone Number</Label>
              <Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Your phone number" type="tel" />
            </div>
            <div className="space-y-1">
              <Label>Default Address</Label>
              <Input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Your full address" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold truncate">{name || "Guest User"}</h2>
              <p className="text-muted-foreground text-sm truncate">{user.email}</p>
              <p className="text-muted-foreground text-xs mt-1 truncate">{phone || "No phone linked"}</p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {!isEditing ? (
          <section className="space-y-3">
            <h3 className="font-bold text-lg">Account</h3>
            <div className="bg-muted/40 border border-border p-4 rounded-2xl flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">Delivery Address</p>
                <p className="text-xs text-muted-foreground truncate">{address || "No address set"}</p>
              </div>
            </div>
          </section>
        ) : null}

        {isAdmin ? (
          <Button
            variant="outline"
            className="w-full h-14 rounded-2xl border-primary text-primary hover:bg-primary/5"
            onClick={() => navigate("/admin")}
          >
            <ShieldAlert className="w-5 h-5 mr-2" />
            Open Admin Command Center
          </Button>
        ) : null}

        <section className="space-y-4">
          <div className="flex justify-between items-end">
            <h3 className="font-bold text-lg">Recent Orders</h3>
            <span className="text-sm font-medium text-primary cursor-pointer hover:underline" onClick={() => navigate("/orders")}>
              View All
            </span>
          </div>

          <div className="space-y-3">
            {orders.length === 0 ? (
              <div className="p-6 text-center border-2 border-dashed border-border rounded-3xl bg-muted/20 flex flex-col items-center">
                <Receipt className="w-8 h-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No recent orders</p>
                <Button variant="link" onClick={() => navigate("/shop")} className="mt-2 text-primary">Start ordering</Button>
              </div>
            ) : (
              orders.slice(0, 3).map((order) => (
                <div
                  key={`${order.kind}-${order.id}`}
                  className="p-4 bg-card border border-border rounded-2xl shadow-sm cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => navigate(`/orders/${order.id}?kind=${order.kind}`)}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-sm">
                      {order.kind === "food" ? "Food Order" : "Delivery"} #{order.id.slice(0, 8)}
                    </span>
                    <span className="text-xs font-semibold px-2 py-1 bg-muted rounded-md uppercase">
                      {order.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="font-bold text-primary">₹{order.total || 0}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="pt-6">
          <Button
            variant="destructive"
            className="w-full h-14 rounded-2xl text-base font-bold bg-red-500/10 text-red-500 hover:bg-red-500/20"
            onClick={() => void signOut()}
          >
            <LogOut className="w-5 h-5 mr-2" />
            Logout
          </Button>
        </section>
      </div>
    </div>
  );
}
