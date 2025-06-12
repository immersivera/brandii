-- Add image_url column to generated_assets table
ALTER TABLE public.generated_assets 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Update comment for the new column
COMMENT ON COLUMN public.generated_assets.image_url IS 'URL of the generated image';

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;
