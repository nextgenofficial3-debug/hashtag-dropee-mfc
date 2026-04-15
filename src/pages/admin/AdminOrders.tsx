import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("mfc_orders")
        .select(`*`)
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      setOrders(data || []);
    } catch (err: any) {
      toast.error("Failed to load orders: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Set up Realtime subscription
    const channel = supabase
      .channel('orders_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mfc_orders' }, () => {
         fetchOrders(); // refresh on change
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("mfc_orders")
        .update({ status: newStatus })
        .eq("id", orderId);
        
      if (error) throw error;
      toast.success(`Order status updated to ${newStatus}`);
    } catch (err: any) {
      toast.error("Failed to update status");
    }
  };

  if (loading) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-zinc-500" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-50">Orders</h1>
        <p className="text-zinc-400 mt-1">Manage food delivery orders in real-time.</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-zinc-950/50 text-zinc-400 text-xs uppercase border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-semibold">Order ID & Date</th>
                <th className="px-6 py-4 font-semibold">Customer</th>
                <th className="px-6 py-4 font-semibold">Address</th>
                <th className="px-6 py-4 font-semibold">Total</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {orders.length === 0 ? (
                 <tr><td colSpan={6} className="text-center py-8 text-zinc-500">No orders found.</td></tr>
              ) : orders.map((order) => (
                <tr key={order.id} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="px-6 py-4">
                     <p className="font-bold text-zinc-200">#{order.id.slice(0, 8)}</p>
                     <p className="text-xs text-zinc-500 mt-1">{new Date(order.created_at).toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-zinc-200">{order.customer_name}</p>
                    <p className="text-xs text-zinc-500">{order.customer_phone}</p>
                  </td>
                  <td className="px-6 py-4 max-w-[200px] truncate">
                     {order.customer_address}
                  </td>
                  <td className="px-6 py-4 font-bold text-green-400">
                    ₹{order.total?.toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 flex w-max text-xs font-bold rounded-md uppercase tracking-wider ${
                      order.status === 'pending' ? 'bg-orange-500/20 text-orange-400' :
                      order.status === 'preparing' ? 'bg-blue-500/20 text-blue-400' :
                      order.status === 'out_for_delivery' ? 'bg-indigo-500/20 text-indigo-400' :
                      order.status === 'delivered' ? 'bg-green-500/20 text-green-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 text-xs">
                       {order.status === 'pending' && (
                         <Button size="sm" variant="outline" className="h-8 border-zinc-700 text-zinc-300 hover:text-white" onClick={() => updateStatus(order.id, 'preparing')}>
                           Accept <ArrowRight className="w-3 h-3 ml-1" />
                         </Button>
                       )}
                       {order.status === 'preparing' && (
                         <Button size="sm" variant="outline" className="h-8 border-zinc-700 text-zinc-300 hover:text-white" onClick={() => updateStatus(order.id, 'out_for_delivery')}>
                           Dispatch <ArrowRight className="w-3 h-3 ml-1" />
                         </Button>
                       )}
                       {order.status === 'out_for_delivery' && (
                         <Button size="sm" variant="outline" className="h-8 border-zinc-700 text-zinc-300 hover:text-green-400" onClick={() => updateStatus(order.id, 'delivered')}>
                           Delivered <ArrowRight className="w-3 h-3 ml-1" />
                         </Button>
                       )}
                       
                       {(order.status === 'pending' || order.status === 'preparing') && (
                          <Button size="sm" variant="ghost" className="h-8 text-red-500 hover:text-red-400 hover:bg-red-500/10" onClick={() => updateStatus(order.id, 'cancelled')}>
                            Cancel
                          </Button>
                       )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
