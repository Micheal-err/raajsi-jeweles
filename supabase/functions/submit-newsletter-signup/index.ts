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
        JSON.stringify({ error: "Too many newsletter signup attempts. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json();
    if (!body.email) {
      return new Response(JSON.stringify({ error: "Email is required." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { error } = await admin.from("newsletter_subscribers").insert({
      email: body.email,
      source: body.source || "footer",
    });

    if (error) {
      if (error.code === "23505") {
        return new Response(JSON.stringify({ success: true, message: "Already subscribed." }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
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
