import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  ImageOff,
  ChevronDown,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MultiImageUpload } from "@/components/MultiImageUpload";

const CATEGORIES = [
  "Burgers",
  "Chicken",
  "Sides",
  "Beverages",
  "Desserts",
  "Combos",
  "Specials",
  "Other",
];

const emptyForm = {
  name: "",
  description: "",
  price: "",
  category: "Other",
  is_available: true,
  images: [] as string[],
};

type FormState = typeof emptyForm;

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  image_url: string | null;
  images: string[] | null;
  is_available: boolean;
  created_at: string;
}

export default function AdminMenu() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from("mfc_menu_items")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setItems((data as MenuItem[]) || []);
    } catch (err: any) {
      toast.error("Failed to load menu items: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  /* ─── Helpers ─────────────────────────────────────── */
  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowDialog(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      description: item.description ?? "",
      price: String(item.price),
      category: item.category ?? "Other",
      is_available: item.is_available,
      images: Array.isArray(item.images)
        ? item.images
        : item.image_url
        ? [item.image_url]
        : [],
    });
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error("Product name is required");
    if (!form.price || isNaN(Number(form.price)))
      return toast.error("Enter a valid price");

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        price: Number(form.price),
        category: form.category,
        is_available: form.is_available,
        images: form.images.filter(Boolean),
        image_url: form.images[0] ?? null,
      };

      if (editingId) {
        const { error } = await supabase
          .from("mfc_menu_items")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
        toast.success("Product updated!");
      } else {
        const { error } = await supabase
          .from("mfc_menu_items")
          .insert(payload);
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
    if (!confirm("Delete this product? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from("mfc_menu_items")
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast.success("Product deleted");
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err: any) {
      toast.error("Delete failed: " + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const toggleAvailability = async (id: string, current: boolean) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, is_available: !current } : i))
    );
    const { error } = await supabase
      .from("mfc_menu_items")
      .update({ is_available: !current })
      .eq("id", id);
    if (error) {
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, is_available: current } : i))
      );
      toast.error("Failed to update availability");
    }
  };

  const filtered = items.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      (i.category ?? "").toLowerCase().includes(search.toLowerCase())
  );

  /* ─── Render ──────────────────────────────────────── */
  if (loading)
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8 text-zinc-500" />
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-50">
            Menu Management
          </h1>
          <p className="text-zinc-400 mt-1">
            Add, edit, or remove products. Manage availability.
          </p>
        </div>
        <Button
          onClick={openAdd}
          className="bg-[#FF5A00] hover:bg-[#e04f00] text-white font-bold gap-2 rounded-xl h-11 px-5 shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Product
        </Button>
      </div>

      {/* Search */}
      <Input
        placeholder="Search by name or category…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="bg-zinc-900 border-zinc-800 max-w-sm"
      />

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-zinc-950/50 text-zinc-400 text-xs uppercase border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-semibold">Image</th>
                <th className="px-6 py-4 font-semibold">Name & Desc</th>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold">Price</th>
                <th className="px-6 py-4 font-semibold text-center">Available</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-16 text-zinc-500 text-sm"
                  >
                    {items.length === 0
                      ? "No products yet. Click «Add Product» to get started."
                      : "No results for your search."}
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const imgs = Array.isArray(item.images)
                    ? item.images
                    : item.image_url
                    ? [item.image_url]
                    : [];
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-zinc-800/40 transition-colors"
                    >
                      {/* Images */}
                      <td className="px-6 py-4">
                        <div className="flex gap-1">
                          {imgs.length > 0 ? (
                            imgs.slice(0, 4).map((url, i) => (
                              <div
                                key={i}
                                className={`w-10 h-10 rounded-lg overflow-hidden border ${
                                  i === 0
                                    ? "border-[#FF5A00]"
                                    : "border-zinc-700"
                                }`}
                              >
                                <img
                                  src={url}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                              <ImageOff className="w-4 h-4 text-zinc-600" />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Name */}
                      <td className="px-6 py-4 max-w-[220px]">
                        <p className="font-bold text-zinc-200 truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">
                          {item.description}
                        </p>
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4">
                        <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded-md">
                          {item.category ?? "—"}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="px-6 py-4 font-bold text-green-400">
                        ₹{item.price}
                      </td>

                      {/* Toggle */}
                      <td className="px-6 py-4 text-center">
                        <Switch
                          checked={item.is_available}
                          onCheckedChange={() =>
                            toggleAvailability(item.id, item.is_available)
                          }
                        />
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openEdit(item)}
                            className="w-8 h-8 text-zinc-400 hover:text-white hover:bg-zinc-700"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(item.id)}
                            disabled={deletingId === item.id}
                            className="w-8 h-8 text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
                          >
                            {deletingId === item.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add / Edit Dialog ─────────────────────────── */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeDialog}
          />

          {/* Panel */}
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-zinc-50">
                {editingId ? "Edit Product" : "Add New Product"}
              </h2>
              <button
                onClick={closeDialog}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* Images */}
              <div className="space-y-2">
                <Label className="text-zinc-300 font-semibold">
                  Product Images (up to 4)
                </Label>
                <MultiImageUpload
                  images={form.images}
                  onChange={(imgs) => setForm({ ...form, images: imgs })}
                  maxImages={4}
                  bucket="product-images"
                />
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label className="text-zinc-300">Product Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Crispy Chicken Burger"
                  className="bg-zinc-950 border-zinc-700"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label className="text-zinc-300">Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Short description of the product…"
                  rows={3}
                  className="bg-zinc-950 border-zinc-700 resize-none"
                />
              </div>

              {/* Price & Category */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Price (₹) *</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: e.target.value })
                    }
                    placeholder="0.00"
                    className="bg-zinc-950 border-zinc-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">Category</Label>
                  <div className="relative">
                    <select
                      value={form.category}
                      onChange={(e) =>
                        setForm({ ...form, category: e.target.value })
                      }
                      className="w-full h-10 bg-zinc-950 border border-zinc-700 rounded-md px-3 text-zinc-200 text-sm appearance-none pr-8"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Availability */}
              <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-xl border border-zinc-800">
                <div>
                  <p className="font-medium text-zinc-200">Available Now</p>
                  <p className="text-xs text-zinc-500">
                    Toggle to show/hide from the menu
                  </p>
                </div>
                <Switch
                  checked={form.is_available}
                  onCheckedChange={(v) =>
                    setForm({ ...form, is_available: v })
                  }
                />
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-zinc-900 border-t border-zinc-800 px-6 py-4 flex gap-3 justify-end">
              <Button
                variant="ghost"
                onClick={closeDialog}
                className="text-zinc-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-[#FF5A00] hover:bg-[#e04f00] text-white font-bold gap-2 px-6"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {editingId ? "Save Changes" : "Add Product"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
