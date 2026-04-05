
-- Vendor wallets table for receiving payments from customer QR codes
CREATE TABLE public.vendor_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL UNIQUE,
  balance numeric NOT NULL DEFAULT 0,
  total_earned numeric NOT NULL DEFAULT 0,
  total_withdrawn numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vendor_wallets ENABLE ROW LEVEL SECURITY;

-- Vendors can read/update their own wallet
CREATE POLICY "Vendors can read own wallet" ON public.vendor_wallets FOR SELECT TO authenticated USING (auth.uid() = vendor_id);
CREATE POLICY "Vendors can update own wallet" ON public.vendor_wallets FOR UPDATE TO authenticated USING (auth.uid() = vendor_id);
CREATE POLICY "Vendors can insert own wallet" ON public.vendor_wallets FOR INSERT TO authenticated WITH CHECK (auth.uid() = vendor_id);

-- Admins manage all
CREATE POLICY "Admins manage vendor wallets" ON public.vendor_wallets FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Anon demo access
CREATE POLICY "Anon can manage vendor wallets (demo)" ON public.vendor_wallets FOR ALL TO anon USING (true) WITH CHECK (true);

-- Vendor cashouts table (unlimited, free)
CREATE TABLE public.vendor_cashouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL,
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'completed',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vendor_cashouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can read own cashouts" ON public.vendor_cashouts FOR SELECT TO authenticated USING (auth.uid() = vendor_id);
CREATE POLICY "Vendors can insert own cashouts" ON public.vendor_cashouts FOR INSERT TO authenticated WITH CHECK (auth.uid() = vendor_id);
CREATE POLICY "Anon can manage vendor cashouts (demo)" ON public.vendor_cashouts FOR ALL TO anon USING (true) WITH CHECK (true);
