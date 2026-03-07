import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useCart } from '@/contexts/CartContext';
import { useActivePromotions } from '@/hooks/usePromotions';
import { Separator } from '@/components/ui/separator';
import { Link } from 'react-router-dom';

// Animated counter component for rolling number effect
const AnimatedNumber: React.FC<{ value: number; prefix?: string }> = ({ value, prefix = '' }) => {
  const [displayValue, setDisplayValue] = useState(value);
  
  useEffect(() => {
    const timer = setTimeout(() => setDisplayValue(value), 50);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <motion.span
      key={value}
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
    >
      {prefix}{displayValue.toFixed(2)}
    </motion.span>
  );
};

const CartSidebar: React.FC = () => {
  const { items, isCartOpen, setIsCartOpen, removeItem, updateQuantity, subtotal } = useCart();
  const { data: promotions } = useActivePromotions();

  // Calculate discount
  const activeDiscount = promotions?.find(p => p.applies_to_all && p.discount_percentage > 0);
  const discountPercentage = activeDiscount?.discount_percentage || 0;
  const discountAmount = (subtotal * discountPercentage) / 100;
  const total = subtotal - discountAmount;

  return (
    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
      <SheetContent 
        className="flex w-full flex-col sm:max-w-md overflow-hidden"
        style={{
          background: 'hsl(var(--background))',
        }}
      >
        {/* Backdrop blur overlay when open */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isCartOpen ? 1 : 0 }}
          className="absolute inset-0 backdrop-blur-sm pointer-events-none"
        />
        
        <SheetHeader className="relative z-10">
          <SheetTitle className="flex items-center gap-2">
            <motion.div
              animate={items.length > 0 ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              <ShoppingBag className="h-5 w-5" />
            </motion.div>
            Your Cart
            {items.length > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="ml-2 text-sm text-muted-foreground"
              >
                ({items.reduce((acc, item) => acc + item.quantity, 0)} items)
              </motion.span>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4 relative z-10">
          <AnimatePresence mode="popLayout">
            {items.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 30, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
                className="flex h-full flex-col items-center justify-center text-center"
              >
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <ShoppingBag className="h-20 w-20 text-muted-foreground/20 mb-4" />
                </motion.div>
                <p className="text-muted-foreground text-lg">Your cart is empty</p>
                <p className="text-sm text-muted-foreground/60 mt-1">Add some delicious items!</p>
                <Button
                  variant="link"
                  onClick={() => setIsCartOpen(false)}
                  className="mt-4 group"
                >
                  Continue Shopping
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {items.map((item, index) => (
                  <motion.div
                    key={item.product.id}
                    layout
                    initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, x: -100, filter: 'blur(4px)' }}
                    transition={{ 
                      duration: 0.5, 
                      delay: index * 0.05,
                      ease: [0.19, 1, 0.22, 1] 
                    }}
                    className="flex gap-4 rounded-xl border bg-card p-3 shadow-sm hover:shadow-md transition-shadow duration-500"
                  >
                    <motion.div 
                      className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-muted"
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.3 }}
                    >
                      {item.product.images?.[0] ? (
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-3xl">
                          🍗
                        </div>
                      )}
                    </motion.div>

                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <h4 className="font-medium line-clamp-1">{item.product.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          ₹{item.product.price.toFixed(2)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <motion.div
                            whileHover={{ rotate: -10 }}
                            whileTap={{ scale: 0.9 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-full"
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                          </motion.div>
                          
                          <motion.span 
                            key={item.quantity}
                            initial={{ scale: 1.2, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-10 text-center font-semibold"
                          >
                            {item.quantity}
                          </motion.span>
                          
                          <motion.div
                            whileHover={{ rotate: 10 }}
                            whileTap={{ scale: 0.9 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-full"
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </motion.div>
                        </div>

                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => removeItem(item.product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>

        {items.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
            className="border-t pt-4 space-y-4 relative z-10"
          >
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <AnimatedNumber value={subtotal} prefix="₹" />
              </div>
              
              <AnimatePresence>
                {discountPercentage > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex justify-between text-green-600"
                  >
                    <span>Discount ({discountPercentage}%)</span>
                    <AnimatedNumber value={discountAmount} prefix="-₹" />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex justify-between text-muted-foreground">
                <span>📦 Packaging</span>
                <span>₹60</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>🚚 Delivery</span>
                <span className="text-xs text-right">calculated at checkout</span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between text-lg font-semibold">
                <span>Subtotal</span>
                <AnimatedNumber value={total + 60} prefix="₹" />
              </div>
              <p className="text-xs text-muted-foreground">+ delivery fee at checkout</p>
            </div>

            <Link to="/checkout" onClick={() => setIsCartOpen(false)}>
              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                transition={{ duration: 0.2 }}
              >
                <Button 
                  className="w-full group shadow-brand animate-pulse-glow" 
                  size="lg"
                >
                  Proceed to Checkout
                  <motion.span
                    className="ml-2"
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </motion.span>
                </Button>
              </motion.div>
            </Link>
          </motion.div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartSidebar;
