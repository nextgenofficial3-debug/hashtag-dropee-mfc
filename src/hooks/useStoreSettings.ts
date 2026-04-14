import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StoreSettings } from '@/types/database';
import { toast } from 'sonner';

export const useStoreSettings = () => {
  return useQuery({
    queryKey: ['store-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mfc_store_settings')
        .select('*')
        .limit(1)
        .single();

      if (error) throw error;
      return data as StoreSettings;
    },
  });
};

export const useUpdateStoreSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...settings }: Partial<StoreSettings> & { id: string }) => {
      const { data, error } = await supabase
        .from('mfc_store_settings')
        .update(settings)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-settings'] });
      toast.success('Store settings updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update store settings: ' + error.message);
    },
  });
};

export const useIsStoreOpen = () => {
  const { data: settings } = useStoreSettings();

  if (!settings) return true;

  if (!settings.use_scheduled_hours) {
    return settings.is_open;
  }

  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = now.toTimeString().slice(0, 5);

  const isDayOpen = settings.open_days.includes(currentDay);
  const isWithinHours = currentTime >= settings.opening_time && currentTime <= settings.closing_time;

  return settings.is_open && isDayOpen && isWithinHours;
};
