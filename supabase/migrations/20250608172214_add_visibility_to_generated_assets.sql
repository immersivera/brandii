-- Add visibility column to generated_assets table
ALTER TABLE public.generated_assets 
ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'public' 
CHECK (visibility IN ('public', 'private', 'restricted'));

-- Update comment for the new column
COMMENT ON COLUMN public.generated_assets.visibility IS 'Visibility setting for the asset. Can be public, private, or restricted.';
