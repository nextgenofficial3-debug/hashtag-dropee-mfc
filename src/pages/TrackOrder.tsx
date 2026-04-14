import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Clock, Package, Truck, CheckCircle, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { toast } from 'sonner';

interface Order {
  id: string;
  customer_name: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  status: string;
  payment_method: string;
  created_at: string;
}

const statusSteps = [
  { key: 'pending', label: 'Order Placed', icon: Clock, description: 'Your order has been received' },
  { key: 'preparing', label: 'Preparing', icon: Package, description: 'Your food is being prepared' },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck, description: 'On the way to you via Hashtag Dropee' },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle, description: 'Enjoy your meal!' },
];

const getStepIndex = (status: string) => statusSteps.findIndex(s => s.key === status);

const TrackOrder: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = phone.replace(/\s/g, '');
    if (cleaned.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('mfc_orders')
      .select('*')
      .ilike('customer_phone', `%${cleaned.slice(-10)}%`)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      toast.error('Failed to fetch orders');
    } else {
      setOrders((data as unknown as Order[]) || []);
      if (!data || data.length === 0) toast.info('No orders found for this number');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="container max-w-lg">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl font-bold mb-2">Track Your Order</h1>
            <p className="text-muted-foreground mb-6 text-sm">Enter your phone number to see your order status</p>

            <form onSubmit={handleSearch} className="flex gap-2 mb-8">
              <div className="flex-1">
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 XXXXX XXXXX"
                  className="h-11"
                />
              </div>
              <Button type="submit" disabled={loading} className="h-11 px-6">
                <Search className="h-4 w-4 mr-2" /> Track
              </Button>
            </form>

            <AnimatePresence mode="wait">
              {orders !== null && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {orders.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-5xl mb-4">📦</div>
                      <p className="text-muted-foreground">No orders found for this number</p>
                    </div>
                  ) : (
                    orders.map(order => {
                      const currentStep = getStepIndex(order.status);
                      return (
                        <Card key={order.id}>
                          <CardContent className="p-5 space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs text-muted-foreground">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                                <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>
                              </div>
                              <span className="font-bold text-gold text-lg">₹{order.total}</span>
                            </div>

                            <Separator />

                            {/* Status timeline */}
                            <div className="space-y-0">
                              {statusSteps.map((step, i) => {
                                const StepIcon = step.icon;
                                const isActive = i <= currentStep;
                                const isCurrent = i === currentStep;
                                return (
                                  <div key={step.key} className="flex items-start gap-3">
                                    <div className="flex flex-col items-center">
                                      <motion.div
                                        className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all ${
                                          isActive
                                            ? 'bg-primary border-primary text-primary-foreground'
                                            : 'border-border text-muted-foreground'
                                        }`}
                                        animate={isCurrent ? { scale: [1, 1.15, 1] } : {}}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                      >
                                        <StepIcon className="h-4 w-4" />
                                      </motion.div>
                                      {i < statusSteps.length - 1 && (
                                        <div className={`w-0.5 h-8 ${isActive ? 'bg-primary' : 'bg-border'}`} />
                                      )}
                                    </div>
                                    <div className="pb-6">
                                      <p className={`text-sm font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                                        {step.label}
                                      </p>
                                      <p className="text-xs text-muted-foreground">{step.description}</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Items */}
                            <div className="text-xs text-muted-foreground space-y-1">
                              {(order.items as any[]).map((item: any, i: number) => (
                                <p key={i}>{item.name} × {item.quantity}</p>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TrackOrder;
