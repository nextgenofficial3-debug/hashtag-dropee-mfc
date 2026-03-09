import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Phone, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStoreSettings } from '@/hooks/useStoreSettings';
import { useCart } from '@/contexts/CartContext';
import { useIsMobile } from '@/hooks/use-mobile';

const MobileOrderBar: React.FC = () => {
  const isMobile = useIsMobile();
  const { data: settings } = useStoreSettings();
  const { setIsCartOpen, totalItems } = useCart();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isMobile) return null;

  const whatsappUrl = `https://wa.me/${(settings?.whatsapp_primary || '').replace(/[^0-9]/g, '')}?text=Hi! I'd like to place an order.`;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
          className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
          style={{
            background: 'hsl(0 0% 6% / 0.92)',
            backdropFilter: 'blur(24px) saturate(180%)',
            borderTop: '1px solid hsl(0 0% 100% / 0.08)',
            paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
            paddingTop: '0.75rem',
            paddingLeft: 'max(0.75rem, env(safe-area-inset-left))',
            paddingRight: 'max(0.75rem, env(safe-area-inset-right))',
          }}
        >
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsCartOpen(true)}
              className="flex-1 font-bold py-5 relative"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--brand-gold)) 0%, hsl(35 80% 48%) 100%)',
                color: 'hsl(0 0% 5%)',
              }}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Order Now
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Button>

            <a href={`tel:${settings?.whatsapp_primary?.replace(/[^0-9+]/g, '')}`}>
              <Button size="icon" variant="outline" className="h-11 w-11 border-border/50">
                <Phone className="h-5 w-5" />
              </Button>
            </a>

            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <Button size="icon" className="h-11 w-11 bg-green-600 hover:bg-green-700">
                <MessageCircle className="h-5 w-5" />
              </Button>
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileOrderBar;
