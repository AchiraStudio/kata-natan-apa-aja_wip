import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { UserProfile } from '../types/domain';
import { PRESET_PERSONAS } from '../services/accountGenerator';

interface AuthContextType {
  user: User | null;
  profile: UserProfile;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  signInAsPersona: (key: 'citizen' | 'admin' | 'moderator' | 'anonymous') => void;
  switchProfile: (profile: UserProfile) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_ACTIVE_PROFILE = 'titik_active_profile_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile>(() => {
    // Restore previous active profile from localStorage if present
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_ACTIVE_PROFILE);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (err) {
      console.warn('Failed to parse cached profile:', err);
    }
    // Default to verified citizen demo persona
    return PRESET_PERSONAS.citizen;
  });
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);

  // Initialize Supabase Auth Listener
  useEffect(() => {
    let isMounted = true;

    if (isSupabaseConfigured) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!isMounted) return;
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          const userMeta = session.user.user_metadata || {};
          setProfile((prev) => ({
            ...prev,
            id: session.user.id,
            email: session.user.email || prev.email,
            displayName: userMeta.display_name || userMeta.full_name || prev.displayName,
            username: userMeta.username || prev.username,
          }));
        }
        setIsLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          const userMeta = session.user.user_metadata || {};
          const newProfile: UserProfile = {
            id: session.user.id,
            email: session.user.email,
            displayName: userMeta.display_name || userMeta.full_name || 'Warga Terdaftar',
            username: userMeta.username || (session.user.email ? session.user.email.split('@')[0] : 'warga'),
            avatarUrl: userMeta.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
            role: userMeta.role || 'citizen',
            district: userMeta.district || 'Bogor Tengah',
            isVerified: true,
            bio: userMeta.bio || 'Warga terdaftar di portal TITIK.',
          };
          setProfile(newProfile);
          localStorage.setItem(LOCAL_STORAGE_ACTIVE_PROFILE, JSON.stringify(newProfile));
        }
      });

      return () => {
        isMounted = false;
        subscription.unsubscribe();
      };
    }
  }, []);

  // 1-Click Login as Pre-configured Persona
  const signInAsPersona = useCallback((key: 'citizen' | 'admin' | 'moderator' | 'anonymous') => {
    const targetPersona = PRESET_PERSONAS[key] || PRESET_PERSONAS.citizen;
    setProfile(targetPersona);
    localStorage.setItem(LOCAL_STORAGE_ACTIVE_PROFILE, JSON.stringify(targetPersona));
  }, []);

  // Switch Active Profile (Used by Mass Account Generator)
  const switchProfile = useCallback((newProfile: UserProfile) => {
    setProfile(newProfile);
    localStorage.setItem(LOCAL_STORAGE_ACTIVE_PROFILE, JSON.stringify(newProfile));
  }, []);

  // Standard Email & Password Login
  const signIn = async (email: string, password = 'password123'): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    // 1. Check if email matches any of the demo personas
    const matchedPersona = Object.values(PRESET_PERSONAS).find(
      (p) => p.email?.toLowerCase() === email.toLowerCase() || p.username.toLowerCase() === email.toLowerCase()
    );

    if (matchedPersona) {
      setProfile(matchedPersona);
      localStorage.setItem(LOCAL_STORAGE_ACTIVE_PROFILE, JSON.stringify(matchedPersona));
      setIsLoading(false);
      return { success: true };
    }

    // 2. Try Supabase Auth if online
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          // If Supabase user doesn't exist yet, simulate seamless sign-in with clean demo fallback
          console.info('Supabase sign-in note, proceeding with citizen profile:', error.message);
          const fallbackProfile: UserProfile = {
            id: `usr-${Date.now()}`,
            email,
            displayName: email.split('@')[0],
            username: email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '_'),
            avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
            role: 'citizen',
            district: 'Bogor Tengah',
            isVerified: true,
            bio: 'Warga terverifikasi via email.',
          };
          setProfile(fallbackProfile);
          localStorage.setItem(LOCAL_STORAGE_ACTIVE_PROFILE, JSON.stringify(fallbackProfile));
          setIsLoading(false);
          return { success: true };
        }

        if (data.session) {
          setSession(data.session);
          setUser(data.user);
        }
        setIsLoading(false);
        return { success: true };
      } catch (err: unknown) {
        setIsLoading(false);
        const errorMsg = err instanceof Error ? err.message : String(err);
        return { success: false, error: errorMsg };
      }
    }

    // 3. Offline / Mock fallback
    const offlineProfile: UserProfile = {
      id: `usr-${Date.now()}`,
      email,
      displayName: email.split('@')[0],
      username: email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '_'),
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      role: 'citizen',
      district: 'Bogor Tengah',
      isVerified: true,
      bio: 'Warga terdaftar di portal TITIK.',
    };
    setProfile(offlineProfile);
    localStorage.setItem(LOCAL_STORAGE_ACTIVE_PROFILE, JSON.stringify(offlineProfile));
    setIsLoading(false);
    return { success: true };
  };

  // Sign Up / Registration
  const signUp = async (
    email: string,
    password: string,
    displayName: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName,
              username: email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '_'),
              district: 'Bogor Tengah',
              role: 'citizen',
            },
          },
        });

        if (error) {
          setIsLoading(false);
          return { success: false, error: error.message };
        }

        if (data.user) {
          setUser(data.user);
        }
      } catch (err: unknown) {
        setIsLoading(false);
        const errorMsg = err instanceof Error ? err.message : String(err);
        return { success: false, error: errorMsg };
      }
    }

    const newProfile: UserProfile = {
      id: `usr-${Date.now()}`,
      email,
      displayName,
      username: email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '_'),
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      role: 'citizen',
      district: 'Bogor Tengah',
      isVerified: true,
      bio: 'Warga baru terdaftar di portal TITIK.',
    };

    setProfile(newProfile);
    localStorage.setItem(LOCAL_STORAGE_ACTIVE_PROFILE, JSON.stringify(newProfile));
    setIsLoading(false);
    return { success: true };
  };

  // Sign Out
  const signOut = async () => {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Sign-out note:', err);
      }
    }
    setUser(null);
    setSession(null);
    // Reset to anonymous citizen
    signInAsPersona('anonymous');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        isAuthenticated: Boolean(profile && profile.role !== undefined),
        signIn,
        signUp,
        signOut,
        signInAsPersona,
        switchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
