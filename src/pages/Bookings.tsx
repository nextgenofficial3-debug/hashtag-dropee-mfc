import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CalendarDays, CheckCircle2, Clock, XCircle, Eye } from "lucide-react";

interface Booking {
  id: string;
  service_type: string;
  scheduled_at: string | null;
  address: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { color: string; icon: typeof Clock }> = {
  pending: { color: "text-amber-400 bg-amber-400/10", icon: Clock },
  confirmed: { color: "text-primary bg-primary/10", icon: CheckCircle2 },
  completed: { color: "text-emerald-400 bg-emerald-400/10", icon: CheckCircle2 },
  cancelled: { color: "text-destructive bg-destructive/10", icon: XCircle },
};

export default function Bookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchBookings = async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });

      if (!error) setBookings(data || []);
      setLoading(false);
    };

    fetchBookings();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8 pt-24">
        <div className="text-center">
          <CalendarDays className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-base font-bold text-foreground">Sign in to view bookings</p>
          <p className="text-sm text-muted-foreground mt-2">Your service bookings will appear here</p>
          <Link to="/auth" className="mt-6 inline-block px-6 py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold">
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
        <p className="text-sm text-muted-foreground mt-0.5">Your service reservations and appointments</p>
      </div>

      {loading ? (
        <div className="px-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-secondary/50 animate-pulse" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="px-4 py-16 text-center">
          <CalendarDays className="w-14 h-14 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-base font-bold text-foreground">No bookings yet</p>
          <p className="text-sm text-muted-foreground mt-2 mb-6">Reserve a table or book a service to get started</p>
          <Link to="/" className="inline-block px-6 py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold">
            Explore Services
          </Link>
        </div>
      ) : (
        <div className="px-4 space-y-3">
          {bookings.map((booking) => {
            const cfg = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
            const Icon = cfg.icon;
            return (
              <div key={booking.id} className="bg-card rounded-2xl border border-border p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground capitalize">
                      {booking.service_type.replace(/_/g, " ")}
                    </p>
                    {booking.scheduled_at && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        📅 {new Date(booking.scheduled_at).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    )}
                    {booking.address && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">📍 {booking.address}</p>
                    )}
                    {booking.notes && (
                      <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-2">{booking.notes}</p>
                    )}
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 capitalize ${cfg.color}`}>
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
