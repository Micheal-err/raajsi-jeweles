// Supabase Edge Function: verify-razorpay-payment
//
// This is the piece that was completely missing from checkout.tsx.
// The client-side Razorpay `handler` callback is NOT proof of payment —
// it's just JS running in the customer's browser. This function is the
// only thing that's allowed to mark an order "confirmed": it checks the
// HMAC-SHA256 signature Razorpay returns, then independently asks
// Razorpay's API for the actual captured amount/status of the payment
// (never trusting anything the client claims) before touching the DB.
//
// Deploy: supabase functions deploy verify-razorpay-payment
// Secrets needed: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY are
// auto-injected by the Supabase Edge Runtime.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID") ?? "";
const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

interface ReqBody {
  db_order_id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return json({ error: "Razorpay is not configured on the server." }, 500);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Not authenticated." }, 401);

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Not authenticated." }, 401);
    const userId = userData.user.id;

    const body = (await req.json()) as ReqBody;
    const { db_order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
    if (!db_order_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return json({ error: "Missing verification fields." }, 400);
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Confirm this order belongs to the caller and is still pending payment.
    const { data: order, error: orderErr } = await admin
      .from("orders")
      .select("id, user_id, status, total, items")
      .eq("id", db_order_id)
      .single();

    if (orderErr || !order) return json({ error: "Order not found." }, 404);
    if (order.user_id !== userId) return json({ error: "Not your order." }, 403);
    if (order.status !== "payment_pending") {
      return json({ error: `Order is not awaiting payment (status: ${order.status}).` }, 409);
    }

    // 1. Verify the signature Razorpay sent back to the browser.
    const signatureOk = await verifySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      RAZORPAY_KEY_SECRET,
    );
    if (!signatureOk) {
      await releaseOrder(admin, db_order_id, "Payment signature verification failed.");
      return json({ error: "Payment verification failed." }, 400);
    }

    // 2. Independently ask Razorpay what actually happened — never trust
    // the client's word for the amount or status, only the signature-backed
    // IDs plus what Razorpay's own API reports for them.
    const payRes = await fetch(`https://api.razorpay.com/v1/payments/${razorpay_payment_id}`, {
      headers: { Authorization: "Basic " + btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`) },
    });
    if (!payRes.ok) {
      await releaseOrder(admin, db_order_id, "Could not verify payment with Razorpay.");
      return json({ error: "Could not verify payment with Razorpay." }, 502);
    }
    const payment = await payRes.json();

    const expectedPaise = Math.round(Number(order.total) * 100);
    const paymentOk =
      payment.order_id === razorpay_order_id &&
      payment.status === "captured" &&
      payment.amount === expectedPaise;

    if (!paymentOk) {
      await releaseOrder(admin, db_order_id, "Payment amount/status mismatch.");
      return json({ error: "Payment could not be verified." }, 400);
    }

    // 3. Genuinely paid — confirm the order and convert the reservations.
    const { error: updErr } = await admin
      .from("orders")
      .update({
        status: "confirmed",
        updated_at: new Date().toISOString(),
        items: (order.items as Array<Record<string, unknown>>).map((i) => ({
          ...i,
          payment_id: razorpay_payment_id,
        })),
      })
      .eq("id", db_order_id);

    if (updErr) return json({ error: "Payment verified but order update failed." }, 500);

    await admin
      .from("stock_reservations")
      .update({ status: "converted" })
      .eq("order_id", db_order_id)
      .eq("status", "active");

    const artworkIds = (order.items as Array<{ artwork_id?: string }>)
      .map((i) => i.artwork_id)
      .filter(Boolean) as string[];

    if (artworkIds.length > 0) {
      await admin.from("artworks").update({ availability: "sold" }).in("id", artworkIds);
    }

    return json({ success: true, order_id: db_order_id });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});

async function releaseOrder(
  admin: ReturnType<typeof createClient>,
  orderId: string,
  reason: string,
) {
  await admin
    .from("orders")
    .update({ status: "payment_failed", cancel_reason: reason })
    .eq("id", orderId);

  const { data: reservations } = await admin
    .from("stock_reservations")
    .select("artwork_id")
    .eq("order_id", orderId)
    .eq("status", "active");

  await admin
    .from("stock_reservations")
    .update({ status: "released" })
    .eq("order_id", orderId)
    .eq("status", "active");

  const artworkIds = (reservations ?? []).map((r) => r.artwork_id as string);
  if (artworkIds.length > 0) {
    await admin.from("artworks").update({ availability: "available" }).in("id", artworkIds);
  }
}

async function verifySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string,
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`${orderId}|${paymentId}`),
  );
  const hex = Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (hex.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ signature.charCodeAt(i);
  return diff === 0;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
