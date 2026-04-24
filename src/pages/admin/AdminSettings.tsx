import React, { useEffect, useState } from "react";
import { Loader2, Save, FileText, Shield, Map, MessageCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface AppSettings {
  whatsapp_number: string;
  cafe_map_url: string;
}

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [settings, setSettings] = useState<AppSettings>({
    whatsapp_number: "",
    cafe_map_url: "",
  });

  const [termsTitle, setTermsTitle] = useState("");
  const [termsContent, setTermsContent] = useState("");
  
  const [privacyTitle, setPrivacyTitle] = useState("");
  const [privacyContent, setPrivacyContent] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch app settings
        const { data: appData, error: appError } = await supabase
          .from("app_settings")
          .select("whatsapp_number, cafe_map_url")
          .eq("id", "main")
          .maybeSingle();
          
        if (appError && appError.code !== 'PGRST116') {
          console.error("App settings error:", appError);
        } else if (appData) {
          setSettings({
            whatsapp_number: appData.whatsapp_number || "",
            cafe_map_url: appData.cafe_map_url || "",
          });
        }

        // Fetch policies
        const { data: policiesData, error: polError } = await supabase
          .from("policies")
          .select("*")
          .in("type", ["terms", "privacy"]);
          
        if (polError) {
          console.error("Policies error:", polError);
        } else if (policiesData) {
          const terms = policiesData.find(p => p.type === "terms");
          if (terms) {
            setTermsTitle(terms.title || "");
            setTermsContent(terms.content || "");
          }
          const privacy = policiesData.find(p => p.type === "privacy");
          if (privacy) {
            setPrivacyTitle(privacy.title || "");
            setPrivacyContent(privacy.content || "");
          }
        }
      } catch (error) {
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. Save App Settings
      const { error: appError } = await supabase
        .from("app_settings")
        .upsert({ 
          id: "main", 
          whatsapp_number: settings.whatsapp_number,
          cafe_map_url: settings.cafe_map_url
        });
      
      if (appError) throw new Error("Failed to save app settings: " + appError.message);

      // 2. Save Terms
      const { error: termsError } = await supabase
        .from("policies")
        .upsert({
          type: "terms",
          title: termsTitle || "Terms & Conditions",
          content: termsContent
        }, { onConflict: 'type' });
        
      if (termsError) throw new Error("Failed to save terms: " + termsError.message);

      // 3. Save Privacy
      const { error: privacyError } = await supabase
        .from("policies")
        .upsert({
          type: "privacy",
          title: privacyTitle || "Privacy Policy",
          content: privacyContent
        }, { onConflict: 'type' });
        
      if (privacyError) throw new Error("Failed to save privacy policy: " + privacyError.message);

      toast.success("Settings & Policies saved successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save data";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin w-8 text-[#FF5A00]" /></div>;
  }

  return (
    <div className="space-y-6 max-w-4xl pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">App & Legal Settings</h1>
        <p className="text-zinc-400">Manage customer-facing information, WhatsApp contact, and legal policies.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Contact & Location */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-200 flex items-center gap-2">
            <MessageCircle size={20} className="text-[#FF5A00]" /> Contact & Location
          </h2>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label className="text-zinc-400 flex items-center gap-2">
                WhatsApp Number
                <span className="text-xs text-zinc-500 font-normal">(Include country code, e.g. +919876543210)</span>
              </Label>
              <Input 
                value={settings.whatsapp_number} 
                onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })} 
                className="bg-zinc-950 border-zinc-800" 
                placeholder="+91..."
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-zinc-400 flex items-center gap-2">
                Google Maps URL
                <span className="text-xs text-zinc-500 font-normal">(Link to open directions to your cafe)</span>
              </Label>
              <Input 
                value={settings.cafe_map_url} 
                onChange={(e) => setSettings({ ...settings, cafe_map_url: e.target.value })} 
                className="bg-zinc-950 border-zinc-800" 
                placeholder="https://maps.google.com/..."
              />
            </div>
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-200 flex items-center gap-2">
            <FileText size={20} className="text-[#FF5A00]" /> Terms & Conditions
          </h2>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label className="text-zinc-400">Document Title</Label>
              <Input 
                value={termsTitle} 
                onChange={(e) => setTermsTitle(e.target.value)} 
                className="bg-zinc-950 border-zinc-800" 
                placeholder="Terms & Conditions"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-zinc-400">Content (Markdown supported)</Label>
              <Textarea 
                value={termsContent} 
                onChange={(e) => setTermsContent(e.target.value)} 
                className="bg-zinc-950 border-zinc-800 min-h-[200px]" 
                placeholder="Enter your terms and conditions here..."
              />
            </div>
          </div>
        </div>

        {/* Privacy Policy */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-200 flex items-center gap-2">
            <Shield size={20} className="text-[#FF5A00]" /> Privacy Policy
          </h2>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label className="text-zinc-400">Document Title</Label>
              <Input 
                value={privacyTitle} 
                onChange={(e) => setPrivacyTitle(e.target.value)} 
                className="bg-zinc-950 border-zinc-800" 
                placeholder="Privacy Policy"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-zinc-400">Content (Markdown supported)</Label>
              <Textarea 
                value={privacyContent} 
                onChange={(e) => setPrivacyContent(e.target.value)} 
                className="bg-zinc-950 border-zinc-800 min-h-[200px]" 
                placeholder="Enter your privacy policy here..."
              />
            </div>
          </div>
        </div>
      </div>

      <div className="sticky bottom-6 flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="bg-[#FF5A00] hover:bg-[#e04f00] text-white px-10 h-14 rounded-2xl shadow-xl shadow-orange-950/20 text-lg font-bold">
          {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
          Save All Policies
        </Button>
      </div>
    </div>
  );
}

