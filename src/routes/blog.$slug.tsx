/**
 * /blog/:slug — Individual blog post page.
 *
 * Currently renders the OUTLINE ONLY.
 * TODO(human): Replace outline content with full 600-1000 word articles.
 */
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { BLOG_POSTS } from "./blog.index";
import { Reveal } from "@/components/Reveal";
import {
  canonical,
  SITE_NAME,
  SITE_LOCALE,
  defaultOgImage,
  breadcrumbSchema,
} from "@/components/seo-head";

export const Route = createFileRoute("/blog/$slug")({
  loader: ({ params }) => {
    const post = BLOG_POSTS.find((p) => p.slug === params.slug);
    if (!post) throw notFound();
    return post;
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) return {};
    const url = canonical(`/blog/${params.slug}`);
    return {
      meta: [
        { title: loaderData.seoTitle },
        { name: "description", content: loaderData.seoDesc },
        {
          name: "robots",
          content:
            "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
        },
        { property: "og:title", content: loaderData.seoTitle },
        { property: "og:description", content: loaderData.seoDesc },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { property: "og:image", content: defaultOgImage() },
        { property: "og:site_name", content: SITE_NAME },
        { property: "og:locale", content: SITE_LOCALE },
        { property: "article:published_time", content: loaderData.publishDate },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: loaderData.seoTitle },
        { name: "twitter:description", content: loaderData.seoDesc },
        { name: "twitter:site", content: "@jewels_raajsi" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(
            breadcrumbSchema([
              { name: "Home", url: canonical("/") },
              { name: "Blog", url: canonical("/blog") },
              { name: loaderData.title, url },
            ]),
          ),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: loaderData.title,
            description: loaderData.seoDesc,
            datePublished: loaderData.publishDate,
            publisher: {
              "@type": "Organization",
              name: SITE_NAME,
              url: "https://www.raajsijewels.com",
            },
            url,
          }),
        },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="container-editorial py-24 text-center">
      <h1 className="font-serif text-3xl">Article not found</h1>
      <Link to="/blog" className="cta-gold mt-8 inline-block text-xs px-6 py-2.5">
        Back to Blog
      </Link>
    </div>
  ),
  component: BlogPost,
});

function BlogPost() {
  const post = Route.useLoaderData();

  return (
    <div className="bg-paper text-ink pb-24">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="container-editorial py-4 flex items-center gap-1.5 text-xs text-muted-foreground"
      >
        <Link to="/" className="hover:text-ink transition-colors">
          Home
        </Link>
        <ChevronRight size={12} />
        <Link to="/blog" className="hover:text-ink transition-colors">
          Blog
        </Link>
        <ChevronRight size={12} />
        <span className="text-ink font-medium truncate max-w-[200px]">{post.title}</span>
      </nav>

      {/* Article header */}
      <section className="bg-mist/30 border-b border-hairline py-14 md:py-20">
        <div className="container-editorial max-w-2xl">
          <Reveal>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[10px] uppercase tracking-widest text-[color:var(--gold)] font-medium">
                {post.category}
              </span>
              <span className="text-muted-foreground text-[10px]">·</span>
              <span className="text-[10px] text-muted-foreground">{post.readTime} read</span>
              <span className="text-muted-foreground text-[10px]">·</span>
              <span className="text-[10px] text-muted-foreground">{post.publishDate}</span>
            </div>

            {/* One H1 per page (TASK 4) */}
            <h1 className="font-serif text-3xl md:text-5xl text-ink leading-tight">
              {post.title}
            </h1>
            <p className="mt-4 text-base text-ink/75 leading-relaxed">{post.seoDesc}</p>
          </Reveal>
        </div>
      </section>

      {/* Article body — OUTLINE ONLY */}
      {/* TODO(human): Replace the outline below with a full 600-1000 word article */}
      <section className="container-editorial py-14 max-w-2xl">
        <div className="mb-6 p-4 border border-amber-200 bg-amber-50 text-amber-900 text-sm rounded-xs">
          <strong>Note to editor:</strong> This article is currently showing an outline only.
          Please expand each section into full prose before publishing. Mark as complete by
          removing this notice and the outline formatting.
        </div>

        <div className="prose prose-sm max-w-none whitespace-pre-line text-ink/80 leading-relaxed font-light">
          {post.outline}
        </div>

        <div className="mt-12 pt-8 border-t border-hairline">
          <p className="text-sm text-ink/70 mb-4">
            Explore Raajsi Jewels' handcrafted silver and jewellery collections:
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/collection" className="cta-gold text-xs px-5 py-2.5">
              Shop Collections
            </Link>
            <Link to="/blog" className="cta-outline text-xs px-5 py-2.5">
              More Articles
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
