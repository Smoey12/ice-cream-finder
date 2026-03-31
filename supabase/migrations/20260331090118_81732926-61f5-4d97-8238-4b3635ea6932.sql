
-- Customer wallets
CREATE TABLE public.customer_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  balance numeric NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own wallet" ON public.customer_wallets
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wallet" ON public.customer_wallets
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet" ON public.customer_wallets
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins manage wallets" ON public.customer_wallets
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Customer transactions
CREATE TABLE public.customer_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vendor_id uuid REFERENCES public.profiles(id),
  amount numeric NOT NULL,
  type text NOT NULL, -- 'top_up', 'purchase', 'reward'
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own transactions" ON public.customer_transactions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON public.customer_transactions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Vendors see purchases from them" ON public.customer_transactions
  FOR SELECT TO authenticated USING (auth.uid() = vendor_id);

CREATE POLICY "Admins manage transactions" ON public.customer_transactions
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Loyalty stamps
CREATE TABLE public.customer_loyalty (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  stamps integer NOT NULL DEFAULT 0,
  total_stamps integer NOT NULL DEFAULT 0,
  free_3_claimed integer NOT NULL DEFAULT 0,
  free_5_claimed integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_loyalty ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own loyalty" ON public.customer_loyalty
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own loyalty" ON public.customer_loyalty
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own loyalty" ON public.customer_loyalty
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins manage loyalty" ON public.customer_loyalty
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
