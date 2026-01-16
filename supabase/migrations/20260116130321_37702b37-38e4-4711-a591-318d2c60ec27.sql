-- Create storage bucket for concert images
INSERT INTO storage.buckets (id, name, public)
VALUES ('concert-images', 'concert-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to concert images
CREATE POLICY "Public can view concert images"
ON storage.objects FOR SELECT
USING (bucket_id = 'concert-images');

-- Allow authenticated users to upload concert images (admin check in app)
CREATE POLICY "Authenticated users can upload concert images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'concert-images' AND auth.role() = 'authenticated');

-- Allow authenticated users to update concert images
CREATE POLICY "Authenticated users can update concert images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'concert-images' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete concert images
CREATE POLICY "Authenticated users can delete concert images"
ON storage.objects FOR DELETE
USING (bucket_id = 'concert-images' AND auth.role() = 'authenticated');

-- Add ticket_code column to order_items for QR validation
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS ticket_code UUID DEFAULT gen_random_uuid() UNIQUE;