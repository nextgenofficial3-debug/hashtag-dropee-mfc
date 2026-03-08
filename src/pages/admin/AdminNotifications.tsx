import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Bell, Loader2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

const AdminNotifications: React.FC = () => {
  const { sendNotification } = usePushNotifications();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);

  const { data: history, isLoading } = useQuery({
    queryKey: ['notification-history'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('notification_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: subscriberCount } = useQuery({
    queryKey: ['subscriber-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('push_subscriptions')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error('Please fill in both title and message');
      return;
    }

    setIsSending(true);
    try {
      const result = await sendNotification(title, body);

      // Log to history
      const { data: { session } } = await supabase.auth.getSession();
      await (supabase as any).from('notification_history').insert({
        title,
        body,
        sent_by: session?.user?.id || null,
        sent_count: result?.sent || 0,
      });

      queryClient.invalidateQueries({ queryKey: ['notification-history'] });
      setTitle('');
      setBody('');
    } catch {
      toast.error('Failed to send notification');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AdminSidebar>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            Send push notifications to all subscribers
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Compose */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-gold" />
                  Compose Notification
                </CardTitle>
                <CardDescription>
                  {subscriberCount !== undefined
                    ? `${subscriberCount} active subscriber${subscriberCount !== 1 ? 's' : ''}`
                    : 'Loading subscribers...'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="notif-title">Title</Label>
                  <Input
                    id="notif-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="🔥 Weekend Special!"
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notif-body">Message</Label>
                  <Textarea
                    id="notif-body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Get 20% off on all chicken items this weekend!"
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground text-right">{body.length}/500</p>
                </div>
                <Button
                  onClick={handleSend}
                  disabled={isSending || !title.trim() || !body.trim()}
                  className="w-full"
                  size="lg"
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Send to All Subscribers
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* History */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-4 w-4" />
                  Recent History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : history && history.length > 0 ? (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {history.map((item: any) => (
                      <div key={item.id} className="p-3 rounded-lg bg-muted/50 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-sm line-clamp-1">{item.title}</p>
                          <Badge variant="secondary" className="text-[10px] shrink-0">
                            {item.sent_count} sent
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{item.body}</p>
                        <p className="text-[10px] text-muted-foreground/60">
                          {format(new Date(item.created_at), 'dd MMM yyyy, hh:mm a')}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No notifications sent yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </AdminSidebar>
  );
};

export default AdminNotifications;
