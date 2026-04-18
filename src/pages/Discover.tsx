import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Search, Store, Utensils, ShoppingBag, FlaskConical, Star } from "lucide-react";
import { useShops } from "@/hooks/useShops";

const CATEGORIES = [
  { id: "food", label: "Food", icon: Utensils, color: "text-orange-400", bg: "bg-orange-400/10" },
  { id: "grocery", label: "Grocery", icon: ShoppingBag, color: "text-emerald-400", bg: "bg-emerald-400/10" },
  { id: "pharmacy", label: "Pharmacy", icon: FlaskConical, color: "text-sky-400", bg: "bg-sky-400/10" },
  { id: "services", label: "Services", icon: Star, color: "text-purple-400", bg: "bg-purple-400/10" },
];

interface Shop {
  id: string;
  name: string;
  category: string;
  address: string | null;
  phone: string | null;
  is_open: boolean;
  logo_url: string | null;
  created_at: string;
}

export default function Discover() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const { shops, loading } = useShops(category || undefined);

  const filtered = shops.filter((s) =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.address || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-24 pt-20">
      {/* Search Bar */}
      <div className="px-4 mb-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search shops in Ukhrul..."
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-3 px-4 overflow-x-auto pb-2 scrollbar-hide mb-4">
        <button
          onClick={() => setCategory(null)}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl shrink-0 text-sm font-medium transition-all ${
            category === null ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground border border-border"
          }`}
        >
          <Store className="w-4 h-4" /> All
        </button>
        {CATEGORIES.map(({ id, label, icon: Icon, color }) => (
          <button
            key={id}
            onClick={() => setCategory(id === category ? null : id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl shrink-0 text-sm font-medium transition-all ${
              category === id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground border border-border"
            }`}
          >
            <Icon className={`w-4 h-4 ${category === id ? "text-white" : color}`} />
            {label}
          </button>
        ))}
      </div>

      {/* Shop List */}
      <div className="px-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-secondary/50 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Store className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No shops found in Ukhrul yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Check back later or clear the filter</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((shop) => {
              const cat = CATEGORIES.find((c) => c.id === shop.category);
              const Icon = cat?.icon || Store;
              return (
                <Link key={shop.id} to={`/shop?id=${shop.id}`} className="block">
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all hover:shadow-md">
                    {/* Logo */}
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${cat?.bg || "bg-secondary"}`}>
                      {shop.logo_url ? (
                        <img src={shop.logo_url} alt={shop.name} className="w-full h-full object-cover rounded-2xl" />
                      ) : (
                        <Icon className={`w-7 h-7 ${cat?.color || "text-muted-foreground"}`} />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-foreground text-sm truncate">{shop.name}</p>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                          shop.is_open ? "bg-emerald-500/15 text-emerald-400" : "bg-secondary text-muted-foreground"
                        }`}>
                          {shop.is_open ? "Open" : "Closed"}
                        </span>
                      </div>
                      {shop.address && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{shop.address}</p>
                      )}
                      {cat && (
                        <p className={`text-xs font-medium mt-1 capitalize ${cat.color}`}>{cat.label}</p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
