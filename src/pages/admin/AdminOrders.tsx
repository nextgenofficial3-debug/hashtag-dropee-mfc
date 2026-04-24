import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ArrowRight, Pencil, X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const STATUS_PIPELINE: Record<string, string> = {
  pending: "preparing",
  preparing: "out_for_delivery",
  out_for_delivery: "delivered",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Accept",
  preparing: "Dispatch",
  out_for_delivery: "Delivered",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-orange-500/20 text-orange-400",
  preparing: "bg-blue-500/20 text-blue-400",
  out_for_delivery: "bg-indigo-500/20 text-indigo-400",
  delivered: "bg-green-500/20 text-green-400",
  cancelled: "bg-red-500/20 text-red-400",
};

interface Order {
  id: string;
  created_at: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  total: number | null;
  status: string;
  items?: any;
}

interface EditForm {
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  total: string;
  status: string;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("mfc_orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setOrders((data as Order[]) || []);
    } catch (err: any) {
      toast.error("Failed to load orders: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const channel = supabase
      .channel("orders_admin_channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "mfc_orders" },
        fetchOrders
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  /* ── Status advance ─────────────────────────────── */
  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("mfc_orders")
        .update({ status: newStatus })
        .eq("id", orderId);
      if (error) throw error;
      toast.success(`Order → ${newStatus.replace(/_/g, " ")}`);
    } catch (err: any) {
      toast.error("Failed to update status");
    }
  };

  /* ── Edit dialog ────────────────────────────────── */
  const openEdit = (order: Order) => {
    setEditOrder(order);
    setEditForm({
      customer_name: order.customer_name ?? "",
      customer_phone: order.customer_phone ?? "",
      customer_address: order.customer_address ?? "",
      total: String(order.total ?? ""),
      status: order.status,
    });
  };

  const closeEdit = () => {
    setEditOrder(null);
    setEditForm(null);
  };

  const handleSaveEdit = async () => {
    if (!editOrder || !editForm) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("mfc_orders")
        .update({
          customer_name: editForm.customer_name.trim() || null,
          customer_phone: editForm.customer_phone.trim() || null,
          customer_address: editForm.customer_address.trim() || null,
          total: editForm.total ? Number(editForm.total) : null,
          status: editForm.status,
        })
        .eq("id", editOrder.id);
      if (error) throw error;
      toast.success("Order updated!");
      closeEdit();
      fetchOrders();
    } catch (err: any) {
      toast.error("Failed to save: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  /* ── Filtering ──────────────────────────────────── */
  const filtered = orders.filter(
    (o) =>
      !search ||
      o.id.includes(search) ||
      (o.customer_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (o.customer_phone ?? "").includes(search)
  );

  if (loading)
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8 text-zinc-500" />
      </div>
    );

  const ALL_STATUSES = [
    "pending",
    "preparing",
    "out_for_delivery",
    "delivered",
    "cancelled",
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-50">
            Orders
          </h1>
          <p className="text-zinc-400 mt-1">
            Manage and track food delivery orders in real-time.
          </p>
        </div>
        <div className="text-sm text-zinc-500 shrink-0">
          {orders.length} total orders
        </div>
      </div>

      {/* Search */}
      <Input
        placeholder="Search by ID, name, or phone…"
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
                <th className="px-6 py-4 font-semibold">Order ID & Date</th>
                <th className="px-6 py-4 font-semibold">Customer</th>
                <th className="px-6 py-4 font-semibold">Address</th>
                <th className="px-6 py-4 font-semibold">Total</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-12 text-zinc-500 text-sm"
                  >
                    No orders found.
                  </td>
                </tr>
              ) : (
                filtered.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-zinc-800/40 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="font-bold text-zinc-200 font-mono">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">
                        {new Date(order.created_at).toLocaleString()}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-zinc-200">
                        {order.customer_name ?? "—"}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {order.customer_phone ?? ""}
                      </p>
                    </td>
                    <td className="px-6 py-4 max-w-[180px]">
                      <p className="text-xs text-zinc-400 line-clamp-2">
                        {order.customer_address ?? "—"}
                      </p>
                    </td>
                    <td className="px-6 py-4 font-bold text-green-400">
                      ₹{order.total?.toFixed(2) ?? "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 inline-flex text-xs font-bold rounded-md uppercase tracking-wider ${
                          STATUS_COLORS[order.status] ??
                          "bg-zinc-700 text-zinc-300"
                        }`}
                      >
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {/* Status advance button */}
                        {STATUS_PIPELINE[order.status] && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 border-zinc-700 text-zinc-300 hover:text-white text-xs"
                            onClick={() =>
                              updateStatus(
                                order.id,
                                STATUS_PIPELINE[order.status]
                              )
                            }
                          >
                            {STATUS_LABEL[order.status]}{" "}
                            <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        )}
                        {/* Cancel */}
                        {["pending", "preparing"].includes(order.status) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-red-500 hover:text-red-400 hover:bg-red-500/10 text-xs"
                            onClick={() => updateStatus(order.id, "cancelled")}
                          >
                            Cancel
                          </Button>
                        )}
                        {/* Edit */}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="w-8 h-8 text-zinc-400 hover:text-white hover:bg-zinc-700"
                          onClick={() => openEdit(order)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Edit Order Dialog ─────────────────────────── */}
      {editOrder && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeEdit}
          />
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <div>
                <h2 className="text-lg font-bold text-zinc-50">Edit Order</h2>
                <p className="text-xs text-zinc-500 font-mono">
                  #{editOrder.id.slice(0, 8).toUpperCase()}
                </p>
              </div>
              <button
                onClick={closeEdit}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-zinc-400 text-xs">Customer Name</Label>
                  <Input
                    value={editForm.customer_name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, customer_name: e.target.value })
                    }
                    className="bg-zinc-950 border-zinc-700 h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-zinc-400 text-xs">Phone</Label>
                  <Input
                    value={editForm.customer_phone}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        customer_phone: e.target.value,
                      })
                    }
                    className="bg-zinc-950 border-zinc-700 h-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-zinc-400 text-xs">Delivery Address</Label>
                <Input
                  value={editForm.customer_address}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      customer_address: e.target.value,
                    })
                  }
                  className="bg-zinc-950 border-zinc-700 h-9"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-zinc-400 text-xs">Total (₹)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editForm.total}
                    onChange={(e) =>
                      setEditForm({ ...editForm, total: e.target.value })
                    }
                    className="bg-zinc-950 border-zinc-700 h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-zinc-400 text-xs">Status</Label>
                  <select
                    value={editForm.status}
                    onChange={(e) =>
                      setEditForm({ ...editForm, status: e.target.value })
                    }
                    className="w-full h-9 bg-zinc-950 border border-zinc-700 rounded-md px-3 text-zinc-200 text-sm"
                  >
                    {ALL_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 justify-end px-6 py-4 border-t border-zinc-800">
              <Button
                variant="ghost"
                onClick={closeEdit}
                className="text-zinc-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={saving}
                className="bg-[#FF5A00] hover:bg-[#e04f00] text-white font-bold gap-2"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
