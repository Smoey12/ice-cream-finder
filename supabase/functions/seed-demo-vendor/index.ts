import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const email = "demo-vendor@icecream.test";
  const password = "demo1234";

  // Create auth user
  const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
  const existing = existingUsers?.users?.find((u) => u.email === email);

  let userId: string;

  if (existing) {
    userId = existing.id;
  } else {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: "vendor",
        full_name: "AI Ice Cream Bot",
        business_name: "AI Ices 🤖🍦",
        billing_cycle: "monthly",
      },
    });
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
    userId = data.user.id;
  }

  // Ensure profile exists (trigger should handle this, but just in case)
  await supabaseAdmin.from("profiles").upsert({
    id: userId,
    role: "vendor",
    full_name: "AI Ice Cream Bot",
    business_name: "AI Ices 🤖🍦",
    billing_cycle: "monthly",
    is_active: true,
    trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  });

  // Set live location in central London
  await supabaseAdmin.from("vendor_locations").upsert(
    {
      vendor_id: userId,
      latitude: 51.5074,
      longitude: -0.1278,
      is_live: true,
      last_updated: new Date().toISOString(),
    },
    { onConflict: "vendor_id" }
  );

  return new Response(
    JSON.stringify({
      success: true,
      message: "Demo vendor created! Login with demo-vendor@icecream.test / demo1234",
      email,
      password,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
