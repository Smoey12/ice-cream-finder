
-- Vendor route stops table
CREATE TABLE public.vendor_route_stops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stop_name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  stop_order INTEGER NOT NULL DEFAULT 0,
  arrival_time TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vendor_route_stops ENABLE ROW LEVEL SECURITY;

-- Vendors manage own route stops
CREATE POLICY "Vendors can manage own route stops"
  ON public.vendor_route_stops FOR ALL TO authenticated
  USING (auth.uid() = vendor_id)
  WITH CHECK (auth.uid() = vendor_id);

-- Anyone can view route stops (for map display)
CREATE POLICY "Anyone can view route stops"
  ON public.vendor_route_stops FOR SELECT TO authenticated
  USING (true);

-- Anon can view route stops
CREATE POLICY "Anon can view route stops"
  ON public.vendor_route_stops FOR SELECT TO anon
  USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.vendor_route_stops;
