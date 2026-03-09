import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Clock, MapPin, Phone, Download } from 'lucide-react';
import { useActivePromotions } from '@/hooks/usePromotions';
import { useStoreSettings } from '@/hooks/useStoreSettings';
import { useSiteContent } from '@/hooks/useSiteContent';
import { Link } from 'react-router-dom';

const wordReveal = {
  hidden: { opacity: 0, y: 30, filter: 'blur(8px)' },
  visible: (i: number) => ({
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { delay: 0.6 + i * 0.15, duration: 0.8, ease: [0.19, 1, 0.22, 1] as const },
  }),
};

const stats = [
  { value: '2000+', label: 'Customers Served' },
  { value: '5+', label: 'Years Running' },
  { value: '4.8', label: 'Average Rating' },
];

const HeroSection: React.FC = () => {
  const { data: promotions } = useActivePromotions();
  const { data: settings } = useStoreSettings();
  const { data: contactContent } = useSiteContent('contact');
  const { scrollYProgress } = useScroll();
  
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, 80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0.6]);

  const activePromo = promotions?.[0];

  const scrollToMenu = () => {
    document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
  };

  const headlineWords = ["Ukhrul's", "Crispiest", "Fried", "Chicken"];

  return (
    <motion.section 
      style={{ y: heroY, opacity: heroOpacity }}
      className="relative min-h-[92vh] flex items-center overflow-hidden"
    >
      {/* Deep cinematic gradient */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(160deg, hsl(0 50% 10%) 0%, hsl(0 20% 5%) 50%, hsl(0 0% 4%) 100%)',
      }} />

      {/* Warm golden light bloom */}
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.3, 0.15] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[800px] rounded-full"
        style={{
          background: 'radial-gradient(ellipse, hsl(40 80% 50% / 0.08) 0%, hsl(0 60% 30% / 0.05) 40%, transparent 70%)',
          filter: 'blur(100px)',
        }}
      />

      {/* Subtle crimson pulse */}
      <motion.div
        animate={{ scale: [1, 1.08, 1], opacity: [0.2, 0.35, 0.2] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute right-0 top-0 w-[600px] h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(0 70% 25% / 0.3) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      {/* Rising steam particles */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={`steam-${i}`}
          animate={{
            y: [0, -250],
            opacity: [0, 0.08, 0],
            scale: [0.8, 2.5],
          }}
          transition={{
            duration: 8 + i * 2,
            repeat: Infinity,
            delay: i * 2,
            ease: 'easeOut',
          }}
          className="absolute w-40 h-56 rounded-full"
          style={{
            left: `${15 + i * 22}%`,
            bottom: '5%',
            background: 'radial-gradient(ellipse, hsl(30 20% 90% / 0.06) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
      ))}

      <div className="container relative z-10 py-20 md:py-28">
        <div className="max-w-3xl space-y-8">
          {/* Live open/close badge */}
          {settings && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
            >
              <Badge
                variant={settings.is_open ? "default" : "destructive"}
                className="text-sm py-2 px-5 shadow-lg gap-2"
              >
                {settings.is_open && (
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                  </span>
                )}
                <Clock className="h-3.5 w-3.5" />
                {settings.is_open ? 'We are Open!' : 'Currently Closed'}
                {settings.use_scheduled_hours && settings.is_open && (
                  <span className="ml-1 opacity-75">Until {settings.closing_time}</span>
                )}
              </Badge>
            </motion.div>
          )}

          {/* Promo badge */}
          {activePromo && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium backdrop-blur-sm border text-foreground"
              style={{
                background: 'hsl(var(--brand-gold) / 0.1)',
                borderColor: 'hsl(var(--brand-gold) / 0.3)',
              }}
            >
              <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>🔥</motion.span>
              <span className="text-gold">{activePromo.title} - {activePromo.discount_percentage}% OFF!</span>
            </motion.div>
          )}

          {/* Headline - word-by-word reveal */}
          <h1 className="text-5xl md:text-6xl lg:text-8xl font-black tracking-tight leading-[0.95]">
            {headlineWords.map((word, i) => (
              <motion.span
                key={word}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={wordReveal}
                className={`inline-block mr-4 ${
                  i >= 2 ? 'text-primary drop-shadow-[0_0_40px_hsl(0_70%_40%/0.5)]' : 'text-foreground'
                }`}
              >
                {word}
              </motion.span>
            ))}
          </h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
            className="text-lg md:text-xl text-muted-foreground max-w-lg"
          >
            Handcrafted daily. Loved by thousands. Experience the perfect crunch at Viewland Zone II.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8, duration: 0.8 }}
            className="flex flex-wrap gap-4"
          >
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                size="lg"
                onClick={scrollToMenu}
                className="text-base px-8 py-6 font-bold shadow-gold-glow"
                style={{
                  background: 'linear-gradient(135deg, hsl(var(--brand-gold)) 0%, hsl(35 80% 48%) 100%)',
                  color: 'hsl(0 0% 5%)',
                }}
              >
                Order Now
                <motion.span
                  className="ml-2"
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className="h-5 w-5" />
                </motion.span>
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <a
                href="https://maps.google.com/?q=Viewland+Zone+II+Ukhrul"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="lg" variant="outline" className="text-base px-8 py-6 border-border/50 text-foreground hover:border-foreground/30">
                  <MapPin className="h-5 w-5 mr-2" />
                  Get Directions
                </Button>
              </a>
            </motion.div>

            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <a href={`tel:${settings?.whatsapp_primary?.replace(/[^0-9+]/g, '')}`}>
                <Button size="lg" className="text-base px-8 py-6 bg-green-600 hover:bg-green-700 text-white">
                  <Phone className="h-5 w-5 mr-2" />
                  Call Now
                </Button>
              </a>
            </motion.div>

            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link to="/install">
                <Button size="lg" variant="outline" className="text-base px-8 py-6 border-border/50 text-foreground hover:border-foreground/30">
                  <Download className="h-5 w-5 mr-2" />
                  Download App
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Animated Stats Strip */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.2, duration: 0.8 }}
            className="flex flex-wrap gap-8 pt-8 border-t border-border/30"
          >
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.4 + i * 0.15, duration: 0.6 }}
                className="text-center"
              >
                <div className="text-2xl md:text-3xl font-black text-gold">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
};

export default HeroSection;
