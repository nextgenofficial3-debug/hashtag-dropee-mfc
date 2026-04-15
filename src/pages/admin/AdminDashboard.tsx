import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ReceiptText, IndianRupee, Users, TrendingUp } from "lucide-react";

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState({
    todayOrders: 0,
    todayRevenue: 0,
    pendingReservations: 0,
  });

  useEffect(() => {
    async function fetchDashboardData() {
       const today = new Date();
       today.setHours(0,0,0,0);
       
       const { data: orders } = await supabase
         .from("mfc_orders")
         .select("total")
         .gte("created_at", today.toISOString());
         
       const { count: resCount } = await supabase
         .from("mfc_reservations")
         .select("*", { count: 'exact', head: true })
         .eq("status", "pending");

       const revenue = orders?.reduce((acc, curr) => acc + (curr.total || 0), 0) || 0;
       
       setMetrics({
         todayOrders: orders?.length || 0,
         todayRevenue: revenue,
         pendingReservations: resCount || 0,
       });
    }

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-50">Dashboard</h1>
        <p className="text-zinc-400 mt-1">Overview of today's performance.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
         <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-zinc-400">Today's Revenue</h3>
              <IndianRupee className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-zinc-50">₹{metrics.todayRevenue.toFixed(2)}</div>
            <p className="text-xs text-green-500 flex items-center mt-2">
               <TrendingUp className="w-3 h-3 mr-1" /> +12% from yesterday
            </p>
         </div>

         <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-zinc-400">Orders Today</h3>
              <ReceiptText className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-3xl font-bold text-zinc-50">{metrics.todayOrders}</div>
         </div>

         <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-zinc-400">Pending Reservations</h3>
              <Users className="w-5 h-5 text-orange-500" />
            </div>
            <div className="text-3xl font-bold text-zinc-50">{metrics.pendingReservations}</div>
         </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 min-h-[300px]">
         <h3 className="font-bold text-lg mb-4 text-zinc-50">Recent Activity</h3>
         {/* Placeholder for activity feed */}
         <div className="flex items-center justify-center h-full mt-10">
            <p className="text-zinc-500 text-sm">No recent activity.</p>
         </div>
      </div>
    </div>
  );
}
