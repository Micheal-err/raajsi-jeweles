-- Add category column to artworks table if not exists
-- Raajsi Jewels: Two core categories: 'silver' (925 Silver) and 'handicraft' (Handcrafted Jewels)

ALTER TABLE public.artworks ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'silver';

-- Create index on category for fast filtering
CREATE INDEX IF NOT EXISTS idx_artworks_category ON public.artworks (category);

-- Backfill category from metadata if present
UPDATE public.artworks
SET category = CASE
    WHEN (metadata->>'category') ILIKE '%handicraft%' THEN 'handicraft'
    WHEN (metadata->>'category') ILIKE '%silver%' THEN 'silver'
    WHEN medium ILIKE '%silver%' THEN 'silver'
    ELSE 'handicraft'
END
WHERE category IS NULL OR category NOT IN ('silver', 'handicraft');
