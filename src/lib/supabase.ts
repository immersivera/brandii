import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface UserProfile {
  id: string;
  username: string | null;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  website: string | null;
  social_links: {
    github: string;
    twitter: string;
    linkedin: string;
  } | null;
  preferences: {
    darkMode: boolean | null;
    emailNotifications: boolean;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface BrandKit {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  type: string | null;
  created_at: string;
  updated_at: string;
  colors: {
    text: string;
    accent: string;
    primary: string;
    secondary: string;
    background: string;
  };
  logo: {
    text: string;
    type: 'wordmark';
  };
  typography: {
    bodyFont: string;
    headingFont: string;
  };
  logo_selected_asset_id: string | null;
}

export interface GeneratedAsset {
  id: string;
  brand_kit_id: string;
  image_data: string;
  created_at: string;
  type: 'logo' | 'image';
}

export async function initializeAnonymousUser(): Promise<string> {
  const anonymousId = 'anon_' + Math.random().toString(36).substring(2, 15);
  
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    // Store the anonymous ID in localStorage
    localStorage.setItem('anonymousId', anonymousId);
    
    return anonymousId;
  } catch (error) {
    console.error('Error initializing anonymous user:', error);
    throw error;
  }
}

export async function fetchBrandKits(
  page: number = 1,
  limit: number = 10,
  search?: string
): Promise<{ data: BrandKit[]; count: number }> {
  try {
    let query = supabase
      .from('brand_kits')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: data as BrandKit[],
      count: count || 0,
    };
  } catch (error) {
    console.error('Error fetching brand kits:', error);
    throw error;
  }
}

export async function fetchBrandKitById(id: string): Promise<BrandKit | null> {
  try {
    const { data, error } = await supabase
      .from('brand_kits')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return data as BrandKit;
  } catch (error) {
    console.error('Error fetching brand kit:', error);
    throw error;
  }
}

export async function saveBrandKit(brandKit: Partial<BrandKit>): Promise<BrandKit> {
  try {
    const { data, error } = await supabase
      .from('brand_kits')
      .insert([brandKit])
      .select()
      .single();

    if (error) throw error;

    return data as BrandKit;
  } catch (error) {
    console.error('Error saving brand kit:', error);
    throw error;
  }
}

export async function updateBrandKit(
  id: string,
  updates: Partial<BrandKit>
): Promise<BrandKit> {
  try {
    const { data, error } = await supabase
      .from('brand_kits')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return data as BrandKit;
  } catch (error) {
    console.error('Error updating brand kit:', error);
    throw error;
  }
}

export async function deleteBrandKit(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('brand_kits')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error deleting brand kit:', error);
    throw error;
  }
}

export async function saveGeneratedAsset(
  brandKitId: string,
  imageData: string,
  type: 'logo' | 'image' = 'logo'
): Promise<GeneratedAsset> {
  try {
    const { data, error } = await supabase
      .from('generated_assets')
      .insert([
        {
          brand_kit_id: brandKitId,
          image_data: imageData,
          type,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return data as GeneratedAsset;
  } catch (error) {
    console.error('Error saving generated asset:', error);
    throw error;
  }
}

export async function deleteGeneratedAsset(assetId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('generated_assets')
      .delete()
      .eq('id', assetId);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error deleting asset:', error);
    throw error;
  }
}