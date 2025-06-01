-- Create user_profiles table
create table if not exists public.user_profiles (
    id uuid references auth.users not null primary key,
    username text unique,
    email text unique not null,
    full_name text,
    avatar_url text,
    bio text,
    website text,
    social_links jsonb default '{
        "twitter": "",
        "github": "",
        "linkedin": ""
    }'::jsonb,
    preferences jsonb default '{
        "emailNotifications": true,
        "darkMode": null
    }'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.user_profiles enable row level security;

-- Create RLS policies
create policy "Users can view their own profile"
    on public.user_profiles for select
    using (auth.uid() = id);

create policy "Users can insert their own profile"
    on public.user_profiles for insert
    with check (auth.uid() = id);

create policy "Users can update their own profile"
    on public.user_profiles for update
    using (auth.uid() = id);

-- Create function to handle updated_at
create or replace function public.handle_user_profile_updated()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql security definer;

-- Create trigger for updating updated_at
create trigger user_profiles_updated
    before update on public.user_profiles
    for each row
    execute procedure public.handle_user_profile_updated();

-- Create function to automatically create user profile
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.user_profiles (id, email)
    values (new.id, new.email);
    return new;
end;
$$ language plpgsql security definer;

-- Create trigger to create profile on signup
create trigger on_auth_user_created
    after insert on auth.users
    for each row
    execute procedure public.handle_new_user();