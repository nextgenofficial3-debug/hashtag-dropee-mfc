import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useProducts } from "@/hooks/useProducts";

export default function Shop() {
  const { products: items, loading: itemsLoading } = useProducts();
  const [categories, setCategories] = useState<any[]>([]);
  const [catsLoading, setCatsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Product Detail Sheet State
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [quantity, setQuantity] = useState(1);

  const { user } = useAuth();

  useEffect(() => {
    async function fetchCats() {
      try {
        const catsRes = await supabase.from("mfc_categories" as any).select("*").order("sort_order", { ascending: true });
        if (catsRes.data) setCategories(catsRes.data as any);
      } catch (err) {
        console.error("Shop error:", err);
      } finally {
        setCatsLoading(false);
      }
    }
    fetchCats();
  }, []);

  const loading = itemsLoading || catsLoading;

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "all" || item.category_id === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // Cart count badge
  const [cartCount, setCartCount] = useState(() => {
    try {
      const cart = JSON.parse(localStorage.getItem("dropee_cart") || "[]");
      return cart.reduce((sum: number, i: any) => sum + (i.quantity || 1), 0);
    } catch { return 0; }
  });

  const handleAddToCart = () => {
    if (!user) {
      toast.error("Please login to add to cart");
      return;
    }
    if (!selectedItem) return;

    try {
      const cart = JSON.parse(localStorage.getItem("dropee_cart") || "[]");
      const existing = cart.find((i: any) => i.id === selectedItem.id);
      if (existing) {
        existing.quantity = (existing.quantity || 1) + quantity;
        existing.special_instructions = specialInstructions || existing.special_instructions;
      } else {
        cart.push({
          ...selectedItem,
          quantity,
          special_instructions: specialInstructions,
        });
      }
      localStorage.setItem("dropee_cart", JSON.stringify(cart));
      const newCount = cart.reduce((sum: number, i: any) => sum + (i.quantity || 1), 0);
      setCartCount(newCount);
      toast.success(`Added ${quantity}x ${selectedItem.name} to cart 🛒`);
    } catch (err) {
      toast.error("Failed to add to cart");
    }

    setSelectedItem(null);
    setQuantity(1);
    setSpecialInstructions("");
  };

  return (
    <div className="min-h-screen bg-background pb-24 pt-20 px-4">
      {/* Search and Filter */}
      <div className="sticky top-16 z-20 bg-background/80 backdrop-blur-md pb-4 pt-2 -mx-4 px-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            placeholder="Search our menu..." 
            className="pl-10 h-12 rounded-2xl bg-muted/50 border-transparent focus-visible:ring-primary"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Categories Horizontal */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 snap-x">
          <Button 
            variant={activeCategory === "all" ? "default" : "secondary"}
            className="rounded-full snap-start whitespace-nowrap"
            onClick={() => setActiveCategory("all")}
          >
            All Menu
          </Button>
          {categories.map((cat) => (
             <Button 
              key={cat.id}
              variant={activeCategory === cat.id ? "default" : "secondary"}
              className="rounded-full snap-start whitespace-nowrap"
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          No items found.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 mt-2">
          {filteredItems.map(item => (
            <div 
              key={item.id} 
              className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm flex flex-col cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedItem(item)}
            >
              <div className="aspect-square bg-muted/30">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <span className="text-muted-foreground/30 font-bold">NO IMAGE</span>
                  </div>
                )}
              </div>
              <div className="p-3 flex flex-col flex-1">
                <h4 className="font-bold text-sm line-clamp-2 leading-tight">{item.name}</h4>
                <div className="mt-auto pt-2 flex items-center justify-between">
                  <span className="font-bold text-primary">₹{item.price}</span>
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    +
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Detail Bottom Sheet */}
      <Sheet open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl pb-safe flex flex-col p-0 gap-0">
          {selectedItem && (
            <>
              {/* Image Header */}
              <div className="h-64 bg-muted relative shrink-0">
                {selectedItem.image_url && (
                  <img src={selectedItem.image_url} alt={selectedItem.name} className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold">{selectedItem.name}</h2>
                  <p className="text-primary font-bold text-lg mt-1">₹{selectedItem.price}</p>
                  {selectedItem.description && (
                    <p className="text-muted-foreground text-sm mt-3 leading-relaxed">
                      {selectedItem.description}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                   <label className="text-sm font-semibold">Special Instructions</label>
                   <Input 
                     placeholder="E.g. No onions, extra spicy..." 
                     value={specialInstructions}
                     onChange={(e) => setSpecialInstructions(e.target.value)}
                     className="bg-muted/30 border-border rounded-xl h-12"
                   />
                </div>
              </div>

              {/* Action Bar */}
              <div className="p-6 bg-background border-t border-border flex items-center gap-4">
                <div className="flex items-center gap-4 bg-muted/50 rounded-2xl p-1 border border-border">
                  <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl" onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</Button>
                  <span className="font-bold w-4 text-center">{quantity}</span>
                  <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl" onClick={() => setQuantity(quantity + 1)}>+</Button>
                </div>
                <Button className="flex-1 h-14 rounded-2xl font-bold text-base shadow-lg shadow-primary/25" onClick={handleAddToCart}>
                  Add to Cart • ₹{(selectedItem.price * quantity).toFixed(2)}
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
