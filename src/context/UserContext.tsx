import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeAnonymousUser, supabase, type UserProfile } from '../lib/supabase';
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

  useEffect(() => {
    const initUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUserId(session.user.id);
          await fetchProfile(session);
        } else {
          const anonId = await initializeAnonymousUser();
          setUserId(anonId);
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
      if (session?.user) {
        setUserId(session.user.id);
        await fetchProfile(session);
      } else if (event === 'SIGNED_OUT') {
        const anonId = await initializeAnonymousUser();
        setUserId(anonId);
        setProfile(null);
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