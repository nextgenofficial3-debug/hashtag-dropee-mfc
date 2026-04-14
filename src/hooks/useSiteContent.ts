import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SiteContent {
  id: string;
  section: 'about' | 'contact';
  title: string;
  content: string;
  address: string | null;
  email: string | null;
  phone_1: string | null;
  phone_2: string | null;
  map_embed_url: string | null;
  directions_url: string | null;
  image_url: string | null;
  updated_at: string;
}

export const useSiteContent = (section?: 'about' | 'contact') => {
  return useQuery({
    queryKey: ['site-content', section],
    queryFn: async () => {
      if (section) {
        const { data, error } = await supabase
          .from('mfc_site_content')
          .select('*')
          .eq('section', section)
          .single();
        
        if (error) throw error;
        return data as SiteContent;
      }
      
      const { data, error } = await supabase
        .from('mfc_site_content')
        .select('*');
      
      if (error) throw error;
      return data as SiteContent[];
    },
  });
};

export const useUpdateSiteContent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      section, 
      updates 
    }: { 
      section: 'about' | 'contact'; 
      updates: Partial<Omit<SiteContent, 'id' | 'section' | 'updated_at'>> 
    }) => {
      const { data, error } = await supabase
        .from('mfc_site_content')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('section', section)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['site-content'] });
      toast.success(`${variables.section === 'about' ? 'About' : 'Contact'} section updated!`);
    },
    onError: (error) => {
      console.error('Update error:', error);
      toast.error('Failed to update content');
    },
  });
};
