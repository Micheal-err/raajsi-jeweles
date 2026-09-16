-- Add order fulfillment, tracking, estimated delivery, and cancellation fields to orders table
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS tracking_number text,
  ADD COLUMN IF NOT EXISTS carrier_name text,
  ADD COLUMN IF NOT EXISTS estimated_delivery text,
  ADD COLUMN IF NOT EXISTS cancelled_at text,
  ADD COLUMN IF NOT EXISTS cancel_reason text;
