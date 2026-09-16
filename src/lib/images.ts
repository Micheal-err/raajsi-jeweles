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
