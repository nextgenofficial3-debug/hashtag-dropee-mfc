import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Promotion } from '@/types/database';
import { toast } from 'sonner';

export const usePromotions = () => {
  return useQuery({
    queryKey: ['promotions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mfc_promotions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Promotion[];
    },
  });
};

export const useActivePromotions = () => {
  return useQuery({
    queryKey: ['promotions', 'active'],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('mfc_promotions')
        .select('*')
        .eq('is_active', true)
        .lte('valid_from', now)
        .or(`valid_until.is.null,valid_until.gte.${now}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Promotion[];
    },
  });
};

export const useCreatePromotion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (promotion: Omit<Promotion, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('mfc_promotions')
        .insert(promotion)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      toast.success('Promotion created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create promotion: ' + error.message);
    },
  });
};

export const useUpdatePromotion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...promotion }: Partial<Promotion> & { id: string }) => {
      const { data, error } = await supabase
        .from('mfc_promotions')
        .update(promotion)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      toast.success('Promotion updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update promotion: ' + error.message);
    },
  });
};

export const useDeletePromotion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('mfc_promotions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      toast.success('Promotion deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete promotion: ' + error.message);
    },
  });
};
