import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { MenuItem } from '@/types/app';

export function useProducts(categoryId?: string) {
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    let query = supabase
      .from('mfc_menu_items')
      .select('*')
      .eq('is_available', true);

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    query
      .order('name')
      .then(({ data }) => {
        setProducts(data || []);
        setLoading(false);
      });
  }, [categoryId]);


  return { products, loading };
}
