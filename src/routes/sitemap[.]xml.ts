import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: { path: string; changefreq?: string; priority?: string }[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/collection", changefreq: "daily", priority: "0.9" },
          { path: "/about", changefreq: "monthly", priority: "0.6" },
          { path: "/contact", changefreq: "monthly", priority: "0.6" },
          { path: "/inquire", changefreq: "monthly", priority: "0.5" },
        ];

        try {
          const url = process.env.SUPABASE_URL;
          const key = process.env.SUPABASE_PUBLISHABLE_KEY;
          if (url && key) {
            const sb = createClient(url, key, {
              auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
            });
            const { data: arts } = await sb.from("artworks").select("slug");
            (arts ?? []).forEach((r) =>
              entries.push({ path: `/artworks/${r.slug}`, changefreq: "weekly", priority: "0.7" }),
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
