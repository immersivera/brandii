import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

export type UserProfile = {
  id: string;
  username: string | null;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  website: string | null;
  social_links: {
    twitter: string;
    github: string;
    linkedin: string;
  };
  preferences: {
    emailNotifications: boolean;
    darkMode: boolean | null;
  };
  created_at: string;
  updated_at: string;
};

export type GeneratedAsset = {
  id: string;
  brand_kit_id: string;
  image_data: string;
  image_prompt?: string;
  type: 'logo' | 'image';
  created_at: string;
};

export type BrandKit = {
  id: string;
  user_id: string;
  name: string;
  description: string;
  type: string;
  created_at: string;
  updated_at: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  logo: {
    type: string;
    text: string;
    image?: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
  };
  logo_selected_asset_id?: string;
  generated_assets?: GeneratedAsset[];
};

export type PaginatedResponse<T> = {
  data: T[];
  totalCount: number;
};

export async function uploadImageToStorage(file: File, userId: string): Promise<string> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('brand-logos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Error uploading file:', error);
      throw new Error('Failed to upload logo. Please try again.');
    }

    const { data: { publicUrl } } = supabase.storage
      .from('brand-logos')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Storage upload error:', error);
    throw error;
  }
}

export async function fetchUserProfile(): Promise<UserProfile | null> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    return null;
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }

  return data;
}

export async function updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    throw new Error('No authenticated user found');
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', session.user.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }

  return data;
}

export async function fetchBrandKits(
  page: number = 1,
  limit: number = 6,
  searchQuery: string = ''
): Promise<PaginatedResponse<BrandKit>> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    throw new Error('Authentication required');
  }

  const offset = (page - 1) * limit;

  // First get the total count
  const countQuery = supabase
    .from('brand_kits')
    .select('id', { count: 'exact' })
    .eq('user_id', session.user.id);

  // Add search filter if provided
  if (searchQuery) {
    countQuery.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
  }

  const { count: totalCount, error: countError } = await countQuery;

  if (countError) {
    console.error('Error fetching brand kits count:', countError);
    throw countError;
  }

  // Then fetch the paginated data with minimal generated_assets data
  const dataQuery = supabase
    .from('brand_kits')
    .select(`
      *,
      generated_assets!generated_assets_brand_kit_id_fkey (
        id,
        type,
        created_at
      )
    `)
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // Add search filter if provided
  if (searchQuery) {
    dataQuery.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
  }

  const { data: brandKits, error: dataError } = await dataQuery;

  if (dataError) {
    console.error('Error fetching brand kits:', dataError);
    throw dataError;
  }

  return {
    data: brandKits || [],
    totalCount: totalCount || 0
  };
}

export async function fetchBrandKitById(id: string): Promise<BrandKit | null> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    throw new Error('Authentication required');
  }

  const { data: brandKit, error: brandKitError } = await supabase
    .from('brand_kits')
    .select(`
      *,
      generated_assets!generated_assets_brand_kit_id_fkey (*)
    `)
    .eq('id', id)
    .eq('user_id', session.user.id)
    .single();

  if (brandKitError) {
    console.error('Error fetching brand kit:', brandKitError);
    throw brandKitError;
  }

  return brandKit;
}

export async function updateBrandKit(id: string, updates: Partial<BrandKit>): Promise<BrandKit> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    throw new Error('Authentication required');
  }

  // Exclude the generated_assets field from updates as it's a relationship, not a column
  const { generated_assets, ...updateData } = updates;

  const { data, error } = await supabase
    .from('brand_kits')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('user_id', session.user.id)
    .select(`
      *,
      generated_assets!generated_assets_brand_kit_id_fkey (*)
    `)
    .single();

  if (error) {
    console.error('Error updating brand kit:', error);
    throw error;
  }

  return data;
}

export async function saveGeneratedAssets(
  brandKitId: string, 
  imageDataArray: string[], 
  type: 'logo' | 'image' = 'logo',
  imagePrompt?: string
): Promise<GeneratedAsset[]> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    throw new Error('Authentication required');
  }

  const assets = imageDataArray.map(imageData => ({
    brand_kit_id: brandKitId,
    image_data: imageData,
    type,
    image_prompt: imagePrompt
  }));

  const { data, error } = await supabase
    .from('generated_assets')
    .insert(assets)
    .select();

  if (error) {
    console.error('Error saving generated assets:', error);
    throw error;
  }

  return data;
}

export async function deleteGeneratedAsset(id: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    throw new Error('Authentication required');
  }

  const { error } = await supabase
    .from('generated_assets')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting generated asset:', error);
    throw error;
  }
}

export async function saveBrandKit(brandKit: Omit<BrandKit, 'id' | 'created_at' | 'updated_at' | 'user_id'>, generatedLogoImages?: string[]): Promise<BrandKit> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    throw new Error('Authentication required');
  }

  const newBrandKit = {
    ...brandKit,
    user_id: session.user.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data: savedBrandKit, error: brandKitError } = await supabase
    .from('brand_kits')
    .insert([newBrandKit])
    .select()
    .single();

  if (brandKitError) {
    console.error('Error saving brand kit:', brandKitError);
    throw brandKitError;
  }

  if (generatedLogoImages && generatedLogoImages.length > 0) {
    try {
      const assets = await saveGeneratedAssets(savedBrandKit.id, generatedLogoImages, 'logo');
      
      // Set the first generated asset as the selected logo
      if (assets.length > 0) {
        await updateBrandKit(savedBrandKit.id, {
          logo_selected_asset_id: assets[0].id
        });
      }
      
      return {
        ...savedBrandKit,
        generated_assets: assets,
        logo_selected_asset_id: assets[0].id
      };
    } catch (error) {
      console.error('Error saving generated assets:', error);
      return savedBrandKit;
    }
  }

  return savedBrandKit;
}

export async function deleteBrandKit(id: string): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    throw new Error('Authentication required');
  }

  const { error } = await supabase
    .from('brand_kits')
    .delete()
    .eq('id', id)
    .eq('user_id', session.user.id);

  if (error) {
    console.error('Error deleting brand kit:', error);
    throw error;
  }

  return true;
}

export async function registerUser(email: string, password: string) {
  const { data: { user }, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return user;
}

export async function loginUser(email: string, password: string) {
  const { data: { user }, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return user;
}

export async function logoutUser() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}