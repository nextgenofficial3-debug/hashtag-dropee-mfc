import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useCustomerOrders(userId?: string) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from('orders')
      .select('*, shops(name, logo_url), order_status_logs(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setOrders(data || []);
        setLoading(false);
      });

    // Realtime: update order status live
    const channel = supabase
      .channel(`customer-orders-${userId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `user_id=eq.${userId}`
      }, payload => {
        setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o));
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [userId]);

  return { orders, loading };
}
