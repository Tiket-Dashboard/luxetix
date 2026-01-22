-- Add image_aspect_ratio column to concerts table
ALTER TABLE public.concerts 
ADD COLUMN image_aspect_ratio text DEFAULT 'auto';

-- Add comment for documentation
COMMENT ON COLUMN public.concerts.image_aspect_ratio IS 'Aspect ratio for poster image: auto, 1:1, 16:9, 4:3, 2:3, 3:4';