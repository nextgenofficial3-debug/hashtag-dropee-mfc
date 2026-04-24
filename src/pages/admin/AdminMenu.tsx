import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Loader2, Plus, Pencil, Trash2, X, Save, ImageOff, ChevronDown, Flame, Star, Package,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MultiImageUpload } from "@/components/MultiImageUpload";

// Uses mfc_products table which has: id, name, description, price, category_id,
// images (string[]), in_stock, is_bestseller, is_spicy, created_at, updated_at

const emptyForm = {
  name: "",
  description: "",
  price: "",
  is_bestseller: false,
  is_spicy: false,
  in_stock: true,
  images: [] as string[],
};
type FormState = typeof emptyForm;

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  images: string[] | null;
  in_stock: boolean | null;
  is_bestseller: boolean | null;
  is_spicy: boolean | null;
  created_at: string;
}

export default function AdminMenu() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("mfc_products")
        .select("id, name, description, price, images, in_stock, is_bestseller, is_spicy, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setItems((data as Product[]) || []);
      setDbError(null);
    } catch (err: any) {
      setDbError(err.message);
      toast.error("Failed to load products: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const openAdd = () => { setEditingId(null); setForm(emptyForm); setShowDialog(true); };
  const openEdit = (item: Product) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      description: item.description ?? "",
      price: String(item.price),
      is_bestseller: item.is_bestseller ?? false,
      is_spicy: item.is_spicy ?? false,
      in_stock: item.in_stock ?? true,
      images: item.images ?? [],
    });
    setShowDialog(true);
  };
  const closeDialog = () => { setShowDialog(false); setEditingId(null); setForm(emptyForm); };

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error("Product name required");
    if (!form.price || isNaN(Number(form.price))) return toast.error("Enter a valid price");
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        price: Number(form.price),
        images: form.images.filter(Boolean),
        in_stock: form.in_stock,
        is_bestseller: form.is_bestseller,
        is_spicy: form.is_spicy,
        updated_at: new Date().toISOString(),
      };
      if (editingId) {
        const { error } = await supabase.from("mfc_products").update(payload).eq("id", editingId);
        if (error) throw error;
        toast.success("Product updated!");
      } else {
        const { error } = await supabase.from("mfc_products").insert(payload);
        if (error) throw error;
        toast.success("Product added!");
      }
      closeDialog();
      fetchItems();
    } catch (err: any) {
      toast.error(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product? Cannot be undone.")) return;
    setDeletingId(id);
    try {
      const { error } = await supabase.from("mfc_products").delete().eq("id", id);
      if (error) throw error;
      toast.success("Product deleted");
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err: any) {
      toast.error("Delete failed: " + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const toggleStock = async (id: string, current: boolean | null) => {
    const newVal = !current;
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, in_stock: newVal } : i));
    const { error } = await supabase.from("mfc_products").update({ in_stock: newVal }).eq("id", id);
    if (error) {
      setItems((prev) => prev.map((i) => i.id === id ? { ...i, in_stock: current } : i));
      toast.error("Failed to update");
    }
  };

  const filtered = items.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex h-96 items-center justify-center">
      <Loader2 className="animate-spin w-8 h-8 text-zinc-500" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-50">Menu Management</h1>
          <p className="text-zinc-400 mt-1">Add, edit, delete products. Manage stock & badges.</p>
        </div>
        <Button onClick={openAdd} className="bg-[#FF5A00] hover:bg-[#e04f00] text-white font-bold gap-2 rounded-xl h-11 px-5 shrink-0">
          <Plus className="w-4 h-4" /> Add Product
        </Button>
      </div>

      {dbError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
          <p className="font-bold mb-1">⚠ Could not load products</p>
          <p className="text-xs opacity-80">{dbError}</p>
          <p className="text-xs mt-2 opacity-70">Make sure the <code className="bg-red-500/20 px-1 rounded">mfc_products</code> table exists with RLS allowing authenticated reads.</p>
        </div>
      )}

      <Input
        placeholder="Search products…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="bg-zinc-900 border-zinc-800 max-w-sm"
      />

      {/* Desktop Table */}
      <div className="hidden md:block bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-zinc-950/50 text-zinc-400 text-xs uppercase border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4">Image</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Tags</th>
                <th className="px-6 py-4 text-center">In Stock</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16 text-zinc-500 text-sm">
                  {items.length === 0 ? "No products yet. Click «Add Product» to get started." : "No results."}
                </td></tr>
              ) : filtered.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-800/40 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex gap-1">
                      {(item.images?.length ?? 0) > 0 ? (
                        item.images!.slice(0, 3).map((url, i) => (
                          <div key={i} className={`w-10 h-10 rounded-lg overflow-hidden border ${i === 0 ? "border-[#FF5A00]" : "border-zinc-700"}`}>
                            <img src={url} alt="" className="w-full h-full object-cover" />
                          </div>
                        ))
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                          <ImageOff className="w-4 h-4 text-zinc-600" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 max-w-[200px]">
                    <p className="font-bold text-zinc-200 truncate">{item.name}</p>
                    <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{item.description}</p>
                  </td>
                  <td className="px-6 py-4 font-bold text-green-400">₹{item.price}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1">
                      {item.is_bestseller && <span className="text-[10px] font-bold bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded-md flex items-center gap-0.5"><Star className="w-2.5 h-2.5" />Best</span>}
                      {item.is_spicy && <span className="text-[10px] font-bold bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-md flex items-center gap-0.5"><Flame className="w-2.5 h-2.5" />Spicy</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Switch checked={item.in_stock ?? false} onCheckedChange={() => toggleStock(item.id, item.in_stock)} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(item)} className="w-8 h-8 text-zinc-400 hover:text-white hover:bg-zinc-700">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(item.id)} disabled={deletingId === item.id} className="w-8 h-8 text-zinc-500 hover:text-red-400 hover:bg-red-500/10">
                        {deletingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 bg-zinc-900 border border-zinc-800 rounded-2xl">
            {items.length === 0 ? "No products yet." : "No results."}
          </div>
        ) : filtered.map((item) => (
          <div key={item.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex gap-3">
            <div className="w-16 h-16 rounded-xl overflow-hidden border border-zinc-700 shrink-0">
              {item.images?.[0] ? (
                <img src={item.images[0]} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                  <Package className="w-5 h-5 text-zinc-600" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-zinc-200 text-sm truncate">{item.name}</p>
                  <p className="text-green-400 font-bold text-sm">₹{item.price}</p>
                </div>
                <Switch checked={item.in_stock ?? false} onCheckedChange={() => toggleStock(item.id, item.in_stock)} />
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex gap-1">
                  {item.is_bestseller && <span className="text-[10px] font-bold bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded-md">Best</span>}
                  {item.is_spicy && <span className="text-[10px] font-bold bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-md">Spicy</span>}
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(item)} className="w-8 h-8 text-zinc-400 hover:text-white">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(item.id)} className="w-8 h-8 text-zinc-500 hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Dialog */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeDialog} />
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-zinc-50">{editingId ? "Edit Product" : "Add New Product"}</h2>
              <button onClick={closeDialog} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <Label className="text-zinc-300 font-semibold">Product Images (up to 4)</Label>
                <MultiImageUpload images={form.images} onChange={(imgs) => setForm({ ...form, images: imgs })} maxImages={4} />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Product Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Crispy Chicken Burger" className="bg-zinc-950 border-zinc-700" />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short description…" rows={3} className="bg-zinc-950 border-zinc-700 resize-none" />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Price (₹) *</Label>
                <Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0.00" className="bg-zinc-950 border-zinc-700" />
              </div>
              {/* Toggles */}
              <div className="grid gap-3">
                {[
                  { key: "in_stock", label: "In Stock", desc: "Show as available on menu" },
                  { key: "is_bestseller", label: "🌟 Bestseller", desc: "Show bestseller badge" },
                  { key: "is_spicy", label: "🌶 Spicy", desc: "Show spicy badge" },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                    <div>
                      <p className="font-medium text-zinc-200 text-sm">{label}</p>
                      <p className="text-xs text-zinc-500">{desc}</p>
                    </div>
                    <Switch
                      checked={form[key as keyof FormState] as boolean}
                      onCheckedChange={(v) => setForm({ ...form, [key]: v })}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="sticky bottom-0 bg-zinc-900 border-t border-zinc-800 px-6 py-4 flex gap-3 justify-end">
              <Button variant="ghost" onClick={closeDialog} className="text-zinc-400 hover:text-white">Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-[#FF5A00] hover:bg-[#e04f00] text-white font-bold gap-2 px-6">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editingId ? "Save Changes" : "Add Product"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
