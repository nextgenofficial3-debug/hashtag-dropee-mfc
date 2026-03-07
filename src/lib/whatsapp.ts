import { CartItem, CheckoutFormData } from '@/types/database';

export const formatOrderMessage = (
  items: CartItem[],
  subtotal: number,
  discount: number,
  formData: CheckoutFormData,
  packagingFee: number = 60,
  deliveryBaseFee: number = 100,
  deliveryKm: number = 0,
  deliveryPerKm: number = 50
): string => {
  const deliveryKmFee = deliveryKm * deliveryPerKm;
  const totalDelivery = deliveryBaseFee + deliveryKmFee;
  const grandTotal = subtotal - discount + packagingFee + totalDelivery;

  const lines = [
    '🍗 *NEW ORDER - MFC Makyo Fried Chicken* 🍗',
    '',
    '*Customer Details:*',
    `👤 Name: ${formData.name}`,
    `📱 Phone: ${formData.phone}`,
    `📍 Address: ${formData.address}`,
  ];

  if (formData.instructions) {
    lines.push(`📝 Special Instructions: ${formData.instructions}`);
  }

  lines.push('', '*Order Items:*');

  items.forEach(item => {
    lines.push(`• ${item.product.name} x${item.quantity} - ₹${(item.product.price * item.quantity).toFixed(2)}`);
  });

  lines.push('', '─────────────────');
  lines.push(`Subtotal: ₹${subtotal.toFixed(2)}`);

  if (discount > 0) {
    lines.push(`Discount: -₹${discount.toFixed(2)}`);
  }

  lines.push(`📦 Packaging Fee: ₹${packagingFee}`);
  lines.push('');
  lines.push('🚚 *Delivery (Hashtag Dropee):*');
  lines.push(`   Base Fee: ₹${deliveryBaseFee}`);
  if (deliveryKm > 0) {
    lines.push(`   Distance: ${deliveryKm} km × ₹${deliveryPerKm} = ₹${deliveryKmFee}`);
  }
  lines.push(`   Total Delivery: ₹${totalDelivery}`);

  lines.push('');
  lines.push(`*Grand Total: ₹${grandTotal.toFixed(2)}*`);

  lines.push('');
  lines.push(`💳 Payment Method: ${formData.paymentMethod === 'gpay' ? 'GPay (UPI)' : 'Cash on Delivery'}`);

  if (formData.paymentMethod === 'gpay') {
    lines.push('', '📸 *Payment screenshot will follow*');
  }

  lines.push('', 'Thank you for ordering! 🙏');

  return encodeURIComponent(lines.join('\n'));
};

export const generateWhatsAppLink = (
  phoneNumber: string,
  items: CartItem[],
  subtotal: number,
  discount: number,
  formData: CheckoutFormData,
  packagingFee?: number,
  deliveryBaseFee?: number,
  deliveryKm?: number,
  deliveryPerKm?: number
): string => {
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
  const message = formatOrderMessage(items, subtotal, discount, formData, packagingFee, deliveryBaseFee, deliveryKm, deliveryPerKm);
  return `https://wa.me/${cleanPhone}?text=${message}`;
};
