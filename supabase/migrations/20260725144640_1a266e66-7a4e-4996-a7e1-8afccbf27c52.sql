
-- Enums
CREATE TYPE public.price_display AS ENUM ('range','on_request','fixed');
CREATE TYPE public.availability AS ENUM ('available','reserved','sold','not_for_sale');
CREATE TYPE public.journal_type AS ENUM ('exhibition','press','interview','guide');
CREATE TYPE public.inquiry_status AS ENUM ('new','contacted','closed');

-- Artists
CREATE TABLE public.artists (
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
CREATE POLICY "Public read artists" ON public.artists FOR SELECT USING (true);

-- Artworks
CREATE TABLE public.artworks (
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
  featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.artworks TO anon, authenticated;
GRANT ALL ON public.artworks TO service_role;
ALTER TABLE public.artworks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read artworks" ON public.artworks FOR SELECT USING (true);

-- Journal entries
CREATE TABLE public.journal_entries (
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
CREATE POLICY "Public read journal" ON public.journal_entries FOR SELECT USING (published_at <= now());

-- Inquiries
CREATE TABLE public.inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artwork_id UUID REFERENCES public.artworks(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  source_page TEXT,
  status public.inquiry_status NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.inquiries TO anon, authenticated;
GRANT ALL ON public.inquiries TO service_role;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit inquiries" ON public.inquiries FOR INSERT WITH CHECK (true);

-- Seed data
WITH a AS (
  INSERT INTO public.artists (slug, name, nationality_origin, birth_year, practice_statement, bio, mediums, movements, portrait_image_url, featured) VALUES
  ('vikram-mehta', 'Vikram Mehta', 'Indian (Rajasthan)', 1961,
   'Vikram Mehta translates the fading grandeur of Rajputana into contemporary abstraction — palaces, pigments, and memory dissolving into gestural fields of saffron and indigo.',
   'Born in Jodhpur and trained at the Faculty of Fine Arts in Baroda, Vikram has exhibited across India, London and Dubai over four decades. His work is held in the collection of the Kiran Nadar Museum of Art.',
   ARRAY['Oil on canvas','Mixed media','Gold leaf'], ARRAY['Contemporary Abstraction','Neo-Miniature'],
   '/src/assets/artist-1.jpg', true),
  ('anjali-rao', 'Anjali Rao', 'Indian (Bengaluru)', 1988,
   'Working primarily in bronze and terracotta, Anjali reimagines the sacred female figure through the lens of the everyday — the mother, the labourer, the wanderer.',
   'A graduate of the Royal College of Art, London, Anjali maintains studios in Bengaluru and Jaipur. Her sculpture ''Karma-Kaar'' was awarded the Skoda Prize shortlist in 2022.',
   ARRAY['Bronze','Terracotta','Mixed media'], ARRAY['Contemporary Figurative','Sculpture'],
   '/src/assets/artist-2.jpg', true),
  ('rohan-desai', 'Rohan Desai', 'Indian (Mumbai)', 1974,
   'Rohan''s canvases are archaeological — layered strata of oil, ash and marble dust that excavate the visual grammar of Indian modernism.',
   'Rohan trained at the JJ School of Art and has been a resident at the Kochi-Muziris Biennale. He divides his time between Mumbai and Goa.',
   ARRAY['Oil on canvas','Charcoal'], ARRAY['Post-Modernism','Abstract Expressionism'],
   '/src/assets/artist-3.jpg', true),
  ('meera-shastri', 'Meera Shastri', 'Indian (Varanasi)', 1952,
   'A quiet chronicler of the Himalayan foothills, Meera works in sumi ink and handmade wasli paper, drawing lines that feel less made than remembered.',
   'One of the last practitioners trained in the classical Banaras wash technique, Meera''s work sits in private collections across Europe and Japan.',
   ARRAY['Ink on paper','Watercolour'], ARRAY['Neo-Traditional','Minimalism'],
   '/src/assets/artist-4.jpg', true)
  RETURNING id, slug
)
INSERT INTO public.artworks (slug, title, artist_id, medium, movement_tags, year_created, dimensions, primary_image_url, story, authenticity_notes, price_min, price_max, price_display, availability, featured)
SELECT * FROM (VALUES
  ('city-of-gates-i', 'City of Gates I', (SELECT id FROM a WHERE slug='vikram-mehta'),
   'Oil, gold leaf on linen', ARRAY['Contemporary Abstraction','Neo-Miniature']::text[], 2024, '72 x 60 in (183 x 152 cm)',
   '/src/assets/hero-artwork.jpg',
   'Painted over eleven months in Vikram''s Jodhpur studio, this work distils the artist''s decade-long study of Rajputana threshold architecture — the gate as portal, memory, and refusal.',
   'Signed and dated verso. Includes signed Certificate of Authenticity from the artist and Kalaneri Art Gallery. Provenance: Direct from the artist''s studio, 2024. Condition report available on request.',
   1800000, 2200000, 'range'::public.price_display, 'available'::public.availability, true),
  ('mandala-fracture', 'Mandala, Fractured', (SELECT id FROM a WHERE slug='vikram-mehta'),
   'Mixed media on canvas', ARRAY['Contemporary Abstraction']::text[], 2023, '48 x 40 in (122 x 102 cm)',
   '/src/assets/artwork-1.jpg',
   'Part of the artist''s ''Cosmologies'' series, exploring the geometry of devotion under contemporary rupture.',
   'Signed lower right. Certificate of Authenticity issued by Kalaneri Art Gallery. Provenance verified against artist''s studio records.',
   650000, 850000, 'range'::public.price_display, 'available'::public.availability, true),
  ('draped-crimson', 'Draped in Crimson', (SELECT id FROM a WHERE slug='rohan-desai'),
   'Oil on canvas', ARRAY['Contemporary Figurative']::text[], 2024, '60 x 48 in (152 x 122 cm)',
   '/src/assets/artwork-2.jpg',
   'A meditation on the sari as second skin — Rohan''s brush moves between reverence and unrest.',
   'Signed and dated. Provenance: Artist''s studio, Mumbai. Certificate of Authenticity provided.',
   900000, 1100000, 'range'::public.price_display, 'available'::public.availability, true),
  ('banyan-becoming', 'Banyan, Becoming', (SELECT id FROM a WHERE slug='anjali-rao'),
   'Bronze', ARRAY['Sculpture','Contemporary Figurative']::text[], 2023, '32 x 24 x 18 in',
   '/src/assets/artwork-3.jpg',
   'Cast in a single edition, this bronze grew from Anjali''s time spent at a 400-year-old banyan grove outside Hampi.',
   'Edition 1 of 1. Signed and numbered at the base. Foundry mark: Bronze India, Bengaluru. Certificate of Authenticity from the artist.',
   1400000, NULL, 'fixed'::public.price_display, 'available'::public.availability, false),
  ('himalaya-distance', 'The Himalaya, at Distance', (SELECT id FROM a WHERE slug='meera-shastri'),
   'Sumi ink on wasli paper', ARRAY['Minimalism','Neo-Traditional']::text[], 2022, '22 x 30 in',
   '/src/assets/artwork-4.jpg',
   'Drawn from a single sitting at dawn near Kausani, this work distills a lifetime of looking into a few resolved lines.',
   'Signed lower left in Devanagari. Provenance: Artist''s Varanasi studio via Kalaneri Art Gallery. Framed conservation glass.',
   180000, 240000, 'range'::public.price_display, 'reserved'::public.availability, false),
  ('city-of-gates-ii', 'City of Gates II', (SELECT id FROM a WHERE slug='vikram-mehta'),
   'Oil, gold leaf on linen', ARRAY['Contemporary Abstraction']::text[], 2024, '48 x 48 in',
   '/src/assets/hero-artwork.jpg',
   'A quieter companion to the larger ''City of Gates I'', where the palace facade dissolves further into pure pigment.',
   'Signed and dated verso. Certificate of Authenticity from the artist and gallery.',
   NULL, NULL, 'on_request'::public.price_display, 'available'::public.availability, false)
) AS v(slug,title,artist_id,medium,movement_tags,year_created,dimensions,primary_image_url,story,authenticity_notes,price_min,price_max,price_display,availability,featured);

INSERT INTO public.journal_entries (slug, type, title, cover_image_url, body, published_at) VALUES
  ('opening-city-of-gates', 'exhibition', 'Opening: Vikram Mehta — City of Gates',
   '/src/assets/gallery-interior.jpg',
   'Kalaneri Art Gallery opens Vikram Mehta''s solo show ''City of Gates'' — thirty new works produced across the last two years, drawn from the artist''s ongoing meditation on Rajputana architecture.\n\nOn view from 12 March through 30 April. Preview by appointment.',
   now() - interval '10 days'),
  ('authenticity-is-priceless', 'guide', 'What ''Authenticity is Priceless'' Actually Means',
   '/src/assets/artwork-2.jpg',
   'A short guide to how we verify every work we sell — provenance chain, artist certification, physical inspection, and the paper trail we keep on your behalf for the life of the piece.',
   now() - interval '30 days'),
  ('in-conversation-anjali-rao', 'interview', 'In Conversation: Anjali Rao on Bronze and Belief',
   '/src/assets/artist-2.jpg',
   'The sculptor speaks about her practice, the labour of the foundry, and why the sacred and the ordinary refuse to stay separate in her work.',
   now() - interval '60 days');
