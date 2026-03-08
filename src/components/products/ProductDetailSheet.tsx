import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, X, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Product, Category } from '@/types/database';
import { useCart } from '@/contexts/CartContext';
import { useActivePromotions } from '@/hooks/usePromotions';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';

interface ProductDetailSheetProps {
  product: (Product & { category?: Category | null }) | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProductDetailSheet: React.FC<ProductDetailSheetProps> = ({ product, open, onOpenChange }) => {
  const { items, addItem, updateQuantity } = useCart();
  const { data: promotions } = useActivePromotions();
  const [currentImage, setCurrentImage] = useState(0);

  const { data: reviews } = useQuery({
    queryKey: ['product-reviews'],
    queryFn: async () => {
      const { data } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  if (!product) return null;

  const images = product.images && product.images.length > 0 ? product.images : [];
  const hasMultipleImages = images.length > 1;

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

  const nextImage = () => setCurrentImage(prev => (prev + 1) % images.length);
  const prevImage = () => setCurrentImage(prev => (prev - 1 + images.length) % images.length);

  return (
    <Sheet open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setCurrentImage(0); }}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto p-0" hideClose>
        <VisuallyHidden.Root>
          <SheetTitle>{product.name}</SheetTitle>
        </VisuallyHidden.Root>

        {/* Product Image Carousel */}
        <div className="relative w-full h-56 sm:h-72 bg-muted overflow-hidden">
          {images.length > 0 ? (
            <>
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentImage}
                  src={images[currentImage]}
                  alt={`${product.name} - ${currentImage + 1}`}
                  className="h-full w-full object-cover"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                />
              </AnimatePresence>

              {hasMultipleImages && (
                <>
                  <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/70 backdrop-blur-sm flex items-center justify-center shadow-md">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/70 backdrop-blur-sm flex items-center justify-center shadow-md">
                    <ChevronRight className="h-4 w-4" />
                  </button>

                  {/* Dots */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentImage(i)}
                        className={`h-2 rounded-full transition-all duration-300 ${i === currentImage ? 'w-5 bg-primary' : 'w-2 bg-foreground/30'}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
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

        {/* Thumbnail strip */}
        {hasMultipleImages && (
          <div className="flex gap-2 px-5 pt-3 overflow-x-auto scrollbar-hide">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setCurrentImage(i)}
                className={`h-14 w-14 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all duration-200 ${i === currentImage ? 'border-primary ring-1 ring-primary/30' : 'border-transparent opacity-60 hover:opacity-100'}`}
              >
                <img src={img} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}

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
