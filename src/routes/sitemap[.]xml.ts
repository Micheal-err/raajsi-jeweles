import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://www.raajsijewels.com";

// Category pages added in task5
const CATEGORY_SLUGS = [
  "silver-earrings",
  "necklace-sets",
  "bracelets-bangles",
  "anklets",
  "rings",
  "nose-pins",
  "mangalsutra",
  "jaipur-handmade-silver",
  "meenakari",
  "kundan",
];


// Paths that must NEVER appear in the sitemap
const EXCLUDED_PATHS = new Set([
  "/cart",
  "/checkout",
  "/auth",
  "/profile",
  "/orders",
  "/wishlist",
  "/inquire",
  "/museum",
  "/admin",
  "/compare",
  "/book-visit",
  "/commissions",
  "/resources",
  "/services",
  "/press",
  "/visit",
]);

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: {
          path: string;
          changefreq?: string;
          priority?: string;
          lastmod?: string;
        }[] = [
          // Core pages
          { path: "/", changefreq: "daily", priority: "1.0" },
          { path: "/collection", changefreq: "daily", priority: "0.9" },
          { path: "/about", changefreq: "monthly", priority: "0.7" },
          { path: "/contact", changefreq: "monthly", priority: "0.7" },
          { path: "/policies/shipping", changefreq: "monthly", priority: "0.6" },
          { path: "/policies/returns", changefreq: "monthly", priority: "0.6" },
          { path: "/policies/faqs", changefreq: "weekly", priority: "0.6" },
          { path: "/policies/privacy", changefreq: "yearly", priority: "0.4" },
          { path: "/policies/terms", changefreq: "yearly", priority: "0.4" },

          // Category pages (task5)
          ...CATEGORY_SLUGS.map((slug) => ({
            path: `/jewellery/${slug}`,
            changefreq: "weekly",
            priority: "0.85",
          })),

          { path: "/blog", changefreq: "weekly", priority: "0.7" },
        ];

        try {
          const url = process.env.SUPABASE_URL;
          const key = process.env.SUPABASE_PUBLISHABLE_KEY;
          if (url && key) {
            const sb = createClient(url, key, {
              auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
            });
            const { data: arts } = await sb
              .from("artworks")
              .select("slug")
              .order("created_at", { ascending: false });

            (arts ?? []).forEach((r) => {
              const path = `/artworks/${encodeURIComponent(r.slug)}`;
              // Never include excluded paths
              if (EXCLUDED_PATHS.has(path)) return;
              entries.push({
                path,
                changefreq: "weekly",
                priority: "0.8",
              });
            });
          }
        } catch (e) {
          console.error("sitemap dynamic entries failed", e);
        }

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...entries.map((e) =>
            [
              `  <url>`,
              `    <loc>${BASE_URL}${e.path}</loc>`,
              e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
              e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
              e.priority ? `    <priority>${e.priority}</priority>` : null,
              `  </url>`,
            ]
              .filter(Boolean)
              .join("\n"),
          ),
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
