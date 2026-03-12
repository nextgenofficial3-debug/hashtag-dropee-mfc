import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CreditCard, Truck, Copy, Check, ExternalLink, Package, Minus, Plus, ShoppingBag, Tag, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/contexts/CartContext';
import { useActivePromotions } from '@/hooks/usePromotions';
import { useStoreSettings } from '@/hooks/useStoreSettings';
import { CheckoutFormData } from '@/types/database';
import { generateWhatsAppLink } from '@/lib/whatsapp';
import { toast } from 'sonner';
import Header from '@/components/layout/Header';

const STEPS = ['Review', 'Details', 'Payment', 'Summary'];

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 120 : -120, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -120 : 120, opacity: 0 }),
};

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { items, subtotal, updateQuantity, removeItem, clearCart } = useCart();
  const { data: promotions } = useActivePromotions();
  const { data: settings } = useStoreSettings();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [formData, setFormData] = useState<CheckoutFormData>({
    name: '', phone: '', address: '', instructions: '', paymentMethod: 'cod',
  });
  const [deliveryKm, setDeliveryKm] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);

  // Use admin-configured fees
  const packagingFee = settings?.packaging_fee ?? 60;
  const deliveryBaseFee = settings?.base_delivery_fee ?? 100;
  const deliveryPerKm = settings?.per_km_delivery_fee ?? 50;

  const calculateDiscount = () => {
    let totalDiscount = 0;
    items.forEach(item => {
      const productPromo = promotions?.find(p => !p.applies_to_all && p.product_ids?.includes(item.product.id) && p.discount_percentage > 0);
      const globalPromo = promotions?.find(p => p.applies_to_all && p.discount_percentage > 0);
      const applicableDiscount = Math.max(productPromo?.discount_percentage || 0, globalPromo?.discount_percentage || 0);
      if (applicableDiscount > 0) totalDiscount += (item.product.price * item.quantity * applicableDiscount) / 100;
    });
    return totalDiscount;
  };

  const discountAmount = calculateDiscount();
  const deliveryKmFee = deliveryKm * deliveryPerKm;
  const totalDelivery = deliveryBaseFee + deliveryKmFee;
  const grandTotal = subtotal - discountAmount - couponDiscount + packagingFee + totalDelivery;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const copyUPI = () => {
    if (settings?.upi_id) {
      navigator.clipboard.writeText(settings.upi_id);
      setCopied(true);
      toast.success('UPI ID copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase
        .from('coupons' as any)
        .select('*')
        .eq('code', couponCode.toUpperCase().trim())
        .eq('is_active', true)
        .single();

      if (error || !data) {
        toast.error('Invalid or expired coupon code');
        setCouponLoading(false);
        return;
      }

      const coupon = data as any;
      if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
        toast.error('This coupon has reached its usage limit');
        setCouponLoading(false);
        return;
      }
      if (coupon.min_order_amount && subtotal < coupon.min_order_amount) {
        toast.error(`Minimum order amount is ₹${coupon.min_order_amount}`);
        setCouponLoading(false);
        return;
      }

      const discount = coupon.discount_type === 'percentage'
        ? (subtotal * coupon.discount_value) / 100
        : coupon.discount_value;

      setCouponDiscount(Math.min(discount, subtotal));
      setCouponApplied(true);
      toast.success(`Coupon applied! ₹${Math.min(discount, subtotal).toFixed(0)} off`);

      await supabase.from('coupons' as any).update({ used_count: (coupon.used_count || 0) + 1 }).eq('id', coupon.id);
    } catch {
      toast.error('Failed to apply coupon');
    }
    setCouponLoading(false);
  };

  const goTo = (newStep: number) => {
    setDirection(newStep > step ? 1 : -1);
    setStep(newStep);
  };

  const canProceed = () => {
    if (step === 0) return items.length > 0;
    if (step === 1) return formData.name && formData.phone && formData.address;
    return true;
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.phone || !formData.address) {
      toast.error('Please fill in all required fields');
      return;
    }

    let orderId = '';
    let hubOrderId = '';

    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const orderItems = items.map(i => ({ name: i.product.name, quantity: i.quantity, price: i.product.price }));
      
      const { data: insertedOrder, error: insertError } = await supabase.from('orders').insert({
        customer_name: formData.name,
        customer_phone: formData.phone,
        customer_address: formData.address,
        special_instructions: formData.instructions || null,
        payment_method: formData.paymentMethod,
        items: orderItems,
        subtotal,
        discount: discountAmount,
        total: grandTotal,
      }).select('id').single();

      if (insertError) {
        console.error('Failed to save order:', insertError);
      } else {
        orderId = insertedOrder.id;
      }

      if (orderId) {
        try {
          const { data: hubData } = await supabase.functions.invoke('forward-order-to-hub', {
            body: {
              orderId,
              customerName: formData.name,
              customerPhone: formData.phone,
              customerAddress: formData.address,
              items: orderItems,
              total: grandTotal,
              specialInstructions: formData.instructions || '',
            },
          });
          if (hubData?.hub_order_id) {
            hubOrderId = hubData.hub_order_id;
          }
        } catch (hubErr) {
          console.error('Failed to forward to hub:', hubErr);
        }
      }
    } catch (err) {
      console.error('Failed to save order:', err);
    }

    // Generate WhatsApp link with admin-configured fees
    const whatsappLink = generateWhatsAppLink(
      settings?.whatsapp_primary || '+919774046387',
      items, subtotal, discountAmount, formData,
      packagingFee, deliveryBaseFee, deliveryKm, deliveryPerKm
    );

    // Open WhatsApp immediately
    window.open(whatsappLink, '_blank');

    const orderData = {
      items: items.map(i => ({ name: i.product.name, quantity: i.quantity, price: i.product.price })),
      subtotal, discount: discountAmount, total: grandTotal,
      paymentMethod: formData.paymentMethod,
      whatsappLink,
      orderId,
      hubOrderId,
    };

    clearCart();
    navigate('/order-confirmation', { state: orderData });
  };

  if (items.length === 0 && step === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-4">Add some delicious items first!</p>
            <Button onClick={() => navigate('/')}>Browse Menu</Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pb-32">
        <div className="container max-w-2xl px-4 pt-4">
          {/* Back button */}
          <Button variant="ghost" size="sm" onClick={() => step === 0 ? navigate('/') : goTo(step - 1)} className="mb-3 -ml-2">
            <ArrowLeft className="mr-1.5 h-4 w-4" /> {step === 0 ? 'Back' : 'Back'}
          </Button>

          {/* Progress indicator - compact for mobile */}
          <div className="flex items-center justify-between mb-6">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center flex-1 last:flex-none">
                <button
                  onClick={() => i < step && goTo(i)}
                  className={`flex flex-col items-center gap-1 ${i <= step ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <motion.div
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors duration-300 ${
                      i < step ? 'bg-primary border-primary text-primary-foreground'
                      : i === step ? 'border-primary text-primary bg-primary/10'
                      : 'border-border text-muted-foreground'
                    }`}
                    animate={i === step ? { scale: [1, 1.08, 1] } : {}}
                    transition={{ duration: 0.4 }}
                  >
                    {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </motion.div>
                  <span className={`text-[10px] font-medium ${i <= step ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {label}
                  </span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1.5 rounded-full transition-colors duration-300 ${i < step ? 'bg-primary' : 'bg-border'}`} />
                )}
              </div>
            ))}
          </div>

          {/* Step content */}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {step === 0 && (
                <div className="space-y-3">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-primary" /> Review Order
                  </h2>
                  <div className="space-y-2">
                    {items.map(item => (
                      <Card key={item.product.id} className="overflow-hidden">
                        <CardContent className="p-2.5 flex items-center gap-2.5">
                          <div className="h-14 w-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            {item.product.images?.[0] ? (
                              <img src={item.product.images[0]} alt={item.product.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-xl">🍗</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm line-clamp-1">{item.product.name}</h3>
                            <p className="text-primary font-bold text-sm">₹{item.product.price}</p>
                          </div>
                          <div className="flex items-center rounded-lg border border-border overflow-hidden">
                            <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="h-7 w-7 flex items-center justify-center hover:bg-muted active:bg-muted/80 transition-colors">
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="h-7 w-7 flex items-center justify-center text-xs font-bold">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="h-7 w-7 flex items-center justify-center hover:bg-muted active:bg-muted/80 transition-colors">
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <span className="font-bold text-sm w-14 text-right">₹{(item.product.price * item.quantity).toFixed(0)}</span>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal ({items.length} items)</span>
                    <span className="font-bold">₹{subtotal.toFixed(0)}</span>
                  </div>

                  {/* Coupon Code */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        disabled={couponApplied}
                        className="pl-8 h-9 uppercase text-sm"
                      />
                    </div>
                    {couponApplied ? (
                      <Button variant="outline" size="sm" className="h-9" onClick={() => { setCouponApplied(false); setCouponDiscount(0); setCouponCode(''); }}>
                        Remove
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" className="h-9" onClick={applyCoupon} disabled={couponLoading || !couponCode.trim()}>
                        Apply
                      </Button>
                    )}
                  </div>
                  {couponApplied && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-green-500 flex items-center gap-1">
                      <Check className="h-3 w-3" /> Coupon applied: -₹{couponDiscount.toFixed(0)}
                    </motion.p>
                  )}
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <Truck className="h-5 w-5 text-primary" /> Delivery Details
                  </h2>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="name" className="text-sm">Full Name *</Label>
                      <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Enter your name" required className="mt-1 h-10" />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-sm">Phone Number *</Label>
                      <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="+91 XXXXX XXXXX" required className="mt-1 h-10" />
                    </div>
                    <div>
                      <Label htmlFor="address" className="text-sm">Delivery Address *</Label>
                      <Textarea id="address" name="address" value={formData.address} onChange={handleChange} placeholder="Enter your complete address" rows={2} required className="mt-1 resize-none" />
                    </div>
                    <div>
                      <Label htmlFor="deliveryKm" className="text-sm">Distance from store (km)</Label>
                      <Input id="deliveryKm" type="number" min="0" step="0.5" value={deliveryKm || ''} onChange={(e) => setDeliveryKm(parseFloat(e.target.value) || 0)} placeholder="e.g. 3" className="mt-1 h-10" />
                      <p className="text-xs text-muted-foreground mt-1">Delivery: ₹{deliveryBaseFee} base + ₹{deliveryPerKm}/km</p>
                    </div>
                    <div>
                      <Label htmlFor="instructions" className="text-sm">Special Instructions</Label>
                      <Textarea id="instructions" name="instructions" value={formData.instructions} onChange={handleChange} placeholder="Any special requests?" rows={2} className="mt-1 resize-none" />
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" /> Payment Method
                  </h2>
                  <RadioGroup
                    value={formData.paymentMethod}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value as 'gpay' | 'cod' }))}
                    className="space-y-2.5"
                  >
                    <motion.div
                      whileTap={{ scale: 0.98 }}
                      className={`flex items-start space-x-3 rounded-xl border-2 p-4 cursor-pointer transition-colors ${formData.paymentMethod === 'gpay' ? 'border-primary bg-primary/5' : 'border-border'}`}
                      onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'gpay' }))}
                    >
                      <RadioGroupItem value="gpay" id="gpay" className="mt-0.5" />
                      <div className="flex-1">
                        <Label htmlFor="gpay" className="font-semibold text-sm cursor-pointer">GPay (UPI)</Label>
                        <p className="text-xs text-muted-foreground mt-0.5">Pay via Google Pay and share screenshot on WhatsApp</p>
                      </div>
                    </motion.div>

                    <motion.div
                      whileTap={{ scale: 0.98 }}
                      className={`flex items-start space-x-3 rounded-xl border-2 p-4 cursor-pointer transition-colors ${formData.paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-border'}`}
                      onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'cod' }))}
                    >
                      <RadioGroupItem value="cod" id="cod" className="mt-0.5" />
                      <div className="flex-1">
                        <Label htmlFor="cod" className="font-semibold text-sm cursor-pointer">Cash on Delivery</Label>
                        <p className="text-xs text-muted-foreground mt-0.5">Pay when your order arrives</p>
                      </div>
                    </motion.div>
                  </RadioGroup>

                  {formData.paymentMethod === 'gpay' && settings?.upi_id && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-3 bg-muted rounded-xl">
                      <p className="text-sm font-medium mb-2">UPI ID:</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 p-2 bg-background rounded-lg border text-xs break-all">{settings.upi_id}</code>
                        <Button type="button" variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={copyUPI}>
                          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">After payment, share the screenshot on WhatsApp</p>
                    </motion.div>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold">Order Summary</h2>
                  <Card>
                    <CardContent className="p-4 space-y-3">
                      {items.map(item => (
                        <div key={item.product.id} className="flex justify-between text-sm">
                          <span className="line-clamp-1 flex-1 mr-2">{item.product.name} × {item.quantity}</span>
                          <span className="shrink-0">₹{(item.product.price * item.quantity).toFixed(0)}</span>
                        </div>
                      ))}
                      <Separator />
                      <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span>₹{subtotal.toFixed(0)}</span>
                        </div>
                        {discountAmount > 0 && (
                          <div className="flex justify-between text-green-500">
                            <span>Discount</span>
                            <span>-₹{discountAmount.toFixed(0)}</span>
                          </div>
                        )}
                        {couponDiscount > 0 && (
                          <div className="flex justify-between text-green-500">
                            <span>Coupon ({couponCode})</span>
                            <span>-₹{couponDiscount.toFixed(0)}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground flex items-center gap-1"><Package className="h-3 w-3" /> Packaging</span>
                          <span>₹{packagingFee}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            <span className="block text-sm">🚚 Delivery</span>
                            <span className="text-[10px]">₹{deliveryBaseFee} {deliveryKm > 0 ? `+ ${deliveryKm}km × ₹${deliveryPerKm}` : ''}</span>
                          </span>
                          <span>₹{totalDelivery}</span>
                        </div>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-base font-bold">
                        <span>Grand Total</span>
                        <span className="text-primary">₹{grandTotal.toFixed(0)}</span>
                      </div>

                      <div className="pt-1 space-y-1 text-xs text-muted-foreground">
                        <p className="break-words">📍 {formData.address}</p>
                        <p>💳 {formData.paymentMethod === 'gpay' ? 'GPay (UPI)' : 'Cash on Delivery'}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Fixed bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] z-50">
        <div className="container max-w-2xl flex gap-2.5">
          {step > 0 && (
            <Button variant="outline" size="lg" onClick={() => goTo(step - 1)} className="flex-1 h-12">
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
            </Button>
          )}
          {step < 3 ? (
            <Button size="lg" onClick={() => goTo(step + 1)} disabled={!canProceed()} className="flex-1 h-12 font-semibold">
              Next <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          ) : (
            <Button size="lg" onClick={handleSubmit} className="flex-1 h-12 font-semibold gap-2">
              <MessageCircle className="h-4 w-4" /> Place Order via WhatsApp
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Checkout;
