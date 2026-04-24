import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Loader2, Users, CalendarClock, Check, X, Eye, Plus, Pencil, Save,
  Clock, Table, StickyNote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Reservation {
  id: string;
  user_id: string;
  reservation_time: string;
  people_count: number;
  table_type: string;
  special_requests: string | null;
  status: string;
  created_at: string;
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/20 text-amber-400",
  confirmed: "bg-green-500/20 text-green-400",
  completed: "bg-blue-500/20 text-blue-400",
  cancelled: "bg-red-500/20 text-red-400",
};

const TABLE_TYPES = ["standard", "vip", "outdoor", "private", "booth"];

export default function AdminReservations() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Reservation | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "confirmed" | "completed" | "cancelled">("all");

  // Add-form state
  const emptyAdd = { reservation_time: "", people_count: "2", table_type: "standard", special_requests: "" };
  const [addForm, setAddForm] = useState(emptyAdd);
  const [addSaving, setAddSaving] = useState(false);

  const fetchReservations = async () => {
    try {
      const { data, error } = await supabase
        .from("mfc_reservations")
        .select("*")
        .order("reservation_time", { ascending: true });
      if (error) throw error;
      setReservations((data as Reservation[]) || []);
    } catch (err: any) {
      toast.error("Failed to load reservations: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
    const channel = supabase
      .channel("reservations_channel")
      .on("postgres_changes", { event: "*", schema: "public", table: "mfc_reservations" }, fetchReservations)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const openDetail = (res: Reservation) => {
    setSelected(res);
    setEditNotes(res.special_requests ?? "");
    setEditStatus(res.status);
  };
  const closeDetail = () => setSelected(null);

  const saveDetail = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("mfc_reservations")
        .update({ special_requests: editNotes, status: editStatus, updated_at: new Date().toISOString() })
        .eq("id", selected.id);
      if (error) throw error;
      toast.success("Reservation updated");
      closeDetail();
      fetchReservations();
    } catch (err: any) {
      toast.error("Save failed: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const quickStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase.from("mfc_reservations").update({ status: newStatus }).eq("id", id);
      if (error) throw error;
      toast.success(`Marked as ${newStatus}`);
    } catch { toast.error("Failed to update status"); }
  };

  const handleAddReservation = async () => {
    if (!addForm.reservation_time) return toast.error("Reservation time required");
    if (!user?.id) return toast.error("Must be logged in");
    setAddSaving(true);
    try {
      const { error } = await supabase.from("mfc_reservations").insert({
        user_id: user.id,
        reservation_time: new Date(addForm.reservation_time).toISOString(),
        people_count: Number(addForm.people_count) || 2,
        table_type: addForm.table_type,
        special_requests: addForm.special_requests || null,
        status: "pending",
      });
      if (error) throw error;
      toast.success("Manual reservation added!");
      setAddForm(emptyAdd);
      setShowAdd(false);
      fetchReservations();
    } catch (err: any) {
      toast.error("Failed: " + err.message);
    } finally {
      setAddSaving(false);
    }
  };

  const filtered = reservations.filter((r) => filter === "all" || r.status === filter);

  const counts = reservations.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

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
          <h1 className="text-3xl font-bold tracking-tight text-zinc-50">Reservations</h1>
          <p className="text-zinc-400 mt-1">Manage table bookings and seating.</p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)} className="bg-[#FF5A00] hover:bg-[#e04f00] text-white font-bold gap-2 rounded-xl h-11 px-5 shrink-0">
          <Plus className="w-4 h-4" /> Manual Booking
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Pending", key: "pending", color: "text-amber-400" },
          { label: "Confirmed", key: "confirmed", color: "text-green-400" },
          { label: "Completed", key: "completed", color: "text-blue-400" },
          { label: "Cancelled", key: "cancelled", color: "text-red-400" },
        ].map(({ label, key, color }) => (
          <div key={key} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
            <p className={`text-2xl font-extrabold ${color}`}>{counts[key] ?? 0}</p>
            <p className="text-xs text-zinc-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h3 className="font-bold text-zinc-100 mb-4 flex items-center gap-2"><Plus className="w-4 h-4 text-[#FF5A00]" /> Add Manual Reservation</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-zinc-400 text-xs">Date & Time</Label>
              <Input type="datetime-local" value={addForm.reservation_time}
                onChange={(e) => setAddForm({ ...addForm, reservation_time: e.target.value })}
                className="bg-zinc-950 border-zinc-700 text-zinc-100" />
            </div>
            <div className="space-y-1">
              <Label className="text-zinc-400 text-xs">Number of Guests</Label>
              <Input type="number" min="1" max="20" value={addForm.people_count}
                onChange={(e) => setAddForm({ ...addForm, people_count: e.target.value })}
                className="bg-zinc-950 border-zinc-700" />
            </div>
            <div className="space-y-1">
              <Label className="text-zinc-400 text-xs">Table Type</Label>
              <select value={addForm.table_type} onChange={(e) => setAddForm({ ...addForm, table_type: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none">
                {TABLE_TYPES.map((t) => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-zinc-400 text-xs">Special Requests</Label>
              <Input value={addForm.special_requests}
                onChange={(e) => setAddForm({ ...addForm, special_requests: e.target.value })}
                placeholder="Dietary, celebration, etc." className="bg-zinc-950 border-zinc-700" />
            </div>
          </div>
          <div className="flex gap-3 justify-end mt-4">
            <Button variant="ghost" onClick={() => setShowAdd(false)} className="text-zinc-400">Cancel</Button>
            <Button onClick={handleAddReservation} disabled={addSaving} className="bg-[#FF5A00] hover:bg-[#e04f00] text-white gap-2">
              {addSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Confirm Booking
            </Button>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "pending", "confirmed", "completed", "cancelled"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn("px-4 py-2 rounded-xl text-sm font-semibold transition-colors capitalize",
              filter === f ? "bg-[#FF5A00] text-white" : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200"
            )}>
            {f} {f !== "all" && counts[f] ? `(${counts[f]})` : ""}
          </button>
        ))}
      </div>

      {/* Reservation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full py-20 text-center text-zinc-500 bg-zinc-900 border border-zinc-800 rounded-2xl">
            No reservations matching filter.
          </div>
        ) : filtered.map((res) => (
          <div key={res.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-4">
            {/* Top row: time + status */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 text-zinc-300">
                <CalendarClock className="w-4 h-4 text-[#FF5A00] shrink-0" />
                <span className="font-semibold text-sm">{new Date(res.reservation_time).toLocaleString()}</span>
              </div>
              <span className={cn("text-xs font-bold px-2 py-1 rounded-lg capitalize shrink-0", STATUS_STYLES[res.status] ?? "bg-zinc-700 text-zinc-300")}>
                {res.status}
              </span>
            </div>

            {/* Info rows */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <Users className="w-4 h-4 shrink-0" />
                <span><strong className="text-zinc-200">{res.people_count}</strong> guests</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <Table className="w-4 h-4 shrink-0" />
                <span className="capitalize"><strong className="text-zinc-200">{res.table_type}</strong> table</span>
              </div>
              {res.special_requests && (
                <div className="flex items-start gap-2 text-sm text-zinc-400">
                  <StickyNote className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{res.special_requests}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-zinc-600">
                <Clock className="w-3 h-3 shrink-0" />
                <span>Booked {new Date(res.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            {/* User ID (truncated) */}
            <div className="bg-zinc-950 rounded-lg p-2 text-[10px] text-zinc-600 font-mono truncate">
              uid: {res.user_id}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-zinc-800">
              <Button size="sm" variant="ghost" onClick={() => openDetail(res)}
                className="flex-1 text-zinc-400 hover:text-white hover:bg-zinc-800 gap-1 text-xs">
                <Eye className="w-3.5 h-3.5" /> Details
              </Button>
              {res.status === "pending" && (
                <>
                  <Button size="sm" onClick={() => quickStatus(res.id, "confirmed")}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-1 text-xs">
                    <Check className="w-3.5 h-3.5" /> Confirm
                  </Button>
                  <Button size="sm" onClick={() => quickStatus(res.id, "cancelled")}
                    className="flex-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 gap-1 text-xs">
                    <X className="w-3.5 h-3.5" /> Cancel
                  </Button>
                </>
              )}
              {res.status === "confirmed" && (
                <Button size="sm" onClick={() => quickStatus(res.id, "completed")}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs">
                  Mark Completed
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Detail/Edit Dialog */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeDetail} />
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <h2 className="text-lg font-bold text-zinc-50 flex items-center gap-2">
                <Pencil className="w-4 h-4 text-[#FF5A00]" /> Edit Reservation
              </h2>
              <button onClick={closeDetail} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-zinc-950 rounded-xl p-4 space-y-2 text-sm">
                <p className="text-zinc-200 font-bold">{new Date(selected.reservation_time).toLocaleString()}</p>
                <p className="text-zinc-400">{selected.people_count} guests · {selected.table_type} table</p>
                <p className="text-[10px] text-zinc-600 font-mono">uid: {selected.user_id}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400 text-xs">Status</Label>
                <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none">
                  {["pending", "confirmed", "completed", "cancelled"].map((s) =>
                    <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  )}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400 text-xs">Admin Notes / Special Requests</Label>
                <Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Add notes about this reservation…" rows={3}
                  className="bg-zinc-950 border-zinc-700 resize-none" />
              </div>
            </div>
            <div className="flex gap-3 justify-end px-6 py-4 border-t border-zinc-800">
              <Button variant="ghost" onClick={closeDetail} className="text-zinc-400">Cancel</Button>
              <Button onClick={saveDetail} disabled={saving} className="bg-[#FF5A00] hover:bg-[#e04f00] text-white gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
