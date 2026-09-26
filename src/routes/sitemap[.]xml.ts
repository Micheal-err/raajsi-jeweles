import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://www.raajsijewels.com";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const now = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

        const entries: { path: string; changefreq?: string; priority?: string; lastmod?: string }[] = [
          { path: "/", changefreq: "daily", priority: "1.0", lastmod: now },
          { path: "/collection", changefreq: "daily", priority: "0.9", lastmod: now },
          { path: "/about", changefreq: "monthly", priority: "0.7", lastmod: "2026-09-26" },
          { path: "/contact", changefreq: "monthly", priority: "0.7", lastmod: "2026-09-26" },
          { path: "/policies/shipping", changefreq: "monthly", priority: "0.6", lastmod: now },
          { path: "/policies/returns", changefreq: "monthly", priority: "0.6", lastmod: "2026-09-26" },
          { path: "/policies/faqs", changefreq: "weekly", priority: "0.6", lastmod: now },
          { path: "/policies/privacy", changefreq: "yearly", priority: "0.4", lastmod: "2026-09-26" },
          { path: "/policies/terms", changefreq: "yearly", priority: "0.4", lastmod: "2026-09-26" },
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
              .select("slug,updated_at")
              .order("updated_at", { ascending: false });
            (arts ?? []).forEach((r) =>
              entries.push({
                path: `/artworks/${r.slug}`,
                changefreq: "weekly",
                priority: "0.8",
                lastmod: r.updated_at ? new Date(r.updated_at).toISOString().split("T")[0] : now,
              }),
            );
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
