import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { UserProfile } from '../types/domain';
import { PRESET_PERSONAS } from '../services/accountGenerator';
import { clearPersistedReports } from '../services/reportPersistence';

export interface AuthContextType {
  user: User | null;
  profile: UserProfile;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isLiveMode: boolean;
  signIn: (email: string, password?: string) => Promise<{ success: boolean; error?: string; role?: UserProfile['role'] }>;
  signUp: (email: string, password: string, displayName: string, username?: string) => Promise<{ success: boolean; error?: string; needsEmailConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_ACTIVE_PROFILE = 'titik_active_profile_v1';
const LOCAL_STORAGE_AUTHENTICATED = 'titik_authenticated_v2';

const isLiveMode = isSupabaseConfigured && import.meta.env.VITE_DATA_MODE !== 'demo';

function getStoredAuthentication(): boolean {
  if (isLiveMode) return false;
  try {
    return localStorage.getItem(LOCAL_STORAGE_AUTHENTICATED) === 'true';
  } catch {
    return false;
  }
}

function getStoredProfile(): UserProfile {
  if (isLiveMode) return PRESET_PERSONAS.anonymous;
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_ACTIVE_PROFILE);
    if (saved) {
      const savedProfile = JSON.parse(saved) as UserProfile;
      return {
        ...savedProfile,
        role: savedProfile.role === 'admin' ? 'admin' : 'citizen',
      };
    }
  } catch (err) {
    console.warn('Failed to parse cached profile:', err);
  }
  return PRESET_PERSONAS.citizen;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile>(getStoredProfile);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(getStoredAuthentication);
  const [isLoading, setIsLoading] = useState<boolean>(isLiveMode);

  const fetchRealProfileAndRole = useCallback(async (currentSession: Session): Promise<UserProfile> => {
    const currentUserId = currentSession.user.id;
    const userEmail = currentSession.user.email || '';
    const userMeta = currentSession.user.user_metadata || {};

    let role: 'admin' | 'citizen' = 'citizen';

    // 1. Inquire database role strictly via SECURITY DEFINER RPC or user_roles query
    try {
      const { data: roleData, error: roleError } = await supabase.rpc('get_my_role');
      if (!roleError && roleData === 'admin') {
        role = 'admin';
      } else {
        const { data: roleRow } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', currentUserId)
          .maybeSingle();
        if (roleRow?.role === 'admin') {
          role = 'admin';
        }
      }
    } catch {
      // Fallback: stay as citizen, never escalate
      role = 'citizen';
    }

    // 2. Fetch profile from public.profiles
    let dbProfile: Partial<UserProfile> | null = null;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUserId)
        .maybeSingle();
      if (!error && data) {
        dbProfile = {
          displayName: data.display_name,
          username: data.username,
          avatarUrl: data.avatar_url,
          bio: data.bio,
          district: data.district,
          isVerified: Boolean(data.is_verified),
          verifiedAgency: data.verified_agency,
          bannerUrl: data.banner_url || undefined,
          backgroundTheme: data.background_theme || undefined,
          websiteUrl: data.website_url || undefined,
          customStatus: data.custom_status || undefined,
          createdAt: data.created_at || undefined,
        };
      }
    } catch (err) {
      console.warn('Could not fetch DB profile:', err);
    }

    const resolvedProfile: UserProfile = {
      id: currentUserId,
      email: userEmail,
      displayName: dbProfile?.displayName || userMeta.display_name || userMeta.full_name || (userEmail ? userEmail.split('@')[0] : 'Warga TITIK'),
      username: dbProfile?.username || userMeta.username || (userEmail ? userEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9_.]/g, '') : 'warga'),
      avatarUrl: dbProfile?.avatarUrl || userMeta.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      role,
      district: dbProfile?.district || userMeta.district || 'Bogor Tengah',
      isVerified: dbProfile?.isVerified ?? false,
      bio: dbProfile?.bio || 'Warga terdaftar di portal TITIK.',
      verifiedAgency: dbProfile?.verifiedAgency,
      bannerUrl: dbProfile?.bannerUrl || userMeta.banner_url || undefined,
      backgroundTheme: dbProfile?.backgroundTheme || userMeta.background_theme || 'editorial_forest',
      websiteUrl: dbProfile?.websiteUrl || userMeta.website_url || undefined,
      customStatus: dbProfile?.customStatus || userMeta.custom_status || undefined,
      createdAt: dbProfile?.createdAt || undefined,
    };

    return resolvedProfile;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session) {
      const refreshed = await fetchRealProfileAndRole(session);
      setProfile(refreshed);
    }
  }, [session, fetchRealProfileAndRole]);

  // Initialize Supabase Auth Listener
  useEffect(() => {
    let isMounted = true;

    if (isSupabaseConfigured) {
      supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
        if (!isMounted) return;
        setSession(initialSession);
        setUser(initialSession?.user ?? null);

        if (initialSession?.user) {
          setIsAuthenticated(true);
          const resolved = await fetchRealProfileAndRole(initialSession);
          if (isMounted) {
            setProfile(resolved);
            if (!isLiveMode) {
              localStorage.setItem(LOCAL_STORAGE_ACTIVE_PROFILE, JSON.stringify(resolved));
              localStorage.setItem(LOCAL_STORAGE_AUTHENTICATED, 'true');
            }
          }
        } else {
          setIsAuthenticated(getStoredAuthentication());
          if (isLiveMode) {
            setProfile(PRESET_PERSONAS.anonymous);
          }
        }
        if (isMounted) setIsLoading(false);
      }).catch((err) => {
        console.error('Session retrieval failed:', err);
        if (isMounted) setIsLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
        if (!isMounted) return;
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          setIsAuthenticated(true);
          const resolved = await fetchRealProfileAndRole(newSession);
          if (isMounted) {
            setProfile(resolved);
            if (!isLiveMode) {
              localStorage.setItem(LOCAL_STORAGE_ACTIVE_PROFILE, JSON.stringify(resolved));
              localStorage.setItem(LOCAL_STORAGE_AUTHENTICATED, 'true');
            }
          }
        } else if (event === 'SIGNED_OUT') {
          setIsAuthenticated(false);
          setProfile(PRESET_PERSONAS.anonymous);
        } else {
          setIsAuthenticated(getStoredAuthentication());
        }
      });

      return () => {
        isMounted = false;
        subscription.unsubscribe();
      };
    }
  }, [fetchRealProfileAndRole]);

  // Standard Email & Password Login
  const signIn = async (
    email: string,
    password?: string
  ): Promise<{ success: boolean; error?: string; role?: UserProfile['role'] }> => {
    setIsLoading(true);

    let normalizedEmail = email.trim();

    // Map common aliases/usernames to official emails
    const lowerInput = normalizedEmail.toLowerCase();
    if (!normalizedEmail.includes('@')) {
      if (lowerInput === 'admin' || lowerInput === 'admin.pupr') {
        normalizedEmail = 'admin@titik.id';
      } else if (lowerInput === 'warga' || lowerInput === 'budi.santoso' || lowerInput === 'sahabatbogor') {
        normalizedEmail = 'warga@titik.id';
      }
    }

    // 1. In DEMO mode only, check preset personas
    if (!isLiveMode) {
      const normalizedLogin = lowerInput;
      const matchedPersona = normalizedLogin === 'admin' || normalizedLogin === 'admin.pupr' || normalizedLogin === 'admin@titik.id'
        ? PRESET_PERSONAS.admin
        : [PRESET_PERSONAS.citizen, PRESET_PERSONAS.admin].find(
            (persona) =>
              persona.email?.toLowerCase() === normalizedLogin ||
              persona.username.toLowerCase() === normalizedLogin ||
              (normalizedLogin === 'warga@titik.id' && persona.role === 'citizen') ||
              (normalizedLogin === 'admin@titik.id' && persona.role === 'admin')
          );

      if (matchedPersona) {
        if (password && password !== matchedPersona.passwordHint && password !== 'titik2026' && password !== 'admin2026') {
          setIsLoading(false);
          return { success: false, error: 'Username atau password demo tidak sesuai.' };
        }
        setProfile(matchedPersona);
        localStorage.setItem(LOCAL_STORAGE_ACTIVE_PROFILE, JSON.stringify(matchedPersona));
        setIsAuthenticated(true);
        localStorage.setItem(LOCAL_STORAGE_AUTHENTICATED, 'true');
        setIsLoading(false);
        return { success: true, role: matchedPersona.role };
      }
    }

    // 2. In Live mode or when querying Supabase Auth
    if (isSupabaseConfigured) {
      if (!password) {
        setIsLoading(false);
        return { success: false, error: 'Password wajib diisi.' };
      }

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (error) {
          setIsLoading(false);
          return { success: false, error: error.message || 'Username atau password salah.' };
        }

        if (data.session && data.user) {
          setSession(data.session);
          setUser(data.user);
          setIsAuthenticated(true);
          const resolved = await fetchRealProfileAndRole(data.session);
          setProfile(resolved);
          setIsLoading(false);
          return { success: true, role: resolved.role };
        }

        setIsLoading(false);
        return { success: false, error: 'Login tidak berhasil. Periksa kembali akun dan kata sandi Anda.' };
      } catch (err: unknown) {
        setIsLoading(false);
        const errorMsg = err instanceof Error ? err.message : String(err);
        return { success: false, error: errorMsg };
      }
    }

    setIsLoading(false);
    return {
      success: false,
      error: 'Akun tidak ditemukan. Silakan periksa kembali email dan kata sandi Anda.',
    };
  };

  // Sign Up / Registration
  const signUp = async (
    email: string,
    password: string,
    displayName: string,
    username?: string
  ): Promise<{ success: boolean; error?: string; needsEmailConfirmation?: boolean }> => {
    setIsLoading(true);

    const cleanedUsername =
      username?.trim().toLowerCase().replace(/^@/, '').replace(/[^a-z0-9_.]/g, '') ||
      email.split('@')[0].toLowerCase().replace(/[^a-z0-9_.]/g, '');

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              display_name: displayName.trim(),
              username: cleanedUsername,
              district: 'Bogor Tengah',
            },
          },
        });

        if (error) {
          setIsLoading(false);
          return { success: false, error: error.message };
        }

        let userSession = data.session;

        // Instant sign-in fallback: if project returned no session directly,
        // sign in with credentials immediately so user is never blocked by email verification
        if (!userSession) {
          try {
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email: email.trim(),
              password,
            });
            if (!signInError && signInData?.session) {
              userSession = signInData.session;
            }
          } catch {
            // Ignore error if sign-in still strictly requires confirmation
          }
        }

        if (userSession) {
          setSession(userSession);
          setUser(userSession.user);
          setIsAuthenticated(true);
          const resolved = await fetchRealProfileAndRole(userSession);
          setProfile(resolved);
          setIsLoading(false);
          return { success: true, needsEmailConfirmation: false };
        }

        setIsLoading(false);
        // Fallback only if project has strict unconfirmed blocking
        return { success: true, needsEmailConfirmation: !userSession };
      } catch (err: unknown) {
        setIsLoading(false);
        const errorMsg = err instanceof Error ? err.message : String(err);
        return { success: false, error: errorMsg };
      }
    }

    // Demo mode fallback only
    const newProfile: UserProfile = {
      id: `usr-${Date.now()}`,
      email,
      displayName,
      username: cleanedUsername,
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      role: 'citizen',
      district: 'Bogor Tengah',
      isVerified: false,
      bio: 'Warga baru terdaftar di portal TITIK.',
    };

    setProfile(newProfile);
    localStorage.setItem(LOCAL_STORAGE_ACTIVE_PROFILE, JSON.stringify(newProfile));
    setIsAuthenticated(true);
    localStorage.setItem(LOCAL_STORAGE_AUTHENTICATED, 'true');
    setIsLoading(false);
    return { success: true };
  };

  // Sign Out
  const signOut = async () => {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Sign-out error:', err);
      }
    }
    setUser(null);
    setSession(null);
    setProfile(PRESET_PERSONAS.anonymous);
    setIsAuthenticated(false);

    // Clear all localStorage keys starting with titik_
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('titik_')) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      console.warn('Error clearing localStorage keys:', e);
    }

    // Clear IndexedDB evidence
    await clearPersistedReports();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        isAuthenticated,
        isLiveMode,
        signIn,
        signUp,
        signOut,
        refreshProfile,
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
