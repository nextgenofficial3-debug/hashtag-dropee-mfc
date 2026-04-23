import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { CustomerOrderListItem, DeliveryOrder, FoodOrder } from "@/types/app";

function mapFoodOrder(order: FoodOrder): CustomerOrderListItem {
  return {
    id: order.id,
    kind: "food",
    status: order.status,
    created_at: order.created_at,
    total: order.total,
    customer_address: order.customer_address,
    pickup_address: null,
    delivery_address: order.customer_address,
    customer_phone: order.customer_phone,
    items: Array.isArray(order.items) ? (order.items as CustomerOrderListItem["items"]) : null,
    special_instructions: order.special_instructions,
    package_description: null,
  };
}

function mapDeliveryOrder(order: DeliveryOrder): CustomerOrderListItem {
  return {
    id: order.id,
    kind: "delivery",
    status: order.status,
    created_at: order.created_at,
    total: order.total_fee,
    customer_address: order.delivery_address,
    pickup_address: order.pickup_address,
    delivery_address: order.delivery_address,
    customer_phone: order.customer_phone,
    items: null,
    special_instructions: order.special_instructions,
    package_description: order.package_description,
  };
}

export function useCustomerOrders(userId?: string) {
  const [orders, setOrders] = useState<CustomerOrderListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setOrders([]);
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function fetchOrders() {
      setLoading(true);

      const [foodOrdersResult, deliveryOrdersResult] = await Promise.all([
        supabase.from("mfc_orders").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
        supabase.from("delivery_orders").select("*").eq("customer_user_id", userId).order("created_at", { ascending: false }),
      ]);

      if (!isMounted) {
        return;
      }

      const foodOrders = (foodOrdersResult.data || []).map(mapFoodOrder);
      const deliveryOrders = (deliveryOrdersResult.data || []).map(mapDeliveryOrder);

      setOrders(
        [...foodOrders, ...deliveryOrders].sort(
          (left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
        )
      );
      setLoading(false);
    }

    fetchOrders();

    const foodChannel = supabase
      .channel(`customer-food-orders-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "mfc_orders", filter: `user_id=eq.${userId}` },
        fetchOrders
      )
      .subscribe();

    const deliveryChannel = supabase
      .channel(`customer-delivery-orders-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "delivery_orders", filter: `customer_user_id=eq.${userId}` },
        fetchOrders
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(foodChannel);
      supabase.removeChannel(deliveryChannel);
    };
  }, [userId]);

  return { orders, loading };
}
