import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Users, CalendarClock, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminReservations() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReservations = async () => {
    try {
      const { data, error } = await supabase
        .from("mfc_reservations")
        .select(`*`)
        .order("reservation_time", { ascending: true });
        
      if (error) throw error;
      setReservations(data || []);
    } catch (err: any) {
      toast.error("Failed to load reservations: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();

    const channel = supabase
      .channel('reservations_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mfc_reservations' }, () => {
         fetchReservations(); 
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("mfc_reservations")
        .update({ status: newStatus })
        .eq("id", id);
        
      if (error) throw error;
      toast.success(`Reservation marked as ${newStatus}`);
    } catch (err: any) {
      toast.error("Failed to update status");
    }
  };

  if (loading) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-zinc-500" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-50">Reservations</h1>
        <p className="text-zinc-400 mt-1">Manage table bookings and seating.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {reservations.length === 0 ? (
            <div className="col-span-full py-20 text-center text-zinc-500 bg-zinc-900 border border-zinc-800 rounded-2xl">
               No upcoming reservations.
            </div>
         ) : reservations.map((res) => (
           <div key={res.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2 text-zinc-300">
                    <CalendarClock className="w-5 h-5 text-primary" />
                    <span className="font-semibold">{new Date(res.reservation_time).toLocaleString()}</span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider ${
                    res.status === 'pending' ? 'bg-orange-500/20 text-orange-400' :
                    res.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                    res.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {res.status}
                  </span>
                </div>
                
                <h3 className="font-bold text-lg text-zinc-100 flex items-center gap-2">
                  <Users className="w-5 h-5 text-zinc-400" />
                  {res.people_count} Guests
                </h3>
                
                <div className="mt-4 space-y-2 text-sm text-zinc-400">
                   <p><strong className="text-zinc-300">Type:</strong> <span className="capitalize">{res.table_type}</span></p>
                   {res.special_requests && (
                     <p><strong className="text-zinc-300">Notes:</strong> {res.special_requests}</p>
                   )}
                </div>
              </div>

              {res.status === 'pending' && (
                <div className="flex items-center gap-2 mt-6 pt-4 border-t border-zinc-800">
                  <Button className="flex-1 bg-green-500 text-white hover:bg-green-600 font-bold" onClick={() => updateStatus(res.id, 'confirmed')}>
                    <Check className="w-4 h-4 mr-2" /> Confirm
                  </Button>
                  <Button variant="outline" className="flex-1 border-red-500/50 text-red-500 hover:bg-red-500/10 font-bold" onClick={() => updateStatus(res.id, 'cancelled')}>
                    <X className="w-4 h-4 mr-2" /> Cancel
                  </Button>
                </div>
              )}
               {res.status === 'confirmed' && (
                <div className="flex items-center gap-2 mt-6 pt-4 border-t border-zinc-800">
                  <Button className="w-full bg-blue-500 text-white hover:bg-blue-600 font-bold" onClick={() => updateStatus(res.id, 'completed')}>
                    Mark Completed
                  </Button>
                </div>
              )}
           </div>
         ))}
      </div>
    </div>
  );
}
