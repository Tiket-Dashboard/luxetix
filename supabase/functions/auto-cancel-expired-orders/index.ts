import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("Starting auto-cancel expired orders job...");

    // Find all expired pending orders
    const { data: expiredOrders, error: fetchError } = await supabaseClient
      .from("orders")
      .select("id")
      .eq("status", "pending")
      .lt("expires_at", new Date().toISOString());

    if (fetchError) {
      console.error("Error fetching expired orders:", fetchError);
      throw new Error("Failed to fetch expired orders");
    }

    console.log(`Found ${expiredOrders?.length || 0} expired orders`);

    if (!expiredOrders || expiredOrders.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No expired orders found",
          cancelled_count: 0 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    let cancelledCount = 0;
    const errors: string[] = [];

    for (const order of expiredOrders) {
      try {
        // Get order items to restore ticket quantities
        const { data: orderItems, error: itemsError } = await supabaseClient
          .from("order_items")
          .select("id, ticket_type_id, quantity")
          .eq("order_id", order.id);

        if (itemsError) {
          console.error(`Error fetching items for order ${order.id}:`, itemsError);
          errors.push(`Order ${order.id}: Failed to fetch items`);
          continue;
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
              const { error: updateTicketError } = await supabaseClient
                .from("ticket_types")
                .update({
                  available_quantity: ticketType.available_quantity + item.quantity,
                })
                .eq("id", item.ticket_type_id);

              if (updateTicketError) {
                console.error(`Error restoring quantity for ticket ${item.ticket_type_id}:`, updateTicketError);
              } else {
                console.log(`Restored ${item.quantity} tickets for ticket_type ${item.ticket_type_id}`);
              }
            }
          }
        }

        // Update order status to expired
        const { error: updateError } = await supabaseClient
          .from("orders")
          .update({ status: "expired" })
          .eq("id", order.id);

        if (updateError) {
          console.error(`Error updating order ${order.id}:`, updateError);
          errors.push(`Order ${order.id}: Failed to update status`);
          continue;
        }

        cancelledCount++;
        console.log(`Successfully cancelled order ${order.id}`);
      } catch (orderError) {
        const errorMessage = orderError instanceof Error ? orderError.message : "Unknown error";
        console.error(`Error processing order ${order.id}:`, errorMessage);
        errors.push(`Order ${order.id}: ${errorMessage}`);
      }
    }

    console.log(`Auto-cancel job completed. Cancelled ${cancelledCount} orders.`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Cancelled ${cancelledCount} expired orders`,
        cancelled_count: cancelledCount,
        total_expired: expiredOrders.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Auto-cancel job error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
