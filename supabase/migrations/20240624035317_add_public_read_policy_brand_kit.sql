-- Enable RLS on the brand_kits table if not already enabled
ALTER TABLE public.brand_kits ENABLE ROW LEVEL SECURITY;

-- Drop the policy if it already exists to avoid conflicts
DROP POLICY IF EXISTS "Allow public read access to brand kits" ON public.brand_kits;

-- Create a policy that allows anyone to view brand kits
CREATE POLICY "Allow public read access to brand kits"
ON public.brand_kits
FOR SELECT
TO public
USING (true);

-- Comment: This policy allows any user (including unauthenticated users) to view all brand kits.
-- This is needed for the global gallery to display brand kit information like logos.
-- Note: If you want to restrict this in the future, consider adding conditions to the USING clause.
