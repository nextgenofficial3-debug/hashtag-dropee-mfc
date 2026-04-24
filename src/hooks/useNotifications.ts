import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string | null;
  type: string;
  is_read: boolean | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        const list = (data as AppNotification[]) || [];
        setNotifications(list);
        setUnreadCount(list.filter((n) => !n.is_read).length);
        setLoading(false);
      });

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          const newNote = payload.new as AppNotification;
          setNotifications((prev) => [newNote, ...prev]);
          setUnreadCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    if (!userId) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", userId);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  return { notifications, unreadCount, loading, markRead, markAllRead };
}
