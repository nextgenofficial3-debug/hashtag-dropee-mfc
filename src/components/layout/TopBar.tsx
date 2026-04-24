import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { StoreSettings } from "@/types/app";

export default function TopBar() {
  const [brandName, setBrandName] = useState("MFC Food");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('mfc_store_settings')
        .select('brand_name, brand_logo_url')
        .single();
      
      if (data && !error) {
        const settings = data as Pick<StoreSettings, "brand_name" | "brand_logo_url">;
        if (settings.brand_name) setBrandName(settings.brand_name);
        if (settings.brand_logo_url) setLogoUrl(settings.brand_logo_url);
      }
    };
    fetchSettings();
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl border-b border-border/40 transition-all duration-300">
      <div className="flex h-14 items-center px-4 max-w-md mx-auto">
        <div className="flex items-center space-x-2">
          {logoUrl ? (
            <img src={logoUrl} alt={brandName} className="w-8 h-8 rounded-lg object-cover" />
          ) : (
            <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-primary-foreground font-bold text-lg select-none">
                {brandName.charAt(0)}
              </span>
            </div>
          )}
          <span className="font-bold tracking-tight text-lg truncate uppercase">
            {brandName}
          </span>
        </div>
      </div>
    </header>
  );
}
