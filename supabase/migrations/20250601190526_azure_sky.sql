-- Add type column to generated_assets table
ALTER TABLE public.generated_assets 
ADD COLUMN type text NOT NULL DEFAULT 'logo';

-- Add check constraint to ensure type is either 'logo' or 'image'
ALTER TABLE public.generated_assets 
ADD CONSTRAINT generated_assets_type_check 
CHECK (type IN ('logo', 'image'));

-- Update existing records to have type 'logo'
UPDATE public.generated_assets 
SET type = 'logo' 
WHERE type IS NULL;