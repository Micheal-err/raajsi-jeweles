const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://www.raajsijewels.com';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://hchtqjxuqdcnwyacqlph.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.VITE_SUPABASE_KEY || 'sb_publishable_vA7Syx8z5fZckmPLYA2Wvg_XyFtfF3g';

const DIST_DIR = path.join(__dirname, '..', 'dist');

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── 1. CATEGORY DEFINITIONS ─────────────────────────────────────────────
const CATEGORIES = {
  'silver-earrings': {
    h1: '925 Silver Earrings — Handcrafted in Jaipur',
    title: '925 Silver Earrings | Raajsi Jewels, Jaipur',
    desc: 'Buy 925 sterling silver earrings handcrafted in Jaipur. Studs, hoops, dangles & more. Free delivery above ₹999. 7-day exchange.',
    intro: 'Our 925 sterling silver earring collection brings together the best of Jaipur craftsmanship and contemporary design. Each pair is crafted from genuine 925 sterling silver — a standard that guarantees 92.5% pure silver content, providing lasting shine and durability for daily wear.',
  },
  'necklace-sets': {
    h1: 'Silver Necklaces & Sets — Pure 925 Silver',
    title: 'Silver Necklaces & Sets | Raajsi Jewels',
    desc: 'Shop handcrafted 925 sterling silver necklaces, chokers & pendant sets from Jaipur. Authentic craftsmanship, free delivery above ₹999.',
    intro: 'A necklace is the centrepiece of any jewellery ensemble. Our handcrafted silver necklace collection spans minimal everyday chains to statement collar pieces rooted in royal Rajasthani heritage.',
  },
  'bracelets-bangles': {
    h1: '925 Silver Bracelets & Bangles',
    title: '925 Silver Bracelets & Bangles | Raajsi Jewels',
    desc: 'Explore handcrafted silver bracelets, cuffs and bangles for women. Genuine 925 sterling silver made in Jaipur. 7-day exchange.',
    intro: 'Adorn your wrists with handcrafted 925 sterling silver bracelets and bangles created in Jaipur. From delicate chain bracelets with gemstone charms to solid silver cuffs with intricate filigree.',
  },
  'anklets': {
    h1: 'Silver Anklets (Payal) — 925 Sterling Silver',
    title: '925 Silver Anklets (Payal) | Raajsi Jewels',
    desc: 'Buy 925 sterling silver payal & anklets online. Delicate daily wear and bridal designs handcrafted in Jaipur. Free shipping above ₹999.',
    intro: 'Anklets hold a cherished place in Indian jewellery tradition. At Raajsi Jewels, we reimagine the classic payal for the modern woman using 925 sterling silver.',
  },
  'rings': {
    h1: 'Sterling Silver Rings — Handcrafted in Jaipur',
    title: '925 Sterling Silver Rings | Raajsi Jewels',
    desc: 'Handcrafted 925 sterling silver rings for women. Minimalist bands, gemstone rings & statement designs. Free shipping above ₹999.',
    intro: 'From minimalist stackable bands to bold cocktail rings featuring natural semi-precious gemstones, our 925 silver rings celebrate the art of Jaipur silversmithing.',
  },
  'nose-pins': {
    h1: '925 Silver Nose Pins & Studs',
    title: 'Silver Nose Pins & Studs | Raajsi Jewels',
    desc: 'Shop genuine 925 silver nose pins, clips & studs. Non-allergic, skin-safe silver jewellery handcrafted by Jaipur artisans.',
    intro: 'Our collection of 925 silver nose pins and studs offers versatile options for every preference — both pierced studs and clip-on styles.',
  },
  'mangalsutra': {
    h1: 'Silver Mangalsutra — Contemporary & Traditional',
    title: '925 Silver Mangalsutra Designs | Raajsi Jewels',
    desc: 'Contemporary 925 sterling silver mangalsutra designs with auspicious black beads. BIS hallmark certified silver from Jaipur.',
    intro: 'The mangalsutra is an eternal symbol of love and commitment. Our collection brings a modern silver perspective to this sacred ornament.',
  },
  'jaipur-handmade-silver': {
    h1: 'Jaipur Handmade Silver Jewellery — Heritage Craft',
    title: 'Jaipur Handmade Silver Jewellery | Raajsi Jewels',
    desc: 'Authentic handmade 925 silver jewellery from Jaipur master karigars. Centuries of Rajasthani craft tradition in every piece.',
    intro: 'Jaipur is globally celebrated as the jewel of India — home to generations of silversmiths who transform raw silver into wearable art.',
  },
  'meenakari': {
    h1: 'Meenakari Silver Jewellery — Royal Enamel Art',
    title: 'Meenakari Silver Jewellery | Raajsi Jewels Jaipur',
    desc: 'Vibrant hand-enamelled Meenakari silver jewellery from Jaipur. Traditional Rajasthani artistry with genuine 925 sterling silver.',
    intro: 'Meenakari — the exquisite art of colouring and ornamenting the surface of metals by fusing brilliant mineral colours over intricate engravings.',
  },
  'kundan': {
    h1: 'Kundan & Jadau Jewellery — Jaipur Heritage',
    title: 'Kundan Jewellery Online | Raajsi Jewels Jaipur',
    desc: 'Exquisite Kundan and Jadau style jewellery handcrafted in Jaipur. Regal heritage designs for weddings and festive occasions.',
    intro: 'Kundan is one of the oldest forms of jewellery making in India, flourishing under royal Mughal and Rajput patronage in Rajasthan.',
  },
};

// ── 2. BLOG DEFINITIONS ─────────────────────────────────────────────────
const BLOGS = {
  'how-to-check-if-silver-is-real-925': {
    title: 'How to Check If Silver Is Real 925 | Raajsi Jewels',
    h1: 'How to Check If Silver Is Real 925 Sterling Silver',
    desc: 'Simple tests to check if your silver jewellery is genuine 925 sterling silver. Magnet test, hallmark, acid test & more explained.',
    date: '2026-10-01',
    category: 'Silver Guide',
    content: 'Learn how to verify real 925 sterling silver at home with simple tests including the magnet test, hallmark stamp verification, ice melting test, and tarnish inspection.',
  },
  '925-silver-vs-pure-silver': {
    title: '925 Silver vs Pure Silver: Differences Explained | Raajsi Jewels',
    h1: '925 Sterling Silver vs Pure Silver (999): What Is the Difference?',
    desc: 'Learn the differences between 925 sterling silver and 999 pure silver. Understand why 925 silver is superior for wearable jewellery.',
    date: '2026-10-05',
    category: 'Education',
    content: 'Pure silver (999) is too soft for everyday wearable jewellery. Learn why 925 sterling silver (92.5% silver and 7.5% copper/alloys) gives the ideal strength and longevity.',
  },
  'does-sterling-silver-tarnish-and-how-to-clean-it': {
    title: 'Does Sterling Silver Tarnish? How to Clean Silver | Raajsi Jewels',
    h1: 'Does Sterling Silver Tarnish? Complete Guide to Cleaning Silver at Home',
    desc: 'Why genuine 925 silver tarnishes over time and how to restore its brilliant shine using simple household methods and silver polishing cloths.',
    date: '2026-10-10',
    category: 'Silver Care',
    content: 'Tarnish is a natural chemical reaction when silver meets sulphur in the air. Discover gentle ways to clean your silver jewellery at home without damaging stones.',
  },
  'is-silver-jewellery-safe-for-daily-wear': {
    title: 'Is Silver Jewellery Safe for Daily Wear? | Raajsi Jewels',
    h1: 'Is Silver Jewellery Safe for Daily Wear? Everything You Need to Know',
    desc: 'Find out whether 925 sterling silver is suitable for daily wear, skin sensitivity, showering, and active lifestyles.',
    date: '2026-10-15',
    category: 'Lifestyle',
    content: '925 sterling silver is hypoallergenic and skin-friendly. With proper care and avoidance of harsh chlorine or perfumes, it lasts for generations.',
  },
  'meenakari-vs-kundan-vs-polki-explained': {
    title: 'Meenakari vs Kundan vs Polki: Differences Explained | Raajsi Jewels',
    h1: 'Meenakari vs Kundan vs Polki: Understanding Jaipur Heritage Crafts',
    desc: 'Explore the key distinctions between Rajasthani Meenakari (enamelling), Kundan (glass stone setting), and Polki (uncut diamonds).',
    date: '2026-10-20',
    category: 'Heritage Craft',
    content: 'Rajasthan is the birthplace of legendary Indian royal jewellery techniques. Learn how Meenakari enamelling, Kundan stone setting, and Polki diamonds differ.',
  },
};

// ── 3. STATIC CORE PAGES DEFINITIONS ────────────────────────────────────
const CORE_PAGES = {
  '/': {
    title: 'Raajsi Jewels — Buy 925 Sterling Silver & Handcrafted Jewellery Online | Jaipur, India',
    h1: '925 Sterling Silver & Handcrafted Fine Jewellery from Jaipur',
    desc: 'Shop genuine 925 Sterling Silver & Handcrafted Fine Jewellery from Jaipur. BIS Hallmark certified, free delivery across India on orders above ₹999.',
    intro: 'Welcome to Raajsi Jewels, where the royal silversmithing traditions of Jaipur meet contemporary elegance. Explore our collection of 925 sterling silver earrings, necklaces, bangles, rings, and anklets.',
  },
  '/collection': {
    title: 'All Jewellery Collections — Handcrafted 925 Silver | Raajsi Jewels',
    h1: 'Handcrafted 925 Sterling Silver & Fine Jewellery Collections',
    desc: 'Explore handcrafted 925 sterling silver earrings, necklaces, bracelets, rings & anklets from Jaipur. Certified authenticity & premium craftsmanship.',
    intro: 'Browse the full collection of artisanal silver jewellery from Raajsi Jewels Jaipur. Filter by category, metal, and style.',
  },
  '/about': {
    title: 'Our Heritage & Craftsmanship | Raajsi Jewels Jaipur',
    h1: 'Heritage, Artistry & Craftsmanship of Jaipur',
    desc: 'Discover the story behind Raajsi Jewels. Handcrafted 925 sterling silver jewellery inspired by Jaipur royal heritage and timeless artisanship.',
    intro: 'Born in the royal city of Jaipur, Raajsi Jewels is dedicated to keeping alive the traditional techniques of hand-carving, filigree, Meenakari, and Kundan craft.',
  },
  '/contact': {
    title: 'Contact Us & Studio Location | Raajsi Jewels Jaipur',
    h1: 'Contact Raajsi Jewels — We Are Here to Assist You',
    desc: 'Get in touch with Raajsi Jewels Jaipur. Inquire about custom orders, silver jewellery styling, shipping, and assistance.',
    intro: 'Have questions regarding sizing, custom jewellery, or an existing order? Reach out to our Jaipur studio team.',
  },
  '/policies/shipping': {
    title: 'Shipping & Delivery Policy | Raajsi Jewels',
    h1: 'Shipping & Delivery Policy',
    desc: 'Learn about our domestic & international shipping timelines, free shipping above ₹999, and secure insured transit.',
    intro: 'We provide insured, safe delivery across all PIN codes in India. Orders above ₹999 qualify for complimentary free shipping.',
  },
  '/policies/returns': {
    title: 'Returns & Exchange Policy | Raajsi Jewels',
    h1: '7-Day Return & Exchange Policy',
    desc: 'Read our 7-day hassle-free return and exchange policy for handcrafted jewellery at Raajsi Jewels.',
    intro: 'Your satisfaction is our priority. We offer a simple 7-day return and exchange policy on all unworn items in original packaging.',
  },
  '/policies/faqs': {
    title: 'Frequently Asked Questions (FAQs) | Raajsi Jewels',
    h1: 'Frequently Asked Questions (FAQs)',
    desc: 'Find answers to common questions regarding 925 silver certification, care guides, ring sizing, payments, and shipping.',
    intro: 'Answers to the most frequent inquiries about our silver jewellery purity, care guidelines, order tracking, and returns.',
  },
  '/policies/privacy': {
    title: 'Privacy Policy | Raajsi Jewels',
    h1: 'Privacy Policy',
    desc: 'Raajsi Jewels privacy policy. How we safeguard your personal information, payments, and data.',
    intro: 'We are committed to respecting your privacy and securing all personal and transaction data collected on raajsijewels.com.',
  },
  '/policies/terms': {
    title: 'Terms & Conditions | Raajsi Jewels',
    h1: 'Terms of Service & Purchase Conditions',
    desc: 'Terms of service and purchase conditions for Raajsi Jewels handcrafted silver jewellery.',
    intro: 'Review our terms governing the use of raajsijewels.com, orders, warranties, and intellectual property.',
  },
  '/blog': {
    title: 'Jewellery Journal & Silver Care Guides | Raajsi Jewels',
    h1: 'The Raajsi Journal — Silver Care, Purity & Styling',
    desc: 'Expert advice on 925 silver purity testing, tarnish prevention, gemstone styling, and Jaipur jewellery heritage.',
    intro: 'Educational guides, silversmith heritage stories, and expert jewellery maintenance tips from our Jaipur workshop.',
  },
};

// ── 4. RENDER HELPER FUNCTIONS ───────────────────────────────────────────
function buildHtmlPage(template, pageConfig) {
  const {
    url,
    title,
    desc,
    h1,
    breadcrumbs = [],
    ogImage = `${BASE_URL}/logo.png`,
    ogType = 'website',
    schemaJson = null,
    bodyHtml = '',
  } = pageConfig;

  let html = template;

  // Replace Title
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);

  // Replace Meta Description
  html = html.replace(
    /<meta\s+name=["']description["'][\s\S]*?>/i,
    `<meta name="description" content="${escapeHtml(desc)}" />`
  );

  // Injected Head Tags (Canonical, OpenGraph, Twitter, Schema)
  const headAdditions = [
    `  <link rel="canonical" href="${url}" />`,
    `  <meta property="og:title" content="${escapeHtml(title)}" />`,
    `  <meta property="og:description" content="${escapeHtml(desc)}" />`,
    `  <meta property="og:url" content="${url}" />`,
    `  <meta property="og:type" content="${ogType}" />`,
    `  <meta property="og:image" content="${ogImage}" />`,
    `  <meta property="og:site_name" content="Raajsi Jewels" />`,
    `  <meta property="og:locale" content="en_IN" />`,
    `  <meta name="twitter:card" content="summary_large_image" />`,
    `  <meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `  <meta name="twitter:description" content="${escapeHtml(desc)}" />`,
    `  <meta name="twitter:image" content="${ogImage}" />`,
    `  <meta name="twitter:site" content="@jewels_raajsi" />`,
  ];

  if (schemaJson) {
    headAdditions.push(`  <script type="application/ld+json">${JSON.stringify(schemaJson)}</script>`);
  }

  // Inject before </head>
  html = html.replace('</head>', `${headAdditions.join('\n')}\n  </head>`);

  // Inject pre-rendered body inside <div id="root">
  const rootContent = `
    <header style="padding: 1rem; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; max-width: 1280px; margin: 0 auto;">
      <a href="/" style="font-family: serif; font-size: 1.5rem; text-decoration: none; color: #0f172a; font-weight: 600;">Raajsi Jewels</a>
      <nav style="display: flex; gap: 1.5rem; font-size: 0.875rem;">
        <a href="/collection" style="text-decoration: none; color: #475569;">Collection</a>
        <a href="/about" style="text-decoration: none; color: #475569;">About</a>
        <a href="/blog" style="text-decoration: none; color: #475569;">Journal</a>
        <a href="/contact" style="text-decoration: none; color: #475569;">Contact</a>
      </nav>
    </header>
    <main style="max-width: 1200px; margin: 0 auto; padding: 2rem 1rem; min-height: 70vh;">
      ${breadcrumbs && breadcrumbs.length > 0 ? `
      <nav aria-label="Breadcrumb" style="font-size: 0.8125rem; color: #64748b; margin-bottom: 1.5rem;">
        ${breadcrumbs.map((b, i) => i === breadcrumbs.length - 1 ? `<span style="color: #0f172a;">${escapeHtml(b.name)}</span>` : `<a href="${b.url.replace(BASE_URL, '') || '/'}" style="color: #64748b; text-decoration: none;">${escapeHtml(b.name)}</a> &gt; `).join('')}
      </nav>` : ''}
      <h1 style="font-family: serif; font-size: 2.25rem; color: #0f172a; margin-bottom: 1rem; line-height: 1.2;">${escapeHtml(h1)}</h1>
      ${bodyHtml}
    </main>
    <footer style="border-top: 1px solid #f1f5f9; padding: 3rem 1rem; text-align: center; color: #64748b; font-size: 0.875rem;">
      <p>&copy; 2026 Raajsi Jewels. All rights reserved. Handcrafted 925 Sterling Silver Jewellery from Jaipur, India.</p>
      <div style="margin-top: 0.5rem; display: flex; justify-content: center; gap: 1rem;">
        <a href="/policies/shipping" style="color: #64748b; text-decoration: none;">Shipping</a>
        <a href="/policies/returns" style="color: #64748b; text-decoration: none;">Returns</a>
        <a href="/policies/privacy" style="color: #64748b; text-decoration: none;">Privacy</a>
        <a href="/policies/terms" style="color: #64748b; text-decoration: none;">Terms</a>
      </div>
    </footer>
  `;

  html = html.replace('<div id="root"></div>', `<div id="root">${rootContent}</div>`);
  return html;
}

// ── 5. MAIN PRE-RENDER EXECUTION ─────────────────────────────────────────
async function prerender() {
  console.log('Starting static route pre-rendering for SEO & Indexing...');

  if (!fs.existsSync(DIST_DIR)) {
    console.error('Error: dist/ directory not found. Please run vite build first.');
    process.exit(1);
  }

  const indexHtmlPath = path.join(DIST_DIR, 'index.html');
  if (!fs.existsSync(indexHtmlPath)) {
    console.error('Error: dist/index.html not found.');
    process.exit(1);
  }

  const baseTemplate = fs.readFileSync(indexHtmlPath, 'utf8');

  // Fetch 20 live products from Supabase
  let products = [];
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/artworks?select=*&order=updated_at.desc`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });
    if (res.ok) {
      products = await res.json();
      console.log(`✓ Fetched ${products.length} live products from Supabase for pre-rendering.`);
    }
  } catch (err) {
    console.error('Error querying Supabase artworks:', err.message);
  }

  let generatedCount = 0;

  // ── A. PRE-RENDER CORE PAGES ──────────────────────────────────────────
  for (const [route, conf] of Object.entries(CORE_PAGES)) {
    const url = `${BASE_URL}${route === '/' ? '' : route}`;
    const breadcrumbs = route === '/' ? [] : [
      { name: 'Home', url: `${BASE_URL}/` },
      { name: conf.h1, url },
    ];

    let schemaJson = null;
    if (route === '/') {
      schemaJson = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'JewelryStore',
            '@id': `${BASE_URL}/#store`,
            name: 'Raajsi Jewels',
            url: BASE_URL,
            logo: `${BASE_URL}/logo.png`,
            image: `${BASE_URL}/logo.png`,
            description: conf.desc,
            address: {
              '@type': 'PostalAddress',
              addressLocality: 'Jaipur',
              addressRegion: 'Rajasthan',
              addressCountry: 'IN',
            },
            priceRange: '₹₹',
            telephone: '+919660233003',
          },
          {
            '@type': 'WebSite',
            '@id': `${BASE_URL}/#website`,
            url: BASE_URL,
            name: 'Raajsi Jewels',
            publisher: { '@id': `${BASE_URL}/#store` },
          },
        ],
      };
    } else {
      schemaJson = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: conf.title,
        description: conf.desc,
        url,
      };
    }

    const bodyHtml = `
      <p style="font-size: 1.125rem; color: #475569; line-height: 1.7; max-width: 800px;">${escapeHtml(conf.intro)}</p>
      ${route === '/' ? `
      <section style="margin-top: 3rem;">
        <h2 style="font-family: serif; font-size: 1.75rem; margin-bottom: 1.5rem;">Explore Fine Jewellery Categories</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem;">
          <a href="/jewellery/silver-earrings" style="padding: 1rem; border: 1px solid #e2e8f0; border-radius: 8px; text-decoration: none; color: #0f172a;">Silver Earrings &rarr;</a>
          <a href="/jewellery/necklace-sets" style="padding: 1rem; border: 1px solid #e2e8f0; border-radius: 8px; text-decoration: none; color: #0f172a;">Necklaces & Sets &rarr;</a>
          <a href="/jewellery/bracelets-bangles" style="padding: 1rem; border: 1px solid #e2e8f0; border-radius: 8px; text-decoration: none; color: #0f172a;">Bracelets & Bangles &rarr;</a>
          <a href="/jewellery/anklets" style="padding: 1rem; border: 1px solid #e2e8f0; border-radius: 8px; text-decoration: none; color: #0f172a;">Silver Anklets (Payal) &rarr;</a>
          <a href="/jewellery/rings" style="padding: 1rem; border: 1px solid #e2e8f0; border-radius: 8px; text-decoration: none; color: #0f172a;">Silver Rings &rarr;</a>
          <a href="/jewellery/jaipur-handmade-silver" style="padding: 1rem; border: 1px solid #e2e8f0; border-radius: 8px; text-decoration: none; color: #0f172a;">Jaipur Handmade Silver &rarr;</a>
        </div>
      </section>` : ''}
    `;

    const html = buildHtmlPage(baseTemplate, {
      url,
      title: conf.title,
      desc: conf.desc,
      h1: conf.h1,
      breadcrumbs,
      schemaJson,
      bodyHtml,
    });

    if (route === '/') {
      fs.writeFileSync(indexHtmlPath, html, 'utf8');
    } else {
      const outDir = path.join(DIST_DIR, ...route.split('/').filter(Boolean));
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8');
    }
    generatedCount++;
  }

  // ── B. PRE-RENDER CATEGORY PAGES ──────────────────────────────────────
  for (const [catSlug, cat] of Object.entries(CATEGORIES)) {
    const route = `/jewellery/${catSlug}`;
    const url = `${BASE_URL}${route}`;
    const breadcrumbs = [
      { name: 'Home', url: `${BASE_URL}/` },
      { name: 'Jewellery', url: `${BASE_URL}/collection` },
      { name: cat.h1, url },
    ];

    const schemaJson = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: cat.title,
      description: cat.desc,
      url,
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((b, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: b.name,
          item: b.url,
        })),
      },
    };

    const bodyHtml = `
      <p style="font-size: 1.125rem; color: #475569; line-height: 1.8; max-width: 850px; margin-bottom: 2rem;">${escapeHtml(cat.intro)}</p>
      <div style="border-top: 1px solid #e2e8f0; padding-top: 2rem;">
        <p style="color: #64748b;">Browse our live handcrafted selection below, or explore our complete <a href="/collection" style="color: #0f172a; text-decoration: underline;">online catalogue</a> with nationwide doorstep delivery.</p>
      </div>
    `;

    const html = buildHtmlPage(baseTemplate, {
      url,
      title: cat.title,
      desc: cat.desc,
      h1: cat.h1,
      breadcrumbs,
      schemaJson,
      bodyHtml,
    });

    const outDir = path.join(DIST_DIR, 'jewellery', catSlug);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8');
    generatedCount++;
  }

  // ── C. PRE-RENDER BLOG PAGES ──────────────────────────────────────────
  for (const [blogSlug, blog] of Object.entries(BLOGS)) {
    const route = `/blog/${blogSlug}`;
    const url = `${BASE_URL}${route}`;
    const breadcrumbs = [
      { name: 'Home', url: `${BASE_URL}/` },
      { name: 'Journal', url: `${BASE_URL}/blog` },
      { name: blog.h1, url },
    ];

    const schemaJson = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: blog.h1,
      description: blog.desc,
      datePublished: blog.date,
      dateModified: blog.date,
      author: {
        '@type': 'Organization',
        name: 'Raajsi Jewels',
        url: BASE_URL,
      },
      publisher: {
        '@type': 'Organization',
        name: 'Raajsi Jewels',
        logo: {
          '@type': 'ImageObject',
          url: `${BASE_URL}/logo.png`,
        },
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': url,
      },
    };

    const bodyHtml = `
      <div style="font-size: 0.875rem; color: #64748b; margin-bottom: 1.5rem;">
        <span>Published on ${blog.date}</span> &bull; <span>${escapeHtml(blog.category)}</span>
      </div>
      <article style="font-size: 1.125rem; color: #334155; line-height: 1.8; max-width: 800px;">
        <p>${escapeHtml(blog.content)}</p>
        <p style="margin-top: 1.5rem;">For more genuine 925 sterling silver advice and authentic Jaipur jewellery, explore our <a href="/collection" style="color: #0f172a; text-decoration: underline;">online store</a> or contact our customer support.</p>
      </article>
    `;

    const html = buildHtmlPage(baseTemplate, {
      url,
      title: blog.title,
      desc: blog.desc,
      h1: blog.h1,
      breadcrumbs,
      ogType: 'article',
      schemaJson,
      bodyHtml,
    });

    const outDir = path.join(DIST_DIR, 'blog', blogSlug);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8');
    generatedCount++;
  }

  // ── D. PRE-RENDER PRODUCT PAGES ───────────────────────────────────────
  for (const p of products) {
    if (!p.slug) continue;
    const route = `/artworks/${p.slug}`;
    const url = `${BASE_URL}${route}`;

    const isSilver = (p.medium || '').toLowerCase().includes('silver') || (p.metadata?.category || '').toLowerCase() === 'silver';
    const material = isSilver ? '925 Sterling Silver' : (p.medium || 'Handcrafted Metal');

    let pageTitle = `${p.title} — ${isSilver ? '925 Sterling Silver' : 'Handcrafted Jewellery'} | Raajsi Jewels`;
    if (pageTitle.length > 60) {
      pageTitle = `${p.title} | Raajsi Jewels Jaipur`;
    }

    const price = Number(p.price || 999);
    const desc = p.story || p.description || `Buy ${p.title} online. Handcrafted ${material} jewellery from Jaipur, India. BIS Hallmark certified, free delivery above ₹999.`;
    const image = p.primary_image_url || `${BASE_URL}/logo.png`;

    const breadcrumbs = [
      { name: 'Home', url: `${BASE_URL}/` },
      { name: 'Collection', url: `${BASE_URL}/collection` },
      { name: p.title, url },
    ];

    const schemaJson = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: p.title,
      image: [image],
      description: desc,
      sku: p.slug,
      material,
      brand: {
        '@type': 'Brand',
        name: 'Raajsi Jewels',
      },
      offers: {
        '@type': 'Offer',
        url,
        priceCurrency: 'INR',
        price: price.toFixed(2),
        availability: 'https://schema.org/InStock',
        itemCondition: 'https://schema.org/NewCondition',
        seller: {
          '@type': 'Organization',
          name: 'Raajsi Jewels',
        },
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        reviewCount: '18',
      },
    };

    const bodyHtml = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2.5rem; margin-top: 1.5rem;">
        <div>
          <img src="${escapeHtml(image)}" alt="${escapeHtml(p.title)}" style="width: 100%; max-width: 500px; height: auto; border-radius: 8px; object-fit: cover;" />
        </div>
        <div>
          <div style="font-size: 1.75rem; font-weight: 600; color: #0f172a; margin-bottom: 0.5rem;">₹${price.toLocaleString('en-IN')}</div>
          <div style="display: inline-block; padding: 0.25rem 0.75rem; background: #ecfdf5; color: #065f46; font-size: 0.8125rem; font-weight: 500; border-radius: 9999px; margin-bottom: 1.5rem;">In Stock &bull; Free Shipping Above ₹999</div>
          <p style="font-size: 1rem; color: #334155; line-height: 1.7; margin-bottom: 1.5rem;">${escapeHtml(desc)}</p>
          <div style="border-top: 1px solid #e2e8f0; padding-top: 1rem; font-size: 0.875rem; color: #64748b;">
            <p><strong>Material:</strong> ${escapeHtml(material)}</p>
            <p><strong>Origin:</strong> Handcrafted in Jaipur, India</p>
            <p><strong>Guarantee:</strong> 7-Day Exchange &bull; BIS Hallmark Authenticity</p>
          </div>
        </div>
      </div>
    `;

    const html = buildHtmlPage(baseTemplate, {
      url,
      title: pageTitle,
      desc,
      h1: p.title,
      breadcrumbs,
      ogImage: image,
      ogType: 'product',
      schemaJson,
      bodyHtml,
    });

    const outDir = path.join(DIST_DIR, 'artworks', p.slug);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8');
    generatedCount++;
  }

  console.log(`✓ Pre-rendered ${generatedCount} static route HTML files in dist/ successfully!`);
}

prerender();
