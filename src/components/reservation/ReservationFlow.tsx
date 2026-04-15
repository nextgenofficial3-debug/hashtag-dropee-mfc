import React, { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock, Users, ArrowRight, CheckCircle2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function ReservationFlow({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState<string>("19:00");
  const [guests, setGuests] = useState(2);
  const [tableType, setTableType] = useState<"indoor" | "outdoor">("indoor");
  const [specialRequest, setSpecialRequest] = useState("");

  const handleNext = () => setStep((s) => s + 1);
  const handleBack = () => setStep((s) => s - 1);

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Please login to reserve a table.");
      return;
    }
    
    setLoading(true);
    try {
      const reservationTime = new Date(date!);
      const [hours, minutes] = time.split(':').map(Number);
      reservationTime.setHours(hours, minutes, 0, 0);

      const { error } = await supabase.from('food_reservations').insert({
        user_id: user.id,
        reservation_time: reservationTime.toISOString(),
        guest_count: guests,
        table_type: tableType,
        special_requests: specialRequest,
        reservation_status: "pending",
      });

      if (error) throw error;
      
      setStep(6); // Success Step
    } catch (err: any) {
      toast.error(err.message || "Failed to make reservation.");
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setStep(1);
    setDate(undefined);
    setTime("19:00");
    setGuests(2);
    setSpecialRequest("");
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && resetAndClose()}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl pb-safe flex flex-col p-6 pt-10">
        <SheetHeader className="mb-6 text-left">
          <SheetTitle className="text-2xl font-bold">
            {step === 6 ? "Reservation Confirmed" : "Reserve a Table"}
          </SheetTitle>
          <SheetDescription>
            {step === 1 && "Check availability instantly."}
            {step === 2 && "When would you like to join us?"}
            {step === 3 && "How many people are in your party?"}
            {step === 4 && "Where would you like to sit?"}
            {step === 5 && "Any special requests?"}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto pb-20 scrollbar-hide">
          {/* STEP 1: Availability Check (Simplified to always available for now) */}
          {step === 1 && (
            <div className="space-y-6 flex flex-col items-center justify-center py-10">
               <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
                 <CheckCircle2 className="w-10 h-10 text-green-500" />
               </div>
               <div className="text-center">
                 <h3 className="text-lg font-bold">Tables Available</h3>
                 <p className="text-muted-foreground text-sm mt-1">We have plenty of space tonight.</p>
               </div>
            </div>
          )}

          {/* STEP 2: Date & Time */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-semibold">Select Date</label>
                <div className="flex justify-center border border-border rounded-xl p-2">
                   <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                    className="rounded-md"
                  />
                </div>
              </div>
              <div className="space-y-3">
                 <label className="text-sm font-semibold">Select Time</label>
                 <Input 
                   type="time" 
                   value={time} 
                   onChange={(e) => setTime(e.target.value)}
                   className="h-12 w-full text-lg"
                 />
              </div>
            </div>
          )}

          {/* STEP 3: Number of People */}
          {step === 3 && (
            <div className="space-y-6 pt-10">
              <div className="flex items-center justify-between bg-muted/30 p-6 rounded-2xl border border-border">
                 <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl" onClick={() => setGuests(Math.max(1, guests - 1))}>-</Button>
                 <div className="flex flex-col items-center">
                    <span className="text-4xl font-bold">{guests}</span>
                    <span className="text-sm text-muted-foreground">Guests</span>
                 </div>
                 <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl" onClick={() => setGuests(Math.min(20, guests + 1))}>+</Button>
              </div>
            </div>
          )}

          {/* STEP 4: Table Type */}
          {step === 4 && (
            <div className="grid grid-cols-2 gap-4 pt-10">
               <button 
                 autoFocus={tableType === "indoor"}
                 onClick={() => setTableType("indoor")}
                 className={cn(
                   "p-6 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 transition-all",
                   tableType === "indoor" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                 )}
               >
                 <div className="w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center">
                   <Users className="w-6 h-6" />
                 </div>
                 <span className="font-semibold">Indoor</span>
               </button>
               <button 
                 onClick={() => setTableType("outdoor")}
                 className={cn(
                   "p-6 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 transition-all",
                   tableType === "outdoor" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                 )}
               >
                 <div className="w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center">
                   <Users className="w-6 h-6" />
                 </div>
                 <span className="font-semibold">Outdoor</span>
               </button>
            </div>
          )}

          {/* STEP 5: Special Requests */}
          {step === 5 && (
            <div className="space-y-4 pt-4">
              <Textarea 
                placeholder="Any dietary requirements, high chairs needed, or special occasions?"
                className="min-h-[150px] resize-none border-border focus-visible:ring-primary rounded-xl"
                value={specialRequest}
                onChange={(e) => setSpecialRequest(e.target.value)}
              />
            </div>
          )}

          {/* STEP 6: Success */}
          {step === 6 && (
            <div className="flex flex-col items-center justify-center text-center space-y-4 py-10">
              <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mb-4 text-primary">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h2 className="text-2xl font-bold">Booking Requested!</h2>
              <p className="text-muted-foreground text-sm max-w-[250px]">
                We have received your requested booking for {guests} people on {date ? format(date, "MMM dd, yyyy") : ""} at {time}. We will notify you once confirmed.
              </p>
            </div>
          )}
        </div>

        {/* Floating Action Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-background border-t border-border flex justify-between gap-4">
          {step > 1 && step < 6 && (
            <Button variant="outline" className="w-[100px] h-12 rounded-xl" onClick={handleBack}>
              Back
            </Button>
          )}
          
          <Button 
            className="flex-1 h-12 rounded-xl text-base font-semibold"
            disabled={loading || (step === 2 && !date)}
            onClick={() => {
              if (step === 5) handleSubmit();
              else if (step === 6) resetAndClose();
              else handleNext();
            }}
          >
            {loading ? "Adding Reservation..." : step === 6 ? "Done" : step === 5 ? "Confirm Booking" : "Continue"}
            {step < 5 && <ArrowRight className="w-5 h-5 ml-2" />}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
