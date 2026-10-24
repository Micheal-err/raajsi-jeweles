const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://www.raajsijewels.com';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://hchtqjxuqdcnwyacqlph.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_KEY || 'sb_publishable_vA7Syx8z5fZckmPLYA2Wvg_XyFtfF3g';

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function generate() {
  const today = '2026-10-24';

  // High-value, strictly canonical static pages with real content update dates
  // (changefreq & priority dropped per Google Search Console guidelines)
  const staticPages = [
    { path: '/', lastmod: '2026-10-24' },
    { path: '/collection', lastmod: '2026-10-24' },
    { path: '/about', lastmod: '2026-09-26' },
    { path: '/contact', lastmod: '2026-09-26' },
    { path: '/policies/shipping', lastmod: '2026-09-26' },
    { path: '/policies/returns', lastmod: '2026-09-26' },
    { path: '/policies/faqs', lastmod: '2026-09-26' },
    { path: '/policies/privacy', lastmod: '2026-09-26' },
    { path: '/policies/terms', lastmod: '2026-09-26' },

    // 10 Keyword-targeted category landing pages
    { path: '/jewellery/silver-earrings', lastmod: '2026-10-24' },
    { path: '/jewellery/necklace-sets', lastmod: '2026-10-24' },
    { path: '/jewellery/bracelets-bangles', lastmod: '2026-10-24' },
    { path: '/jewellery/anklets', lastmod: '2026-10-24' },
    { path: '/jewellery/rings', lastmod: '2026-10-24' },
    { path: '/jewellery/nose-pins', lastmod: '2026-10-24' },
    { path: '/jewellery/mangalsutra', lastmod: '2026-10-24' },
    { path: '/jewellery/jaipur-handmade-silver', lastmod: '2026-10-24' },
    { path: '/jewellery/meenakari', lastmod: '2026-10-24' },
    { path: '/jewellery/kundan', lastmod: '2026-10-24' },

    // Blog / Education pages
    { path: '/blog', lastmod: '2026-10-24' },
    { path: '/blog/how-to-check-if-silver-is-real-925', lastmod: '2026-10-01' },
    { path: '/blog/925-silver-vs-pure-silver', lastmod: '2026-10-05' },
    { path: '/blog/does-sterling-silver-tarnish-and-how-to-clean-it', lastmod: '2026-10-10' },
    { path: '/blog/is-silver-jewellery-safe-for-daily-wear', lastmod: '2026-10-15' },
    { path: '/blog/meenakari-vs-kundan-vs-polki-explained', lastmod: '2026-10-20' },
  ];

  const products = [];

  // Fetch only active, real products from Supabase
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/artworks?select=slug,title,updated_at,primary_image_url&order=updated_at.desc`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });

    if (res.ok) {
      const dbArtworks = await res.json();
      if (Array.isArray(dbArtworks)) {
        for (const art of dbArtworks) {
          if (art.slug && typeof art.slug === 'string' && art.slug.trim()) {
            products.push({
              slug: art.slug.trim(),
              title: art.title ? art.title.trim() : 'Raajsi Fine Jewellery',
              lastmod: art.updated_at ? new Date(art.updated_at).toISOString().split('T')[0] : '2026-10-24',
              image: art.primary_image_url || null,
            });
          }
        }
        console.log(`✓ Fetched ${products.length} live products directly from Supabase.`);
      }
    } else {
      console.warn(`Supabase query returned status ${res.status}`);
    }
  } catch (err) {
    console.error('Error fetching Supabase products:', err.message);
  }

  // Construct XML adhering to standard sitemap 0.9 and Google Image extension
  const xmlLines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
  ];

  for (const page of staticPages) {
    xmlLines.push('  <url>');
    xmlLines.push(`    <loc>${BASE_URL}${page.path}</loc>`);
    xmlLines.push(`    <lastmod>${page.lastmod}</lastmod>`);
    xmlLines.push('  </url>');
  }

  for (const prod of products) {
    xmlLines.push('  <url>');
    xmlLines.push(`    <loc>${BASE_URL}/artworks/${encodeURIComponent(prod.slug)}</loc>`);
    xmlLines.push(`    <lastmod>${prod.lastmod || today}</lastmod>`);
    if (prod.image && prod.image.startsWith('http')) {
      xmlLines.push('    <image:image>');
      xmlLines.push(`      <image:loc>${escapeXml(prod.image)}</image:loc>`);
      xmlLines.push(`      <image:title>${escapeXml(prod.title)}</image:title>`);
      xmlLines.push('    </image:image>');
    }
    xmlLines.push('  </url>');
  }

  xmlLines.push('</urlset>');
  const xmlContent = xmlLines.join('\n');

  // Write to public/sitemap.xml
  const publicDir = path.join(__dirname, '..', 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  const publicPath = path.join(publicDir, 'sitemap.xml');
  fs.writeFileSync(publicPath, xmlContent, 'utf8');
  console.log(`✓ Generated clean sitemap at: ${publicPath} (${staticPages.length + products.length} total URLs)`);

  // Mirror to dist/sitemap.xml if dist exists
  const distDir = path.join(__dirname, '..', 'dist');
  if (fs.existsSync(distDir)) {
    const distPath = path.join(distDir, 'sitemap.xml');
    fs.writeFileSync(distPath, xmlContent, 'utf8');
    console.log(`✓ Mirrored sitemap to: ${distPath}`);
  }
}

generate();
