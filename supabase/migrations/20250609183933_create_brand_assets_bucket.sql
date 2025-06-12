-- Create the storage bucket for brand assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-assets', 'brand-assets', true);

-- Set up Row Level Security (RLS) for the bucket

-- Allow public read access to all files in the bucket
CREATE POLICY "Public read access for brand assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'brand-assets');

-- Restrict uploads to authenticated users only
CREATE POLICY "Authenticated users can upload brand assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'brand-assets' AND auth.role() = 'authenticated');

-- Users can only update their own brand assets
CREATE POLICY "Users can update their own brand assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'brand-assets' AND (auth.uid() = owner));

-- Users can only delete their own brand assets
CREATE POLICY "Users can delete their own brand assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'brand-assets' AND (auth.uid() = owner));

-- Add a trigger to automatically set the owner when a file is uploaded
CREATE OR REPLACE FUNCTION public.handle_new_asset()
RETURNS trigger AS $$
BEGIN
  NEW.owner := auth.uid();  -- Set the owner to the authenticated user
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_asset_created
AFTER INSERT ON storage.objects
FOR EACH ROW
WHEN (NEW.bucket_id = 'brand-assets')
EXECUTE FUNCTION public.handle_new_asset();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA storage TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA storage TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA storage TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA storage TO authenticated;