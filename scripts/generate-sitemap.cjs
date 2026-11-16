const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://www.raajsijewels.com';
const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://ldkrcpdsutebayruhrjg.supabase.co';
const SUPABASE_KEY =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_vA7Syx8z5fZckmPLYA2Wvg_XyFtfF3g';

const STATIC_PATHS = [
  '/',
  '/collection',
  '/about',
  '/contact',
  '/policies/shipping',
  '/policies/returns',
  '/policies/faqs',
  '/policies/privacy',
  '/policies/terms',
  '/jewellery/silver-earrings',
  '/jewellery/necklace-sets',
  '/jewellery/bracelets-bangles',
  '/jewellery/anklets',
  '/jewellery/rings',
  '/jewellery/nose-pins',
  '/jewellery/mangalsutra',
  '/jewellery/jaipur-handmade-silver',
  '/jewellery/meenakari',
  '/jewellery/kundan',
  '/blog',
];

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function supabaseHeaders() {
  const headers = { apikey: SUPABASE_KEY };

  // New Supabase publishable keys are not JWTs and must not be sent as
  // Authorization: Bearer tokens. Legacy anon/service JWTs still need it.
  if (!SUPABASE_KEY.startsWith('sb_')) {
    headers.Authorization = `Bearer ${SUPABASE_KEY}`;
  }

  return headers;
}

function validDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

async function fetchProducts() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Supabase URL or API key is not configured.');
  }

  const endpoint = new URL('/rest/v1/artworks', SUPABASE_URL);
  endpoint.searchParams.set('select', 'slug,title,primary_image_url');
  endpoint.searchParams.set('order', 'created_at.desc');

  const response = await fetch(endpoint, {
    headers: supabaseHeaders(),
    signal: AbortSignal.timeout(20000),
  });

  if (!response.ok) {
    throw new Error(`Supabase returned HTTP ${response.status} while generating sitemap.`);
  }

  const rows = await response.json();
  if (!Array.isArray(rows)) {
    throw new Error('Supabase returned an invalid artworks response.');
  }

  const seen = new Set();
  return rows.filter((product) => {
    const slug = typeof product?.slug === 'string' ? product.slug.trim() : '';
    if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(slug) || seen.has(slug)) {
      return false;
    }
    seen.add(slug);
    return true;
  }).map((product) => ({
    slug: product.slug.trim(),
    title: product.title || 'Raajsi Jewels product',
    lastmod: null,
    image: typeof product.primary_image_url === 'string' ? product.primary_image_url : null,
  }));
}

function buildSitemap(products) {
  const entries = [];
  const seenUrls = new Set();

  function addEntry(url, lastmod, image, imageTitle) {
    if (seenUrls.has(url)) return;
    seenUrls.add(url);

    entries.push('  <url>');
    entries.push(`    <loc>${escapeXml(url)}</loc>`);
    // lastmod is omitted unless it comes from a real content update timestamp.
    if (lastmod) entries.push(`    <lastmod>${lastmod}</lastmod>`);

    if (image && /^https?:\/\//i.test(image)) {
      entries.push('    <image:image>');
      entries.push(`      <image:loc>${escapeXml(image)}</image:loc>`);
      entries.push(`      <image:title>${escapeXml(imageTitle)}</image:title>`);
      entries.push('    </image:image>');
    }

    entries.push('  </url>');
  }

  for (const route of STATIC_PATHS) {
    addEntry(`${BASE_URL}${route === '/' ? '/' : route}`);
  }

  for (const product of products) {
    addEntry(
      `${BASE_URL}/artworks/${encodeURIComponent(product.slug)}`,
      product.lastmod,
      product.image,
      product.title,
    );
  }

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
    ...entries,
    '</urlset>',
  ].join('\n');
}

async function generate() {
  try {
    const products = await fetchProducts();
    const xml = buildSitemap(products);
    const publicDir = path.join(__dirname, '..', 'public');
    fs.mkdirSync(publicDir, { recursive: true });

    const publicPath = path.join(publicDir, 'sitemap.xml');
    fs.writeFileSync(publicPath, xml, 'utf8');

    const distDir = path.join(__dirname, '..', 'dist');
    if (fs.existsSync(distDir)) {
      fs.writeFileSync(path.join(distDir, 'sitemap.xml'), xml, 'utf8');
    }

    console.log(`✓ Generated sitemap with ${STATIC_PATHS.length} public pages and ${products.length} product URLs.`);
    console.log('  Outline-only blog articles are intentionally omitted until their content is complete.');
  } catch (error) {
    console.error(`Sitemap generation failed: ${error.message}`);
    process.exitCode = 1;
  }
}

generate();
