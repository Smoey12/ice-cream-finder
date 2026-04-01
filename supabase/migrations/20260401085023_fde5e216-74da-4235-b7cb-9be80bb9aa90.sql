-- Allow anon access to customer_wallets for demo mode
CREATE POLICY "Anon can manage wallets (demo)" ON public.customer_wallets FOR ALL TO anon USING (true) WITH CHECK (true);

-- Allow anon access to customer_transactions for demo mode
CREATE POLICY "Anon can manage transactions (demo)" ON public.customer_transactions FOR ALL TO anon USING (true) WITH CHECK (true);

-- Allow anon access to customer_loyalty for demo mode
CREATE POLICY "Anon can manage loyalty (demo)" ON public.customer_loyalty FOR ALL TO anon USING (true) WITH CHECK (true);

-- Allow anon access to vendor_payments for demo mode
CREATE POLICY "Anon can insert vendor payments (demo)" ON public.vendor_payments FOR INSERT TO anon WITH CHECK (true);

-- Allow anon access to wallet for demo mode
CREATE POLICY "Anon can manage site wallet (demo)" ON public.wallet FOR ALL TO anon USING (true) WITH CHECK (true);

-- Allow anon access to wallet_transactions for demo mode
CREATE POLICY "Anon can manage wallet transactions (demo)" ON public.wallet_transactions FOR ALL TO anon USING (true) WITH CHECK (true);

-- Allow anon to view menu items
CREATE POLICY "Anon can view menu items" ON public.vendor_menu_items FOR SELECT TO anon USING (true);