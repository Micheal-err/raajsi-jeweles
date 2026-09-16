import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCommerce";
import { useSession } from "@/hooks/useSession";
import { resolveImage } from "@/lib/images";
import { useFormatPrice } from "@/lib/currency-format";
import { Reveal } from "@/components/Reveal";
import { PageHero, KineticTitle } from "@/components/PageHero";
import { KineticBand } from "@/components/KineticBand";

const searchSchema = z.object({
  artwork: z.string().optional(),
  cart: z.union([z.literal(1), z.literal("1"), z.boolean()]).optional(),
});

export const Route = createFileRoute("/inquire")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Acquire — Raajsi Jewels" },
      {
        name: "description",
        content:
          "Inquire about acquiring a work from Raajsi Jewels. Personal response within one business day.",
      },
      { property: "og:title", content: "Acquire — Raajsi Jewels" },
      {
        property: "og:description",
        content: "Inquire about a work. Personal response within one business day.",
      },
    ],
  }),
  component: InquirePage,
});

const schema = z.object({
  name: z.string().trim().min(2, "Please share your name").max(120),
  email: z.string().trim().email("A valid email, please").max(254),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  message: z.string().trim().min(10, "Tell us a little more").max(4000),
});

function InquirePage() {
  const formatPrice = useFormatPrice();
  const { artwork, cart } = Route.useSearch();
  const cartMode = cart === 1 || cart === "1" || cart === true;
  const { user } = useSession();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const cartQ = useCart();
  const cartItems = cartMode ? (cartQ.data ?? []) : [];

  const { data: art } = useQuery({
    enabled: !!artwork && !cartMode,
    queryKey: ["inquire-art", artwork],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artworks")
        .select("id,slug,title")
        .eq("slug", artwork!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errMsg, setErrMsg] = useState<string>("");

  useEffect(() => {
    if (user && !form.email) setForm((f) => ({ ...f, email: user.email ?? "" }));
  }, [user, form.email]);

  useEffect(() => {
    if (art && !cartMode && !form.message) {
      setForm((f) => ({
        ...f,
        message: `I'd like to inquire about "${art.title}".\n\n`,
      }));
    }
  }, [art, cartMode, form.message]);

  useEffect(() => {
    if (cartMode && cartItems.length > 0 && !form.message) {
      const list = cartItems
        .map((i) => `• "${i.artwork.title}" — Raajsi Jewels`)
        .join("\n");
      setForm((f) => ({
        ...f,
        message: `I'd like to inquire about the following works:\n\n${list}\n\n`,
      }));
    }
  }, [cartMode, cartItems, form.message]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        errs[i.path[0] as string] = i.message;
      });
      setErrors(errs);
      return;
    }
    setErrors({});
    setStatus("sending");

    try {
      if (cartMode && cartItems.length > 0) {
        for (const item of cartItems) {
          const { data: resp, error } = await supabase.functions.invoke("submit-inquiry", {
            body: {
              full_name: parsed.data.name,
              email: parsed.data.email,
              phone: parsed.data.phone || null,
              message: parsed.data.message,
              artwork_id: item.artwork.id,
              user_id: user?.id ?? null,
            },
          });
          if (error || resp?.error) throw new Error(resp?.error ?? error?.message);
        }

        // Reserve inquired artworks in stock via RPC
        const artworkIds = cartItems.map((i) => i.artwork.id).filter(Boolean);
        if (artworkIds.length > 0) {
          await supabase.rpc("update_artworks_availability", {
            p_artwork_ids: artworkIds,
            p_availability: "reserved",
          });
        }

        // Clear cart
        if (user) {
          await supabase.from("cart_items").delete().eq("user_id", user.id);
          qc.invalidateQueries({ queryKey: ["cart"] });
        }
      } else {
        const { data: resp, error } = await supabase.functions.invoke("submit-inquiry", {
          body: {
            full_name: parsed.data.name,
            email: parsed.data.email,
            phone: parsed.data.phone || null,
            message: parsed.data.message,
            artwork_id: art?.id ?? null,
            user_id: user?.id ?? null,
          },
        });
        if (error || resp?.error) throw new Error(resp?.error ?? error?.message);

        if (art?.id) {
          await supabase.rpc("update_artworks_availability", {
            p_artwork_ids: [art.id],
            p_availability: "reserved",
          });
        }
      }

      // Invalidate collection and artwork queries
      qc.invalidateQueries({ queryKey: ["collection"] });
      qc.invalidateQueries({ queryKey: ["artworks"] });
      qc.invalidateQueries({ queryKey: ["artwork"] });
      qc.invalidateQueries({ queryKey: ["home-artworks"] });
      qc.invalidateQueries({ queryKey: ["inquire-art"] });

      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setErrMsg(err instanceof Error ? err.message : "Unknown error");
    }
  }

  const eyebrowLabel = cartMode
    ? `Reviewing ${cartItems.length} work${cartItems.length === 1 ? "" : "s"}`
    : "Acquire · Inquire";

  return (
    <>
      <PageHero
        eyebrow={eyebrowLabel}
        title={
          <KineticTitle>
            {cartMode ? "Request your shortlist." : "A note reaches us directly."}
          </KineticTitle>
        }
        lede="Every inquiry is read personally by a jewellery specialist. We respond within one business day — usually the same afternoon."
        meta={
          <>
            <span>Tue – Sun · 11:00 – 19:00 IST</span>
            <span>·</span>
            <span>Certified provenance</span>
            <span>·</span>
            <span>Worldwide dispatch</span>
          </>
        }
        visual="inquire"
      />

      <KineticBand
        words={[
          { t: "Personal", c: "solid" },
          { t: "Reply", c: "red" },
          { t: "·", c: "solid" },
          { t: "One", c: "" },
          { t: "Business", c: "solid" },
          { t: "Day", c: "red" },
          { t: "·", c: "solid" },
          { t: "Directors", c: "" },
          { t: "Only", c: "red" },
        ]}
      />

      <section className="container-editorial py-14 md:py-20">
        <div className="grid md:grid-cols-12 gap-10 md:gap-16 mt-10">
          <div className="md:col-span-7">
            {status === "sent" ? (
              <Reveal className="border border-hairline p-10 md:p-14">
                <div className="eyebrow mb-3" style={{ color: "var(--accent)" }}>
                  Received
                </div>
                <h2 className="font-serif text-3xl md:text-4xl mb-4">Thank you.</h2>
                <p className="text-muted-foreground max-w-md">
                  Your note has reached the gallery. A director will be in touch within one business
                  day.
                </p>
                <button
                  type="button"
                  onClick={() => navigate({ to: "/collection" })}
                  className="cta-ghost mt-8"
                >
                  Continue browsing →
                </button>
              </Reveal>
            ) : (
              <form onSubmit={submit} className="space-y-6">
                {cartMode && cartItems.length > 0 && (
                  <div className="border border-hairline divide-y divide-hairline">
                    {cartItems.map((i) => (
                      <div key={i.id} className="p-4 flex items-center gap-4 text-sm">
                        {i.artwork.primary_image_url && (
                          <img
                            src={resolveImage(i.artwork.primary_image_url)}
                            alt=""
                            className="w-14 h-16 object-cover bg-mist"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-serif italic truncate">{i.artwork.title}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            Raajsi Jewels
                          </div>
                        </div>
                        <div className="text-xs tabular-nums text-muted-foreground whitespace-nowrap">
                          {formatPrice(i.artwork)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {!cartMode && art && (
                  <div className="bg-mist p-4 flex items-center justify-between text-sm">
                    <span>
                      Regarding: <em className="italic font-serif">{art.title}</em>
                    </span>
                    <Link
                      to="/artworks/$slug"
                      params={{ slug: art.slug }}
                      className="link-underline text-xs tracking-widest uppercase"
                    >
                      View work
                    </Link>
                  </div>
                )}
                <Field label="Name" error={errors.name}>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input"
                    autoComplete="name"
                    maxLength={120}
                  />
                </Field>
                <div className="grid md:grid-cols-2 gap-6">
                  <Field label="Email" error={errors.email}>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="input"
                      autoComplete="email"
                      maxLength={254}
                    />
                  </Field>
                  <Field label="Phone (optional)" error={errors.phone}>
                    <input
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="input"
                      autoComplete="tel"
                      maxLength={40}
                    />
                  </Field>
                </div>
                <Field label="Message" error={errors.message}>
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="input min-h-[180px] resize-y"
                    maxLength={4000}
                  />
                </Field>
                {status === "error" && (
                  <p className="text-sm text-[color:var(--accent)]">
                    Something went wrong. Please try again or reach us on WhatsApp.
                    {errMsg && <span className="block text-xs opacity-70 mt-1">{errMsg}</span>}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="cta-red disabled:opacity-60"
                >
                  {status === "sending"
                    ? "Sending…"
                    : cartMode
                      ? `Send inquiry (${cartItems.length})`
                      : "Send inquiry"}
                </button>
                <style>{`.input{width:100%;background:transparent;border:0;border-bottom:1px solid var(--hairline);padding:.75rem 0;font-size:16px;font-family:var(--font-sans);color:var(--ink);outline:none;transition:border-color .2s ease}.input:focus{border-color:var(--ink)}`}</style>
              </form>
            )}
          </div>

          <aside className="md:col-span-5 md:pl-8 md:border-l border-hairline space-y-10">
            <div>
              <div className="eyebrow mb-3">Or reach us directly</div>
              <ul className="space-y-3 text-base">
                <li>
                  <a
                    href="https://wa.me/911412370439"
                    target="_blank"
                    rel="noreferrer"
                    className="link-underline"
                  >
                    WhatsApp · +91 141 237 0439
                  </a>
                </li>
                <li>
                  <a href="tel:+911412370439" className="link-underline">
                    Phone · +91 141 237 0439
                  </a>
                </li>
                <li>
                  <a href="mailto:hello@raajsijewels.com" className="link-underline">
                    Email · hello@raajsijewels.com
                  </a>
                </li>
              </ul>
            </div>
            <div className="border-t border-hairline pt-8">
              <div className="eyebrow mb-3">Response time</div>
              <p className="font-serif text-2xl leading-snug">
                Within one business day. Usually sooner.
              </p>
              <p className="mt-3 text-sm text-muted-foreground">Tue–Sun, 11:00 – 19:00 IST.</p>
            </div>
            <div className="border-t border-hairline pt-8">
              <div className="eyebrow mb-3" style={{ color: "var(--accent)" }}>
                Authenticity is priceless
              </div>
              <p className="text-sm text-muted-foreground">
                Every acquisition includes a certificate of authenticity, full provenance record,
                and lifetime record-keeping.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="eyebrow block mb-1">{label}</label>
      {children}
      {error && <p className="mt-2 text-xs text-[color:var(--accent)]">{error}</p>}
    </div>
  );
}
