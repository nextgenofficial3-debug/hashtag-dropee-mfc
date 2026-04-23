import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Flame, Loader2, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReservationFlow } from "@/components/reservation/ReservationFlow";
import { useProducts } from "@/hooks/useProducts";
import { supabase } from "@/integrations/supabase/client";
import type { MenuCategory, StoreSettings } from "@/types/app";

export default function Index() {
  const { products, loading } = useProducts();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [isReservationOpen, setIsReservationOpen] = useState(false);

  useEffect(() => {
    async function fetchHomeData() {
      const [{ data: categoryData }, { data: settingsData }] = await Promise.all([
        supabase.from("mfc_categories").select("*").order("sort_order", { ascending: true }),
        supabase.from("mfc_store_settings").select("*").single(),
      ]);

      setCategories(categoryData || []);
      setStoreSettings(settingsData || null);
    }

    fetchHomeData();
  }, []);

  const heroImage = storeSettings?.menu_images?.[0] || products[0]?.image_url || null;
  const featuredItems = products.slice(0, 6);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="pt-20 px-6 space-y-8">
        <section className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              {storeSettings?.is_open ? "Open Now" : "Store Closed"}
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Fresh menu,
              <br />
              ready when you are.
            </h1>
            <p className="text-sm text-muted-foreground max-w-md">
              Browse the live menu, place food orders, reserve a table, or request local delivery support from one place.
            </p>
          </div>

          <div className="relative w-full h-48 rounded-3xl overflow-hidden shadow-lg bg-zinc-900 group">
            {heroImage ? (
              <img
                src={heroImage}
                alt={storeSettings?.brand_name || "Menu highlight"}
                className="w-full h-full object-cover opacity-70 transition-transform duration-500 group-hover:scale-105"
              />
            ) : null}
            <div className="absolute inset-0 p-5 flex flex-col justify-end bg-gradient-to-t from-black/80 to-transparent">
              <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-md mb-2 w-max uppercase tracking-wider">
                {storeSettings?.brand_name || "MFC"}
              </span>
              <h2 className="text-white text-xl font-bold">
                {categories.length > 0 ? `Explore ${categories[0].name}` : "Explore today’s menu"}
              </h2>
              <p className="text-gray-300 text-sm mt-1">
                Delivery fee from ₹{Number(storeSettings?.base_delivery_fee || 0).toFixed(0)}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button asChild className="rounded-2xl h-12 px-5">
              <Link to="/shop">
                Order Now <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button variant="outline" className="rounded-2xl h-12 px-5" onClick={() => setIsReservationOpen(true)}>
              Reserve a Table
            </Button>
          </div>
        </section>

        <section>
          <div className="flex justify-between items-end mb-4">
            <h3 className="text-xl font-bold">Categories</h3>
            <Link to="/shop" className="text-sm font-medium text-primary hover:underline">See all</Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
            {categories.map((category) => (
              <Link key={category.id} to={`/shop?category=${category.id}`} className="flex flex-col items-center gap-2 snap-center shrink-0">
                <div className="w-16 h-16 rounded-2xl bg-muted/50 border border-border flex items-center justify-center hover:bg-primary/10 hover:border-primary/30 transition-colors shadow-sm">
                  <Utensils className="w-6 h-6 text-foreground/70" />
                </div>
                <span className="text-xs font-medium">{category.name}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="relative overflow-hidden rounded-3xl bg-primary text-primary-foreground p-6 shadow-md shadow-primary/20">
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-2">Dine In With Us</h3>
            <p className="text-primary-foreground/80 text-sm mb-4 max-w-[240px]">
              Pick a time, choose your table, and let us prepare for your visit.
            </p>
            <Button variant="secondary" className="font-semibold rounded-xl" onClick={() => setIsReservationOpen(true)}>
              Reserve a Table
            </Button>
          </div>
          <Utensils className="absolute -right-6 -bottom-6 w-32 h-32 text-white/10 rotate-12" />
        </section>

        <section className="space-y-4">
          <div className="flex justify-between items-end">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              Menu Highlights
            </h3>
            <Link to="/discover" className="text-sm font-medium text-primary hover:underline">
              Discover
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : featuredItems.length === 0 ? (
            <div className="text-center p-8 bg-muted/20 rounded-2xl border border-border dashed">
              <p className="text-muted-foreground">No items available right now.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {featuredItems.map((item) => (
                <Link key={item.id} to="/shop" className="flex gap-4 p-3 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-muted">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : null}
                  </div>
                  <div className="flex flex-col justify-between py-1 flex-1">
                    <div>
                      <h4 className="font-bold line-clamp-1">{item.name}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{item.description}</p>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="font-bold">₹{item.price}</span>
                      <Button size="sm" variant="outline" className="rounded-full">
                        View
                      </Button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      <ReservationFlow isOpen={isReservationOpen} onClose={() => setIsReservationOpen(false)} />
    </div>
  );
}
