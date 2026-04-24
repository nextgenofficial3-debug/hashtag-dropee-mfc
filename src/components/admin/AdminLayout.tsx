import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Receipt, CalendarClock, UtensilsCrossed, ShieldCheck,
  Settings, Users, Megaphone, Tag, X, Menu as MenuIcon, ShieldAlert, ChevronRight,
  MessageSquare, Store,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Dashboard",     path: "/admin",               icon: LayoutDashboard },
  { name: "Orders",        path: "/admin/orders",         icon: Receipt },
  { name: "Reservations",  path: "/admin/reservations",   icon: CalendarClock },
  { name: "Menu",          path: "/admin/menu",           icon: UtensilsCrossed },
  { name: "Promotions",    path: "/admin/promotions",     icon: Megaphone },
  { name: "Coupons",       path: "/admin/coupons",        icon: Tag },
  { name: "Reviews",       path: "/admin/reviews",        icon: MessageSquare },
  { name: "Users",         path: "/admin/users",          icon: Users },
  { name: "Whitelist",     path: "/admin/whitelist",      icon: ShieldCheck },
  { name: "Store",         path: "/admin/store",          icon: Store },
  { name: "Settings",      path: "/admin/settings",       icon: Settings },
];

function NavLink({ item, active, onClick }: { item: typeof navItems[0]; active: boolean; onClick?: () => void }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.path}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium",
        active
          ? "bg-[#FF5A00]/10 text-[#FF5A00] font-bold border border-[#FF5A00]/20"
          : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80"
      )}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span>{item.name}</span>
      {active && <ChevronRight className="w-3 h-3 ml-auto text-[#FF5A00]" />}
    </Link>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const currentPath = location.pathname;

  return (
    <div className="flex bg-zinc-950 min-h-screen text-zinc-50">

      {/* ───── Mobile Drawer ───── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          {/* Drawer panel */}
          <aside className="absolute inset-y-0 left-0 w-72 bg-zinc-900 border-r border-zinc-800 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-zinc-800">
              <div className="flex items-center gap-2 text-[#FF5A00] font-extrabold text-lg">
                <ShieldAlert className="w-5 h-5" /> Admin Center
              </div>
              <button onClick={() => setDrawerOpen(false)} className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.name}
                  item={item}
                  active={currentPath === item.path}
                  onClick={() => setDrawerOpen(false)}
                />
              ))}
            </nav>
            <div className="p-4 border-t border-zinc-800">
              <Link
                to="/"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center justify-center gap-2 w-full p-3 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all text-sm font-semibold"
              >
                ← Client View
              </Link>
            </div>
          </aside>
        </div>
      )}

      {/* ───── Desktop Sidebar ───── */}
      <aside className="hidden md:flex w-64 bg-zinc-900 border-r border-zinc-800 min-h-screen flex-col shrink-0">
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center gap-2 text-[#FF5A00] font-extrabold text-xl">
            <ShieldAlert className="w-6 h-6" /> Admin Center
          </div>
          <p className="text-zinc-500 text-xs mt-1">MFC Animation Studio</p>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 py-4">
          {navItems.map((item) => (
            <NavLink key={item.name} item={item} active={currentPath === item.path} />
          ))}
        </nav>
        <div className="p-4 border-t border-zinc-800">
          <Link
            to="/"
            className="flex items-center justify-center gap-2 w-full p-3 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all text-sm font-semibold"
          >
            ← Client View
          </Link>
        </div>
      </aside>

      {/* ───── Main Area ───── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Top Bar */}
        <header className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <MenuIcon className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-[#FF5A00] font-extrabold text-base">
            <ShieldAlert className="w-4 h-4" />
            {navItems.find((n) => n.path === currentPath)?.name ?? "Admin"}
          </div>
          <div className="w-9" />{/* spacer */}
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
