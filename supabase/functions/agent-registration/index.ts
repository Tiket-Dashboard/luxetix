import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const XENDIT_SECRET_KEY = Deno.env.get("XENDIT_SECRET_KEY");
const XENDIT_BASE_URL = "https://api.xendit.co";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Get the JWT from authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { action, ...params } = await req.json();
    console.log(`Agent registration action: ${action}`, { userId: user.id, ...params });

    switch (action) {
      case "get_settings": {
        const { data: settings, error } = await supabase
          .from("agent_settings")
          .select("*")
          .limit(1)
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ settings }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "register": {
        const { business_name, business_description, bank_account_name, bank_account_number, bank_name, payment_method } = params;

        if (!business_name) {
          return new Response(
            JSON.stringify({ error: "Business name is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Check if already registered as active agent
        const { data: existingAgent } = await supabaseAdmin
          .from("agents")
          .select("id, registration_status")
          .eq("user_id", user.id)
          .maybeSingle();

        if (existingAgent && existingAgent.registration_status === "active") {
          return new Response(
            JSON.stringify({ error: "You are already an active agent", status: existingAgent.registration_status }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Delete any expired pending registrations to allow retry
        await supabaseAdmin
          .from("agent_registrations")
          .delete()
          .eq("user_id", user.id)
          .eq("status", "pending")
          .lt("expires_at", new Date().toISOString());

        // Get agent settings for registration fee
        const { data: settings } = await supabaseAdmin
          .from("agent_settings")
          .select("registration_fee, default_max_events")
          .limit(1)
          .single();

        const registrationFee = settings?.registration_fee || 500000;
        const defaultMaxEvents = settings?.default_max_events || 5;

        // Get user profile
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("full_name, phone")
          .eq("user_id", user.id)
          .single();

        // Create registration record
        const registrationId = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        const { error: regError } = await supabaseAdmin
          .from("agent_registrations")
          .insert({
            id: registrationId,
            user_id: user.id,
            business_name,
            business_description,
            bank_account_name,
            bank_account_number,
            bank_name,
            registration_fee: registrationFee,
            payment_method,
            expires_at: expiresAt.toISOString(),
          });

        if (regError) throw regError;

        // Create Xendit payment
        if (!XENDIT_SECRET_KEY) {
          throw new Error("XENDIT_SECRET_KEY not configured");
        }

        const xenditAuth = btoa(`${XENDIT_SECRET_KEY}:`);
        let paymentData: any = null;
        let paymentId: string = "";

        if (payment_method === "va_bca" || payment_method === "va_mandiri" || payment_method === "va_bni" || payment_method === "va_bri") {
          const bankCode = payment_method.replace("va_", "").toUpperCase();
          
          const vaResponse = await fetch(`${XENDIT_BASE_URL}/callback_virtual_accounts`, {
            method: "POST",
            headers: {
              "Authorization": `Basic ${xenditAuth}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              external_id: `AGENT-REG-${registrationId}`,
              bank_code: bankCode,
              name: profile?.full_name || user.email?.split("@")[0] || "Agent",
              expected_amount: registrationFee,
              is_closed: true,
              is_single_use: true,
              expiration_date: expiresAt.toISOString(),
            }),
          });

          if (!vaResponse.ok) {
            const errorText = await vaResponse.text();
            console.error("Xendit VA Error:", errorText);
            throw new Error(`Xendit VA creation failed: ${errorText}`);
          }

          paymentData = await vaResponse.json();
          paymentId = paymentData.id;
          console.log("VA created:", paymentData);
        } else if (payment_method === "qris") {
          const qrisResponse = await fetch(`${XENDIT_BASE_URL}/qr_codes`, {
            method: "POST",
            headers: {
              "Authorization": `Basic ${xenditAuth}`,
              "Content-Type": "application/json",
              "api-version": "2022-07-31",
            },
            body: JSON.stringify({
              reference_id: `AGENT-REG-${registrationId}`,
              type: "DYNAMIC",
              currency: "IDR",
              amount: registrationFee,
              expires_at: expiresAt.toISOString(),
            }),
          });

          if (!qrisResponse.ok) {
            const errorText = await qrisResponse.text();
            console.error("Xendit QRIS Error:", errorText);
            throw new Error(`Xendit QRIS creation failed: ${errorText}`);
          }

          paymentData = await qrisResponse.json();
          paymentId = paymentData.id;
          console.log("QRIS created:", paymentData);
        } else {
          throw new Error("Invalid payment method");
        }

        // Update registration with payment info
        await supabaseAdmin
          .from("agent_registrations")
          .update({
            payment_id: paymentId,
            payment_data: paymentData,
          })
          .eq("id", registrationId);

        return new Response(
          JSON.stringify({
            success: true,
            registration_id: registrationId,
            payment_data: paymentData,
            amount: registrationFee,
            expires_at: expiresAt.toISOString(),
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "check_status": {
        const { data: registration } = await supabaseAdmin
          .from("agent_registrations")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const { data: agent } = await supabaseAdmin
          .from("agents")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        return new Response(
          JSON.stringify({ registration, agent }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Unknown action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error: unknown) {
    console.error("Error in agent-registration function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
