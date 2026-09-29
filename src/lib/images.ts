// Resolve image paths stored in the database (e.g. "/src/assets/hero-artwork.jpg")
// to their bundled URLs. Any path not found returns the original string (falls
// back to public/ URLs).
const modules = import.meta.glob("/src/assets/*.{jpg,jpeg,png,webp,avif}", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

export function resolveImage(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (modules[url]) return modules[url];
  // Try filename-only match
  const name = url.split("/").pop();
  const key = Object.keys(modules).find((k) => k.endsWith("/" + name));
  return key ? modules[key] : url;
}

export function getOptimizedImageUrl(
  url: string | null | undefined,
  width: number = 640,
  quality: number = 75
): string {
  if (!url) return "";
  const resolved = resolveImage(url);
  if (!resolved || !resolved.startsWith("http")) return resolved;

  // Supabase storage image transformation endpoint
  if (resolved.includes("/storage/v1/object/public/")) {
    const transformed = resolved.replace(
      "/storage/v1/object/public/",
      "/storage/v1/render/image/public/"
    );
    const separator = transformed.includes("?") ? "&" : "?";
    return `${transformed}${separator}width=${width}&quality=${quality}&resize=cover`;
  }

  if (resolved.includes("/storage/v1/render/image/public/")) {
    try {
      const u = new URL(resolved);
      u.searchParams.set("width", String(width));
      u.searchParams.set("quality", String(quality));
      u.searchParams.set("resize", "cover");
      return u.toString();
    } catch {
      return resolved;
    }
  }

  return resolved;
}

export function getImageSrcSet(
  url: string | null | undefined,
  widths: number[] = [320, 480, 640, 768],
  quality: number = 75
): string {
  if (!url) return "";
  const resolved = resolveImage(url);
  if (
    !resolved.includes("/storage/v1/object/public/") &&
    !resolved.includes("/storage/v1/render/image/public/")
  ) {
    return "";
  }
  return widths
    .map((w) => `${getOptimizedImageUrl(resolved, w, quality)} ${w}w`)
    .join(", ");
}

