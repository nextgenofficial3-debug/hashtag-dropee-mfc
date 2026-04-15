import React, { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function TopBar() {
  const [storeName, setStoreName] = useState("FoodApp");
  
  useEffect(() => {
    // Fetch store name from settings
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('mfc_store_settings')
        .select('store_name')
        .single();
      
      if (data && !error && data.store_name) {
        setStoreName(data.store_name);
      }
    };
    fetchSettings();
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl border-b border-border/40 transition-all duration-300">
      <div className="flex h-14 items-center px-4 max-w-md mx-auto">
        <div className="mr-8 flex items-center space-x-2 flex-1">
          <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="text-primary-foreground font-bold text-lg select-none">F</span>
          </div>
          <span className="font-bold sm:inline-block tracking-tight text-lg truncate">
            {storeName}
          </span>
        </div>
        
        <div className="flex flex-1 items-center justify-end space-x-2">
          <button className="relative w-10 h-10 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors">
            <Bell className="w-5 h-5 text-foreground" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-background"></span>
          </button>
        </div>
      </div>
    </header>
  );
}
