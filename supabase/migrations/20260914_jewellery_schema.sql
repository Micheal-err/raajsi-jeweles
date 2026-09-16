-- Supabase SQL Migration for Raajsi Jewels
-- Execute this script in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Create Enums
CREATE TYPE public.availability AS ENUM ('available', 'reserved', 'sold', 'not_for_sale');
CREATE TYPE public.price_display AS ENUM ('range', 'on_request', 'fixed');

-- 2. Create Artists / Karigars Table
CREATE TABLE IF NOT EXISTS public.artists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    bio TEXT,
    practice_statement TEXT,
    portrait_image_url TEXT,
    featured BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create Artworks / Jewellery Products Table
CREATE TABLE IF NOT EXISTS public.artworks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    medium TEXT,
    story TEXT,
    primary_image_url TEXT,
    gallery_image_urls TEXT[],
    availability public.availability DEFAULT 'available'::public.availability,
    display_price NUMERIC,
    price_min NUMERIC,
    price_max NUMERIC,
    price_display public.price_display DEFAULT 'fixed'::public.price_display,
    metadata JSONB DEFAULT '{}'::jsonb,
    featured BOOLEAN DEFAULT false,
    artist_id UUID REFERENCES public.artists(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artworks ENABLE ROW LEVEL SECURITY;

-- 5. Public Read Policies
CREATE POLICY "Allow public read on artists" ON public.artists FOR SELECT USING (true);
CREATE POLICY "Allow public read on artworks" ON public.artworks FOR SELECT USING (true);
