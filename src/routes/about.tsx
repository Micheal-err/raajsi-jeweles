import { createFileRoute, Link } from "@tanstack/react-router";
import { Reveal } from "@/components/Reveal";
import { PageHero, KineticTitle } from "@/components/PageHero";
import { KineticBand } from "@/components/KineticBand";
import heroSlide1 from "@/assets/hero-slide-1.jpg";
import { ParallaxImage } from "@/components/Parallax";
import heroImg from "@/assets/jewellery-hero.png";
import ringImg from "@/assets/jewellery-rings.png";
import banglesImg from "@/assets/jewellery-bangles.jpg";
import necklaceImg from "@/assets/jewellery-necklace.jpg";
import {
  Sparkles,
  ShieldCheck,
  Check,
  Gem,
  Award,
  ArrowRight,
  Layers,
  Heart,
  Compass,
} from "lucide-react";

import {
  SITE_NAME,
  SITE_LOCALE,
  canonical,
  defaultOgImage,
  breadcrumbSchema,
} from "@/components/seo-head";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      {
        title:
          "About Raajsi Jewels — Handcrafted Jewellery Brand from Jaipur, India | Our Story",
      },
      {
        name: "description",
        content:
          "Learn about Raajsi Jewels — a Jaipur-based jewellery brand crafting 925 Sterling Silver and Handcrafted Jewellery since 2009. Inspired by timeless design, Indian craftsmanship, and modern elegance.",
      },
      {
        name: "keywords",
        content:
          "about raajsi jewels, jaipur jewellery brand, indian handcrafted jewellery story, 925 silver jewellery brand india, artisan jewellery jaipur",
      },
      {
        property: "og:title",
        content: "About Raajsi Jewels — Our Story | Jaipur, India",
      },
      {
        property: "og:description",
        content:
          "Discover the philosophy, craftsmanship, and distinctive collections of Raajsi — Timeless Luxury, Crafted for You.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: canonical("/about") },
      { property: "og:image", content: defaultOgImage() },
      { property: "og:site_name", content: SITE_NAME },
      { property: "og:locale", content: SITE_LOCALE },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "twitter:title",
        content: "About Raajsi Jewels — Jaipur Jewellery Brand",
      },
      {
        name: "twitter:description",
        content:
          "Handcrafted jewellery inspired by Indian craftsmanship & modern elegance. Since 2009.",
      },
      { name: "twitter:image", content: defaultOgImage() },
    ],
    links: [{ rel: "canonical", href: canonical("/about") }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(
          breadcrumbSchema([
            { name: "Home", url: canonical("/") },
            { name: "About Us", url: canonical("/about") },
          ]),
        ),
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="bg-paper text-ink pb-24">
      {/* 1. HERO HEADER */}
      <PageHero
        eyebrow="About Raajsi · Jaipur, India"
        title={
          <KineticTitle>
            Timeless Luxury, <em className="italic">Crafted for You</em>.
          </KineticTitle>
        }
        lede="Raajsi is a jewellery brand inspired by the beauty of timeless design, Indian craftsmanship, and modern elegance."
        meta={
          <>
            <span>Brand: Raajsi</span>
            <span>·</span>
            <span>Tagline: Timeless Luxury</span>
            <span>·</span>
            <span>Jaipur, India</span>
          </>
        }
        visual="gallery"
      />

      <KineticBand />

      {/* Hero Showcase Image */}
      <section className="container-editorial pb-16 md:pb-24 pt-8 md:pt-12">
        <Reveal>
          <div className="relative overflow-hidden shadow-xl border border-hairline group">
            <ParallaxImage
              src={heroSlide1}
              alt="Raajsi Jewellery Atelier in Jaipur, India"
              aspectRatio="aspect-[16/9]"
              className="w-full h-[400px] md:h-[580px]"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/20 to-transparent pointer-events-none" />
              <div className="absolute bottom-6 left-6 md:bottom-8 md:left-8 bg-paper/95 backdrop-blur px-6 py-4 border border-hairline z-10 shadow-lg max-w-md">
                <span className="text-[10px] tracking-[0.25em] uppercase font-semibold text-[color:var(--gold)] block mb-1">
                  Atelier & Origin
                </span>
                <p className="font-serif text-lg text-ink font-medium leading-snug">
                  Jaipur, Rajasthan, India
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Where traditional craftsmanship and contemporary aesthetics come together.
                </p>
              </div>
            </ParallaxImage>
          </div>
        </Reveal>
      </section>

      {/* 2. ABOUT RAAJSI SECTION */}
      <section className="container-editorial pb-20 md:pb-28">
        <div className="grid md:grid-cols-12 gap-10 lg:gap-16 items-start">
          <div className="md:col-span-5 md:sticky md:top-32 self-start space-y-3">
            <div className="text-[11px] uppercase tracking-[0.25em] text-[color:var(--gold)] font-medium">
              1. About Us
            </div>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-ink leading-tight">
              About Raajsi
            </h2>
            <div className="w-12 h-px bg-[color:var(--gold)] mt-4" />
          </div>

          <div className="md:col-span-7 space-y-6 text-lg md:text-xl leading-relaxed text-ink/85 font-light">
            <p className="font-serif text-2xl md:text-3xl text-ink font-normal leading-snug italic">
              "Timeless Luxury, Crafted for You"
            </p>

            <p>
              Raajsi is a jewellery brand inspired by the beauty of timeless design, Indian craftsmanship,
              and modern elegance.
            </p>

            <p>
              We believe jewellery should be more than an accessory — it should reflect your personality,
              complement your individuality, and become a part of the moments you cherish.
            </p>

            <p>
              From minimal everyday pieces to distinctive handcrafted designs, Raajsi brings together
              contemporary aesthetics and traditional craftsmanship to create jewellery that feels both
              elegant and personal.
            </p>

            <p className="text-base text-ink/75 border-l-2 pl-5 py-1 italic" style={{ borderColor: "var(--gold)" }}>
              Our collections are thoughtfully curated for those who appreciate beautiful details,
              expressive designs, and jewellery that can be worn and loved beyond a single occasion.
            </p>
          </div>
        </div>
      </section>

      {/* 3. OUR PHILOSOPHY */}
      <section className="bg-mist/50 border-y border-hairline py-20 md:py-28">
        <div className="container-editorial">
          <Reveal>
            <div className="max-w-3xl mb-12">
              <div className="text-[11px] uppercase tracking-[0.25em] text-[color:var(--gold)] font-medium mb-2">
                Brand Core
              </div>
              <h2 className="font-serif text-3xl md:text-5xl text-ink mb-4">
                Our Philosophy
              </h2>
              <p className="font-serif text-xl md:text-2xl text-ink/90 italic leading-relaxed">
                At Raajsi, we believe luxury does not always have to be extravagant.
              </p>
              <p className="text-base md:text-lg text-muted-foreground mt-3 leading-relaxed">
                True luxury lies in thoughtful design, quality, craftsmanship, and the feeling a piece gives you
                when you wear it.
              </p>
            </div>
          </Reveal>

          {/* 5 Emphasis Pillars */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 mt-8">
            {[
              {
                num: "01",
                title: "Timeless Aesthetics",
                desc: "Classic silhouettes that remain forever graceful beyond fleeting trends.",
              },
              {
                num: "02",
                title: "Thoughtful Craftsmanship",
                desc: "Meticulous attention to every contour, setting, metal purity, and finish.",
              },
              {
                num: "03",
                title: "Contemporary Design",
                desc: "Modern, wearable sensibilities tailored for today's dynamic lifestyles.",
              },
              {
                num: "04",
                title: "Individual Expression",
                desc: "Jewellery created to reflect personality and complement individuality.",
              },
              {
                num: "05",
                title: "Everyday & Occasion Wear",
                desc: "Versatility that transitions effortlessly from daily wear to celebrations.",
              },
            ].map((pillar, idx) => (
              <Reveal key={pillar.num} delayMs={idx * 80}>
                <div className="bg-paper p-6 border border-hairline h-full flex flex-col justify-between hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                  <div>
                    <span className="font-mono text-xs text-[color:var(--gold)] font-semibold block mb-3">
                      {pillar.num}
                    </span>
                    <h3 className="font-serif text-lg font-medium text-ink mb-2">
                      {pillar.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {pillar.desc}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="mt-12 p-6 bg-paper border border-hairline text-center max-w-2xl mx-auto">
            <p className="text-sm md:text-base text-ink/85 leading-relaxed font-serif">
              Whether you prefer understated elegance or something more distinctive, Raajsi is designed
              to help you find a piece that feels uniquely yours.
            </p>
          </div>
        </div>
      </section>

      {/* 4. MADE TO BE YOURS */}
      <section className="container-editorial py-20 md:py-28">
        <div className="grid md:grid-cols-12 gap-10 items-center">
          <div className="md:col-span-6 space-y-6">
            <div className="text-[11px] uppercase tracking-[0.25em] text-[color:var(--gold)] font-medium">
              Expression
            </div>
            <h2 className="font-serif text-3xl md:text-5xl text-ink leading-tight">
              Made to Be Yours
            </h2>
            <div className="w-12 h-px bg-[color:var(--gold)]" />
            <p className="text-lg md:text-xl text-ink/85 font-serif italic">
              Every piece carries its own character.
            </p>
            <p className="text-base text-muted-foreground leading-relaxed">
              From the clean elegance of our Sterling Silver collection to the artistic charm of our
              handcrafted jewellery, Raajsi celebrates different expressions of beauty.
            </p>
            <div className="pt-2">
              <span className="font-serif text-xl font-medium tracking-wide text-ink">
                Raajsi — Timeless Luxury.
              </span>
            </div>
          </div>

          <div className="md:col-span-6 grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="aspect-[4/5] overflow-hidden border border-hairline rounded-sm">
                <img
                  src={ringImg}
                  alt="Sterling Silver minimal elegance"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                />
              </div>
              <div className="text-center">
                <span className="text-xs uppercase tracking-widest text-ink font-serif font-medium">
                  Sterling Silver 925
                </span>
                <p className="text-[11px] text-muted-foreground">Modern • Minimal • Elegant</p>
              </div>
            </div>

            <div className="space-y-4 pt-8">
              <div className="aspect-[4/5] overflow-hidden border border-hairline rounded-sm">
                <img
                  src={banglesImg}
                  alt="Handcrafted Jewels artistry"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                />
              </div>
              <div className="text-center">
                <span className="text-xs uppercase tracking-widest text-ink font-serif font-medium">
                  Handcrafted Jewels
                </span>
                <p className="text-[11px] text-muted-foreground">Artistic • Whimsical • Expressive</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. EXPLORE OUR TWO DISTINCT COLLECTIONS (Clearly Separated) */}
      <section className="bg-mist/30 border-t border-hairline py-20 md:py-28">
        <div className="container-editorial">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[11px] uppercase tracking-[0.25em] text-[color:var(--gold)] font-medium block mb-2">
              2. Collections
            </span>
            <h2 className="font-serif text-3xl md:text-5xl text-ink mb-4">
              Our Collections
            </h2>
            <p className="text-muted-foreground text-sm md:text-base">
              Explore two distinctive expressions of Raajsi jewellery — refined Sterling Silver and artistic handcrafted pieces.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {/* COLLECTION 01: STERLING SILVER 925 */}
            <div className="bg-paper border border-hairline p-8 md:p-10 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-hairline pb-3">
                  <span className="text-xs font-mono text-[color:var(--gold)] font-semibold uppercase tracking-wider">
                    Collection 01
                  </span>
                  <span className="text-[10px] uppercase tracking-wider bg-mist px-2.5 py-1 text-ink/80 rounded-xs">
                    925 Hallmark
                  </span>
                </div>

                <h3 className="font-serif text-2xl md:text-3xl text-ink">
                  Sterling Silver 925
                </h3>
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
                  Modern. Elegant. Timeless.
                </p>

                <p className="text-sm text-ink/80 leading-relaxed">
                  Our Sterling Silver collection is crafted in 925 Sterling Silver, offering a refined and versatile
                  aesthetic for everyday elegance and special occasions. Designed with a modern and minimal approach,
                  these pieces are made for those who appreciate understated luxury. From delicate jewellery to
                  contemporary statement pieces, the collection combines simplicity with sophisticated detailing.
                </p>

                <div className="pt-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-ink block mb-2">
                    Collection Highlights:
                  </span>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--gold)]" />
                      <span>925 Sterling Silver</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--gold)]" />
                      <span>Modern and minimal designs</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--gold)]" />
                      <span>Elegant everyday jewellery</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--gold)]" />
                      <span>Versatile styling & Timeless aesthetic</span>
                    </li>
                  </ul>
                </div>

                <div className="text-xs text-ink/75 pt-1">
                  <strong>Perfect for:</strong> Everyday wear, gifting, layering, and effortless occasions.
                </div>
              </div>

              <div className="pt-8">
                <Link
                  to="/collection"
                  search={{ category: "sterling-silver" }}
                  className="w-full text-center inline-flex items-center justify-center gap-2 py-3 px-6 text-xs uppercase tracking-[0.18em] bg-ink text-paper hover:bg-ink/90 transition-colors rounded-xs font-medium"
                >
                  <span>Explore Sterling Silver</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>

            {/* COLLECTION 02: HANDCRAFTED JEWELS */}
            <div className="bg-paper border border-hairline p-8 md:p-10 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-hairline pb-3">
                  <span className="text-xs font-mono text-[color:var(--gold)] font-semibold uppercase tracking-wider">
                    Collection 02
                  </span>
                  <span className="text-[10px] uppercase tracking-wider bg-mist px-2.5 py-1 text-ink/80 rounded-xs">
                    Artisanal Heritage
                  </span>
                </div>

                <h3 className="font-serif text-2xl md:text-3xl text-ink">
                  Handcrafted Jewels
                </h3>
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
                  Artistic. Expressive. Unique.
                </p>

                <p className="text-sm text-ink/80 leading-relaxed">
                  Our Handcrafted collection celebrates jewellery with character. Each piece is inspired by artistry,
                  distinctive forms, colours, textures, and traditional influences while being designed to complement a
                  contemporary wardrobe. These pieces are created for those who want jewellery that feels expressive,
                  unconventional, and personal. From statement pieces to distinctive rings, cuffs, earrings, and
                  necklaces, the Handcrafted collection brings a more artistic expression to Raajsi.
                </p>

                <div className="pt-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-ink block mb-2">
                    Collection Highlights:
                  </span>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--gold)]" />
                      <span>Handcrafted designs & Artistic distinctive forms</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--gold)]" />
                      <span>Expressive styling</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--gold)]" />
                      <span>Statement and occasion pieces</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--gold)]" />
                      <span>Contemporary interpretation of traditional inspiration</span>
                    </li>
                  </ul>
                </div>

                <div className="text-xs text-ink/75 pt-1">
                  <strong>Perfect for:</strong> Statement looks, occasions, gifting, and expressing your individual style.
                </div>
              </div>

              <div className="pt-8">
                <Link
                  to="/collection"
                  search={{ category: "handcrafted" }}
                  className="w-full text-center inline-flex items-center justify-center gap-2 py-3 px-6 text-xs uppercase tracking-[0.18em] border border-ink text-ink hover:bg-ink hover:text-paper transition-colors rounded-xs font-medium"
                >
                  <span>Explore Handcrafted</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
