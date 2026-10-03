/**
 * /jewellery/:category — Dedicated, indexable category landing pages.
 *
 * Each category gets a unique H1, a 150-250 word intro (marked TODO for final
 * human review), breadcrumbs, canonical, and structured data.
 *
 * URL examples:
 *   /jewellery/silver-earrings
 *   /jewellery/necklace-sets
 *   /jewellery/bracelets-bangles
 *   /jewellery/anklets
 *   /jewellery/rings
 *   /jewellery/nose-pins
 *   /jewellery/mangalsutra
 *   /jewellery/jaipur-handmade-silver
 *   /jewellery/meenakari
 *   /jewellery/kundan
 */
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { JewelleryCard, type JewelleryProduct } from "@/components/JewelleryCard";
import { MOCK_JEWELLERY_PRODUCTS } from "@/lib/jewellery-data";
import { Reveal } from "@/components/Reveal";
import {
  SITE_NAME,
  canonical,
  defaultOgImage,
  breadcrumbSchema,
  itemListSchema,
} from "@/components/seo-head";

// ── Category metadata catalogue ────────────────────────────────────────
interface CategoryMeta {
  slug: string;
  h1: string;
  seoTitle: string;   // ≤60 chars
  seoDesc: string;    // 150-160 chars
  /** 150-250 word intro — TODO(human): review before publishing */
  intro: string;
  /** Supabase `medium` or `metadata.subcategory` keyword filter */
  keywords: string[];
  collectionFilter?: string;
}

const CATEGORIES: Record<string, CategoryMeta> = {
  "silver-earrings": {
    slug: "silver-earrings",
    h1: "925 Silver Earrings — Handcrafted in Jaipur",
    seoTitle: "925 Silver Earrings | Raajsi Jewels, Jaipur",
    seoDesc:
      "Buy 925 sterling silver earrings handcrafted in Jaipur. Studs, hoops, dangles & more. Free delivery above ₹999. 7-day exchange.",
    // TODO(human): Review and edit intro before publishing
    intro: `Our 925 sterling silver earring collection brings together the best of Jaipur craftsmanship and contemporary design. Each pair is crafted from genuine 925 sterling silver — a standard that guarantees 92.5% pure silver content, providing lasting shine and durability for daily wear.

From delicate silver studs perfect for office days to bold jhumka-style dangles made for festive occasions, every earring in our catalogue is designed with a distinct identity. We work with Jaipur's master artisans who have been shaping silver by hand for generations, combining age-old techniques with modern aesthetic sensibility.

Our silver earring range includes minimalist hoops, floral drops, oxidised silver designs, and stone-set pieces featuring semi-precious gemstones. Whether you prefer understated everyday elegance or expressive statement pieces, you will find your perfect pair here.

All Raajsi silver earrings are shipped with care across India. Free delivery on orders above ₹999. We also offer a 7-day exchange policy and accept customised earring orders — share your reference design via WhatsApp and our artisans will create it for you.`,
    keywords: ["earring", "earrings", "jhumka", "stud", "hoop", "dangle"],
    collectionFilter: "sterling-silver",
  },
  "necklace-sets": {
    slug: "necklace-sets",
    h1: "925 Silver Necklace Sets — Handcrafted Jaipur Jewellery",
    seoTitle: "Silver Necklace Sets | Raajsi Jewels Jaipur",
    seoDesc:
      "Shop 925 silver necklace sets from Jaipur. Layered chains, pendant sets & bridal necklaces. Free delivery above ₹999. 7-day exchange.",
    // TODO(human): Review and edit intro before publishing
    intro: `A statement necklace can transform an entire outfit, and at Raajsi Jewels, we believe it should also tell a story. Our 925 sterling silver necklace collection brings together bold pendant sets, delicate layered chains, and intricately crafted bridal necklaces — all made by hand in Jaipur, Rajasthan.

Each necklace is fashioned from genuine 925 sterling silver, valued for its purity, hypoallergenic properties, and beautiful natural lustre. We offer both plain silver necklaces with geometric or nature-inspired pendants, and embellished sets featuring coloured stones, oxidised finishes, and kundan-style detailing.

Our necklace sets are perfect for everyday wear, corporate settings, festive occasions, and bridal ceremonies. We design each collection with the modern Indian woman in mind — jewellery that moves between contexts as effortlessly as she does.

Browse our full range of silver necklaces online and enjoy free delivery across India on orders above ₹999, along with a 7-day exchange policy. We also take custom necklace orders with your reference design.`,
    keywords: ["necklace", "pendant", "chain", "haar", "choker"],
    collectionFilter: "sterling-silver",
  },
  "bracelets-bangles": {
    slug: "bracelets-bangles",
    h1: "925 Silver Bracelets & Bangles — Made in Jaipur",
    seoTitle: "Silver Bracelets & Bangles | Raajsi Jewels",
    seoDesc:
      "Shop 925 sterling silver bracelets & bangles from Jaipur. Cuffs, charm bracelets & kadas. Free delivery above ₹999. 7-day exchange.",
    // TODO(human): Review and edit intro before publishing
    intro: `Raajsi Jewels offers a curated range of 925 sterling silver bracelets and bangles — from sleek cuffs for minimalists to intricately worked kadas for festive occasions. Every piece is handcrafted by Jaipur artisans who understand both the technical demands of silverwork and the nuances of modern style.

Our silver bracelet collection includes link bracelets, charm bracelets, beaded designs, and rope-twist styles suited for stacking or wearing solo. The bangle range includes plain silver bangles, patterned kadas, and stone-set pieces in a range of widths.

Sterling silver (925) is the ideal metal for everyday jewellery — it is durable, skin-safe, and retains its shine with minimal care. Our pieces are polished to a bright finish or given an oxidised treatment for an antique look.

All products ship across India with free delivery on orders above ₹999. We offer a 7-day exchange window and welcome custom bracelet and bangle orders based on your design reference.`,
    keywords: ["bracelet", "bangle", "kada", "cuff", "charm"],
    collectionFilter: "sterling-silver",
  },
  "anklets": {
    slug: "anklets",
    h1: "925 Silver Anklets (Payal) — Handcrafted in Jaipur",
    seoTitle: "Silver Anklets (Payal) | Raajsi Jewels Jaipur",
    seoDesc:
      "Buy 925 sterling silver anklets (payal) handcrafted in Jaipur. Delicate chains, charm payals & more. Free delivery above ₹999.",
    // TODO(human): Review and edit intro before publishing
    intro: `Anklets have been an intrinsic part of Indian jewellery tradition for centuries, and at Raajsi Jewels, we have reimagined them for the contemporary wardrobe. Our 925 sterling silver anklet (payal) collection spans delicate single-chain designs to layered charm anklets and intricately beaded payals.

Crafted in Jaipur by skilled artisans, each anklet is made from genuine 925 sterling silver — hypoallergenic, tarnish-resistant, and beautiful enough to wear daily. Designs range from minimalist single strands to traditional ghungroo-bell styles with a modern twist.

Our silver anklets are lightweight enough for daily wear and crafted to last. Many designs are adjustable or come in standard lengths, and we can customise sizing on request.

Shop the full Raajsi anklet range online and enjoy free delivery across India on orders above ₹999. We offer a 7-day exchange policy. For custom anklet designs, share your reference on WhatsApp.`,
    keywords: ["anklet", "payal", "ankle"],
    collectionFilter: "sterling-silver",
  },
  "rings": {
    slug: "rings",
    h1: "925 Silver Rings — Handcrafted Statement Rings from Jaipur",
    seoTitle: "925 Silver Rings | Raajsi Jewels, Jaipur India",
    seoDesc:
      "Shop 925 sterling silver rings from Jaipur — statement, stacking, gemstone & plain bands. Free delivery above ₹999. 7-day exchange.",
    // TODO(human): Review and edit intro before publishing
    intro: `Rings are perhaps the most personal piece of jewellery — they are worn every day, chosen deliberately, and often carried with deep meaning. Raajsi Jewels' 925 sterling silver ring collection is designed with exactly that reverence.

Our range includes sleek minimal bands, floral statement rings, gemstone-set rings in coloured stones, and bold sculptural designs inspired by traditional Rajasthani motifs. Each ring is handcrafted in Jaipur from genuine 925 sterling silver and available in multiple sizes.

We design for stacking as well as solo wearing. Our thin-band collection layers beautifully for a curated look, while our statement rings are bold enough to carry an outfit on their own.

Silver rings are hypoallergenic and ideal for sensitive skin. Shop our full range online, available in standard Indian ring sizes with custom sizing on request. Free delivery across India on orders above ₹999. 7-day exchange policy applies.`,
    keywords: ["ring", "rings", "band", "solitaire"],
    collectionFilter: "sterling-silver",
  },
  "nose-pins": {
    slug: "nose-pins",
    h1: "925 Silver Nose Pins & Nose Rings — Raajsi Jewels",
    seoTitle: "925 Silver Nose Pins | Raajsi Jewels Jaipur",
    seoDesc:
      "Buy 925 sterling silver nose pins & nose rings from Jaipur. Screw, stud & ring styles. Free delivery above ₹999. 7-day exchange.",
    // TODO(human): Review and edit intro before publishing
    intro: `A nose pin is often the smallest jewellery piece worn, yet it can completely transform a look. At Raajsi Jewels, we offer a thoughtfully curated range of 925 sterling silver nose pins and nose rings crafted for comfort, purity, and style.

Our collection includes pin-back nose studs, screw-style nose pins for secure all-day wear, and small nose rings (nath style) in plain silver and stone-embellished designs. Every piece uses genuine 925 sterling silver — hypoallergenic and ideal for sensitive skin.

We take particular care with the finish and backing of our nose pins to ensure they are comfortable to wear without irritation. Designs range from simple silver dots to floral micro-studs with stone centres.

All nose pins ship securely across India. Free delivery on orders above ₹999. 7-day exchange. For custom nose pin designs, contact us via WhatsApp with your reference.`,
    keywords: ["nose pin", "nose ring", "nath", "nostril"],
    collectionFilter: "sterling-silver",
  },
  "mangalsutra": {
    slug: "mangalsutra",
    h1: "925 Silver Mangalsutra — Modern & Traditional Designs",
    seoTitle: "925 Silver Mangalsutra | Raajsi Jewels Jaipur",
    seoDesc:
      "Buy 925 sterling silver mangalsutra from Jaipur. Modern & traditional designs with black beads. Free delivery above ₹999.",
    // TODO(human): Review and edit intro before publishing
    intro: `The mangalsutra is one of the most sacred pieces of jewellery in the Indian tradition, and at Raajsi Jewels we craft each one with the reverence it deserves. Our 925 sterling silver mangalsutra collection brings together traditional design vocabulary — black beads, pendant elements, and symbolic motifs — with a modern, wearable sensibility.

Our silver mangalsutra range includes single-strand minimalist designs for everyday wear, layered pendants with intricate silverwork, and contemporary interpretations that pair beautifully with both traditional and fusion outfits.

Each piece is made from genuine 925 sterling silver, ensuring durability and purity. The pendants feature polished and oxidised finishes, some with gemstone accents. All designs come with adjustable chains for a comfortable fit.

Shop our mangalsutra collection online with free delivery across India on orders above ₹999. We accept custom mangalsutra orders — share your design reference via WhatsApp or email.`,
    keywords: ["mangalsutra", "mangal sutra", "black bead", "thaali"],
    collectionFilter: "sterling-silver",
  },
  "jaipur-handmade-silver": {
    slug: "jaipur-handmade-silver",
    h1: "Jaipur Handmade Silver Jewellery — Raajsi Jewels",
    seoTitle: "Jaipur Handmade Silver Jewellery | Raajsi Jewels",
    seoDesc:
      "Shop authentic Jaipur handmade 925 silver jewellery online. Artisan-crafted earrings, necklaces & rings. Free delivery above ₹999.",
    // TODO(human): Review and edit intro before publishing
    intro: `Jaipur has been the jewellery capital of India for centuries. The city's artisans possess an inherited mastery of silverwork, gemstone setting, and traditional crafting techniques that continue to be passed down through generations of skilled craftspeople.

At Raajsi Jewels, we work directly with Jaipur's master artisans to create 925 sterling silver jewellery that carries the essence of this heritage. Every piece in this collection is hand-shaped, hand-polished, and hand-finished in our Jaipur studio.

Jaipur handmade silver jewellery is characterised by its attention to detail — the careful texture work, the precise prong settings, the finely worked filigree elements. No two handmade pieces are exactly alike, which is part of their enduring appeal.

Whether you are looking for a single statement piece or a full jewellery set rooted in Indian craftsmanship, this collection has something for you. Shop online with free delivery above ₹999 and our 7-day exchange guarantee.`,
    keywords: ["jaipur", "handmade", "artisan", "handcrafted", "silver"],
    collectionFilter: "sterling-silver",
  },
  "meenakari": {
    slug: "meenakari",
    h1: "Meenakari Jewellery — Traditional Enamel Work from Jaipur",
    seoTitle: "Meenakari Jewellery | Raajsi Jewels, Jaipur",
    seoDesc:
      "Buy authentic Meenakari jewellery from Jaipur. Hand-painted enamel earrings, pendants & sets. Free delivery above ₹999. 7-day exchange.",
    // TODO(human): Review and edit intro before publishing
    intro: `Meenakari is one of Jaipur's most celebrated jewellery arts — the ancient craft of decorating metal surfaces with vibrant enamel colours using heat-fused mineral pigments. The result is jewellery that is as much painted art as wearable adornment.

At Raajsi Jewels, our Meenakari collection honours this traditional craft while interpreting it for the modern wardrobe. Each piece features hand-painted enamel work applied by artisans who have dedicated years to mastering the technique. The vivid colours — turquoise, deep reds, peacock greens, ivory whites — are characteristic of Jaipur Meenakari.

Our Meenakari jewellery range includes earrings, pendants, bracelets, and statement sets. Designs draw from floral motifs, peacock patterns, and geometric Rajasthani elements that have inspired craftspeople in this city for generations.

Meenakari pieces from Raajsi make exceptional gifts and prized additions to any jewellery collection. Shop online with free delivery across India above ₹999 and 7-day exchange.`,
    keywords: ["meenakari", "enamel", "meena"],
    collectionFilter: "handcrafted",
  },
  "kundan": {
    slug: "kundan",
    h1: "Kundan Jewellery — Handcrafted in Jaipur by Artisans",
    seoTitle: "Kundan Jewellery | Raajsi Jewels, Jaipur India",
    seoDesc:
      "Shop authentic Kundan jewellery from Jaipur. Bridal & festive sets, earrings & maang tikka. Free delivery above ₹999. 7-day exchange.",
    // TODO(human): Review and edit intro before publishing
    intro: `Kundan jewellery is the pinnacle of traditional Indian gem-setting craft. Originating in the royal courts of Rajasthan and Mughal India, Kundan work involves setting polished, uncut gemstones into a framework of refined gold foil (known as Kundan), creating jewellery of extraordinary brilliance and intricacy.

At Raajsi Jewels, our Kundan collection brings this regal craft to a contemporary audience. Working with Jaipur's most skilled Kundan artisans, we create earrings, necklace sets, maang tikka, and full bridal jewellery sets that balance traditional opulence with wearable elegance.

Each Kundan piece features carefully selected stones — coloured glass, semi-precious gems, and crystal — set into detailed metalwork. The reverse side of many Kundan pieces features Meenakari enamel detailing, a hallmark of Jaipur's jewellery tradition.

Our Kundan jewellery is prized for weddings, festive occasions, and formal events. Shop the full collection online with free delivery across India above ₹999 and our 7-day exchange policy.`,
    keywords: ["kundan", "polki", "bridal", "wedding"],
    collectionFilter: "handcrafted",
  },
};

// ── Loader ───────────────────────────────────────────────────────────
export const Route = createFileRoute("/jewellery/$category")({
  loader: ({ params }) => {
    const meta = CATEGORIES[params.category];
    if (!meta) throw notFound();
    return meta;
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) return {};
    const url = canonical(`/jewellery/${params.category}`);
    return {
      meta: [
        { title: loaderData.seoTitle },
        { name: "description", content: loaderData.seoDesc },
        {
          name: "robots",
          content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
        },
        { property: "og:title", content: loaderData.seoTitle },
        { property: "og:description", content: loaderData.seoDesc },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { property: "og:image", content: defaultOgImage() },
        { property: "og:site_name", content: SITE_NAME },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: loaderData.seoTitle },
        { name: "twitter:description", content: loaderData.seoDesc },
        { name: "twitter:site", content: "@jewels_raajsi" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(
            breadcrumbSchema([
              { name: "Home", url: canonical("/") },
              { name: "Collections", url: canonical("/collection") },
              { name: loaderData.h1, url },
            ]),
          ),
        },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="container-editorial py-24 text-center">
      <h1 className="font-serif text-3xl">Category not found</h1>
      <Link to="/collection" className="cta-gold mt-8 inline-block text-xs px-6 py-2.5">
        Explore all collections
      </Link>
    </div>
  ),
  component: CategoryPage,
});

// ── Component ────────────────────────────────────────────────────────
function CategoryPage() {
  const meta = Route.useLoaderData();

  const products = useQuery({
    queryKey: ["category-products", meta.slug],
    staleTime: 300_000,
    gcTime: 1_800_000,
    queryFn: async (): Promise<JewelleryProduct[]> => {
      const { data, error } = await supabase
        .from("artworks")
        .select(
          "id,slug,title,medium,story,primary_image_url,gallery_image_urls,availability,display_price,price,metadata",
        )
        .order("created_at", { ascending: false })
        .limit(48);
      if (!error && data && data.length > 0) {
        const kws = meta.keywords.map((k: string) => k.toLowerCase());
        const filtered = (data as unknown as JewelleryProduct[]).filter((p: JewelleryProduct) => {
          const fields = [
            p.title,
            p.medium,
            p.metadata?.subcategory,
            p.metadata?.material,
            p.metadata?.category,
          ]
            .join(" ")
            .toLowerCase();
          return kws.some((kw: string) => fields.includes(kw));
        });
        return filtered.length > 0 ? filtered : (data as unknown as JewelleryProduct[]);
      }
      // Fallback: filter mock data
      const kws = meta.keywords.map((k: string) => k.toLowerCase());
      return MOCK_JEWELLERY_PRODUCTS.filter((p: JewelleryProduct) => {
        const fields = [p.title, p.medium, p.metadata?.subcategory ?? ""]
          .join(" ")
          .toLowerCase();
        return kws.some((kw: string) => fields.includes(kw));
      });
    },
  });

  const items = products.data ?? [];

  return (
    <div className="bg-paper text-ink pb-24">
      {/* ── Breadcrumb ─────────────────────────────────────────────── */}
      <nav
        aria-label="Breadcrumb"
        className="container-editorial py-4 flex items-center gap-1.5 text-xs text-muted-foreground"
      >
        <Link to="/" className="hover:text-ink transition-colors">
          Home
        </Link>
        <ChevronRight size={12} />
        <Link to="/collection" className="hover:text-ink transition-colors">
          Collections
        </Link>
        <ChevronRight size={12} />
        <span className="text-ink font-medium">{meta.h1}</span>
      </nav>

      {/* ── Hero / H1 ──────────────────────────────────────────────── */}
      <section className="bg-mist/30 border-b border-hairline py-14 md:py-20">
        <div className="container-editorial max-w-3xl">
          <Reveal>
            <span className="text-[10px] uppercase tracking-[0.25em] text-[color:var(--gold)] font-medium block mb-3">
              {meta.collectionFilter === "handcrafted"
                ? "Handcrafted Collection"
                : "Sterling Silver 925 Collection"}
            </span>
            {/* TASK 4: Exactly one H1 per page */}
            <h1 className="font-serif text-3xl md:text-5xl text-ink leading-tight">
              {meta.h1}
            </h1>
            {/* 150-250 word intro — TODO(human): review before publishing */}
            <div className="mt-6 space-y-4 text-sm text-ink/75 leading-relaxed max-w-2xl">
              {meta.intro.split("\n\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/collection"
                search={
                  meta.collectionFilter
                    ? { category: meta.collectionFilter }
                    : {}
                }
                className="cta-gold text-xs px-6 py-3 inline-flex items-center gap-2"
              >
                <span>View All {meta.collectionFilter === "handcrafted" ? "Handcrafted" : "Sterling Silver"}</span>
                <ArrowRight size={13} />
              </Link>
              <Link
                to="/contact"
                className="cta-outline text-xs px-6 py-3 inline-flex items-center gap-2"
              >
                Custom Order
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Product Grid ───────────────────────────────────────────── */}
      <section className="container-editorial py-14">
        <h2 className="font-serif text-2xl md:text-3xl text-ink mb-8">
          {items.length > 0
            ? `${items.length} Piece${items.length !== 1 ? "s" : ""} in this Collection`
            : "Explore our Collection"}
        </h2>

        {items.length === 0 && !products.isPending ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-sm">
              New pieces are being added to this category. Check back soon, or{" "}
              <Link to="/collection" className="underline hover:text-ink">
                browse all collections
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {items.map((product) => (
              <Reveal key={product.id ?? product.slug}>
                <JewelleryCard product={product} />
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {/* ── Category Cross-links ────────────────────────────────────── */}
      <section className="container-editorial pb-14">
        <h2 className="font-serif text-xl text-ink mb-6">Browse Other Categories</h2>
        <div className="flex flex-wrap gap-2">
          {Object.values(CATEGORIES)
            .filter((c: CategoryMeta) => c.slug !== meta.slug)
            .map((c: CategoryMeta) => (
              <Link
                key={c.slug}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                to={("/jewellery/$category") as any}
                params={{ category: c.slug }}
                className="text-xs px-4 py-2 border border-hairline hover:border-[color:var(--gold)] hover:text-[color:var(--gold)] transition-colors rounded-xs"
              >
                {c.h1.split("—")[0].trim()}
              </Link>
            ))}
        </div>
      </section>
    </div>
  );
}
