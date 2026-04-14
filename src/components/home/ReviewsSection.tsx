import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Star, Send, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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

const getAvatarColor = (name: string) => {
  const colors = [
    'bg-red-600', 'bg-blue-600', 'bg-green-600', 'bg-purple-600',
    'bg-orange-600', 'bg-teal-600', 'bg-pink-600', 'bg-indigo-600',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const StarRating: React.FC<{ rating: number; onRate?: (r: number) => void; interactive?: boolean; size?: string }> = ({ 
  rating, onRate, interactive = false, size = 'h-5 w-5' 
}) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <motion.button
          key={star}
          type="button"
          onClick={() => interactive && onRate?.(star)}
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => interactive && setHover(0)}
          whileHover={interactive ? { scale: 1.2 } : {}}
          whileTap={interactive ? { scale: 0.9 } : {}}
          className={interactive ? 'cursor-pointer' : 'cursor-default'}
          disabled={!interactive}
        >
          <Star
            className={`${size} transition-colors duration-200 ${
              star <= (hover || rating)
                ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]'
                : 'text-muted-foreground/20'
            }`}
            fill={star <= (hover || rating) ? 'currentColor' : 'none'}
          />
        </motion.button>
      ))}
    </div>
  );
};

const ReviewCard: React.FC<{ review: Review; index: number }> = ({ review, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.08, duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
    whileHover={{ y: -4 }}
    className="rounded-xl border border-border/50 bg-card p-5 sm:p-6 transition-all duration-500 w-[85vw] sm:w-[320px] md:min-w-[300px] md:max-w-[380px] flex-shrink-0 snap-center hover:border-[hsl(var(--brand-gold)/0.2)]"
    style={{
      boxShadow: '0 4px 20px -4px hsl(0 0% 0% / 0.3)',
    }}
  >
    <Quote className="h-5 w-5 text-gold/20 mb-2" />
    <p className="text-sm text-muted-foreground leading-relaxed mb-4 italic">&ldquo;{review.review_text}&rdquo;</p>
    <div className="flex items-center gap-3">
      <div className={`flex h-9 w-9 items-center justify-center rounded-full text-white text-xs font-bold ${getAvatarColor(review.customer_name)}`}>
        {getInitials(review.customer_name)}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-sm truncate">{review.customer_name}</h4>
        <div className="flex items-center gap-2 mt-0.5">
          <StarRating rating={review.rating} size="h-3 w-3" />
          <span className="text-[11px] text-muted-foreground/40">{new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        </div>
      </div>
    </div>
  </motion.div>
);

const ReviewsSection: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: reviews = [] } = useQuery<Review[]>({
    queryKey: ['approved-reviews'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mfc_reviews')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const avgRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  }, [reviews]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !reviewText.trim() || rating === 0) {
      toast({ title: 'Please fill all fields', description: 'Name, rating, and review are required.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('mfc_reviews').insert({
        customer_name: name.trim(),
        rating,
        review_text: reviewText.trim(),
      });
      if (error) throw error;
      toast({ title: `Thanks ${name.trim()}! 🍗`, description: 'Your review is now live!' });
      setName(''); setRating(0); setReviewText('');
      queryClient.invalidateQueries({ queryKey: ['approved-reviews'] });
    } catch {
      toast({ title: 'Error', description: 'Failed to submit review.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-12 sm:py-20 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.03]" style={{
          background: 'radial-gradient(circle, hsl(var(--brand-gold)) 0%, transparent 70%)',
          filter: 'blur(100px)',
        }} />
      </div>

      <div className="container relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8 sm:mb-12"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">
            What Our <span className="text-gradient-gold">Customers</span> Say
          </h2>
          {reviews.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-center gap-3 mt-4"
            >
              <StarRating rating={Math.round(avgRating)} size="h-5 w-5" />
              <span className="text-lg font-bold text-gold">{avgRating.toFixed(1)} / 5</span>
              <span className="text-muted-foreground text-sm">({reviews.length})</span>
            </motion.div>
          )}
        </motion.div>

        {/* Reviews carousel with snap scroll */}
        {reviews.length > 0 && (
          <div className="mb-12 sm:mb-16 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scroll-smooth scrollbar-hide">
            <div className="flex gap-4 sm:gap-6">
              {reviews.map((review, i) => (
                <ReviewCard key={review.id} review={review} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* Submit form */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-lg mx-auto"
        >
          <div className="rounded-xl border border-border/50 bg-card p-5 sm:p-8 shadow-sm">
            <h3 className="text-lg sm:text-xl font-bold mb-5 sm:mb-6 text-center">Leave a Review</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input placeholder="Your name" value={name} onChange={e => setName(e.target.value)} maxLength={100} className="h-12 text-base" />
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Your Rating</label>
                <StarRating rating={rating} onRate={setRating} interactive size="h-8 w-8" />
              </div>
              <Textarea placeholder="Share your experience..." value={reviewText} onChange={e => setReviewText(e.target.value)} maxLength={500} rows={4} className="text-base" />
              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <Button
                  type="submit"
                  className="w-full h-12 font-bold shadow-gold-glow"
                  disabled={isSubmitting}
                  style={{
                    background: 'linear-gradient(135deg, hsl(var(--brand-gold)) 0%, hsl(35 80% 48%) 100%)',
                    color: 'hsl(0 0% 5%)',
                  }}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Submitting...' : 'Submit Review'}
                </Button>
              </motion.div>
            </form>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ReviewsSection;
