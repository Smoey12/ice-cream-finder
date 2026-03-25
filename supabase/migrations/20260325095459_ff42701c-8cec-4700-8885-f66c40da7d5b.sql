-- Add van_photo_url to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS van_photo_url text;

-- Create storage bucket for van photos
INSERT INTO storage.buckets (id, name, public) VALUES ('van-photos', 'van-photos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS: anyone can view van photos
CREATE POLICY "Anyone can view van photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'van-photos');

-- RLS: authenticated users can upload their own van photos
CREATE POLICY "Users can upload van photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'van-photos');

-- RLS: users can update their own van photos
CREATE POLICY "Users can update own van photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'van-photos');

-- RLS: users can delete their own van photos
CREATE POLICY "Users can delete own van photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'van-photos');