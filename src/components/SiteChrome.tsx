import { Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Heart,
  ShoppingBag,
  User,
  LogOut,
  Search,
  Instagram,
  Facebook,
  Linkedin,
  Youtube,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { useCart, useWishlist } from "@/hooks/useCommerce";
import { CurrencySwitcher } from "@/lib/currency";
import { LanguageSwitcher } from "@/lib/i18n";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { GALLERY_HOURS } from "@/lib/gallery-hours";
import { TrustStrip } from "@/components/TrustStrip";
import { SearchModal } from "@/components/SearchModal";
import logoImg from "@/assets/logo.png";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/collection", label: "Collections" },
  { to: "/about", label: "About Us" },
  { to: "/contact", label: "Contact Us" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { user } = useSession();
  const navigate = useNavigate();
  const cart = useCart();
  const wishlist = useWishlist();
  const cartCount = cart.data?.length ?? 0;
  const wishCount = wishlist.data?.length ?? 0;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const { data: isAdmin } = useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user!.id)
        .maybeSingle();
      return data?.is_admin ?? false;
    },
  });

  async function signOut() {
    setMenu(false);
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <header className="sticky top-0 z-40 bg-paper/95 backdrop-blur-sm border-b border-hairline">
      <div className="container-editorial flex items-center justify-between h-16 md:h-20">
        <Link to="/" className="flex items-center gap-2.5 group" onClick={() => setOpen(false)}>
          <img src={logoImg} alt="Raajsi Jewels Logo" className="h-8 md:h-10 w-auto object-contain" />
          <div className="flex flex-col">
            <span
              className="font-serif text-lg md:text-xl font-bold leading-none"
              style={{ color: "var(--gold)" }}
            >
              Raajsi
            </span>
            <span className="eyebrow text-[9px] tracking-[0.3em] uppercase text-ink/70">Jewels</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-8">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="text-[13px] tracking-wider uppercase text-ink/80 hover:text-ink transition-colors"
              activeProps={{ className: "text-[color:var(--gold)] font-medium" }}
            >
              {n.label}
            </Link>
          ))}

          <div className="flex items-center gap-1 pl-4 border-l border-hairline">
            <LanguageSwitcher className="mr-1 text-ink/70 hover:text-ink" />
            <CurrencySwitcher className="mr-2 text-ink/70 hover:text-ink" />

            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="w-9 h-9 flex items-center justify-center hover:text-[color:var(--gold)] transition-colors text-ink/80"
              aria-label="Search"
              title="Search (Cmd+K)"
            >
              <Search size={17} />
            </button>

            <Link
              to="/wishlist"
              className="relative w-9 h-9 flex items-center justify-center hover:text-[color:var(--gold)] transition-colors"
              aria-label="Wishlist"
            >
              <Heart size={17} />
              {wishCount > 0 && <Badge n={wishCount} />}
            </Link>

            <Link
              to="/cart"
              className="relative w-9 h-9 flex items-center justify-center hover:text-[color:var(--gold)] transition-colors"
              aria-label="Cart"
            >
              <ShoppingBag size={17} />
              {cartCount > 0 && <Badge n={cartCount} />}
            </Link>

            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenu((v) => !v)}
                  className="w-9 h-9 flex items-center justify-center hover:text-[color:var(--gold)] transition-colors"
                  aria-label="Account"
                >
                  <User size={17} />
                </button>
                {menu && (
                  <div className="absolute right-0 top-full mt-1 min-w-[200px] bg-paper border border-hairline shadow-md py-2 text-sm z-50">
                    <div className="px-4 py-2 text-[10px] tracking-[0.22em] uppercase text-ink/50 truncate">
                      {user.email}
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setMenu(false)}
                      className="block px-4 py-2 hover:bg-mist font-medium text-ink"
                    >
                      👤 My Profile
                    </Link>
                    <Link
                      to="/orders"
                      onClick={() => setMenu(false)}
                      className="block px-4 py-2 hover:bg-mist font-medium text-ink"
                    >
                      📦 My Orders
                    </Link>
                    <Link
                      to="/cart"
                      onClick={() => setMenu(false)}
                      className="block px-4 py-2 hover:bg-mist text-ink"
                    >
                      Cart ({cartCount})
                    </Link>
                    <Link
                      to="/wishlist"
                      onClick={() => setMenu(false)}
                      className="block px-4 py-2 hover:bg-mist text-ink"
                    >
                      Wishlist ({wishCount})
                    </Link>
                    {isAdmin && (
                      <>
                        <hr className="my-1 border-hairline" />
                        <Link
                          to="/admin/dashboard"
                          onClick={() => setMenu(false)}
                          className="block px-4 py-2 hover:bg-mist text-[color:var(--gold)] font-medium"
                        >
                          Admin Dashboard →
                        </Link>
                      </>
                    )}
                    <hr className="my-1 border-hairline" />
                    <button
                      type="button"
                      onClick={signOut}
                      className="w-full text-left px-4 py-2 hover:bg-mist flex items-center gap-2 text-rose-700"
                    >
                      <LogOut size={13} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/auth"
                className="text-[11px] tracking-wider uppercase text-ink/70 hover:text-ink px-2 font-medium"
              >
                Sign In
              </Link>
            )}
          </div>

          <Link to="/checkout" className="cta-gold !py-2.5 !px-4 text-[11px] ml-1">
            Shop Now
          </Link>
        </nav>

        {/* Mobile menu trigger */}
        <div className="lg:hidden flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="p-1 text-ink/80 hover:text-[color:var(--gold)] transition-colors"
            aria-label="Search"
          >
            <Search size={18} />
          </button>
          <Link to="/cart" className="relative p-1">
            <ShoppingBag size={18} />
            {cartCount > 0 && <Badge n={cartCount} />}
          </Link>
          <button
            className="p-2 -mr-2 flex flex-col gap-1.5"
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="block w-6 h-px bg-ink" />
            <span className="block w-6 h-px bg-ink" />
            <span className="block w-4 h-px bg-ink self-end" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {open && (
        <div className="lg:hidden border-t border-hairline bg-paper">
          <nav className="container-editorial py-6 flex flex-col gap-4">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="text-lg font-serif text-ink"
                onClick={() => setOpen(false)}
              >
                {n.label}
              </Link>
            ))}

            {user ? (
              <div className="py-4 border-t border-b border-hairline my-2 flex flex-col gap-3">
                <div className="text-[11px] uppercase tracking-wider text-ink/50 font-medium">
                  Signed in as <span className="text-ink lowercase font-normal">{user.email}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <Link
                    to="/profile"
                    className="p-3 bg-mist/60 border border-hairline rounded text-xs font-medium flex items-center gap-2"
                    onClick={() => setOpen(false)}
                  >
                    <User size={14} className="text-[color:var(--gold)]" /> Profile
                  </Link>
                  <Link
                    to="/orders"
                    className="p-3 bg-mist/60 border border-hairline rounded text-xs font-medium flex items-center gap-2"
                    onClick={() => setOpen(false)}
                  >
                    <ShoppingBag size={14} className="text-[color:var(--gold)]" /> Orders
                  </Link>
                </div>
                <button
                  type="button"
                  onClick={signOut}
                  className="mt-2 text-left text-xs font-medium text-rose-700 flex items-center gap-1.5"
                >
                  <LogOut size={13} /> Sign Out
                </button>
              </div>
            ) : (
              <div className="py-4 border-t border-b border-hairline my-2 flex flex-col gap-3">
                <Link
                  to="/auth"
                  className="cta-gold text-center !py-2.5 text-xs"
                  onClick={() => setOpen(false)}
                >
                  Sign In / Register
                </Link>
              </div>
            )}

            <div className="pt-2 flex items-center gap-4">
              <LanguageSwitcher />
              <CurrencySwitcher />
            </div>
          </nav>
        </div>
      )}

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}

function Badge({ n }: { n: number }) {
  return (
    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-[color:var(--gold)] text-paper text-[9px] font-medium tracking-normal flex items-center justify-center leading-none">
      {n > 9 ? "9+" : n}
    </span>
  );
}

export function SiteFooter() {
  return (
    <>
      <TrustStrip />
      <footer className="border-t border-hairline bg-paper">
        <div className="container-editorial py-16 grid gap-10 md:grid-cols-12">
          {/* Brand Info */}
          <div className="md:col-span-4">
            <div className="flex items-center gap-3">
              <img src={logoImg} alt="Raajsi Jewels" className="h-9 w-auto object-contain" />
              <div className="font-serif text-2xl font-bold leading-tight" style={{ color: "var(--gold)" }}>
                Raajsi Jewels
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground max-w-md">
              Exquisite Indian jewellery, crafted with heritage since 2009. Every piece carries a
              BIS Hallmark Certificate — because <em className="italic">true elegance endures</em>.
            </p>
            <div className="mt-6 eyebrow">Showroom</div>
            <address className="not-italic text-sm mt-1 leading-relaxed text-ink/80">
              C-Scheme, Jaipur 302001
              <br />
              Rajasthan, India
              <br />
              {GALLERY_HOURS.filter((h) => h.open).map((h) => (
                <span key={h.day} className="block text-xs text-ink/60">
                  {h.day} · {h.open}–{h.close}
                </span>
              ))}
            </address>
            <div className="flex items-center gap-4 mt-5 text-ink/60">
              <a href="#" aria-label="Instagram" className="hover:text-[color:var(--gold)]">
                <Instagram size={17} />
              </a>
              <a href="#" aria-label="Facebook" className="hover:text-[color:var(--gold)]">
                <Facebook size={17} />
              </a>
              <a href="#" aria-label="LinkedIn" className="hover:text-[color:var(--gold)]">
                <Linkedin size={17} />
              </a>
              <a href="#" aria-label="YouTube" className="hover:text-[color:var(--gold)]">
                <Youtube size={17} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-2">
            <div className="eyebrow mb-3">Jewellery</div>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/collection" className="link-underline">
                  All Collections
                </Link>
              </li>
              <li>
                <Link to="/collection" className="link-underline">
                  Women's Jewellery
                </Link>
              </li>
              <li>
                <Link to="/collection" className="link-underline">
                  Men's Jewellery
                </Link>
              </li>
              <li>
                <Link to="/about" className="link-underline">
                  Our Story
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Care & Policies */}
          <div className="md:col-span-2">
            <div className="eyebrow mb-3">Customer Care</div>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/contact" className="link-underline">
                  Customer Care & Inquiries
                </Link>
              </li>
              <li>
                <Link to="/policies/$doc" params={{ doc: "privacy" }} className="link-underline">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/policies/$doc" params={{ doc: "terms" }} className="link-underline">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/policies/$doc" params={{ doc: "shipping" }} className="link-underline">
                  Shipping & Returns
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter & Contact */}
          <div className="md:col-span-4">
            <NewsletterSignup />
            <div className="eyebrow mt-8 mb-3">Contact Showroom</div>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="tel:+911412370439" className="link-underline">
                  +91 141 237 0439
                </a>
              </li>
              <li>
                <a href="mailto:hello@raajsijewels.com" className="link-underline">
                  hello@raajsijewels.com
                </a>
              </li>
              <li>
                <Link to="/contact" className="link-underline">
                  Jaipur Atelier Location & Map
                </Link>
              </li>
            </ul>
            <div className="mt-6 flex items-center gap-2 text-[10px] tracking-widest uppercase text-muted-foreground">
              <span className="border border-hairline px-2 py-1">SSL 256-Bit</span>
              <span className="border border-hairline px-2 py-1">BIS Hallmarked</span>
              <span className="border border-hairline px-2 py-1">Razorpay Verified</span>
            </div>
          </div>
        </div>

        <div className="border-t border-hairline">
          <div className="container-editorial py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs text-muted-foreground">
            <div>© {new Date().getFullYear()} Raajsi Jewels. Est. 2009, Jaipur, Rajasthan.</div>
            <div className="tracking-widest uppercase" style={{ color: "var(--gold)" }}>
              Where Heritage Meets Elegance
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
