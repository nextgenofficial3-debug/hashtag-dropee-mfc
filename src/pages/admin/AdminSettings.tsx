import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Save, Store, Phone, MapPin } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<any>({
    is_accepting_orders: false,
    header_image_url: "",
    contact_phone: "",
    address: ""
  });

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("mfc_settings")
        .select("*")
        .single();
        
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is no rows
      
      if (data) {
         setSettings(data);
      } else {
         // Create default row if doesn't exist
         const defaultSettings = { 
            id: 'default', 
            is_accepting_orders: true,
            header_image_url: "https://images.unsplash.com/photo-1514933651103-005eec06c04b",
            contact_phone: "+91 9999999999",
            address: "MFC, Ukhrul, Manipur"
         };
         await supabase.from("mfc_settings").insert(defaultSettings);
         setSettings(defaultSettings);
      }
    } catch (err: any) {
      toast.error("Failed to load settings: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("mfc_settings")
        .update({
          is_accepting_orders: settings.is_accepting_orders,
          header_image_url: settings.header_image_url,
          contact_phone: settings.contact_phone,
          address: settings.address
        })
        .eq("id", settings.id || 'default');
        
      if (error) throw error;
      toast.success("Settings saved successfully");
    } catch (err: any) {
      toast.error("Failed to save settings: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
     return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin w-8 text-zinc-500" /></div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Store Settings</h1>
        <p className="text-zinc-400">Manage your restaurant's global settings.</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6 shadow-sm">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className={`p-2 rounded-lg ${settings.is_accepting_orders ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  <Store size={20} />
               </div>
               <div>
                  <h3 className="font-medium text-zinc-200">Accepting Orders</h3>
                  <p className="text-sm text-zinc-500">Toggle whether customers can place new orders.</p>
               </div>
            </div>
            <Switch 
               checked={settings.is_accepting_orders} 
               onCheckedChange={(val) => setSettings({...settings, is_accepting_orders: val})} 
            />
         </div>

         <div className="space-y-4 pt-4 border-t border-zinc-800">
            <div className="space-y-2">
               <label className="text-sm font-medium text-zinc-300">Header Image URL</label>
               <Input 
                  value={settings.header_image_url || ''} 
                  onChange={(e) => setSettings({...settings, header_image_url: e.target.value})} 
                  placeholder="https://images.unsplash.com/..." 
                  className="bg-zinc-950 border-zinc-800 text-zinc-200 focus-visible:ring-[#FF5A00]" 
               />
               <p className="text-xs text-zinc-500">This image appears as the hero banner on the home page.</p>
               
               {settings.header_image_url && (
                  <div className="mt-2 h-32 w-full rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700">
                     <img src={settings.header_image_url} alt="Header Preview" className="w-full h-full object-cover" />
                  </div>
               )}
            </div>

            <div className="space-y-2">
               <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                  <Phone size={14} className="text-zinc-400" /> WhatsApp Number
               </label>
               <Input 
                  value={settings.contact_phone || ''} 
                  onChange={(e) => setSettings({...settings, contact_phone: e.target.value})} 
                  placeholder="+91 9999999999" 
                  className="bg-zinc-950 border-zinc-800 text-zinc-200 focus-visible:ring-[#FF5A00]" 
               />
            </div>

            <div className="space-y-2">
               <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                  <MapPin size={14} className="text-zinc-400" /> Address
               </label>
               <Input 
                  value={settings.address || ''} 
                  onChange={(e) => setSettings({...settings, address: e.target.value})} 
                  placeholder="Wino Bazaar, Ukhrul" 
                  className="bg-zinc-950 border-zinc-800 text-zinc-200 focus-visible:ring-[#FF5A00]" 
               />
            </div>
         </div>

         <div className="pt-4 flex justify-end">
            <Button 
               onClick={handleSave} 
               disabled={saving}
               className="bg-[#FF5A00] hover:bg-[#e04f00] text-white px-6 w-full sm:w-auto"
            >
               {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
               Save Settings
            </Button>
         </div>
      </div>
    </div>
  );
}
