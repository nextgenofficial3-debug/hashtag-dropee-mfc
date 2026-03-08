import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Trash2, Eye, EyeOff, MessageSquare, Filter, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface Review {
  id: string;
  customer_name: string;
  rating: number;
  review_text: string;
  is_approved: boolean;
  created_at: string;
}

type FilterType = 'all' | 'visible' | 'hidden';

const getAvatarColor = (name: string) => {
  const colors = [
    'bg-red-600', 'bg-blue-600', 'bg-green-600', 'bg-purple-600',
    'bg-orange-600', 'bg-teal-600', 'bg-pink-600', 'bg-indigo-600',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const getInitials = (name: string) =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

const AdminReviews: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FilterType>('all');
  const [swipedId, setSwipedId] = useState<string | null>(null);

  const { data: reviews = [], isLoading } = useQuery<Review[]>({
    queryKey: ['admin-reviews'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const filtered = reviews.filter(r => {
    if (filter === 'visible') return r.is_approved;
    if (filter === 'hidden') return !r.is_approved;
    return true;
  });

  const stats = {
    total: reviews.length,
    visible: reviews.filter(r => r.is_approved).length,
    hidden: reviews.filter(r => !r.is_approved).length,
    avgRating: reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '0',
  };

  const toggleApproval = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from('reviews').update({ is_approved: !currentStatus }).eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: currentStatus ? 'Review hidden' : 'Review approved' });
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['approved-reviews'] });
    }
  };

  const deleteReview = async (id: string) => {
    const { error } = await supabase.from('reviews').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Review deleted' });
      setSwipedId(null);
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['approved-reviews'] });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-28 rounded-xl bg-muted/50 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl -mx-4 px-4 md:-mx-8 md:px-8 pt-1 pb-3 border-b border-border/50">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-bold flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Reviews
            </h1>
            <p className="text-xs text-muted-foreground">{stats.total} reviews · ★ {stats.avgRating} avg</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <div className="flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-1 text-green-500">
              <CheckCircle2 className="h-3 w-3" /> {stats.visible}
            </div>
            <div className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
              <Clock className="h-3 w-3" /> {stats.hidden}
            </div>
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex gap-1.5">
          {(['all', 'visible', 'hidden'] as FilterType[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                filter === f
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted'
              }`}
            >
              {f === 'all' ? `All (${stats.total})` : f === 'visible' ? `Visible (${stats.visible})` : `Hidden (${stats.hidden})`}
            </button>
          ))}
        </div>
      </div>

      {/* Review list */}
      <div className="space-y-2.5">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 text-muted-foreground text-sm"
            >
              No {filter !== 'all' ? filter : ''} reviews found
            </motion.div>
          ) : filtered.map((review) => (
            <motion.div
              key={review.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, x: -100 }}
              transition={{ duration: 0.25 }}
              className="relative overflow-hidden rounded-xl"
            >
              {/* Delete backdrop */}
              <div className="absolute inset-0 bg-destructive flex items-center justify-end pr-6 rounded-xl">
                <Trash2 className="h-5 w-5 text-destructive-foreground" />
              </div>

              {/* Card */}
              <motion.div
                drag="x"
                dragConstraints={{ left: -100, right: 0 }}
                dragElastic={0.1}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -80) {
                    setSwipedId(review.id);
                  } else {
                    setSwipedId(null);
                  }
                }}
                animate={{ x: swipedId === review.id ? -100 : 0 }}
                className="relative bg-card border border-border/50 rounded-xl p-4 cursor-grab active:cursor-grabbing"
              >
                <div className="flex gap-3">
                  {/* Avatar */}
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white text-xs font-bold ${getAvatarColor(review.customer_name)}`}>
                    {getInitials(review.customer_name)}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Name row */}
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-semibold text-sm truncate">{review.customer_name}</span>
                      <span className="text-[10px] text-muted-foreground/50 shrink-0">
                        {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    {/* Stars + status */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} className={`h-3 w-3 ${s <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/20'}`} />
                        ))}
                      </div>
                      <Badge
                        variant={review.is_approved ? 'default' : 'secondary'}
                        className="text-[9px] px-1.5 py-0 h-4 font-medium"
                      >
                        {review.is_approved ? 'Live' : 'Hidden'}
                      </Badge>
                    </div>

                    {/* Review text */}
                    <p className="text-[13px] text-muted-foreground leading-relaxed line-clamp-3">{review.review_text}</p>

                    {/* Actions */}
                    <div className="flex gap-1.5 mt-3">
                      <Button
                        size="sm"
                        variant={review.is_approved ? 'outline' : 'default'}
                        className="h-7 text-xs px-3 rounded-full"
                        onClick={() => toggleApproval(review.id, review.is_approved)}
                      >
                        {review.is_approved ? <><EyeOff className="h-3 w-3 mr-1" /> Hide</> : <><Eye className="h-3 w-3 mr-1" /> Approve</>}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs px-3 rounded-full text-destructive hover:bg-destructive/10"
                        onClick={() => deleteReview(review.id)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" /> Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Swipe delete confirm */}
              <AnimatePresence>
                {swipedId === review.id && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute right-1 top-1/2 -translate-y-1/2"
                  >
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-8 text-xs rounded-lg"
                      onClick={() => deleteReview(review.id)}
                    >
                      Delete
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminReviews;
