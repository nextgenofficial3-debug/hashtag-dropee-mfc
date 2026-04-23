import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ShoppingBag, Star, Store, Utensils } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";

const CATEGORIES = [
  { id: "all", label: "All Menu", icon: Store, color: "text-primary", bg: "bg-primary/10" },
  { id: "spicy", label: "Spicy Picks", icon: Utensils, color: "text-orange-400", bg: "bg-orange-400/10" },
  { id: "value", label: "Budget", icon: ShoppingBag, color: "text-emerald-400", bg: "bg-emerald-400/10" },
  { id: "featured", label: "Featured", icon: Star, color: "text-sky-400", bg: "bg-sky-400/10" },
];

export default function Discover() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const { products, loading } = useProducts();

  const filtered = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        !search ||
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        (product.description || "").toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) {
        return false;
      }

      if (category === "spicy") {
        return (product.description || "").toLowerCase().includes("spicy");
      }

      if (category === "value") {
        return product.price <= 199;
      }

      if (category === "featured") {
        return product.price >= 249;
      }

      return true;
    });
  }, [category, products, search]);

  return (
    <div className="min-h-screen bg-background pb-24 pt-20">
      <div className="px-4 mb-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search menu items..."
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      <div className="flex gap-3 px-4 overflow-x-auto pb-2 scrollbar-hide mb-4">
        {CATEGORIES.map(({ id, label, icon: Icon, color }) => (
          <button
            key={id}
            onClick={() => setCategory(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl shrink-0 text-sm font-medium transition-all ${
              category === id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground border border-border"
            }`}
          >
            <Icon className={`w-4 h-4 ${category === id ? "text-white" : color}`} />
            {label}
          </button>
        ))}
      </div>

      <div className="px-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-24 rounded-2xl bg-secondary/50 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Store className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No menu items match your search</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Clear the filter or try a different keyword</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((product) => (
              <Link key={product.id} to={`/shop`} className="block">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all hover:shadow-md">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-secondary">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      <Utensils className="w-7 h-7 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-foreground text-sm truncate">{product.name}</p>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 bg-emerald-500/15 text-emerald-400">
                        Available
                      </span>
                    </div>
                    {product.description ? (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{product.description}</p>
                    ) : null}
                  </div>
                  <div className="text-sm font-bold text-primary">₹{product.price}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
