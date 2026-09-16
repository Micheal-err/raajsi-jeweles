
-- Add is_admin flag to profiles for admin panel access
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- Admin RLS policies: admins can read/update all rows in managed tables

-- Orders: admins can read and update all orders
CREATE POLICY "Admins read all orders"
  ON public.orders FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins update all orders"
  ON public.orders FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Inquiries: admins can read and update all inquiries
CREATE POLICY "Admins read all inquiries"
  ON public.inquiries FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins update all inquiries"
  ON public.inquiries FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Artworks: admins can insert, update, delete
CREATE POLICY "Admins manage artworks"
  ON public.artworks FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Artists: admins can insert, update, delete
CREATE POLICY "Admins manage artists"
  ON public.artists FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Grant necessary permissions
GRANT SELECT, UPDATE ON public.inquiries TO authenticated;
GRANT UPDATE ON public.artworks TO authenticated;
GRANT UPDATE ON public.artists TO authenticated;
GRANT INSERT ON public.artworks TO authenticated;
GRANT INSERT ON public.artists TO authenticated;
GRANT DELETE ON public.artworks TO authenticated;
GRANT DELETE ON public.artists TO authenticated;
