import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ShoppingCart, Phone, Bell } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useStoreSettings } from '@/hooks/useStoreSettings';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';

const Header: React.FC = () => {
  const location = useLocation();
  const { totalItems, setIsCartOpen } = useCart();
  const { data: settings } = useStoreSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { scrollY } = useScroll();
  
  const headerOpacity = useTransform(scrollY, [0, 100], [0.6, 0.92]);
  const headerBlur = useTransform(scrollY, [0, 100], [12, 24]);

  const isStorePage = location.pathname === '/' || location.pathname === '/shop';

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/shop', label: 'Shop' },
    { href: '/track-order', label: 'Track Order' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ];

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
      className="sticky top-0 z-50 w-full border-b border-border/30"
      style={{
        backgroundColor: `hsl(0 0% 4% / ${headerOpacity})`,
        backdropFilter: `blur(${headerBlur}px)`,
      }}
    >
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <motion.div
            whileHover={{ rotate: 8, scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground"
            style={{ boxShadow: '0 0 20px hsl(var(--primary) / 0.3), 0 0 40px hsl(var(--brand-gold) / 0.1)' }}
          >
            <span className="text-xl font-bold">M</span>
          </motion.div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-primary">MFC</span>
            <span className="text-xs text-muted-foreground">Makyo Fried Chicken</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link, index) => (
            <motion.div
              key={link.href}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.1, duration: 0.5 }}
            >
              <Link
                to={link.href}
                className={cn(
                  "relative text-sm font-medium transition-colors hover:text-primary py-2",
                  location.pathname === link.href ? "text-primary" : "text-muted-foreground"
                )}
              >
                {link.label}
                <motion.span
                  className="absolute bottom-0 left-0 h-0.5 bg-primary rounded-full"
                  initial={{ width: 0 }}
                  whileHover={{ width: '100%' }}
                  transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
                />
              </Link>
            </motion.div>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {/* Notification bell - links to /notifications */}
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.45 }}>
            <Link to="/notifications">
              <Button variant="ghost" size="icon" className="relative" title="Notifications">
                <Bell className="h-5 w-5 text-muted-foreground" />
              </Button>
            </Link>
          </motion.div>

          {settings && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
              <Badge variant={settings.is_open ? "default" : "destructive"} className="hidden sm:flex shadow-sm text-xs">
                {settings.is_open ? 'Open' : 'Closed'}
              </Badge>
            </motion.div>
          )}

          {isStorePage && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            >
              <Button variant="outline" size="icon" onClick={() => setIsCartOpen(true)} className="relative shadow-sm border-border/50">
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <motion.span key={totalItems} initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground shadow-lg"
                  >
                    {totalItems}
                  </motion.span>
                )}
              </Button>
            </motion.div>
          )}

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <a href={`https://wa.me/${settings?.whatsapp_primary?.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer">
              <Button variant="default" size="icon" className="bg-green-600 hover:bg-green-700 shadow-lg">
                <Phone className="h-5 w-5" />
              </Button>
            </a>
          </motion.div>

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.7 }}>
                <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>
              </motion.div>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px]">
              <nav className="flex flex-col gap-4 pt-8">
                {navLinks.map((link, index) => (
                  <motion.div key={link.href} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }}>
                    <Link to={link.href} onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium transition-colors hover:text-primary block py-2">{link.label}</Link>
                  </motion.div>
                ))}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
                  <Link to="/notifications" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium transition-colors hover:text-primary block py-2">Notifications</Link>
                </motion.div>
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
                  <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium transition-colors hover:text-primary block py-2 text-muted-foreground">Admin</Link>
                </motion.div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
