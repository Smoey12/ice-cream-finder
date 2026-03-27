import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const demoVendors = [
  { email: "demo-vendor@icecream.test", password: "demo1234", name: "AI Ice Cream Bot", business: "AI Ices 🤖🍦", lat: 51.5074, lng: -0.1278 },
  { email: "demo-manchester@icecream.test", password: "demo1234", name: "Manchester Scoops", business: "Manchester Scoops 🍨", lat: 53.4808, lng: -2.2426 },
  { email: "demo-birmingham@icecream.test", password: "demo1234", name: "Brum Cones", business: "Brum Cones 🍦", lat: 52.4862, lng: -1.8904 },
  { email: "demo-edinburgh@icecream.test", password: "demo1234", name: "Edinburgh Gelato", business: "Edinburgh Gelato 🏴󠁧󠁢󠁳󠁣󠁴󠁿", lat: 55.9533, lng: -3.1883 },
  { email: "demo-cardiff@icecream.test", password: "demo1234", name: "Cardiff Whippy", business: "Cardiff Whippy 🏴󠁧󠁢󠁷󠁬󠁳󠁿", lat: 51.4816, lng: -3.1791 },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const results: any[] = [];

  for (const v of demoVendors) {
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existing = existingUsers?.users?.find((u) => u.email === v.email);

    let userId: string;
    if (existing) {
      userId = existing.id;
    } else {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: v.email,
        password: v.password,
        email_confirm: true,
        user_metadata: { role: "vendor", full_name: v.name, business_name: v.business, billing_cycle: "monthly" },
      });
      if (error) { results.push({ email: v.email, error: error.message }); continue; }
      userId = data.user.id;
    }

    await supabaseAdmin.from("profiles").upsert({
      id: userId, role: "vendor", full_name: v.name, business_name: v.business,
      billing_cycle: "monthly", is_active: true,
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    });

    await supabaseAdmin.from("vendor_locations").upsert(
      { vendor_id: userId, latitude: v.lat, longitude: v.lng, is_live: true, last_updated: new Date().toISOString() },
      { onConflict: "vendor_id" }
    );

    results.push({ email: v.email, business: v.business, success: true });
  }

  return new Response(JSON.stringify({ results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
