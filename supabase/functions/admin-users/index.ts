import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get the JWT from authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the user is admin
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is admin
    const { data: adminRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!adminRole) {
      return new Response(
        JSON.stringify({ error: "Not authorized - admin only" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, ...params } = await req.json();
    console.log(`Admin action: ${action}`, params);

    switch (action) {
      case "list_users": {
        // Get all users from auth.users with their profiles and roles
        const { data: authUsers, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
        
        if (usersError) {
          console.error("Error fetching users:", usersError);
          throw usersError;
        }

        // Get all profiles
        const { data: profiles } = await supabaseAdmin
          .from("profiles")
          .select("*");

        // Get all user roles
        const { data: userRoles } = await supabaseAdmin
          .from("user_roles")
          .select("*");

        // Get all agents
        const { data: agents } = await supabaseAdmin
          .from("agents")
          .select("*");

        // Map users with their profiles and roles
        const users = authUsers.users.map((authUser) => {
          const profile = profiles?.find((p) => p.user_id === authUser.id);
          const roles = userRoles?.filter((r) => r.user_id === authUser.id).map((r) => r.role) || [];
          const agent = agents?.find((a) => a.user_id === authUser.id);

          return {
            id: authUser.id,
            email: authUser.email,
            created_at: authUser.created_at,
            last_sign_in_at: authUser.last_sign_in_at,
            full_name: profile?.full_name,
            phone: profile?.phone,
            status: profile?.status || "active",
            status_message: profile?.status_message,
            roles,
            is_agent: !!agent,
            agent_status: agent?.registration_status,
          };
        });

        return new Response(
          JSON.stringify({ users }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "create_user": {
        const { email, password, full_name, role } = params;
        
        if (!email || !password) {
          return new Response(
            JSON.stringify({ error: "Email and password are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (password.length < 6) {
          return new Response(
            JSON.stringify({ error: "Password must be at least 6 characters" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Create user using admin API
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true, // Auto confirm email
          user_metadata: { full_name: full_name || "" },
        });

        if (createError) {
          console.error("Error creating user:", createError);
          throw createError;
        }

        // If role is specified and not 'user', add the role
        if (role && role !== "user" && newUser.user) {
          const { error: roleError } = await supabaseAdmin
            .from("user_roles")
            .insert({ user_id: newUser.user.id, role });

          if (roleError) {
            console.error("Error adding role:", roleError);
            // Don't throw, user was created successfully
          }
        }

        console.log(`User created: ${email}`);

        return new Response(
          JSON.stringify({ success: true, user: newUser.user }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "delete_user": {
        const { user_id } = params;
        
        if (!user_id) {
          return new Response(
            JSON.stringify({ error: "User ID is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Prevent deleting self
        if (user_id === user.id) {
          return new Response(
            JSON.stringify({ error: "Cannot delete your own account" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Delete user using admin API (this will cascade delete profile, roles, etc. if foreign keys are set)
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user_id);

        if (deleteError) {
          console.error("Error deleting user:", deleteError);
          throw deleteError;
        }

        console.log(`User deleted: ${user_id}`);

        return new Response(
          JSON.stringify({ success: true, message: "User deleted successfully" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "update_password": {
        const { user_id, new_password } = params;
        
        if (!user_id || !new_password) {
          return new Response(
            JSON.stringify({ error: "Missing user_id or new_password" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          user_id,
          { password: new_password }
        );

        if (updateError) {
          console.error("Error updating password:", updateError);
          throw updateError;
        }

        console.log(`Password updated for user: ${user_id}`);

        return new Response(
          JSON.stringify({ success: true, message: "Password updated successfully" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "update_status": {
        const { user_id, status, status_message } = params;
        
        if (!user_id || !status) {
          return new Response(
            JSON.stringify({ error: "Missing user_id or status" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Update profile status
        const { error: updateError } = await supabaseAdmin
          .from("profiles")
          .update({ 
            status, 
            status_message: status_message || null,
            updated_at: new Date().toISOString()
          })
          .eq("user_id", user_id);

        if (updateError) {
          console.error("Error updating status:", updateError);
          throw updateError;
        }

        console.log(`Status updated for user: ${user_id} to ${status}`);

        return new Response(
          JSON.stringify({ success: true, message: "Status updated successfully" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "update_role": {
        const { user_id, role, add } = params;
        
        if (!user_id || !role) {
          return new Response(
            JSON.stringify({ error: "Missing user_id or role" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (add) {
          // Add role
          const { error: insertError } = await supabaseAdmin
            .from("user_roles")
            .upsert({ user_id, role }, { onConflict: "user_id,role" });

          if (insertError) {
            console.error("Error adding role:", insertError);
            throw insertError;
          }
        } else {
          // Remove role
          const { error: deleteError } = await supabaseAdmin
            .from("user_roles")
            .delete()
            .eq("user_id", user_id)
            .eq("role", role);

          if (deleteError) {
            console.error("Error removing role:", deleteError);
            throw deleteError;
          }
        }

        console.log(`Role ${add ? "added" : "removed"} for user: ${user_id}, role: ${role}`);

        return new Response(
          JSON.stringify({ success: true, message: `Role ${add ? "added" : "removed"} successfully` }),
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
    console.error("Error in admin-users function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
