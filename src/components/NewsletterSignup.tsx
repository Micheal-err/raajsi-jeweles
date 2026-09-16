import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Mail, CheckCircle2 } from "lucide-react";

export function NewsletterSignup({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) return;
    setState("sending");

    try {
      const { data, error } = await supabase.functions.invoke("submit-newsletter-signup", {
        body: {
          email: email.trim().toLowerCase(),
          source: typeof window !== "undefined" ? window.location.pathname : "footer",
        },
      });

      if (error || data?.error) {
        throw new Error(data?.error ?? error?.message);
      }

      // Try invoking welcome email edge function (silently fallback if not deployed)
      try {
        await supabase.functions.invoke("send-newsletter-welcome", {
          body: { email: email.trim().toLowerCase() },
        });
      } catch {
        // Edge function may be offline or in local dev
      }

      setState("sent");
      setEmail("");
    } catch {
      setState("error");
    }
  }

  return (
    <div className={compact ? "" : "max-w-sm"}>
      {!compact && (
        <>
          <div className="eyebrow mb-3 flex items-center gap-1.5">
            <Mail size={13} /> Newsletter
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            New collections, exclusive previews & festive offers. One letter a month, always beautiful.
          </p>
        </>
      )}
      {state === "sent" ? (
        <div className="flex items-center gap-2 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 p-3 rounded-sm">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>Thank you for subscribing to Raajsi Jewels!</span>
        </div>
      ) : (
        <form
          onSubmit={submit}
          className="flex gap-2 border-b border-hairline focus-within:border-ink transition-colors"
        >
          <input
            type="email"
            required
            placeholder="you@studio.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 bg-transparent border-0 py-2 text-sm focus:outline-none placeholder:text-ink/40"
          />
          <button
            type="submit"
            disabled={state === "sending"}
            className="text-[11px] tracking-[0.22em] uppercase text-ink hover:text-[color:var(--accent)] disabled:opacity-50 transition-colors"
          >
            {state === "sending" ? "…" : "Subscribe →"}
          </button>
        </form>
      )}
      {state === "error" && (
        <p className="text-xs text-[color:var(--accent)] mt-2">
          Unable to subscribe right now. Please try again.
        </p>
      )}
    </div>
  );
}
