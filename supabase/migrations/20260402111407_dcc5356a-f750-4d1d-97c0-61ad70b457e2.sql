
CREATE TABLE public.customer_cashouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'completed',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_cashouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own cashouts" ON public.customer_cashouts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cashouts" ON public.customer_cashouts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anon can manage cashouts (demo)" ON public.customer_cashouts
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Admins manage cashouts" ON public.customer_cashouts
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
