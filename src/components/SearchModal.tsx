import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Search, X, Loader2, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { resolveImage } from "@/lib/images";
import { useFormatPrice } from "@/lib/currency-format";

interface ArtworkResult {
  id: string;
  slug: string;
  title: string;
  medium: string | null;
  primary_image_url: string | null;
  display_price: number | null;
  artist: { name: string; slug: string } | null;
}

interface ArtistResult {
  id: string;
  slug: string;
  name: string;
  nationality_origin: string | null;
  portrait_image_url: string | null;
}

import { MOCK_JEWELLERY_PRODUCTS } from "@/lib/jewellery-data";

export function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [artworks, setArtworks] = useState<ArtworkResult[]>([]);
  const [artists, setArtists] = useState<ArtistResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const formatPrice = useFormatPrice();

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setArtworks([]);
      setArtists([]);
    }
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setArtworks([]);
      setArtists([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      setLoading(true);
      const q = query.trim().toLowerCase();

      // Search jewellery collection locally
      const filtered = MOCK_JEWELLERY_PRODUCTS.filter((item) => {
        const titleMatch = item.title.toLowerCase().includes(q);
        const mediumMatch = (item.medium || "").toLowerCase().includes(q);
        const storyMatch = (item.story || "").toLowerCase().includes(q);
        const subcatMatch = ((item.metadata?.subcategory as string) || "").toLowerCase().includes(q);
        const genderMatch = ((item.metadata?.gender as string) || "").toLowerCase().includes(q);
        return titleMatch || mediumMatch || storyMatch || subcatMatch || genderMatch;
      });

      setArtworks(
        filtered.slice(0, 8).map((item) => ({
          id: item.id || item.slug,
          slug: item.slug,
          title: item.title,
          medium: item.medium ?? null,
          primary_image_url: item.primary_image_url ?? null,
          display_price: item.display_price ?? null,
          artist: { name: "Raajsi Jewels Atelier", slug: "raajsi" },
        }))
      );
      setArtists([]);
      setLoading(false);
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-ink/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-paper border border-hairline shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Input Bar */}
        <div className="flex items-center px-4 py-4 border-b border-hairline">
          <Search size={20} className="text-ink/40 mr-3 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search jewellery, gold, polki, rings, kadas, chains..."
            className="flex-1 bg-transparent border-0 outline-none text-base text-ink placeholder:text-ink/40 font-serif"
          />
          {loading && <Loader2 size={18} className="animate-spin text-ink/40 mr-2" />}
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 hover:text-ink text-ink/40 transition-colors mr-1"
            >
              <X size={16} />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-[10px] tracking-[0.2em] uppercase text-ink/50 hover:text-ink px-2 py-1 border border-hairline ml-2"
          >
            ESC
          </button>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {!query.trim() ? (
            <div className="text-center py-12 text-ink/40 text-xs tracking-widest uppercase">
              Start typing to search Raajsi Jewels catalogue
            </div>
          ) : !loading && artworks.length === 0 ? (
            <div className="text-center py-12">
              <p className="font-serif text-lg text-ink">No pieces found for "{query}"</p>
              <p className="text-xs text-ink/50 mt-1">
                Try searching for Gold, Silver, Ring, Kada, Chain, or Bridal.
              </p>
            </div>
          ) : (
            <>
              {/* Jewellery Section */}
              {artworks.length > 0 && (
                <div>
                  <h4 className="text-[10px] tracking-[0.22em] uppercase text-ink/40 mb-3 px-2">
                    Jewellery Pieces ({artworks.length})
                  </h4>
                  <div className="space-y-2">
                    {artworks.map((art) => (
                      <Link
                        key={art.id}
                        to="/artworks/$slug"
                        params={{ slug: art.slug }}
                        onClick={onClose}
                        className="flex items-center gap-3 p-2 hover:bg-mist transition-colors group"
                      >
                        <img
                          src={resolveImage(art.primary_image_url)}
                          alt={art.title}
                          className="w-12 h-14 object-cover border border-hairline shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-serif text-sm text-ink group-hover:text-[color:var(--accent)] transition-colors truncate">
                            {art.title}
                          </p>
                          <p className="text-[11px] text-ink/60 truncate">
                            {art.artist?.name || "Raajsi Jewels Collection"}
                          </p>
                          <p className="text-[10px] text-ink/40 truncate">{art.medium}</p>
                        </div>
                        {art.display_price && (
                          <div className="text-xs font-serif text-ink shrink-0 pr-2">
                            {formatPrice({
                              price_display: "fixed",
                              price_min: null,
                              price_max: null,
                              display_price: art.display_price,
                            })}
                          </div>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 border-t border-hairline bg-mist/50 flex justify-between items-center text-[10px] text-ink/40 tracking-wider">
          <span>Raajsi Jewels Search</span>
          <Link
            to="/collection"
            onClick={onClose}
            className="hover:text-ink underline transition-colors"
          >
            View full collection →
          </Link>
        </div>
      </div>
    </div>
  );
}
