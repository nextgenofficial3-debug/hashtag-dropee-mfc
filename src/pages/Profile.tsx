import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { LogOut, User, MapPin, Receipt, Clock, Settings, ShieldAlert } from "lucide-react";

export default function Profile() {
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [address, setAddress] = useState("Loading...");
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    async function fetchProfileData() {
      // 1. Fetch Address
      const { data: addressData } = await supabase
        .from("user_addresses")
        .select("full_address")
        .eq("user_id", user?.id)
        .eq("is_default", true)
        .single();
      
      if (addressData) setAddress(addressData.full_address);
      else setAddress("No address set");

      // 2. Fetch Orders (Recent 3)
      const { data: ordersData } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(3);

      if (ordersData) setOrders(ordersData);
    }

    fetchProfileData();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Error logging out");
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
      <h1 className="text-3xl font-extrabold tracking-tight mb-8">My Profile</h1>

      {/* User Info Card */}
      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm flex items-center gap-4 mb-6 relative overflow-hidden">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <User className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">{user.user_metadata?.full_name || "Guest User"}</h2>
          <p className="text-muted-foreground text-sm">{user.email}</p>
          <p className="text-muted-foreground text-xs mt-1">{user.user_metadata?.phone || "No phone linked"}</p>
        </div>
        
        {isAdmin && (
           <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-xl">
             ADMIN
           </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Quick Links */}
        <section className="space-y-3">
          <h3 className="font-bold text-lg">Account</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/40 border border-border p-4 rounded-2xl flex flex-col items-center justify-center gap-2">
              <MapPin className="w-6 h-6 text-muted-foreground" />
              <span className="text-sm font-semibold text-center line-clamp-1">{address}</span>
            </div>
            <div className="bg-muted/40 border border-border p-4 rounded-2xl flex flex-col items-center justify-center gap-2">
              <Settings className="w-6 h-6 text-muted-foreground" />
              <span className="text-sm font-semibold">Settings</span>
            </div>
          </div>
        </section>

        {isAdmin && (
          <Button 
             variant="outline" 
             className="w-full h-14 rounded-2xl border-primary text-primary hover:bg-primary/5"
             onClick={() => navigate("/admin")}
          >
             <ShieldAlert className="w-5 h-5 mr-2" />
             Open Admin Command Center
          </Button>
        )}

        {/* Recent Orders */}
        <section className="space-y-4">
          <div className="flex justify-between items-end">
            <h3 className="font-bold text-lg">Recent Orders</h3>
            <span className="text-sm font-medium text-primary cursor-pointer hover:underline">View All</span>
          </div>

          <div className="space-y-3">
            {orders.length === 0 ? (
              <div className="p-6 text-center border-2 border-dashed border-border rounded-3xl bg-muted/20">
                 <Receipt className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                 <p className="text-sm text-muted-foreground">No recent orders</p>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="p-4 bg-card border border-border rounded-2xl shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-sm">Order #{order.id.slice(0, 8)}</span>
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
                     <span className="font-bold text-primary">₹{order.total_amount}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="pt-6">
          <Button variant="destructive" className="w-full h-14 rounded-2xl text-base font-bold bg-red-500/10 text-red-500 hover:bg-red-500/20" onClick={handleSignOut}>
            <LogOut className="w-5 h-5 mr-2" />
            Logout
          </Button>
        </section>
      </div>
    </div>
  );
}
