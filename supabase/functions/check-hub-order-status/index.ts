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
    const hubOrderId = body.hub_order_id;

    if (!hubOrderId) {
      return new Response(
        JSON.stringify({ error: "hub_order_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const hubResponse = await fetch(`${ORDER_HUB_URL}/api/orders/${hubOrderId}`, {
      method: "GET",
      headers: { "x-api-key": ORDER_HUB_API_KEY },
    });

    if (!hubResponse.ok) {
      const errorText = await hubResponse.text();
      return new Response(
        JSON.stringify({ error: "Failed to fetch order status", details: errorText }),
        { status: hubResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await hubResponse.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error checking hub status:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
