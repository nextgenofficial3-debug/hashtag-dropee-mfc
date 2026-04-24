import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, ShoppingBag, ShoppingCart, User, Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";

export default function BottomNavigation() {
  const location = useLocation();
  const { user } = useAuth();
  const { unreadCount } = useNotifications(user?.id);

  const navItems = [
    { name: "Home", path: "/", icon: Home },
    { name: "Products", path: "/shop", icon: ShoppingBag },
    { name: "Cart", path: "/cart", icon: ShoppingCart },
    { name: "Notifications", path: "/notifications", icon: Bell },
    { name: "Profile", path: "/profile", icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t border-border pb-safe">
      <nav className="max-w-md mx-auto px-6 h-16 flex items-center justify-between">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.name} 
              to={item.path}
              className={`flex flex-col items-center justify-center w-14 transition-all duration-300 ${
                isActive ? "text-primary scale-110" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className={`relative p-2 rounded-xl transition-all duration-300 ${isActive ? 'bg-primary/10' : ''}`}>
                <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                {item.name === "Cart" && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-background"></span>
                )}
                {item.name === "Notifications" && unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-background"></span>
                )}
              </div>
              <span className={`text-[10px] font-medium leading-none mt-1 ${isActive ? "font-bold" : ""}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
