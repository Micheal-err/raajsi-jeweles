
-- ============================================================
-- Phase 0 / new tables for the full roadmap build
-- ============================================================

-- extend existing tables ---------------------------------------------------
ALTER TABLE public.inquiries
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'general';

ALTER TABLE public.cart_items
  ADD COLUMN IF NOT EXISTS reserved_at timestamptz;

-- exhibitions --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.exhibitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'upcoming', -- 'current' | 'upcoming' | 'past'
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
CREATE POLICY "Exhibitions are public"
  ON public.exhibitions FOR SELECT
  USING (true);

-- press_mentions -----------------------------------------------------------
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
CREATE POLICY "Press mentions are public"
  ON public.press_mentions FOR SELECT
  USING (true);

-- commissioned_samples -----------------------------------------------------
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
CREATE POLICY "Commissioned samples are public"
  ON public.commissioned_samples FOR SELECT
  USING (true);

-- appointments -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  slot_start timestamptz NOT NULL,
  slot_end timestamptz,
  party_size integer DEFAULT 1,
  notes text,
  status text NOT NULL DEFAULT 'requested', -- 'requested' | 'confirmed' | 'cancelled'
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.appointments TO anon, authenticated;
GRANT ALL ON public.appointments TO service_role;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone may request an appointment"
  ON public.appointments FOR INSERT
  WITH CHECK (true);

-- newsletter_subscribers ---------------------------------------------------
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  source text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.newsletter_subscribers TO anon, authenticated;
GRANT ALL ON public.newsletter_subscribers TO service_role;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone may subscribe"
  ON public.newsletter_subscribers FOR INSERT
  WITH CHECK (true);

-- orders -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'inquiry_sent', -- inquiry_sent | confirmed | shipped | delivered | cancelled
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
CREATE POLICY "Owners select own orders"
  ON public.orders FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Owners insert own orders"
  ON public.orders FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Owners update own orders"
  ON public.orders FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
