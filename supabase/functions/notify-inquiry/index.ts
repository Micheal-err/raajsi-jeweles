// Supabase Edge Function: notify-inquiry
// Triggered via Database Webhook on INSERT to public.inquiries
// Sends email notification to gallery and confirmation to customer
//
// To deploy:
//   1. Add RESEND_API_KEY and GALLERY_EMAIL to your Supabase project secrets
//   2. Run: supabase functions deploy notify-inquiry
//   3. Create a Database Webhook in Supabase Dashboard:
//      - Table: inquiries
//      - Events: INSERT
//      - Function: notify-inquiry

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const GALLERY_EMAIL = Deno.env.get("GALLERY_EMAIL") ?? "hello@kalaneri.art";
const FROM_EMAIL = "Kalaneri Art Gallery <noreply@kalaneri.art>";

interface InquiryPayload {
  type: "INSERT";
  table: "inquiries";
  record: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    message: string;
    artwork_id: string | null;
    source_page: string | null;
    status: string;
    created_at: string;
  };
}

serve(async (req: Request) => {
  try {
    const payload: InquiryPayload = await req.json();
    const { record } = payload;

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Missing API key" }), { status: 500 });
    }

    // 1. Notify gallery team
    await sendEmail({
      to: GALLERY_EMAIL,
      subject: `New inquiry from ${record.name}`,
      html: `
        <h2>New Inquiry Received</h2>
        <table style="border-collapse:collapse;width:100%;max-width:600px;font-family:sans-serif">
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eee;color:#666;width:120px">Name</td><td style="padding:8px 12px;border-bottom:1px solid #eee"><strong>${escapeHtml(record.name)}</strong></td></tr>
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eee;color:#666">Email</td><td style="padding:8px 12px;border-bottom:1px solid #eee"><a href="mailto:${escapeHtml(record.email)}">${escapeHtml(record.email)}</a></td></tr>
          ${record.phone ? `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;color:#666">Phone</td><td style="padding:8px 12px;border-bottom:1px solid #eee">${escapeHtml(record.phone)}</td></tr>` : ""}
          <tr><td style="padding:8px 12px;border-bottom:1px solid #eee;color:#666">Source</td><td style="padding:8px 12px;border-bottom:1px solid #eee">${escapeHtml(record.source_page ?? "Direct")}</td></tr>
          <tr><td style="padding:8px 12px;color:#666" colspan="2"><br>${escapeHtml(record.message).replace(/\n/g, "<br>")}</td></tr>
        </table>
        <p style="margin-top:24px;font-size:12px;color:#999">Inquiry ID: ${record.id}<br>Received: ${new Date(record.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</p>
      `,
    });

    // 2. Send confirmation to customer
    await sendEmail({
      to: record.email,
      subject: "We've received your inquiry — Kalaneri Art Gallery",
      html: `
        <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto">
          <h1 style="font-size:24px;font-weight:normal;margin-bottom:4px">Kalaneri Art Gallery</h1>
          <p style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#999;margin-top:0">Authenticity is Priceless</p>
          <hr style="border:0;border-top:1px solid #e5e5e5;margin:24px 0">
          <p>Dear ${escapeHtml(record.name)},</p>
          <p>Thank you for reaching out. Your inquiry has been received and will be read personally by a gallery director.</p>
          <p>We respond within <strong>one business day</strong> — usually the same afternoon.</p>
          <hr style="border:0;border-top:1px solid #e5e5e5;margin:24px 0">
          <p style="font-size:13px;color:#666">If you need to reach us sooner:</p>
          <ul style="font-size:13px;color:#666">
            <li>WhatsApp: <a href="https://wa.me/911412370439">+91 141 237 0439</a></li>
            <li>Phone: <a href="tel:+911412370439">+91 141 237 0439</a></li>
            <li>Email: <a href="mailto:hello@kalaneri.art">hello@kalaneri.art</a></li>
          </ul>
          <p style="font-size:12px;color:#999;margin-top:32px">Kalaneri Art Gallery · C-Scheme, Jaipur 302001 · Est. 2009</p>
        </div>
      `,
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("notify-inquiry error:", error);
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
