import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { JewelleryCard, type JewelleryProduct } from "@/components/JewelleryCard";
import { MOCK_JEWELLERY_PRODUCTS } from "@/lib/jewellery-data";
import { Reveal } from "@/components/Reveal";
import { Search, Sparkles, Check, Gem, ShieldCheck, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/collection")({
  validateSearch: (search: Record<string, unknown>): { category?: string } => {
    return {
      category: typeof search.category === "string" ? search.category : undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Our Collections — Raajsi | Timeless Luxury Jewellery" },
      {
        name: "description",
        content:
          "Explore two distinctive expressions of Raajsi jewellery: refined Sterling Silver 925 and artistic Handcrafted Jewels. Handcrafted in Jaipur, India.",
      },
      { property: "og:title", content: "Our Collections — Raajsi" },
      {
        property: "og:description",
        content:
          "Explore Sterling Silver 925 (Modern • Minimal • Elegant) and Handcrafted Jewels (Artistic • Whimsical • Expressive).",
      },
    ],
  }),
  component: CollectionPage,
});

export function CollectionPage() {
  const searchParams = Route.useSearch();
  const navigate = useNavigate();

  // Active collection tab: 'sterling-silver' | 'handcrafted' | 'all-separated'
  const [activeTab, setActiveTab] = useState<"sterling-silver" | "handcrafted" | "all-separated">(
    searchParams.category === "sterling-silver"
      ? "sterling-silver"
      : searchParams.category === "handcrafted"
      ? "handcrafted"
      : "sterling-silver"
  );

  useEffect(() => {
    if (searchParams.category === "sterling-silver") {
      setActiveTab("sterling-silver");
    } else if (searchParams.category === "handcrafted") {
      setActiveTab("handcrafted");
    }
  }, [searchParams.category]);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeSubcategory, setActiveSubcategory] = useState("All");

  const query = useQuery({
    queryKey: ["full-jewellery-collection"],
    staleTime: 300_000,
    gcTime: 1_800_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artworks")
        .select("id,slug,title,medium,story,primary_image_url,gallery_image_urls,availability,display_price,price,metadata")
        .order("created_at", { ascending: false });
      if (!error && data && data.length > 0) return (data as unknown) as JewelleryProduct[];
      return MOCK_JEWELLERY_PRODUCTS;
    },
  });

  const products = query.data ?? [];

  // Categorize products strictly:
  // Sterling Silver 925: metal/medium/material contains "silver"
  // Handcrafted Jewels: non-sterling-silver pieces (Kundan, Polki, Gold, Jadau, etc.)
  const isSilverPiece = (p: JewelleryProduct) => {
    const medium = (p.medium || "").toLowerCase();
    const material = (p.metadata?.material || "").toLowerCase();
    const title = (p.title || "").toLowerCase();
    const category = (p.metadata?.category || "").toLowerCase();
    return (
      medium.includes("silver") ||
      material.includes("silver") ||
      title.includes("silver") ||
      category.includes("silver")
    );
  };

  const silverProducts = useMemo(() => {
    return products.filter((p) => isSilverPiece(p));
  }, [products]);

  const handcraftedProducts = useMemo(() => {
    return products.filter((p) => !isSilverPiece(p));
  }, [products]);

  const filterList = (list: JewelleryProduct[]) => {
    return list.filter((p) => {
      const sub = (p.metadata?.subcategory || "").toLowerCase();
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchDesc = (p.story || p.description || "").toLowerCase().includes(q);
        const matchMat = (p.medium || p.metadata?.material || "").toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchMat) return false;
      }
      if (activeSubcategory !== "All" && sub !== activeSubcategory.toLowerCase()) {
        return false;
      }
      return true;
    });
  };

  const displayedSilver = useMemo(() => filterList(silverProducts), [silverProducts, searchQuery, activeSubcategory]);
  const displayedHandcrafted = useMemo(() => filterList(handcraftedProducts), [handcraftedProducts, searchQuery, activeSubcategory]);

  const SUBCATS = ["All", "Rings", "Chains", "Bracelets", "Earrings", "Bangles", "Necklaces", "Pendants", "Kadas"];

  return (
    <div className="bg-paper text-ink pb-24">
      {/* 1. Page Header */}
      <section className="bg-ink text-paper py-12 md:py-16 relative overflow-hidden border-b border-hairline">
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            background: "radial-gradient(circle at 50% 30%, var(--gold), transparent 70%)",
          }}
        />
        <div className="container-editorial relative text-center max-w-3xl mx-auto space-y-3">
          <div className="text-[11px] uppercase tracking-[0.28em] font-medium" style={{ color: "var(--gold)" }}>
            2. Collections · Raajsi
          </div>
          <h1 className="font-serif text-3xl md:text-5xl tracking-tight">
            Our Collections
          </h1>
          <p className="text-sm md:text-base text-paper/80 leading-relaxed font-light max-w-xl mx-auto">
            Explore two distinctive expressions of Raajsi jewellery — refined Sterling Silver and artistic handcrafted pieces.
          </p>
        </div>
      </section>

      {/* 2. Collection Switcher Tabs (Strict Separation as per PDF) */}
      <section className="border-b border-hairline bg-mist/30 sticky top-16 md:top-20 z-30 backdrop-blur-md">
        <div className="container-editorial flex items-center justify-between overflow-x-auto py-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab("sterling-silver");
                navigate({ to: "/collection", search: { category: "sterling-silver" } });
              }}
              className={`px-4 py-2 text-xs uppercase tracking-[0.18em] transition-all rounded-xs font-medium flex items-center gap-2 whitespace-nowrap ${
                activeTab === "sterling-silver"
                  ? "bg-ink text-paper shadow-sm"
                  : "text-ink/70 hover:text-ink hover:bg-mist"
              }`}
            >
              <span>Sterling Silver 925</span>
              <span className="text-[10px] opacity-70">({silverProducts.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("handcrafted");
                navigate({ to: "/collection", search: { category: "handcrafted" } });
              }}
              className={`px-4 py-2 text-xs uppercase tracking-[0.18em] transition-all rounded-xs font-medium flex items-center gap-2 whitespace-nowrap ${
                activeTab === "handcrafted"
                  ? "bg-ink text-paper shadow-sm"
                  : "text-ink/70 hover:text-ink hover:bg-mist"
              }`}
            >
              <span>Handcrafted Jewels</span>
              <span className="text-[10px] opacity-70">({handcraftedProducts.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("all-separated");
                navigate({ to: "/collection", search: {} });
              }}
              className={`px-3 py-2 text-xs uppercase tracking-[0.18em] transition-all rounded-xs whitespace-nowrap ${
                activeTab === "all-separated"
                  ? "border border-ink text-ink font-semibold"
                  : "text-muted-foreground hover:text-ink"
              }`}
            >
              Both Collections (Separated)
            </button>
          </div>

          <div className="hidden md:flex items-center text-xs text-muted-foreground italic font-serif">
            "Never mixed — Each carries its own character"
          </div>
        </div>
      </section>

      {/* 3. Filter Bar (Search & Subcategories) */}
      <section className="container-editorial pt-6 pb-2">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 bg-mist/20 border border-hairline rounded-sm">
          {/* Search input */}
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
            <input
              type="text"
              placeholder="Search in this collection..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-paper border border-hairline pl-9 pr-4 py-2 text-xs text-ink placeholder:text-ink/40 focus:outline-none focus:border-ink rounded-xs"
            />
          </div>

          {/* Subcategory pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
            {SUBCATS.map((sub) => (
              <button
                key={sub}
                type="button"
                onClick={() => setActiveSubcategory(sub)}
                className={`px-2.5 py-1 text-[11px] uppercase tracking-wider rounded-xs transition-colors whitespace-nowrap ${
                  activeSubcategory === sub
                    ? "bg-[color:var(--gold)] text-paper font-semibold"
                    : "bg-paper border border-hairline text-ink/70 hover:text-ink"
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 4. TAB CONTENT: STERLING SILVER 925 */}
      {(activeTab === "sterling-silver" || activeTab === "all-separated") && (
        <section className="container-editorial pt-10 pb-16">
          {/* Collection 01 Hero Box */}
          <div className="border border-hairline bg-mist/30 p-8 md:p-12 mb-10 rounded-sm">
            <div className="grid md:grid-cols-12 gap-8 items-start">
              <div className="md:col-span-7 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono uppercase tracking-widest text-[color:var(--gold)] font-semibold">
                    Collection 01
                  </span>
                  <span className="text-[10px] uppercase tracking-widest bg-paper border border-hairline px-2 py-0.5 rounded-xs">
                    925 Purity Certified
                  </span>
                </div>
                <h2 className="font-serif text-3xl md:text-4xl text-ink">
                  Sterling Silver 925
                </h2>
                <p className="text-xs uppercase tracking-[0.2em] font-medium text-ink/70">
                  Modern • Minimal • Elegant — Modern. Elegant. Timeless.
                </p>
                <p className="text-sm text-ink/80 leading-relaxed pt-2">
                  Our Sterling Silver collection is crafted in 925 Sterling Silver, offering a refined and versatile aesthetic
                  for everyday elegance and special occasions. Designed with a modern and minimal approach, these pieces are
                  made for those who appreciate understated luxury. From delicate jewellery to contemporary statement pieces,
                  the collection combines simplicity with sophisticated detailing.
                </p>
              </div>

              <div className="md:col-span-5 bg-paper p-6 border border-hairline space-y-3 rounded-xs">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink block border-b border-hairline pb-2">
                  Collection Highlights:
                </span>
                <ul className="space-y-1.5 text-xs text-ink/80">
                  <li className="flex items-center gap-2">
                    <Check size={13} className="text-[color:var(--gold)] shrink-0" />
                    <span>925 Sterling Silver</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={13} className="text-[color:var(--gold)] shrink-0" />
                    <span>Modern and minimal designs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={13} className="text-[color:var(--gold)] shrink-0" />
                    <span>Elegant everyday jewellery</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={13} className="text-[color:var(--gold)] shrink-0" />
                    <span>Versatile styling</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={13} className="text-[color:var(--gold)] shrink-0" />
                    <span>Timeless aesthetic</span>
                  </li>
                </ul>
                <div className="pt-2 border-t border-hairline text-xs text-muted-foreground">
                  <strong>Perfect for:</strong> Everyday wear, gifting, layering, and effortless occasions.
                </div>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground uppercase tracking-widest">
            <span>Showing {displayedSilver.length} Sterling Silver 925 Pieces</span>
            <span>Collection 01</span>
          </div>

          {displayedSilver.length === 0 ? (
            <div className="p-16 border border-dashed border-hairline text-center text-muted-foreground">
              No Sterling Silver pieces matching the selected criteria.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {displayedSilver.map((item) => (
                <JewelleryCard key={item.id || item.slug} product={item} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Visual Separation Divider when both are displayed */}
      {activeTab === "all-separated" && (
        <div className="container-editorial py-6">
          <div className="border-t-2 border-dashed border-hairline my-6 relative text-center">
            <span className="bg-paper px-4 text-xs uppercase tracking-[0.25em] text-muted-foreground relative -top-2.5 font-serif">
              Distinct Expression
            </span>
          </div>
        </div>
      )}

      {/* 5. TAB CONTENT: HANDCRAFTED JEWELS */}
      {(activeTab === "handcrafted" || activeTab === "all-separated") && (
        <section className="container-editorial pt-10 pb-16">
          {/* Collection 02 Hero Box */}
          <div className="border border-hairline bg-paper p-8 md:p-12 mb-10 rounded-sm shadow-xs">
            <div className="grid md:grid-cols-12 gap-8 items-start">
              <div className="md:col-span-7 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono uppercase tracking-widest text-[color:var(--gold)] font-semibold">
                    Collection 02
                  </span>
                  <span className="text-[10px] uppercase tracking-widest bg-mist px-2 py-0.5 rounded-xs">
                    Non-Silver Handcrafted Jewels
                  </span>
                </div>
                <h2 className="font-serif text-3xl md:text-4xl text-ink">
                  Handcrafted Jewels
                </h2>
                <p className="text-xs uppercase tracking-[0.2em] font-medium text-ink/70">
                  Artistic • Whimsical • Expressive — Artistic. Expressive. Unique.
                </p>
                <p className="text-sm text-ink/80 leading-relaxed pt-2">
                  Our Handcrafted collection celebrates jewellery with character. Each piece is inspired by artistry,
                  distinctive forms, colours, textures, and traditional influences while being designed to complement a
                  contemporary wardrobe. These pieces are created for those who want jewellery that feels expressive,
                  unconventional, and personal. From statement pieces to distinctive rings, cuffs, earrings, and necklaces,
                  the Handcrafted collection brings a more artistic expression to Raajsi.
                </p>
              </div>

              <div className="md:col-span-5 bg-mist/30 p-6 border border-hairline space-y-3 rounded-xs">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink block border-b border-hairline pb-2">
                  Collection Highlights:
                </span>
                <ul className="space-y-1.5 text-xs text-ink/80">
                  <li className="flex items-center gap-2">
                    <Check size={13} className="text-[color:var(--gold)] shrink-0" />
                    <span>Handcrafted designs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={13} className="text-[color:var(--gold)] shrink-0" />
                    <span>Artistic and distinctive forms</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={13} className="text-[color:var(--gold)] shrink-0" />
                    <span>Expressive styling</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={13} className="text-[color:var(--gold)] shrink-0" />
                    <span>Statement and occasion pieces</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={13} className="text-[color:var(--gold)] shrink-0" />
                    <span>Contemporary interpretation of traditional inspiration</span>
                  </li>
                </ul>
                <div className="pt-2 border-t border-hairline text-xs text-muted-foreground">
                  <strong>Perfect for:</strong> Statement looks, occasions, gifting, and expressing your individual style.
                </div>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground uppercase tracking-widest">
            <span>Showing {displayedHandcrafted.length} Handcrafted Pieces</span>
            <span>Collection 02</span>
          </div>

          {displayedHandcrafted.length === 0 ? (
            <div className="p-16 border border-dashed border-hairline text-center text-muted-foreground">
              No Handcrafted pieces matching the selected criteria.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {displayedHandcrafted.map((item) => (
                <JewelleryCard key={item.id || item.slug} product={item} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
