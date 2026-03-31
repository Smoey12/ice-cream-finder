
CREATE TABLE public.vendor_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewer_name text NOT NULL DEFAULT 'Anonymous',
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.vendor_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read reviews
CREATE POLICY "Anyone can read reviews" ON public.vendor_reviews
  FOR SELECT TO public USING (true);

-- Authenticated users can insert reviews
CREATE POLICY "Authenticated users can insert reviews" ON public.vendor_reviews
  FOR INSERT TO authenticated WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.vendor_reviews;
