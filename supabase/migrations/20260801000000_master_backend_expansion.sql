-- Migration: Master Backend & Admin Panel Expansion
-- App Settings, Stock Reservations, Acquisition Cases, Admin Roles, Audit Logs, and Atomic Reservation RPC

-- 1. App Settings Table
CREATE TABLE IF NOT EXISTS public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

INSERT INTO public.app_settings (key, value)
VALUES ('acquisition_threshold_inr', '100000'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 2. Stock Reservations Table
CREATE TABLE IF NOT EXISTS public.stock_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artwork_id uuid REFERENCES public.artworks(id) ON DELETE CASCADE NOT NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','converted','released','expired')),
  reserved_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS one_active_reservation_per_artwork
  ON public.stock_reservations (artwork_id)
  WHERE status = 'active';

-- 3. Acquisition Cases Table (for ≥ ₹1 Lakh orders)
CREATE TABLE IF NOT EXISTS public.acquisition_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  assigned_admin uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  stage text NOT NULL DEFAULT 'new' CHECK (stage IN ('new','contacted','negotiating','kyc_pending','payment_pending','payment_received','closed_lost')),
  agreed_amount numeric(12,2),
  payment_method text,
  payment_reference text,
  notes text,
  hold_expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Admin Roles Table (Fine-grained RBAC)
CREATE TABLE IF NOT EXISTS public.admin_roles (
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  role text NOT NULL CHECK (role IN ('super_admin','order_manager','inventory_manager','support')),
  created_at timestamptz DEFAULT now()
);

-- 5. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  actor_type text CHECK (actor_type IN ('user','admin','system')),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  old_value jsonb,
  new_value jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

-- 6. Helper Function: Check Admin Access
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
  ) OR EXISTS (
    SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid()
  );
$$;

-- 7. Atomic Reserve Artwork RPC (Prevents Race Conditions)
CREATE OR REPLACE FUNCTION public.reserve_artwork(
  p_artwork_id uuid,
  p_order_id uuid,
  p_ttl_minutes int DEFAULT 30
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_avail text;
BEGIN
  -- Lock the artwork row for update
  SELECT availability INTO v_avail
  FROM public.artworks
  WHERE id = p_artwork_id
  FOR UPDATE;

  IF NOT FOUND OR v_avail != 'available' THEN
    RETURN false;
  END IF;

  -- Create active stock reservation
  INSERT INTO public.stock_reservations (artwork_id, order_id, status, expires_at)
  VALUES (p_artwork_id, p_order_id, 'active', now() + (p_ttl_minutes || ' minutes')::interval);

  -- Mark artwork status as reserved
  UPDATE public.artworks
  SET availability = 'reserved'
  WHERE id = p_artwork_id;

  RETURN true;
END;
$$;

-- Grant permissions to authenticated users
GRANT SELECT ON public.app_settings TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.reserve_artwork(uuid, uuid, int) TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON public.acquisition_cases TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.stock_reservations TO authenticated;
GRANT SELECT ON public.admin_roles TO authenticated;
GRANT SELECT ON public.audit_logs TO authenticated;

-- Enable RLS on new tables
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acquisition_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies for app_settings
DROP POLICY IF EXISTS "Public read app_settings" ON public.app_settings;
CREATE POLICY "Public read app_settings" ON public.app_settings FOR SELECT USING (true);

-- Policies for stock_reservations
DROP POLICY IF EXISTS "Admins manage stock_reservations" ON public.stock_reservations;
CREATE POLICY "Admins manage stock_reservations" ON public.stock_reservations FOR ALL TO authenticated USING (public.is_admin());

-- Policies for acquisition_cases
DROP POLICY IF EXISTS "Admins manage acquisition_cases" ON public.acquisition_cases;
CREATE POLICY "Admins manage acquisition_cases" ON public.acquisition_cases FOR ALL TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Users insert acquisition_cases" ON public.acquisition_cases;
CREATE POLICY "Users insert acquisition_cases" ON public.acquisition_cases FOR INSERT TO authenticated WITH CHECK (true);

-- Policies for admin_roles
DROP POLICY IF EXISTS "Admins manage admin_roles" ON public.admin_roles;
CREATE POLICY "Admins manage admin_roles" ON public.admin_roles FOR ALL TO authenticated USING (public.is_admin());

-- Policies for audit_logs
DROP POLICY IF EXISTS "Admins read audit_logs" ON public.audit_logs;
CREATE POLICY "Admins read audit_logs" ON public.audit_logs FOR SELECT TO authenticated USING (public.is_admin());

-- 8. Auto-create acquisition case trigger on orders table
CREATE OR REPLACE FUNCTION public.trg_auto_create_acquisition_case()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'inquiry_sent' OR NEW.total >= 100000 THEN
    INSERT INTO public.acquisition_cases (order_id, stage, hold_expires_at, notes)
    VALUES (
      NEW.id,
      'new',
      now() + interval '72 hours',
      'High-value acquisition order created via checkout. Total: ₹' || NEW.total
    )
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_create_acquisition_case ON public.orders;

CREATE TRIGGER trg_auto_create_acquisition_case
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_auto_create_acquisition_case();

-- Catch-up Insert: Automatically populate acquisition_cases for existing orders >= 1 Lakh or inquiry_sent
INSERT INTO public.acquisition_cases (order_id, stage, hold_expires_at, notes)
SELECT 
  o.id,
  'new',
  now() + interval '72 hours',
  'High-value acquisition order catch-up. Total: ₹' || COALESCE(o.total, 0)
FROM public.orders o
WHERE (o.status = 'inquiry_sent' OR COALESCE(o.total, 0) >= 100000)
  AND NOT EXISTS (
    SELECT 1 FROM public.acquisition_cases ac WHERE ac.order_id = o.id
  );
