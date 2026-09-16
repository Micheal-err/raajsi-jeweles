import { createFileRoute, Link } from "@tanstack/react-router";
import { Reveal } from "@/components/Reveal";
import { PageHero, KineticTitle } from "@/components/PageHero";
import { KineticBand } from "@/components/KineticBand";
import interior from "@/assets/gallery-interior.jpg";
import { ParallaxImage } from "@/components/Parallax";
import heroImg from "@/assets/hero-artwork.jpg";
import art1 from "@/assets/artwork-1.jpg";
import art2 from "@/assets/artwork-2.jpg";
import art3 from "@/assets/artwork-3.jpg";
import art4 from "@/assets/artwork-4.jpg";
import { Testimonials } from "@/components/Testimonials";
import {
  Check,
  Sparkles,
  Compass,
  ShieldCheck,
  HeartHandshake,
  Eye,
  Award,
  Layers,
} from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Raajsi Jewels, Jaipur" },
      {
        name: "description",
        content:
          "Founded in 2009, Raajsi Jewels is a Jaipur-based fine jewellery house committed to Rajasthani craft traditions, BIS Hallmark integrity, and connecting artisans with collectors worldwide.",
      },
      { property: "og:title", content: "About — Raajsi Jewels" },
      {
        property: "og:description",
        content:
          "A Jaipur-based fine jewellery house since 2009. Rajasthani craftsmanship with BIS Hallmark certification on every piece.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <>
      {/* Hero Header */}
      <PageHero
        eyebrow="About Raajsi Jewels"
        title={
          <KineticTitle>
            Where Rajasthani tradition meets <em className="italic">timeless elegance</em>.
          </KineticTitle>
        }
        lede="Founded in 2009, Raajsi Jewels is a Jaipur-based fine jewellery house committed to preserving Rajasthani craft traditions, presenting exquisite collections, and connecting master artisans with collectors, brides, and connoisseurs across India and the world."
        meta={
          <>
            <span>Est. 2009</span>
            <span>·</span>
            <span>Jaipur, Rajasthan</span>
            <span>·</span>
            <span>Fine Indian Jewellery</span>
          </>
        }
        visual="gallery"
      />

      <KineticBand />

      {/* Hero Image Section */}
      <section className="container-editorial pb-20 md:pb-28 pt-12 md:pt-16">
        <Reveal>
          <div className="relative overflow-hidden group shadow-xl border border-hairline">
            <ParallaxImage
              src={interior}
              alt="Interior of Raajsi Jewels Showroom, Jaipur"
              aspectRatio="aspect-[16/9]"
              className="w-full h-[450px] md:h-[620px]"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-ink/65 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-6 left-6 md:bottom-8 md:left-8 bg-paper/95 backdrop-blur px-5 py-3 border border-hairline z-10 shadow-lg">
                <span className="eyebrow text-[color:var(--gold)]">The Showroom & Atelier</span>
                <p className="text-xs text-ink/80 mt-0.5 font-medium">C-Scheme, Jaipur · Rajasthan, India</p>
              </div>
            </ParallaxImage>
          </div>
        </Reveal>
      </section>

      {/* Overview & Story */}
      <section className="container-editorial pb-24 md:pb-32">
        <div className="grid md:grid-cols-12 gap-10 items-start">
          <div className="md:col-span-4 md:sticky md:top-32 self-start space-y-3">
            <div className="eyebrow" style={{ color: 'var(--gold)' }}>Overview</div>
            <h2 className="font-serif text-3xl md:text-4xl text-ink leading-tight">
              A heritage jewellery house rooted in Rajasthani craft tradition.
            </h2>
          </div>
          <div className="md:col-span-7 md:col-start-6 space-y-6 text-lg leading-relaxed text-ink/85">
            <p>
              Operating from the pink city of Jaipur, Raajsi Jewels combines a commercially informed
              fine jewellery practice with deep reverence for Rajasthani craft traditions — Kundan,
              Meenakari, Polki, and Jadau work.
            </p>
            <p>
              We work with master craftsmen from Jaipur's old city, while remaining committed to
              introducing traditional techniques to modern, wearable designs that speak to
              contemporary sensibilities.
            </p>
            <p className="text-base text-ink/70 border-l-2 pl-4 italic" style={{ borderColor: 'var(--gold)' }}>
              "We view nurturing relationships with master artisans as the foundation of our role —
              helping them preserve their art form while reaching new audiences and collectors
              globally."
            </p>
          </div>
        </div>
      </section>

      {/* What the Gallery Represents (3 Pillars) */}
      <section className="bg-mist border-y border-hairline py-24 md:py-32">
        <div className="container-editorial">
          <Reveal>
            <div className="eyebrow mb-3">Core Focus</div>
            <h2 className="font-serif text-3xl md:text-5xl text-ink mb-12">
              What Raajsi Jewels Represents
            </h2>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {[
              {
                num: "01",
                icon: Layers,
                title: "Crafting & Presenting Collections",
                desc: "Creating bridal, festive, and everyday jewellery collections using traditional Kundan, Meenakari, Polki and contemporary techniques.",
              },
              {
                num: "02",
                icon: ShieldCheck,
                title: "BIS Hallmark Certified Jewellery",
                desc: "Every piece is hallmarked at BIS-approved centres. Gold, silver, and gemstones are certified for purity and quality with complete documentation.",
              },
              {
                num: "03",
                icon: HeartHandshake,
                title: "Supporting Master Artisans",
                desc: "Providing sustained relationships, fair wages, and global exposure for Jaipur's karigars and craftsmen — preserving their art for future generations.",
              },
            ].map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <Reveal key={pillar.num} delayMs={idx * 100}>
                  <div className="bg-paper p-8 border border-hairline h-full flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <span className="eyebrow font-mono text-sm">{pillar.num}</span>
                        <Icon size={20} className="text-[color:var(--accent)]" />
                      </div>
                      <h3 className="font-serif text-2xl mb-3 text-ink">{pillar.title}</h3>
                      <p className="text-sm text-ink/70 leading-relaxed">{pillar.desc}</p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>

          {/* Hosted Programming List */}
          <div className="mt-16 pt-12 border-t border-hairline grid md:grid-cols-12 gap-8">
            <div className="md:col-span-4">
              <div className="eyebrow mb-2">Services & Events</div>
              <h3 className="font-serif text-2xl">Raajsi Offers:</h3>
            </div>
            <div className="md:col-span-8 grid sm:grid-cols-2 gap-4 text-sm text-ink/80">
              {[
                "Bridal Jewellery Consultations",
                "Bespoke Custom Orders",
                "Jewellery Repair & Restoration",
                "Resizing & Polishing",
                "BIS Hallmarking Assistance",
                "Gemstone Grading Reports",
                "Gift Wrapping & Packaging",
                "Showroom Appointments",
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 p-2.5 border border-hairline bg-paper/60"
                >
                  <Check size={14} className="text-[color:var(--gold)] shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="container-editorial py-24 md:py-32">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16">
          {/* Vision */}
          <Reveal>
            <div className="border border-hairline p-8 md:p-12 bg-paper relative overflow-hidden h-full">
              <div className="eyebrow mb-4 text-[color:var(--accent)]">Our Vision</div>
              <h3 className="font-serif text-2xl md:text-3xl mb-6 text-ink">
                Rajasthan’s leading contemporary jewellery showroom & cultural institution.
              </h3>
              <p className="text-base text-ink/80 leading-relaxed">
                To establish Raajsi Jewels as Rajasthan’s leading contemporary jewellery showroom
                and cultural institution—one that strengthens the professional journeys of artists,
                expands access to meaningful art experiences, and connects Indian artistic practices
                with local and international audiences.
              </p>
            </div>
          </Reveal>

          {/* Mission */}
          <Reveal delayMs={150}>
            <div className="border border-hairline p-8 md:p-12 bg-paper relative overflow-hidden h-full">
              <div className="eyebrow mb-4 text-[color:var(--accent)]">Our Mission</div>
              <h3 className="font-serif text-2xl md:text-3xl mb-6 text-ink">
                Presenting authentic, original, and excellent artistic practices.
              </h3>
              <p className="text-base text-ink/80 leading-relaxed mb-6">
                To present authentic, original, and excellent artistic practices while creating
                lasting relationships between artists, collectors, institutions, businesses, and
                communities.
              </p>
              <ul className="space-y-2 text-sm text-ink/75">
                {[
                  "Promote Indian artists working in modern & contemporary practices",
                  "Encourage artistic experimentation and excellence",
                  "Facilitate meaningful art acquisition and collection",
                  "Build sustained dialogue between art, society, and contemporary life",
                ].map((m, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--accent)]" />
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Curatorial & Artistic Philosophy Quote */}
      <section className="bg-ink text-paper py-24 md:py-32">
        <div className="container-editorial">
          <Reveal>
            <div className="eyebrow text-paper/50 mb-6">Curatorial & Artistic Philosophy</div>
            <h2 className="font-serif text-3xl md:text-6xl leading-[1.1] max-w-4xl mb-8 text-paper">
              "For Raajsi Jewels, an artwork is not merely an object. Its value lies in the idea behind
              it, the artist’s process, its provenance, and its{" "}
              <em className="italic text-[color:var(--accent)]">materiality</em>."
            </h2>
            <p className="text-lg text-paper/80 max-w-2xl font-serif italic border-l border-paper/30 pl-4">
              "The gallery believes that{" "}
              <span className="text-[color:var(--accent)] not-italic font-medium">
                authenticity is priceless
              </span>
              . Anyone who acquires an artwork should feel confident not only in owning an authentic
              collectible, but also in understanding every attribute connected to it."
            </p>
          </Reveal>

          {/* 6 Philosophical Pillars */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 mt-16 pt-16 border-t border-paper/15">
            {[
              {
                title: "Authenticity",
                text: "Every work certified with direct studio provenance.",
              },
              {
                title: "Originality",
                text: "Honouring distinct artistic voices and visionary concepts.",
              },
              {
                title: "Artistic Excellence",
                text: "Upholding master craftsmanship and conceptual depth.",
              },
              {
                title: "Experimentation",
                text: "Supporting genre-pushing mediums and installations.",
              },
              {
                title: "Conceptual Relevance",
                text: "Bridging cultural heritage with modern global discourse.",
              },
              {
                title: "Collectibility",
                text: "Fostering long-term value for private and institutional archives.",
              },
            ].map((item, idx) => (
              <div key={idx} className="border border-paper/15 p-5 bg-paper/5">
                <span className="text-[10px] tracking-widest uppercase text-paper/40 block mb-2 font-mono">
                  Pillar 0{idx + 1}
                </span>
                <h4 className="font-serif text-lg text-paper mb-1">{item.title}</h4>
                <p className="text-xs text-paper/60 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Wider Cultural Life & Guided Walkthroughs */}
      <section className="container-editorial py-24 md:py-32">
        <div className="grid md:grid-cols-12 gap-12 items-center">
          <div className="md:col-span-6 space-y-6">
            <div className="eyebrow text-[color:var(--accent)]">A Wider Cultural Life</div>
            <h2 className="font-serif text-3xl md:text-5xl leading-tight text-ink">
              More than a commercial exhibition space.
            </h2>
            <p className="text-base text-ink/80 leading-relaxed">
              Raajsi Jewels is part of a larger cultural environment where visual art
              intersects with performance, literature, music, design, business, and public dialogue.
            </p>
            <p className="text-base text-ink/80 leading-relaxed">
              Our guided walk-throughs, led by knowledgeable members of the team, are designed to
              make the experience engaging, accessible, and memorable. Rather than simply viewing
              artworks, visitors are encouraged to understand the stories, ideas, materials, and
              artistic practices behind them.
            </p>
            <div className="pt-4">
              <Link to="/contact" className="cta-red">
                Contact Atelier & Consultation →
              </Link>
            </div>
          </div>
          <div className="md:col-span-6">
            <div className="grid grid-cols-2 gap-4">
              <img
                src={art1}
                alt="Cultural Event"
                className="w-full h-64 object-cover border border-hairline"
              />
              <img
                src={art2}
                alt="Gallery Guided Tour"
                className="w-full h-64 object-cover border border-hairline mt-8"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Who the Gallery Serves */}
      <section className="bg-mist border-y border-hairline py-24 md:py-32">
        <div className="container-editorial">
          <Reveal>
            <div className="eyebrow mb-3">Community & Audience</div>
            <h2 className="font-serif text-3xl md:text-5xl text-ink mb-12">
              Who the Gallery Serves
            </h2>
          </Reveal>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              "First-time Art Buyers",
              "Experienced Collectors",
              "High-Net-Worth Individuals",
              "Interior Designers & Architects",
              "Hospitality Businesses",
              "Corporate Collections",
              "Art Consultants & Patrons",
              "International Buyers & NRIs",
              "Artists & Curators",
              "Creative Professionals",
              "Cultural Enthusiasts",
              "Institutional Collectors",
            ].map((audience, i) => (
              <div key={i} className="p-4 bg-paper border border-hairline flex items-center gap-3">
                <Sparkles size={14} className="text-[color:var(--accent)] shrink-0" />
                <span className="text-sm font-medium text-ink">{audience}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What Makes Raajsi Jewels Unique (7 Points) */}
      <section className="container-editorial py-24 md:py-32">
        <Reveal>
          <div className="eyebrow mb-3 text-[color:var(--accent)]">Distinction</div>
          <h2 className="font-serif text-3xl md:text-5xl text-ink mb-12">
            What Makes Raajsi Jewels Unique
          </h2>
        </Reveal>

        <div className="space-y-4">
          {[
            {
              num: "01",
              title: "A Contemporary Art Practice with a Global Perspective",
              desc: "Combining Jaipur's rich artistic heritage with international curatorial standards.",
            },
            {
              num: "02",
              title: "Commitment to Indian Artists",
              desc: "Strengthening the presence and growing international relevance of modern and contemporary Indian practices.",
            },
            {
              num: "03",
              title: "Focus on Authenticity & Excellence",
              desc: "Unwavering commitment to certified provenance, original ideas, and master materiality.",
            },
            {
              num: "04",
              title: "Beyond Commercial Dealing",
              desc: "Extending into artist career development, institutional guidance, and public programming.",
            },
            {
              num: "05",
              title: "Diverse Multidisciplinary Venue",
              desc: "Capable of hosting exhibitions, performances, literature launches, and corporate cultural events.",
            },
            {
              num: "06",
              title: "Immersive Guided Art Experiences",
              desc: "Walk-throughs designed to foster restorative, art-led reflection and deep appreciation.",
            },
            {
              num: "07",
              title: "Relationship-Driven Approach",
              desc: "Sustained connections bridging artists with collectors, businesses, patrons, and markets.",
            },
          ].map((item) => (
            <div
              key={item.num}
              className="p-6 border border-hairline bg-paper flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-ink transition-colors"
            >
              <div className="flex items-start gap-4">
                <span className="font-mono text-xs text-[color:var(--accent)] font-bold">
                  {item.num}
                </span>
                <div>
                  <h4 className="font-serif text-lg text-ink font-medium">{item.title}</h4>
                  <p className="text-xs text-ink/70 mt-1">{item.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Kinetic Divider */}
      <KineticBand
        reverse
        words={[
          { t: "Authenticity", c: "solid" },
          { t: "is", c: "" },
          { t: "Priceless", c: "red" },
          { t: "·", c: "solid" },
          { t: "Introduced", c: "" },
          { t: "Interpreted", c: "red" },
          { t: "·", c: "solid" },
          { t: "Experienced", c: "" },
          { t: "Collected", c: "red" },
          { t: "·", c: "solid" },
          { t: "Carried", c: "" },
          { t: "Forward", c: "red" },
        ]}
      />

      {/* Closing Statement */}
      <section className="bg-mist border-t border-hairline py-24 md:py-32">
        <div className="container-editorial text-center max-w-3xl">
          <Reveal>
            <div className="eyebrow mb-4">Closing Statement</div>
            <h2 className="font-serif text-3xl md:text-5xl text-ink leading-tight mb-8">
              "At Raajsi Jewels, art is not simply displayed. It is introduced, interpreted,
              experienced, collected, and carried forward."
            </h2>
            <p className="text-base text-ink/80 leading-relaxed mb-10">
              Raajsi Jewels exists at the pinnacle of Jaipur fine jewellery crafting — where
              generations of royal goldsmiths, Kundan setters, and Meenakari artisans create
              timeless heirloom jewellery for families across the world.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/collection" className="cta-red">
                Explore the Collection →
              </Link>
              <Link to="/contact" className="cta-ghost">
                Contact Our Atelier
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <Testimonials eyebrow="Why collectors trust us" heading="A long view, on the record." />
    </>
  );
}
