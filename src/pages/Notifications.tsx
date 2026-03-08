import React from 'react';
import { motion } from 'framer-motion';
import { Bell, Tag, Truck, Megaphone } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { formatDistanceToNow } from 'date-fns';

const typeConfig: Record<string, { icon: React.ElementType; color: string }> = {
  promo: { icon: Tag, color: 'text-gold' },
  order: { icon: Truck, color: 'text-primary' },
  announcement: { icon: Megaphone, color: 'text-blue-400' },
};

const Notifications: React.FC = () => {
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['user_notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_notifications' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as unknown as { id: string; title: string; body: string; type: string; created_at: string }[];
    },
  });

  // Track last viewed time in localStorage
  const lastViewed = localStorage.getItem('notif_last_viewed');
  React.useEffect(() => {
    localStorage.setItem('notif_last_viewed', new Date().toISOString());
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="container max-w-lg">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-6">
              <Bell className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Notifications</h1>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-xl" />
                ))}
              </div>
            ) : !notifications || notifications.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">🔔</div>
                <p className="text-muted-foreground">No notifications yet</p>
                <p className="text-xs text-muted-foreground mt-1">We'll notify you about offers and order updates</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notif, i) => {
                  const cfg = typeConfig[notif.type] || typeConfig.promo;
                  const Icon = cfg.icon;
                  const isNew = lastViewed ? new Date(notif.created_at) > new Date(lastViewed) : true;
                  return (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <Card className={`transition-colors ${isNew ? 'border-primary/30 bg-primary/5' : ''}`}>
                        <CardContent className="p-4 flex gap-3">
                          <div className={`h-9 w-9 rounded-full flex items-center justify-center bg-muted flex-shrink-0 ${cfg.color}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-sm line-clamp-1">{notif.title}</h3>
                              {isNew && <Badge className="text-[9px] px-1.5 py-0 bg-primary">NEW</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.body}</p>
                            <p className="text-[10px] text-muted-foreground mt-1.5">
                              {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Notifications;
