import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-callback-token",
};

serve(async (req) => {
  console.log("=== Webhook received ===");
  console.log("Method:", req.method);
  console.log("URL:", req.url);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    console.log("Webhook body:", JSON.stringify(body, null, 2));

    // Determine webhook type and extract order_id
    let orderId: string | null = null;
    let status: string = "pending";
    let paymentMethod: string | null = null;

    // Virtual Account callback - check multiple possible fields
    if (body.callback_virtual_account_id || body.external_id || body.owner_id) {
      orderId = body.external_id;
      if (body.status === "COMPLETED" || body.payment_status === "PAID" || body.status === "ACTIVE") {
        // For VA, payment is complete when we receive the callback
        status = "paid";
      }
      paymentMethod = "VA";
      console.log("VA Payment callback for order:", orderId, "Status:", status);
    }

    // E-wallet callback
    if (body.data?.reference_id || body.reference_id) {
      orderId = body.data?.reference_id || body.reference_id;
      const ewalletStatus = body.data?.status || body.status;
      if (ewalletStatus === "SUCCEEDED" || ewalletStatus === "COMPLETED") {
        status = "paid";
      } else if (ewalletStatus === "FAILED" || ewalletStatus === "EXPIRED") {
        status = "expired";
      }
      paymentMethod = "EWALLET";
      console.log("E-wallet callback for order:", orderId, "Status:", status);
    }

    // QRIS callback - handle different payload structures
    if (body.qr_code?.reference_id || (body.event === "qr.payment" && body.data?.reference_id)) {
      orderId = body.qr_code?.reference_id || body.data?.reference_id;
      const qrisStatus = body.status || body.data?.status;
      if (qrisStatus === "COMPLETED" || qrisStatus === "SUCCEEDED") {
        status = "paid";
      }
      paymentMethod = "QRIS";
      console.log("QRIS callback for order:", orderId, "Status:", status);
    }

    // FVA (Fixed Virtual Account) paid callback
    if (body.payment_id && body.external_id && body.paid_amount) {
      orderId = body.external_id;
      status = "paid";
      paymentMethod = "VA";
      console.log("VA Paid callback for order:", orderId, "Amount:", body.paid_amount);
    }

    if (!orderId) {
      console.log("Could not determine order ID from webhook. Body keys:", Object.keys(body));
      return new Response(
        JSON.stringify({ success: true, message: "Webhook received but no order ID found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch order
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("id, status")
      .eq("id", orderId)
      .single();

    if (fetchError || !order) {
      console.log("Order not found:", orderId, "Error:", fetchError?.message);
      return new Response(
        JSON.stringify({ success: true, message: "Order not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Found order:", order.id, "Current status:", order.status, "New status:", status);

    // Only update if status is changing to paid (prevent downgrade)
    if (order.status !== "paid" && status === "paid") {
      const updateData: Record<string, unknown> = { status };
      if (paymentMethod) {
        updateData.payment_method = paymentMethod;
      }

      const { error: updateError } = await supabase
        .from("orders")
        .update(updateData)
        .eq("id", orderId);

      if (updateError) {
        console.error("Failed to update order:", updateError);
        throw updateError;
      }

      console.log("Order updated successfully:", orderId, "New status:", status);

      // Generate ticket codes for order items
      const { data: orderItems, error: itemsError } = await supabase
        .from("order_items")
        .select("id, ticket_code, quantity")
        .eq("order_id", orderId);

      if (!itemsError && orderItems) {
        for (const item of orderItems) {
          if (!item.ticket_code) {
            // Generate unique ticket codes for each quantity
            for (let i = 0; i < item.quantity; i++) {
              const ticketCode = `TKT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
              
              // For first item, update the existing record
              if (i === 0) {
                await supabase
                  .from("order_items")
                  .update({ ticket_code: ticketCode })
                  .eq("id", item.id);
                console.log("Generated ticket code:", ticketCode, "for item:", item.id);
              }
            }
          }
        }
      }
    } else {
      console.log("Status not changed. Current:", order.status, "Incoming:", status);
    }

    return new Response(
      JSON.stringify({ success: true, order_id: orderId, new_status: status }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Webhook error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
