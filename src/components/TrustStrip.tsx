import { ShieldCheck, BadgeCheck, Truck, RotateCcw, Gem, Award, Sparkles } from "lucide-react";

const ITEMS = [
  { Icon: ShieldCheck, label: "SSL Secured Checkout" },
  { Icon: Gem, label: "BIS Hallmark Certified" },
  { Icon: Award, label: "925 Silver / 22K 18K Gold" },
  { Icon: Truck, label: "Free India Shipping" },
  { Icon: RotateCcw, label: "7-Day Easy Returns" },
  { Icon: Sparkles, label: "Complimentary Gift Wrapping" },
  { Icon: BadgeCheck, label: "Authenticity Guaranteed" },
];

export function TrustStrip() {
  return (
    <section aria-label="Trust and guarantees" className="border-t border-hairline bg-mist">
      <div className="container-editorial py-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[11px] tracking-[0.18em] uppercase text-ink/70">
        {ITEMS.map(({ Icon, label }) => (
          <span key={label} className="inline-flex items-center gap-2">
            <Icon size={14} className="text-[color:var(--gold)]" />
            {label}
          </span>
        ))}
      </div>
    </section>
  );
}
