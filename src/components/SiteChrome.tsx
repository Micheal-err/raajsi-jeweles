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
  ChevronDown,
  Phone,
  Mail,
  MessageCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { useCart, useWishlist } from "@/hooks/useCommerce";
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
  const [collectionsDropdown, setCollectionsDropdown] = useState(false);
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
        {/* Brand Logo - Always links back to Home */}
        <Link to="/" className="flex items-center gap-2.5 group" onClick={() => setOpen(false)}>
          <img src={logoImg} alt="Raajsi Logo" className="h-8 md:h-10 w-auto object-contain" />
          <div className="flex flex-col">
            <span
              className="font-serif text-lg md:text-xl font-bold leading-none tracking-wide"
              style={{ color: "var(--gold)" }}
            >
              Raajsi
            </span>
            <span className="text-[9px] tracking-[0.22em] uppercase text-ink/70 mt-0.5">
              Timeless Luxury
            </span>
          </div>
        </Link>

        {/* Desktop Navigation: HOME | ABOUT | COLLECTIONS (dropdown) | CONTACT */}
        <nav className="hidden lg:flex items-center gap-8">
          <Link
            to="/"
            className="text-[13px] tracking-wider uppercase text-ink/80 hover:text-ink transition-colors"
            activeProps={{ className: "text-[color:var(--gold)] font-medium" }}
          >
            Home
          </Link>

          <Link
            to="/about"
            className="text-[13px] tracking-wider uppercase text-ink/80 hover:text-ink transition-colors"
            activeProps={{ className: "text-[color:var(--gold)] font-medium" }}
          >
            About
          </Link>

          {/* Collections Dropdown: Sterling Silver 925 & Handcrafted Jewels */}
          <div
            className="relative"
            onMouseEnter={() => setCollectionsDropdown(true)}
            onMouseLeave={() => setCollectionsDropdown(false)}
          >
            <Link
              to="/collection"
              className="text-[13px] tracking-wider uppercase text-ink/80 hover:text-ink transition-colors inline-flex items-center gap-1.5 py-2"
              activeProps={{ className: "text-[color:var(--gold)] font-medium" }}
            >
              <span>Collections</span>
              <ChevronDown
                size={12}
                className={`transition-transform duration-200 ${
                  collectionsDropdown ? "rotate-180 text-[color:var(--gold)]" : "text-ink/60"
                }`}
              />
            </Link>

            {collectionsDropdown && (
              <div className="absolute top-full left-0 min-w-[280px] bg-paper border border-hairline shadow-xl py-3 px-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150 rounded-xs">
                <div className="px-3 pb-2 mb-1 border-b border-hairline text-[9px] uppercase tracking-[0.25em] text-ink/40 font-semibold">
                  Two Distinct Expressions
                </div>
                <Link
                  to="/collection"
                  search={{ category: "sterling-silver" }}
                  onClick={() => setCollectionsDropdown(false)}
                  className="block px-3 py-2.5 hover:bg-mist/70 rounded transition-colors group/item"
                >
                  <div className="text-xs font-serif font-semibold text-ink group-hover/item:text-[color:var(--gold)] flex items-center justify-between">
                    <span>Sterling Silver 925</span>
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-sans">925</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    Modern • Minimal • Elegant
                  </div>
                </Link>

                <Link
                  to="/collection"
                  search={{ category: "handcrafted" }}
                  onClick={() => setCollectionsDropdown(false)}
                  className="block px-3 py-2.5 hover:bg-mist/70 rounded transition-colors group/item mt-1"
                >
                  <div className="text-xs font-serif font-semibold text-ink group-hover/item:text-[color:var(--gold)] flex items-center justify-between">
                    <span>Handcrafted Jewels</span>
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-sans">Artisanal</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    Artistic • Whimsical • Expressive
                  </div>
                </Link>

                <div className="mt-2 pt-2 border-t border-hairline px-3">
                  <Link
                    to="/collection"
                    onClick={() => setCollectionsDropdown(false)}
                    className="text-[11px] uppercase tracking-wider text-ink/60 hover:text-ink flex items-center justify-between"
                  >
                    <span>View All Collections</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          <Link
            to="/contact"
            className="text-[13px] tracking-wider uppercase text-ink/80 hover:text-ink transition-colors"
            activeProps={{ className: "text-[color:var(--gold)] font-medium" }}
          >
            Contact
          </Link>

          <div className="flex items-center gap-1 pl-4 border-l border-hairline">
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
        <div className="lg:hidden border-t border-hairline bg-paper animate-in fade-in slide-in-from-top-2 duration-200">
          <nav className="container-editorial py-6 flex flex-col gap-4">
            <Link
              to="/"
              className="text-lg font-serif text-ink"
              onClick={() => setOpen(false)}
            >
              Home
            </Link>

            <Link
              to="/about"
              className="text-lg font-serif text-ink"
              onClick={() => setOpen(false)}
            >
              About Us
            </Link>

            {/* Mobile Collections with Two Distinct Options */}
            <div className="flex flex-col gap-2 py-1 pl-3 border-l-2 border-[color:var(--gold)]">
              <Link
                to="/collection"
                className="text-base font-serif font-medium text-ink flex items-center justify-between"
                onClick={() => setOpen(false)}
              >
                <span>Collections</span>
                <span className="text-xs text-muted-foreground uppercase tracking-widest font-sans">All</span>
              </Link>
              <div className="flex flex-col gap-2 pl-2">
                <Link
                  to="/collection"
                  search={{ category: "sterling-silver" }}
                  className="text-sm text-ink/80 hover:text-[color:var(--gold)]"
                  onClick={() => setOpen(false)}
                >
                  → Sterling Silver 925
                </Link>
                <Link
                  to="/collection"
                  search={{ category: "handcrafted" }}
                  className="text-sm text-ink/80 hover:text-[color:var(--gold)]"
                  onClick={() => setOpen(false)}
                >
                  → Handcrafted Jewels
                </Link>
              </div>
            </div>

            <Link
              to="/contact"
              className="text-lg font-serif text-ink"
              onClick={() => setOpen(false)}
            >
              Contact Us
            </Link>

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
      <footer className="border-t border-hairline bg-paper text-ink">
        <div className="container-editorial py-16 grid gap-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
          {/* 1. Brand Info: RAAJSI, Timeless Luxury, Jaipur, Rajasthan, India */}
          <div className="space-y-3 sm:col-span-2 lg:col-span-1">
            <Link to="/" className="inline-block">
              <div className="font-serif text-2xl font-bold tracking-wide" style={{ color: "var(--gold)" }}>
                RAAJSI
              </div>
              <div className="text-xs uppercase tracking-[0.2em] text-ink/70 font-medium mt-0.5">
                Timeless Luxury
              </div>
            </Link>
            <p className="text-sm text-ink/80 leading-relaxed font-medium">
              Jaipur, Rajasthan, India
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed pt-1">
              Inspired by the beauty of timeless design, Indian craftsmanship, and modern elegance.
            </p>
            <div className="pt-2 text-[11px] text-muted-foreground space-y-1">
              <div>GST: <span className="font-mono text-ink font-semibold">08UQDPS5127K1ZY</span></div>
              <div className="text-[10px] text-[color:var(--gold)] font-medium">
                Free Delivery Above ₹999 · 7 Days Exchange
              </div>
            </div>
          </div>

          {/* 2. Quick Links */}
          <div>
            <div className="eyebrow mb-3 text-ink font-semibold">Quick Links</div>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-ink transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-ink transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/collection" className="text-muted-foreground hover:text-ink transition-colors">
                  Collections
                </Link>
              </li>
              <li>
                <Link
                  to="/collection"
                  search={{ category: "sterling-silver" }}
                  className="text-muted-foreground hover:text-ink transition-colors"
                >
                  Sterling Silver 925
                </Link>
              </li>
              <li>
                <Link
                  to="/collection"
                  search={{ category: "handcrafted" }}
                  className="text-muted-foreground hover:text-ink transition-colors"
                >
                  Handcrafted Jewels
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-ink transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* 3. Customer Support */}
          <div>
            <div className="eyebrow mb-3 text-ink font-semibold">Customer Support</div>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-ink transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  to="/policies/$doc"
                  params={{ doc: "shipping" }}
                  className="text-muted-foreground hover:text-ink transition-colors"
                >
                  Shipping & Delivery
                </Link>
              </li>
              <li>
                <Link
                  to="/policies/$doc"
                  params={{ doc: "returns" }}
                  className="text-muted-foreground hover:text-ink transition-colors"
                >
                  Returns & Exchange
                </Link>
              </li>
              <li>
                <Link
                  to="/policies/$doc"
                  params={{ doc: "terms" }}
                  className="text-muted-foreground hover:text-ink transition-colors"
                >
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link
                  to="/policies/$doc"
                  params={{ doc: "privacy" }}
                  className="text-muted-foreground hover:text-ink transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/policies/$doc"
                  params={{ doc: "faqs" }}
                  className="text-muted-foreground hover:text-ink transition-colors"
                >
                  FAQs
                </Link>
              </li>
            </ul>
          </div>

          {/* 4. Follow Us */}
          <div>
            <div className="eyebrow mb-3 text-ink font-semibold">Follow Us</div>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href="https://www.instagram.com/jewels_raajsi?stkn=NDZnM3dzeW13NXUz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-ink transition-colors flex items-center gap-2 group"
                >
                  <Instagram size={15} className="group-hover:text-[color:var(--gold)] transition-colors text-pink-600" />
                  <span>Instagram</span>
                </a>
              </li>
              <li>
                <a
                  href="https://www.facebook.com/share/1QEN2B3By5/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-ink transition-colors flex items-center gap-2 group"
                >
                  <Facebook size={15} className="group-hover:text-[color:var(--gold)] transition-colors text-blue-600" />
                  <span>Facebook</span>
                </a>
              </li>
            </ul>
          </div>

          {/* 5. Contact */}
          <div>
            <div className="eyebrow mb-3 text-ink font-semibold">Contact</div>
            <ul className="space-y-2.5 text-sm">
              <li>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Phone / WhatsApp:</div>
                <div className="flex flex-col gap-1.5 mt-1">
                  <a
                    href="https://wa.me/919829145129"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ink hover:text-[color:var(--gold)] font-medium flex items-center gap-1.5 transition-colors text-xs"
                  >
                    <MessageCircle size={14} className="text-emerald-600 shrink-0" />
                    <span>+91 98291 45129</span>
                  </a>
                  <a
                    href="https://wa.me/917014938562"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ink hover:text-[color:var(--gold)] font-medium flex items-center gap-1.5 transition-colors text-xs"
                  >
                    <Phone size={13} className="text-emerald-600 shrink-0" />
                    <span>+91 70149 38562 (Gunnu)</span>
                  </a>
                </div>
              </li>
              <li className="pt-2">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Email:</div>
                <a
                  href="mailto:raajsiforms@gmail.com"
                  className="text-ink hover:text-[color:var(--gold)] font-medium flex items-center gap-1.5 transition-colors mt-1 text-xs"
                >
                  <Mail size={14} className="shrink-0 text-amber-700" />
                  <span>raajsiforms@gmail.com</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="border-t border-hairline py-6">
          <div className="container-editorial flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <div>© 2026 Raajsi Jewels. All Rights Reserved.</div>
            <div className="tracking-widest uppercase text-[11px]" style={{ color: "var(--gold)" }}>
              GST: 08UQDPS5127K1ZY · Jaipur, Rajasthan, India
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
