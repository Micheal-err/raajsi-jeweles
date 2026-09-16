import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { JewelleryCard, type JewelleryProduct } from "@/components/JewelleryCard";
import { MOCK_JEWELLERY_PRODUCTS } from "@/lib/jewellery-data";
import { Reveal } from "@/components/Reveal";
import { Search, SlidersHorizontal, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/collection")({
  head: () => ({
    meta: [
      { title: "Fine Jewellery Collections — Raajsi Jewels, Jaipur" },
      {
        name: "description",
        content:
          "Explore the complete Raajsi Jewels collection. BIS Hallmark certified gold & silver rings, chains, bracelets, necklaces, and bridal sets.",
      },
      { property: "og:title", content: "Fine Jewellery Collections — Raajsi Jewels" },
      {
        property: "og:description",
        content: "Browse fine Indian jewellery with complete transparency. Direct online orders.",
      },
    ],
  }),
  component: CollectionPage,
});

const GENDERS = [
  { key: "all", label: "All Categories" },
  { key: "women", label: "Women's Jewellery" },
  { key: "men", label: "Men's Collection" },
  { key: "unisex", label: "Unisex Pieces" },
];

const SUBCATEGORIES = [
  "All",
  "Rings",
  "Chains",
  "Bracelets",
  "Earrings",
  "Bangles",
  "Pendants",
  "Anklets",
  "Nose Rings",
  "Kadas",
];

const MATERIALS = ["All", "22K Gold", "18K Gold", "Sterling Silver", "Kundan", "Polki", "Diamond"];

const PRICE_RANGES = [
  { key: "all", label: "All Prices" },
  { key: "under-10k", label: "Under ₹10,000" },
  { key: "10k-50k", label: "₹10,000 – ₹50,000" },
  { key: "50k-1l", label: "₹50,000 – ₹1,000,000" },
  { key: "1l-plus", label: "Above ₹100,000" },
];

function CollectionPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeGender, setActiveGender] = useState("all");
  const [activeSubcategory, setActiveSubcategory] = useState("All");
  const [activeMaterial, setActiveMaterial] = useState("All");
  const [activePriceRange, setActivePriceRange] = useState("all");

  const query = useQuery({
    queryKey: ["full-jewellery-collection"],
    staleTime: 300_000,
    gcTime: 1_800_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artworks")
        .select(
          "id,slug,title,medium,story,primary_image_url,availability,display_price,price,metadata"
        )
        .order("created_at", { ascending: false });
      if (!error && data && data.length > 0) return ((data ?? []) as unknown) as JewelleryProduct[];
      return MOCK_JEWELLERY_PRODUCTS;
    },
  });

  const products = query.data ?? [];

  // Filter logic
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const meta = p.metadata ?? {};
      const gender = (meta.gender || "unisex").toLowerCase();
      const subcategory = (meta.subcategory || "").toLowerCase();
      const material = (meta.material || p.medium || "").toLowerCase();
      const price = p.display_price ?? p.price_min ?? 0;

      // Search term
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchDesc = (p.story || p.description || "").toLowerCase().includes(q);
        const matchMat = material.includes(q);
        if (!matchTitle && !matchDesc && !matchMat) return false;
      }

      // Gender / Category
      if (activeGender !== "all" && gender !== activeGender.toLowerCase()) {
        return false;
      }

      // Subcategory
      if (
        activeSubcategory !== "All" &&
        subcategory !== activeSubcategory.toLowerCase()
      ) {
        return false;
      }

      // Material
      if (activeMaterial !== "All" && !material.includes(activeMaterial.toLowerCase())) {
        return false;
      }

      // Price Range
      if (activePriceRange !== "all") {
        if (activePriceRange === "under-10k" && price >= 10000) return false;
        if (activePriceRange === "10k-50k" && (price < 10000 || price > 50000)) return false;
        if (activePriceRange === "50k-1l" && (price < 50000 || price > 100000)) return false;
        if (activePriceRange === "1l-plus" && price <= 100000) return false;
      }

      return true;
    });
  }, [products, searchQuery, activeGender, activeSubcategory, activeMaterial, activePriceRange]);

  const resetFilters = () => {
    setSearchQuery("");
    setActiveGender("all");
    setActiveSubcategory("All");
    setActiveMaterial("All");
    setActivePriceRange("all");
  };

  return (
    <div className="bg-paper pb-24">
      {/* Header Banner */}
      <section className="bg-ink text-paper py-8 md:py-12 relative overflow-hidden border-b border-hairline">
        <div
          className="absolute inset-0 opacity-15"
          style={{
            background: "radial-gradient(circle at 50% 30%, var(--gold), transparent 70%)",
          }}
        />
        <div className="container-editorial relative text-center max-w-3xl mx-auto">
          <div className="eyebrow mb-2" style={{ color: "var(--gold)" }}>
            Raajsi Jewels Catalogue
          </div>
          <h1 className="font-serif text-3xl md:text-5xl tracking-tight">
            The Complete Collection
          </h1>
          <p className="mt-3 text-sm text-paper/70 leading-relaxed font-sans">
            Handcrafted in Jaipur. Certified BIS Hallmarked Gold & Sterling Silver. Select your
            favourite design and order online with instant secure payment.
          </p>
        </div>
      </section>

      {/* Filter Control Bar */}
      <section className="container-editorial pt-6">
        <div className="flex flex-col gap-6 bg-mist/40 p-5 border border-hairline">
          {/* Top Row: Search & Gender Tabs */}
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
              <input
                type="text"
                placeholder="Search jewellery, metal, or gemstone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-paper border border-hairline pl-10 pr-4 py-2 text-xs text-ink placeholder:text-ink/40 focus:outline-none focus:border-ink"
              />
            </div>

            {/* Category / Gender Pills */}
            <div className="flex flex-wrap gap-1.5">
              {GENDERS.map((g) => (
                <button
                  key={g.key}
                  onClick={() => setActiveGender(g.key)}
                  className={`text-[11px] uppercase tracking-wider px-3.5 py-2 border transition-all ${
                    activeGender === g.key
                      ? "bg-ink text-paper border-ink font-medium"
                      : "bg-paper text-ink/70 border-hairline hover:border-ink/40"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <hr className="border-hairline" />

          {/* Bottom Row: Subcategory, Material & Price Range Selectors */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] uppercase tracking-widest text-ink/50 flex items-center gap-1">
                <SlidersHorizontal size={13} /> Subcategory:
              </span>
              <div className="flex flex-wrap gap-1">
                {SUBCATEGORIES.map((sub) => (
                  <button
                    key={sub}
                    onClick={() => setActiveSubcategory(sub)}
                    className={`text-[11px] uppercase tracking-wider px-2.5 py-1 border transition-all ${
                      activeSubcategory === sub
                        ? "border-[color:var(--gold)] text-[color:var(--gold)] bg-[color:var(--gold)]/10 font-semibold"
                        : "border-hairline bg-paper text-ink/60 hover:border-ink/30"
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Secondary Filters: Material & Price */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <div className="flex flex-wrap gap-4 text-xs">
              {/* Material Dropdown */}
              <div className="flex items-center gap-2">
                <label className="text-[11px] uppercase tracking-wider text-ink/50">Metal:</label>
                <select
                  value={activeMaterial}
                  onChange={(e) => setActiveMaterial(e.target.value)}
                  className="bg-paper border border-hairline px-3 py-1 text-xs text-ink focus:outline-none"
                >
                  {MATERIALS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range Dropdown */}
              <div className="flex items-center gap-2">
                <label className="text-[11px] uppercase tracking-wider text-ink/50">Price:</label>
                <select
                  value={activePriceRange}
                  onChange={(e) => setActivePriceRange(e.target.value)}
                  className="bg-paper border border-hairline px-3 py-1 text-xs text-ink focus:outline-none"
                >
                  {PRICE_RANGES.map((pr) => (
                    <option key={pr.key} value={pr.key}>
                      {pr.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Clear Filters & Count */}
            <div className="flex items-center gap-4 text-xs">
              <button
                onClick={resetFilters}
                className="text-[11px] uppercase tracking-wider text-ink/50 hover:text-ink flex items-center gap-1 underline"
              >
                <RotateCcw size={12} /> Reset Filters
              </button>
              <span className="text-ink/60 font-medium tabular-nums">
                Showing {filteredProducts.length} piece{filteredProducts.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Grid Display */}
      <section className="container-editorial pt-10">
        {query.isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-square bg-mist animate-pulse border border-hairline" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-24 text-center border border-dashed border-hairline bg-mist/20">
            <h3 className="font-serif text-2xl text-ink/70 mb-2">No matching jewellery found</h3>
            <p className="text-sm text-ink/50 max-w-sm mx-auto mb-6">
              Try clearing your search query or selecting a different subcategory or price filter.
            </p>
            <button onClick={resetFilters} className="cta-gold">
              View All Pieces →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filteredProducts.map((product) => (
              <Reveal key={product.slug}>
                <JewelleryCard product={product} />
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
