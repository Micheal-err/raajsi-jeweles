const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://www.raajsijewels.com';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://hchtqjxuqdcnwyacqlph.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_KEY || 'sb_publishable_vA7Syx8z5fZckmPLYA2Wvg_XyFtfF3g';

async function generate() {
  const today = new Date().toISOString().split('T')[0];

  // High-value static pages for Google Search indexation
  const staticPages = [
    { path: '/', changefreq: 'daily', priority: '1.0', lastmod: today },
    { path: '/collection', changefreq: 'daily', priority: '0.9', lastmod: today },
    { path: '/collection?category=sterling-silver', changefreq: 'daily', priority: '0.9', lastmod: today },
    { path: '/collection?category=handcrafted', changefreq: 'daily', priority: '0.9', lastmod: today },
    { path: '/about', changefreq: 'monthly', priority: '0.7', lastmod: '2026-09-23' },
    { path: '/contact', changefreq: 'monthly', priority: '0.7', lastmod: '2026-09-23' },
    { path: '/policies/terms', changefreq: 'yearly', priority: '0.4', lastmod: '2026-09-23' },
    { path: '/policies/privacy', changefreq: 'yearly', priority: '0.4', lastmod: '2026-09-23' },
    { path: '/policies/shipping', changefreq: 'monthly', priority: '0.5', lastmod: today },
    { path: '/policies/returns', changefreq: 'monthly', priority: '0.5', lastmod: '2026-09-23' },
    { path: '/policies/faqs', changefreq: 'weekly', priority: '0.6', lastmod: today },
  ];

  const productsMap = new Map();

  // 1. Fetch from Supabase REST API
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
        dbArtworks.forEach((art) => {
          if (art.slug) {
            productsMap.set(art.slug, {
              slug: art.slug,
              title: art.title || 'Raajsi Fine Jewellery',
              lastmod: art.updated_at ? new Date(art.updated_at).toISOString().split('T')[0] : today,
              image: art.primary_image_url,
            });
          }
        });
        console.log(`✓ Fetched ${dbArtworks.length} live artworks from Supabase.`);
      }
    } else {
      console.warn(`Supabase HTTP status: ${res.status}`);
    }
  } catch (err) {
    console.warn('Could not query Supabase REST:', err.message);
  }

  // 2. Fallback / supplement with local catalogue in jewellery-data.ts
  try {
    const dataFilePath = path.join(__dirname, '..', 'src', 'lib', 'jewellery-data.ts');
    if (fs.existsSync(dataFilePath)) {
      const content = fs.readFileSync(dataFilePath, 'utf8');
      const slugMatches = [...content.matchAll(/slug:\s*["']([^"']+)["']/g)];
      slugMatches.forEach((m) => {
        const slug = m[1];
        if (!productsMap.has(slug)) {
          productsMap.set(slug, {
            slug,
            title: slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            lastmod: today,
          });
        }
      });
      console.log(`✓ Total unique jewellery URLs ready for sitemap: ${productsMap.size}`);
    }
  } catch (err) {
    console.warn('Local file read warning:', err.message);
  }

  // 3. Construct XML with Google Image Schema
  const xmlLines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
  ];

  for (const page of staticPages) {
    xmlLines.push('  <url>');
    xmlLines.push(`    <loc>${BASE_URL}${page.path.replace(/&/g, '&amp;')}</loc>`);
    xmlLines.push(`    <lastmod>${page.lastmod}</lastmod>`);
    xmlLines.push(`    <changefreq>${page.changefreq}</changefreq>`);
    xmlLines.push(`    <priority>${page.priority}</priority>`);
    xmlLines.push('  </url>');
  }

  for (const [slug, prod] of productsMap.entries()) {
    xmlLines.push('  <url>');
    xmlLines.push(`    <loc>${BASE_URL}/artworks/${slug}</loc>`);
    xmlLines.push(`    <lastmod>${prod.lastmod || today}</lastmod>`);
    xmlLines.push('    <changefreq>weekly</changefreq>');
    xmlLines.push('    <priority>0.8</priority>');
    if (prod.image && prod.image.startsWith('http')) {
      xmlLines.push('    <image:image>');
      xmlLines.push(`      <image:loc>${prod.image.replace(/&/g, '&amp;')}</image:loc>`);
      xmlLines.push(`      <image:title>${(prod.title || 'Raajsi Fine Jewellery').replace(/&/g, '&amp;')}</image:title>`);
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
  console.log(`✓ Generated: ${publicPath}`);

  // Mirror to dist/sitemap.xml if dist exists
  const distDir = path.join(__dirname, '..', 'dist');
  if (fs.existsSync(distDir)) {
    const distPath = path.join(distDir, 'sitemap.xml');
    fs.writeFileSync(distPath, xmlContent, 'utf8');
    console.log(`✓ Mirrored: ${distPath}`);
  }
}

generate();
