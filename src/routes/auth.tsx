import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { PageHero, KineticTitle } from "@/components/PageHero";
import { Lock, AlertCircle } from "lucide-react";

const searchSchema = z.object({ next: z.string().optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Sign In & Account — Raajsi Jewels" },
      {
        name: "description",
        content:
          "Sign in to view your orders, save items to your wishlist, and manage your Raajsi Jewels profile.",
      },
      { property: "og:title", content: "Sign In & Account — Raajsi Jewels" },
      {
        property: "og:description",
        content: "Access your shopping bag, wishlist, and certified order history.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { next } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "busy">("idle");
  const [err, setErr] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        const dest = next && next.startsWith("/") ? next : "/";
        window.location.href = dest;
      }
    });
  }, [next]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setStatus("busy");
    try {
      const targetUrl = next && next.startsWith("/") ? next : "/";

      if (mode === "signin") {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          const errMsg = error.message.toLowerCase();
          if (errMsg.includes("invalid login credentials")) {
            throw new Error(
              "Invalid email or password. You can also use the 1-Click Instant Demo Access button above."
            );
          }
          if (errMsg.includes("confirm")) {
            throw new Error(
              "Your email is not yet confirmed. Please check your inbox or turn off 'Confirm email' in Supabase Dashboard (Authentication -> Providers -> Email)."
            );
          }
          throw error;
        }
        if (data.session) {
          window.location.href = targetUrl;
        }
      } else {
        // Sign Up Flow via standard Supabase auth
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: name || email.split("@")[0] },
          },
        });

        if (error) {
          const errMsg = error.message.toLowerCase();
          if (errMsg.includes("already registered") || errMsg.includes("already exists")) {
            // Attempt auto-login if already registered
            const { data: logData, error: logErr } = await supabase.auth.signInWithPassword({
              email,
              password,
            });
            if (!logErr && logData.session) {
              window.location.href = targetUrl;
              return;
            }
            throw new Error(
              "This email is already registered. Please switch to Sign In tab to log in."
            );
          }
          throw error;
        }

        if (data.session) {
          // Instant session (when email confirmation is turned off)
          window.location.href = targetUrl;
          return;
        }

        // If Supabase project has "Confirm email" enabled
        if (data.user && !data.session) {
          const { data: signinData, error: signinErr } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (!signinErr && signinData.session) {
            window.location.href = targetUrl;
            return;
          }

          setStatus("idle");
          setMode("signin");
          setSuccessMsg(
            "Account created! Please check your email to verify, or turn off 'Confirm email' in Supabase Dashboard -> Authentication -> Providers -> Email for immediate password signups."
          );
          return;
        }

        window.location.href = targetUrl;
      }
    } catch (e: any) {
      setErr(e?.message || "Authentication failed. Please try again.");
    } finally {
      setStatus("idle");
    }
  }

  async function googleSignIn() {
    setErr("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) {
      setErr(error.message ?? "Google sign-in failed");
    }
  }

  return (
    <div className="bg-paper pb-20">
      <PageHero
        eyebrow={mode === "signin" ? "Return · Raajsi Jewels" : "Join · Raajsi Jewels"}
        title={
          <KineticTitle>{mode === "signin" ? "Welcome Back." : "Begin Your Heritage."}</KineticTitle>
        }
        lede={
          mode === "signin"
            ? "Sign in to reach your shopping bag, saved wishlist, and certified order status."
            : "Create an account to save pieces, maintain your wishlist, and track orders."
        }
        visual="auth"
      />
      <section className="container-editorial py-8 md:py-12">
        <div className="max-w-md mx-auto bg-paper p-8 border border-hairline shadow-sm">
          {/* Mode Switcher */}
          <div className="flex gap-2 mb-8 border-b border-hairline">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setErr("");
                  setSuccessMsg("");
                }}
                className={`px-4 py-3 text-[11px] tracking-[0.22em] uppercase border-b-2 -mb-px transition-colors ${
                  mode === m
                    ? "border-[color:var(--gold)] text-[color:var(--gold)] font-semibold"
                    : "border-transparent text-ink/50 hover:text-ink"
                }`}
              >
                {m === "signin" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={googleSignIn}
            className="w-full mb-6 border border-hairline py-3 text-[11px] tracking-[0.22em] uppercase text-ink hover:bg-mist transition flex items-center justify-center gap-2"
          >
            Continue with Google
          </button>

          <div className="flex items-center gap-3 text-[10px] tracking-[0.28em] uppercase text-ink/40 mb-6">
            <span className="flex-1 h-px bg-hairline" /> or email{" "}
            <span className="flex-1 h-px bg-hairline" />
          </div>

          <form onSubmit={submit} className="space-y-5">
            {mode === "signup" && (
              <Field label="Full Name">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Maharani Gayatri"
                  className="input"
                  autoComplete="name"
                />
              </Field>
            )}

            <Field label="Email Address">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@domain.com"
                className="input"
                autoComplete="email"
                required
              />
            </Field>

            <Field label="Password">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                minLength={6}
                required
              />
            </Field>

            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 font-medium">
                ✓ {successMsg}
              </div>
            )}

            {err && (
              <div className="text-xs font-medium text-rose-800 bg-rose-50 border border-rose-200 p-3 leading-relaxed flex items-start gap-2">
                <AlertCircle size={15} className="shrink-0 text-rose-600 mt-0.5" />
                <span>{err}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={status === "busy"}
              className="cta-gold w-full disabled:opacity-60 flex items-center justify-center gap-2 py-3.5 text-xs font-medium"
            >
              {status === "busy"
                ? "Authenticating…"
                : mode === "signin"
                  ? "Sign In →"
                  : "Create Account →"}
            </button>

            <p className="text-xs text-ink/60 text-center pt-2">
              <Link to="/" className="hover:underline text-[color:var(--gold)]">
                ← Return to Raajsi Jewels Homepage
              </Link>
            </p>
          </form>
          <style>{`.input{width:100%;background:transparent;border:0;border-bottom:1px solid var(--hairline);padding:.75rem 0;font-size:14px;font-family:var(--font-sans);color:var(--ink);outline:none;transition:border-color .2s ease}.input:focus{border-color:var(--gold)}`}</style>
        </div>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] uppercase tracking-wider text-ink/60 font-semibold block mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}
