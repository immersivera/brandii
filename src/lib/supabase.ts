import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
    symbol?: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
  };
};

export async function initializeAnonymousUser() {
  const storedToken = localStorage.getItem('brandii-user-token');
  
  if (!storedToken) {
    const token = generateUniqueId();
    localStorage.setItem('brandii-user-token', token);
    return token;
  }
  
  return storedToken;
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

export async function fetchBrandKits(): Promise<BrandKit[]> {
  const userId = localStorage.getItem('brandii-user-token');
  
  if (!userId) {
    return [];
  }

  const { data, error } = await supabase
    .from('brand_kits')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching brand kits:', error);
    throw error;
  }

  return data || [];
}

export async function saveBrandKit(brandKit: Omit<BrandKit, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<BrandKit> {
  const userId = localStorage.getItem('brandii-user-token');
  
  if (!userId) {
    throw new Error('No user token found');
  }

  const newBrandKit = {
    ...brandKit,
    user_id: userId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('brand_kits')
    .insert([newBrandKit])
    .select()
    .single();

  if (error) {
    console.error('Error saving brand kit:', error);
    throw error;
  }

  return data;
}

export async function deleteBrandKit(id: string): Promise<boolean> {
  const userId = localStorage.getItem('brandii-user-token');
  
  if (!userId) {
    throw new Error('No user token found');
  }

  const { error } = await supabase
    .from('brand_kits')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

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

  if (user) {
    const currentToken = localStorage.getItem('brandii-user-token');
    
    if (currentToken) {
      // Transfer anonymous creations to the new user
      const { error: updateError } = await supabase
        .from('brand_kits')
        .update({ user_id: user.id })
        .eq('user_id', currentToken);

      if (updateError) {
        console.error('Error transferring brand kits:', updateError);
      }
    }

    localStorage.setItem('brandii-user-token', user.id);
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

  if (user) {
    localStorage.setItem('brandii-user-token', user.id);
  }

  return user;
}

export async function logoutUser() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }

  // Generate new anonymous token
  const newToken = await initializeAnonymousUser();
  localStorage.setItem('brandii-user-token', newToken);
}

function generateUniqueId(): string {
  return `anon_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
}