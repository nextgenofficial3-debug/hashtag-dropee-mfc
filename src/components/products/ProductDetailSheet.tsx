import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, X, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Product, Category } from '@/types/database';
import { useCart } from '@/contexts/CartContext';
import { useActivePromotions } from '@/hooks/usePromotions';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ProductDetailSheetProps {
  product: (Product & { category?: Category | null }) | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProductDetailSheet: React.FC<ProductDetailSheetProps> = ({ product, open, onOpenChange }) => {
  const { items, addItem, updateQuantity } = useCart();
  const { data: promotions } = useActivePromotions();

  const { data: reviews } = useQuery({
    queryKey: ['product-reviews'],
    queryFn: async () => {
      const { data } = await supabase
        .from('reviews')
        .select('*')
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  if (!product) return null;

  const cartItem = items.find(i => i.product.id === product.id);
  const quantity = cartItem?.quantity || 0;

  const activeDiscount = promotions?.find(
    p => p.applies_to_all || p.product_ids?.includes(product.id)
  );
  const discountPercentage = activeDiscount?.discount_percentage || 0;
  const discountedPrice = product.price * (1 - discountPercentage / 100);

  const handleAdd = () => {
    if (product.in_stock) addItem(product);
  };

  const handleDecrement = () => {
    if (quantity > 0) updateQuantity(product.id, quantity - 1);
  };

  const avgRating = reviews && reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '4.8';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto p-0">
        {/* Product Image */}
        <div className="relative w-full h-56 sm:h-72 bg-muted overflow-hidden">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-7xl bg-muted">🍗</div>
          )}
          {discountPercentage > 0 && (
            <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground text-sm font-bold shadow-lg">
              -{discountPercentage}% OFF
            </Badge>
          )}
          {!product.in_stock && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <Badge variant="destructive" className="text-base px-4 py-2">Out of Stock</Badge>
            </div>
          )}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {product.category && (
            <Badge variant="secondary" className="text-xs uppercase tracking-wider">
              {product.category.name}
            </Badge>
          )}

          <div className="flex items-start justify-between gap-3">
            <h2 className="text-2xl font-black leading-tight">{product.name}</h2>
            <div className="flex items-center gap-1 shrink-0 bg-green-600 text-white px-2 py-1 rounded-lg text-sm font-bold">
              <Star className="h-3.5 w-3.5 fill-current" />
              {avgRating}
            </div>
          </div>

          {product.description && (
            <p className="text-muted-foreground leading-relaxed">{product.description}</p>
          )}

          <Separator />

          {/* Price + Add to Cart */}
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-gold">₹{discountedPrice.toFixed(0)}</span>
              {discountPercentage > 0 && (
                <span className="text-lg text-muted-foreground line-through">₹{product.price.toFixed(0)}</span>
              )}
            </div>

            {quantity === 0 ? (
              <Button
                size="lg"
                onClick={handleAdd}
                disabled={!product.in_stock}
                className="px-8 font-bold text-base rounded-xl shadow-md"
                style={{
                  background: 'linear-gradient(135deg, hsl(var(--brand-gold)) 0%, hsl(35 80% 48%) 100%)',
                  color: 'hsl(0 0% 5%)',
                }}
              >
                ADD
              </Button>
            ) : (
              <div className="flex items-center gap-0 rounded-xl border-2 border-gold overflow-hidden">
                <button onClick={handleDecrement} className="h-11 w-11 flex items-center justify-center hover:bg-muted transition-colors">
                  <Minus className="h-4 w-4" />
                </button>
                <span className="h-11 w-11 flex items-center justify-center text-lg font-bold text-gold">{quantity}</span>
                <button onClick={handleAdd} className="h-11 w-11 flex items-center justify-center hover:bg-muted transition-colors text-gold">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Reviews */}
          {reviews && reviews.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Customer Reviews</h3>
                {reviews.slice(0, 3).map((review) => (
                  <div key={review.id} className="p-3 rounded-xl bg-muted/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">{review.customer_name}</span>
                      <div className="flex items-center gap-1 text-xs text-gold">
                        {Array.from({ length: review.rating }).map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-current" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{review.review_text}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ProductDetailSheet;
