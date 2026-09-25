import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X, Sparkles, Package, Image as ImageIcon } from "lucide-react";
import { resolveImage } from "@/lib/images";
import { MultiImageUploader } from "@/components/admin/MultiImageUploader";

const CATEGORIES = [
  { value: "silver", label: "925 Silver (Sterling Silver)" },
  { value: "handicraft", label: "Handcrafted Jewels" },
] as const;

const SUBCATEGORIES = [
  { value: "rings", label: "Rings" },
  { value: "necklaces", label: "Necklaces & Chokers" },
  { value: "earrings", label: "Earrings & Jhumkas" },
  { value: "bangles", label: "Bangles & Kadas" },
  { value: "chains", label: "Chains" },
  { value: "bracelets", label: "Bracelets & Cuffs" },
  { value: "pendants", label: "Pendants" },
  { value: "anklets", label: "Anklets (Payal)" },
  { value: "nose-rings", label: "Nose Rings & Pins" },
  { value: "mangalsutra", label: "Mangalsutra & Sets" },
] as const;

const AVAILABILITY = ["available", "reserved", "sold", "not_for_sale"] as const;

export const Route = createFileRoute("/_admin/admin/artworks")({
  head: () => ({
    meta: [{ title: "Manage Jewellery Products — Raajsi Jewels Admin" }],
  }),
  component: ArtworksPage,
});

interface ArtworkRecord {
  id: string;
  slug: string;
  title: string;
  medium: string;
  story: string | null;
  primary_image_url: string;
  gallery_image_urls: string[];
  price: number;
  display_price: number;
  availability: string;
  stock_quantity: number;
  origin_country: string;
  metadata: {
    category?: string;
    subcategory?: string;
    gemstone?: string;
    carat?: string;
    weight?: string;
    [key: string]: unknown;
  } | null;
  featured: boolean;
  created_at: string;
}

function ArtworksPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-artworks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artworks")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ArtworkRecord[];
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("artworks").delete().eq("id", id);
      if (error) {
        console.error("[Admin] Delete failed:", error.code, error.message, error.details);
        throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-artworks"] });
      qc.invalidateQueries({ queryKey: ["artworks"] });
      qc.invalidateQueries({ queryKey: ["collection"] });
      qc.invalidateQueries({ queryKey: ["home-artworks"] });
      toast.success("Jewellery item removed from catalogue");
    },
    onError: (err: any) => {
      const msg = err?.code === "42501"
        ? "Permission denied — your admin RLS policies may not be set up. Run the SQL fix in Supabase."
        : `Failed to delete: ${err?.message || "Unknown error"}`;
      toast.error(msg);
    },
  });

  const rows = data ?? [];
  const filtered =
    filterCategory === "all"
      ? rows
      : rows.filter((r) => {
          const cat = (r.metadata?.category || (r as any).category || "").toLowerCase();
          const medium = (r.medium || "").toLowerCase();
          if (filterCategory === "silver") {
            return cat.includes("silver") || medium.includes("silver");
          }
          return cat.includes("handicraft") || (!cat.includes("silver") && !medium.includes("silver"));
        });

  return (
    <div className="p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-3xl">Jewellery Collection</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {rows.length} fine jewellery pieces in the live catalogue
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border border-hairline px-3 py-2 text-xs bg-paper uppercase tracking-wider"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              setCreating(true);
              setEditing(null);
            }}
            className="inline-flex items-center gap-2 bg-ink text-paper px-4 py-2 text-xs tracking-[0.18em] uppercase hover:bg-ink/90 transition-colors"
          >
            <Plus size={14} /> Add Jewellery
          </button>
        </div>
      </div>

      {creating && (
        <ProductForm
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            qc.invalidateQueries({ queryKey: ["admin-artworks"] });
            qc.invalidateQueries({ queryKey: ["artworks"] });
          }}
        />
      )}

      {isLoading ? (
        <div className="py-20 text-center text-sm text-muted-foreground">Loading collection…</div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground border border-dashed border-hairline p-8">
          No jewellery pieces found for the selected filter.
        </div>
      ) : (
        <div className="border border-hairline bg-paper rounded-sm overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-hairline bg-mist/50">
                  <th className="text-left px-4 py-3 text-[10px] tracking-[0.18em] uppercase text-muted-foreground font-medium">
                    Piece
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] tracking-[0.18em] uppercase text-muted-foreground font-medium">
                    Details
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] tracking-[0.18em] uppercase text-muted-foreground font-medium">
                    Category
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] tracking-[0.18em] uppercase text-muted-foreground font-medium">
                    Metal & Stones
                  </th>
                  <th className="text-right px-4 py-3 text-[10px] tracking-[0.18em] uppercase text-muted-foreground font-medium">
                    Price
                  </th>
                  <th className="text-center px-4 py-3 text-[10px] tracking-[0.18em] uppercase text-muted-foreground font-medium">
                    Stock
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] tracking-[0.18em] uppercase text-muted-foreground font-medium">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-mist/30 transition-colors">
                    <td className="px-4 py-2">
                      <div className="w-12 h-14 bg-mist overflow-hidden rounded-sm border border-hairline relative">
                        {item.primary_image_url ? (
                          <img
                            src={resolveImage(item.primary_image_url)}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <ImageIcon size={16} />
                          </div>
                        )}
                        <div className="absolute bottom-0 inset-x-0 bg-ink/75 text-[8px] tracking-wider uppercase text-paper text-center py-0.5 font-medium">
                          {(item.gallery_image_urls?.length ?? 0) >= 4
                            ? "4 angles"
                            : `${item.gallery_image_urls?.length || 1} angles`}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <div className="font-serif font-medium text-ink truncate">{item.title}</div>
                      <div className="text-[11px] font-mono text-muted-foreground truncate">{item.slug}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 text-[10px] tracking-wider uppercase bg-mist text-ink/80 rounded-sm">
                        {item.metadata?.category === "silver"
                          ? "925 Silver"
                          : item.metadata?.category === "handicraft"
                          ? "Handcrafted"
                          : item.metadata?.category || "Handcrafted"}
                      </span>
                      {item.metadata?.subcategory && (
                        <div className="text-[11px] text-muted-foreground mt-0.5 capitalize">
                          {item.metadata.subcategory}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div className="text-xs text-ink">{item.medium || "—"}</div>
                      {item.metadata?.gemstone && (
                        <div className="text-[11px] text-muted-foreground">
                          {item.metadata.gemstone}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-serif">
                      ₹{new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Number(item.display_price || item.price || 0))}
                    </td>
                    <td className="px-4 py-3 text-center tabular-nums text-xs">
                      <span className={item.stock_quantity <= 3 ? "text-amber-600 font-semibold" : ""}>
                        {item.stock_quantity ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] tracking-[0.16em] uppercase px-2 py-0.5 rounded-sm font-medium ${
                          item.availability === "available"
                            ? "bg-emerald-100 text-emerald-800"
                            : item.availability === "sold"
                              ? "bg-red-100 text-red-800"
                              : item.availability === "reserved"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {item.availability?.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(editing === item.id ? null : item.id);
                            setCreating(false);
                          }}
                          className="p-1.5 hover:bg-mist rounded-sm text-ink transition-colors"
                          aria-label="Edit"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Remove "${item.title}" from catalogue?`)) {
                              deleteMut.mutate(item.id);
                            }
                          }}
                          className="p-1.5 hover:bg-red-50 text-red-600 rounded-sm transition-colors"
                          aria-label="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editing && (
        <EditModal
          artwork={rows.find((r) => r.id === editing) ?? null}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            qc.invalidateQueries({ queryKey: ["admin-artworks"] });
            qc.invalidateQueries({ queryKey: ["artworks"] });
          }}
        />
      )}
    </div>
  );
}

function ProductForm({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState<string[]>([
    "/jewellery/jewellery-necklace.jpg",
    "/jewellery/jewellery-hero.png",
    "/jewellery/jewellery-bangles.jpg",
    "/jewellery/jewellery-rings.png",
  ]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);

    const validImages = images.filter((img) => Boolean(img && img.trim()));
    if (validImages.length < 4) {
      toast.error("Please configure at least 4 photos (Front, Side Profile, On-Body, and Detail).");
      setSaving(false);
      return;
    }

    const fd = new FormData(e.currentTarget);
    const title = String(fd.get("title") ?? "").trim();
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const price = Number(fd.get("price") || 0);
    const stock = Number(fd.get("stock_quantity") || 10);
    const category = String(fd.get("category") || "silver");
    const subcategory = String(fd.get("subcategory") || "necklaces");
    const gemstone = String(fd.get("gemstone") || "").trim();
    const carat = String(fd.get("carat") || "").trim();
    const weight = String(fd.get("weight") || "").trim();

    const payload = {
      slug,
      title,
      medium: String(fd.get("medium") ?? "925 Sterling Silver"),
      price,
      display_price: price,
      price_display: "fixed" as const,
      availability: String(fd.get("availability") ?? "available") as
        | "available"
        | "reserved"
        | "sold"
        | "not_for_sale",
      stock_quantity: stock,
      story: String(fd.get("story") ?? "") || null,
      primary_image_url: validImages[0],
      gallery_image_urls: validImages,
      origin_country: "Jaipur, India",
      category,
      metadata: {
        category,
        subcategory,
        gemstone: gemstone || undefined,
        carat: carat || undefined,
        weight: weight || undefined,
        gallery_images: validImages,
        images: validImages,
      },
    };

    const { error } = await supabase.from("artworks").insert(payload);

    setSaving(false);
    if (error) {
      console.error("[Admin] Insert failed:", error.code, error.message, error.details, error.hint);
      const msg = error.code === "42501"
        ? "Permission denied — please run the RLS fix SQL in your Supabase SQL Editor."
        : "Failed to add piece: " + error.message;
      toast.error(msg);
      return;
    }
    toast.success("New jewellery piece added to catalogue");
    onSaved();
  }

  return (
    <div className="border border-hairline bg-paper p-6 mb-8 rounded-sm shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-xl">Add New Fine Jewellery Piece</h2>
        <button type="button" onClick={onClose} className="p-1 hover:bg-mist rounded-sm">
          <X size={16} />
        </button>
      </div>
      <form onSubmit={submit} className="grid md:grid-cols-2 gap-4">
        <Field label="Piece Title" name="title" placeholder="e.g. Royal Kundan Jadau Choker" required />
        <Field label="Metal & Finishing (Medium)" name="medium" placeholder="e.g. 22K Yellow Gold" required />

        <label className="grid gap-1">
          <span className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground font-medium">
            Category
          </span>
          <select
            name="category"
            required
            className="border border-hairline px-3 py-2 text-sm bg-transparent"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1">
          <span className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground font-medium">
            Subcategory
          </span>
          <select
            name="subcategory"
            required
            className="border border-hairline px-3 py-2 text-sm bg-transparent"
          >
            {SUBCATEGORIES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <Field label="Price in ₹ (INR)" name="price" type="number" placeholder="e.g. 185000" required />
        <Field label="Stock Quantity" name="stock_quantity" type="number" defaultValue="10" required />

        <Field label="Gemstones / Diamonds" name="gemstone" placeholder="e.g. Natural Basra Pearls, Uncut Polki Diamonds" />
        <Field label="Purity / Weight Details" name="weight" placeholder="e.g. 48.5 grams · 22K Hallmarked" />

        <label className="grid gap-1">
          <span className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground font-medium">
            Availability Status
          </span>
          <select
            name="availability"
            className="border border-hairline px-3 py-2 text-sm bg-transparent"
          >
            {AVAILABILITY.map((a) => (
              <option key={a} value={a}>
                {a.replace("_", " ")}
              </option>
            ))}
          </select>
        </label>

        <MultiImageUploader
          images={images}
          onChange={setImages}
          requiredCount={4}
        />

        <label className="grid gap-1 md:col-span-2">
          <span className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground font-medium">
            Product Story & Craftsmanship Description
          </span>
          <textarea
            name="story"
            rows={3}
            placeholder="Handcrafted in Jaipur with meticulous Jadau and Meenakari craftsmanship..."
            className="border border-hairline px-3 py-2 text-sm bg-transparent resize-y"
          />
        </label>

        <div className="md:col-span-2 flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-ink text-paper px-6 py-2.5 text-xs tracking-[0.18em] uppercase hover:bg-ink/90 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save to Catalogue"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="border border-hairline px-6 py-2.5 text-xs tracking-[0.18em] uppercase hover:bg-mist"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function EditModal({
  artwork,
  onClose,
  onSaved,
}: {
  artwork: ArtworkRecord | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const initialImages = (() => {
    if (!artwork) return ["", "", "", ""];
    const meta = artwork.metadata as any;
    const list = artwork.gallery_image_urls && artwork.gallery_image_urls.length > 0
      ? [...artwork.gallery_image_urls]
      : (meta?.gallery_images?.length
        ? [...meta.gallery_images]
        : [artwork.primary_image_url || ""]);
    while (list.length < 4) list.push("");
    return list;
  })();

  const [images, setImages] = useState<string[]>(initialImages);
  if (!artwork) return null;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);

    const validImages = images.filter((img) => Boolean(img && img.trim()));
    if (validImages.length < 4) {
      toast.error("Please configure at least 4 photos (Front, Side Profile, On-Body, and Detail).");
      setSaving(false);
      return;
    }

    const fd = new FormData(e.currentTarget);

    const price = Number(fd.get("price") || 0);
    const stock = Number(fd.get("stock_quantity") || 0);
    const category = String(fd.get("category") || "silver");
    const subcategory = String(fd.get("subcategory") || "necklaces");
    const gemstone = String(fd.get("gemstone") || "").trim();
    const weight = String(fd.get("weight") || "").trim();

    const updatePayload = {
      title: String(fd.get("title") ?? ""),
      medium: String(fd.get("medium") ?? ""),
      price,
      display_price: price,
      availability: String(fd.get("availability") ?? "available") as
        | "available"
        | "reserved"
        | "sold"
        | "not_for_sale",
      stock_quantity: stock,
      story: String(fd.get("story") ?? "") || null,
      primary_image_url: validImages[0] || artwork!.primary_image_url,
      gallery_image_urls: validImages,
      category,
      metadata: {
        ...(artwork!.metadata ?? {}),
        category,
        subcategory,
        gemstone: gemstone || undefined,
        weight: weight || undefined,
        gallery_images: validImages,
        images: validImages,
      },
    };

    const { error } = await supabase
      .from("artworks")
      .update(updatePayload as any)
      .eq("id", artwork!.id);

    setSaving(false);
    if (error) {
      console.error("[Admin] Update failed:", error.code, error.message, error.details, error.hint);
      const msg = error.code === "42501"
        ? "Permission denied — please run the RLS fix SQL in your Supabase SQL Editor."
        : "Failed to update: " + error.message;
      toast.error(msg);
      return;
    }
    toast.success("Jewellery details updated");
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4">
      <div className="bg-paper border border-hairline rounded-sm max-w-2xl w-full max-h-[90vh] overflow-auto p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4 border-b border-hairline pb-3">
          <h2 className="font-serif text-xl">Edit Jewellery Piece</h2>
          <button type="button" onClick={onClose} className="p-1 hover:bg-mist rounded-sm">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={submit} className="grid md:grid-cols-2 gap-4">
          <Field label="Piece Title" name="title" defaultValue={artwork.title} required />
          <Field label="Metal & Finishing (Medium)" name="medium" defaultValue={artwork.medium} required />

          <label className="grid gap-1">
            <span className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground font-medium">
              Category
            </span>
            <select
              name="category"
              defaultValue={artwork.metadata?.category || "silver"}
              className="border border-hairline px-3 py-2 text-sm bg-transparent"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1">
            <span className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground font-medium">
              Subcategory
            </span>
            <select
              name="subcategory"
              defaultValue={artwork.metadata?.subcategory || "necklaces"}
              className="border border-hairline px-3 py-2 text-sm bg-transparent"
            >
              {SUBCATEGORIES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          <Field
            label="Price in ₹ (INR)"
            name="price"
            type="number"
            defaultValue={artwork.display_price || artwork.price}
            required
          />
          <Field
            label="Stock Quantity"
            name="stock_quantity"
            type="number"
            defaultValue={artwork.stock_quantity ?? 10}
            required
          />

          <Field
            label="Gemstones / Pearls"
            name="gemstone"
            defaultValue={artwork.metadata?.gemstone || ""}
          />
          <Field
            label="Weight / Karat Details"
            name="weight"
            defaultValue={artwork.metadata?.weight || ""}
          />

          <label className="grid gap-1">
            <span className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground font-medium">
              Availability
            </span>
            <select
              name="availability"
              defaultValue={artwork.availability}
              className="border border-hairline px-3 py-2 text-sm bg-transparent"
            >
              {AVAILABILITY.map((av) => (
                <option key={av} value={av}>
                  {av.replace("_", " ")}
                </option>
              ))}
            </select>
          </label>

          <MultiImageUploader
            images={images}
            onChange={setImages}
            requiredCount={4}
          />

          <label className="grid gap-1 md:col-span-2">
            <span className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground font-medium">
              Product Story & Heritage Details
            </span>
            <textarea
              name="story"
              rows={3}
              defaultValue={artwork.story ?? ""}
              className="border border-hairline px-3 py-2 text-sm bg-transparent resize-y"
            />
          </label>

          <div className="md:col-span-2 flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-ink text-paper px-6 py-2.5 text-xs tracking-[0.18em] uppercase hover:bg-ink/90 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="border border-hairline px-6 py-2.5 text-xs tracking-[0.18em] uppercase hover:bg-mist"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  className,
  ...rest
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`grid gap-1 ${className ?? ""}`}>
      <span className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground font-medium">
        {label}
      </span>
      <input {...rest} className="border border-hairline px-3 py-2 text-sm bg-transparent rounded-none" />
    </label>
  );
}
