import { Reveal } from "@/components/Reveal";

const TESTIMONIALS = [
  {
    q: "The necklace I ordered for my wedding was breathtaking. Every bead, every stone placed with such care. Raajsi Jewels made my day truly golden.",
    who: "Priya Sharma",
    role: "Bride, Jaipur",
  },
  {
    q: "Raajsi has revived the soul of Rajasthani craftsmanship in a way that feels modern and wearable. My Kundan set gets compliments everywhere I go.",
    who: "Vogue India",
    role: "Editorial, 2024",
  },
  {
    q: "I've been gifting Raajsi pieces for over a decade. The craftsmanship never disappoints, and the BIS hallmark gives complete confidence.",
    who: "Meera Agarwal",
    role: "Collector, Mumbai",
  },
  {
    q: "A rare jewellery house that understands both tradition and contemporary taste. Their bespoke service is world-class.",
    who: "Elle Décor India",
    role: "Jewellery Feature, 2024",
  },
];

export function Testimonials({
  eyebrow = "What our clients say",
  heading = "Cherished by brides, collectors, and connoisseurs.",
}: {
  eyebrow?: string;
  heading?: string;
}) {
  return (
    <section className="bg-paper border-t border-hairline py-20 md:py-28">
      <div className="container-editorial">
        <Reveal className="mb-10 md:mb-14 max-w-3xl">
          <div className="eyebrow mb-3" style={{ color: 'var(--gold)' }}>{eyebrow}</div>
          <h2 className="font-serif text-3xl md:text-5xl">{heading}</h2>
        </Reveal>
        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={i} delayMs={i * 60}>
              <figure className="border border-hairline p-8 h-full flex flex-col justify-between bg-paper jewellery-card">
                <blockquote className="font-serif text-xl md:text-2xl leading-snug italic text-ink/90">
                  <span className="not-italic" style={{ color: 'var(--gold)' }}>"</span>
                  {t.q}
                  <span className="not-italic" style={{ color: 'var(--gold)' }}>"</span>
                </blockquote>
                <figcaption className="mt-6 flex items-baseline justify-between text-sm">
                  <div>
                    <div className="font-serif italic">{t.who}</div>
                    <div className="eyebrow mt-1">{t.role}</div>
                  </div>
                  <div className="text-[10px] tracking-[0.28em] uppercase text-ink/40">
                    {String(i + 1).padStart(2, "0")} /{" "}
                    {String(TESTIMONIALS.length).padStart(2, "0")}
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
