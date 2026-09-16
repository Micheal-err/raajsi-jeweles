import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { ArtworkCard, type ArtworkCardData } from "./ArtworkCard";
import { Reveal } from "./Reveal";

import { MOCK_JEWELLERY_PRODUCTS } from "@/lib/jewellery-data";

export function RecentlyViewed() {
  const slugs = useRecentlyViewed();
  const { data } = useQuery({
    enabled: slugs.length > 0,
    queryKey: ["recently-viewed", slugs.join(",")],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("artworks")
          .select(
            "id,slug,title,medium,year_created,primary_image_url,availability,price_min,price_max,price_display,display_price",
          )
          .in("slug", slugs);
        if (data && data.length > 0) {
          const bySlug = new Map(
            data.map((r) => [
              r.slug,
              {
                ...r,
                artist: { name: "Raajsi Jewels Atelier", slug: "raajsi" },
              } as unknown as ArtworkCardData,
            ]),
          );
          return slugs.map((s) => bySlug.get(s)).filter(Boolean) as ArtworkCardData[];
        }
      } catch {
        // fallback to jewellery data
      }

      const jewelleryMatches = MOCK_JEWELLERY_PRODUCTS.filter((j) => slugs.includes(j.slug));
      return jewelleryMatches.map((j) => ({
        id: j.id,
        slug: j.slug,
        title: j.title,
        medium: j.medium,
        primary_image_url: j.primary_image_url,
        availability: "available",
        display_price: j.display_price,
        price_display: "fixed",
        price_min: null,
        price_max: null,
        artist: { name: "Raajsi Jewels Atelier", slug: "raajsi" },
      })) as unknown as ArtworkCardData[];
    },
  });

  const rows = data ?? [];
  if (rows.length === 0) return null;

  return (
    <section className="bg-mist border-t border-hairline py-16 md:py-20">
      <div className="container-editorial">
        <Reveal className="mb-8">
          <div className="eyebrow mb-2">Recently viewed</div>
          <h2 className="font-serif text-3xl md:text-4xl">
            Where you <em className="italic">left off</em>.
          </h2>
        </Reveal>
        <div className="flex gap-5 md:gap-6 overflow-x-auto snap-x snap-mandatory pb-4">
          {rows.map((r) => (
            <div
              key={r.slug}
              className="snap-start shrink-0 w-[70vw] sm:w-[46vw] md:w-[28vw] lg:w-[22vw]"
            >
              <ArtworkCard art={r} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
