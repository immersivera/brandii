-- Create storage bucket for brand logos
insert into storage.buckets (id, name, public)
values ('brand-logos', 'brand-logos', true);

-- Enable RLS for the bucket
update storage.buckets
set public = false,
    avif_autodetection = false,
    file_size_limit = 10485760, -- 10MB
    allowed_mime_types = array['image/png', 'image/jpeg', 'image/gif', 'image/webp']
where id = 'brand-logos';

-- Create storage policies
create policy "Anyone can view brand logos"
  on storage.objects for select
  using ( bucket_id = 'brand-logos' );

create policy "Authenticated users can upload brand logos"
  on storage.objects for insert
  with check (
    bucket_id = 'brand-logos'
    and (auth.role() = 'authenticated' or auth.uid()::text = (storage.foldername(name))[1])
  );

create policy "Users can update their own brand logos"
  on storage.objects for update
  using (
    bucket_id = 'brand-logos'
    and (auth.role() = 'authenticated' or auth.uid()::text = (storage.foldername(name))[1])
  );

create policy "Users can delete their own brand logos"
  on storage.objects for delete
  using (
    bucket_id = 'brand-logos'
    and (auth.role() = 'authenticated' or auth.uid()::text = (storage.foldername(name))[1])
  );