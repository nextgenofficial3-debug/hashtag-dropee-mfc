import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { MenuItem } from '@/types/app';

export function useProducts(categoryId?: string) {
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    let query = supabase
      .from('mfc_products')
      .select('*')
      .eq('in_stock', true);

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    query
      .order('name')
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error('[useProducts] Failed to load products:', error.message);
          setProducts([]);
        } else {
          setProducts(
            (data || []).map((product) => ({
              ...product,
              image_url: product.images?.[0] || null,
            }))
          );
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [categoryId]);


  return { products, loading };
}
