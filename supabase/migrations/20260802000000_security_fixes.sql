-- ============================================================
-- Security fixes from code audit (see DEBUG_REPORT.md)
-- Addresses: C1, C2, C3, C5, H2 (enforcement), H5
--
-- Reviewed by inspection only — this has NOT been run against a
-- live Supabase project. Apply to a dev/staging project first.
-- ============================================================

-- ------------------------------------------------------------
-- C1. Stop customers from self-granting admin access.
-- Column-level GRANT is independent of, and stacks with, RLS —
-- both must allow an update for it to succeed. Customers keep
-- the ability to update their own display name; is_admin (and
-- any other future privileged column) is no longer reachable
-- through the standard authenticated grant at all.
-- ------------------------------------------------------------
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (display_name, updated_at) ON public.profiles TO authenticated;

-- ------------------------------------------------------------
-- C2. Remove the blanket "any authenticated user can update any
-- artwork" policy. Admins keep their existing "Admins manage
-- artworks" policy. Everyone else goes through the RPC below.
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Users update artwork availability on order" ON public.artworks;

-- ------------------------------------------------------------
-- C3. Rewrite update_artworks_availability so it actually checks
-- who's calling it: admins may touch anything, everyone else may
-- only affect artworks tied to an order they own. Revoke anon.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_artworks_availability(
  p_artwork_ids uuid[],
  p_availability text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_availability NOT IN ('available', 'reserved', 'sold', 'not_for_sale') THEN
    RAISE EXCEPTION 'Invalid availability value: %', p_availability;
  END IF;

  IF public.is_admin() THEN
    UPDATE public.artworks
    SET availability = p_availability::public.availability
    WHERE id = ANY(p_artwork_ids);
    RETURN;
  END IF;

  -- Non-admins may only affect artworks tied to one of their own orders
  UPDATE public.artworks a
  SET availability = p_availability::public.availability
  WHERE a.id = ANY(p_artwork_ids)
  AND EXISTS (
    SELECT 1
    FROM public.stock_reservations sr
    JOIN public.orders o ON o.id = sr.order_id
    WHERE sr.artwork_id = a.id
    AND o.user_id = v_uid
  );
END;
$$;

REVOKE ALL ON FUNCTION public.update_artworks_availability(uuid[], text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_artworks_availability(uuid[], text) FROM anon;
GRANT EXECUTE ON FUNCTION public.update_artworks_availability(uuid[], text) TO authenticated;

-- reserve_artwork should also never have been callable by anon —
-- reservations only make sense against an authenticated user's order.
REVOKE ALL ON FUNCTION public.reserve_artwork(uuid, uuid, int) FROM anon;
GRANT EXECUTE ON FUNCTION public.reserve_artwork(uuid, uuid, int) TO authenticated;

-- ------------------------------------------------------------
-- C5 / H2. Replace unrestricted customer order UPDATEs with a
-- narrow, validated self-cancellation RPC. After this, customers
-- have no direct table-level UPDATE path on orders at all —
-- admins keep their existing separately-scoped policy.
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Owners update own orders" ON public.orders;

CREATE OR REPLACE FUNCTION public.cancel_own_order(
  p_order_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_status text;
  v_created_at timestamptz;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT status, created_at INTO v_status, v_created_at
  FROM public.orders
  WHERE id = p_order_id AND user_id = v_uid
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_status NOT IN ('inquiry_sent', 'confirmed') THEN
    RAISE EXCEPTION 'This order is no longer eligible for self-cancellation';
  END IF;

  IF now() - v_created_at > interval '24 hours' THEN
    RAISE EXCEPTION 'The 24-hour self-cancellation window has passed';
  END IF;

  UPDATE public.orders
  SET status = 'cancelled',
      cancelled_at = now()::text, -- column is currently `text`; see DEBUG_REPORT.md Medium notes
      cancel_reason = COALESCE(p_reason, 'Cancelled by customer within 24-hour window'),
      updated_at = now()
  WHERE id = p_order_id;

  -- artwork availability is restored automatically by the existing
  -- trg_sync_order_artwork_availability trigger on this status change.
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancel_own_order(uuid, text) TO authenticated;

-- ------------------------------------------------------------
-- H5. acquisition_cases can currently be inserted against ANY
-- order_id. Require the caller to actually own that order.
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Users insert acquisition_cases" ON public.acquisition_cases;
DROP POLICY IF EXISTS "Users insert own acquisition_cases" ON public.acquisition_cases;

CREATE POLICY "Users insert own acquisition_cases"
  ON public.acquisition_cases FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND o.user_id = auth.uid()
    )
  );
