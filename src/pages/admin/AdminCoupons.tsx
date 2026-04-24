import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, X, Save, Tag, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

// Uses mfc_coupons: id, code, discount_type, discount_value,
// min_order_amount, max_uses, used_count, is_active, created_at

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_order_amount: number | null;
  max_uses: number | null;
  used_count: number | null;
  is_active: boolean | null;
  created_at: string;
}

const emptyForm = {
  code: "", discount_type: "percentage",
  discount_value: "", min_order_amount: "",
  max_uses: "", is_active: true,
};

function randomCode() {
  return "MFC" + Math.random().toString(36).slice(2, 7).toUpperCase();
}

export default function AdminCoupons() {
  const [items, setItems] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("mfc_coupons").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setItems((data as Coupon[]) || []);
      setDbError(null);
    } catch (err: any) { setDbError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const openAdd = () => { setEditingId(null); setForm({ ...emptyForm, code: randomCode() }); setShowDialog(true); };
  const openEdit = (c: Coupon) => {
    setEditingId(c.id);
    setForm({
      code: c.code, discount_type: c.discount_type,
      discount_value: String(c.discount_value),
      min_order_amount: c.min_order_amount != null ? String(c.min_order_amount) : "",
      max_uses: c.max_uses != null ? String(c.max_uses) : "",
      is_active: c.is_active ?? true,
    });
    setShowDialog(true);
  };
  const close = () => { setShowDialog(false); setEditingId(null); setForm(emptyForm); };

  const handleSave = async () => {
    if (!form.code.trim()) return toast.error("Code required");
    if (!form.discount_value) return toast.error("Discount value required");
    setSaving(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value),
        min_order_amount: form.min_order_amount ? Number(form.min_order_amount) : null,
        max_uses: form.max_uses ? Number(form.max_uses) : null,
        is_active: form.is_active,
      };
      if (editingId) {
        const { error } = await supabase.from("mfc_coupons").update(payload).eq("id", editingId);
        if (error) throw error;
        toast.success("Coupon updated!");
      } else {
        const { error } = await supabase.from("mfc_coupons").insert(payload);
        if (error) throw error;
        toast.success("Coupon created!");
      }
      close(); fetchData();
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this coupon?")) return;
    const { error } = await supabase.from("mfc_coupons").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted"); setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const toggleActive = async (c: Coupon) => {
    setItems((prev) => prev.map((i) => i.id === c.id ? { ...i, is_active: !c.is_active } : i));
    const { error } = await supabase.from("mfc_coupons").update({ is_active: !c.is_active }).eq("id", c.id);
    if (error) { setItems((prev) => prev.map((i) => i.id === c.id ? { ...i, is_active: c.is_active } : i)); toast.error("Failed"); }
  };

  const usagePercent = (c: Coupon) => {
    if (!c.max_uses || !c.used_count) return 0;
    return Math.min(100, Math.round((c.used_count / c.max_uses) * 100));
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-zinc-500" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-50 flex items-center gap-3"><Tag className="w-7 h-7 text-[#FF5A00]" /> Coupons</h1>
          <p className="text-zinc-400 mt-1">Manage discount codes for customer orders.</p>
        </div>
        <Button onClick={openAdd} className="bg-[#FF5A00] hover:bg-[#e04f00] text-white font-bold gap-2 rounded-xl h-11 px-5 shrink-0">
          <Plus className="w-4 h-4" /> New Coupon
        </Button>
      </div>

      {dbError && <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">⚠ {dbError}</div>}

      {/* Table */}
      <div className="hidden md:block bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm text-zinc-300">
          <thead className="bg-zinc-950/50 text-zinc-400 text-xs uppercase border-b border-zinc-800">
            <tr>
              <th className="px-6 py-4">Code</th>
              <th className="px-6 py-4">Discount</th>
              <th className="px-6 py-4">Min Order</th>
              <th className="px-6 py-4">Usage</th>
              <th className="px-6 py-4 text-center">Active</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {items.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-16 text-zinc-500">No coupons yet.</td></tr>
            ) : items.map((c) => (
              <tr key={c.id} className="hover:bg-zinc-800/40 transition-colors">
                <td className="px-6 py-4">
                  <span className="font-mono font-bold text-zinc-100 bg-zinc-800 px-2 py-1 rounded-lg text-sm">{c.code}</span>
                </td>
                <td className="px-6 py-4 font-bold">
                  {c.discount_type === "percentage" ? `${c.discount_value}%` : `₹${c.discount_value}`}
                  <span className="ml-2 text-xs text-zinc-500 font-normal">{c.discount_type}</span>
                </td>
                <td className="px-6 py-4 text-zinc-400">{c.min_order_amount != null ? `₹${c.min_order_amount}` : "—"}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-300">{c.used_count ?? 0}{c.max_uses != null ? `/${c.max_uses}` : ""}</span>
                    {c.max_uses && (
                      <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full", usagePercent(c) >= 90 ? "bg-red-500" : "bg-[#FF5A00]")}
                          style={{ width: `${usagePercent(c)}%` }} />
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <Switch checked={c.is_active ?? false} onCheckedChange={() => toggleActive(c)} />
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(c)} className="w-8 h-8 text-zinc-400 hover:text-white"><Pencil className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(c.id)} className="w-8 h-8 text-zinc-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {items.length === 0
          ? <div className="text-center py-12 text-zinc-500 bg-zinc-900 border border-zinc-800 rounded-2xl">No coupons yet.</div>
          : items.map((c) => (
            <div key={c.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="font-mono font-bold text-zinc-100 bg-zinc-800 px-3 py-1.5 rounded-lg">{c.code}</span>
                <Switch checked={c.is_active ?? false} onCheckedChange={() => toggleActive(c)} />
              </div>
              <div className="flex gap-3 text-sm text-zinc-400 mb-3">
                <span className="font-bold text-zinc-200">{c.discount_type === "percentage" ? `${c.discount_value}%` : `₹${c.discount_value}`} off</span>
                {c.min_order_amount != null && <span>min ₹{c.min_order_amount}</span>}
                <span>{c.used_count ?? 0}{c.max_uses != null ? `/${c.max_uses}` : ""} used</span>
              </div>
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="ghost" onClick={() => openEdit(c)} className="text-zinc-400 hover:text-white"><Pencil className="w-4 h-4 mr-1" /> Edit</Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(c.id)} className="text-zinc-500 hover:text-red-400"><Trash2 className="w-4 h-4 mr-1" /> Delete</Button>
              </div>
            </div>
          ))}
      </div>

      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={close} />
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-zinc-50">{editingId ? "Edit Coupon" : "New Coupon"}</h2>
              <button onClick={close} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-zinc-400 text-xs">Coupon Code *</Label>
                <div className="flex gap-2">
                  <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="bg-zinc-950 border-zinc-700 font-mono flex-1" />
                  <Button type="button" variant="ghost" onClick={() => setForm({ ...form, code: randomCode() })} className="px-3 text-zinc-400 hover:text-white border border-zinc-700">
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-zinc-400 text-xs">Discount Type</Label>
                <div className="flex gap-2">
                  {["percentage", "fixed"].map((t) => (
                    <button key={t} type="button" onClick={() => setForm({ ...form, discount_type: t })}
                      className={cn("flex-1 py-2 rounded-xl border text-sm font-bold capitalize transition-colors",
                        form.discount_type === t ? "bg-[#FF5A00] border-[#FF5A00] text-white" : "bg-zinc-950 border-zinc-700 text-zinc-400 hover:text-zinc-200")}>
                      {t === "percentage" ? "% Off" : "₹ Fixed"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-zinc-400 text-xs">Value {form.discount_type === "percentage" ? "(%)" : "(₹)"} *</Label>
                  <Input type="number" min="0" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} className="bg-zinc-950 border-zinc-700" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-zinc-400 text-xs">Min Order (₹)</Label>
                  <Input type="number" min="0" value={form.min_order_amount} onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })} placeholder="No minimum" className="bg-zinc-950 border-zinc-700" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-zinc-400 text-xs">Max Uses (leave blank for unlimited)</Label>
                <Input type="number" min="0" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })} placeholder="Unlimited" className="bg-zinc-950 border-zinc-700" />
              </div>
              <div className="flex items-center justify-between p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                <div><p className="font-medium text-zinc-200 text-sm">Active</p><p className="text-xs text-zinc-500">Allow customers to use this code</p></div>
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              </div>
            </div>
            <div className="sticky bottom-0 bg-zinc-900 border-t border-zinc-800 px-6 py-4 flex gap-3 justify-end">
              <Button variant="ghost" onClick={close} className="text-zinc-400">Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-[#FF5A00] hover:bg-[#e04f00] text-white gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editingId ? "Save" : "Create"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
