import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-callback-token",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    console.log("Agent webhook received:", JSON.stringify(body, null, 2));

    // Extract registration ID from external_id or reference_id
    let registrationId: string | null = null;
    const externalId = body.external_id || body.data?.external_id || body.reference_id || body.data?.reference_id;
    
    if (externalId && externalId.startsWith("AGENT-REG-")) {
      registrationId = externalId.replace("AGENT-REG-", "");
    }

    if (!registrationId) {
      console.log("Not an agent registration webhook, ignoring");
      return new Response(
        JSON.stringify({ success: true, message: "Not an agent registration" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine payment status
    let isPaid = false;
    const status = body.status || body.data?.status;
    
    if (status === "COMPLETED" || status === "PAID" || status === "SETTLED" || status === "ACTIVE") {
      isPaid = true;
    }

    // For VA callbacks, check the event type
    if (body.callback_virtual_account_id || body.payment_id) {
      isPaid = true;
    }

    console.log(`Processing agent registration ${registrationId}, isPaid: ${isPaid}`);

    if (isPaid) {
      // Get registration details
      const { data: registration, error: regError } = await supabaseAdmin
        .from("agent_registrations")
        .select("*")
        .eq("id", registrationId)
        .single();

      if (regError || !registration) {
        console.error("Registration not found:", regError);
        throw new Error("Registration not found");
      }

      // Update registration status
      await supabaseAdmin
        .from("agent_registrations")
        .update({
          status: "paid",
          processed_at: new Date().toISOString(),
        })
        .eq("id", registrationId);

      // Get agent settings
      const { data: settings } = await supabaseAdmin
        .from("agent_settings")
        .select("default_max_events")
        .limit(1)
        .single();

      // Create agent record
      const { error: agentError } = await supabaseAdmin
        .from("agents")
        .insert({
          user_id: registration.user_id,
          business_name: registration.business_name,
          business_description: registration.business_description,
          bank_account_name: registration.bank_account_name,
          bank_account_number: registration.bank_account_number,
          bank_name: registration.bank_name,
          max_events: settings?.default_max_events || 5,
          registration_status: "active",
          registration_payment_id: registration.payment_id,
        });

      if (agentError) {
        console.error("Error creating agent:", agentError);
        throw agentError;
      }

      // Add agent role
      await supabaseAdmin
        .from("user_roles")
        .upsert({
          user_id: registration.user_id,
          role: "agent",
        }, { onConflict: "user_id,role" });

      console.log(`Agent created successfully for user: ${registration.user_id}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in agent-webhook:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
