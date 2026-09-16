// Supabase Edge Function: notify-order
// Triggered via Database Webhook on INSERT to public.orders
// Sends email notification to gallery and confirmation to customer
//
// To deploy:
//   1. Add RESEND_API_KEY and GALLERY_EMAIL to your Supabase project secrets
//   2. Run: supabase functions deploy notify-order
//   3. Create a Database Webhook in Supabase Dashboard:
//      - Table: orders
//      - Events: INSERT
//      - Function: notify-order

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const GALLERY_EMAIL = Deno.env.get("GALLERY_EMAIL") ?? "hello@kalaneri.art";
const FROM_EMAIL = "Kalaneri Art Gallery <noreply@kalaneri.art>";

interface OrderItem {
  artwork_id: string;
  slug: string;
  title: string;
  price: number;
}

interface OrderPayload {
  type: "INSERT";
  table: "orders";
  record: {
    id: string;
    user_id: string;
    status: string;
    shipping_name: string | null;
    shipping_email: string | null;
    shipping_address: string | null;
    shipping_city: string | null;
    shipping_country: string | null;
    shipping_postal: string | null;
    subtotal: number | null;
    shipping_cost: number | null;
    tax_cost: number | null;
    total: number | null;
    currency: string;
    items: OrderItem[];
    notes: string | null;
    created_at: string;
  };
}

const fmt = (n: number) =>
  `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n)}`;

serve(async (req: Request) => {
  try {
    const payload: OrderPayload = await req.json();
    const { record: o } = payload;

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Missing API key" }), { status: 500 });
    }

    const items = (o.items ?? []) as OrderItem[];
    const itemsHtml = items
      .map(
        (i) =>
          `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;font-style:italic">${escapeHtml(i.title)}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;font-variant-numeric:tabular-nums">${fmt(i.price)}</td></tr>`,
      )
      .join("");

    const shippingHtml = [
      o.shipping_name,
      o.shipping_address,
      [o.shipping_city, o.shipping_postal, o.shipping_country].filter(Boolean).join(", "),
    ]
      .filter(Boolean)
      .join("<br>");

    // 1. Notify gallery team
    await sendEmail({
      to: GALLERY_EMAIL,
      subject: `New order #${o.id.slice(0, 8).toUpperCase()} — ${fmt(Number(o.total ?? 0))}`,
      html: `
        <h2>New Order Received</h2>
        <p><strong>Order:</strong> #${o.id.slice(0, 8).toUpperCase()}<br>
        <strong>Date:</strong> ${new Date(o.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}<br>
        <strong>Customer:</strong> ${escapeHtml(o.shipping_name ?? "—")} (${escapeHtml(o.shipping_email ?? "—")})</p>
        
        <h3>Items</h3>
        <table style="border-collapse:collapse;width:100%;max-width:600px;font-family:sans-serif">
          ${itemsHtml}
          <tr><td style="padding:8px 12px;color:#666">Subtotal</td><td style="padding:8px 12px;text-align:right">${fmt(Number(o.subtotal ?? 0))}</td></tr>
          <tr><td style="padding:8px 12px;color:#666">Shipping</td><td style="padding:8px 12px;text-align:right">${fmt(Number(o.shipping_cost ?? 0))}</td></tr>
          <tr><td style="padding:8px 12px;color:#666">Tax</td><td style="padding:8px 12px;text-align:right">${fmt(Number(o.tax_cost ?? 0))}</td></tr>
          <tr style="font-weight:bold;border-top:2px solid #333"><td style="padding:8px 12px">Total</td><td style="padding:8px 12px;text-align:right">${fmt(Number(o.total ?? 0))}</td></tr>
        </table>

        <h3>Shipping Address</h3>
        <p>${shippingHtml}</p>
        ${o.notes ? `<h3>Notes</h3><p>${escapeHtml(o.notes)}</p>` : ""}
      `,
    });

    // 2. Send confirmation to customer
    if (o.shipping_email) {
      await sendEmail({
        to: o.shipping_email,
        subject: `Order received #${o.id.slice(0, 8).toUpperCase()} — Kalaneri Art Gallery`,
        html: `
          <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto">
            <h1 style="font-size:24px;font-weight:normal;margin-bottom:4px">Kalaneri Art Gallery</h1>
            <p style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#999;margin-top:0">Authenticity is Priceless</p>
            <hr style="border:0;border-top:1px solid #e5e5e5;margin:24px 0">
            <p>Dear ${escapeHtml(o.shipping_name ?? "Collector")},</p>
            <p>Thank you for your order. A gallery director will review your selection and reach out to confirm availability and arrange payment.</p>
            
            <h3 style="font-size:14px;text-transform:uppercase;letter-spacing:1px;color:#666">Your Works</h3>
            <table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:14px">
              ${itemsHtml}
              <tr style="font-weight:bold"><td style="padding:12px;border-top:1px solid #333">Total</td><td style="padding:12px;border-top:1px solid #333;text-align:right">${fmt(Number(o.total ?? 0))}</td></tr>
            </table>

            <p style="margin-top:24px">Order reference: <strong>#${o.id.slice(0, 8).toUpperCase()}</strong></p>
            
            <hr style="border:0;border-top:1px solid #e5e5e5;margin:24px 0">
            <p style="font-size:13px;color:#666">Questions about your order?</p>
            <ul style="font-size:13px;color:#666">
              <li>WhatsApp: <a href="https://wa.me/911412370439">+91 141 237 0439</a></li>
              <li>Email: <a href="mailto:hello@kalaneri.art">hello@kalaneri.art</a></li>
            </ul>
            <p style="font-size:12px;color:#999;margin-top:32px">Kalaneri Art Gallery · C-Scheme, Jaipur 302001 · Est. 2009</p>
          </div>
        `,
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("notify-order error:", error);
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }
});

async function sendEmail(opts: { to: string; subject: string; html: string }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend API error ${res.status}: ${body}`);
  }
  return res.json();
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
