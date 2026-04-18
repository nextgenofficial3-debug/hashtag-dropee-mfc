import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useShops(category?: string) {
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let query = supabase.from('shops').select('*').eq('is_active', true);
    if (category) query = query.eq('category', category);
    
    query.order('name').then(({ data, error }) => {
      if (error) setError(error.message);
      else setShops(data || []);
      setLoading(false);
    });
  }, [category]);

  return { shops, loading, error };
}
