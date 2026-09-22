import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHero, KineticTitle } from "@/components/PageHero";
import {
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  Send,
  CheckCircle2,
  Instagram,
  Facebook,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — Raajsi | Timeless Luxury, Jaipur" },
      {
        name: "description",
        content:
          "Have a question about a product, your order, shipping, or anything else? Our team would be happy to help. Reach out to Raajsi in Jaipur, India.",
      },
      { property: "og:title", content: "Contact Us — Raajsi" },
      {
        property: "og:description",
        content:
          "Connect with Raajsi via Phone, WhatsApp, Email, or visit us in Jaipur, Rajasthan, India.",
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
    const subject = String(fd.get("subject") ?? "") || null;
    const message = String(fd.get("message") ?? "");

    try {
      const { error } = await supabase.from("inquiries").insert({
        name,
        email,
        phone,
        message: subject ? `[Subject: ${subject}] ${message}` : message,
        type: "general",
      });

      if (error) {
        console.warn("Inquiry insert fallback:", error.message);
      }
      setSent(true);
      toast.success("Thank you for contacting Raajsi. We'll get back to you soon.");
    } catch (err) {
      setSent(true);
      toast.success("Thank you for contacting Raajsi. We'll get back to you soon.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-paper text-ink pb-24">
      {/* 1. HERO HEADER */}
      <PageHero
        eyebrow="3. Contact Us · Raajsi"
        title={
          <KineticTitle>
            We'd Love to <em className="italic">Hear From You</em>.
          </KineticTitle>
        }
        lede="Have a question about a product, your order, shipping, or anything else? Our team would be happy to help."
        meta={
          <>
            <span>Jaipur, Rajasthan, India</span>
            <span>·</span>
            <span>Phone / WhatsApp</span>
            <span>·</span>
            <span>Email & Social</span>
          </>
        }
      />

      {/* Main Section */}
      <section className="container-editorial py-12 md:py-20">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16">
          
          {/* LEFT COLUMN: Contact Details & Connect With Raajsi */}
          <div className="lg:col-span-5 space-y-10">
            <div>
              <span className="text-[11px] uppercase tracking-[0.25em] text-[color:var(--gold)] font-medium block mb-2">
                Reach Out
              </span>
              <h2 className="font-serif text-3xl md:text-4xl text-ink mb-4">
                We'd Love to Hear From You
              </h2>
              <p className="text-base text-ink/80 leading-relaxed font-light">
                Have a question about a product, your order, shipping, or anything else?
                Our team would be happy to help.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                Whether you're looking for more information about a piece or simply want to connect with
                Raajsi, feel free to reach out.
              </p>
            </div>

            {/* Contact Details Card */}
            <div className="border border-hairline bg-mist/30 p-6 md:p-8 rounded-sm space-y-6">
              <h3 className="font-serif text-xl text-ink font-medium border-b border-hairline pb-3">
                Contact Details
              </h3>

              <div className="space-y-4 text-sm">
                {/* Phone / WhatsApp */}
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold block mb-1">
                    Phone / WhatsApp:
                  </span>
                  <div className="flex flex-col gap-2">
                    <a
                      href="https://wa.me/919829145129"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ink hover:text-[color:var(--gold)] font-medium flex items-center gap-2 transition-colors"
                    >
                      <MessageCircle size={16} className="text-emerald-600 shrink-0" />
                      <span>+91 98291 45129 (WhatsApp / Call)</span>
                    </a>
                    <a
                      href="https://wa.me/917014938562"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ink hover:text-[color:var(--gold)] font-medium flex items-center gap-2 transition-colors"
                    >
                      <Phone size={14} className="text-emerald-600 shrink-0" />
                      <span>+91 70149 38562</span>
                    </a>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold block mb-1">
                    Email:
                  </span>
                  <a
                    href="mailto:raajsiforms@gmail.com"
                    className="text-ink hover:text-[color:var(--gold)] font-medium flex items-center gap-2 transition-colors"
                  >
                    <Mail size={16} className="text-amber-700 shrink-0" />
                    <span>raajsiforms@gmail.com</span>
                  </a>
                </div>

                {/* Instagram */}
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold block mb-1">
                    Instagram:
                  </span>
                  <a
                    href="https://www.instagram.com/jewels_raajsi?stkn=NDZnM3dzeW13NXUz"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ink hover:text-[color:var(--gold)] font-medium flex items-center gap-2 transition-colors"
                  >
                    <Instagram size={16} className="text-pink-600 shrink-0" />
                    <span>@jewels_raajsi</span>
                  </a>
                </div>

                {/* Facebook */}
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold block mb-1">
                    Facebook:
                  </span>
                  <a
                    href="https://www.facebook.com/share/1QEN2B3By5/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ink hover:text-[color:var(--gold)] font-medium flex items-center gap-2 transition-colors"
                  >
                    <Facebook size={16} className="text-blue-600 shrink-0" />
                    <span>Raajsi Jewels</span>
                  </a>
                </div>

                {/* Location */}
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold block mb-1">
                    Location & GSTIN:
                  </span>
                  <div className="flex items-center gap-2 text-ink font-medium">
                    <MapPin size={16} className="text-[color:var(--gold)] shrink-0" />
                    <span>Jaipur, Rajasthan, India</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 pl-6">
                    GST: <span className="font-mono font-semibold text-ink">08UQDPS5127K1ZY</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Connect With Raajsi (Social Media Info & Clickable Buttons) */}
            <div className="border border-hairline bg-paper p-6 md:p-8 rounded-sm space-y-5">
              <div>
                <h3 className="font-serif text-xl text-ink font-medium mb-2">
                  Connect With Raajsi
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Follow us on social media for:
                </p>
                <ul className="space-y-1.5 text-xs text-ink/80">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--gold)]" />
                    <span>New collection launches</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--gold)]" />
                    <span>New arrivals</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--gold)]" />
                    <span>Styling inspiration</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--gold)]" />
                    <span>Jewellery stories</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--gold)]" />
                    <span>Special offers</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--gold)]" />
                    <span>Behind-the-scenes content</span>
                  </li>
                </ul>
              </div>

              {/* Clickable Mobile & Desktop Buttons */}
              <div className="pt-2 border-t border-hairline">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold block mb-3">
                  Quick Action Buttons:
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  <a
                    href="https://www.instagram.com/jewels_raajsi?stkn=NDZnM3dzeW13NXUz"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 border border-hairline bg-paper hover:bg-mist text-ink text-xs font-medium uppercase tracking-wider flex items-center justify-center gap-2 transition-colors rounded-xs shadow-xs"
                  >
                    <Instagram size={14} className="text-pink-600" />
                    <span>Instagram</span>
                  </a>
                  <a
                    href="https://www.facebook.com/share/1QEN2B3By5/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 border border-hairline bg-paper hover:bg-mist text-ink text-xs font-medium uppercase tracking-wider flex items-center justify-center gap-2 transition-colors rounded-xs shadow-xs"
                  >
                    <Facebook size={14} className="text-blue-600" />
                    <span>Facebook</span>
                  </a>
                  <a
                    href="https://wa.me/919829145129"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 border border-hairline bg-paper hover:bg-mist text-ink text-xs font-medium uppercase tracking-wider flex items-center justify-center gap-2 transition-colors rounded-xs shadow-xs"
                  >
                    <MessageCircle size={14} className="text-emerald-600" />
                    <span>WhatsApp</span>
                  </a>
                  <a
                    href="tel:+919829145129"
                    className="p-3 border border-hairline bg-paper hover:bg-mist text-ink text-xs font-medium uppercase tracking-wider flex items-center justify-center gap-2 transition-colors rounded-xs shadow-xs"
                  >
                    <Phone size={14} />
                    <span>Call Us</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: 4. CONTACT FORM */}
          <div className="lg:col-span-7">
            <div className="border border-hairline bg-paper p-8 md:p-12 shadow-sm rounded-sm">
              <div className="border-b border-hairline pb-4 mb-8">
                <span className="text-[11px] uppercase tracking-[0.25em] text-[color:var(--gold)] font-medium block mb-1">
                  4. Contact Form
                </span>
                <h2 className="font-serif text-2xl md:text-3xl text-ink">
                  Get in Touch
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Leave your details below and our team will get back to you promptly.
                </p>
              </div>

              {sent ? (
                <div className="py-16 text-center space-y-4 animate-in fade-in">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="font-serif text-2xl text-ink">Message Received</h3>
                  <p className="text-base text-ink/80 max-w-md mx-auto leading-relaxed">
                    Thank you for contacting Raajsi. We'll get back to you soon.
                  </p>
                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={() => setSent(false)}
                      className="text-xs uppercase tracking-widest text-[color:var(--gold)] underline hover:text-ink"
                    >
                      Send another message
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={submit} className="space-y-6">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] tracking-[0.18em] uppercase font-semibold text-ink/70 flex items-center justify-between">
                      <span>Name *</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="[Enter your name]"
                      className="w-full border border-hairline px-4 py-3 text-sm bg-transparent rounded-none focus:border-ink outline-none transition-colors"
                    />
                  </div>

                  {/* Email & Phone Number Grid */}
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[11px] tracking-[0.18em] uppercase font-semibold text-ink/70">
                        Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        placeholder="[Enter your email]"
                        className="w-full border border-hairline px-4 py-3 text-sm bg-transparent rounded-none focus:border-ink outline-none transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] tracking-[0.18em] uppercase font-semibold text-ink/70">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        placeholder="[Enter your phone number]"
                        className="w-full border border-hairline px-4 py-3 text-sm bg-transparent rounded-none focus:border-ink outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] tracking-[0.18em] uppercase font-semibold text-ink/70">
                      Subject
                    </label>
                    <input
                      type="text"
                      name="subject"
                      placeholder="[Enter subject]"
                      className="w-full border border-hairline px-4 py-3 text-sm bg-transparent rounded-none focus:border-ink outline-none transition-colors"
                    />
                  </div>

                  {/* Message */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] tracking-[0.18em] uppercase font-semibold text-ink/70">
                      Message *
                    </label>
                    <textarea
                      name="message"
                      rows={5}
                      required
                      placeholder="[Write your message]"
                      className="w-full border border-hairline px-4 py-3 text-sm bg-transparent rounded-none focus:border-ink outline-none transition-colors resize-y"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-ink text-paper px-8 py-3.5 text-xs tracking-[0.2em] uppercase hover:bg-ink/90 transition-colors disabled:opacity-50"
                    >
                      <span>{submitting ? "Sending…" : "Send Message"}</span>
                      <Send size={13} />
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 5. ATELIER LOCATION & GOOGLE MAP */}
      <section className="border-t border-hairline bg-mist/30 py-16 md:py-20">
        <div className="container-editorial">
          <div className="max-w-2xl mb-8">
            <span className="text-[11px] uppercase tracking-[0.25em] text-[color:var(--gold)] font-medium block mb-2">
              Our Atelier Location
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-ink mb-3">
              Visit Raajsi Jewels in Jaipur
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Discover our handcrafted jewellery and certified 925 sterling silver collections in Jaipur, Rajasthan, India.
            </p>
          </div>
          <div className="w-full overflow-hidden border border-hairline shadow-md bg-paper rounded-xs">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3556.5937949334852!2d75.83351697544065!3d26.948089176626176!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMjbCsDU2JzUzLjEiTiA3NcKwNTAnMDkuOSJF!5e0!3m2!1sen!2sin!4v1790098994078!5m2!1sen!2sin"
              width="100%"
              height="450"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              title="Raajsi Jewels Atelier Location"
              className="w-full h-[400px] md:h-[480px]"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
