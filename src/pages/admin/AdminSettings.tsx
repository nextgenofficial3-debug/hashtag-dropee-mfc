import React, { useEffect, useState } from "react";
import { Image as ImageIcon, IndianRupee, Loader2, Phone, Save, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/ImageUpload";
import type { StoreSettings } from "@/types/app";

type EditableSettings = StoreSettings & {
  brand_name: string | null;
  brand_logo_url: string | null;
};

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<EditableSettings | null>(null);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const { data, error } = await supabase.from("mfc_store_settings").select("*").single();
        if (error) throw error;
        setSettings(data as EditableSettings);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load settings";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from("mfc_store_settings")
        .update({
          brand_name: settings.brand_name,
          brand_logo_url: settings.brand_logo_url,
          is_open: settings.is_open,
          use_scheduled_hours: settings.use_scheduled_hours,
          whatsapp_primary: settings.whatsapp_primary,
          whatsapp_secondary: settings.whatsapp_secondary,
          packaging_fee: settings.packaging_fee,
          base_delivery_fee: settings.base_delivery_fee,
          per_km_delivery_fee: settings.per_km_delivery_fee,
          opening_time: settings.opening_time,
          closing_time: settings.closing_time,
        })
        .eq("id", settings.id);

      if (error) throw error;
      toast.success("Settings saved successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save settings";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin w-8 text-zinc-500" /></div>;
  }

  return (
    <div className="space-y-6 max-w-4xl pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Store Settings</h1>
        <p className="text-zinc-400">Manage branding, operations, and delivery configuration.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-200 flex items-center gap-2">
            <Store size={20} className="text-[#FF5A00]" /> Operations
          </h2>
          <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-xl border border-zinc-800">
            <div>
              <h3 className="font-medium text-zinc-200">Manual Open/Close</h3>
              <p className="text-xs text-zinc-500">Forcefully open or close the store now.</p>
            </div>
            <Switch checked={Boolean(settings.is_open)} onCheckedChange={(value) => setSettings({ ...settings, is_open: value })} />
          </div>
          <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-xl border border-zinc-800">
            <div>
              <h3 className="font-medium text-zinc-200">Scheduled Hours</h3>
              <p className="text-xs text-zinc-500">Automatically open or close based on configured time.</p>
            </div>
            <Switch checked={Boolean(settings.use_scheduled_hours)} onCheckedChange={(value) => setSettings({ ...settings, use_scheduled_hours: value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label className="text-zinc-400">Opening Time</Label>
              <Input type="time" value={settings.opening_time || ""} onChange={(event) => setSettings({ ...settings, opening_time: event.target.value })} className="bg-zinc-950 border-zinc-800" />
            </div>
            <div className="grid gap-2">
              <Label className="text-zinc-400">Closing Time</Label>
              <Input type="time" value={settings.closing_time || ""} onChange={(event) => setSettings({ ...settings, closing_time: event.target.value })} className="bg-zinc-950 border-zinc-800" />
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-200 flex items-center gap-2">
            <ImageIcon size={20} className="text-[#FF5A00]" /> Branding
          </h2>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="brandName" className="text-zinc-400">Brand Name</Label>
              <Input id="brandName" value={settings.brand_name || ""} onChange={(event) => setSettings({ ...settings, brand_name: event.target.value })} className="bg-zinc-950 border-zinc-800" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="logoUrl" className="text-zinc-400">Logo Image</Label>
              <ImageUpload value={settings.brand_logo_url || ""} onChange={(url) => setSettings({ ...settings, brand_logo_url: url })} />
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-200 flex items-center gap-2">
            <IndianRupee size={20} className="text-[#FF5A00]" /> Delivery Pricing
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label className="text-zinc-400">Base Fee</Label>
              <Input type="number" value={settings.base_delivery_fee} onChange={(event) => setSettings({ ...settings, base_delivery_fee: Number(event.target.value) })} className="bg-zinc-950 border-zinc-800" />
            </div>
            <div className="grid gap-2">
              <Label className="text-zinc-400">Per KM Fee</Label>
              <Input type="number" value={settings.per_km_delivery_fee} onChange={(event) => setSettings({ ...settings, per_km_delivery_fee: Number(event.target.value) })} className="bg-zinc-950 border-zinc-800" />
            </div>
            <div className="grid gap-2 col-span-2">
              <Label className="text-zinc-400">Packaging Fee</Label>
              <Input type="number" value={settings.packaging_fee} onChange={(event) => setSettings({ ...settings, packaging_fee: Number(event.target.value) })} className="bg-zinc-950 border-zinc-800" />
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-200 flex items-center gap-2">
            <Phone size={20} className="text-[#FF5A00]" /> Support Contacts
          </h2>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label className="text-zinc-400">WhatsApp Primary</Label>
              <Input value={settings.whatsapp_primary || ""} onChange={(event) => setSettings({ ...settings, whatsapp_primary: event.target.value })} className="bg-zinc-950 border-zinc-800" />
            </div>
            <div className="grid gap-2">
              <Label className="text-zinc-400">WhatsApp Secondary</Label>
              <Input value={settings.whatsapp_secondary || ""} onChange={(event) => setSettings({ ...settings, whatsapp_secondary: event.target.value })} className="bg-zinc-950 border-zinc-800" />
            </div>
          </div>
        </div>
      </div>

      <div className="sticky bottom-6 flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="bg-[#FF5A00] hover:bg-[#e04f00] text-white px-10 h-14 rounded-2xl shadow-xl shadow-orange-950/20 text-lg font-bold">
          {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
          Save All Changes
        </Button>
      </div>
    </div>
  );
}
