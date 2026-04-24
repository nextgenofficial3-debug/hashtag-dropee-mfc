import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, X, Save, Megaphone, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface Promotion {
  id: string;
  title: string;
  description: string | null;
  banner_image: string | null;
  discount_percentage: number | null;
  applies_to_all: boolean | null;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean | null;
  created_at: string;
}

const emptyForm = {
  title: "", description: "", banner_image: "",
  discount_percentage: "", applies_to_all: true,
  valid_from: "", valid_until: "", is_active: true,
};

export default function AdminPromotions() {
  const [items, setItems] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("mfc_promotions").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setItems((data as Promotion[]) || []);
      setDbError(null);
    } catch (err: any) { setDbError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const openAdd = () => { setEditingId(null); setForm(emptyForm); setShowDialog(true); };
  const openEdit = (p: Promotion) => {
    setEditingId(p.id);
    setForm({
      title: p.title, description: p.description ?? "", banner_image: p.banner_image ?? "",
      discount_percentage: p.discount_percentage != null ? String(p.discount_percentage) : "",
      applies_to_all: p.applies_to_all ?? true,
      valid_from: p.valid_from ? p.valid_from.slice(0, 16) : "",
      valid_until: p.valid_until ? p.valid_until.slice(0, 16) : "",
      is_active: p.is_active ?? true,
    });
    setShowDialog(true);
  };
  const close = () => { setShowDialog(false); setEditingId(null); setForm(emptyForm); };

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error("Title required");
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(), description: form.description.trim() || null,
        banner_image: form.banner_image.trim() || null,
        discount_percentage: form.discount_percentage ? Number(form.discount_percentage) : null,
        applies_to_all: form.applies_to_all,
        valid_from: form.valid_from ? new Date(form.valid_from).toISOString() : null,
        valid_until: form.valid_until ? new Date(form.valid_until).toISOString() : null,
        is_active: form.is_active,
      };
      if (editingId) {
        const { error } = await supabase.from("mfc_promotions").update(payload).eq("id", editingId);
        if (error) throw error;
        toast.success("Updated!");
      } else {
        const { error } = await supabase.from("mfc_promotions").insert(payload);
        if (error) throw error;
        toast.success("Promotion created!");
      }
      close(); fetchData();
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this promotion?")) return;
    const { error } = await supabase.from("mfc_promotions").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted"); setItems((p) => p.filter((i) => i.id !== id));
  };

  const toggleActive = async (p: Promotion) => {
    setItems((prev) => prev.map((i) => i.id === p.id ? { ...i, is_active: !p.is_active } : i));
    const { error } = await supabase.from("mfc_promotions").update({ is_active: !p.is_active }).eq("id", p.id);
    if (error) { setItems((prev) => prev.map((i) => i.id === p.id ? { ...i, is_active: p.is_active } : i)); toast.error("Update failed"); }
  };

  const isExpired = (p: Promotion) => p.valid_until ? new Date(p.valid_until) < new Date() : false;

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-zinc-500" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-50 flex items-center gap-3"><Megaphone className="w-7 h-7 text-[#FF5A00]" /> Promotions & Ads</h1>
          <p className="text-zinc-400 mt-1">Manage banners, deals, and discount campaigns.</p>
        </div>
        <Button onClick={openAdd} className="bg-[#FF5A00] hover:bg-[#e04f00] text-white font-bold gap-2 rounded-xl h-11 px-5 shrink-0">
          <Plus className="w-4 h-4" /> New Promotion
        </Button>
      </div>

      {dbError && <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">⚠ {dbError}</div>}

      {items.length === 0 ? (
        <div className="py-20 text-center text-zinc-500 bg-zinc-900 border border-zinc-800 rounded-2xl">No promotions yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((p) => (
            <div key={p.id} className={cn("bg-zinc-900 border rounded-2xl overflow-hidden flex flex-col",
              isExpired(p) ? "border-zinc-700 opacity-60" : p.is_active ? "border-[#FF5A00]/30" : "border-zinc-800")}>
              {p.banner_image
                ? <img src={p.banner_image} alt={p.title} className="w-full h-40 object-cover" />
                : <div className="w-full h-28 bg-zinc-800 flex items-center justify-center"><ImageIcon className="w-7 h-7 text-zinc-600" /></div>}
              <div className="p-4 flex flex-col gap-3 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-zinc-100">{p.title}</p>
                    {p.description && <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{p.description}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {isExpired(p) && <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-md font-bold">EXPIRED</span>}
                    {!isExpired(p) && p.is_active && <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-md font-bold">LIVE</span>}
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {p.discount_percentage != null && <span className="text-xs font-bold bg-[#FF5A00]/20 text-[#FF5A00] px-2 py-1 rounded-lg">{p.discount_percentage}% OFF</span>}
                  {p.applies_to_all && <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded-lg">All Items</span>}
                </div>
                {(p.valid_from || p.valid_until) && (
                  <p className="text-[10px] text-zinc-600">
                    {p.valid_from && `From ${new Date(p.valid_from).toLocaleDateString()}`}
                    {p.valid_until && ` · Until ${new Date(p.valid_until).toLocaleDateString()}`}
                  </p>
                )}
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-zinc-800">
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Switch checked={p.is_active ?? false} onCheckedChange={() => toggleActive(p)} />
                    <span>{p.is_active ? "Active" : "Inactive"}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(p)} className="w-8 h-8 text-zinc-400 hover:text-white"><Pencil className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(p.id)} className="w-8 h-8 text-zinc-500 hover:text-red-400 hover:bg-red-500/10"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={close} />
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-zinc-50">{editingId ? "Edit Promotion" : "New Promotion"}</h2>
              <button onClick={close} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5"><Label className="text-zinc-400 text-xs">Title *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="bg-zinc-950 border-zinc-700" /></div>
              <div className="space-y-1.5"><Label className="text-zinc-400 text-xs">Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="bg-zinc-950 border-zinc-700 resize-none" /></div>
              <div className="space-y-1.5"><Label className="text-zinc-400 text-xs">Banner Image URL</Label>
                <Input value={form.banner_image} onChange={(e) => setForm({ ...form, banner_image: e.target.value })} placeholder="https://…" className="bg-zinc-950 border-zinc-700" />
                {form.banner_image && <img src={form.banner_image} className="w-full h-28 object-cover rounded-xl mt-2" alt="" onError={(e) => (e.currentTarget.style.display = "none")} />}</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label className="text-zinc-400 text-xs">Discount %</Label>
                  <Input type="number" min="0" max="100" value={form.discount_percentage} onChange={(e) => setForm({ ...form, discount_percentage: e.target.value })} className="bg-zinc-950 border-zinc-700" /></div>
                <div className="flex items-end pb-0.5">
                  <div className="flex items-center justify-between w-full p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                    <Label className="text-zinc-300 text-sm">All Items</Label>
                    <Switch checked={form.applies_to_all} onCheckedChange={(v) => setForm({ ...form, applies_to_all: v })} />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label className="text-zinc-400 text-xs">Valid From</Label>
                  <Input type="datetime-local" value={form.valid_from} onChange={(e) => setForm({ ...form, valid_from: e.target.value })} className="bg-zinc-950 border-zinc-700 text-zinc-100" /></div>
                <div className="space-y-1.5"><Label className="text-zinc-400 text-xs">Valid Until</Label>
                  <Input type="datetime-local" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} className="bg-zinc-950 border-zinc-700 text-zinc-100" /></div>
              </div>
              <div className="flex items-center justify-between p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                <div><p className="font-medium text-zinc-200 text-sm">Active</p><p className="text-xs text-zinc-500">Visible publicly</p></div>
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              </div>
            </div>
            <div className="sticky bottom-0 bg-zinc-900 border-t border-zinc-800 px-6 py-4 flex gap-3 justify-end">
              <Button variant="ghost" onClick={close} className="text-zinc-400">Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-[#FF5A00] hover:bg-[#e04f00] text-white gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editingId ? "Save Changes" : "Create"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
