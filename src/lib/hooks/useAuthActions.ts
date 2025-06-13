import { useState } from 'react';
import { supabase } from '../supabase';
import type { AuthError } from '@supabase/supabase-js';

export function useAuthActions() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return user;
    } catch (err) {
      const authError = err as AuthError;
      setError(authError);
      throw authError;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { user }, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      return user;
    } catch (err) {
      const authError = err as AuthError;
      setError(authError);
      throw authError;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (err) {
      const authError = err as AuthError;
      setError(authError);
      throw authError;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password',
      });
      
      if (error) throw error;
    } catch (err) {
      const authError = err as AuthError;
      setError(authError);
      throw authError;
    } finally {
      setIsLoading(false);
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (error) throw error;
    } catch (err) {
      const authError = err as AuthError;
      setError(authError);
      throw authError;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithMagicLink = async (email: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin + '/dashboard',
        },
      });
      
      if (error) throw error;
    } catch (err) {
      const authError = err as AuthError;
      setError(authError);
      throw authError;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    signInWithMagicLink,
  };
}