/**
 * /blog — Blog index page with outlines for 5 planned articles.
 *
 * Content is OUTLINE ONLY — full articles need to be written by a human
 * or content team. Each outline is marked clearly as a TODO.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ChevronRight } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import {
  canonical,
  SITE_NAME,
  defaultOgImage,
  breadcrumbSchema,
} from "@/components/seo-head";

// ── Blog post catalogue (outlines only) ──────────────────────────────
export const BLOG_POSTS = [
  {
    slug: "how-to-check-if-silver-is-real-925",
    title: "How to Check If Silver Is Real 925 Sterling Silver",
    seoTitle: "How to Check If Silver Is Real 925 | Raajsi Jewels",
    seoDesc:
      "Simple tests to check if your silver jewellery is genuine 925 sterling silver. Magnet test, hallmark, acid test & more explained.",
    publishDate: "2026-10-01",
    category: "Silver Guide",
    readTime: "5 min",
    // TODO(human): Expand this outline into a full 600-1000 word article
    outline: `
# Outline — How to Check If Silver Is Real 925

## Introduction
- Why it matters: fake silver tarnishes badly, can cause skin reactions
- What "925 sterling silver" means (92.5% pure silver, 7.5% alloy)

## Test 1: Look for the Hallmark
- What BIS hallmark looks like in India
- Where to find the stamped mark (inside ring bands, clasp of necklace, back of earring post)
- Common marks: 925, S925, STERLING

## Test 2: The Magnet Test
- Silver is non-magnetic — a strong magnet should not attract it
- Limitations: base metals that are also non-magnetic

## Test 3: The Ice Test
- Silver is one of the best heat conductors among metals
- Ice placed on real silver melts noticeably faster

## Test 4: The Oxidation/Tarnish Test
- Real silver tarnishes to a dark grey-black when exposed to air; fakes plate off

## Test 5: Professional / Acid Test
- Available at jewellers; most definitive test
- Not practical for everyday use

## Buying from Verified Sources
- Why buying from certified brands like Raajsi Jewels matters
- Link to /collection and /about

## Conclusion + CTA
- Summary of tests
- Encourage readers to shop 925 certified at Raajsi Jewels
    `.trim(),
  },
  {
    slug: "925-silver-vs-pure-silver",
    title: "925 Silver vs Pure Silver — What's the Difference?",
    seoTitle: "925 Silver vs Pure Silver — Key Differences | Raajsi",
    seoDesc:
      "Understand the difference between 925 sterling silver and pure (999) silver. Which is better for jewellery? Explained by Raajsi Jewels.",
    publishDate: "2026-10-05",
    category: "Silver Guide",
    readTime: "4 min",
    // TODO(human): Expand this outline into a full 600-1000 word article
    outline: `
# Outline — 925 Silver vs Pure Silver

## Introduction
- Common confusion between fine silver (999) and sterling silver (925)

## What Is Pure Silver (999)?
- 99.9% silver content
- Very soft, malleable, not suitable for most jewellery

## What Is 925 Sterling Silver?
- 92.5% silver + 7.5% alloy (usually copper or zinc)
- Significantly harder and more durable
- Retains the beautiful lustre of pure silver

## Why Sterling Silver Is Better for Jewellery
- Holds shape and setting better
- More scratch-resistant
- Hypoallergenic (when copper-alloyed, not nickel)

## Comparison Table
| Property | Pure Silver (999) | Sterling Silver (925) |
|---|---|---|
| Silver content | 99.9% | 92.5% |
| Hardness | Very soft | Hard enough for daily wear |
| Tarnish | Less prone | Tarnishes faster, but polishes easily |
| Use in jewellery | Rarely | Standard |

## Conclusion + CTA
- 925 sterling silver is the industry gold standard
- All Raajsi Jewels silver pieces are 925 — link to /collection
    `.trim(),
  },
  {
    slug: "does-sterling-silver-tarnish-and-how-to-clean-it",
    title: "Does Sterling Silver Tarnish? And How to Clean It",
    seoTitle: "Does Sterling Silver Tarnish? How to Clean It | Raajsi",
    seoDesc:
      "Yes, sterling silver tarnishes — here's why and how to clean and store your silver jewellery to keep it shining. Easy home methods.",
    publishDate: "2026-10-10",
    category: "Care Guide",
    readTime: "6 min",
    // TODO(human): Expand this outline into a full 600-1000 word article
    outline: `
# Outline — Does Sterling Silver Tarnish and How to Clean It

## Introduction
- Yes, sterling silver tarnishes — this is normal and not a sign of poor quality
- Caused by chemical reaction of silver with sulphur compounds in air

## Why Does Sterling Silver Tarnish?
- The copper alloy reacts with oxygen and sulphur
- Faster in humid environments, near perfume/lotions/chlorine

## How to Clean Sterling Silver at Home
### Method 1: Soap & Water
### Method 2: Baking Soda + Aluminium Foil
### Method 3: Silver Polish Cloth
### What NOT to use (bleach, toothpaste — can scratch)

## How to Store Silver to Prevent Tarnishing
- Anti-tarnish pouches or zip-lock bags with anti-tarnish strips
- Keep away from sunlight and moisture
- Avoid storing with rubber or latex

## Professional Cleaning
- When to visit a jeweller
- Ultrasonic cleaners — safe for plain silver, risky for stone-set pieces

## Conclusion + CTA
- With proper care, silver jewellery lasts decades
- Browse Raajsi's care-friendly silver designs — link to /collection
    `.trim(),
  },
  {
    slug: "is-silver-jewellery-safe-for-daily-wear",
    title: "Is Silver Jewellery Safe for Daily Wear?",
    seoTitle: "Is Silver Jewellery Safe for Daily Wear? | Raajsi Jewels",
    seoDesc:
      "Is wearing silver jewellery every day safe for your skin? Yes — here's why 925 sterling silver is ideal for daily wear explained by Raajsi.",
    publishDate: "2026-10-15",
    category: "Silver Guide",
    readTime: "4 min",
    // TODO(human): Expand this outline into a full 600-1000 word article
    outline: `
# Outline — Is Silver Jewellery Safe for Daily Wear?

## Introduction
- Short answer: Yes — with the right silver quality and care

## Why 925 Sterling Silver Is Safe for Skin
- Hypoallergenic properties (when copper-alloyed, not nickel)
- BIS certification ensures purity
- Widely used in medical-grade and everyday jewellery globally

## Who Should Be Careful?
- People with known nickel or copper sensitivity
- Signs of sensitivity: redness, itching under jewellery
- Recommendation: choose rhodium-plated or certified nickel-free pieces

## Tips for Daily Wear
- Remove before swimming (chlorine) and while applying lotions/perfume
- Wipe down with soft cloth after wearing
- Store in anti-tarnish pouch overnight

## Is Raajsi Silver Safe?
- Confirm with your own testing if sensitive — TODO(human): add any brand certification details here
- All Raajsi silver pieces are 925 sterling silver

## Conclusion + CTA
- Daily silver wear is safe and beautiful
- Link to earrings, rings, and bracelets collections
    `.trim(),
  },
  {
    slug: "meenakari-vs-kundan-vs-polki-explained",
    title: "Meenakari vs Kundan vs Polki — Jaipur Jewellery Explained",
    seoTitle: "Meenakari vs Kundan vs Polki Explained | Raajsi Jewels",
    seoDesc:
      "What's the difference between Meenakari, Kundan, and Polki jewellery? Jaipur's three iconic jewellery arts explained by Raajsi Jewels.",
    publishDate: "2026-10-20",
    category: "Craft Guide",
    readTime: "7 min",
    // TODO(human): Expand this outline into a full 600-1000 word article
    outline: `
# Outline — Meenakari vs Kundan vs Polki Explained

## Introduction
- Jaipur is India's jewellery capital — three signature arts: Meenakari, Kundan, Polki
- Why they're often confused and how they're different

## Meenakari — The Art of Enamel
- Definition: decorating metal with heat-fused enamel pigments
- Jaipur's Meenakari: vivid colours (turquoise, red, green, white)
- Common designs: floral, peacock, geometric
- Typical use: earrings, pendants, backs of Kundan sets

## Kundan — The Royal Gem-Setting Art
- Definition: setting polished, uncut gemstones into refined gold foil (Kundan)
- Originated in Mughal royal courts, perfected in Jaipur
- Characteristic look: bright, luminous gems in intricate gold settings
- Typical use: bridal sets, festive necklaces, maang tikka

## Polki — Uncut Diamond Jewellery
- Definition: Polki = uncut, rough diamonds set in gold
- Different from Kundan: Kundan can use any gemstone or glass; Polki specifically uses real uncut diamonds
- Most precious and expensive of the three
- Typical use: high-value bridal and occasion jewellery

## Side-by-side Comparison Table
| | Meenakari | Kundan | Polki |
|---|---|---|---|
| Technique | Enamel on metal | Gem-setting in foil | Uncut diamond setting |
| Material | Silver/gold + enamel | Gold foil + gemstones | Gold + uncut diamonds |
| Price range | Accessible | Mid to high | High to very high |
| Occasion | Festive/daily | Festive/bridal | Bridal/heirloom |

## How Raajsi Uses These Traditions
- Our Handcrafted collection draws from all three — link to /jewellery/meenakari and /jewellery/kundan

## Conclusion + CTA
- Celebrate the artistry — shop Meenakari and Kundan at Raajsi
    `.trim(),
  },
];

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title: "Jewellery Blog — Silver Care, Craft & Buying Guides | Raajsi" },
      {
        name: "description",
        content:
          "Learn about 925 sterling silver, Meenakari, Kundan jewellery, care tips and buying guides from Raajsi Jewels — Jaipur's handcrafted jewellery brand.",
      },
      {
        name: "robots",
        content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
      },
      { property: "og:title", content: "Jewellery Blog | Raajsi Jewels, Jaipur" },
      {
        property: "og:description",
        content:
          "Silver care guides, craft explainers and jewellery buying tips from Raajsi Jewels.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: canonical("/blog") },
      { property: "og:image", content: defaultOgImage() },
      { property: "og:site_name", content: SITE_NAME },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@jewels_raajsi" },
    ],
    links: [{ rel: "canonical", href: canonical("/blog") }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(
          breadcrumbSchema([
            { name: "Home", url: canonical("/") },
            { name: "Blog", url: canonical("/blog") },
          ]),
        ),
      },
    ],
  }),
  component: BlogIndex,
});

function BlogIndex() {
  return (
    <div className="bg-paper text-ink pb-24">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="container-editorial py-4 flex items-center gap-1.5 text-xs text-muted-foreground"
      >
        <Link to="/" className="hover:text-ink transition-colors">
          Home
        </Link>
        <ChevronRight size={12} />
        <span className="text-ink font-medium">Blog</span>
      </nav>

      {/* H1 */}
      <section className="bg-mist/30 border-b border-hairline py-14 md:py-20">
        <div className="container-editorial max-w-3xl">
          <Reveal>
            <span className="text-[10px] uppercase tracking-[0.25em] text-[color:var(--gold)] font-medium block mb-3">
              Jewellery Knowledge
            </span>
            <h1 className="font-serif text-3xl md:text-5xl text-ink leading-tight">
              Silver Care, Craft & Buying Guides
            </h1>
            <p className="mt-4 text-sm text-ink/75 max-w-xl leading-relaxed">
              Everything you need to know about 925 sterling silver, Meenakari, Kundan and
              Polki jewellery — written by the team at Raajsi Jewels, Jaipur.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Post grid */}
      <section className="container-editorial py-14">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {BLOG_POSTS.map((post) => (
            <Reveal key={post.slug}>
              <article className="border border-hairline bg-paper flex flex-col h-full">
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] uppercase tracking-widest text-[color:var(--gold)] font-medium">
                      {post.category}
                    </span>
                    <span className="text-muted-foreground text-[10px]">·</span>
                    <span className="text-[10px] text-muted-foreground">{post.readTime} read</span>
                  </div>
                  <h2 className="font-serif text-lg text-ink leading-snug mb-3">
                    {post.title}
                  </h2>
                  <p className="text-sm text-ink/70 leading-relaxed mb-4 flex-1">
                    {post.seoDesc}
                  </p>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-hairline">
                    <span className="text-[11px] text-muted-foreground">{post.publishDate}</span>
                    <Link
                      to="/blog/$slug"
                      params={{ slug: post.slug }}
                      className="text-xs text-ink hover:text-[color:var(--gold)] font-medium flex items-center gap-1 transition-colors"
                    >
                      Read outline <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
