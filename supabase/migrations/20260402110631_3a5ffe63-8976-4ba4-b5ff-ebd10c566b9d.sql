
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS account_type text NOT NULL DEFAULT 'solo',
  ADD COLUMN IF NOT EXISTS fleet_van_count integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS parent_vendor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Update demo vendors to be solo
UPDATE public.profiles SET account_type = 'solo' WHERE role = 'vendor';
