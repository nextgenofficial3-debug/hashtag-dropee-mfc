import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CreditCard, Truck, Copy, Check, ExternalLink, Package, Minus, Plus, ShoppingBag } from 'lucide-react';
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
import Footer from '@/components/layout/Footer';

const PACKAGING_FEE = 60;
const DELIVERY_BASE_FEE = 100;
const DELIVERY_PER_KM = 50;

const STEPS = ['Review', 'Details', 'Payment', 'Summary'];

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 200 : -200, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -200 : 200, opacity: 0 }),
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
  const deliveryKmFee = deliveryKm * DELIVERY_PER_KM;
  const totalDelivery = DELIVERY_BASE_FEE + deliveryKmFee;
  const grandTotal = subtotal - discountAmount + PACKAGING_FEE + totalDelivery;

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

    try {
      const { supabase } = await import('@/integrations/supabase/client');
      await supabase.from('orders').insert({
        customer_name: formData.name,
        customer_phone: formData.phone,
        customer_address: formData.address,
        special_instructions: formData.instructions || null,
        payment_method: formData.paymentMethod,
        items: items.map(i => ({ name: i.product.name, quantity: i.quantity, price: i.product.price })),
        subtotal,
        discount: discountAmount,
        total: grandTotal,
      });
    } catch (err) {
      console.error('Failed to save order:', err);
    }

    const whatsappLink = generateWhatsAppLink(
      settings?.whatsapp_primary || '+919774046387',
      items, subtotal, discountAmount, formData,
      PACKAGING_FEE, DELIVERY_BASE_FEE, deliveryKm, DELIVERY_PER_KM
    );

    const orderData = {
      items: items.map(i => ({ name: i.product.name, quantity: i.quantity, price: i.product.price })),
      subtotal, discount: discountAmount, total: grandTotal,
      paymentMethod: formData.paymentMethod,
      whatsappLink,
    };

    clearCart();
    navigate('/order-confirmation', { state: orderData });
  };

  if (items.length === 0 && step === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-4">Add some delicious items first!</p>
            <Button onClick={() => navigate('/')}>Browse Menu</Button>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-6">
        <div className="container max-w-2xl">
          {/* Back button */}
          <Button variant="ghost" size="sm" onClick={() => step === 0 ? navigate('/') : goTo(step - 1)} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> {step === 0 ? 'Back to Menu' : 'Back'}
          </Button>

          {/* Progress indicator */}
          <div className="flex items-center justify-between mb-8">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center flex-1 last:flex-none">
                <button
                  onClick={() => i < step && goTo(i)}
                  className={`flex flex-col items-center gap-1.5 ${i <= step ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <motion.div
                    className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors duration-300 ${
                      i < step ? 'bg-primary border-primary text-primary-foreground'
                      : i === step ? 'border-primary text-primary bg-primary/10'
                      : 'border-border text-muted-foreground'
                    }`}
                    animate={i === step ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.4 }}
                  >
                    {i < step ? <Check className="h-4 w-4" /> : i + 1}
                  </motion.div>
                  <span className={`text-[11px] font-medium ${i <= step ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {label}
                  </span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 rounded-full transition-colors duration-300 ${i < step ? 'bg-primary' : 'bg-border'}`} />
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
              transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
            >
              {step === 0 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-primary" /> Review Your Order
                  </h2>
                  <div className="space-y-3">
                    {items.map(item => (
                      <Card key={item.product.id} className="overflow-hidden">
                        <CardContent className="p-3 flex items-center gap-3">
                          <div className="h-16 w-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            {item.product.images?.[0] ? (
                              <img src={item.product.images[0]} alt={item.product.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-2xl">🍗</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm line-clamp-1">{item.product.name}</h3>
                            <p className="text-gold font-bold text-sm">₹{item.product.price}</p>
                          </div>
                          <div className="flex items-center rounded-lg border border-border overflow-hidden">
                            <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="h-8 w-8 flex items-center justify-center hover:bg-muted transition-colors">
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="h-8 w-8 flex items-center justify-center text-sm font-bold">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="h-8 w-8 flex items-center justify-center hover:bg-muted transition-colors">
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <span className="font-bold text-sm w-16 text-right">₹{(item.product.price * item.quantity).toFixed(0)}</span>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal ({items.length} items)</span>
                    <span className="font-bold">₹{subtotal.toFixed(0)}</span>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Truck className="h-5 w-5 text-primary" /> Delivery Details
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Enter your name" required className="mt-1.5" />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="+91 XXXXX XXXXX" required className="mt-1.5" />
                    </div>
                    <div>
                      <Label htmlFor="address">Delivery Address *</Label>
                      <Textarea id="address" name="address" value={formData.address} onChange={handleChange} placeholder="Enter your complete address" rows={3} required className="mt-1.5" />
                    </div>
                    <div>
                      <Label htmlFor="deliveryKm">Distance from store (km)</Label>
                      <Input id="deliveryKm" type="number" min="0" step="0.5" value={deliveryKm || ''} onChange={(e) => setDeliveryKm(parseFloat(e.target.value) || 0)} placeholder="e.g. 3" className="mt-1.5" />
                      <p className="text-xs text-muted-foreground mt-1">Delivery by Hashtag Dropee: ₹{DELIVERY_BASE_FEE} base + ₹{DELIVERY_PER_KM}/km</p>
                    </div>
                    <div>
                      <Label htmlFor="instructions">Special Instructions (Optional)</Label>
                      <Textarea id="instructions" name="instructions" value={formData.instructions} onChange={handleChange} placeholder="Any special requests?" rows={2} className="mt-1.5" />
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" /> Payment Method
                  </h2>
                  <RadioGroup
                    value={formData.paymentMethod}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value as 'gpay' | 'cod' }))}
                    className="space-y-3"
                  >
                    <motion.div
                      whileTap={{ scale: 0.98 }}
                      className={`flex items-start space-x-3 rounded-xl border-2 p-5 cursor-pointer transition-colors ${formData.paymentMethod === 'gpay' ? 'border-primary bg-primary/5' : 'border-border'}`}
                      onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'gpay' }))}
                    >
                      <RadioGroupItem value="gpay" id="gpay" className="mt-0.5" />
                      <div className="flex-1">
                        <Label htmlFor="gpay" className="font-semibold text-base cursor-pointer">GPay (UPI)</Label>
                        <p className="text-sm text-muted-foreground mt-1">Pay via Google Pay and share screenshot on WhatsApp</p>
                      </div>
                    </motion.div>

                    <motion.div
                      whileTap={{ scale: 0.98 }}
                      className={`flex items-start space-x-3 rounded-xl border-2 p-5 cursor-pointer transition-colors ${formData.paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-border'}`}
                      onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'cod' }))}
                    >
                      <RadioGroupItem value="cod" id="cod" className="mt-0.5" />
                      <div className="flex-1">
                        <Label htmlFor="cod" className="font-semibold text-base cursor-pointer">Cash on Delivery</Label>
                        <p className="text-sm text-muted-foreground mt-1">Pay when your order arrives</p>
                      </div>
                    </motion.div>
                  </RadioGroup>

                  {formData.paymentMethod === 'gpay' && settings?.upi_id && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-4 bg-muted rounded-xl">
                      <p className="text-sm font-medium mb-2">UPI ID:</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 p-2.5 bg-background rounded-lg border text-sm">{settings.upi_id}</code>
                        <Button type="button" variant="outline" size="icon" onClick={copyUPI}>
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">After payment, share the screenshot on WhatsApp</p>
                    </motion.div>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold">Order Summary</h2>
                  <Card>
                    <CardContent className="p-5 space-y-4">
                      {items.map(item => (
                        <div key={item.product.id} className="flex justify-between text-sm">
                          <span>{item.product.name} × {item.quantity}</span>
                          <span>₹{(item.product.price * item.quantity).toFixed(0)}</span>
                        </div>
                      ))}
                      <Separator />
                      <div className="space-y-2 text-sm">
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
                        <div className="flex justify-between">
                          <span className="text-muted-foreground flex items-center gap-1"><Package className="h-3.5 w-3.5" /> Packaging</span>
                          <span>₹{PACKAGING_FEE}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            <span className="block">🚚 Delivery (Hashtag Dropee)</span>
                            <span className="text-xs">Base ₹{DELIVERY_BASE_FEE} {deliveryKm > 0 ? `+ ${deliveryKm}km × ₹${DELIVERY_PER_KM}` : ''}</span>
                          </span>
                          <span>₹{totalDelivery}</span>
                        </div>
                      </div>
                      <Separator />
                      <motion.div
                        className="flex justify-between text-lg font-bold"
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                      >
                        <span>Grand Total</span>
                        <span className="text-gold">₹{grandTotal.toFixed(0)}</span>
                      </motion.div>

                      <div className="pt-2 space-y-2 text-xs text-muted-foreground">
                        <p>📍 {formData.address}</p>
                        <p>💳 {formData.paymentMethod === 'gpay' ? 'GPay (UPI)' : 'Cash on Delivery'}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <Button variant="outline" size="lg" onClick={() => goTo(step - 1)} className="flex-1">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
            )}
            {step < 3 ? (
              <Button size="lg" onClick={() => goTo(step + 1)} disabled={!canProceed()} className="flex-1">
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button size="lg" onClick={handleSubmit} className="flex-1">
                <ExternalLink className="mr-2 h-4 w-4" /> Place Order via WhatsApp
              </Button>
            )}
          </div>

          <p className="text-xs text-center text-muted-foreground mt-3">
            You'll be redirected to WhatsApp with your order details
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;
