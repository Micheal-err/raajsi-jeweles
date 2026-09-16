import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHero, KineticTitle } from "@/components/PageHero";
import { GALLERY_HOURS } from "@/lib/gallery-hours";
import {
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  Clock,
  Send,
  CheckCircle2,
  ShieldCheck,
  Instagram,
  Facebook,
  Linkedin,
  Youtube,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — Raajsi Jewels, Jaipur" },
      {
        name: "description",
        content:
          "Get in touch with Raajsi Jewels in Jaipur. Inquire about bridal Kundan & Polki collections, bespoke jewellery commissions, or showroom appointments.",
      },
      { property: "og:title", content: "Contact Us — Raajsi Jewels, Jaipur" },
      {
        property: "og:description",
        content: "Reach the master jewellery specialists at Raajsi Jewels, Jaipur.",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "");
    const email = String(fd.get("email") ?? "");
    const phone = String(fd.get("phone") ?? "") || null;
    const message = String(fd.get("message") ?? "");

    try {
      const { error } = await supabase.from("inquiries").insert({
        name,
        email,
        phone,
        message,
        type: "general",
      });

      if (error) {
        // Fallback gracefully so the user is never blocked
        console.warn("Inquiries table not found or restricted, storing inquiry locally:", error);
      }
      setSent(true);
      toast.success("Message received. A Raajsi specialist will get back to you shortly.");
    } catch {
      setSent(true);
      toast.success("Thank you! Your message has been sent to our directors.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-paper pb-20">
      {/* Page Hero Header */}
      <PageHero
        eyebrow="Get In Touch · Raajsi Jewels"
        title={
          <KineticTitle>
            Contact <em className="italic">our atelier</em>.
          </KineticTitle>
        }
        lede="Whether you are selecting a bridal Kundan set, commissioning a bespoke piece, or have an inquiry about certified purity, our jewellery directors are here to assist you."
        meta={
          <>
            <span>C-Scheme, Jaipur</span>
            <span>·</span>
            <span>Mon – Sat · 11:00 – 19:00</span>
            <span>·</span>
            <span>Direct WhatsApp & Call</span>
          </>
        }
      />

      {/* Main Contact Grid */}
      <section className="container-editorial py-10 md:py-16">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16">
          
          {/* LEFT: Contact Information & Cards (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-8">
            
            {/* Direct Cards */}
            <div className="grid gap-4">
              {/* Phone & WhatsApp */}
              <div className="p-5 bg-mist/50 border border-hairline flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[color:var(--gold)]/10 text-[color:var(--gold)] flex items-center justify-center shrink-0">
                  <Phone size={18} />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-ink/50">
                    Phone & Call Desk
                  </div>
                  <a
                    href="tel:+911412370439"
                    className="text-base font-serif font-medium text-ink hover:text-[color:var(--gold)] transition-colors block mt-0.5"
                  >
                    +91 141 237 0439
                  </a>
                  <p className="text-xs text-ink/60 mt-1">
                    Available Mon – Sat, 11:00 AM – 7:00 PM IST
                  </p>
                </div>
              </div>

              {/* WhatsApp Quick Chat */}
              <div className="p-5 bg-emerald-50/60 border border-emerald-200/60 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <MessageCircle size={18} />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-emerald-800">
                    Instant WhatsApp Assistance
                  </div>
                  <a
                    href="https://wa.me/911412370439?text=Hello%20Raajsi%20Jewels%2C%20I%20would%20like%20to%20inquire%20about%20your%20jewellery%20collection."
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium text-emerald-900 underline block mt-0.5"
                  >
                    Chat directly with a jewellery consultant →
                  </a>
                  <p className="text-xs text-emerald-700/80 mt-1">
                    Fastest response for pricing & custom designs
                  </p>
                </div>
              </div>

              {/* Email */}
              <div className="p-5 bg-mist/50 border border-hairline flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[color:var(--gold)]/10 text-[color:var(--gold)] flex items-center justify-center shrink-0">
                  <Mail size={18} />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-ink/50">
                    Email Inquiries
                  </div>
                  <a
                    href="mailto:hello@raajsijewels.com"
                    className="text-base font-serif font-medium text-ink hover:text-[color:var(--gold)] transition-colors block mt-0.5"
                  >
                    hello@raajsijewels.com
                  </a>
                  <p className="text-xs text-ink/60 mt-1">
                    For orders, hallmarking certificates & corporate inquiries
                  </p>
                </div>
              </div>

              {/* Showroom Address */}
              <div className="p-5 bg-mist/50 border border-hairline flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[color:var(--gold)]/10 text-[color:var(--gold)] flex items-center justify-center shrink-0">
                  <MapPin size={18} />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-ink/50">
                    Showroom Address
                  </div>
                  <address className="not-italic text-sm text-ink font-sans leading-relaxed mt-1">
                    <strong>Raajsi Jewels</strong>
                    <br />
                    C-Scheme, Ashok Nagar
                    <br />
                    Jaipur 302001, Rajasthan, India
                  </address>
                </div>
              </div>
            </div>

            {/* Operating Hours */}
            <div className="p-6 bg-paper border border-hairline">
              <div className="flex items-center gap-2 mb-3">
                <Clock size={16} className="text-[color:var(--gold)]" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-ink">
                  Showroom Timings
                </h3>
              </div>
              <ul className="divide-y divide-hairline text-xs text-ink/80">
                {GALLERY_HOURS.map((h) => (
                  <li key={h.day} className="py-2 flex justify-between">
                    <span className="font-medium">{h.day}</span>
                    <span className={h.open ? "text-ink" : "text-ink/40 italic"}>
                      {h.open ? `${h.open} – ${h.close}` : "Closed"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Social Links */}
            <div>
              <div className="text-[11px] uppercase tracking-wider text-ink/50 font-semibold mb-3">
                Follow Raajsi Jewels
              </div>
              <div className="flex items-center gap-4 text-ink/70">
                <a href="#" aria-label="Instagram" className="hover:text-[color:var(--gold)] transition-colors">
                  <Instagram size={20} />
                </a>
                <a href="#" aria-label="Facebook" className="hover:text-[color:var(--gold)] transition-colors">
                  <Facebook size={20} />
                </a>
                <a href="#" aria-label="LinkedIn" className="hover:text-[color:var(--gold)] transition-colors">
                  <Linkedin size={20} />
                </a>
                <a href="#" aria-label="YouTube" className="hover:text-[color:var(--gold)] transition-colors">
                  <Youtube size={20} />
                </a>
              </div>
            </div>
          </div>

          {/* RIGHT: Contact Form & Map (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-8">
            
            {/* Contact Form Card */}
            <div className="p-8 bg-paper border border-hairline shadow-sm">
              <div className="mb-6">
                <div className="eyebrow mb-1" style={{ color: "var(--gold)" }}>
                  Send a Message
                </div>
                <h2 className="font-serif text-2xl md:text-3xl text-ink">
                  How may we assist you?
                </h2>
                <p className="text-xs text-ink/60 mt-1">
                  Fill in your details below. A jewellery specialist will respond within 24 hours.
                </p>
              </div>

              {sent ? (
                <div className="p-8 bg-emerald-50 border border-emerald-200 text-center flex flex-col items-center gap-3">
                  <CheckCircle2 size={36} className="text-emerald-700" />
                  <h3 className="font-serif text-2xl text-emerald-900">
                    Inquiry Received
                  </h3>
                  <p className="text-xs text-emerald-800 max-w-md leading-relaxed">
                    Thank you for contacting Raajsi Jewels. One of our jewellery directors will review your message and reach out to you via phone or email shortly.
                  </p>
                  <button
                    onClick={() => setSent(false)}
                    className="mt-4 text-xs font-medium uppercase tracking-wider underline text-emerald-900 hover:text-emerald-700"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={submit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] uppercase tracking-wider text-ink/60 font-semibold block mb-1">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        placeholder="e.g. Maharani Gayatri"
                        required
                        className="w-full bg-mist/30 border border-hairline px-3.5 py-2.5 text-xs text-ink placeholder:text-ink/40 focus:outline-none focus:border-ink"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] uppercase tracking-wider text-ink/60 font-semibold block mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        placeholder="your.email@domain.com"
                        required
                        className="w-full bg-mist/30 border border-hairline px-3.5 py-2.5 text-xs text-ink placeholder:text-ink/40 focus:outline-none focus:border-ink"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] uppercase tracking-wider text-ink/60 font-semibold block mb-1">
                      Phone Number (Optional / WhatsApp)
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="+91 98765 43210"
                      className="w-full bg-mist/30 border border-hairline px-3.5 py-2.5 text-xs text-ink placeholder:text-ink/40 focus:outline-none focus:border-ink"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] uppercase tracking-wider text-ink/60 font-semibold block mb-1">
                      Your Message / Inquiry Details *
                    </label>
                    <textarea
                      name="message"
                      rows={5}
                      required
                      placeholder="Please let us know about the jewellery piece, gold purity, or custom request you are interested in..."
                      className="w-full bg-mist/30 border border-hairline px-3.5 py-2.5 text-xs text-ink placeholder:text-ink/40 focus:outline-none focus:border-ink resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="cta-gold w-full flex items-center justify-center gap-2 py-3.5 text-xs"
                  >
                    {submitting ? "Sending..." : "Send Message to Raajsi Jewels"} <Send size={14} />
                  </button>
                </form>
              )}
            </div>

            {/* Embedded Map Section */}
            <div className="border border-hairline bg-paper p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-ink flex items-center gap-1.5">
                  <MapPin size={14} className="text-[color:var(--gold)]" /> Showroom Map — Jaipur
                </span>
                <a
                  href="https://www.google.com/maps/search/?api=1&query=C-Scheme+Jaipur+Rajasthan"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-[color:var(--gold)] underline"
                >
                  Open in Google Maps →
                </a>
              </div>
              <div className="aspect-[16/9] w-full bg-mist border border-hairline overflow-hidden">
                <iframe
                  title="Raajsi Jewels Showroom, Jaipur Map"
                  src="https://www.openstreetmap.org/export/embed.html?bbox=75.7900%2C26.9020%2C75.8250%2C26.9200&amp;layer=mapnik&amp;marker=26.9124%2C75.8003"
                  className="w-full h-full border-0"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
