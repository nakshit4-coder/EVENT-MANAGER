import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Profile, UserRole } from '../types';
import { supabase, isSupabaseConfigured, localStore } from '../lib/supabase';

interface AuthContextType {
  user: Profile | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, fullName: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  switchPersona: (role: UserRole) => void;
  updateProfile: (updates: Partial<Profile>) => Promise<boolean>;
  resetPassword: (email: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize session
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);

      if (isSupabaseConfigured) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profile) {
              setUser(profile as Profile);
              setIsLoading(false);
              return;
            }
          }
        } catch (err) {
          console.error('Supabase auth init error:', err);
        }
      }

      // Check local saved session
      const savedUserId = localStorage.getItem('eventify_current_user_id');
      if (savedUserId) {
        const profile = localStore.getProfile(savedUserId);
        if (profile) {
          setUser(profile);
          setIsLoading(false);
          return;
        }
      }

      // Default demo initial user: Alex Rivera (Attendee)
      const defaultUser = localStore.getProfile('user-attendee-1');
      if (defaultUser) {
        setUser(defaultUser);
        localStorage.setItem('eventify_current_user_id', defaultUser.id);
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    if (isSupabaseConfigured && password) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { success: false, error: error.message };
        if (data.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (profile) {
            setUser(profile as Profile);
            localStorage.setItem('eventify_current_user_id', profile.id);
            return { success: true };
          }
        }
      } catch (err: any) {
        return { success: false, error: err.message || 'Login failed' };
      }
    }

    // Local / offline fallback
    const profiles = localStore.getProfiles();
    const existing = profiles.find(p => p.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      if (existing.is_suspended) {
        return { success: false, error: 'This account has been suspended by administration.' };
      }
      setUser(existing);
      localStorage.setItem('eventify_current_user_id', existing.id);
      return { success: true };
    }

    return { success: false, error: 'No user registered with this email address.' };
  };

  const register = async (
    email: string, 
    password: string, 
    fullName: string, 
    role: UserRole
  ): Promise<{ success: boolean; error?: string }> => {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, role }
          }
        });
        if (error) return { success: false, error: error.message };

        if (data.user) {
          // Upsert to profiles table
          const newProfile: Profile = {
            id: data.user.id,
            email,
            full_name: fullName,
            role,
            is_suspended: false,
            created_at: new Date().toISOString()
          };

          await supabase.from('profiles').upsert(newProfile);
          setUser(newProfile);
          localStorage.setItem('eventify_current_user_id', newProfile.id);
          return { success: true };
        }
      } catch (err: any) {
        return { success: false, error: err.message || 'Registration failed' };
      }
    }

    // Local / offline fallback
    const profiles = localStore.getProfiles();
    if (profiles.some(p => p.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, error: 'An account with this email already exists.' };
    }

    const newProfile: Profile = {
      id: `user-${Date.now()}`,
      email,
      full_name: fullName,
      role,
      is_suspended: false,
      avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`,
      created_at: new Date().toISOString()
    };

    localStore.updateProfile(newProfile);
    setUser(newProfile);
    localStorage.setItem('eventify_current_user_id', newProfile.id);
    return { success: true };
  };

  const loginWithGoogle = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
    } else {
      // Simulate Google OAuth
      const googleUser: Profile = {
        id: 'user-google-oauth',
        full_name: 'Alex Rivera (Google)',
        email: 'alex.rivera@gmail.com',
        role: 'attendee',
        avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
        created_at: new Date().toISOString()
      };
      localStore.updateProfile(googleUser);
      setUser(googleUser);
      localStorage.setItem('eventify_current_user_id', googleUser.id);
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem('eventify_current_user_id');
  };

  const switchPersona = (role: UserRole) => {
    let targetProfileId = 'user-attendee-1';
    if (role === 'organizer') targetProfileId = 'user-organizer-1';
    if (role === 'admin') targetProfileId = 'user-admin-1';

    const profile = localStore.getProfile(targetProfileId);
    if (profile) {
      setUser(profile);
      localStorage.setItem('eventify_current_user_id', profile.id);
    }
  };

  const updateProfile = async (updates: Partial<Profile>): Promise<boolean> => {
    if (!user) return false;
    const updated = { ...user, ...updates };

    if (isSupabaseConfigured) {
      try {
        await supabase.from('profiles').update(updates).eq('id', user.id);
      } catch (err) {
        console.error('Supabase profile update error:', err);
      }
    }

    localStore.updateProfile(updated);
    setUser(updated);
    return true;
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      if (error) return { success: false, message: error.message };
    }
    return {
      success: true,
      message: `Password reset instructions sent to ${email}. Please check your inbox.`
    };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        register,
        loginWithGoogle,
        logout,
        switchPersona,
        updateProfile,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
