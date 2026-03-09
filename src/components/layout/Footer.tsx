import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { MapPin, Phone, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStoreSettings } from '@/hooks/useStoreSettings';
import { useCart } from '@/contexts/CartContext';

const Footer: React.FC = () => {
  const { data: settings } = useStoreSettings();
  const { setIsCartOpen } = useCart();
  const { scrollYProgress } = useScroll();
  const footerY = useTransform(scrollYProgress, [0.8, 1], [50, 0]);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <motion.footer
      className="border-t border-border/30 relative overflow-hidden"
      style={{ y: footerY, background: 'linear-gradient(180deg, hsl(0 0% 4%) 0%, hsl(0 15% 4%) 100%)' }}
    >
      {/* Pre-footer CTA Section */}
      <div className="relative overflow-hidden border-b border-border/20">
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full"
            style={{
              background: 'radial-gradient(ellipse, hsl(var(--brand-gold) / 0.06) 0%, transparent 70%)',
              filter: 'blur(80px)',
            }}
          />
        </div>
        <div className="container py-16 relative z-10 text-center space-y-6">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-3xl md:text-5xl font-black text-foreground"
          >
            Ready to <span className="text-gradient-gold">Order?</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.8 }}
            className="text-muted-foreground max-w-md mx-auto"
          >
            Crispy, juicy chicken is just a tap away. Order now or call us directly.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="flex flex-wrap gap-4 justify-center"
          >
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                size="lg"
                onClick={() => setIsCartOpen(true)}
                className="text-base px-8 py-6 font-bold shadow-gold-glow"
                style={{
                  background: 'linear-gradient(135deg, hsl(var(--brand-gold)) 0%, hsl(35 80% 48%) 100%)',
                  color: 'hsl(0 0% 5%)',
                }}
              >
                Order Now
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <a href={`tel:${settings?.whatsapp_primary?.replace(/[^0-9+]/g, '')}`}>
                <Button size="lg" variant="outline" className="text-base px-8 py-6 border-border/50">
                  <Phone className="h-5 w-5 mr-2" />
                  Call Now
                </Button>
              </a>
            </motion.div>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-sm text-muted-foreground flex items-center justify-center gap-1"
          >
            <MapPin className="h-3.5 w-3.5" /> Viewland Zone II, Ukhrul
          </motion.p>
        </div>
      </div>

      {/* Ambient glow */}
      <div className="absolute bottom-0 left-0 right-0 h-64 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute -left-32 -bottom-32 w-64 h-64 rounded-full"
          style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)', filter: 'blur(60px)' }}
        />
      </div>

      <div className="container py-12 relative z-10">
        {/* Gold divider */}
        <div className="h-px mb-12 mx-auto max-w-xs" style={{ background: 'linear-gradient(to right, transparent, hsl(var(--brand-gold) / 0.3), transparent)' }} />

        <div className="grid gap-8 md:grid-cols-3">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-crimson-glow">
                <span className="text-xl font-bold">M</span>
              </div>
              <div>
                <span className="text-lg font-bold text-primary">MFC</span>
                <p className="text-xs text-muted-foreground">Makyo Fried Chicken</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Crispy, juicy, and full of flavor! Your favorite fried chicken, made with love.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
            <h3 className="mb-4 font-semibold text-foreground">Contact Us</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-primary" />
                <span>Viewland Zone II</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <div className="flex flex-col">
                  <a href={`tel:${settings?.whatsapp_primary}`} className="hover:text-primary transition-colors">{settings?.whatsapp_primary || '+91 97740 46387'}</a>
                  <a href={`tel:${settings?.whatsapp_secondary}`} className="hover:text-primary transition-colors">{settings?.whatsapp_secondary || '+91 9366372647'}</a>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
            <h3 className="mb-4 font-semibold text-foreground">Hours</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>{settings?.opening_time || '09:00'} - {settings?.closing_time || '21:00'}</span>
              </div>
              {settings?.open_days && (
                <div className="flex gap-1.5 flex-wrap">
                  {dayNames.map((day, index) => (
                    <span
                      key={day}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                        settings.open_days.includes(index)
                          ? 'bg-primary/20 text-primary'
                          : 'bg-card text-muted-foreground/40'
                      }`}
                    >
                      {day}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        <div className="mt-10 pt-8 pb-20 md:pb-0 border-t border-border/20 text-center text-sm text-muted-foreground/50 space-y-2">
          <p>© 2026 MFC - Makyo Fried Chicken. All rights reserved.</p>
          <p className="text-xs opacity-70">Developed By Jihal Shimray eX Holdings PVT LTD.</p>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;
