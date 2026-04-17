import { supabase } from "@/integrations/supabase/client";

export interface OrderCreateInput {
  customerId: string;
  customerEmail?: string;
  items: any[];
  deliveryAddress: string;
  phone: string;
  notes?: string;
  paymentMethod: string;
  subtotal: number;
  deliveryFee: number;
  distanceKm?: number;
  total: number;
}

const STATUS_MESSAGES: Record<string, string> = {
  accepted: "Your order has been accepted and is being prepared",
  preparing: "Your order is being prepared",
  assigned: "A delivery agent has been assigned to your order",
  picked_up: "Your order has been picked up and is on the way",
  delivered: "Your order has been delivered. Enjoy!",
  cancelled: "Your order has been cancelled.",
};

/**
 * Create a new order, log its status, and notify admins.
 */
export async function createOrder(input: OrderCreateInput) {
  // 1. Insert order
  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      user_id: input.customerId,
      customer_id: input.customerId,
      customer_email: input.customerEmail,
      items: input.items,
      delivery_address: input.deliveryAddress,
      phone: input.phone,
      notes: input.notes,
      payment_method: input.paymentMethod,
      subtotal: input.subtotal,
      delivery_fee: input.deliveryFee,
      distance_km: input.distanceKm,
      total_amount: input.total,
      status: "pending",
    })
    .select()
    .single();

  if (error) throw error;

  // 2. Log status
  await (supabase as any).from("order_status_logs").insert({
    order_id: order.id,
    status: "pending",
    updated_by: input.customerId,
    note: "Order placed by customer",
  });

  // 3. Notify admins via MS_admins_whitelist
  const { data: admins } = await (supabase as any)
    .from("MS_admins_whitelist")
    .select("user_id");

  if (admins && admins.length > 0) {
    const adminNotifications = admins
      .filter((a: any) => a.user_id)
      .map((a: any) => ({
        user_id: a.user_id,
        role: "admin",
        title: "🛵 New Order Received",
        message: `Order #${order.id.slice(0, 8)} — ₹${input.total}`,
        type: "new_order",
        reference_id: order.id,
        reference_type: "order",
        redirect_url: `/orders`,
        is_read: false,
      }));

    if (adminNotifications.length > 0) {
      await (supabase as any).from("notifications").insert(adminNotifications);
    }
  }

  return order;
}

/**
 * Update order status, log it, notify agent and customer.
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: string,
  updatedBy: string,
  assignedAgentId?: string
) {
  const updates: Record<string, any> = { status: newStatus };
  if (assignedAgentId) updates.agent_id = assignedAgentId;

  await supabase.from("orders").update(updates).eq("id", orderId);

  await (supabase as any).from("order_status_logs").insert({
    order_id: orderId,
    status: newStatus,
    updated_by: updatedBy,
  });

  // Notify assigned agent
  if (assignedAgentId && newStatus === "assigned") {
    await (supabase as any).from("notifications").insert({
      user_id: assignedAgentId,
      role: "agent",
      title: "📦 New Delivery Assigned",
      message: `You have a new delivery order #${orderId.slice(0, 8)}`,
      type: "new_order",
      reference_id: orderId,
      reference_type: "order",
      redirect_url: `/agent/orders/${orderId}`,
      is_read: false,
    });
  }

  // Notify customer
  const { data: order } = await supabase
    .from("orders")
    .select("user_id, customer_id")
    .eq("id", orderId)
    .single();

  const customerId = (order as any)?.user_id || (order as any)?.customer_id;
  if (customerId && STATUS_MESSAGES[newStatus]) {
    await (supabase as any).from("notifications").insert({
      user_id: customerId,
      role: "customer",
      title: "Order Update",
      message: STATUS_MESSAGES[newStatus],
      type: "order_update",
      reference_id: orderId,
      reference_type: "order",
      redirect_url: `/orders/${orderId}`,
      is_read: false,
    });
  }
}
