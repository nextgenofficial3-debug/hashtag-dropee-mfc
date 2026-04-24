import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Loader2, Plus, Pencil, Trash2, X, Save, UtensilsCrossed,
  Star, Flame, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

// Uses mfc_products — the live table in Supabase
// Columns: id, name, price, category_id, description, images (string[]),
//          in_stock, is_bestseller, is_spicy, created_at, updated_at

interface Product {
  id: string;
  name: string;
  price: number;
  category_id: string | null;
  description: string | null;
  images: string[] | null;
  in_stock: boolean | null;
  is_bestseller: boolean | null;
  is_spicy: boolean | null;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
}

const BUCKET = "product-images";

const emptyForm = {
  name: "", price: "", category_id: "", description: "",
  images: [] as string[], in_stock: true, is_bestseller: false, is_spicy: false,
};

export default function AdminMenu() {
  const [items, setItems] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [bucketError, setBucketError] = useState(false);
  const [filterCat, setFilterCat] = useState("all");
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    setLoading(true);
    const [{ data: prodData }, { data: catData }] = await Promise.all([
      supabase.from("mfc_products").select("*").order("name"),
      supabase.from("mfc_categories").select("id, name").order("name"),
    ]);
    setItems((prodData as Product[]) || []);
    setCategories((catData as Category[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openAdd = () => {
    setEditingId(null); setForm(emptyForm); setBucketError(false); setShowDialog(true);
  };
  const openEdit = (item: Product) => {
    setEditingId(item.id);
    setForm({
      name: item.name, price: String(item.price),
      category_id: item.category_id ?? "",
      description: item.description ?? "",
      images: item.images ?? [],
      in_stock: item.in_stock ?? true,
      is_bestseller: item.is_bestseller ?? false,
      is_spicy: item.is_spicy ?? false,
    });
    setBucketError(false);
    setShowDialog(true);
  };
  const close = () => { setShowDialog(false); setEditingId(null); setForm(emptyForm); };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (form.images.length >= 4) return toast.error("Max 4 images per product");
    setImageUploading(true);
    setBucketError(false);
    try {
      await supabase.storage.createBucket(BUCKET, { public: true }).catch(() => {});
      const ext = file.name.split(".").pop();
      const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      setForm((f) => ({ ...f, images: [...f.images, data.publicUrl] }));
      toast.success("Image uploaded");
    } catch {
      setBucketError(true);
      toast.error('Bucket missing — paste image URL manually.', { duration: 5000 });
    } finally {
      setImageUploading(false);
      e.target.value = "";
    }
  };

  const removeImage = (idx: number) =>
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));

  const addImageUrl = (url: string) => {
    if (!url.trim()) return;
    if (form.images.length >= 4) return toast.error("Max 4 images");
    setForm((f) => ({ ...f, images: [...f.images, url.trim()] }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error("Name required");
    if (!form.price || isNaN(Number(form.price))) return toast.error("Valid price required");
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        price: Number(form.price),
        category_id: form.category_id || null,
        description: form.description.trim() || null,
        images: form.images.length > 0 ? form.images : null,
        in_stock: form.in_stock,
        is_bestseller: form.is_bestseller,
        is_spicy: form.is_spicy,
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
      close(); fetchData();
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    setDeletingId(id);
    const { error } = await supabase.from("mfc_products").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); setItems((p) => p.filter((i) => i.id !== id)); }
    setDeletingId(null);
  };

  const toggleStock = async (item: Product) => {
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, in_stock: !item.in_stock } : i));
    const { error } = await supabase.from("mfc_products").update({ in_stock: !item.in_stock }).eq("id", item.id);
    if (error) {
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, in_stock: item.in_stock } : i));
      toast.error("Update failed");
    }
  };

  const filtered = items.filter((i) => {
    const matchCat = filterCat === "all" || i.category_id === filterCat;
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const catName = (id: string | null) => categories.find((c) => c.id === id)?.name ?? "—";
  const mainImage = (item: Product) => item.images?.[0] ?? null;

  // Paste URL input state
  const [pasteUrl, setPasteUrl] = useState("");

  if (loading) return (
    <div className="flex h-96 items-center justify-center">
      <Loader2 className="animate-spin w-8 h-8 text-zinc-500" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-50 flex items-center gap-3">
            <UtensilsCrossed className="w-7 h-7 text-[#FF5A00]" /> Products
          </h1>
          <p className="text-zinc-400 mt-1">{items.length} products in menu.</p>
        </div>
        <Button onClick={openAdd} className="bg-[#FF5A00] hover:bg-[#e04f00] text-white font-bold gap-2 rounded-xl h-11 px-5 shrink-0">
          <Plus className="w-4 h-4" /> Add Product
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products…" className="bg-zinc-900 border-zinc-800 max-w-xs" />
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilterCat("all")}
            className={cn("px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors",
              filterCat === "all" ? "bg-[#FF5A00] text-white" : "bg-zinc-800 text-zinc-400 hover:text-zinc-200")}>
            All
          </button>
          {categories.map((c) => (
            <button key={c.id} onClick={() => setFilterCat(c.id)}
              className={cn("px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors",
                filterCat === c.id ? "bg-[#FF5A00] text-white" : "bg-zinc-800 text-zinc-400 hover:text-zinc-200")}>
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-zinc-500 bg-zinc-900 border border-zinc-800 rounded-2xl">No products found.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((item) => (
            <div key={item.id} className={cn(
              "bg-zinc-900 border rounded-2xl overflow-hidden flex flex-col",
              item.in_stock ? "border-zinc-800" : "border-zinc-800 opacity-60"
            )}>
              <div className="aspect-square bg-zinc-800 relative">
                {mainImage(item)
                  ? <img src={mainImage(item)!} alt={item.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><UtensilsCrossed className="w-8 h-8 text-zinc-600" /></div>}
                <div className="absolute top-2 left-2 flex gap-1">
                  {item.is_bestseller && <span className="bg-yellow-500 text-[10px] font-bold px-1.5 py-0.5 rounded-md text-black flex items-center gap-0.5"><Star className="w-2.5 h-2.5" /> Best</span>}
                  {item.is_spicy && <span className="bg-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded-md text-white flex items-center gap-0.5"><Flame className="w-2.5 h-2.5" /> Spicy</span>}
                </div>
                {!item.in_stock && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-xs font-bold text-white bg-zinc-700 px-2 py-1 rounded-lg">Out of Stock</span>
                  </div>
                )}
              </div>
              <div className="p-3 flex flex-col gap-2 flex-1">
                <div>
                  <p className="font-bold text-zinc-100 text-sm line-clamp-2 leading-tight">{item.name}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{catName(item.category_id)}</p>
                </div>
                <p className="font-bold text-[#FF5A00]">₹{item.price}</p>
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-zinc-800">
                  <Switch checked={item.in_stock ?? false} onCheckedChange={() => toggleStock(item)} />
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(item)} className="w-7 h-7 text-zinc-400 hover:text-white">
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(item.id)} disabled={deletingId === item.id}
                      className="w-7 h-7 text-zinc-500 hover:text-red-400 hover:bg-red-500/10">
                      {deletingId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={close} />
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 px-5 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-50">{editingId ? "Edit Product" : "Add Product"}</h2>
              <button onClick={close} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">

              {/* Images (up to 4) */}
              <div className="space-y-2">
                <Label className="text-zinc-400 text-xs">Images (up to 4)</Label>
                {form.images.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {form.images.map((url, idx) => (
                      <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-zinc-800">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 w-5 h-5 bg-black/70 text-white rounded-full flex items-center justify-center hover:bg-red-500">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {form.images.length < 4 && (
                  <>
                    <label className={cn(
                      "flex items-center justify-center gap-2 h-10 px-3 rounded-xl border cursor-pointer text-sm font-semibold transition-colors w-full",
                      imageUploading ? "border-zinc-700 text-zinc-600" : "border-[#FF5A00]/40 text-[#FF5A00] hover:bg-[#FF5A00]/10"
                    )}>
                      {imageUploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</> : "📁 Upload Image"}
                      <input type="file" accept="image/*" className="sr-only" disabled={imageUploading} onChange={handleImageUpload} />
                    </label>
                    {bucketError && (
                      <div className="flex items-start gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>Bucket missing — create <strong>product-images</strong> in Supabase→Storage (Public), or paste URL below.</span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Input value={pasteUrl} onChange={(e) => setPasteUrl(e.target.value)}
                        placeholder="Paste image URL…" className="bg-zinc-950 border-zinc-700 h-9 text-sm flex-1" />
                      <Button size="sm" variant="outline" onClick={() => { addImageUrl(pasteUrl); setPasteUrl(""); }}
                        className="border-zinc-700 text-zinc-300 shrink-0">Add</Button>
                    </div>
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-zinc-400 text-xs">Name *</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-zinc-950 border-zinc-700" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-zinc-400 text-xs">Price (₹) *</Label>
                  <Input type="number" min="0" step="0.5" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="bg-zinc-950 border-zinc-700" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-zinc-400 text-xs">Category</Label>
                  <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                    className="w-full h-10 bg-zinc-950 border border-zinc-700 rounded-md px-3 text-zinc-200 text-sm">
                    <option value="">— None —</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-zinc-400 text-xs">Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2} className="bg-zinc-950 border-zinc-700 resize-none" />
              </div>

              {/* Toggles */}
              <div className="space-y-2">
                {[
                  { key: "in_stock", label: "In Stock", sub: "Show as available to customers" },
                  { key: "is_bestseller", label: "⭐ Bestseller", sub: "Show bestseller badge" },
                  { key: "is_spicy", label: "🌶 Spicy", sub: "Show spicy badge" },
                ].map(({ key, label, sub }) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                    <div><p className="font-medium text-zinc-200 text-sm">{label}</p><p className="text-xs text-zinc-500">{sub}</p></div>
                    <Switch checked={form[key as keyof typeof form] as boolean}
                      onCheckedChange={(v) => setForm({ ...form, [key]: v })} />
                  </div>
                ))}
              </div>
            </div>
            <div className="sticky bottom-0 bg-zinc-900 border-t border-zinc-800 px-5 py-4 flex gap-3 justify-end">
              <Button variant="ghost" onClick={close} className="text-zinc-400">Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-[#FF5A00] hover:bg-[#e04f00] text-white gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editingId ? "Save" : "Add Product"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
