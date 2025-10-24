
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import { notifyError, notifySuccess } from '../services/notificationService';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  register: (email: string, pass: string) => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
  updatePassword: (password: string) => Promise<boolean>;
  deleteAccount: () => Promise<boolean>;
  loginWithGoogle: () => void;
  loginWithLinkedIn: () => void;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setIsLoading(false);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, pass: string): Promise<boolean> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) {
      notifyError(error.message);
      return false;
    }
    notifySuccess('Logged in successfully!');
    return true;
  };

  const register = async (email: string, pass: string): Promise<boolean> => {
    const { error } = await supabase.auth.signUp({ email, password: pass });
    if (error) {
      notifyError(error.message);
      return false;
    }
    notifySuccess('Account created! Please check your email to verify.');
    return true;
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      notifyError(error.message);
      return false;
    }
    notifySuccess('Password reset link sent! Please check your email.');
    return true;
  };

  const updatePassword = async (password: string): Promise<boolean> => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      notifyError(error.message);
      return false;
    }
    notifySuccess('Password updated successfully.');
    return true;
  };

  const deleteAccount = async (): Promise<boolean> => {
    const { error } = await supabase.rpc('delete_user_account');
    if (error) {
      notifyError(error.message);
      return false;
    }
    notifySuccess('Account deleted successfully.');
    setUser(null); // Log out user
    return true;
  };

  const loginWithGoogle = () => {
    supabase.auth.signInWithOAuth({ provider: 'google' });
  };

  const loginWithLinkedIn = () => {
    supabase.auth.signInWithOAuth({ provider: 'linkedin' });
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const value = {
    isAuthenticated: !!user,
    user,
    isLoading,
    login,
    logout,
    register,
    resetPassword,
    updatePassword,
    deleteAccount,
    loginWithGoogle,
    loginWithLinkedIn,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
