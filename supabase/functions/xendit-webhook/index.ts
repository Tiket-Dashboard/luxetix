import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-callback-token",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    console.log("Webhook received:", JSON.stringify(body, null, 2));

    // Determine webhook type and extract order_id
    let orderId: string | null = null;
    let status: string = "pending";
    let paymentMethod: string | null = null;

    // Virtual Account callback
    if (body.callback_virtual_account_id || body.external_id) {
      orderId = body.external_id;
      if (body.status === "COMPLETED" || body.payment_status === "PAID") {
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
        status = "failed";
      }
      paymentMethod = "EWALLET";
      console.log("E-wallet callback for order:", orderId, "Status:", status);
    }

    // QRIS callback
    if (body.qr_code?.reference_id) {
      orderId = body.qr_code.reference_id;
      if (body.status === "COMPLETED") {
        status = "paid";
      }
      paymentMethod = "QRIS";
      console.log("QRIS callback for order:", orderId, "Status:", status);
    }

    if (!orderId) {
      console.log("Could not determine order ID from webhook");
      return new Response(
        JSON.stringify({ success: true, message: "Webhook received but no order ID found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update order status
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("id, status")
      .eq("id", orderId)
      .single();

    if (fetchError || !order) {
      console.log("Order not found:", orderId);
      return new Response(
        JSON.stringify({ success: true, message: "Order not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Only update if status is changing
    if (order.status !== status) {
      const updateData: any = { status };
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

      // If payment is successful, generate ticket codes for order items
      if (status === "paid") {
        const { data: orderItems, error: itemsError } = await supabase
          .from("order_items")
          .select("id, ticket_code")
          .eq("order_id", orderId);

        if (!itemsError && orderItems) {
          for (const item of orderItems) {
            if (!item.ticket_code) {
              const ticketCode = `TKT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
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

    return new Response(
      JSON.stringify({ success: true }),
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
