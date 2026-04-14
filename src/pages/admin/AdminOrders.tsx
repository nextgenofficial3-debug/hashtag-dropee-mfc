import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Package, Clock, Truck, CheckCircle, RefreshCw, Bell, Download, Link, Link2Off, Trash2 } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  special_instructions: string | null;
  payment_method: string;
  items: any[];
  subtotal: number;
  discount: number;
  total: number;
  status: string;
  created_at: string;
  hub_order_id: string | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Clock },
  preparing: { label: 'Preparing', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Package },
  'out_for_delivery': { label: 'Out for Delivery', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle },
};

const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('mfc_orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) toast.error('Failed to load orders');
    else setOrders((data as Order[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mfc_orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const { sendNotification } = usePushNotifications();

  const updateStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase.from('mfc_orders').update({ status: newStatus }).eq('id', orderId);
    if (error) {
      toast.error('Failed to update');
    } else {
      toast.success(`Order marked as ${newStatus}`);
      const statusLabel = statusConfig[newStatus]?.label || newStatus;
      await sendNotification(
        'Order Update 🍗',
        `Your order #${orderId.slice(0, 8).toUpperCase()} is now: ${statusLabel}`,
        orderId
      );
    }
  };

  const deleteOrder = async (orderId: string) => {
    const { error } = await supabase.from('mfc_orders').delete().eq('id', orderId);
    if (error) {
      toast.error('Failed to delete order');
    } else {
      toast.success('Order deleted');
      setOrders(prev => prev.filter(o => o.id !== orderId));
    }
  };

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  const exportCSV = () => {
    if (filtered.length === 0) {
      toast.error('No orders to export');
      return;
    }
    const headers = ['Order ID', 'Date', 'Customer Name', 'Phone', 'Address', 'Items', 'Subtotal', 'Discount', 'Total', 'Payment Method', 'Status', 'Special Instructions'];
    const rows = filtered.map(o => [
      o.id.slice(0, 8).toUpperCase(),
      new Date(o.created_at).toLocaleString(),
      o.customer_name,
      o.customer_phone,
      `"${o.customer_address.replace(/"/g, '""')}"`,
      `"${(o.items as any[]).map((i: any) => `${i.name} x${i.quantity}`).join(', ')}"`,
      o.subtotal,
      o.discount,
      o.total,
      o.payment_method,
      statusConfig[o.status]?.label || o.status,
      `"${(o.special_instructions || '').replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} orders`);
  };

  return (
    <AdminSidebar>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">Orders</h1>
            <p className="text-muted-foreground">Manage incoming orders in real-time</p>
          </div>
          <div className="flex gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="preparing">Preparing</SelectItem>
                <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportCSV} className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button variant="outline" size="icon" onClick={fetchOrders}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">No orders found</div>
        ) : (
          <div className="grid gap-4">
            {filtered.map((order) => {
              const cfg = statusConfig[order.status] || statusConfig.pending;
              const StatusIcon = cfg.icon;
              return (
                <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-base">
                            #{order.id.slice(0, 8).toUpperCase()}
                          </CardTitle>
                          <Badge variant="outline" className={cfg.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {cfg.label}
                          </Badge>
                          {order.hub_order_id ? (
                            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                              <Link className="h-3 w-3 mr-1" />
                              Hub Synced
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-muted text-muted-foreground border-border">
                              <Link2Off className="h-3 w-3 mr-1" />
                              Not Synced
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {new Date(order.created_at).toLocaleString()}
                          </span>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Order</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete order #{order.id.slice(0, 8).toUpperCase()}? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteOrder(order.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                        <div>
                          <p className="text-sm font-medium">{order.customer_name}</p>
                          <p className="text-xs text-muted-foreground">{order.customer_phone}</p>
                          <p className="text-xs text-muted-foreground mt-1">{order.customer_address}</p>
                          {order.special_instructions && (
                            <p className="text-xs text-yellow-400 mt-1">📝 {order.special_instructions}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-medium mb-1">Items:</p>
                          {(order.items as any[]).map((item: any, i: number) => (
                            <p key={i} className="text-xs text-muted-foreground">
                              {item.name} × {item.quantity} — ₹{item.price * item.quantity}
                            </p>
                          ))}
                          <p className="text-sm font-bold mt-2 text-gold">Total: ₹{order.total}</p>
                          <p className="text-xs text-muted-foreground">Payment: {order.payment_method}</p>
                        </div>
                        <div className="flex items-end">
                          <Select
                            value={order.status}
                            onValueChange={(val) => updateStatus(order.id, val)}
                          >
                            <SelectTrigger className="w-full md:w-[180px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="preparing">Preparing</SelectItem>
                              <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                              <SelectItem value="delivered">Delivered</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </AdminSidebar>
  );
};

export default AdminOrders;
