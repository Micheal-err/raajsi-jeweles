/**
 * SEO helpers for Raajsi Jewels.
 *
 * – canonical()   : returns absolute, www-host, tracking-param-free URL
 * – pageMeta()    : returns a consistent { title, description, og, twitter } head object
 * – JSON-LD generators: organizationSchema, webSiteSchema, localBusinessSchema,
 *   productSchema, breadcrumbSchema, faqSchema, itemListSchema
 *
 * Generates schema.org JSON-LD markup consumed by Google, Bing, and
 * social crawlers for rich-snippet rendering in search results.
 */

// ── Constants ────────────────────────────────────────────────────────
export const SITE_URL = "https://www.raajsijewels.com";
export const SITE_NAME = "Raajsi Jewels";
export const SITE_TAGLINE = "Timeless Luxury, Crafted for You";
export const SITE_LOGO = `${SITE_URL}/logo.png`;
export const SITE_LOCALE = "en_IN";
export const SITE_CURRENCY = "INR";

export const BUSINESS_INFO = {
  name: "Raajsi Jewels",
  legalName: "Raajsi Jewels",
  description:
    "Raajsi Jewels is a Jaipur-based jewellery brand offering 925 Sterling Silver and Handcrafted Jewellery. BIS Hallmark certified, free delivery on all orders, 7 days exchange.",
  url: SITE_URL,
  logo: SITE_LOGO,
  telephone: ["+919829145129", "+917014938562"],
  email: "raajsiforms@gmail.com",
  address: {
    "@type": "PostalAddress" as const,
    addressLocality: "Jaipur",
    addressRegion: "Rajasthan",
    addressCountry: "IN",
    postalCode: "302001",
  },
  geo: {
    "@type": "GeoCoordinates" as const,
    latitude: 26.948089,
    longitude: 75.835916,
  },
  gstin: "08UQDPS5127K1ZY",
  foundingDate: "2009",
  priceRange: "₹₹",
  sameAs: [
    // TODO(human): Confirm the canonical Instagram handle.
    // Footer uses @jewels_raajsi; task spec says https://www.instagram.com/raajsijewels/
    // Using the handle confirmed in the codebase footer until human verifies.
    "https://www.instagram.com/jewels_raajsi",
    "https://www.facebook.com/share/1QEN2B3By5/",
  ],
};

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Returns the canonical absolute URL for a given path.
 * Always uses the www host and strips known tracking parameters.
 */
export function canonical(path: string, searchParams?: URLSearchParams): string {
  const TRACKING_PARAMS = new Set([
    "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
    "ref", "fbclid", "gclid", "gad_source", "msclkid",
  ]);
  let cleanPath = path.startsWith("/") ? path : `/${path}`;

  if (searchParams) {
    const clean = new URLSearchParams();
    searchParams.forEach((value, key) => {
      if (!TRACKING_PARAMS.has(key)) clean.set(key, value);
    });
    const qs = clean.toString();
    if (qs) cleanPath = `${cleanPath}?${qs}`;
  }

  return `${SITE_URL}${cleanPath}`;
}

/** Returns the default OG image URL (brand banner) */
export function defaultOgImage(): string {
  return `${SITE_URL}/og-image.png`;
}

/**
 * Generates a complete, consistent head meta block for a page.
 * Use this instead of hand-writing title/description/og/twitter on every route.
 *
 * @param opts.title        Page title (≤60 chars recommended)
 * @param opts.description  Page description (150-160 chars recommended)
 * @param opts.path         Canonical URL path (e.g. "/collection")
 * @param opts.ogType       OG type — default "website"
 * @param opts.ogImage      OG image URL — defaults to defaultOgImage()
 * @param opts.noIndex      Set to true to add noindex (e.g., 404 pages)
 */
export function pageMeta(opts: {
  title: string;
  description: string;
  path: string;
  ogType?: string;
  ogImage?: string;
  noIndex?: boolean;
}) {
  const url = canonical(opts.path);
  const image = opts.ogImage ?? defaultOgImage();
  const robotsContent = opts.noIndex
    ? "noindex, nofollow"
    : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

  return {
    meta: [
      { title: opts.title },
      { name: "description", content: opts.description },
      { name: "robots", content: robotsContent },
      { property: "og:title", content: opts.title },
      { property: "og:description", content: opts.description },
      { property: "og:type", content: opts.ogType ?? "website" },
      { property: "og:url", content: url },
      { property: "og:image", content: image },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:site_name", content: SITE_NAME },
      { property: "og:locale", content: SITE_LOCALE },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: opts.title },
      { name: "twitter:description", content: opts.description },
      { name: "twitter:image", content: image },
      { name: "twitter:site", content: "@jewels_raajsi" },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}

// ── Schema Generators ────────────────────────────────────────────────

/** Organization schema — global, rendered once in root layout */
export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BUSINESS_INFO.name,
    legalName: BUSINESS_INFO.legalName,
    url: BUSINESS_INFO.url,
    logo: BUSINESS_INFO.logo,
    description: BUSINESS_INFO.description,
    foundingDate: BUSINESS_INFO.foundingDate,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: BUSINESS_INFO.telephone[0],
      contactType: "customer service",
      availableLanguage: ["English", "Hindi"],
      areaServed: "IN",
    },
    address: BUSINESS_INFO.address,
    sameAs: BUSINESS_INFO.sameAs,
  };
}

/** WebSite schema — enables Google sitelinks search box */
export function webSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: BUSINESS_INFO.description,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: SITE_LOGO,
      },
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/collection?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** LocalBusiness schema — for Google Maps and local pack results */
export function localBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "JewelryStore",
    name: BUSINESS_INFO.name,
    image: SITE_LOGO,
    url: BUSINESS_INFO.url,
    telephone: BUSINESS_INFO.telephone[0],
    email: BUSINESS_INFO.email,
    description: BUSINESS_INFO.description,
    address: BUSINESS_INFO.address,
    geo: BUSINESS_INFO.geo,
    priceRange: BUSINESS_INFO.priceRange,
    currenciesAccepted: SITE_CURRENCY,
    paymentAccepted: "Cash, Credit Card, Debit Card, UPI, Net Banking",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "10:00",
        closes: "20:00",
      },
    ],
    sameAs: BUSINESS_INFO.sameAs,
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Raajsi Jewellery Collections",
      itemListElement: [
        {
          "@type": "OfferCatalog",
          name: "Sterling Silver 925",
          url: `${SITE_URL}/collection?category=sterling-silver`,
        },
        {
          "@type": "OfferCatalog",
          name: "Handcrafted Jewels",
          url: `${SITE_URL}/collection?category=handcrafted`,
        },
      ],
    },
  };
}

/** Product schema — for individual product pages with price, availability */
export function productSchema(product: {
  name: string;
  slug: string;
  description: string;
  image: string;
  price: number;
  currency?: string;
  availability?: string;
  sku?: string;
  category?: string;
  material?: string;
  brand?: string;
  images?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images?.length ? product.images : product.image,
    url: `${SITE_URL}/artworks/${product.slug}`,
    sku: product.sku || product.slug,
    brand: {
      "@type": "Brand",
      name: product.brand || SITE_NAME,
    },
    category: product.category || "Jewellery",
    material: product.material,
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/artworks/${product.slug}`,
      priceCurrency: product.currency || SITE_CURRENCY,
      price: product.price,
      availability:
        product.availability === "sold"
          ? "https://schema.org/SoldOut"
          : product.availability === "reserved"
          ? "https://schema.org/LimitedAvailability"
          : "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: SITE_NAME,
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: "0",
          currency: SITE_CURRENCY,
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "IN",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 1,
            maxValue: 3,
            unitCode: "DAY",
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 3,
            maxValue: 7,
            unitCode: "DAY",
          },
        },
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "IN",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 7,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/FreeReturn",
      },
    },
  };
}

/** BreadcrumbList schema — for breadcrumb rich snippets */
export function breadcrumbSchema(
  items: Array<{ name: string; url: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/** FAQPage schema — for FAQ rich snippets in search results */
export function faqSchema(
  faqs: Array<{ question: string; answer: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/** ItemList schema — for collection/category pages showing product lists */
export function itemListSchema(
  products: Array<{ name: string; url: string; image: string; position: number }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: products.map((p) => ({
      "@type": "ListItem",
      position: p.position,
      url: p.url,
      name: p.name,
      image: p.image,
    })),
  };
}

/**
 * Generates a <script type="application/ld+json"> string for embedding
 * in the document head. Safe for SSR and CSR.
 */
export function jsonLdScript(schema: Record<string, unknown>): string {
  return JSON.stringify(schema);
}
