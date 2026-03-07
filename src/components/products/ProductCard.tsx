import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Product, Category } from '@/types/database';
import { useCart } from '@/contexts/CartContext';
import { useActivePromotions } from '@/hooks/usePromotions';
import ProductDetailSheet from './ProductDetailSheet';

interface ProductCardProps {
  product: Product & { category?: Category | null };
  index?: number;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, index = 0 }) => {
  const { items, addItem, updateQuantity } = useCart();
  const { data: promotions } = useActivePromotions();
  const [detailOpen, setDetailOpen] = useState(false);

  const cartItem = items.find(i => i.product.id === product.id);
  const quantity = cartItem?.quantity || 0;

  const activeDiscount = promotions?.find(
    p => p.applies_to_all || p.product_ids?.includes(product.id)
  );
  const discountPercentage = activeDiscount?.discount_percentage || 0;
  const discountedPrice = product.price * (1 - discountPercentage / 100);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.in_stock) addItem(product);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (quantity > 0) updateQuantity(product.id, quantity - 1);
  };

  const imageUrl = product.images?.[0];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ delay: index * 0.05, duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
        onClick={() => setDetailOpen(true)}
        className="group relative flex flex-row md:flex-col rounded-2xl bg-card border border-border/40 overflow-hidden shadow-sm hover:shadow-lg hover:border-border/80 transition-all duration-300 cursor-pointer active:scale-[0.98]"
      >
        {/* Image */}
        <div className="relative w-32 h-32 md:w-full md:h-48 flex-shrink-0 overflow-hidden bg-muted">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl md:text-5xl select-none bg-muted">
              🍗
            </div>
          )}

          {discountPercentage > 0 && (
            <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs font-bold shadow-md">
              -{discountPercentage}%
            </Badge>
          )}

          {!product.in_stock && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-3 md:p-4 justify-between min-w-0">
          <div>
            {product.category && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gold">
                {product.category.name}
              </span>
            )}
            <h3 className="font-bold text-sm md:text-base leading-tight line-clamp-1 mt-0.5">
              {product.name}
            </h3>
            {product.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                {product.description}
              </p>
            )}
            <p className="text-[10px] text-muted-foreground/60 mt-1 md:hidden">Tap for details</p>
          </div>

          <div className="flex items-center justify-between mt-2 gap-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-base md:text-lg font-black text-gold">
                ₹{discountedPrice.toFixed(0)}
              </span>
              {discountPercentage > 0 && (
                <span className="text-xs text-muted-foreground line-through">
                  ₹{product.price.toFixed(0)}
                </span>
              )}
            </div>

            <AnimatePresence mode="wait">
              {quantity === 0 ? (
                <motion.div key="add" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ duration: 0.2 }}>
                  <Button
                    size="sm"
                    onClick={handleAdd}
                    disabled={!product.in_stock}
                    className="h-8 px-4 text-xs font-bold uppercase tracking-wide rounded-lg shadow-md"
                    style={{
                      background: 'linear-gradient(135deg, hsl(var(--brand-gold)) 0%, hsl(35 80% 48%) 100%)',
                      color: 'hsl(0 0% 5%)',
                    }}
                  >
                    ADD
                  </Button>
                </motion.div>
              ) : (
                <motion.div key="stepper" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ duration: 0.2 }}
                  className="flex items-center gap-0 rounded-lg border border-border overflow-hidden shadow-sm"
                >
                  <button onClick={handleDecrement} className="h-8 w-8 flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground">
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <motion.span key={quantity} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="h-8 w-8 flex items-center justify-center text-sm font-bold text-gold">
                    {quantity}
                  </motion.span>
                  <button onClick={(e) => { e.stopPropagation(); if (product.in_stock) addItem(product); }} className="h-8 w-8 flex items-center justify-center hover:bg-muted transition-colors text-gold">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      <ProductDetailSheet product={product} open={detailOpen} onOpenChange={setDetailOpen} />
    </>
  );
};

export default ProductCard;
