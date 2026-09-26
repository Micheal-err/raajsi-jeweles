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
  const today = new Date().toISOString().split('T')[0];

  // High-value, strictly canonical static pages for Google Search Console
  // Query parameters (e.g. ?category=...) are intentionally excluded to prevent duplicate canonical errors
  const staticPages = [
    { path: '/', changefreq: 'daily', priority: '1.0', lastmod: today },
    { path: '/collection', changefreq: 'daily', priority: '0.9', lastmod: today },
    { path: '/about', changefreq: 'monthly', priority: '0.7', lastmod: '2026-09-26' },
    { path: '/contact', changefreq: 'monthly', priority: '0.7', lastmod: '2026-09-26' },
    { path: '/policies/shipping', changefreq: 'monthly', priority: '0.6', lastmod: today },
    { path: '/policies/returns', changefreq: 'monthly', priority: '0.6', lastmod: '2026-09-26' },
    { path: '/policies/faqs', changefreq: 'weekly', priority: '0.6', lastmod: today },
    { path: '/policies/privacy', changefreq: 'yearly', priority: '0.4', lastmod: '2026-09-26' },
    { path: '/policies/terms', changefreq: 'yearly', priority: '0.4', lastmod: '2026-09-26' },
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
              lastmod: art.updated_at ? new Date(art.updated_at).toISOString().split('T')[0] : today,
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

  // Construct XML adhering to sitemap 0.9 and Google Image extension
  const xmlLines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
  ];

  for (const page of staticPages) {
    xmlLines.push('  <url>');
    xmlLines.push(`    <loc>${BASE_URL}${page.path}</loc>`);
    xmlLines.push(`    <lastmod>${page.lastmod}</lastmod>`);
    xmlLines.push(`    <changefreq>${page.changefreq}</changefreq>`);
    xmlLines.push(`    <priority>${page.priority}</priority>`);
    xmlLines.push('  </url>');
  }

  for (const prod of products) {
    xmlLines.push('  <url>');
    xmlLines.push(`    <loc>${BASE_URL}/artworks/${encodeURIComponent(prod.slug)}</loc>`);
    xmlLines.push(`    <lastmod>${prod.lastmod || today}</lastmod>`);
    xmlLines.push('    <changefreq>weekly</changefreq>');
    xmlLines.push('    <priority>0.8</priority>');
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
