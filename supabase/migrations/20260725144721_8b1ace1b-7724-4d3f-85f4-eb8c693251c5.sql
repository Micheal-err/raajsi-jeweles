
DROP POLICY IF EXISTS "Anyone can submit inquiries" ON public.inquiries;
CREATE POLICY "Anyone can submit inquiries" ON public.inquiries
  FOR INSERT WITH CHECK (
    length(name) BETWEEN 1 AND 120
    AND length(email) BETWEEN 3 AND 254
    AND email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND length(message) BETWEEN 1 AND 4000
    AND (phone IS NULL OR length(phone) <= 40)
    AND (source_page IS NULL OR length(source_page) <= 200)
    AND status = 'new'
  );
