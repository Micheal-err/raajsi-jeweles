import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!RESEND_API_KEY) {
      console.log(
        `[Newsletter Welcome] RESEND_API_KEY not configured. Simulated welcome email for: ${email}`,
      );
      return new Response(
        JSON.stringify({ message: "Simulated welcome email sent (RESEND_API_KEY missing)" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Kalaneri Art Gallery <hello@kalaneri.com>",
        to: [email],
        subject: "Welcome to Kalaneri Art Gallery Archive",
        html: `
          <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 32px 20px; color: #111111;">
            <div style="border-bottom: 1px solid #e2e0dc; padding-bottom: 16px; margin-bottom: 24px; text-align: center;">
              <h1 style="font-size: 24px; font-weight: 400; margin: 0; letter-spacing: -0.02em;">Kalaneri Art Gallery</h1>
              <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.22em; color: #777777; margin-top: 4px;">Jaipur · Contemporary Archive</p>
            </div>
            
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              Thank you for subscribing to the Kalaneri Archive.
            </p>

            <p style="font-size: 15px; line-height: 1.6; color: #444444; margin-bottom: 24px;">
              You will receive curated exhibition previews, new acquisition announcements, and quiet essays on contemporary Indian art. Never more than one letter a month.
            </p>

            <div style="padding: 20px; background-color: #faf9f7; border: 1px solid #e2e0dc; margin-bottom: 28px;">
              <p style="font-size: 13px; font-style: italic; margin: 0; color: #555555;">
                "Every work with certified provenance — authenticity is priceless."
              </p>
            </div>

            <p style="font-size: 15px; line-height: 1.6; margin-top: 32px; border-top: 1px solid #e2e0dc; padding-top: 20px;">
              Warm regards,<br>
              <strong>— Team Kalaneri</strong>
            </p>
          </div>
        `,
      }),
    });

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
