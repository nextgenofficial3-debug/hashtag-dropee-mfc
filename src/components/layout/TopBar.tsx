import React, { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationsSheet } from "./NotificationsSheet";
import type { StoreSettings } from "@/types/app";

export default function TopBar() {
  const [brandName, setBrandName] = useState("MFC Food");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { user } = useAuth();
  const { notifications, unreadCount, loading, markRead, markAllRead } = useNotifications(user?.id);

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
    <>
      <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl border-b border-border/40 transition-all duration-300">
        <div className="flex h-14 items-center px-4 max-w-md mx-auto">
          <div className="mr-8 flex items-center space-x-2 flex-1">
            {logoUrl ? (
              <img src={logoUrl} alt={brandName} className="w-8 h-8 rounded-lg object-cover" />
            ) : (
              <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="text-primary-foreground font-bold text-lg select-none">
                  {brandName.charAt(0)}
                </span>
              </div>
            )}
            <span className="font-bold sm:inline-block tracking-tight text-lg truncate uppercase">
              {brandName}
            </span>
          </div>
          
          <div className="flex flex-1 items-center justify-end space-x-2">
            <button
              aria-label="Open notifications"
              onClick={() => setSheetOpen(true)}
              className="relative w-10 h-10 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors"
            >
              <Bell className="w-5 h-5 text-foreground" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[14px] h-[14px] bg-red-500 rounded-full border-2 border-background flex items-center justify-center">
                  {unreadCount <= 9 && (
                    <span className="text-[8px] font-bold text-white leading-none px-0.5">
                      {unreadCount}
                    </span>
                  )}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <NotificationsSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        notifications={notifications}
        unreadCount={unreadCount}
        loading={loading}
        onMarkRead={markRead}
        onMarkAllRead={markAllRead}
      />
    </>
  );
}
