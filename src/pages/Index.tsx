import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowRight, Utensils, Star, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReservationFlow } from "@/components/reservation/ReservationFlow";

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [trendingItems, setTrendingItems] = useState<any[]>([]);
  const [isReservationOpen, setIsReservationOpen] = useState(false);

  useEffect(() => {
    async function fetchHomeData() {
      try {
        const { data, error } = await supabase
          .from("mfc_menu_items")
          .select("*")
          .eq("is_available", true)
          .limit(5);

        if (data) setTrendingItems(data);
      } catch (err) {
        console.error("Home error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchHomeData();
  }, []);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* 1. Header Area padding (Accounted for by main layout pt) */}
      <div className="pt-20 px-6 space-y-8">
        
        {/* 2. Hero Section (Featured) */}
        <section className="space-y-4">
          <h1 className="text-3xl font-extrabold tracking-tight">
            Delicious food,<br /> delivered fast.
          </h1>
          <div className="relative w-full h-48 rounded-3xl overflow-hidden shadow-lg bg-zinc-900 group">
            <img 
              src="https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=800&auto=format&fit=crop" 
              alt="Promo"
              className="w-full h-full object-cover opacity-60 transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 p-5 flex flex-col justify-end bg-gradient-to-t from-black/80 to-transparent">
              <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-md mb-2 w-max uppercase tracking-wider">
                Special Offer
              </span>
              <h2 className="text-white text-xl font-bold">20% off all Burgers today!</h2>
              <p className="text-gray-300 text-sm mt-1">Use code: TASTY20</p>
            </div>
          </div>
        </section>

        {/* 3. Categories (Horizontal scroll) */}
        <section>
          <div className="flex justify-between items-end mb-4">
            <h3 className="text-xl font-bold">Categories</h3>
            <Link to="/shop" className="text-sm font-medium text-primary hover:underline">See all</Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
            {['Burgers', 'Pizza', 'Sushi', 'Desserts', 'Drinks'].map((category, i) => (
              <div key={i} className="flex flex-col items-center gap-2 snap-center shrink-0">
                <div className="w-16 h-16 rounded-2xl bg-muted/50 border border-border flex items-center justify-center hover:bg-primary/10 hover:border-primary/30 transition-colors shadow-sm">
                  <Utensils className="w-6 h-6 text-foreground/70" />
                </div>
                <span className="text-xs font-medium">{category}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Reservation CTA */}
        <section className="relative overflow-hidden rounded-3xl bg-primary text-primary-foreground p-6 shadow-md shadow-primary/20">
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-2">Dine In With Us</h3>
            <p className="text-primary-foreground/80 text-sm mb-4 max-w-[200px]">
              Reserve a table instantly and enjoy the full experience.
            </p>
            <Button 
              variant="secondary" 
              className="font-semibold rounded-xl"
              onClick={() => setIsReservationOpen(true)}
            >
              Reserve a Table
            </Button>
          </div>
          <Utensils className="absolute -right-6 -bottom-6 w-32 h-32 text-white/10 rotate-12" />
        </section>

        {/* 5. Trending / Shop preview */}
        <section className="space-y-4">
          <div className="flex justify-between items-end">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              Trending Now
            </h3>
          </div>
          
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : trendingItems.length === 0 ? (
            <div className="text-center p-8 bg-muted/20 rounded-2xl border border-border dashed">
              <p className="text-muted-foreground">No items available right now.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {trendingItems.map((item) => (
                <div key={item.id} className="flex gap-4 p-3 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-muted">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Utensils className="w-8 h-8 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col justify-between py-1 flex-1">
                    <div>
                      <h4 className="font-bold line-clamp-1">{item.name}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{item.description}</p>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="font-bold">₹{item.price}</span>
                      <Button size="sm" variant="outline" className="h-8 w-8 p-0 rounded-full">
                        +
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        
      </div>

      <ReservationFlow isOpen={isReservationOpen} onClose={() => setIsReservationOpen(false)} />
    </div>
  );
}
