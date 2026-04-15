import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Receipt, CalendarClock, Settings, Menu, ShieldAlert, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    { name: "Dashboard", path: "/admin", icon: LayoutDashboard },
    { name: "Orders", path: "/admin/orders", icon: Receipt },
    { name: "Reservations", path: "/admin/reservations", icon: CalendarClock },
    { name: "Menu", path: "/admin/menu", icon: Menu },
    { name: "Whitelist", path: "/admin/whitelist", icon: ShieldCheck },
    { name: "Settings", path: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="flex bg-zinc-950 min-h-screen text-zinc-50 flex-col md:flex-row">
      {/* Mobile Header (Sidebar Toggle etc. could go here) */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900">
        <div className="flex items-center gap-2 text-primary font-bold">
           <ShieldAlert className="w-5 h-5" /> Admin
        </div>
      </div>

      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-zinc-900 border-r border-zinc-800 md:min-h-screen shrink-0 hidden md:block">
        <div className="p-6">
          <div className="flex items-center gap-2 text-primary font-bold text-xl">
             <ShieldAlert className="w-6 h-6" /> Admin Center
          </div>
        </div>
        <nav className="space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = currentPath === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors",
                  isActive ? "bg-primary/10 text-primary font-bold" : "text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800"
                )}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>
        
        {/* Helper to back to client */}
        <div className="absolute bottom-6 left-6 right-6">
           <Link to="/" className="flex items-center justify-center gap-2 w-full p-3 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all text-sm font-semibold">
              ← Client View
           </Link>
        </div>
      </aside>

      {/* Mobile nav links bottom if needed or wrap inside a drawer. Since it's an admin panel, assuming mostly desktop usage or simple fluid layout */}
      <div className="md:hidden flex overflow-x-auto p-4 gap-2 border-b border-zinc-800 bg-zinc-900 scrollbar-hide">
         {navItems.map((item) => {
            const isActive = currentPath === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "flex items-center whitespace-nowrap gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                  isActive ? "bg-primary/10 text-primary font-bold" : "bg-zinc-800 text-zinc-400"
                )}
              >
                {item.name}
              </Link>
            )
          })}
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
