-- Correct the initial default-category backfill.
-- The original migration added category DEFAULT 'silver' before backfilling,
-- so pre-existing gold/handcrafted rows could retain that default value.

UPDATE public.artworks
SET category = CASE
  WHEN COALESCE(metadata->>'category', '') ILIKE '%handicraft%' THEN 'handicraft'
  WHEN COALESCE(metadata->>'category', '') ILIKE '%silver%' THEN 'silver'
  WHEN COALESCE(medium, '') ILIKE '%silver%'
    OR COALESCE(metadata->>'material', '') ILIKE '%silver%' THEN 'silver'
  WHEN COALESCE(medium, '') ILIKE '%gold%'
    OR COALESCE(metadata->>'material', '') ILIKE '%gold%' THEN 'handicraft'
  WHEN category IN ('silver', 'handicraft') THEN category
  ELSE 'handicraft'
END;

CREATE INDEX IF NOT EXISTS idx_artworks_category_slug
  ON public.artworks (category, slug);
