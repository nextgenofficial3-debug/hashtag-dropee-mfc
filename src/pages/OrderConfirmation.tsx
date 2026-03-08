import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check, MessageCircle, ArrowLeft, Share2, MapPin, Truck, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OrderState {
  items: { name: string; quantity: number; price: number }[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  whatsappLink: string;
  orderId?: string;
  hubOrderId?: string;
}

const ORDER_STATUSES = ['Pending', 'Confirmed', 'Preparing', 'Picked Up', 'On The Way', 'Delivered'] as const;
type OrderStatus = typeof ORDER_STATUSES[number];

const STATUS_ICONS = ['⏳', '✅', '👨‍🍳', '📦', '🚚', '🎉'];

const normalizeStatus = (raw: string): OrderStatus => {
  const lower = raw.toLowerCase().replace(/[_-]/g, ' ').trim();
  const map: Record<string, OrderStatus> = {
    'pending': 'Pending',
    'confirmed': 'Confirmed',
    'preparing': 'Preparing',
    'picked up': 'Picked Up',
    'pickedup': 'Picked Up',
    'on the way': 'On The Way',
    'ontheway': 'On The Way',
    'out for delivery': 'On The Way',
    'delivered': 'Delivered',
  };
  return map[lower] || 'Pending';
};

const GoldParticle: React.FC<{ delay: number; x: number }> = ({ delay, x }) => (
  <motion.div
    className="absolute h-1.5 w-1.5 rounded-full"
    style={{ background: 'hsl(var(--brand-gold))', left: `${x}%`, top: '40%' }}
    initial={{ opacity: 0, y: 0, scale: 0 }}
    animate={{ opacity: [0, 1, 0], y: [-20, -80], scale: [0, 1, 0.5], x: [0, (x > 50 ? 1 : -1) * 30] }}
    transition={{ delay, duration: 1.5, ease: 'easeOut' }}
  />
);

const StatusStep: React.FC<{
  label: string;
  icon: string;
  index: number;
  currentIndex: number;
  isLast: boolean;
}> = ({ label, icon, index, currentIndex, isLast }) => {
  const isCompleted = index < currentIndex;
  const isCurrent = index === currentIndex;

  return (
    <div className="flex items-start gap-3">
      <div className="flex flex-col items-center">
        <motion.div
          className={`h-10 w-10 rounded-full flex items-center justify-center text-lg border-2 transition-colors duration-500 ${
            isCompleted
              ? 'bg-primary border-primary text-primary-foreground'
              : isCurrent
              ? 'border-primary bg-primary/10'
              : 'border-border bg-muted'
          }`}
          animate={isCurrent ? { scale: [1, 1.15, 1] } : {}}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        >
          {isCompleted ? <Check className="h-5 w-5" /> : icon}
        </motion.div>
        {!isLast && (
          <motion.div
            className="w-0.5 h-8 mt-1 rounded-full transition-colors duration-500"
            style={{ backgroundColor: isCompleted ? 'hsl(var(--primary))' : 'hsl(var(--border))' }}
          />
        )}
      </div>
      <div className="pt-2">
        <p className={`text-sm font-medium transition-colors duration-300 ${
          isCompleted || isCurrent ? 'text-foreground' : 'text-muted-foreground'
        }`}>
          {label}
        </p>
      </div>
    </div>
  );
};

const OrderConfirmation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const order = location.state as OrderState | null;

  const [currentStatus, setCurrentStatus] = useState<OrderStatus>('Pending');
  const [isWsConnected, setIsWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectAttempts = useRef(0);

  const currentStatusIndex = ORDER_STATUSES.indexOf(currentStatus);

  const pollStatus = useCallback(async () => {
    if (!order?.hubOrderId) return;
    try {
      const { data } = await supabase.functions.invoke('check-hub-order-status', {
        body: null,
        method: 'GET',
      });
      // Pass hub_order_id as query param workaround - use POST instead
      const { data: statusData } = await supabase.functions.invoke('check-hub-order-status', {
        body: { hub_order_id: order.hubOrderId },
      });
      if (statusData?.status) {
        setCurrentStatus(normalizeStatus(statusData.status));
      }
    } catch (err) {
      console.error('Polling failed:', err);
    }
  }, [order?.hubOrderId]);

  const startPolling = useCallback(() => {
    if (pollingRef.current) return;
    pollingRef.current = setInterval(pollStatus, 15000);
    pollStatus(); // immediate first poll
  }, [pollStatus]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const connectWebSocket = useCallback(() => {
    if (!order?.hubOrderId) return;

    // Get hub URL from edge function env - we'll use a meta approach
    // Since we can't access env vars client-side, we use the edge function for polling
    // and attempt WS connection if hub URL is configured
    const hubUrl = (window as any).__ORDER_HUB_URL;
    if (!hubUrl) {
      // No hub URL available client-side, use polling only
      startPolling();
      return;
    }

    const wsUrl = hubUrl.replace(/^http/, 'ws');
    const ws = new WebSocket(`${wsUrl}?source=cafe&api_key=${(window as any).__ORDER_HUB_API_KEY || ''}`);

    ws.onopen = () => {
      setIsWsConnected(true);
      reconnectAttempts.current = 0;
      stopPolling();
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.hub_order_id === order.hubOrderId && msg.status) {
          setCurrentStatus(normalizeStatus(msg.status));
        }
      } catch {
        console.error('Invalid WS message');
      }
    };

    ws.onclose = () => {
      setIsWsConnected(false);
      startPolling();
      // Reconnect with exponential backoff
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
      reconnectAttempts.current++;
      setTimeout(connectWebSocket, delay);
    };

    ws.onerror = () => {
      ws.close();
    };

    wsRef.current = ws;
  }, [order?.hubOrderId, startPolling, stopPolling]);

  useEffect(() => {
    if (!order?.hubOrderId) return;

    // Start with polling since hub URL isn't available client-side
    startPolling();
    connectWebSocket();

    return () => {
      stopPolling();
      wsRef.current?.close();
    };
  }, [order?.hubOrderId, startPolling, connectWebSocket, stopPolling]);

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

  const isDelivered = currentStatus === 'Delivered';

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

            {order.hubOrderId && (
              <motion.div
                className="flex items-center gap-2 mt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                {isWsConnected ? (
                  <Wifi className="h-3 w-3 text-green-500" />
                ) : (
                  <WifiOff className="h-3 w-3 text-muted-foreground" />
                )}
                <span className="text-xs text-muted-foreground">
                  {isWsConnected ? 'Live tracking' : 'Checking status...'}
                </span>
              </motion.div>
            )}
          </div>

          {/* Live Order Tracker */}
          {order.hubOrderId && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mb-6"
            >
              <Card>
                <CardContent className="p-5">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Truck className="h-4 w-4" /> Order Status
                  </h3>
                  <div className="space-y-0">
                    <AnimatePresence>
                      {ORDER_STATUSES.map((status, i) => (
                        <motion.div
                          key={status}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.9 + i * 0.08 }}
                        >
                          <StatusStep
                            label={status}
                            icon={STATUS_ICONS[i]}
                            index={i}
                            currentIndex={currentStatusIndex}
                            isLast={i === ORDER_STATUSES.length - 1}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

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
