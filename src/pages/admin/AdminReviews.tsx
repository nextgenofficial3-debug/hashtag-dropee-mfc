import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Star, Check, X, Trash2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Review {
  id: string;
  customer_name: string;
  rating: number;
  review_text: string;
  is_approved: boolean;
  created_at: string;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={cn("w-3.5 h-3.5", s <= rating ? "fill-amber-400 text-amber-400" : "text-zinc-700")} />
      ))}
    </div>
  );
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetch = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("mfc_reviews")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Failed to load reviews: " + error.message);
    else setReviews((data as Review[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const toggleApproval = async (r: Review) => {
    setTogglingId(r.id);
    const newVal = !r.is_approved;
    setReviews((prev) => prev.map((x) => x.id === r.id ? { ...x, is_approved: newVal } : x));
    const { error } = await supabase.from("mfc_reviews").update({ is_approved: newVal }).eq("id", r.id);
    if (error) {
      setReviews((prev) => prev.map((x) => x.id === r.id ? { ...x, is_approved: r.is_approved } : x));
      toast.error("Update failed");
    } else {
      toast.success(newVal ? "Review approved" : "Review hidden");
    }
    setTogglingId(null);
  };

  const deleteReview = async (id: string) => {
    if (!confirm("Delete this review permanently?")) return;
    setDeletingId(id);
    const { error } = await supabase.from("mfc_reviews").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); setReviews((p) => p.filter((r) => r.id !== id)); }
    setDeletingId(null);
  };

  const filtered = reviews.filter((r) => {
    if (filter === "pending") return !r.is_approved;
    if (filter === "approved") return r.is_approved;
    return true;
  });

  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "—";
  const pending = reviews.filter((r) => !r.is_approved).length;

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-zinc-500" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-zinc-50 flex items-center gap-3">
          <MessageSquare className="w-7 h-7 text-[#FF5A00]" /> Reviews
        </h1>
        <p className="text-zinc-400 mt-1">Moderate customer reviews.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total", value: reviews.length },
          { label: "Avg Rating", value: avg },
          { label: "Pending", value: pending, highlight: pending > 0 },
        ].map(({ label, value, highlight }) => (
          <div key={label} className={cn("bg-zinc-900 border rounded-2xl p-4 text-center",
            highlight ? "border-amber-500/30" : "border-zinc-800")}>
            <p className={cn("text-2xl font-bold", highlight ? "text-amber-400" : "text-zinc-100")}>{value}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["all", "pending", "approved"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn("px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-colors",
              filter === f ? "bg-[#FF5A00] text-white" : "bg-zinc-800 text-zinc-400 hover:text-zinc-200")}>
            {f}
          </button>
        ))}
      </div>

      {/* Reviews list */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-zinc-500 bg-zinc-900 border border-zinc-800 rounded-2xl">No reviews found.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div key={r.id} className={cn(
              "bg-zinc-900 border rounded-2xl p-4 flex gap-4",
              r.is_approved ? "border-zinc-800" : "border-amber-500/20"
            )}>
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-[#FF5A00]/20 flex items-center justify-center shrink-0 text-[#FF5A00] font-bold text-sm">
                {r.customer_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <p className="font-semibold text-zinc-100 text-sm">{r.customer_name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <StarRating rating={r.rating} />
                      <span className="text-[10px] text-zinc-600">{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!r.is_approved && (
                      <span className="text-[10px] font-bold bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-md">Pending</span>
                    )}
                    <Button size="icon" variant="ghost"
                      className={cn("w-8 h-8", r.is_approved ? "text-green-400 hover:text-green-300" : "text-zinc-500 hover:text-green-400")}
                      onClick={() => toggleApproval(r)} disabled={togglingId === r.id}>
                      {togglingId === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    </Button>
                    <Button size="icon" variant="ghost" className="w-8 h-8 text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
                      onClick={() => deleteReview(r.id)} disabled={deletingId === r.id}>
                      {deletingId === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-zinc-400 mt-2 leading-relaxed">{r.review_text}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
