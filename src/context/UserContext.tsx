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
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast.error('Failed to load user profile');
      setProfile(null);
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
    let isInitialLoadHandled = false;

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        await fetchProfile(session.user.id);
      } else {
        setUserId(null);
        setProfile(null);
      }

      // Only set isLoading to false after the first event
      if (!isInitialLoadHandled) {
        setIsLoading(false);
        isInitialLoadHandled = true;
      }
    });

    // Immediately check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
        fetchProfile(session.user.id);
      } else {
        setUserId(null);
        setProfile(null);
      }
      
      // Set isLoading to false if onAuthStateChange hasn't fired yet
      if (!isInitialLoadHandled) {
        setIsLoading(false);
        isInitialLoadHandled = true;
      }
    }).catch(error => {
      console.error('Error getting session on initial load:', error);
      setUserId(null);
      setProfile(null);
      if (!isInitialLoadHandled) {
        setIsLoading(false);
        isInitialLoadHandled = true;
      }
    });

    return () => {
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