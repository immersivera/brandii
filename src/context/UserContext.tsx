import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, type UserProfile } from '../lib/supabase';
import toast from 'react-hot-toast';

interface UserContextType {
  userId: string | null;
  isAnonymous: boolean;
  isLoading: boolean;
  profile: UserProfile | null;
  refreshProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const fetchProfile = async (session: any) => {
    if (!session?.user) {
      setProfile(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast.error('Failed to load user profile');
    }
  };

  const refreshProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    await fetchProfile(session);
  };

  const generateAnonymousId = () => {
    return `anon_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
  };

  useEffect(() => {
    const initUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        let currentUserId: string | null = null;

        if (session?.user) {
          currentUserId = session.user.id;
          await fetchProfile(session);
        } else {
          // Check for existing anonymous token
          const storedToken = localStorage.getItem('brandii-user-token');
          
          if (!storedToken || !storedToken.startsWith('anon_')) {
            // Generate new anonymous ID if none exists or if stored token is invalid
            currentUserId = generateAnonymousId();
          } else {
            currentUserId = storedToken;
          }
        }

        if (currentUserId) {
          setUserId(currentUserId);
          localStorage.setItem('brandii-user-token', currentUserId);
        }
      } catch (error) {
        console.error('Error initializing user:', error);
        toast.error('Failed to initialize user session');
      } finally {
        setIsLoading(false);
      }
    };

    initUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      let currentUserId: string | null = null;

      if (session?.user) {
        currentUserId = session.user.id;
        await fetchProfile(session);
      } else if (event === 'SIGNED_OUT') {
        currentUserId = generateAnonymousId();
        setProfile(null);
      }

      if (currentUserId) {
        setUserId(currentUserId);
        localStorage.setItem('brandii-user-token', currentUserId);
      } else {
        setUserId(null);
        localStorage.removeItem('brandii-user-token');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const isAnonymous = userId?.startsWith('anon_') ?? true;

  return (
    <UserContext.Provider value={{ 
      userId, 
      isAnonymous, 
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