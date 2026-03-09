import React, { useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Phone, Bell, Menu, X, Info, Download, MessageSquare, Shield } from 'lucide-react';
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
  const isMobile = useIsMobile();
  const { scrollY } = useScroll();
  const [menuOpen, setMenuOpen] = useState(false);
  
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

  const moreLinks = [
    { href: '/about', label: 'About Us', icon: Info },
    { href: '/notifications', label: 'Notifications', icon: Bell },
    { href: '/install', label: 'Install App', icon: Download },
    { href: '/contact', label: 'Contact Us', icon: MessageSquare },
    { href: '/admin', label: 'Admin Panel', icon: Shield },
  ];

  return (
    <>
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
        <div className="container flex h-14 md:h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <motion.div
              whileTap={{ scale: 0.95 }}
              className="flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-full bg-primary text-primary-foreground"
              style={{ boxShadow: '0 0 20px hsl(var(--primary) / 0.3)' }}
            >
              <span className="text-lg md:text-xl font-bold">M</span>
            </motion.div>
            <div className="flex flex-col">
              <span className="text-base md:text-lg font-bold text-primary leading-tight">MFC</span>
              <span className="text-[10px] md:text-xs text-muted-foreground leading-tight">Makyo Fried Chicken</span>
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
                  className={`relative text-sm font-medium transition-colors hover:text-primary py-2 ${
                    location.pathname === link.href ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              </motion.div>
            ))}
          </nav>

          <div className="flex items-center gap-2 md:gap-3">
            {settings && (
              <Badge variant={settings.is_open ? "default" : "destructive"} className="shadow-sm text-[10px] md:text-xs px-1.5 md:px-2.5">
                {settings.is_open ? 'Open' : 'Closed'}
              </Badge>
            )}

            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            )}

            {!isMobile && (
              <>
                <Link to="/notifications">
                  <Button variant="ghost" size="icon" className="relative" title="Notifications">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                  </Button>
                </Link>

                {isStorePage && (
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
                )}

                <a href={`https://wa.me/${settings?.whatsapp_primary?.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer">
                  <Button variant="default" size="icon" className="bg-green-600 hover:bg-green-700 shadow-lg">
                    <Phone className="h-5 w-5" />
                  </Button>
                </a>
              </>
            )}
          </div>
        </div>
      </motion.header>

      {/* Mobile slide-down menu */}
      <AnimatePresence>
        {menuOpen && isMobile && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed top-14 left-0 right-0 z-40 overflow-hidden border-b border-border/20"
            style={{
              background: 'hsl(0 0% 6% / 0.97)',
              backdropFilter: 'blur(24px) saturate(180%)',
            }}
          >
            <div className="container py-3 flex flex-col gap-1">
              {moreLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    location.pathname === link.href
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground active:bg-muted/30'
                  }`}
                >
                  <link.icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{link.label}</span>
                </Link>
              ))}

              {settings?.whatsapp_primary && (
                <a
                  href={`https://wa.me/${settings.whatsapp_primary.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-green-500 active:bg-muted/30 transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  <span className="text-sm font-medium">WhatsApp Us</span>
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop overlay */}
      <AnimatePresence>
        {menuOpen && isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-black/50"
            onClick={() => setMenuOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
