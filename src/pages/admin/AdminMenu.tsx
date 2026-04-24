import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Loader2, Plus, Pencil, Trash2, X, Save, UtensilsCrossed, Star, Flame,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

// Manages mfc_menu_items — the live table that customer-facing pages query
// Columns: id, name, price, category_id, description, image_url, is_available, created_at, updated_at

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category_id: string | null;
  description: string | null;
  image_url: string | null;
  is_available: boolean | null;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
}

const BUCKET = "menu-images"; // Use this bucket name in Supabase Storage

const emptyForm = {
  name: "", price: "", category_id: "", description: "",
  image_url: "", is_available: true,
};

export default function AdminMenu() {
  const [items, setItems] = useState<MenuItem[]>([]);
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
    const [{ data: menuData }, { data: catData }] = await Promise.all([
      supabase.from("mfc_menu_items").select("*").order("name"),
      supabase.from("mfc_categories").select("id, name").order("name"),
    ]);
    setItems((menuData as MenuItem[]) || []);
    setCategories((catData as Category[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openAdd = () => { setEditingId(null); setForm(emptyForm); setBucketError(false); setShowDialog(true); };
  const openEdit = (item: MenuItem) => {
    setEditingId(item.id);
    setForm({
      name: item.name, price: String(item.price),
      category_id: item.category_id ?? "",
      description: item.description ?? "", image_url: item.image_url ?? "",
      is_available: item.is_available ?? true,
    });
    setBucketError(false);
    setShowDialog(true);
  };
  const close = () => { setShowDialog(false); setEditingId(null); setForm(emptyForm); };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    setBucketError(false);
    try {
      // Try to ensure bucket exists
      await supabase.storage.createBucket(BUCKET, { public: true }).catch(() => {});
      const ext = file.name.split(".").pop();
      const path = `items/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      setForm((f) => ({ ...f, image_url: data.publicUrl }));
      toast.success("Image uploaded");
    } catch {
      setBucketError(true);
      toast.error('Bucket missing — paste image URL manually instead.', { duration: 5000 });
    } finally {
      setImageUploading(false);
      e.target.value = "";
    }
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
        image_url: form.image_url.trim() || null,
        is_available: form.is_available,
      };
      if (editingId) {
        const { error } = await supabase.from("mfc_menu_items").update(payload).eq("id", editingId);
        if (error) throw error;
        toast.success("Item updated!");
      } else {
        const { error } = await supabase.from("mfc_menu_items").insert(payload);
        if (error) throw error;
        toast.success("Item added to menu!");
      }
      close(); fetchData();
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this menu item?")) return;
    setDeletingId(id);
    const { error } = await supabase.from("mfc_menu_items").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); setItems((p) => p.filter((i) => i.id !== id)); }
    setDeletingId(null);
  };

  const toggleAvailable = async (item: MenuItem) => {
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, is_available: !item.is_available } : i));
    const { error } = await supabase.from("mfc_menu_items").update({ is_available: !item.is_available }).eq("id", item.id);
    if (error) { setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, is_available: item.is_available } : i)); toast.error("Update failed"); }
  };

  const filtered = items.filter((i) => {
    const matchCat = filterCat === "all" || i.category_id === filterCat;
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const catName = (id: string | null) => categories.find((c) => c.id === id)?.name ?? "—";

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-zinc-500" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-50 flex items-center gap-3">
            <UtensilsCrossed className="w-7 h-7 text-[#FF5A00]" /> Menu Items
          </h1>
          <p className="text-zinc-400 mt-1">{items.length} items in the live menu.</p>
        </div>
        <Button onClick={openAdd} className="bg-[#FF5A00] hover:bg-[#e04f00] text-white font-bold gap-2 rounded-xl h-11 px-5 shrink-0">
          <Plus className="w-4 h-4" /> Add Item
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search items…" className="bg-zinc-900 border-zinc-800 max-w-xs" />
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
        <div className="py-16 text-center text-zinc-500 bg-zinc-900 border border-zinc-800 rounded-2xl">No items found.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((item) => (
            <div key={item.id} className={cn("bg-zinc-900 border rounded-2xl overflow-hidden flex flex-col",
              item.is_available ? "border-zinc-800" : "border-zinc-800 opacity-60")}>
              {/* Image */}
              <div className="aspect-square bg-zinc-800 relative">
                {item.image_url
                  ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><UtensilsCrossed className="w-8 h-8 text-zinc-600" /></div>}
                {!item.is_available && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-xs font-bold text-white bg-zinc-700 px-2 py-1 rounded-lg">Unavailable</span>
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
                  <Switch checked={item.is_available ?? false} onCheckedChange={() => toggleAvailable(item)} />
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
              <h2 className="text-lg font-bold text-zinc-50">{editingId ? "Edit Item" : "Add Menu Item"}</h2>
              <button onClick={close} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              {/* Image preview + upload */}
              <div className="space-y-2">
                <Label className="text-zinc-400 text-xs">Image</Label>
                {form.image_url && (
                  <div className="relative rounded-xl overflow-hidden aspect-video bg-zinc-800">
                    <img src={form.image_url} alt="" className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.style.display = "none"; }} />
                    <button onClick={() => setForm({ ...form, image_url: "" })}
                      className="absolute top-2 right-2 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <div className="flex gap-2">
                  <label className={cn("flex-1 flex items-center justify-center gap-2 h-10 px-3 rounded-xl border cursor-pointer text-sm font-semibold transition-colors",
                    imageUploading ? "border-zinc-700 text-zinc-600 cursor-not-allowed" : "border-[#FF5A00]/40 text-[#FF5A00] hover:bg-[#FF5A00]/10")}>
                    {imageUploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</> : "📁 Upload Image"}
                    <input type="file" accept="image/*" className="sr-only" disabled={imageUploading}
                      onChange={handleImageUpload} />
                  </label>
                </div>
                {bucketError && (
                  <div className="flex items-start gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Storage bucket not found. Paste an image URL below instead. (Create "<strong>menu-images</strong>" bucket in Supabase→Storage to enable uploads.)</span>
                  </div>
                )}
                <div className="space-y-1">
                  <Label className="text-zinc-500 text-[11px]">Or paste image URL</Label>
                  <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                    placeholder="https://…" className="bg-zinc-950 border-zinc-700 h-9 text-sm" />
                </div>
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
              <div className="flex items-center justify-between p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                <div><p className="font-medium text-zinc-200 text-sm">Available</p><p className="text-xs text-zinc-500">Show on customer menu</p></div>
                <Switch checked={form.is_available} onCheckedChange={(v) => setForm({ ...form, is_available: v })} />
              </div>
            </div>
            <div className="sticky bottom-0 bg-zinc-900 border-t border-zinc-800 px-5 py-4 flex gap-3 justify-end">
              <Button variant="ghost" onClick={close} className="text-zinc-400">Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-[#FF5A00] hover:bg-[#e04f00] text-white gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editingId ? "Save" : "Add Item"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
