-- Complete Database Schema and Seed Data for Kalaneri Art Gallery
-- Run this script in your Supabase Dashboard -> SQL Editor

-- 1. Enums
DO $$ BEGIN
    CREATE TYPE public.price_display AS ENUM ('range','on_request','fixed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.availability AS ENUM ('available','reserved','sold','not_for_sale');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.journal_type AS ENUM ('exhibition','press','interview','guide');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.inquiry_status AS ENUM ('new','contacted','closed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 1.5 Clean reset of existing tables (prevents foreign key conflicts)
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.cart_items CASCADE;
DROP TABLE IF EXISTS public.wishlist_items CASCADE;
DROP TABLE IF EXISTS public.inquiries CASCADE;
DROP TABLE IF EXISTS public.artworks CASCADE;
DROP TABLE IF EXISTS public.artists CASCADE;
DROP TABLE IF EXISTS public.exhibitions CASCADE;
DROP TABLE IF EXISTS public.journal_entries CASCADE;
DROP TABLE IF EXISTS public.press_mentions CASCADE;
DROP TABLE IF EXISTS public.commissioned_samples CASCADE;
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.newsletter_subscribers CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. Artists
CREATE TABLE IF NOT EXISTS public.artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  nationality_origin TEXT,
  birth_year INT,
  practice_statement TEXT,
  bio TEXT,
  mediums TEXT[] DEFAULT '{}',
  movements TEXT[] DEFAULT '{}',
  portrait_image_url TEXT,
  social_links JSONB DEFAULT '{}'::jsonb,
  featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.artists TO anon, authenticated;
GRANT ALL ON public.artists TO service_role;
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read artists" ON public.artists;
CREATE POLICY "Public read artists" ON public.artists FOR SELECT USING (true);

-- 3. Artworks
CREATE TABLE IF NOT EXISTS public.artworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  medium TEXT,
  movement_tags TEXT[] DEFAULT '{}',
  year_created INT,
  dimensions TEXT,
  primary_image_url TEXT,
  gallery_image_urls TEXT[] DEFAULT '{}',
  story TEXT,
  authenticity_notes TEXT,
  price_min NUMERIC,
  price_max NUMERIC,
  price_display public.price_display NOT NULL DEFAULT 'on_request',
  availability public.availability NOT NULL DEFAULT 'available',
  origin_country TEXT DEFAULT 'India',
  display_price NUMERIC,
  featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.artworks TO anon, authenticated;
GRANT ALL ON public.artworks TO service_role;
ALTER TABLE public.artworks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read artworks" ON public.artworks;
CREATE POLICY "Public read artworks" ON public.artworks FOR SELECT USING (true);

-- 4. Journal entries
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  type public.journal_type NOT NULL,
  title TEXT NOT NULL,
  cover_image_url TEXT,
  body TEXT,
  related_artist_ids UUID[] DEFAULT '{}',
  related_artwork_ids UUID[] DEFAULT '{}',
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.journal_entries TO anon, authenticated;
GRANT ALL ON public.journal_entries TO service_role;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read journal" ON public.journal_entries;
CREATE POLICY "Public read journal" ON public.journal_entries FOR SELECT USING (published_at <= now());

-- 5. Inquiries
CREATE TABLE IF NOT EXISTS public.inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artwork_id UUID REFERENCES public.artworks(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  source_page TEXT,
  type TEXT NOT NULL DEFAULT 'general',
  status public.inquiry_status NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.inquiries TO anon, authenticated;
GRANT ALL ON public.inquiries TO service_role;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can submit inquiries" ON public.inquiries;
CREATE POLICY "Anyone can submit inquiries" ON public.inquiries
  FOR INSERT WITH CHECK (
    length(name) BETWEEN 1 AND 120
    AND length(email) BETWEEN 3 AND 254
    AND email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND length(message) BETWEEN 1 AND 4000
    AND (phone IS NULL OR length(phone) <= 40)
    AND (source_page IS NULL OR length(source_page) <= 200)
    AND status = 'new'
  );

-- 6. Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Cart
CREATE TABLE IF NOT EXISTS public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artwork_id uuid NOT NULL REFERENCES public.artworks(id) ON DELETE CASCADE,
  reserved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, artwork_id)
);
GRANT SELECT, INSERT, DELETE ON public.cart_items TO authenticated;
GRANT ALL ON public.cart_items TO service_role;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own cart" ON public.cart_items;
CREATE POLICY "Users read own cart" ON public.cart_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users add own cart" ON public.cart_items;
CREATE POLICY "Users add own cart" ON public.cart_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users remove own cart" ON public.cart_items;
CREATE POLICY "Users remove own cart" ON public.cart_items FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 8. Wishlist
CREATE TABLE IF NOT EXISTS public.wishlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artwork_id uuid NOT NULL REFERENCES public.artworks(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, artwork_id)
);
GRANT SELECT, INSERT, DELETE ON public.wishlist_items TO authenticated;
GRANT ALL ON public.wishlist_items TO service_role;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own wishlist" ON public.wishlist_items;
CREATE POLICY "Users read own wishlist" ON public.wishlist_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users add own wishlist" ON public.wishlist_items;
CREATE POLICY "Users add own wishlist" ON public.wishlist_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users remove own wishlist" ON public.wishlist_items;
CREATE POLICY "Users remove own wishlist" ON public.wishlist_items FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 9. Exhibitions
CREATE TABLE IF NOT EXISTS public.exhibitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'upcoming',
  start_date date,
  end_date date,
  cover_image_url text,
  description text,
  catalogue_url text,
  featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.exhibitions TO anon, authenticated;
GRANT ALL ON public.exhibitions TO service_role;
ALTER TABLE public.exhibitions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Exhibitions are public" ON public.exhibitions;
CREATE POLICY "Exhibitions are public" ON public.exhibitions FOR SELECT USING (true);

-- 10. Press Mentions
CREATE TABLE IF NOT EXISTS public.press_mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publication text NOT NULL,
  title text NOT NULL,
  excerpt text,
  external_url text,
  logo_url text,
  published_at date,
  featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.press_mentions TO anon, authenticated;
GRANT ALL ON public.press_mentions TO service_role;
ALTER TABLE public.press_mentions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Press mentions are public" ON public.press_mentions;
CREATE POLICY "Press mentions are public" ON public.press_mentions FOR SELECT USING (true);

-- 10.5 Commissioned Samples
CREATE TABLE IF NOT EXISTS public.commissioned_samples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  artist_name text,
  image_url text,
  description text,
  year_completed integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.commissioned_samples TO anon, authenticated;
GRANT ALL ON public.commissioned_samples TO service_role;
ALTER TABLE public.commissioned_samples ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Commissioned samples are public" ON public.commissioned_samples;
CREATE POLICY "Commissioned samples are public" ON public.commissioned_samples FOR SELECT USING (true);

-- 11. Appointments
CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  slot_start timestamptz NOT NULL,
  slot_end timestamptz,
  party_size integer DEFAULT 1,
  notes text,
  status text NOT NULL DEFAULT 'requested',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.appointments TO anon, authenticated;
GRANT ALL ON public.appointments TO service_role;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone may request an appointment" ON public.appointments;
CREATE POLICY "Anyone may request an appointment" ON public.appointments FOR INSERT WITH CHECK (true);

-- 12. Newsletter Subscribers
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  source text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.newsletter_subscribers TO anon, authenticated;
GRANT SELECT ON public.newsletter_subscribers TO authenticated;
GRANT ALL ON public.newsletter_subscribers TO service_role;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone may subscribe" ON public.newsletter_subscribers;
CREATE POLICY "Anyone may subscribe" ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admins read subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Admins read subscribers" ON public.newsletter_subscribers FOR SELECT TO authenticated USING (public.is_admin());

-- 13. Orders
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'inquiry_sent',
  shipping_name text,
  shipping_email text,
  shipping_address text,
  shipping_city text,
  shipping_country text,
  shipping_postal text,
  subtotal numeric,
  shipping_cost numeric,
  tax_cost numeric,
  total numeric,
  currency text NOT NULL DEFAULT 'INR',
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners select own orders" ON public.orders;
CREATE POLICY "Owners select own orders" ON public.orders FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Owners insert own orders" ON public.orders;
CREATE POLICY "Owners insert own orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Owners update own orders" ON public.orders;
CREATE POLICY "Owners update own orders" ON public.orders FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- 14. Admin RLS Policies
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

DROP POLICY IF EXISTS "Admins manage orders" ON public.orders;
CREATE POLICY "Admins manage orders" ON public.orders FOR ALL TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "Admins manage inquiries" ON public.inquiries;
CREATE POLICY "Admins manage inquiries" ON public.inquiries FOR ALL TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "Admins manage artworks" ON public.artworks;
CREATE POLICY "Admins manage artworks" ON public.artworks FOR ALL TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "Admins manage artists" ON public.artists;
CREATE POLICY "Admins manage artists" ON public.artists FOR ALL TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "Admins manage exhibitions" ON public.exhibitions;
CREATE POLICY "Admins manage exhibitions" ON public.exhibitions FOR ALL TO authenticated USING (public.is_admin());

-- 15. COMPLETE SEED DATA (Artists, Artworks, Exhibitions, Journal, Press, Samples)

-- Artists
INSERT INTO public.artists (id, slug, name, nationality_origin, birth_year, practice_statement, bio, mediums, movements, portrait_image_url, social_links, featured) VALUES (
  '8b17e33b-d55e-4521-a857-7117196a2c5a', 'vikram-mehta', 'Vikram Mehta', 'Indian, based in Jaipur', 1978, 'Painting the city as a memory palace — every archway a doorway into the archive of a place.', 'Vikram Mehta trained at the Faculty of Fine Arts, MSU Baroda, before returning to Rajasthan in 2004. His large-format paintings translate the geometry of Mughal and Rajput architecture into contemporary abstraction. Represented by Kalaneri since 2011.', '{"Painting","Works on Paper"}'::text[], '{"Contemporary Indian","Neo-Miniature"}'::text[], '/artists/portrait-vikram-mehta.jpg', '{"website":"https://kalaneri.art","instagram":"https://instagram.com/kalaneri"}'::jsonb, true
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.artists (id, slug, name, nationality_origin, birth_year, practice_statement, bio, mediums, movements, portrait_image_url, social_links, featured) VALUES (
  'f27934b8-70d8-4031-bf03-e25175b80f1a', 'leela-krishnan', 'Leela Krishnan', 'Indian, based in Kochi', 1984, 'Bronze and terracotta as memory-carriers — small gods, quiet altars, and the domestic sublime.', 'Leela Krishnan sculpts in bronze, terracotta, and reclaimed teak. Her work draws on the votive traditions of Kerala''s coastal shrines while sitting comfortably in a contemporary drawing room. First solo at Kalaneri in 2015.', '{"Sculpture","Mixed Media"}'::text[], '{"Contemporary Indian","Post-Craft"}'::text[], '/artists/portrait-leela-krishnan.jpg', '{"instagram":"https://instagram.com/kalaneri"}'::jsonb, true
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.artists (id, slug, name, nationality_origin, birth_year, practice_statement, bio, mediums, movements, portrait_image_url, social_links, featured) VALUES (
  'bbbb3df0-82a3-400c-b7ba-9acda34f4e1b', 'arjun-desai', 'Arjun Desai', 'Indian, based in Mumbai', 1972, 'Photography as inventory — the disappearing textures of the Indian street, held still for a beat.', 'Arjun Desai is a photographer working primarily in medium format. His long-running series on Bombay''s Art Deco facades has been exhibited at Serendipity Arts Festival and Photo Kathmandu. Prints are editioned to fives and sevens, always signed.', '{"Photography"}'::text[], '{"Documentary","Urban Archive"}'::text[], '/artists/portrait-arjun-desai.jpg', '{"website":"https://kalaneri.art","instagram":"https://instagram.com/kalaneri"}'::jsonb, true
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.artists (id, slug, name, nationality_origin, birth_year, practice_statement, bio, mediums, movements, portrait_image_url, social_links, featured) VALUES (
  '84aae12b-53e2-4cc8-9270-a2b3a8aa1248', 'nisha-varma', 'Nisha Varma', 'Indian, based in Delhi', 1989, 'Works on paper about weather — how monsoon light rearranges a room.', 'Nisha Varma works in ink, gouache, and Wasli paper. Trained under the last living master of the Jaipur miniature school before pursuing an MFA at SAIC, Chicago. Her practice sits at the seam between traditional pigment craft and abstract mark-making.', '{"Works on Paper","Painting"}'::text[], '{"Contemporary Indian","Neo-Miniature"}'::text[], '/artists/portrait-nisha-varma.jpg', '{"instagram":"https://instagram.com/kalaneri"}'::jsonb, true
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.artists (id, slug, name, nationality_origin, birth_year, practice_statement, bio, mediums, movements, portrait_image_url, social_links, featured) VALUES (
  '707534cf-6127-48fb-8ef4-12370cdb7f73', 'rohan-iyer', 'Rohan Iyer', 'Indian, based in Bengaluru', 1981, 'Mixed media on canvas — geometry as devotion, colour as prayer.', 'Rohan Iyer is a painter whose grid-based canvases have been described by critic Meera Menezes as ''slow yantras for the distracted eye.'' His work is held in the Kiran Nadar Museum and private collections in Zurich, London, and Singapore.', '{"Painting","Mixed Media"}'::text[], '{"Abstract","Post-Minimal"}'::text[], '/artists/portrait-rohan-iyer.jpg', '{"instagram":"https://instagram.com/kalaneri"}'::jsonb, false
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.artists (id, slug, name, nationality_origin, birth_year, practice_statement, bio, mediums, movements, portrait_image_url, social_links, featured) VALUES (
  'bf7ee92e-d017-44ae-877a-f157b3acd641', 'ananya-rao', 'Ananya Rao', 'Indian, based in Chennai', 1986, 'Sculpture and installation — brass, granite, and the poetics of the temple threshold.', 'Ananya Rao trained at the Government College of Fine Arts, Chennai, and completed a residency at Villa Kujoyama, Kyoto. Her sculptures reinterpret South Indian temple carvings for the domestic scale, often using discarded brass utensils as source material.', '{"Sculpture"}'::text[], '{"Contemporary Indian","Post-Craft"}'::text[], '/artists/portrait-ananya-rao.jpg', '{"instagram":"https://instagram.com/kalaneri"}'::jsonb, false
) ON CONFLICT (slug) DO NOTHING;

-- Artworks
INSERT INTO public.artworks (id, slug, title, artist_id, medium, movement_tags, year_created, dimensions, primary_image_url, gallery_image_urls, story, authenticity_notes, price_min, price_max, price_display, availability, origin_country, display_price, featured) VALUES (
  '5ec9cdaf-8e8e-41ad-bf5c-3d559efaa540', 'city-of-gates-i', 'City of Gates I', '8b17e33b-d55e-4521-a857-7117196a2c5a', 'Oil on canvas', '{"Contemporary Indian","Neo-Miniature"}'::text[], 2024, '152 × 122 cm', '/artworks/painting-city-of-gates-1.jpg', '{"/artworks/painting-city-of-gates-1.jpg","/artworks/painting-city-of-gates-2.jpg"}'::text[], 'The first in a series painted after a year of walking through Jaipur''s Chandpole gate at dawn. Every arch is a portrait of the city''s slow, patient light.', 'Painted in the artist''s Jaipur studio between March and October 2024. Signed and dated verso. Sold with a Kalaneri certificate of authenticity, condition report, and lifetime provenance record.', 450000, NULL, 'fixed', 'available', 'India', 450000, true
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.artworks (id, slug, title, artist_id, medium, movement_tags, year_created, dimensions, primary_image_url, gallery_image_urls, story, authenticity_notes, price_min, price_max, price_display, availability, origin_country, display_price, featured) VALUES (
  '6f84e7d7-79b0-4216-9c71-67fecac4594f', 'city-of-gates-ii', 'City of Gates II', '8b17e33b-d55e-4521-a857-7117196a2c5a', 'Oil on canvas', '{"Contemporary Indian","Neo-Miniature"}'::text[], 2024, '152 × 122 cm', '/artworks/painting-city-of-gates-2.jpg', '{"/artworks/painting-city-of-gates-2.jpg","/artworks/painting-city-of-gates-1.jpg"}'::text[], NULL, 'Kalaneri certificate of authenticity included.', 480000, NULL, 'fixed', 'available', 'India', 480000, false
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.artworks (id, slug, title, artist_id, medium, movement_tags, year_created, dimensions, primary_image_url, gallery_image_urls, story, authenticity_notes, price_min, price_max, price_display, availability, origin_country, display_price, featured) VALUES (
  '15443acc-4076-456b-b781-e91192cac1c8', 'archive-of-arches', 'Archive of Arches', '8b17e33b-d55e-4521-a857-7117196a2c5a', 'Oil on linen', '{"Contemporary Indian"}'::text[], 2023, '122 × 91 cm', '/artworks/painting-archive-arches.jpg', '{"/artworks/painting-archive-arches.jpg"}'::text[], NULL, 'Signed verso. Provenance verified.', 320000, NULL, 'fixed', 'available', 'India', 320000, false
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.artworks (id, slug, title, artist_id, medium, movement_tags, year_created, dimensions, primary_image_url, gallery_image_urls, story, authenticity_notes, price_min, price_max, price_display, availability, origin_country, display_price, featured) VALUES (
  '92d50560-cc81-4f3b-b423-03ee2c968238', 'dust-and-light', 'Dust and Light', '8b17e33b-d55e-4521-a857-7117196a2c5a', 'Watercolour on Wasli paper', '{"Contemporary Indian","Neo-Miniature"}'::text[], 2023, '56 × 76 cm', '/artworks/painting-dust-and-light.jpg', '{"/artworks/painting-dust-and-light.jpg"}'::text[], NULL, 'Framed, museum float. Signed and dated.', 85000, NULL, 'fixed', 'available', 'India', 85000, false
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.artworks (id, slug, title, artist_id, medium, movement_tags, year_created, dimensions, primary_image_url, gallery_image_urls, story, authenticity_notes, price_min, price_max, price_display, availability, origin_country, display_price, featured) VALUES (
  'ff36723b-3661-4e55-ae16-055283b481a0', 'domestic-shrine-i', 'Domestic Shrine I', 'f27934b8-70d8-4031-bf03-e25175b80f1a', 'Bronze', '{"Contemporary Indian","Post-Craft"}'::text[], 2024, '42 × 22 × 22 cm', '/artworks/painting-domestic-shrine.jpg', '{"/artworks/painting-domestic-shrine.jpg"}'::text[], 'A miniature altar for the everyday — cast from a wax model made in the artist''s kitchen over three weeks in early 2024.', 'Edition of 5 + 1 AP. This is number 2/5. Signed and stamped at the base.', 220000, NULL, 'fixed', 'available', 'India', 220000, true
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.artworks (id, slug, title, artist_id, medium, movement_tags, year_created, dimensions, primary_image_url, gallery_image_urls, story, authenticity_notes, price_min, price_max, price_display, availability, origin_country, display_price, featured) VALUES (
  '57448a63-9992-4af9-82a7-cfd54ddd9b45', 'small-god', 'Small God', 'f27934b8-70d8-4031-bf03-e25175b80f1a', 'Terracotta with brass inlay', '{"Post-Craft"}'::text[], 2023, '28 × 18 × 18 cm', '/artworks/painting-small-god.jpg', '{"/artworks/painting-small-god.jpg"}'::text[], NULL, 'Unique piece. Signed at base.', 140000, NULL, 'fixed', 'reserved', 'India', 140000, false
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.artworks (id, slug, title, artist_id, medium, movement_tags, year_created, dimensions, primary_image_url, gallery_image_urls, story, authenticity_notes, price_min, price_max, price_display, availability, origin_country, display_price, featured) VALUES (
  'f0d4af60-82b1-4ca2-a4e2-ad495d97b4be', 'coastal-altar', 'Coastal Altar', 'f27934b8-70d8-4031-bf03-e25175b80f1a', 'Bronze on granite base', '{"Contemporary Indian"}'::text[], 2024, '55 × 30 × 30 cm', '/artworks/painting-coastal-altar.jpg', '{"/artworks/painting-coastal-altar.jpg"}'::text[], NULL, 'Edition of 5. This is 1/5.', 380000, NULL, 'fixed', 'available', 'India', 380000, false
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.artworks (id, slug, title, artist_id, medium, movement_tags, year_created, dimensions, primary_image_url, gallery_image_urls, story, authenticity_notes, price_min, price_max, price_display, availability, origin_country, display_price, featured) VALUES (
  'c0b49a70-b20c-4c39-9c61-62518c1a0e64', 'offering', 'Offering', 'f27934b8-70d8-4031-bf03-e25175b80f1a', 'Reclaimed teak with bronze', '{"Post-Craft"}'::text[], 2022, '35 × 20 × 20 cm', '/artworks/painting-offering.jpg', '{"/artworks/painting-offering.jpg"}'::text[], NULL, 'Unique piece.', 180000, NULL, 'fixed', 'sold', 'India', 180000, false
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.artworks (id, slug, title, artist_id, medium, movement_tags, year_created, dimensions, primary_image_url, gallery_image_urls, story, authenticity_notes, price_min, price_max, price_display, availability, origin_country, display_price, featured) VALUES (
  'bd7b740c-c9b9-4c23-aa7f-782246d33a47', 'deco-i-marine-drive', 'Deco I — Marine Drive', 'bbbb3df0-82a3-400c-b7ba-9acda34f4e1b', 'Archival pigment print', '{"Documentary","Urban Archive"}'::text[], 2023, '60 × 90 cm', '/artworks/painting-deco-marine.jpg', '{"/artworks/painting-deco-marine.jpg"}'::text[], 'The Eros cinema at first light, from a series shot over 30 dawns in 2022–23.', 'Edition of 7. This is 3/7. Printed by the artist on Hahnemühle Photo Rag. Signed and numbered verso.', 95000, NULL, 'fixed', 'available', 'India', 95000, true
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.artworks (id, slug, title, artist_id, medium, movement_tags, year_created, dimensions, primary_image_url, gallery_image_urls, story, authenticity_notes, price_min, price_max, price_display, availability, origin_country, display_price, featured) VALUES (
  '4899060a-0358-4f1a-9a6a-d92c8fb24f85', 'deco-ii-oval-maidan', 'Deco II — Oval Maidan', 'bbbb3df0-82a3-400c-b7ba-9acda34f4e1b', 'Archival pigment print', '{"Documentary"}'::text[], 2023, '60 × 90 cm', '/artworks/painting-deco-oval.jpg', '{"/artworks/painting-deco-oval.jpg"}'::text[], NULL, 'Edition of 7. Number 2/7.', 95000, NULL, 'fixed', 'available', 'India', 95000, false
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.artworks (id, slug, title, artist_id, medium, movement_tags, year_created, dimensions, primary_image_url, gallery_image_urls, story, authenticity_notes, price_min, price_max, price_display, availability, origin_country, display_price, featured) VALUES (
  '0d8737e9-8a97-41e8-b972-e969c83616ff', 'facade-study', 'Facade Study', 'bbbb3df0-82a3-400c-b7ba-9acda34f4e1b', 'Archival pigment print', '{"Urban Archive"}'::text[], 2022, '40 × 60 cm', '/artworks/painting-facade-study.jpg', '{"/artworks/painting-facade-study.jpg"}'::text[], NULL, 'Edition of 5.', 65000, NULL, 'fixed', 'available', 'India', 65000, false
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.artworks (id, slug, title, artist_id, medium, movement_tags, year_created, dimensions, primary_image_url, gallery_image_urls, story, authenticity_notes, price_min, price_max, price_display, availability, origin_country, display_price, featured) VALUES (
  '3399bb06-aecb-4670-8595-54fde132c507', 'bombay-blues', 'Bombay Blues', 'bbbb3df0-82a3-400c-b7ba-9acda34f4e1b', 'Silver gelatin print', '{"Documentary"}'::text[], 2021, '50 × 75 cm', '/artworks/painting-bombay-blues.jpg', '{"/artworks/painting-bombay-blues.jpg"}'::text[], NULL, 'Edition of 5. Hand-printed.', 120000, NULL, 'fixed', 'available', 'India', 120000, false
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.artworks (id, slug, title, artist_id, medium, movement_tags, year_created, dimensions, primary_image_url, gallery_image_urls, story, authenticity_notes, price_min, price_max, price_display, availability, origin_country, display_price, featured) VALUES (
  '12614a9b-5737-4d34-85cc-af243aa7f302', 'monsoon-i', 'Monsoon I', '84aae12b-53e2-4cc8-9270-a2b3a8aa1248', 'Ink and gouache on Wasli paper', '{"Contemporary Indian","Neo-Miniature"}'::text[], 2024, '46 × 56 cm', '/artworks/painting-monsoon-1.jpg', '{"/artworks/painting-monsoon-1.jpg","/artworks/painting-monsoon-2.jpg"}'::text[], 'A record of one week of monsoon light across the artist''s Delhi studio wall.', 'Unique work on hand-made Wasli paper. Signed and dated recto.', 75000, NULL, 'fixed', 'available', 'India', 75000, true
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.artworks (id, slug, title, artist_id, medium, movement_tags, year_created, dimensions, primary_image_url, gallery_image_urls, story, authenticity_notes, price_min, price_max, price_display, availability, origin_country, display_price, featured) VALUES (
  'e2327fc4-27ad-40ca-ac08-785db36ff30f', 'monsoon-ii', 'Monsoon II', '84aae12b-53e2-4cc8-9270-a2b3a8aa1248', 'Ink on Wasli paper', '{"Neo-Miniature"}'::text[], 2024, '46 × 56 cm', '/artworks/painting-monsoon-2.jpg', '{"/artworks/painting-monsoon-2.jpg","/artworks/painting-monsoon-1.jpg"}'::text[], NULL, 'Unique.', 68000, NULL, 'fixed', 'available', 'India', 68000, false
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.artworks (id, slug, title, artist_id, medium, movement_tags, year_created, dimensions, primary_image_url, gallery_image_urls, story, authenticity_notes, price_min, price_max, price_display, availability, origin_country, display_price, featured) VALUES (
  '9979c5a4-682b-4c19-b56b-ed9faf4658c4', 'field-notes', 'Field Notes', '84aae12b-53e2-4cc8-9270-a2b3a8aa1248', 'Gouache on paper', '{"Contemporary Indian"}'::text[], 2023, '30 × 40 cm', '/artworks/painting-field-notes.jpg', '{"/artworks/painting-field-notes.jpg"}'::text[], NULL, 'Unique work.', 42000, NULL, 'fixed', 'available', 'India', 42000, false
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.artworks (id, slug, title, artist_id, medium, movement_tags, year_created, dimensions, primary_image_url, gallery_image_urls, story, authenticity_notes, price_min, price_max, price_display, availability, origin_country, display_price, featured) VALUES (
  '30f4ea71-da64-48d2-a0d2-293d92cf6f9c', 'room-with-rain', 'Room with Rain', '84aae12b-53e2-4cc8-9270-a2b3a8aa1248', 'Gouache and gold leaf on Wasli', '{"Neo-Miniature"}'::text[], 2024, '56 × 76 cm', '/artworks/painting-room-with-rain.jpg', '{"/artworks/painting-room-with-rain.jpg"}'::text[], NULL, 'Unique. Signed verso.', 110000, NULL, 'fixed', 'available', 'India', 110000, false
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.artworks (id, slug, title, artist_id, medium, movement_tags, year_created, dimensions, primary_image_url, gallery_image_urls, story, authenticity_notes, price_min, price_max, price_display, availability, origin_country, display_price, featured) VALUES (
  '5875ad03-5fe2-450c-9c78-ece22a137518', 'yantra-i', 'Yantra I', '707534cf-6127-48fb-8ef4-12370cdb7f73', 'Acrylic on canvas', '{"Abstract","Post-Minimal"}'::text[], 2024, '183 × 152 cm', '/artworks/painting-yantra-1.jpg', '{"/artworks/painting-yantra-1.jpg","/artworks/painting-yantra-2.jpg"}'::text[], 'The first canvas in a nine-work grid series meditating on the yantra as a device for slow looking.', 'Signed and dated verso. Sold with certificate.', 620000, NULL, 'fixed', 'available', 'India', 620000, true
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.artworks (id, slug, title, artist_id, medium, movement_tags, year_created, dimensions, primary_image_url, gallery_image_urls, story, authenticity_notes, price_min, price_max, price_display, availability, origin_country, display_price, featured) VALUES (
  'e3467b2c-2700-4e47-bbdf-3d9423ff47ee', 'yantra-ii', 'Yantra II', '707534cf-6127-48fb-8ef4-12370cdb7f73', 'Acrylic on canvas', '{"Abstract"}'::text[], 2024, '183 × 152 cm', '/artworks/painting-yantra-2.jpg', '{"/artworks/painting-yantra-2.jpg","/artworks/painting-yantra-1.jpg"}'::text[], NULL, 'Signed verso.', 620000, NULL, 'fixed', 'available', 'India', 620000, false
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.artworks (id, slug, title, artist_id, medium, movement_tags, year_created, dimensions, primary_image_url, gallery_image_urls, story, authenticity_notes, price_min, price_max, price_display, availability, origin_country, display_price, featured) VALUES (
  'c39cb523-b7dc-4734-8c2b-98e7d47c5425', 'slow-grid', 'Slow Grid', '707534cf-6127-48fb-8ef4-12370cdb7f73', 'Mixed media on canvas', '{"Post-Minimal"}'::text[], 2023, '122 × 122 cm', '/artworks/painting-slow-grid.jpg', '{"/artworks/painting-slow-grid.jpg"}'::text[], NULL, 'Signed verso.', 340000, NULL, 'fixed', 'available', 'India', 340000, false
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.artworks (id, slug, title, artist_id, medium, movement_tags, year_created, dimensions, primary_image_url, gallery_image_urls, story, authenticity_notes, price_min, price_max, price_display, availability, origin_country, display_price, featured) VALUES (
  'b59fde66-4ecc-4f59-98e4-22b8bf06f28d', 'devotion-in-blue', 'Devotion in Blue', '707534cf-6127-48fb-8ef4-12370cdb7f73', 'Acrylic on linen', '{"Abstract"}'::text[], 2022, '91 × 91 cm', '/artworks/painting-devotion-blue.jpg', '{"/artworks/painting-devotion-blue.jpg"}'::text[], NULL, 'Signed verso.', 260000, NULL, 'fixed', 'available', 'India', 260000, false
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.artworks (id, slug, title, artist_id, medium, movement_tags, year_created, dimensions, primary_image_url, gallery_image_urls, story, authenticity_notes, price_min, price_max, price_display, availability, origin_country, display_price, featured) VALUES (
  '0d318158-d4a9-4370-b85f-5afe405cce75', 'threshold', 'Threshold', 'bf7ee92e-d017-44ae-877a-f157b3acd641', 'Brass and granite', '{"Contemporary Indian","Post-Craft"}'::text[], 2024, '60 × 45 × 30 cm', '/artworks/painting-threshold.jpg', '{"/artworks/painting-threshold.jpg"}'::text[], 'Cast from a mould of a temple lintel in Chidambaram. Reduced and abstracted to a domestic scale.', 'Unique. Signed and stamped at base.', 520000, NULL, 'fixed', 'available', 'India', 520000, true
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.artworks (id, slug, title, artist_id, medium, movement_tags, year_created, dimensions, primary_image_url, gallery_image_urls, story, authenticity_notes, price_min, price_max, price_display, availability, origin_country, display_price, featured) VALUES (
  'cc083188-7e77-4209-a5c3-efd968e563c9', 'lamp-form', 'Lamp Form', 'bf7ee92e-d017-44ae-877a-f157b3acd641', 'Brass', '{"Post-Craft"}'::text[], 2023, '38 × 20 × 20 cm', '/artworks/painting-lamp-form.jpg', '{"/artworks/painting-lamp-form.jpg"}'::text[], NULL, 'Edition of 3.', 180000, NULL, 'fixed', 'available', 'India', 180000, false
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.artworks (id, slug, title, artist_id, medium, movement_tags, year_created, dimensions, primary_image_url, gallery_image_urls, story, authenticity_notes, price_min, price_max, price_display, availability, origin_country, display_price, featured) VALUES (
  '0dbbd64c-05d9-4a16-a143-15e428ed1df7', 'temple-vessel', 'Temple Vessel', 'bf7ee92e-d017-44ae-877a-f157b3acd641', 'Bronze', '{"Contemporary Indian"}'::text[], 2024, '32 × 24 × 24 cm', '/artworks/painting-temple-vessel.jpg', '{"/artworks/painting-temple-vessel.jpg"}'::text[], NULL, 'Unique.', 240000, NULL, 'fixed', 'available', 'India', 240000, false
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.artworks (id, slug, title, artist_id, medium, movement_tags, year_created, dimensions, primary_image_url, gallery_image_urls, story, authenticity_notes, price_min, price_max, price_display, availability, origin_country, display_price, featured) VALUES (
  '8c33bc51-e030-4906-828a-355a366ce1d5', 'granite-study', 'Granite Study', 'bf7ee92e-d017-44ae-877a-f157b3acd641', 'Granite', '{"Post-Craft"}'::text[], 2022, '25 × 30 × 20 cm', '/artworks/painting-granite-study.jpg', '{"/artworks/painting-granite-study.jpg"}'::text[], NULL, 'Unique.', 150000, NULL, 'fixed', 'not_for_sale', 'India', 150000, false
) ON CONFLICT (slug) DO NOTHING;

-- Exhibitions
INSERT INTO public.exhibitions (id, slug, title, status, start_date, end_date, cover_image_url, description, catalogue_url, featured) VALUES (
  '36ca0506-fd8d-4ec6-9599-dae70c3dccb9', 'city-of-gates', 'City of Gates — Vikram Mehta', 'current', '2026-06-01', '2026-08-31', '/artworks/painting-city-of-gates-1.jpg', 'A solo exhibition of new paintings and works on paper by Vikram Mehta. Twelve new works painted between 2023 and 2024, all made in response to Jaipur''s Chandpole gate at dawn.', '#', true
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.exhibitions (id, slug, title, status, start_date, end_date, cover_image_url, description, catalogue_url, featured) VALUES (
  '9de9c6ba-e544-4033-931a-2de837908c50', 'coastal-altars', 'Coastal Altars — Leela Krishnan', 'upcoming', '2026-10-15', '2026-12-15', '/artworks/painting-coastal-altar.jpg', 'Leela Krishnan''s second solo at Kalaneri. Nine bronzes and three works in reclaimed teak.', '#', true
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.exhibitions (id, slug, title, status, start_date, end_date, cover_image_url, description, catalogue_url, featured) VALUES (
  'c9f7d255-2fb2-4b89-9b17-fc8ea0472a7a', 'deco-bombay', 'Deco Bombay — Arjun Desai', 'past', '2025-11-01', '2026-01-31', '/artworks/painting-deco-marine.jpg', 'A photographic archive of Bombay''s Art Deco facades, shot at dawn over 30 days.', '#', false
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.exhibitions (id, slug, title, status, start_date, end_date, cover_image_url, description, catalogue_url, featured) VALUES (
  '08ad45c1-037f-429d-b7ba-b0e36ec4e131', 'slow-grids', 'Slow Grids — Rohan Iyer', 'past', '2025-06-01', '2025-08-31', '/artworks/painting-slow-grid.jpg', 'Rohan Iyer''s first solo at Kalaneri. Six paintings from the Yantra series.', '#', false
) ON CONFLICT (slug) DO NOTHING;

-- Journal Entries
INSERT INTO public.journal_entries (id, slug, type, title, cover_image_url, body, published_at) VALUES (
  'ca1e2589-81e3-4180-b561-4bc5f7b00b52', 'vikram-mehta-conversation', 'interview', 'A conversation with Vikram Mehta', '/artists/portrait-vikram-mehta.jpg', 'Vikram Mehta on the Chandpole gate, on painting the same arch for six months, and on why the miniature tradition is not a costume.

Q. You''ve painted the same gate for six months. What''s left to find?
A. Everything, still. The light at 5:47 in April is nothing like the light at 5:47 in October.

[This entry is a placeholder — full text to follow.]', '2026-06-14T09:00:00+00:00'
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.journal_entries (id, slug, type, title, cover_image_url, body, published_at) VALUES (
  '1088c129-1aa4-498b-8bbd-3d53b33ef936', 'opening-city-of-gates', 'exhibition', 'Opening notes — City of Gates', '/artworks/painting-city-of-gates-2.jpg', 'Notes from the opening of Vikram Mehta''s City of Gates at the gallery.

[Placeholder text — full essay to follow.]', '2026-05-02T09:00:00+00:00'
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.journal_entries (id, slug, type, title, cover_image_url, body, published_at) VALUES (
  'da277fbd-b93d-4a11-a0f1-5124a71fcf86', 'in-the-foundry', 'exhibition', 'In the foundry with Leela Krishnan', '/artworks/painting-lamp-form.jpg', 'A behind-the-scenes visit to the Ernakulam foundry where Leela''s bronzes are cast.

[Placeholder.]', '2026-04-11T09:00:00+00:00'
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.journal_entries (id, slug, type, title, cover_image_url, body, published_at) VALUES (
  'b86b580d-f23b-4f4f-8c2f-78f6edd4cf92', 'market-notes-2026', 'press', 'Market notes — spring 2026', '/artworks/painting-yantra-1.jpg', 'A quick read of the Indian primary market after Art Basel Hong Kong 2026.

[Placeholder market letter.]', '2026-04-01T09:00:00+00:00'
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.journal_entries (id, slug, type, title, cover_image_url, body, published_at) VALUES (
  'db67c332-8172-4cf4-94f1-2b4b6da3a272', 'first-work', 'guide', 'A first work to live with', '/artworks/painting-devotion-blue.jpg', 'A short guide for a first-time collector — where to start, what to ask, and what to ignore.

[Placeholder guide.]', '2026-03-20T09:00:00+00:00'
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.journal_entries (id, slug, type, title, cover_image_url, body, published_at) VALUES (
  '740351c9-e339-4147-a5c5-2e8c67382ebe', 'a-quiet-brief', 'interview', 'A quiet brief — Nisha Varma on Wasli', '/artworks/painting-monsoon-1.jpg', 'Nisha Varma on hand-making paper, on the pigment tradition, and on why the miniature is not a size.

[Placeholder interview.]', '2026-02-08T09:00:00+00:00'
) ON CONFLICT (slug) DO NOTHING;

-- Press Mentions
INSERT INTO public.press_mentions (id, publication, title, excerpt, external_url, logo_url, published_at, featured) VALUES (
  'f195e3d9-a91b-4405-8646-45499d8bef88', 'Frieze India', 'A patient gallery in Jaipur', 'A study of Kalaneri as an outlier in the Indian primary market — one that keeps its roster short and its records long.', '#', 'https://images.unsplash.com/photo-1611926653458-09294b3142bf?w=200&auto=format&fit=crop', '2026-05-01', true
) ON CONFLICT DO NOTHING;
INSERT INTO public.press_mentions (id, publication, title, excerpt, external_url, logo_url, published_at, featured) VALUES (
  'd90c36c7-6b0a-473a-a5eb-a100b60940d5', 'Architectural Digest India', 'Ten galleries changing how Indians collect', 'Kalaneri is named among ten galleries reshaping the Indian primary market.', '#', 'https://images.unsplash.com/photo-1611926653458-09294b3142bf?w=200', '2026-03-15', true
) ON CONFLICT DO NOTHING;
INSERT INTO public.press_mentions (id, publication, title, excerpt, external_url, logo_url, published_at, featured) VALUES (
  '4a3c3635-81c5-46b8-975b-0dbbfc24eac8', 'The Hindu', 'On the long relationship', 'A profile of Kalaneri''s "decade, not exhibition" policy for representing artists.', '#', 'https://images.unsplash.com/photo-1611926653458-09294b3142bf?w=200', '2025-12-02', false
) ON CONFLICT DO NOTHING;
INSERT INTO public.press_mentions (id, publication, title, excerpt, external_url, logo_url, published_at, featured) VALUES (
  'ad2de66c-bfe4-4e15-80a8-b7c7f9a52699', 'Mint Lounge', 'The paper trail matters', 'Kalaneri''s director on the provenance record and why buyers should ask for it.', '#', 'https://images.unsplash.com/photo-1611926653458-09294b3142bf?w=200', '2025-10-20', false
) ON CONFLICT DO NOTHING;
INSERT INTO public.press_mentions (id, publication, title, excerpt, external_url, logo_url, published_at, featured) VALUES (
  '43f65d57-b702-4254-9002-32c43e527fb2', 'STIR World', 'Contemporary altars — Leela Krishnan at Kalaneri', 'A review of Coastal Altars, opening at Kalaneri this autumn.', '#', 'https://images.unsplash.com/photo-1611926653458-09294b3142bf?w=200', '2025-09-08', false
) ON CONFLICT DO NOTHING;

-- Commissioned Samples
INSERT INTO public.commissioned_samples (id, title, artist_name, image_url, description, year_completed) VALUES (
  'a8d6b36b-5d95-43b9-b37b-f82bba77935f', 'Private commission, Zurich', 'Rohan Iyer', 'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=1400&auto=format&fit=crop', 'A triptych commissioned for a private residence in Zurich, completed over eight months.', 2024
) ON CONFLICT DO NOTHING;
INSERT INTO public.commissioned_samples (id, title, artist_name, image_url, description, year_completed) VALUES (
  'c867cd0d-bbb5-41d6-8d7d-4b1130530c2a', 'Corporate lobby, Bengaluru', 'Vikram Mehta', 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=1400&auto=format&fit=crop', 'A four-metre painting commissioned for a technology company''s Bengaluru headquarters.', 2023
) ON CONFLICT DO NOTHING;
INSERT INTO public.commissioned_samples (id, title, artist_name, image_url, description, year_completed) VALUES (
  '262ba97f-e103-4094-b4f7-eca4a48c4776', 'Family altar, London', 'Leela Krishnan', 'https://images.unsplash.com/photo-1594736797933-d0e501ba2fe6?w=1400&auto=format&fit=crop', 'A set of five bronzes commissioned as a family shrine for a London home.', 2024
) ON CONFLICT DO NOTHING;
