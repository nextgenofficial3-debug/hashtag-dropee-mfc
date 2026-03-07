import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Truck, Copy, Check, ExternalLink, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { items, subtotal, clearCart } = useCart();
  const { data: promotions } = useActivePromotions();
  const { data: settings } = useStoreSettings();

  const [formData, setFormData] = useState<CheckoutFormData>({
    name: '',
    phone: '',
    address: '',
    instructions: '',
    paymentMethod: 'cod',
  });
  const [deliveryKm, setDeliveryKm] = useState<number>(0);
  const [copied, setCopied] = useState(false);

  const calculateDiscount = () => {
    let totalDiscount = 0;
    items.forEach(item => {
      const productPromo = promotions?.find(p =>
        !p.applies_to_all && p.product_ids?.includes(item.product.id) && p.discount_percentage > 0
      );
      const globalPromo = promotions?.find(p => p.applies_to_all && p.discount_percentage > 0);
      const applicableDiscount = Math.max(productPromo?.discount_percentage || 0, globalPromo?.discount_percentage || 0);
      if (applicableDiscount > 0) {
        totalDiscount += (item.product.price * item.quantity * applicableDiscount) / 100;
      }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

    clearCart();
    window.open(whatsappLink, '_blank');
    toast.success('Order placed! Redirecting to WhatsApp...');
    navigate('/');
  };

  if (items.length === 0) {
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
      <main className="flex-1 py-8">
        <div className="container max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Button variant="ghost" onClick={() => navigate('/')} className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Menu
            </Button>

            <h1 className="text-3xl font-bold mb-8">Checkout</h1>

            <form onSubmit={handleSubmit}>
              <div className="grid gap-8 md:grid-cols-2">
                {/* Delivery Details */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Truck className="h-5 w-5" /> Delivery Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="name">Full Name *</Label>
                        <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Enter your name" required />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="+91 XXXXX XXXXX" required />
                      </div>
                      <div>
                        <Label htmlFor="address">Delivery Address *</Label>
                        <Textarea id="address" name="address" value={formData.address} onChange={handleChange} placeholder="Enter your complete address" rows={3} required />
                      </div>
                      <div>
                        <Label htmlFor="deliveryKm">Distance from store (km)</Label>
                        <Input
                          id="deliveryKm"
                          type="number"
                          min="0"
                          step="0.5"
                          value={deliveryKm || ''}
                          onChange={(e) => setDeliveryKm(parseFloat(e.target.value) || 0)}
                          placeholder="e.g. 3"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Delivery by Hashtag Dropee: ₹{DELIVERY_BASE_FEE} base + ₹{DELIVERY_PER_KM}/km
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="instructions">Special Instructions (Optional)</Label>
                        <Textarea id="instructions" name="instructions" value={formData.instructions} onChange={handleChange} placeholder="Any special requests?" rows={2} />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Payment Method */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" /> Payment Method
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <RadioGroup
                        value={formData.paymentMethod}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value as 'gpay' | 'cod' }))}
                        className="space-y-4"
                      >
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          className={`flex items-start space-x-3 rounded-lg border p-4 cursor-pointer ${formData.paymentMethod === 'gpay' ? 'border-primary bg-primary/5' : ''}`}
                          onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'gpay' }))}
                        >
                          <RadioGroupItem value="gpay" id="gpay" />
                          <div className="flex-1">
                            <Label htmlFor="gpay" className="font-medium cursor-pointer">GPay (UPI)</Label>
                            <p className="text-sm text-muted-foreground">Pay via Google Pay and share screenshot on WhatsApp</p>
                          </div>
                        </motion.div>

                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          className={`flex items-start space-x-3 rounded-lg border p-4 cursor-pointer ${formData.paymentMethod === 'cod' ? 'border-primary bg-primary/5' : ''}`}
                          onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'cod' }))}
                        >
                          <RadioGroupItem value="cod" id="cod" />
                          <div className="flex-1">
                            <Label htmlFor="cod" className="font-medium cursor-pointer">Cash on Delivery</Label>
                            <p className="text-sm text-muted-foreground">Pay when your order arrives</p>
                          </div>
                        </motion.div>
                      </RadioGroup>

                      {formData.paymentMethod === 'gpay' && settings?.upi_id && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 p-4 bg-muted rounded-lg">
                          <p className="text-sm font-medium mb-2">UPI ID:</p>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 p-2 bg-background rounded border text-sm">{settings.upi_id}</code>
                            <Button type="button" variant="outline" size="icon" onClick={copyUPI}>
                              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">After payment, share the screenshot on WhatsApp</p>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Order Summary */}
                <div>
                  <Card className="sticky top-24">
                    <CardHeader>
                      <CardTitle>Order Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {items.map((item) => (
                        <div key={item.product.id} className="flex justify-between text-sm">
                          <span>{item.product.name} x{item.quantity}</span>
                          <span>₹{(item.product.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}

                      <Separator />

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span>₹{subtotal.toFixed(2)}</span>
                        </div>
                        {discountAmount > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Discount</span>
                            <span>-₹{discountAmount.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Package className="h-3.5 w-3.5" /> Packaging
                          </span>
                          <span>₹{PACKAGING_FEE}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            <span className="block">🚚 Delivery (Hashtag Dropee)</span>
                            <span className="text-xs">Base ₹{DELIVERY_BASE_FEE} + {deliveryKm > 0 ? `${deliveryKm}km × ₹${DELIVERY_PER_KM}` : `₹${DELIVERY_PER_KM}/km`}</span>
                          </span>
                          <span>₹{totalDelivery}</span>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex justify-between text-lg font-semibold">
                        <span>Grand Total</span>
                        <span className="text-gold">₹{grandTotal.toFixed(2)}</span>
                      </div>

                      <Button type="submit" className="w-full" size="lg">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Place Order via WhatsApp
                      </Button>

                      <p className="text-xs text-center text-muted-foreground">
                        You'll be redirected to WhatsApp with your order details
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;
