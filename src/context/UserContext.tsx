import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, type UserProfile } from '../lib/supabase';
import toast from 'react-hot-toast';

interface UserContextType {
  userId: string | null;
  isLoading: boolean;
  profile: UserProfile | null;
  refreshProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const fetchProfile = async (id: string) => {
    try {
      
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setProfile(data);
      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast.error('Failed to load user profile');
      setProfile(null);
      return null;
    }
  };

  const refreshProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await fetchProfile(session.user.id);
    } else {
      setProfile(null);
    }
  };

  useEffect(() => {
    let isSubscribed = true;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user && isSubscribed) {
          setUserId(session.user.id);
          // Wait for profile to be fetched
         await fetchProfile(session.user.id);
        } else if (isSubscribed) {
          setUserId(null);
          setProfile(null);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (isSubscribed) {
          console.log('set profile to null')
          setUserId(null);
          setProfile(null);
        }
      } finally {
        if (isSubscribed) {
          setIsLoading(false);
        }
      }
    };

    // Initialize auth state
    initializeAuth();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isSubscribed) return;

      if (session?.user) {
        setUserId(session.user.id);
        fetchProfile(session.user.id);
      } else {
        setUserId(null);
        setProfile(null);
      }
    });

    // Cleanup
    return () => {
      isSubscribed = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <UserContext.Provider value={{ 
      userId, 
      isLoading, 
      profile,
      refreshProfile 
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};