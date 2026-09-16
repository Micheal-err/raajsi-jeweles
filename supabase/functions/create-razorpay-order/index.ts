// Supabase Edge Function: create-razorpay-order
//
// Replaces the client-side amount calculation in checkout.tsx. This
// function is the ONLY place that should decide what a customer owes:
// it re-fetches real prices from the DB, atomically reserves each
// artwork (reusing the existing reserve_artwork RPC so the race-condition
// fix and this fix share one source of truth), creates a pending order
// row, and asks Razorpay for a real order_id tied to a server-computed
// amount.
//
// Deploy: supabase functions deploy create-razorpay-order
// Secrets needed (supabase secrets set ...):
//   RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY are
// auto-injected by the Supabase Edge Runtime — no need to set them.

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
  artwork_ids: string[];
  shipping: {
    name: string;
    email: string;
    address: string;
    city: string;
    postal: string;
    country: string;
    phone: string;
  };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return json({ error: "Razorpay is not configured on the server." }, 500);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Not authenticated." }, 401);

    // User-scoped client — verifies the caller's JWT with Supabase Auth.
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Not authenticated." }, 401);
    const userId = userData.user.id;

    const body = (await req.json()) as ReqBody;
    const artworkIds = [...new Set(body.artwork_ids ?? [])];
    if (artworkIds.length === 0) return json({ error: "No items provided." }, 400);

    // Service-role client — only used for the privileged parts below.
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Re-fetch real prices — never trust a client-sent total.
    const { data: artworks, error: artErr } = await admin
      .from("artworks")
      .select("id, slug, title, availability, display_price, price_min")
      .in("id", artworkIds);

    if (artErr) return json({ error: artErr.message }, 500);
    if (!artworks || artworks.length !== artworkIds.length) {
      return json({ error: "One or more items could not be found." }, 400);
    }

    const subtotal = artworks.reduce(
      (sum, a) => sum + Number(a.display_price ?? a.price_min ?? 0),
      0,
    );
    const shippingCost = subtotal > 0 ? 2500 : 0;
    const tax = Math.round(subtotal * 0.12);
    const total = subtotal + shippingCost + tax;

    // 2. Create the order row first (status: payment_pending) so
    // reserve_artwork has a real order_id to attach reservations to.
    const { data: order, error: orderErr } = await admin
      .from("orders")
      .insert({
        user_id: userId,
        status: "payment_pending",
        subtotal,
        shipping_cost: shippingCost,
        tax_cost: tax,
        total,
        currency: "INR",
        shipping_name: body.shipping?.name ?? "",
        shipping_email: body.shipping?.email ?? userData.user.email ?? "",
        shipping_address: body.shipping?.address ?? "",
        shipping_city: body.shipping?.city ?? "",
        shipping_postal: body.shipping?.postal ?? "",
        shipping_country: body.shipping?.country ?? "India",
        notes: body.shipping?.phone ? `Phone: ${body.shipping.phone}` : null,
        items: artworks.map((a) => ({
          artwork_id: a.id,
          slug: a.slug,
          title: a.title,
          price: Number(a.display_price ?? a.price_min ?? 0),
        })),
      })
      .select("id")
      .single();

    if (orderErr || !order) return json({ error: "Could not create order." }, 500);

    // 3. Atomically reserve every artwork against this order. If any
    // fail (already reserved/sold), abort and release what succeeded —
    // this is the fix for checkout previously ignoring reserve_artwork's
    // return value.
    const reserved: string[] = [];
    for (const artworkId of artworkIds) {
      const { data: ok, error: rpcErr } = await admin.rpc("reserve_artwork", {
        p_artwork_id: artworkId,
        p_order_id: order.id,
        p_ttl_minutes: 20,
      });

      if (rpcErr || ok !== true) {
        // Roll back: release any reservations we already made, cancel the order.
        await admin
          .from("stock_reservations")
          .update({ status: "released" })
          .eq("order_id", order.id)
          .eq("status", "active");

        for (const id of reserved) {
          await admin.from("artworks").update({ availability: "available" }).eq("id", id);
        }

        await admin.from("orders").update({ status: "cancelled" }).eq("id", order.id);

        return json(
          {
            error: `"${artworks.find((a) => a.id === artworkId)?.title}" just became unavailable.`,
          },
          409,
        );
      }
      reserved.push(artworkId);
    }

    // 4. Ask Razorpay for a real order tied to the server-computed amount.
    const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`),
      },
      body: JSON.stringify({
        amount: Math.round(total * 100), // paise
        currency: "INR",
        receipt: order.id,
      }),
    });

    if (!rzpRes.ok) {
      return json({ error: `Razorpay order creation failed: ${await rzpRes.text()}` }, 502);
    }

    const rzpOrder = await rzpRes.json();

    return json({
      db_order_id: order.id,
      razorpay_order_id: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      key_id: RAZORPAY_KEY_ID,
      subtotal,
      shipping: shippingCost,
      tax,
      total,
    });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
