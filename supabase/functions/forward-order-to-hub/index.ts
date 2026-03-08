import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ORDER_HUB_URL = Deno.env.get("ORDER_HUB_URL");
    const ORDER_HUB_API_KEY = Deno.env.get("ORDER_HUB_API_KEY");

    if (!ORDER_HUB_URL || !ORDER_HUB_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Hub credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { orderId, customerName, customerPhone, customerAddress, items, total, specialInstructions } = body;

    // Forward to hub
    const hubResponse = await fetch(`${ORDER_HUB_URL}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ORDER_HUB_API_KEY,
      },
      body: JSON.stringify({
        source: "cafe",
        order_id: orderId,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_address: customerAddress,
        items,
        total,
        special_notes: specialInstructions || "",
      }),
    });

    if (!hubResponse.ok) {
      const errorText = await hubResponse.text();
      console.error("Hub API error:", hubResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to forward order to hub", details: errorText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const hubData = await hubResponse.json();
    const hubOrderId = hubData.hub_order_id || hubData.id || hubData.orderId;

    // Update local order with hub_order_id
    if (hubOrderId) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      await supabase.from("orders").update({ hub_order_id: hubOrderId }).eq("id", orderId);
    }

    return new Response(
      JSON.stringify({ hub_order_id: hubOrderId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error forwarding order:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
