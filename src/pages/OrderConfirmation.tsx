import React from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check, MessageCircle, ArrowLeft, Clock, Share2, MapPin, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { toast } from 'sonner';

interface OrderState {
  items: { name: string; quantity: number; price: number }[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  whatsappLink: string;
}

const GoldParticle: React.FC<{ delay: number; x: number }> = ({ delay, x }) => (
  <motion.div
    className="absolute h-1.5 w-1.5 rounded-full"
    style={{ background: 'hsl(var(--brand-gold))', left: `${x}%`, top: '40%' }}
    initial={{ opacity: 0, y: 0, scale: 0 }}
    animate={{ opacity: [0, 1, 0], y: [-20, -80], scale: [0, 1, 0.5], x: [0, (x > 50 ? 1 : -1) * 30] }}
    transition={{ delay, duration: 1.5, ease: 'easeOut' }}
  />
);

const OrderConfirmation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const order = location.state as OrderState | null;

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
            <p className="text-muted-foreground mb-4">No order found</p>
            <Button onClick={() => navigate('/')}>Back to Menu</Button>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  const shareOrder = () => {
    const text = `🍗 MFC Order\n${order.items.map(i => `${i.name} ×${i.quantity}`).join('\n')}\nTotal: ₹${order.total.toFixed(0)}`;
    if (navigator.share) {
      navigator.share({ title: 'MFC Order', text });
    } else {
      navigator.clipboard.writeText(text);
      toast.success('Order details copied!');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="container max-w-lg relative">
          {/* Gold particles */}
          {[10, 25, 40, 55, 70, 85].map((x, i) => (
            <GoldParticle key={i} delay={0.3 + i * 0.15} x={x} />
          ))}

          {/* Success checkmark */}
          <div className="flex flex-col items-center mb-8">
            <motion.div
              className="h-20 w-20 rounded-full flex items-center justify-center mb-5"
              style={{ background: 'linear-gradient(135deg, hsl(var(--success)), hsl(142 76% 46%))' }}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
              >
                <Check className="h-10 w-10 text-success-foreground" strokeWidth={3} />
              </motion.div>
            </motion.div>

            <motion.h1
              className="text-2xl font-bold text-center text-gradient-gold"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              Order Placed Successfully!
            </motion.h1>

            <motion.div
              className="flex items-center gap-2 mt-3 text-muted-foreground text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <Clock className="h-4 w-4" />
              <span>Estimated ready in ~20-30 minutes</span>
            </motion.div>
          </div>

          {/* Delivery info card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85 }}
            className="mb-4"
          >
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full flex items-center justify-center bg-primary/10">
                  <Truck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Delivered by Hashtag Dropee</p>
                  <p className="text-xs text-muted-foreground">Your order will be delivered to your doorstep</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Order details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <Card>
              <CardContent className="p-5 space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Order Details</h3>
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>{item.name} × {item.quantity}</span>
                    <span>₹{(item.price * item.quantity).toFixed(0)}</span>
                  </div>
                ))}
                <Separator />
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-500">
                    <span>Discount</span>
                    <span>-₹{order.discount.toFixed(0)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-gold">₹{order.total.toFixed(0)}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  💳 {order.paymentMethod === 'gpay' ? 'GPay (UPI)' : 'Cash on Delivery'}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* CTAs */}
          <motion.div
            className="space-y-3 mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
          >
            <Button
              size="lg"
              className="w-full"
              onClick={() => window.open(order.whatsappLink, '_blank')}
            >
              <MessageCircle className="mr-2 h-5 w-5" /> Track on WhatsApp
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => navigate('/track-order')}
            >
              <MapPin className="mr-2 h-4 w-4" /> Track Your Order
            </Button>

            <div className="flex gap-3">
              <Button variant="outline" size="lg" className="flex-1" onClick={() => navigate('/')}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Menu
              </Button>
              <Button variant="outline" size="lg" onClick={shareOrder}>
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OrderConfirmation;
