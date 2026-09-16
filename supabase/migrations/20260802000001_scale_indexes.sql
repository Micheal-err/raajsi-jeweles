-- ============================================================
-- Performance & Scale Hardening Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_artworks_availability ON public.artworks(availability);
CREATE INDEX IF NOT EXISTS idx_artworks_artist_id ON public.artworks(artist_id);
CREATE INDEX IF NOT EXISTS idx_artworks_slug ON public.artworks(slug);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_stock_reservations_artwork_status ON public.stock_reservations(artwork_id, status);
CREATE INDEX IF NOT EXISTS idx_stock_reservations_order_id ON public.stock_reservations(order_id);

CREATE INDEX IF NOT EXISTS idx_acquisition_cases_order_id ON public.acquisition_cases(order_id);

CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON public.cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_user_id ON public.wishlist_items(user_id);
