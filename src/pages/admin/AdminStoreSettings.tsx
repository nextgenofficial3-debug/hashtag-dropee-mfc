import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Loader2, Store, Save, Clock, Phone, CreditCard, Truck,
  Package, ToggleLeft, ToggleRight, Calendar, Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface StoreSettings {
  id: string;
  brand_name: string | null;
  brand_logo_url: string | null;
  is_open: boolean | null;
  use_scheduled_hours: boolean | null;
  opening_time: string | null;
  closing_time: string | null;
  open_days: number[] | null;
  base_delivery_fee: number;
  per_km_delivery_fee: number;
  packaging_fee: number;
  whatsapp_primary: string | null;
  whatsapp_secondary: string | null;
  upi_id: string | null;
  average_rating: string | null;
  customers_served: string | null;
  years_running: string | null;
}

export default function AdminStoreSettings() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<StoreSettings>>({});

  const fetchSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("mfc_store_settings")
      .select("*")
      .limit(1)
      .maybeSingle();
    if (error) { toast.error("Failed to load settings"); setLoading(false); return; }
    if (data) {
      setSettings(data as StoreSettings);
      setForm(data as StoreSettings);
    }
    setLoading(false);
  };

  useEffect(() => { fetchSettings(); }, []);

  const set = (key: keyof StoreSettings, value: any) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleDay = (day: number) => {
    const curr = (form.open_days ?? []) as number[];
    const next = curr.includes(day) ? curr.filter((d) => d !== day) : [...curr, day].sort();
    set("open_days", next);
  };

  const handleSave = async () => {
    if (!settings?.id) return toast.error("No settings record found");
    setSaving(true);
    try {
      const { error } = await supabase
        .from("mfc_store_settings")
        .update({
          brand_name: form.brand_name,
          brand_logo_url: form.brand_logo_url,
          is_open: form.is_open,
          use_scheduled_hours: form.use_scheduled_hours,
          opening_time: form.opening_time,
          closing_time: form.closing_time,
          open_days: form.open_days,
          base_delivery_fee: Number(form.base_delivery_fee) || 0,
          per_km_delivery_fee: Number(form.per_km_delivery_fee) || 0,
          packaging_fee: Number(form.packaging_fee) || 0,
          whatsapp_primary: form.whatsapp_primary,
          whatsapp_secondary: form.whatsapp_secondary,
          upi_id: form.upi_id,
          average_rating: form.average_rating,
          customers_served: form.customers_served,
          years_running: form.years_running,
          updated_at: new Date().toISOString(),
        })
        .eq("id", settings.id);
      if (error) throw error;
      toast.success("Store settings saved!");
      fetchSettings();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-zinc-500" /></div>;

  if (!settings) return (
    <div className="py-20 text-center text-zinc-500 bg-zinc-900 border border-zinc-800 rounded-2xl">
      No store settings record found. Please insert one via Supabase.
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-50 flex items-center gap-3">
            <Store className="w-7 h-7 text-[#FF5A00]" /> Store Settings
          </h1>
          <p className="text-zinc-400 mt-1">Control store hours, fees, and branding.</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-[#FF5A00] hover:bg-[#e04f00] text-white gap-2 rounded-xl h-11 px-5 shrink-0">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save
        </Button>
      </div>

      {/* Store Status */}
      <Section title="Store Status" icon={<ToggleRight className="w-4 h-4" />}>
        <SettingRow label="Store Open" sub="Manually open or close the store">
          <Switch checked={form.is_open ?? false} onCheckedChange={(v) => set("is_open", v)} />
        </SettingRow>
        <SettingRow label="Use Scheduled Hours" sub="Auto open/close based on time">
          <Switch checked={form.use_scheduled_hours ?? false} onCheckedChange={(v) => set("use_scheduled_hours", v)} />
        </SettingRow>
      </Section>

      {/* Hours */}
      <Section title="Opening Hours" icon={<Clock className="w-4 h-4" />}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Opening Time">
            <Input type="time" value={form.opening_time ?? ""} onChange={(e) => set("opening_time", e.target.value)} className="bg-zinc-950 border-zinc-700 text-zinc-100" />
          </Field>
          <Field label="Closing Time">
            <Input type="time" value={form.closing_time ?? ""} onChange={(e) => set("closing_time", e.target.value)} className="bg-zinc-950 border-zinc-700 text-zinc-100" />
          </Field>
        </div>
        <div>
          <Label className="text-zinc-400 text-xs mb-2 block">Open Days</Label>
          <div className="flex gap-2 flex-wrap">
            {DAYS.map((day, idx) => {
              const active = (form.open_days ?? []).includes(idx);
              return (
                <button key={day} onClick={() => toggleDay(idx)}
                  className={cn("px-3 py-1.5 rounded-lg text-xs font-bold transition-colors",
                    active ? "bg-[#FF5A00] text-white" : "bg-zinc-800 text-zinc-500 hover:text-zinc-300")}>
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      </Section>

      {/* Fees */}
      <Section title="Delivery & Fees" icon={<Truck className="w-4 h-4" />}>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Base Delivery (₹)">
            <Input type="number" min="0" value={form.base_delivery_fee ?? 0} onChange={(e) => set("base_delivery_fee", e.target.value)} className="bg-zinc-950 border-zinc-700" />
          </Field>
          <Field label="Per KM (₹)">
            <Input type="number" min="0" step="0.5" value={form.per_km_delivery_fee ?? 0} onChange={(e) => set("per_km_delivery_fee", e.target.value)} className="bg-zinc-950 border-zinc-700" />
          </Field>
          <Field label="Packaging (₹)">
            <Input type="number" min="0" value={form.packaging_fee ?? 0} onChange={(e) => set("packaging_fee", e.target.value)} className="bg-zinc-950 border-zinc-700" />
          </Field>
        </div>
      </Section>

      {/* Contact */}
      <Section title="Contact & Payment" icon={<Phone className="w-4 h-4" />}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="WhatsApp Primary">
            <Input value={form.whatsapp_primary ?? ""} onChange={(e) => set("whatsapp_primary", e.target.value)} placeholder="+91…" className="bg-zinc-950 border-zinc-700" />
          </Field>
          <Field label="WhatsApp Secondary">
            <Input value={form.whatsapp_secondary ?? ""} onChange={(e) => set("whatsapp_secondary", e.target.value)} placeholder="+91…" className="bg-zinc-950 border-zinc-700" />
          </Field>
        </div>
        <Field label="UPI ID">
          <Input value={form.upi_id ?? ""} onChange={(e) => set("upi_id", e.target.value)} placeholder="yourname@upi" className="bg-zinc-950 border-zinc-700" />
        </Field>
      </Section>

      {/* Branding */}
      <Section title="Branding & Stats" icon={<Globe className="w-4 h-4" />}>
        <Field label="Brand Name">
          <Input value={form.brand_name ?? ""} onChange={(e) => set("brand_name", e.target.value)} className="bg-zinc-950 border-zinc-700" />
        </Field>
        <Field label="Logo URL">
          <Input value={form.brand_logo_url ?? ""} onChange={(e) => set("brand_logo_url", e.target.value)} placeholder="https://…" className="bg-zinc-950 border-zinc-700" />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Avg Rating">
            <Input value={form.average_rating ?? ""} onChange={(e) => set("average_rating", e.target.value)} placeholder="4.8" className="bg-zinc-950 border-zinc-700" />
          </Field>
          <Field label="Customers Served">
            <Input value={form.customers_served ?? ""} onChange={(e) => set("customers_served", e.target.value)} placeholder="1000+" className="bg-zinc-950 border-zinc-700" />
          </Field>
          <Field label="Years Running">
            <Input value={form.years_running ?? ""} onChange={(e) => set("years_running", e.target.value)} placeholder="5+" className="bg-zinc-950 border-zinc-700" />
          </Field>
        </div>
      </Section>

      <Button onClick={handleSave} disabled={saving} className="bg-[#FF5A00] hover:bg-[#e04f00] text-white gap-2 rounded-xl h-12 w-full font-bold">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save All Settings
      </Button>
    </div>
  );
}

// Sub-components
function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-zinc-800 bg-zinc-900/80">
        <span className="text-[#FF5A00]">{icon}</span>
        <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">{title}</h2>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-zinc-400 text-xs">{label}</Label>
      {children}
    </div>
  );
}

function SettingRow({ label, sub, children }: { label: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between p-3 bg-zinc-950 rounded-xl border border-zinc-800">
      <div><p className="font-medium text-zinc-200 text-sm">{label}</p><p className="text-xs text-zinc-500">{sub}</p></div>
      {children}
    </div>
  );
}
