import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Payment expiration: 5 minutes
const PAYMENT_EXPIRY_MINUTES = 5;

interface PaymentRequest {
  order_id: string;
  amount: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  payment_method: "VA" | "EWALLET" | "QRIS";
  bank_code?: string; // For VA: BCA, BNI, BRI, MANDIRI, PERMATA, etc.
  ewallet_type?: string; // For E-wallet: OVO, DANA, SHOPEEPAY, LINKAJA
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const xenditSecretKey = Deno.env.get("XENDIT_SECRET_KEY");
    if (!xenditSecretKey) {
      throw new Error("XENDIT_SECRET_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const path = url.pathname.split("/").pop();

    // Create payment
    if (req.method === "POST" && path === "xendit-payment") {
      const body: PaymentRequest = await req.json();
      console.log("Creating payment:", body);

      const { order_id, amount, customer_name, customer_email, customer_phone, payment_method, bank_code, ewallet_type } = body;

      // Validate required fields
      if (!order_id || !amount || !customer_name || !customer_email || !payment_method) {
        return new Response(
          JSON.stringify({ error: "Missing required fields" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const authHeader = btoa(`${xenditSecretKey}:`);
      let paymentResult;
      let paymentId;
      let paymentUrl;

      const expirationDate = new Date(Date.now() + PAYMENT_EXPIRY_MINUTES * 60 * 1000);

      if (payment_method === "VA") {
        // Create Virtual Account
        const vaResponse = await fetch("https://api.xendit.co/callback_virtual_accounts", {
          method: "POST",
          headers: {
            "Authorization": `Basic ${authHeader}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            external_id: order_id,
            bank_code: bank_code || "BCA",
            name: customer_name.substring(0, 50),
            expected_amount: amount,
            is_closed: true,
            is_single_use: true,
            expiration_date: expirationDate.toISOString(),
          }),
        });

        paymentResult = await vaResponse.json();
        console.log("VA Response:", paymentResult);

        if (!vaResponse.ok) {
          throw new Error(paymentResult.message || "Failed to create VA");
        }

        paymentId = paymentResult.id;
        paymentUrl = null;

      } else if (payment_method === "EWALLET") {
        // Create E-wallet payment
        const ewalletResponse = await fetch("https://api.xendit.co/ewallets/charges", {
          method: "POST",
          headers: {
            "Authorization": `Basic ${authHeader}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reference_id: order_id,
            currency: "IDR",
            amount: amount,
            checkout_method: "ONE_TIME_PAYMENT",
            channel_code: `ID_${ewallet_type || "OVO"}`,
            channel_properties: {
              mobile_number: customer_phone || "+628123456789",
              success_redirect_url: `${req.headers.get("origin") || "https://luxetix.lovable.app"}/order-success/${order_id}`,
            },
          }),
        });

        paymentResult = await ewalletResponse.json();
        console.log("E-wallet Response:", paymentResult);

        if (!ewalletResponse.ok) {
          throw new Error(paymentResult.message || "Failed to create e-wallet charge");
        }

        paymentId = paymentResult.id;
        paymentUrl = paymentResult.actions?.mobile_deeplink_checkout_url || 
                     paymentResult.actions?.desktop_web_checkout_url ||
                     paymentResult.actions?.mobile_web_checkout_url;

      } else if (payment_method === "QRIS") {
        // Create QRIS payment
        const qrisResponse = await fetch("https://api.xendit.co/qr_codes", {
          method: "POST",
          headers: {
            "Authorization": `Basic ${authHeader}`,
            "Content-Type": "application/json",
            "api-version": "2022-07-31",
          },
          body: JSON.stringify({
            reference_id: order_id,
            type: "DYNAMIC",
            currency: "IDR",
            amount: amount,
            expires_at: expirationDate.toISOString(),
          }),
        });

        paymentResult = await qrisResponse.json();
        console.log("QRIS Response:", paymentResult);

        if (!qrisResponse.ok) {
          throw new Error(paymentResult.message || "Failed to create QRIS");
        }

        paymentId = paymentResult.id;
        paymentUrl = paymentResult.qr_string;
      }

      // Update order with payment info and expiration
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          payment_method: payment_method,
          payment_id: paymentId,
          status: "pending",
          expires_at: expirationDate.toISOString(),
          payment_data: paymentResult,
        })
        .eq("id", order_id);

      if (updateError) {
        console.error("Failed to update order:", updateError);
      }

      return new Response(
        JSON.stringify({
          success: true,
          payment_id: paymentId,
          payment_url: paymentUrl,
          payment_method: payment_method,
          payment_data: paymentResult,
          expires_at: expirationDate.toISOString(),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
