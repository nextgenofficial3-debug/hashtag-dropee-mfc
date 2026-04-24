import { Bell, BellOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";

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

export default function NotificationsPage() {
  const { user } = useAuth();
  const { notifications, unreadCount, loading, markRead, markAllRead } = useNotifications(user?.id);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8 pt-24 text-center">
        <div>
          <Bell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-base font-bold text-foreground">Sign in to view notifications</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 pt-20">
      <div className="px-4 mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead()}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="px-4 space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-2xl bg-secondary/50 animate-pulse" />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="px-4 py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <BellOff className="w-7 h-7 text-muted-foreground/50" />
          </div>
          <p className="text-base font-bold text-foreground">All caught up!</p>
          <p className="text-sm text-muted-foreground mt-2">
            No notifications yet. We'll let you know when something happens.
          </p>
        </div>
      ) : (
        <div className="px-4 space-y-2">
          {notifications.map((n) => {
            const style = getTypeStyle(n.type);
            return (
              <div
                key={n.id}
                className={`relative flex gap-3 p-4 rounded-2xl transition-all duration-200 cursor-pointer
                  ${n.is_read ? "bg-muted/20 hover:bg-muted/40" : `${style.bg} hover:brightness-105`}
                  border ${n.is_read ? "border-transparent" : "border-primary/10"}`}
                onClick={() => !n.is_read && markRead(n.id)}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${style.bg}`}>
                  <span className={`w-3 h-3 rounded-full ${style.dot}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold leading-snug ${n.is_read ? "text-muted-foreground" : "text-foreground"}`}>
                      {n.title}
                    </p>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />
                    )}
                  </div>
                  {n.message && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
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
    </div>
  );
}