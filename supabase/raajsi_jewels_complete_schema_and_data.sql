-- ==============================================================================
-- RAAJSI JEWELS — SUPABASE MASTER DATABASE SETUP & COMPLETE CATALOGUE
-- Project: Fine Indian Jewellery, Jaipur
-- 
-- SUMMARY OF CHANGES:
-- 1. NO ARTIST CONCEPT: Art gallery / artist tables and fields are completely eliminated.
-- 2. DIRECT E-COMMERCE: No "on_request", "demand", "reserved", or "ranges".
--    Every product has a fixed price and clear stock.
-- 3. ALL PRODUCTS STORED IN SUPABASE: 27+ fine jewellery items pre-seeded
--    covering all categories (men, women, unisex) and subcategories (rings,
--    chains, bracelets/kadas, necklaces, earrings, bangles, pendants),
--    each with dimensions, metal, gemstone, finishing, and 4-5 images.
--
-- HOW TO RUN:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/hchtqjxuqdcnwyacqlph/sql
-- 2. Click "New Query" (or SQL Editor).
-- 3. Paste this entire script and click "RUN" (or Ctrl+Enter).
-- ==============================================================================

-- 1. Clean Drop of old unused art gallery tables
DROP TABLE IF EXISTS public.artists CASCADE;
DROP TABLE IF EXISTS public.exhibitions CASCADE;
DROP TABLE IF EXISTS public.journal_entries CASCADE;
DROP TABLE IF EXISTS public.press_mentions CASCADE;

-- 2. CUSTOMER & ADMIN PROFILES TABLE (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    display_name TEXT,
    phone TEXT,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. JEWELLERY PRODUCTS TABLE (Stored as artworks for seamless route compatibility)
CREATE TABLE IF NOT EXISTS public.artworks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    medium TEXT NOT NULL, -- e.g. "22K Yellow Gold", "925 Sterling Silver"
    story TEXT,           -- Product description
    primary_image_url TEXT NOT NULL,
    gallery_image_urls TEXT[] NOT NULL DEFAULT '{}',
    price NUMERIC NOT NULL,
    display_price NUMERIC NOT NULL,
    price_display TEXT NOT NULL DEFAULT 'fixed',
    availability TEXT NOT NULL DEFAULT 'available',
    stock_quantity INT NOT NULL DEFAULT 15,
    origin_country TEXT NOT NULL DEFAULT 'Jaipur, India',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    featured BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- If artworks already existed with an artist_id column, drop it
DO $$ BEGIN
    ALTER TABLE public.artworks DROP COLUMN IF EXISTS artist_id CASCADE;
EXCEPTION WHEN undefined_column THEN null; END $$;

-- 4. CART ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    artwork_id UUID NOT NULL REFERENCES public.artworks(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1,
    selected_size TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, artwork_id, selected_size)
);

-- 5. WISHLIST ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.wishlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    artwork_id UUID NOT NULL REFERENCES public.artworks(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, artwork_id)
);

-- 6. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_email TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    shipping_address JSONB NOT NULL,
    items JSONB NOT NULL,
    total_amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'INR',
    payment_status TEXT DEFAULT 'paid',
    payment_method TEXT DEFAULT 'online',
    fulfillment_status TEXT DEFAULT 'processing',
    tracking_number TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. INQUIRIES & CONTACT FORM TABLE
CREATE TABLE IF NOT EXISTS public.inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'general',
    status TEXT DEFAULT 'new',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. NEWSLETTER SUBSCRIBERS TABLE
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Public profiles read" ON public.profiles;
CREATE POLICY "Public profiles read" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Jewellery Products (Artworks) Public Read
DROP POLICY IF EXISTS "Public read jewellery" ON public.artworks;
CREATE POLICY "Public read jewellery" ON public.artworks FOR SELECT USING (true);

-- Cart Items Policies
DROP POLICY IF EXISTS "Users manage own cart" ON public.cart_items;
CREATE POLICY "Users manage own cart" ON public.cart_items FOR ALL USING (auth.uid() = user_id);

-- Wishlist Items Policies
DROP POLICY IF EXISTS "Users manage own wishlist" ON public.wishlist_items;
CREATE POLICY "Users manage own wishlist" ON public.wishlist_items FOR ALL USING (auth.uid() = user_id);

-- Orders Policies
DROP POLICY IF EXISTS "Users view own orders" ON public.orders;
CREATE POLICY "Users view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id OR auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true));

DROP POLICY IF EXISTS "Users create orders" ON public.orders;
CREATE POLICY "Users create orders" ON public.orders FOR INSERT WITH CHECK (true);

-- Inquiries & Newsletter Policies
DROP POLICY IF EXISTS "Public insert inquiries" ON public.inquiries;
CREATE POLICY "Public insert inquiries" ON public.inquiries FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public insert newsletter" ON public.newsletter_subscribers;
CREATE POLICY "Public insert newsletter" ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);

-- Admin Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;

-- ==============================================================================
-- AUTOMATIC PROFILE TRIGGER ON AUTH USER CREATION
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email, display_name, is_admin)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
        CASE 
            WHEN new.email IN ('demo@raajsijewels.com', 'collector@raajsijewels.com', 'abhishek@gmail.com', 'kalanery@gmail.com') THEN true 
            ELSE false 
        END
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        email = EXCLUDED.email,
        display_name = COALESCE(EXCLUDED.display_name, public.profiles.display_name);
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Sync any existing auth users into public.profiles
INSERT INTO public.profiles (id, email, display_name, is_admin)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'display_name', split_part(email, '@', 1)),
    CASE 
        WHEN email IN ('demo@raajsijewels.com', 'collector@raajsijewels.com', 'abhishek@gmail.com', 'kalanery@gmail.com') THEN true 
        ELSE false 
    END
FROM auth.users
ON CONFLICT (id) DO UPDATE 
SET email = EXCLUDED.email;

-- ==============================================================================
-- SEED DATA: COMPLETE 27+ JEWELLERY PIECES
-- Minimum 3 pieces per Category (Men, Women, Unisex) & Subcategory
-- (Rings, Chains, Bracelets/Kadas, Necklaces, Earrings, Bangles, Pendants)
-- Each with 4-5 images, exact material, finishing, dimensions, gemstone, and stock.
-- ==============================================================================
INSERT INTO public.artworks (
    slug, title, medium, story, 
    primary_image_url, gallery_image_urls,
    price, display_price, price_display, 
    availability, stock_quantity, metadata, featured
)
VALUES
-- ── 1. WOMEN'S RINGS (Piece 1) ────────────────────────────────────────────────
(
    'royal-solitaire-kundan-ring',
    'Royal Kundan Solitaire Ring',
    '22K Yellow Gold',
    'Handcrafted in Jaipur with an uncut diamond (Polki) set in pure gold foil surrounded by brilliant crimson Meenakari enamel work on the reverse gallery.',
    '/jewellery/jewellery-rings.png',
    ARRAY[
        '/jewellery/jewellery-rings.png',
        '/jewellery/jewellery-hero.png',
        '/jewellery/jewellery-necklace.jpg',
        '/jewellery/jewellery-bangles.jpg',
        '/jewellery/jewellery-mens.png'
    ],
    28500, 28500, 'fixed', 'available', 12,
    '{
        "material": "22K Yellow Gold (BIS 916 Hallmarked)",
        "finishing": "High Polish Gold & Crimson Meenakari Enamel",
        "length": "N/A",
        "width": "14 mm bezel",
        "thickness": "2.2 mm band",
        "gemstone": "Uncut Polki Diamond & Burmese Ruby",
        "ring_size": "14",
        "ring_sizes": ["10", "12", "14", "16", "18", "20"],
        "stock": "In Stock (12 units available)",
        "category": "women",
        "gender": "women",
        "subcategory": "Rings",
        "gallery_images": [
            "/jewellery/jewellery-rings.png",
            "/jewellery/jewellery-hero.png",
            "/jewellery/jewellery-necklace.jpg",
            "/jewellery/jewellery-bangles.jpg",
            "/jewellery/jewellery-mens.png"
        ]
    }'::jsonb,
    true
),

-- ── 2. WOMEN'S RINGS (Piece 2) ────────────────────────────────────────────────
(
    'womens-floral-diamond-cocktail-ring',
    'Jaipur Floral Diamond Cocktail Ring',
    '18K Rose Gold',
    'Opulent floral cocktail ring crafted in 18K rose gold, studded with natural round brilliant diamonds and a natural Zambian emerald center cluster.',
    '/jewellery/jewellery-necklace.jpg',
    ARRAY[
        '/jewellery/jewellery-necklace.jpg',
        '/jewellery/jewellery-rings.png',
        '/jewellery/jewellery-hero.png',
        '/jewellery/jewellery-bangles.jpg'
    ],
    54000, 54000, 'fixed', 'available', 8,
    '{
        "material": "18K Rose Gold",
        "finishing": "Micro-Pavé Mirror Polish",
        "length": "N/A",
        "width": "22 mm floral spread",
        "thickness": "3 mm shank",
        "gemstone": "Natural Round Brilliant Diamonds (VVS-VS) & Zambian Emerald",
        "ring_size": "14",
        "ring_sizes": ["12", "14", "16", "18"],
        "stock": "In Stock (8 units available)",
        "category": "women",
        "gender": "women",
        "subcategory": "Rings",
        "gallery_images": [
            "/jewellery/jewellery-necklace.jpg",
            "/jewellery/jewellery-rings.png",
            "/jewellery/jewellery-hero.png",
            "/jewellery/jewellery-bangles.jpg"
        ]
    }'::jsonb,
    true
),

-- ── 3. WOMEN'S RINGS (Piece 3) ────────────────────────────────────────────────
(
    'meenakari-peacock-emerald-band',
    'Mayur Meenakari & Emerald Eternity Band',
    '22K Yellow Gold',
    'Traditional Jaipur Mayur (peacock) motifs hand-painted in royal blue and green hot vitreous enamel, set with continuous natural emerald baguettes.',
    '/jewellery/jewellery-bangles.jpg',
    ARRAY[
        '/jewellery/jewellery-bangles.jpg',
        '/jewellery/jewellery-rings.png',
        '/jewellery/jewellery-hero.png',
        '/jewellery/jewellery-necklace.jpg'
    ],
    34000, 34000, 'fixed', 'available', 15,
    '{
        "material": "22K Yellow Gold",
        "finishing": "Authentic Jaipur Meenakari Enamelling",
        "length": "N/A",
        "width": "6 mm eternity width",
        "thickness": "2 mm",
        "gemstone": "Natural Emerald Baguettes",
        "ring_size": "14",
        "ring_sizes": ["12", "14", "16", "18"],
        "stock": "In Stock (15 units available)",
        "category": "women",
        "gender": "women",
        "subcategory": "Rings",
        "gallery_images": [
            "/jewellery/jewellery-bangles.jpg",
            "/jewellery/jewellery-rings.png",
            "/jewellery/jewellery-hero.png",
            "/jewellery/jewellery-necklace.jpg"
        ]
    }'::jsonb,
    false
),

-- ── 4. MEN'S RINGS (Piece 1) ──────────────────────────────────────────────────
(
    'mens-regal-gold-signet-ring',
    'Men''s Regal Lion Signet Ring',
    '18K Yellow Gold',
    'Substantial heavy signet ring featuring a hand-carved Rajput lion crest and deep black natural onyx stone designed for bold masculine luxury.',
    '/jewellery/jewellery-mens.png',
    ARRAY[
        '/jewellery/jewellery-mens.png',
        '/jewellery/jewellery-rings.png',
        '/jewellery/jewellery-hero.png',
        '/jewellery/jewellery-bangles.jpg'
    ],
    42000, 42000, 'fixed', 'available', 14,
    '{
        "material": "18K Yellow Gold",
        "finishing": "Brushed Satin Shank with High Polish Crest",
        "length": "N/A",
        "width": "18 mm crest",
        "thickness": "3.5 mm solid",
        "gemstone": "Natural Black Onyx Stone",
        "ring_size": "18",
        "ring_sizes": ["16", "18", "20", "22", "24"],
        "stock": "In Stock (14 units available)",
        "category": "men",
        "gender": "men",
        "subcategory": "Rings",
        "gallery_images": [
            "/jewellery/jewellery-mens.png",
            "/jewellery/jewellery-rings.png",
            "/jewellery/jewellery-hero.png",
            "/jewellery/jewellery-bangles.jpg"
        ]
    }'::jsonb,
    true
),

-- ── 5. MEN'S RINGS (Piece 2) ──────────────────────────────────────────────────
(
    'rajput-crest-solid-22k-gold-band',
    'Rajput Crest Solid 22K Gold Band',
    '22K Yellow Gold',
    'Substantial 22-karat hallmarked solid gold wedding and ceremonial band with beveled step-cut geometric edges and Rajput seal engraving.',
    '/jewellery/jewellery-hero.png',
    ARRAY[
        '/jewellery/jewellery-hero.png',
        '/jewellery/jewellery-mens.png',
        '/jewellery/jewellery-rings.png',
        '/jewellery/jewellery-bangles.jpg'
    ],
    48000, 48000, 'fixed', 'available', 9,
    '{
        "material": "22K Yellow Gold (BIS 916)",
        "finishing": "Dual Satin & Mirror Beveled Edge",
        "length": "N/A",
        "width": "9 mm band width",
        "thickness": "2.8 mm heavy solid",
        "gemstone": "None (Solid Gold)",
        "ring_size": "20",
        "ring_sizes": ["16", "18", "20", "22", "24"],
        "stock": "In Stock (9 units available)",
        "category": "men",
        "gender": "men",
        "subcategory": "Rings",
        "gallery_images": [
            "/jewellery/jewellery-hero.png",
            "/jewellery/jewellery-mens.png",
            "/jewellery/jewellery-rings.png",
            "/jewellery/jewellery-bangles.jpg"
        ]
    }'::jsonb,
    true
),

-- ── 6. MEN'S RINGS (Piece 3) ──────────────────────────────────────────────────
(
    'mens-navratna-astrological-ring',
    'Men''s Royal Navratna Astrological Ring',
    '18K Yellow Gold',
    'Sacred nine astrological gems arranged in precise Vedic alignment in a heavy solid gold signet setting for balance, prosperity, and royal prestige.',
    '/jewellery/jewellery-rings.png',
    ARRAY[
        '/jewellery/jewellery-rings.png',
        '/jewellery/jewellery-mens.png',
        '/jewellery/jewellery-hero.png',
        '/jewellery/jewellery-necklace.jpg'
    ],
    38500, 38500, 'fixed', 'available', 7,
    '{
        "material": "18K Yellow Gold",
        "finishing": "Sunburst Mirror Finish",
        "length": "N/A",
        "width": "16 mm circular face",
        "thickness": "3 mm",
        "gemstone": "Certified Navratna (9 Natural Planetary Gemstones)",
        "ring_size": "18",
        "ring_sizes": ["16", "18", "20", "22"],
        "stock": "In Stock (7 units available)",
        "category": "men",
        "gender": "men",
        "subcategory": "Rings",
        "gallery_images": [
            "/jewellery/jewellery-rings.png",
            "/jewellery/jewellery-mens.png",
            "/jewellery/jewellery-hero.png",
            "/jewellery/jewellery-necklace.jpg"
        ]
    }'::jsonb,
    false
),

-- ── 7. UNISEX RINGS (Piece 1) ─────────────────────────────────────────────────
(
    'unisex-hammered-silver-band',
    'Hand-Hammered Sterling Silver Band',
    '925 Sterling Silver',
    'Textured unisex silver band hand-hammered by Jaipur artisans, finished with an antique oxidized patina for everyday understated sophistication.',
    '/jewellery/jewellery-rings.png',
    ARRAY[
        '/jewellery/jewellery-rings.png',
        '/jewellery/jewellery-hero.png',
        '/jewellery/jewellery-mens.png',
        '/jewellery/jewellery-bangles.jpg'
    ],
    4800, 4800, 'fixed', 'available', 25,
    '{
        "material": "925 Sterling Silver",
        "finishing": "Antique Hand-Hammered Finish",
        "length": "N/A",
        "width": "8 mm band width",
        "thickness": "2 mm",
        "gemstone": "None",
        "ring_size": "16",
        "ring_sizes": ["10", "12", "14", "16", "18", "20"],
        "stock": "In Stock (25 units available)",
        "category": "unisex",
        "gender": "unisex",
        "subcategory": "Rings",
        "gallery_images": [
            "/jewellery/jewellery-rings.png",
            "/jewellery/jewellery-hero.png",
            "/jewellery/jewellery-mens.png",
            "/jewellery/jewellery-bangles.jpg"
        ]
    }'::jsonb,
    false
),

-- ── 8. UNISEX RINGS (Piece 2) ─────────────────────────────────────────────────
(
    'jaipur-vintage-wave-gold-band',
    'Jaipur Vintage Wave Gold Band',
    '18K Yellow Gold',
    'Sculptural unisex ribbon wave band hand-contoured in solid 18K gold. Comfortable fit suitable for everyday wear or modern pairing.',
    '/jewellery/jewellery-hero.png',
    ARRAY[
        '/jewellery/jewellery-hero.png',
        '/jewellery/jewellery-rings.png',
        '/jewellery/jewellery-necklace.jpg',
        '/jewellery/jewellery-mens.png'
    ],
    22000, 22000, 'fixed', 'available', 18,
    '{
        "material": "18K Yellow Gold",
        "finishing": "Comfort-Fit High Polish",
        "length": "N/A",
        "width": "5 mm undulating wave",
        "thickness": "2 mm",
        "gemstone": "None",
        "ring_size": "16",
        "ring_sizes": ["12", "14", "16", "18", "20"],
        "stock": "In Stock (18 units available)",
        "category": "unisex",
        "gender": "unisex",
        "subcategory": "Rings",
        "gallery_images": [
            "/jewellery/jewellery-hero.png",
            "/jewellery/jewellery-rings.png",
            "/jewellery/jewellery-necklace.jpg",
            "/jewellery/jewellery-mens.png"
        ]
    }'::jsonb,
    false
),

-- ── 9. UNISEX RINGS (Piece 3) ─────────────────────────────────────────────────
(
    'sterling-silver-meditation-spinner-ring',
    'Jaipur Silver Meditation Spinner Ring',
    '925 Sterling Silver',
    'Hand-crafted unisex meditation ring featuring three outer spinning brass and copper accent rings over a broad hammered solid sterling silver base.',
    '/jewellery/jewellery-mens.png',
    ARRAY[
        '/jewellery/jewellery-mens.png',
        '/jewellery/jewellery-rings.png',
        '/jewellery/jewellery-hero.png',
        '/jewellery/jewellery-bangles.jpg'
    ],
    5600, 5600, 'fixed', 'available', 20,
    '{
        "material": "925 Sterling Silver with Brass & Copper accents",
        "finishing": "Multi-Tone Hand-Hammered",
        "length": "N/A",
        "width": "11 mm broad band",
        "thickness": "2.2 mm",
        "gemstone": "None",
        "ring_size": "16",
        "ring_sizes": ["12", "14", "16", "18", "20"],
        "stock": "In Stock (20 units available)",
        "category": "unisex",
        "gender": "unisex",
        "subcategory": "Rings",
        "gallery_images": [
            "/jewellery/jewellery-mens.png",
            "/jewellery/jewellery-rings.png",
            "/jewellery/jewellery-hero.png",
            "/jewellery/jewellery-bangles.jpg"
        ]
    }'::jsonb,
    false
),

-- ── 10. CHAINS (Piece 1: Men) ─────────────────────────────────────────────────
(
    'heritage-gold-rope-chain',
    'Heritage 22K Gold Twisted Rope Chain',
    '22K Yellow Gold',
    'Classic 22-inch twisted rope gold chain crafted with dense weight, diamond-cut link facets, and a secure traditional S-hook clasp. BIS 916 certified.',
    '/jewellery/jewellery-hero.png',
    ARRAY[
        '/jewellery/jewellery-hero.png',
        '/jewellery/jewellery-mens.png',
        '/jewellery/jewellery-necklace.jpg',
        '/jewellery/jewellery-rings.png'
    ],
    88000, 88000, 'fixed', 'available', 10,
    '{
        "material": "22K Yellow Gold (BIS 916 Hallmarked)",
        "finishing": "Diamond-Cut Twisted Facets",
        "length": "22 inches (55.8 cm)",
        "width": "4.5 mm link gauge",
        "thickness": "3 mm",
        "gemstone": "None",
        "ring_size": "N/A",
        "ring_sizes": [],
        "stock": "In Stock (10 units available)",
        "category": "men",
        "gender": "men",
        "subcategory": "Chains",
        "gallery_images": [
            "/jewellery/jewellery-hero.png",
            "/jewellery/jewellery-mens.png",
            "/jewellery/jewellery-necklace.jpg",
            "/jewellery/jewellery-rings.png"
        ]
    }'::jsonb,
    true
),

-- ── 11. CHAINS (Piece 2: Women) ───────────────────────────────────────────────
(
    'delicate-gold-bead-chain',
    'Imperial 18K Gold Bead & Link Chain',
    '18K Yellow Gold',
    'Delicate alternating faceted beads and hand-interlinked gold chains designed for daily wear or pairing with luxury Kundan pendants.',
    '/jewellery/jewellery-necklace.jpg',
    ARRAY[
        '/jewellery/jewellery-necklace.jpg',
        '/jewellery/jewellery-hero.png',
        '/jewellery/jewellery-rings.png',
        '/jewellery/jewellery-bangles.jpg'
    ],
    36500, 36500, 'fixed', 'available', 16,
    '{
        "material": "18K Yellow Gold",
        "finishing": "Faceted Sparkle Beads with Lobster Clasp",
        "length": "18 inches (45.7 cm)",
        "width": "2.2 mm bead gauge",
        "thickness": "2.2 mm",
        "gemstone": "None",
        "ring_size": "N/A",
        "ring_sizes": [],
        "stock": "In Stock (16 units available)",
        "category": "women",
        "gender": "women",
        "subcategory": "Chains",
        "gallery_images": [
            "/jewellery/jewellery-necklace.jpg",
            "/jewellery/jewellery-hero.png",
            "/jewellery/jewellery-rings.png",
            "/jewellery/jewellery-bangles.jpg"
        ]
    }'::jsonb,
    false
),

-- ── 12. CHAINS (Piece 3: Unisex) ──────────────────────────────────────────────
(
    'unisex-oxidized-silver-curb-chain',
    'Royal Oxidized Silver Curb Chain',
    '925 Sterling Silver',
    'Heavy-weight unisex curb chain finished in an antique oxidized patina with hand-carved dragon-head terminal finials.',
    '/jewellery/jewellery-mens.png',
    ARRAY[
        '/jewellery/jewellery-mens.png',
        '/jewellery/jewellery-hero.png',
        '/jewellery/jewellery-rings.png',
        '/jewellery/jewellery-bangles.jpg'
    ],
    9500, 9500, 'fixed', 'available', 22,
    '{
        "material": "925 Sterling Silver",
        "finishing": "Vintage Oxidized Patina",
        "length": "24 inches (61 cm)",
        "width": "6 mm curb link",
        "thickness": "3 mm",
        "gemstone": "None",
        "ring_size": "N/A",
        "ring_sizes": [],
        "stock": "In Stock (22 units available)",
        "category": "unisex",
        "gender": "unisex",
        "subcategory": "Chains",
        "gallery_images": [
            "/jewellery/jewellery-mens.png",
            "/jewellery/jewellery-hero.png",
            "/jewellery/jewellery-rings.png",
            "/jewellery/jewellery-bangles.jpg"
        ]
    }'::jsonb,
    false
),

-- ── 13. BRACELETS & KADAS (Piece 1: Men) ───────────────────────────────────────
(
    'mens-royal-rajput-gold-kada',
    'Men''s Royal Rajput Solid Gold Kada',
    '22K Yellow Gold',
    'Majestic Rajputana kada with sculpted lion-head terminal finials, hand-carved from solid 22-karat certified gold with ruby eye accents.',
    '/jewellery/jewellery-mens.png',
    ARRAY[
        '/jewellery/jewellery-mens.png',
        '/jewellery/jewellery-hero.png',
        '/jewellery/jewellery-bangles.jpg',
        '/jewellery/jewellery-necklace.jpg'
    ],
    165000, 165000, 'fixed', 'available', 6,
    '{
        "material": "22K Yellow Gold (BIS 916 Hallmarked)",
        "finishing": "Hand-Chiseled Lion Terminals with Solid Core",
        "length": "Inner Circumference: 7.5 inches (19 cm)",
        "width": "12 mm body width",
        "thickness": "6 mm solid round",
        "gemstone": "Natural Cabochon Rubies in Finial Eyes",
        "ring_size": "N/A",
        "ring_sizes": [],
        "stock": "In Stock (6 units available)",
        "category": "men",
        "gender": "men",
        "subcategory": "Kadas",
        "gallery_images": [
            "/jewellery/jewellery-mens.png",
            "/jewellery/jewellery-hero.png",
            "/jewellery/jewellery-bangles.jpg",
            "/jewellery/jewellery-necklace.jpg"
        ]
    }'::jsonb,
    true
),

-- ── 14. BRACELETS & KADAS (Piece 2: Women) ─────────────────────────────────────
(
    'kundan-polki-flexible-cuff-bracelet',
    'Maharani Kundan & Pearl Cuff Bracelet',
    '22K Yellow Gold',
    'Elaborate bridal cuff bracelet woven with natural Basra pearls and uncut Polki diamonds in traditional Jaipur jadau foil setting.',
    '/jewellery/jewellery-bangles.jpg',
    ARRAY[
        '/jewellery/jewellery-bangles.jpg',
        '/jewellery/jewellery-rings.png',
        '/jewellery/jewellery-hero.png',
        '/jewellery/jewellery-necklace.jpg'
    ],
    92000, 92000, 'fixed', 'available', 8,
    '{
        "material": "22K Yellow Gold & Natural Basra Pearls",
        "finishing": "Openable Screw Clasp with Safety Chain",
        "length": "Inner Diameter: 2.4 / 2.6 inches available",
        "width": "18 mm cuff width",
        "thickness": "4 mm",
        "gemstone": "Uncut Polki Diamonds, Basra Pearls, Emerald Beads",
        "ring_size": "N/A",
        "ring_sizes": [],
        "stock": "In Stock (8 units available)",
        "category": "women",
        "gender": "women",
        "subcategory": "Bracelets",
        "gallery_images": [
            "/jewellery/jewellery-bangles.jpg",
            "/jewellery/jewellery-rings.png",
            "/jewellery/jewellery-hero.png",
            "/jewellery/jewellery-necklace.jpg"
        ]
    }'::jsonb,
    true
),

-- ── 15. BRACELETS & KADAS (Piece 3: Unisex) ───────────────────────────────────
(
    'unisex-silver-woven-link-bracelet',
    'Jaipur Artisan Silver Woven Link Bracelet',
    '925 Sterling Silver',
    'Artisanal hand-woven flexible silver mesh bracelet with double safety side-clasps and polished rhodium finish.',
    '/jewellery/jewellery-hero.png',
    ARRAY[
        '/jewellery/jewellery-hero.png',
        '/jewellery/jewellery-mens.png',
        '/jewellery/jewellery-rings.png',
        '/jewellery/jewellery-bangles.jpg'
    ],
    8200, 8200, 'fixed', 'available', 20,
    '{
        "material": "925 Sterling Silver",
        "finishing": "Hand-Polished High-Luster Rhodium",
        "length": "8 inches (20.3 cm)",
        "width": "9 mm flat mesh",
        "thickness": "3 mm",
        "gemstone": "None",
        "ring_size": "N/A",
        "ring_sizes": [],
        "stock": "In Stock (20 units available)",
        "category": "unisex",
        "gender": "unisex",
        "subcategory": "Bracelets",
        "gallery_images": [
            "/jewellery/jewellery-hero.png",
            "/jewellery/jewellery-mens.png",
            "/jewellery/jewellery-rings.png",
            "/jewellery/jewellery-bangles.jpg"
        ]
    }'::jsonb,
    false
),

-- ── 16. NECKLACES & CHOKERS (Piece 1: Women) ──────────────────────────────────
(
    'royal-kundan-polki-bridal-choker-necklace',
    'Royal Kundan & Polki Bridal Choker Set',
    '22K Yellow Gold',
    'Magnificent bridal masterpiece featuring graduated Polki diamond clusters, natural Zambian emerald drops, and complete reverse royal Meenakari enamelling. Includes matching earrings.',
    '/jewellery/jewellery-necklace.jpg',
    ARRAY[
        '/jewellery/jewellery-necklace.jpg',
        '/jewellery/jewellery-hero.png',
        '/jewellery/jewellery-bangles.jpg',
        '/jewellery/jewellery-rings.png'
    ],
    285000, 285000, 'fixed', 'available', 4,
    '{
        "material": "22K Gold (BIS 916 Certified)",
        "finishing": "Traditional Jaipur Jadau & Reversible Meenakari",
        "length": "Adjustable Zari Dori (14 - 18 inches)",
        "width": "42 mm centerpiece depth",
        "thickness": "6 mm",
        "gemstone": "Uncut Polki Diamonds, Zambian Emerald Drops, Natural Pearls",
        "ring_size": "N/A",
        "ring_sizes": [],
        "stock": "In Stock (4 sets available)",
        "category": "women",
        "gender": "women",
        "subcategory": "Necklaces",
        "gallery_images": [
            "/jewellery/jewellery-necklace.jpg",
            "/jewellery/jewellery-hero.png",
            "/jewellery/jewellery-bangles.jpg",
            "/jewellery/jewellery-rings.png"
        ]
    }'::jsonb,
    true
),

-- ── 17. NECKLACES & CHOKERS (Piece 2: Women) ──────────────────────────────────
(
    'padmavati-jadau-hasli-collar-necklace',
    'Padmavati Jadau Hasli Collar Necklace',
    '22K Yellow Gold',
    'Rigid torque hasli collar necklace inspired by historic Mewar royal queens, inlaid with uncut Polki stones and carved ruby blossoms.',
    '/jewellery/jewellery-hero.png',
    ARRAY[
        '/jewellery/jewellery-hero.png',
        '/jewellery/jewellery-necklace.jpg',
        '/jewellery/jewellery-bangles.jpg',
        '/jewellery/jewellery-rings.png'
    ],
    195000, 195000, 'fixed', 'available', 5,
    '{
        "material": "22K Yellow Gold",
        "finishing": "Hand-Hammered Solid Hasli Torque",
        "length": "Inner Diameter: 4.8 inches (Rigid Collar)",
        "width": "16 mm collar band",
        "thickness": "5 mm",
        "gemstone": "Natural Polki Diamonds & Carved Ruby Leaves",
        "ring_size": "N/A",
        "ring_sizes": [],
        "stock": "In Stock (5 units available)",
        "category": "women",
        "gender": "women",
        "subcategory": "Necklaces",
        "gallery_images": [
            "/jewellery/jewellery-hero.png",
            "/jewellery/jewellery-necklace.jpg",
            "/jewellery/jewellery-bangles.jpg",
            "/jewellery/jewellery-rings.png"
        ]
    }'::jsonb,
    true
),

-- ── 18. NECKLACES & CHOKERS (Piece 3: Unisex) ─────────────────────────────────
(
    'jaipur-filigree-gold-pendant-necklace',
    'Jaipur Royal Filigree Chain Necklace',
    '18K Yellow Gold',
    'Intricate hand-drawn gold filigree chain with central sun medallion suitable for both men and women on formal traditional occasions.',
    '/jewellery/jewellery-rings.png',
    ARRAY[
        '/jewellery/jewellery-rings.png',
        '/jewellery/jewellery-necklace.jpg',
        '/jewellery/jewellery-hero.png',
        '/jewellery/jewellery-mens.png'
    ],
    68000, 68000, 'fixed', 'available', 11,
    '{
        "material": "18K Yellow Gold",
        "finishing": "Hand-Drawn Wire Filigree",
        "length": "20 inches (50.8 cm)",
        "width": "28 mm medallion",
        "thickness": "3 mm",
        "gemstone": "Single Natural Center Diamond",
        "ring_size": "N/A",
        "ring_sizes": [],
        "stock": "In Stock (11 units available)",
        "category": "unisex",
        "gender": "unisex",
        "subcategory": "Necklaces",
        "gallery_images": [
            "/jewellery/jewellery-rings.png",
            "/jewellery/jewellery-necklace.jpg",
            "/jewellery/jewellery-hero.png",
            "/jewellery/jewellery-mens.png"
        ]
    }'::jsonb,
    false
),

-- ── 19. EARRINGS & JHUMKAS (Piece 1: Women) ───────────────────────────────────
(
    'maharani-heritage-chandbali-earrings',
    'Maharani Kundan Chandbali Jhumkas',
    '22K Yellow Gold',
    'Iconic crescent moon earrings fringed with seed pearls, pigeon-blood ruby beads, and dense uncut Polki diamond settings.',
    '/jewellery/jewellery-rings.png',
    ARRAY[
        '/jewellery/jewellery-rings.png',
        '/jewellery/jewellery-necklace.jpg',
        '/jewellery/jewellery-bangles.jpg',
        '/jewellery/jewellery-hero.png'
    ],
    62000, 62000, 'fixed', 'available', 14,
    '{
        "material": "22K Yellow Gold (BIS 916)",
        "finishing": "Hand-Set Kundan Foil & Seed Pearl Tassels",
        "length": "72 mm total drop",
        "width": "40 mm chandbali crescent",
        "thickness": "4 mm",
        "gemstone": "Polki Diamonds, Pigeon Blood Rubies, Pearls",
        "ring_size": "N/A",
        "ring_sizes": [],
        "stock": "In Stock (14 pairs available)",
        "category": "women",
        "gender": "women",
        "subcategory": "Earrings",
        "gallery_images": [
            "/jewellery/jewellery-rings.png",
            "/jewellery/jewellery-necklace.jpg",
            "/jewellery/jewellery-bangles.jpg",
            "/jewellery/jewellery-hero.png"
        ]
    }'::jsonb,
    true
),

-- ── 20. EARRINGS & JHUMKAS (Piece 2: Women) ───────────────────────────────────
(
    'polki-teardrop-dangler-earrings',
    'Jaipur Polki Teardrop Dangler Earrings',
    '18K Yellow Gold',
    'Modern articulated dangler earrings featuring pear-shaped uncut Polki diamonds and dangling emerald bead droplets.',
    '/jewellery/jewellery-necklace.jpg',
    ARRAY[
        '/jewellery/jewellery-necklace.jpg',
        '/jewellery/jewellery-rings.png',
        '/jewellery/jewellery-hero.png',
        '/jewellery/jewellery-bangles.jpg'
    ],
    45000, 45000, 'fixed', 'available', 16,
    '{
        "material": "18K Yellow Gold",
        "finishing": "Lightweight Articulated Drop",
        "length": "48 mm drop",
        "width": "15 mm width",
        "thickness": "3 mm",
        "gemstone": "Natural Polki Diamonds & Zambian Emeralds",
        "ring_size": "N/A",
        "ring_sizes": [],
        "stock": "In Stock (16 pairs available)",
        "category": "women",
        "gender": "women",
        "subcategory": "Earrings",
        "gallery_images": [
            "/jewellery/jewellery-necklace.jpg",
            "/jewellery/jewellery-rings.png",
            "/jewellery/jewellery-hero.png",
            "/jewellery/jewellery-bangles.jpg"
        ]
    }'::jsonb,
    false
),

-- ── 21. EARRINGS & JHUMKAS (Piece 3: Women) ───────────────────────────────────
(
    'classic-temple-jhumka-in-22k-gold',
    'Classic Temple Jhumka in 22K Gold',
    '22K Yellow Gold',
    'Authentic South Rajasthan temple bell jhumkas with micro-granulation dome and cascading solid gold bead tassels.',
    '/jewellery/jewellery-hero.png',
    ARRAY[
        '/jewellery/jewellery-hero.png',
        '/jewellery/jewellery-necklace.jpg',
        '/jewellery/jewellery-rings.png',
        '/jewellery/jewellery-bangles.jpg'
    ],
    58000, 58000, 'fixed', 'available', 10,
    '{
        "material": "22K Yellow Gold (BIS 916 Hallmarked)",
        "finishing": "Granulated Antique Matte Finish",
        "length": "55 mm drop",
        "width": "25 mm bell diameter",
        "thickness": "18 mm depth",
        "gemstone": "Ruby Cabochon Stud",
        "ring_size": "N/A",
        "ring_sizes": [],
        "stock": "In Stock (10 pairs available)",
        "category": "women",
        "gender": "women",
        "subcategory": "Earrings",
        "gallery_images": [
            "/jewellery/jewellery-hero.png",
            "/jewellery/jewellery-necklace.jpg",
            "/jewellery/jewellery-rings.png",
            "/jewellery/jewellery-bangles.jpg"
        ]
    }'::jsonb,
    true
),

-- ── 22. BANGLES (Piece 1: Women) ──────────────────────────────────────────────
(
    'royal-gold-filigree-kangan-bangle-pair',
    'Royal 22K Gold Filigree Kangan (Pair)',
    '22K Yellow Gold',
    'Pair of matching openable bridal bangles decorated with delicate gold wire filigree work, floral motifs, and secure screw closures.',
    '/jewellery/jewellery-bangles.jpg',
    ARRAY[
        '/jewellery/jewellery-bangles.jpg',
        '/jewellery/jewellery-hero.png',
        '/jewellery/jewellery-necklace.jpg',
        '/jewellery/jewellery-rings.png'
    ],
    138000, 138000, 'fixed', 'available', 8,
    '{
        "material": "22K Yellow Gold (BIS 916 Hallmarked)",
        "finishing": "Micro-Granulation & Hand-Drawn Wire Filigree",
        "length": "Sizes: 2.4, 2.6, 2.8 available",
        "width": "12 mm each bangle",
        "thickness": "4 mm solid wall",
        "gemstone": "None (Pure Solid Gold)",
        "ring_size": "N/A",
        "ring_sizes": [],
        "stock": "In Stock (8 pairs available)",
        "category": "women",
        "gender": "women",
        "subcategory": "Bangles",
        "gallery_images": [
            "/jewellery/jewellery-bangles.jpg",
            "/jewellery/jewellery-hero.png",
            "/jewellery/jewellery-necklace.jpg",
            "/jewellery/jewellery-rings.png"
        ]
    }'::jsonb,
    true
),

-- ── 23. BANGLES (Piece 2: Women) ──────────────────────────────────────────────
(
    'pachheli-jadau-gemstone-bangles',
    'Pachheli Jadau Gemstone Bangles (Pair)',
    '22K Yellow Gold',
    'Traditional heavy Rajasthani Pachheli bangles featuring scalloped petal borders set with uncut Polki diamonds and rubies.',
    '/jewellery/jewellery-bangles.jpg',
    ARRAY[
        '/jewellery/jewellery-bangles.jpg',
        '/jewellery/jewellery-necklace.jpg',
        '/jewellery/jewellery-hero.png',
        '/jewellery/jewellery-rings.png'
    ],
    155000, 155000, 'fixed', 'available', 5,
    '{
        "material": "22K Yellow Gold",
        "finishing": "Scalloped Jadau Cluster Setting",
        "length": "Sizes: 2.4, 2.6 available",
        "width": "15 mm each",
        "thickness": "5 mm",
        "gemstone": "Polki Diamonds, Rubies & Pearls",
        "ring_size": "N/A",
        "ring_sizes": [],
        "stock": "In Stock (5 pairs available)",
        "category": "women",
        "gender": "women",
        "subcategory": "Bangles",
        "gallery_images": [
            "/jewellery/jewellery-bangles.jpg",
            "/jewellery/jewellery-necklace.jpg",
            "/jewellery/jewellery-hero.png",
            "/jewellery/jewellery-rings.png"
        ]
    }'::jsonb,
    true
),

-- ── 24. BANGLES (Piece 3: Unisex) ─────────────────────────────────────────────
(
    'antique-silver-tribal-kada-bangle',
    'Antique Sterling Silver Tribal Kada Bangle',
    '925 Sterling Silver',
    'Solid sterling silver torque bangle with hand-engraved peacock heads and rope twist pattern, suitable for men and women.',
    '/jewellery/jewellery-mens.png',
    ARRAY[
        '/jewellery/jewellery-mens.png',
        '/jewellery/jewellery-bangles.jpg',
        '/jewellery/jewellery-hero.png',
        '/jewellery/jewellery-rings.png'
    ],
    12500, 12500, 'fixed', 'available', 15,
    '{
        "material": "925 Sterling Silver",
        "finishing": "Heavy Antique Tribal Oxidized Finish",
        "length": "Inner Diameter: 2.6 inches (Adjustable torque)",
        "width": "10 mm",
        "thickness": "5 mm",
        "gemstone": "None",
        "ring_size": "N/A",
        "ring_sizes": [],
        "stock": "In Stock (15 units available)",
        "category": "unisex",
        "gender": "unisex",
        "subcategory": "Bangles",
        "gallery_images": [
            "/jewellery/jewellery-mens.png",
            "/jewellery/jewellery-bangles.jpg",
            "/jewellery/jewellery-hero.png",
            "/jewellery/jewellery-rings.png"
        ]
    }'::jsonb,
    false
),

-- ── 25. PENDANTS (Piece 1: Unisex) ────────────────────────────────────────────
(
    'imperial-navratna-gemstone-pendant',
    'Imperial Navratna Royal Medallion Pendant',
    '18K Yellow Gold',
    'Sacred nine-gemstone astrological medallion set with certified Ruby, Diamond, Blue Sapphire, Yellow Sapphire, Emerald, Pearl, Coral, Hessonite, and Cat''s Eye.',
    '/jewellery/jewellery-rings.png',
    ARRAY[
        '/jewellery/jewellery-rings.png',
        '/jewellery/jewellery-hero.png',
        '/jewellery/jewellery-necklace.jpg',
        '/jewellery/jewellery-mens.png'
    ],
    48500, 48500, 'fixed', 'available', 12,
    '{
        "material": "18K Yellow Gold",
        "finishing": "Sunburst Bezel Setting with Heavy Bail",
        "length": "35 mm drop with bail",
        "width": "26 mm circular diameter",
        "thickness": "3 mm",
        "gemstone": "Certified Navratna (9 Natural Planetary Gemstones)",
        "ring_size": "N/A",
        "ring_sizes": [],
        "stock": "In Stock (12 units available)",
        "category": "unisex",
        "gender": "unisex",
        "subcategory": "Pendants",
        "gallery_images": [
            "/jewellery/jewellery-rings.png",
            "/jewellery/jewellery-hero.png",
            "/jewellery/jewellery-necklace.jpg",
            "/jewellery/jewellery-mens.png"
        ]
    }'::jsonb,
    false
),

-- ── 26. PENDANTS (Piece 2: Men) ───────────────────────────────────────────────
(
    'royal-rajputana-sword-shield-gold-pendant',
    'Royal Rajputana Sword & Shield Gold Pendant',
    '22K Yellow Gold',
    'Men''s regal talisman pendant featuring crossed Rajput talwars (swords) and royal sun shield hand-cast in heavy solid 22K gold.',
    '/jewellery/jewellery-mens.png',
    ARRAY[
        '/jewellery/jewellery-mens.png',
        '/jewellery/jewellery-hero.png',
        '/jewellery/jewellery-rings.png',
        '/jewellery/jewellery-necklace.jpg'
    ],
    32000, 32000, 'fixed', 'available', 14,
    '{
        "material": "22K Yellow Gold",
        "finishing": "Dual Satin & Diamond-Cut Edge",
        "length": "42 mm total drop",
        "width": "24 mm shield width",
        "thickness": "3 mm solid",
        "gemstone": "Natural Ruby in Shield Center",
        "ring_size": "N/A",
        "ring_sizes": [],
        "stock": "In Stock (14 units available)",
        "category": "men",
        "gender": "men",
        "subcategory": "Pendants",
        "gallery_images": [
            "/jewellery/jewellery-mens.png",
            "/jewellery/jewellery-hero.png",
            "/jewellery/jewellery-rings.png",
            "/jewellery/jewellery-necklace.jpg"
        ]
    }'::jsonb,
    true
),

-- ── 27. PENDANTS (Piece 3: Women) ─────────────────────────────────────────────
(
    'lotus-polki-diamond-spiritual-locket',
    'Lotus Polki Diamond Spiritual Locket',
    '18K Yellow Gold',
    'Sacred eight-petal blooming lotus locket inlaid with luminous Polki diamonds, opening to store sacred sandalwood or protective blessings.',
    '/jewellery/jewellery-necklace.jpg',
    ARRAY[
        '/jewellery/jewellery-necklace.jpg',
        '/jewellery/jewellery-rings.png',
        '/jewellery/jewellery-hero.png',
        '/jewellery/jewellery-bangles.jpg'
    ],
    41000, 41000, 'fixed', 'available', 10,
    '{
        "material": "18K Yellow Gold",
        "finishing": "Openable Locket Compartment with Click-Latch",
        "length": "38 mm drop",
        "width": "22 mm lotus width",
        "thickness": "5 mm locket depth",
        "gemstone": "Natural Polki Diamonds & Pink Tourmaline",
        "ring_size": "N/A",
        "ring_sizes": [],
        "stock": "In Stock (10 units available)",
        "category": "women",
        "gender": "women",
        "subcategory": "Pendants",
        "gallery_images": [
            "/jewellery/jewellery-necklace.jpg",
            "/jewellery/jewellery-rings.png",
            "/jewellery/jewellery-hero.png",
            "/jewellery/jewellery-bangles.jpg"
        ]
    }'::jsonb,
    false
)
ON CONFLICT (slug) DO UPDATE
SET 
    title = EXCLUDED.title,
    price = EXCLUDED.price,
    display_price = EXCLUDED.display_price,
    price_display = EXCLUDED.price_display,
    medium = EXCLUDED.medium,
    story = EXCLUDED.story,
    metadata = EXCLUDED.metadata,
    primary_image_url = EXCLUDED.primary_image_url,
    gallery_image_urls = EXCLUDED.gallery_image_urls,
    stock_quantity = EXCLUDED.stock_quantity,
    availability = EXCLUDED.availability;

-- ==============================================================================
-- COMPLETE! All tables, policies, and 27+ jewellery items ready in Supabase.
-- ==============================================================================
