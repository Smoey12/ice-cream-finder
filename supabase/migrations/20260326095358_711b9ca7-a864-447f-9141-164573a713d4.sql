CREATE TABLE public.vendor_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL,
  payment_type text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'completed',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.wallet (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  balance decimal(10,2) NOT NULL DEFAULT 0,
  total_earned decimal(10,2) NOT NULL DEFAULT 0,
  total_withdrawn decimal(10,2) NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  amount decimal(10,2) NOT NULL,
  description text,
  reference_payment_id uuid REFERENCES public.vendor_payments(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.wallet (balance, total_earned, total_withdrawn) VALUES (0, 0, 0);

CREATE TABLE public.site_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.site_settings (key, value) VALUES
  ('site_name', 'UK Ice Cream Van Tracker'),
  ('hero_title', 'Find Ice Cream Vans Near You'),
  ('hero_subtitle', 'Real-time GPS tracking of ice cream vans across the UK'),
  ('monthly_price', '7.99'),
  ('yearly_price', '59.99'),
  ('photo_upload_price', '1.50');

ALTER TABLE public.vendor_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors see own payments" ON public.vendor_payments FOR SELECT TO authenticated USING (auth.uid() = vendor_id);
CREATE POLICY "Admins manage payments" ON public.vendor_payments FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins manage wallet" ON public.wallet FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins manage wallet transactions" ON public.wallet_transactions FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Anyone can read site settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage site settings" ON public.site_settings FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);