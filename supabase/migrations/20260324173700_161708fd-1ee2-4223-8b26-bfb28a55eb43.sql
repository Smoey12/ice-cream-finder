
-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('customer', 'vendor');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'customer',
  full_name TEXT,
  business_name TEXT,
  billing_cycle TEXT,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create vendor_locations table for live GPS tracking
CREATE TABLE public.vendor_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  is_live BOOLEAN NOT NULL DEFAULT false,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vendor_locations ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can see live vendor locations
CREATE POLICY "Anyone can view live vendor locations"
  ON public.vendor_locations FOR SELECT
  TO authenticated
  USING (is_live = true);

-- Vendors can manage their own location
CREATE POLICY "Vendors can insert own location"
  ON public.vendor_locations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = vendor_id);

CREATE POLICY "Vendors can update own location"
  ON public.vendor_locations FOR UPDATE
  TO authenticated
  USING (auth.uid() = vendor_id);

CREATE POLICY "Vendors can delete own location"
  ON public.vendor_locations FOR DELETE
  TO authenticated
  USING (auth.uid() = vendor_id);

-- Vendors can also read their own location even if not live
CREATE POLICY "Vendors can read own location"
  ON public.vendor_locations FOR SELECT
  TO authenticated
  USING (auth.uid() = vendor_id);

-- Enable realtime for vendor_locations
ALTER PUBLICATION supabase_realtime ADD TABLE public.vendor_locations;

-- Create trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, business_name, billing_cycle, trial_ends_at)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'customer'),
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'business_name',
    NEW.raw_user_meta_data->>'billing_cycle',
    CASE 
      WHEN (NEW.raw_user_meta_data->>'role') = 'vendor' 
      THEN now() + INTERVAL '14 days'
      ELSE NULL
    END
  );
  
  -- Auto-create vendor location entry
  IF (NEW.raw_user_meta_data->>'role') = 'vendor' THEN
    INSERT INTO public.vendor_locations (vendor_id, latitude, longitude, is_live)
    VALUES (NEW.id, 51.5074, -0.1278, false);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
