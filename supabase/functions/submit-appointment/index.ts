import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// Simple rate limiter: max 5 submissions per 10 minutes per IP
const rateMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(key: string, limit = 5, windowMs = 600000): boolean {
  const now = Date.now();
  const record = rateMap.get(key);
  if (!record || now > record.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  if (record.count >= limit) return true;
  record.count += 1;
  return false;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown-ip";
    if (isRateLimited(clientIp)) {
      return new Response(
        JSON.stringify({
          error: "Too many appointment requests. Please try again in 10 minutes.",
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json();
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data, error } = await admin
      .from("appointments")
      .insert({
        full_name: body.full_name || body.name || "Anonymous",
        email: body.email || "",
        phone: body.phone || null,
        requested_date: body.requested_date || new Date().toISOString().slice(0, 10),
        requested_time: body.requested_time || "11:00",
        notes: body.notes || body.interests || null,
        user_id: body.user_id || null,
      })
      .select("id")
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, appointment_id: data.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
