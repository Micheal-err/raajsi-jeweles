
-- 1. display_price on artworks
ALTER TABLE public.artworks ADD COLUMN IF NOT EXISTS display_price numeric;

-- Backfill display_price by medium bucket, deterministic per slug so it's stable
UPDATE public.artworks SET display_price = ROUND(
  CASE
    WHEN medium ILIKE '%paper%' OR medium ILIKE '%print%' OR medium ILIKE '%photo%'
      THEN 25000 + (abs(hashtext(slug)) % 175000)
    WHEN medium ILIKE '%sculpt%' OR medium ILIKE '%bronze%' OR medium ILIKE '%stone%' OR medium ILIKE '%wood%'
      THEN 120000 + (abs(hashtext(slug)) % 1080000)
    ELSE 45000 + (abs(hashtext(slug)) % 805000)
  END / 1000.0
) * 1000
WHERE display_price IS NULL;

-- Keep fixed price display in sync
UPDATE public.artworks
SET price_display = 'fixed', price_min = display_price
WHERE display_price IS NOT NULL;

-- 2. Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Cart
CREATE TABLE IF NOT EXISTS public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artwork_id uuid NOT NULL REFERENCES public.artworks(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, artwork_id)
);
GRANT SELECT, INSERT, DELETE ON public.cart_items TO authenticated;
GRANT ALL ON public.cart_items TO service_role;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own cart" ON public.cart_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users add own cart" ON public.cart_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users remove own cart" ON public.cart_items FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 4. Wishlist
CREATE TABLE IF NOT EXISTS public.wishlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artwork_id uuid NOT NULL REFERENCES public.artworks(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, artwork_id)
);
GRANT SELECT, INSERT, DELETE ON public.wishlist_items TO authenticated;
GRANT ALL ON public.wishlist_items TO service_role;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own wishlist" ON public.wishlist_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users add own wishlist" ON public.wishlist_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users remove own wishlist" ON public.wishlist_items FOR DELETE TO authenticated USING (auth.uid() = user_id);
