-- Migration: Auto Sync Artwork Availability on Order / Inquiry Changes
-- Uses SECURITY DEFINER triggers & RPC to bypass RLS so normal customer checkout / inquiries / cancellations automatically update artwork availability

-- Function 1: RPC function to safely update artwork availability from client
CREATE OR REPLACE FUNCTION public.update_artworks_availability(
  p_artwork_ids uuid[],
  p_availability text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.artworks
  SET availability = p_availability
  WHERE id = ANY(p_artwork_ids);
END;
$$;

-- Grant execute permissions to authenticated and anon users
GRANT EXECUTE ON FUNCTION public.update_artworks_availability(uuid[], text) TO authenticated, anon;

-- Function 2: Trigger function on orders table
CREATE OR REPLACE FUNCTION public.trg_sync_order_artwork_availability()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item_rec jsonb;
  art_id uuid;
  target_avail text;
BEGIN
  -- Determine target availability state
  IF NEW.status IN ('confirmed', 'shipped', 'delivered') THEN
    target_avail := 'sold';
  ELSIF NEW.status = 'inquiry_sent' THEN
    target_avail := 'reserved';
  ELSIF NEW.status = 'cancelled' THEN
    target_avail := 'available';
  ELSE
    RETURN NEW;
  END IF;

  -- Loop through JSONB items array in order
  IF NEW.items IS NOT NULL AND jsonb_typeof(NEW.items) = 'array' THEN
    FOR item_rec IN SELECT * FROM jsonb_array_elements(NEW.items)
    LOOP
      IF item_rec ? 'artwork_id' AND (item_rec->>'artwork_id') IS NOT NULL AND (item_rec->>'artwork_id') != '' THEN
        BEGIN
          art_id := (item_rec->>'artwork_id')::uuid;
          UPDATE public.artworks
          SET availability = target_avail
          WHERE id = art_id;
        EXCEPTION WHEN OTHERS THEN
          -- Ignore invalid UUID format
        END;
      ELSIF item_rec ? 'id' AND (item_rec->>'id') IS NOT NULL AND (item_rec->>'id') != '' THEN
        BEGIN
          art_id := (item_rec->>'id')::uuid;
          UPDATE public.artworks
          SET availability = target_avail
          WHERE id = art_id;
        EXCEPTION WHEN OTHERS THEN
          -- Ignore invalid UUID format
        END;
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trg_sync_order_artwork_availability_insert_update ON public.orders;

CREATE TRIGGER trg_sync_order_artwork_availability_insert_update
  AFTER INSERT OR UPDATE OF status, items ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_sync_order_artwork_availability();

-- Function 3: Trigger function on inquiries table
CREATE OR REPLACE FUNCTION public.trg_sync_inquiry_artwork_availability()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.artwork_id IS NOT NULL THEN
    UPDATE public.artworks
    SET availability = 'reserved'
    WHERE id = NEW.artwork_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_inquiry_artwork_availability_insert ON public.inquiries;

CREATE TRIGGER trg_sync_inquiry_artwork_availability_insert
  AFTER INSERT ON public.inquiries
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_sync_inquiry_artwork_availability();

-- Update RLS policy on artworks so authenticated users can update availability
DROP POLICY IF EXISTS "Users update artwork availability on order" ON public.artworks;
CREATE POLICY "Users update artwork availability on order"
  ON public.artworks FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- Catch-up update: Sync any existing inquiries & orders that were created previously
UPDATE public.artworks
SET availability = 'reserved'
WHERE id IN (
  SELECT artwork_id FROM public.inquiries WHERE artwork_id IS NOT NULL
);
