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

// Add this function to handle image deletion
export async function deleteGeneratedAsset(assetId: string): Promise<boolean> {
  const { error } = await supabase
    .from('generated_assets')
    .delete()
    .eq('id', assetId);

  if (error) {
    console.error('Error deleting asset:', error);
    throw error;
  }

  return true;
}