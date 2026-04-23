import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, CheckCircle2, Clock, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Reservation } from "@/types/app";

const STATUS_CONFIG: Record<string, { color: string; icon: typeof Clock }> = {
  pending: { color: "text-amber-400 bg-amber-400/10", icon: Clock },
  confirmed: { color: "text-primary bg-primary/10", icon: CheckCircle2 },
  completed: { color: "text-emerald-400 bg-emerald-400/10", icon: CheckCircle2 },
  cancelled: { color: "text-destructive bg-destructive/10", icon: XCircle },
};

export default function Bookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function fetchBookings() {
      const { data } = await supabase
        .from("mfc_reservations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setBookings(data || []);
      setLoading(false);
    }

    fetchBookings();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8 pt-24">
        <div className="text-center">
          <CalendarDays className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-base font-bold text-foreground">Sign in to view bookings</p>
          <p className="text-sm text-muted-foreground mt-2">Your reservations will appear here</p>
          <Link to="/auth/login" className="mt-6 inline-block px-6 py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 pt-20">
      <div className="px-4 mb-6">
        <h1 className="text-2xl font-extrabold text-foreground">My Bookings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Your table reservations and booking history</p>
      </div>

      {loading ? (
        <div className="px-4 space-y-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-24 rounded-2xl bg-secondary/50 animate-pulse" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="px-4 py-16 text-center">
          <CalendarDays className="w-14 h-14 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-base font-bold text-foreground">No bookings yet</p>
          <p className="text-sm text-muted-foreground mt-2 mb-6">Reserve a table to get started</p>
          <Link to="/" className="inline-block px-6 py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold">
            Explore
          </Link>
        </div>
      ) : (
        <div className="px-4 space-y-3">
          {bookings.map((booking) => {
            const config = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
            const Icon = config.icon;

            return (
              <div key={booking.id} className="bg-card rounded-2xl border border-border p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${config.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground capitalize">
                      {booking.table_type} table
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(booking.reservation_time).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{booking.people_count} guests</p>
                    {booking.special_requests ? (
                      <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-2">{booking.special_requests}</p>
                    ) : null}
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 capitalize ${config.color}`}>
                    {booking.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
