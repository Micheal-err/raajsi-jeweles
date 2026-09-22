import { ShieldCheck, BadgeCheck, Truck, RotateCcw, Gem, Award, Sparkles } from "lucide-react";

const ITEMS = [
  { Icon: Truck, label: "Free Delivery Above ₹999" },
  { Icon: RotateCcw, label: "7 Days Exchange Policy" },
  { Icon: Gem, label: "BIS Hallmark Certified" },
  { Icon: Award, label: "100% Genuine 925 Silver" },
  { Icon: Sparkles, label: "Handcrafted in Jaipur" },
  { Icon: ShieldCheck, label: "Secure Razorpay Checkout" },
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
