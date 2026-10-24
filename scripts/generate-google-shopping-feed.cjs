const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://www.raajsijewels.com';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://hchtqjxuqdcnwyacqlph.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_KEY || 'sb_publishable_vA7Syx8z5fZckmPLYA2Wvg_XyFtfF3g';

const CATEGORY_MAP = {
  rings: 'Apparel & Accessories > Jewelry > Rings',
  earrings: 'Apparel & Accessories > Jewelry > Earrings',
  necklaces: 'Apparel & Accessories > Jewelry > Necklaces',
  bracelets: 'Apparel & Accessories > Jewelry > Bracelets',
  anklets: 'Apparel & Accessories > Jewelry > Anklets',
  'nose-rings': 'Apparel & Accessories > Jewelry > Body Jewelry > Nose Rings & Studs',
};

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function escapeCsv(text) {
  if (!text) return '""';
  const str = String(text).replace(/"/g, '""').replace(/\r?\n/g, ' ');
  return `"${str}"`;
}

async function generateFeeds() {
  console.log('Generating Google Shopping Feeds (CSV & XML)...');

  let products = [];
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/artworks?select=*&order=created_at.desc`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });
    if (res.ok) {
      products = await res.json();
      console.log(`✓ Fetched ${products.length} live products for Google Shopping feed.`);
    }
  } catch (err) {
    console.error('Error querying Supabase for feed:', err.message);
    return;
  }

  // 1. GENERATE CSV FEED (google-shopping-feed-template.csv)
  const csvHeaders = [
    'id',
    'title',
    'description',
    'link',
    'image_link',
    'additional_image_link',
    'availability',
    'price',
    'brand',
    'condition',
    'google_product_category',
    'product_type',
    'material',
    'color',
    'item_group_id',
    'identifier_exists',
    'shipping',
  ];

  const csvRows = [csvHeaders.join(',')];

  // 2. GENERATE XML FEED (/feeds/google.xml)
  const xmlLines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">',
    '  <channel>',
    `    <title>Raajsi Jewels — Official Google Shopping Feed</title>`,
    `    <link>${BASE_URL}</link>`,
    `    <description>925 Sterling Silver &amp; Handcrafted Fine Jewellery from Jaipur, India.</description>`,
  ];

  for (const p of products) {
    const subcategory = (p.metadata?.subcategory || '').toLowerCase();
    const isSilver = (p.medium || '').toLowerCase().includes('silver') || (p.metadata?.category || '').toLowerCase() === 'silver';
    const material = isSilver ? '925 Sterling Silver' : (p.medium || 'Handcrafted Metal');
    const gpc = CATEGORY_MAP[subcategory] || 'Apparel & Accessories > Jewelry';

    // Keyword enriched title per PDF guidelines:
    // {Style/Product Name} - {Material} {Type} for Women - {Color/Stone}
    let enrichedTitle = p.title;
    if (!enrichedTitle.toLowerCase().includes('silver') && isSilver) {
      enrichedTitle = `${p.title} - 925 Sterling Silver Jewellery for Women`;
    } else if (!enrichedTitle.toLowerCase().includes('jewellery') && !enrichedTitle.toLowerCase().includes('earrings') && !enrichedTitle.toLowerCase().includes('necklace') && !enrichedTitle.toLowerCase().includes('bracelet') && !enrichedTitle.toLowerCase().includes('ring')) {
      enrichedTitle = `${p.title} - Handcrafted Designer Jewellery`;
    }

    // Determine color & item_group_id
    let color = isSilver ? 'Silver' : 'Gold';
    let itemGroupId = '';
    if (p.slug.startsWith('the-ivy-bracelet')) {
      itemGroupId = 'ivy-bracelet';
      if (p.slug.includes('red')) color = 'Red';
      else if (p.slug.includes('deep-purple')) color = 'Deep Purple';
      else color = 'Green';
    }

    const priceFormatted = `${Number(p.price || 999).toFixed(2)} INR`;
    const shippingFormatted = Number(p.price || 0) >= 999 ? 'IN:::0.00 INR' : 'IN:::99.00 INR';
    const link = `${BASE_URL}/artworks/${encodeURIComponent(p.slug)}`;
    const imageLink = p.primary_image_url || '';
    
    // Additional gallery images
    const rawGallery = Array.isArray(p.gallery_image_urls) ? p.gallery_image_urls : (p.metadata?.gallery_images || []);
    const galleryFiltered = rawGallery.filter((img) => img && img !== imageLink && img.startsWith('http')).slice(0, 5);
    const additionalImageLinks = galleryFiltered.join(',');

    const description = p.story || p.description || `${enrichedTitle}. Handcrafted by master artisans in Jaipur, India. BIS Hallmark certified purity, free delivery above ₹999, 7-day exchange.`;

    // CSV Row
    csvRows.push([
      escapeCsv(p.slug),
      escapeCsv(enrichedTitle),
      escapeCsv(description),
      escapeCsv(link),
      escapeCsv(imageLink),
      escapeCsv(additionalImageLinks),
      escapeCsv('in_stock'),
      escapeCsv(priceFormatted),
      escapeCsv('Raajsi Jewels'),
      escapeCsv('new'),
      escapeCsv(gpc),
      escapeCsv(p.metadata?.category === 'silver' ? 'Sterling Silver 925' : 'Handcrafted Jewels'),
      escapeCsv(material),
      escapeCsv(color),
      escapeCsv(itemGroupId),
      escapeCsv('no'),
      escapeCsv(shippingFormatted),
    ].join(','));

    // XML Item
    xmlLines.push('    <item>');
    xmlLines.push(`      <g:id>${escapeXml(p.slug)}</g:id>`);
    xmlLines.push(`      <g:title>${escapeXml(enrichedTitle)}</g:title>`);
    xmlLines.push(`      <g:description>${escapeXml(description)}</g:description>`);
    xmlLines.push(`      <g:link>${escapeXml(link)}</g:link>`);
    xmlLines.push(`      <g:image_link>${escapeXml(imageLink)}</g:image_link>`);
    for (const addImg of galleryFiltered) {
      xmlLines.push(`      <g:additional_image_link>${escapeXml(addImg)}</g:additional_image_link>`);
    }
    xmlLines.push(`      <g:availability>in_stock</g:availability>`);
    xmlLines.push(`      <g:price>${priceFormatted}</g:price>`);
    xmlLines.push(`      <g:brand>Raajsi Jewels</g:brand>`);
    xmlLines.push(`      <g:condition>new</g:condition>`);
    xmlLines.push(`      <g:google_product_category>${escapeXml(gpc)}</g:google_product_category>`);
    xmlLines.push(`      <g:material>${escapeXml(material)}</g:material>`);
    xmlLines.push(`      <g:color>${escapeXml(color)}</g:color>`);
    if (itemGroupId) {
      xmlLines.push(`      <g:item_group_id>${escapeXml(itemGroupId)}</g:item_group_id>`);
    }
    xmlLines.push(`      <g:identifier_exists>no</g:identifier_exists>`);
    xmlLines.push(`      <g:shipping>`);
    xmlLines.push(`        <g:country>IN</g:country>`);
    xmlLines.push(`        <g:price>${Number(p.price || 0) >= 999 ? '0.00 INR' : '99.00 INR'}</g:price>`);
    xmlLines.push(`      </g:shipping>`);
    xmlLines.push('    </item>');
  }

  xmlLines.push('  </channel>');
  xmlLines.push('</rss>');

  const csvContent = csvRows.join('\n');
  const xmlContent = xmlLines.join('\n');

  // Ensure public and public/feeds exist
  const publicDir = path.join(__dirname, '..', 'public');
  const feedsDir = path.join(publicDir, 'feeds');
  if (!fs.existsSync(feedsDir)) {
    fs.mkdirSync(feedsDir, { recursive: true });
  }

  const csvPublicPath = path.join(publicDir, 'google-shopping-feed-template.csv');
  fs.writeFileSync(csvPublicPath, csvContent, 'utf8');
  console.log(`✓ Generated Google Shopping CSV: ${csvPublicPath}`);

  const xmlPublicPath = path.join(feedsDir, 'google.xml');
  fs.writeFileSync(xmlPublicPath, xmlContent, 'utf8');
  console.log(`✓ Generated Google Shopping XML feed: ${xmlPublicPath}`);

  // Mirror to dist if dist exists
  const distDir = path.join(__dirname, '..', 'dist');
  if (fs.existsSync(distDir)) {
    const distFeedsDir = path.join(distDir, 'feeds');
    if (!fs.existsSync(distFeedsDir)) {
      fs.mkdirSync(distFeedsDir, { recursive: true });
    }
    fs.writeFileSync(path.join(distDir, 'google-shopping-feed-template.csv'), csvContent, 'utf8');
    fs.writeFileSync(path.join(distFeedsDir, 'google.xml'), xmlContent, 'utf8');
    console.log(`✓ Mirrored feeds to dist/ and dist/feeds/`);
  }
}

generateFeeds();
