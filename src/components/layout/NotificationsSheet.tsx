import React from "react";
import { Bell, BellOff, CheckCheck, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { AppNotification } from "@/hooks/useNotifications";

interface NotificationsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const typeStyles: Record<string, { bg: string; dot: string }> = {
  order: { bg: "bg-blue-500/10", dot: "bg-blue-500" },
  promo: { bg: "bg-amber-500/10", dot: "bg-amber-500" },
  system: { bg: "bg-violet-500/10", dot: "bg-violet-500" },
  default: { bg: "bg-primary/10", dot: "bg-primary" },
};

function getTypeStyle(type: string | null) {
  return typeStyles[type ?? "default"] ?? typeStyles.default;
}

export function NotificationsSheet({
  open,
  onOpenChange,
  notifications,
  unreadCount,
  loading,
  onMarkRead,
  onMarkAllRead,
}: NotificationsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-sm p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="px-4 pt-5 pb-3 border-b border-border/60 flex-row items-center justify-between space-y-0">
          <SheetTitle className="text-lg font-extrabold flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Notifications
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </SheetTitle>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground h-8 px-2"
                onClick={onMarkAllRead}
              >
                <CheckCheck className="w-3.5 h-3.5 mr-1" />
                Mark all read
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8"
              onClick={() => onOpenChange(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </SheetHeader>

        {/* Body */}
        <ScrollArea className="flex-1">
          {loading ? (
            <div className="space-y-3 p-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 p-3 rounded-2xl bg-muted/30 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-muted shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-full" />
                    <div className="h-2 bg-muted rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <BellOff className="w-7 h-7 text-muted-foreground/50" />
              </div>
              <p className="font-semibold text-foreground">All caught up!</p>
              <p className="text-sm text-muted-foreground mt-1">
                No notifications yet. We'll let you know when something happens.
              </p>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {notifications.map((n) => {
                const style = getTypeStyle(n.type);
                return (
                  <div
                    key={n.id}
                    className={`relative flex gap-3 p-3 rounded-2xl transition-all duration-200 cursor-pointer
                      ${n.is_read ? "bg-muted/20 hover:bg-muted/40" : `${style.bg} hover:brightness-105`}
                      border ${n.is_read ? "border-transparent" : "border-primary/10"}`}
                    onClick={() => !n.is_read && onMarkRead(n.id)}
                  >
                    {/* Type dot / icon */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${style.bg}`}
                    >
                      <span className={`w-3 h-3 rounded-full ${style.dot}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-sm font-semibold leading-snug ${
                            n.is_read ? "text-muted-foreground" : "text-foreground"
                          }`}
                        >
                          {n.title}
                        </p>
                        {!n.is_read && (
                          <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />
                        )}
                      </div>
                      {n.message && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {n.message}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground/60 mt-1.5">
                        {timeAgo(n.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
