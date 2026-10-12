import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";
import { supabase } from "@/integrations/supabase/client";

import appCss from "../styles.css?url";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { SmoothScroll } from "@/components/SmoothScroll";
import { ScrollProgress } from "@/components/ScrollProgress";

import { CurrencyProvider } from "@/lib/currency";
import { I18nProvider } from "@/lib/i18n";
import { CompareProvider } from "@/lib/compare";
import { CompareBar } from "@/components/CompareBar";
import { LiveChat } from "@/components/LiveChat";
import { CookieConsent } from "@/components/CookieConsent";

import {
  SITE_URL,
  SITE_NAME,
  SITE_LOCALE,
  organizationSchema,
  webSiteSchema,
  defaultOgImage,
} from "@/components/seo-head";

function NotFoundComponent() {
  return (
    <section className="container-editorial py-32 flex items-center justify-center">
      <div className="max-w-xl text-center">
        <div className="eyebrow mb-4">Error 404</div>
        <h1 className="font-serif text-5xl md:text-6xl">This work isn't hanging here.</h1>
        <p className="mt-4 text-muted-foreground">
          The page you were looking for may have moved, or perhaps was never on the wall.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/" className="cta-ghost">
            Return home
          </Link>
          <Link to="/collection" className="cta-red">
            View collection
          </Link>
        </div>
      </div>
    </section>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="eyebrow mb-4">Something went wrong</div>
        <h1 className="font-serif text-3xl">This page didn't load</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Please try again, or head back to the collection.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="cta-ghost"
          >
            Try again
          </button>
          <a href="/" className="cta-red">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    head: () => ({
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        // Default title — overridden by each child route's head()
        {
          title: "925 Silver Jewellery Online, Made in Jaipur | Raajsi Jewels",
        },
        {
          name: "description",
          content:
            "Shop handcrafted 925 sterling silver jewellery from Jaipur. Kundan, Meenakari & more. Free delivery above Rs 999, 7-day exchange.",
        },
        { name: "author", content: SITE_NAME },
        {
          name: "robots",
          content:
            "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
        },
        { property: "og:site_name", content: SITE_NAME },
        { property: "og:locale", content: SITE_LOCALE },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:site", content: "@jewels_raajsi" },
        { name: "theme-color", content: "#fdfaf5" },
        { name: "apple-mobile-web-app-capable", content: "yes" },
        {
          name: "apple-mobile-web-app-status-bar-style",
          content: "default",
        },
        { name: "apple-mobile-web-app-title", content: SITE_NAME },
        // Google Search Console ownership verification
        { name: "google-site-verification", content: "google2313616d507f1207" },
      ],
      links: [
        { rel: "stylesheet", href: appCss },
        { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
        { rel: "apple-touch-icon", href: "/logo.png" },
        // NOTE: canonical is NOT set here — each route sets its own per-page canonical.
        {
          rel: "preconnect",
          href: "https://ldkrcpdsutebayruhrjg.supabase.co",
        },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossOrigin: "anonymous",
        },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;1,9..144,400&family=Inter:wght@300;400;500;600&display=swap",
        },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(organizationSchema()),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify(webSiteSchema()),
        },
      ],
    }),
    component: RootComponent,
    notFoundComponent: NotFoundComponent,
    errorComponent: ErrorComponent,
  },
);

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  const isMuseum = useRouterState({
    select: (state) => state.location.pathname === "/museum",
  });
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => sub.subscription.unsubscribe();
  }, [router, queryClient]);
  return (
    <QueryClientProvider client={queryClient}>
      <HeadContent />
      <I18nProvider>
        <CurrencyProvider>
          <CompareProvider>
            {!isMuseum && <SmoothScroll />}
            {!isMuseum && <ScrollProgress />}

            {isMuseum ? (
              <main className="h-dvh overflow-hidden bg-ink">
                <Outlet />
              </main>
            ) : (
              <div className="min-h-screen flex flex-col bg-paper">
                <SiteHeader />
                <main className="flex-1">
                  <Outlet />
                </main>
                <SiteFooter />
              </div>
            )}
            {!isMuseum && <CompareBar />}
            {!isMuseum && <LiveChat />}
            <CookieConsent />
            <Toaster position="bottom-right" richColors />
          </CompareProvider>
        </CurrencyProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
