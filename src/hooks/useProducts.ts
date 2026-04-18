import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useProducts(shopId?: string) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let query = supabase.from('MS_menu_items').select('*').eq('is_available', true);
    if (shopId) query = query.eq('shop_id', shopId);
    
    query.order('sort_order').order('name').then(({ data }) => {
      setProducts(data || []);
      setLoading(false);
    });
  }, [shopId]);


  return { products, loading };
}
