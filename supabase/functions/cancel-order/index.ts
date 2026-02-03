import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Get the user from the token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { order_id } = await req.json();

    if (!order_id) {
      throw new Error("Order ID is required");
    }

    // Get the order and verify ownership
    const { data: order, error: orderError } = await supabaseClient
      .from("orders")
      .select("id, user_id, status")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found");
    }

    if (order.user_id !== user.id) {
      throw new Error("You can only cancel your own orders");
    }

    if (order.status !== "pending") {
      throw new Error("Only pending orders can be cancelled");
    }

    // Get order items to restore ticket quantities
    const { data: orderItems, error: itemsError } = await supabaseClient
      .from("order_items")
      .select("id, ticket_type_id, quantity")
      .eq("order_id", order_id);

    if (itemsError) {
      throw new Error("Failed to get order items");
    }

    // Restore ticket quantities for each order item
    for (const item of orderItems || []) {
      if (item.ticket_type_id) {
        // Get current available quantity
        const { data: ticketType, error: ticketError } = await supabaseClient
          .from("ticket_types")
          .select("available_quantity")
          .eq("id", item.ticket_type_id)
          .single();

        if (!ticketError && ticketType) {
          // Update with restored quantity
          await supabaseClient
            .from("ticket_types")
            .update({
              available_quantity: ticketType.available_quantity + item.quantity,
            })
            .eq("id", item.ticket_type_id);
        }
      }
    }

    // Update order status to cancelled
    const { error: updateError } = await supabaseClient
      .from("orders")
      .update({ status: "cancelled" })
      .eq("id", order_id);

    if (updateError) {
      throw new Error("Failed to cancel order");
    }

    return new Response(
      JSON.stringify({ success: true, message: "Order cancelled successfully" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Cancel order error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
