
-- Customer favorites table
CREATE TABLE public.customer_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  vendor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, vendor_id)
);

ALTER TABLE public.customer_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own favorites" ON public.customer_favorites FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own favorites" ON public.customer_favorites FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own favorites" ON public.customer_favorites FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Anon can manage favorites (demo)" ON public.customer_favorites FOR ALL TO anon USING (true) WITH CHECK (true);

-- Customer stop requests table
CREATE TABLE public.customer_stop_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  vendor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_stop_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own requests" ON public.customer_stop_requests FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own requests" ON public.customer_stop_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Vendors can see requests for them" ON public.customer_stop_requests FOR SELECT TO authenticated USING (auth.uid() = vendor_id);
CREATE POLICY "Vendors can update requests for them" ON public.customer_stop_requests FOR UPDATE TO authenticated USING (auth.uid() = vendor_id);
CREATE POLICY "Anon can manage stop requests (demo)" ON public.customer_stop_requests FOR ALL TO anon USING (true) WITH CHECK (true);

-- Enable realtime for stop requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.customer_stop_requests;
