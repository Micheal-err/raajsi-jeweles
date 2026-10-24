-- ==============================================================================
-- RAAJSI JEWELS — PRODUCT REVIEWS SCHEMA
-- Allows authenticated users to review any jewellery piece.
-- Verified purchase is optional.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.product_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artwork_id UUID REFERENCES public.artworks(id) ON DELETE CASCADE,
    product_slug TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL,
    user_email TEXT,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT NOT NULL,
    comment TEXT NOT NULL,
    verified_purchase BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Fast lookup indexes
CREATE INDEX IF NOT EXISTS idx_product_reviews_slug ON public.product_reviews (product_slug);
CREATE INDEX IF NOT EXISTS idx_product_reviews_artwork ON public.product_reviews (artwork_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_created ON public.product_reviews (created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- 1. Anyone (public, guests, search engines) can read reviews
CREATE POLICY "Public read reviews"
    ON public.product_reviews FOR SELECT
    USING (true);

-- 2. Authenticated users can insert reviews
CREATE POLICY "Authenticated users can insert reviews"
    ON public.product_reviews FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- 3. Users can update their own reviews
CREATE POLICY "Users can update own reviews"
    ON public.product_reviews FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);
