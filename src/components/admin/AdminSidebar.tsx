import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Package,
  Tag,
  Settings,
  Store,
  LogOut,
  Menu,
  X,
  FileText,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAdmin } from '@/contexts/AdminContext';
import { cn } from '@/lib/utils';

interface AdminSidebarProps {
  children: React.ReactNode;
}

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/promotions', label: 'Promotions', icon: Tag },
  { href: '/admin/orders', label: 'Orders', icon: Package },
  { href: '/admin/reviews', label: 'Reviews', icon: Star },
  { href: '/admin/content', label: 'Site Content', icon: FileText },
  { href: '/admin/settings', label: 'Store Settings', icon: Settings },
];

const AdminSidebar: React.FC<AdminSidebarProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAdmin();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/admin');
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2 border-b p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <span className="text-xl font-bold">M</span>
        </div>
        <div>
          <span className="font-bold text-primary">MFC Admin</span>
          <p className="text-xs text-muted-foreground">Dashboard</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              location.pathname === item.href
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t p-4 space-y-2">
        <Link to="/" onClick={() => setMobileOpen(false)}>
          <Button variant="outline" className="w-full justify-start gap-2">
            <Store className="h-4 w-4" />
            View Store
          </Button>
        </Link>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-destructive hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 border-r bg-background md:block">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4 md:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SidebarContent />
          </SheetContent>
        </Sheet>
        <span className="font-bold">MFC Admin</span>
      </header>

      {/* Main Content */}
      <main className="md:pl-64">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 md:p-8"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
};

export default AdminSidebar;
