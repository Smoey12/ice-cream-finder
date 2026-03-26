CREATE TABLE public.vendor_menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  price decimal(10,2),
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vendor_menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can manage own menu items" ON public.vendor_menu_items
  FOR ALL TO authenticated
  USING (auth.uid() = vendor_id)
  WITH CHECK (auth.uid() = vendor_id);

CREATE POLICY "Anyone can view vendor menu items" ON public.vendor_menu_items
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Anon can view live vendor locations" ON public.vendor_locations
  FOR SELECT TO anon
  USING (is_live = true);

CREATE POLICY "Anon can view vendor profiles" ON public.profiles
  FOR SELECT TO anon
  USING (role = 'vendor');