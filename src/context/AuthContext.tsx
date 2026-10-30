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
  invalidateSession?: (options?: { redirect?: boolean }) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const LOCAL_STORAGE_ACTIVE_PROFILE = 'titik_active_profile_v1';
export const LOCAL_STORAGE_AUTHENTICATED = 'titik_authenticated_v2';

export const isLiveMode = isSupabaseConfigured && import.meta.env.VITE_DATA_MODE !== 'demo';

export function getStoredAuthentication(): boolean {
  if (isLiveMode) return false;
  try {
    const storage =
      typeof window !== 'undefined' && window.localStorage
        ? window.localStorage
        : typeof localStorage !== 'undefined'
        ? localStorage
        : null;
    return storage?.getItem(LOCAL_STORAGE_AUTHENTICATED) === 'true';
  } catch {
    return false;
  }
}

export function getStoredProfile(): UserProfile {
  if (isLiveMode) return PRESET_PERSONAS.anonymous;
  try {
    const storage =
      typeof window !== 'undefined' && window.localStorage
        ? window.localStorage
        : typeof localStorage !== 'undefined'
        ? localStorage
        : null;
    const saved = storage?.getItem(LOCAL_STORAGE_ACTIVE_PROFILE);
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

export function hasStaleAuthStorage(): boolean {
  const storages: Storage[] = [];
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      storages.push(window.localStorage);
    } else if (typeof localStorage !== 'undefined') {
      storages.push(localStorage);
    }
  } catch {
    // Ignore storage access errors
  }

  for (const storage of storages) {
    try {
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (!key) continue;
        if (
          key.startsWith('sb-') ||
          key.startsWith('titik_active_profile') ||
          key.startsWith('titik_authenticated') ||
          key.startsWith('titik_simulated_accounts')
        ) {
          return true;
        }
      }
    } catch {
      // Ignore iteration errors
    }
  }
  return false;
}

export function clearAllAuthStorage(): void {
  const storages: Storage[] = [];
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      storages.push(window.localStorage);
    } else if (typeof localStorage !== 'undefined') {
      storages.push(localStorage);
    }
  } catch {
    // Ignore localStorage access error
  }

  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      storages.push(window.sessionStorage);
    } else if (typeof sessionStorage !== 'undefined') {
      storages.push(sessionStorage);
    }
  } catch {
    // Ignore sessionStorage access error
  }

  for (const storage of storages) {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (!key) continue;
        if (
          key.startsWith('sb-') ||
          key.startsWith('titik_active_profile') ||
          key.startsWith('titik_authenticated') ||
          key.startsWith('titik_simulated_accounts')
        ) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => storage.removeItem(key));
    } catch (err) {
      console.warn('Failed to clear auth storage:', err);
    }
  }
}

export interface InvalidateSessionOptions {
  redirect?: boolean;
}

export async function invalidateSessionStorageAndRedirect(
  options?: InvalidateSessionOptions
): Promise<void> {
  clearAllAuthStorage();

  if (isSupabaseConfigured) {
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (err) {
      console.warn('Supabase local signOut failed:', err);
    } finally {
      clearAllAuthStorage();
    }
  }

  try {
    await clearPersistedReports();
  } catch (err) {
    console.warn('Failed to clear persisted reports:', err);
  }

  if (options?.redirect !== false) {
    const win = typeof window !== 'undefined' ? window : (globalThis as any).window;
    if (win && win.location) {
      const pathname = win.location.pathname || '';
      const isAlreadyOnAuthPage =
        pathname === '/login' ||
        pathname === '/daftar' ||
        pathname === '/masuk' ||
        pathname === '/register';

      if (!isAlreadyOnAuthPage) {
        if (typeof win.location.replace === 'function') {
          win.location.replace('/login');
        } else {
          win.location.href = '/login';
        }
      }
    }
  }
}

export async function fetchRealProfileAndRole(
  currentSession: Session,
  liveModeOverride?: boolean
): Promise<UserProfile | null> {
  const currentUserId = currentSession.user.id;
  const userEmail = currentSession.user.email || '';
  const userMeta = currentSession.user.user_metadata || {};
  const activeLiveMode = liveModeOverride ?? isLiveMode;

  // 1. Inquire database role strictly via SECURITY DEFINER RPC or user_roles query
  let role: 'admin' | 'citizen' = 'citizen';
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
    role = 'citizen';
  }

  // 2. Fetch profile from public.profiles
  let dbProfile: Partial<UserProfile> | null = null;
  try {
    const { data, error, status } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUserId)
      .maybeSingle();

    if (error) {
      console.warn('Error fetching DB profile:', error);
      if (
        activeLiveMode &&
        (status === 401 ||
          status === 403 ||
          error.code === 'PGRST301' ||
          error.code === 'PGRST116')
      ) {
        return null;
      }
    }

    if (data) {
      if (activeLiveMode && data.is_demo === true) {
        return null;
      }
      dbProfile = {
        displayName: data.display_name,
        username: data.username,
        avatarUrl: data.avatar_url,
        bio: data.bio || undefined,
        district: data.district || undefined,
        isVerified: Boolean(data.is_verified),
        verifiedAgency: data.verified_agency || undefined,
        bannerUrl: data.banner_url || undefined,
        backgroundTheme: data.background_theme || undefined,
        websiteUrl: data.website_url || undefined,
        customStatus: data.custom_status || undefined,
        createdAt: data.created_at || undefined,
      };
    }
  } catch (err) {
    console.warn('Could not fetch DB profile:', err);
    if (activeLiveMode) return null;
  }

  // In live mode, if database profile row is missing, return null!
  if (activeLiveMode && !dbProfile) {
    return null;
  }

  const resolvedProfile: UserProfile = {
    id: currentUserId,
    email: userEmail,
    displayName:
      dbProfile?.displayName ||
      userMeta.display_name ||
      userMeta.full_name ||
      (userEmail ? userEmail.split('@')[0] : 'Warga'),
    username:
      dbProfile?.username ||
      userMeta.username ||
      (userEmail ? userEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9_.]/g, '') : 'warga'),
    avatarUrl:
      dbProfile?.avatarUrl ||
      userMeta.avatar_url ||
      '',
    role,
    district: dbProfile?.district || userMeta.district || undefined,
    isVerified: dbProfile?.isVerified ?? false,
    bio: dbProfile?.bio || undefined,
    verifiedAgency: dbProfile?.verifiedAgency,
    bannerUrl: dbProfile?.bannerUrl || userMeta.banner_url || undefined,
    backgroundTheme: dbProfile?.backgroundTheme || userMeta.background_theme || 'editorial_forest',
    websiteUrl: dbProfile?.websiteUrl || userMeta.website_url || undefined,
    customStatus: dbProfile?.customStatus || userMeta.custom_status || undefined,
    createdAt: dbProfile?.createdAt || undefined,
  };

  return resolvedProfile;
}

export interface InitializeAuthSessionParams {
  supabase: typeof supabase;
  isSupabaseConfigured: boolean;
  isLiveMode: boolean;
  fetchProfile: (session: Session) => Promise<UserProfile | null>;
  invalidateSession: (options?: { redirect?: boolean }) => Promise<void>;
  setSession: (s: Session | null) => void;
  setUser: (u: User | null) => void;
  setProfile: (p: UserProfile) => void;
  setIsAuthenticated: (auth: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  getStoredAuth: () => boolean;
}

export async function initializeAuthSession(deps: InitializeAuthSessionParams): Promise<void> {
  if (!deps.isSupabaseConfigured) {
    deps.setIsLoading(false);
    return;
  }

  try {
    const { data: { session: initialSession } } = await deps.supabase.auth.getSession();

    if (initialSession?.user) {
      // 1. Live server validation with Supabase Auth
      const { data: userData, error: userError } = await deps.supabase.auth.getUser();
      if (userError || !userData?.user) {
        console.warn('Auth token references invalid or deleted user in Supabase:', userError?.message);
        await deps.invalidateSession({ redirect: true });
        return;
      }

      // 2. Database profile existence validation
      const resolved = await deps.fetchProfile(initialSession);
      if (!resolved) {
        console.warn('Authenticated user has no profile row in Supabase database.');
        await deps.invalidateSession({ redirect: true });
        return;
      }

      deps.setSession(initialSession);
      deps.setUser(userData.user);
      deps.setProfile(resolved);
      deps.setIsAuthenticated(true);
      if (!deps.isLiveMode) {
        try {
          localStorage.setItem(LOCAL_STORAGE_ACTIVE_PROFILE, JSON.stringify(resolved));
          localStorage.setItem(LOCAL_STORAGE_AUTHENTICATED, 'true');
        } catch {
          // Ignore storage set errors
        }
      }
    } else {
      const staleFound = deps.isLiveMode && hasStaleAuthStorage();
      deps.setSession(null);
      deps.setUser(null);
      deps.setIsAuthenticated(deps.getStoredAuth());
      if (deps.isLiveMode) {
        deps.setProfile(PRESET_PERSONAS.anonymous);
        if (staleFound) {
          await deps.invalidateSession({ redirect: true });
          return;
        }
      }
    }
  } catch (err) {
    console.error('Session retrieval failed:', err);
    await deps.invalidateSession({ redirect: false });
  } finally {
    deps.setIsLoading(false);
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile>(getStoredProfile);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(getStoredAuthentication);
  const [isLoading, setIsLoading] = useState<boolean>(isLiveMode);

  const invalidateSession = useCallback(async (options?: { redirect?: boolean }) => {
    await invalidateSessionStorageAndRedirect(options);

    setUser(null);
    setSession(null);
    setProfile(PRESET_PERSONAS.anonymous);
    setIsAuthenticated(false);
    setIsLoading(false);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session) {
      if (isLiveMode) {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData?.user) {
          await invalidateSession({ redirect: true });
          return;
        }
      }
      const refreshed = await fetchRealProfileAndRole(session);
      if (refreshed) {
        setProfile(refreshed);
      } else {
        await invalidateSession({ redirect: true });
      }
    }
  }, [session, invalidateSession]);

  // Initialize Supabase Auth Listener
  useEffect(() => {
    let isMounted = true;

    if (isSupabaseConfigured) {
      initializeAuthSession({
        supabase,
        isSupabaseConfigured,
        isLiveMode,
        fetchProfile: fetchRealProfileAndRole,
        invalidateSession,
        setSession: (s) => {
          if (isMounted) setSession(s);
        },
        setUser: (u) => {
          if (isMounted) setUser(u);
        },
        setProfile: (p) => {
          if (isMounted) setProfile(p);
        },
        setIsAuthenticated: (a) => {
          if (isMounted) setIsAuthenticated(a);
        },
        setIsLoading: (l) => {
          if (isMounted) setIsLoading(l);
        },
        getStoredAuth: getStoredAuthentication,
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
        if (!isMounted) return;
        // INITIAL_SESSION is deterministically handled by initializeAuthSession with full getUser() + DB verification
        if (event === 'INITIAL_SESSION') return;

        if (event === 'SIGNED_OUT' || !newSession) {
          setSession(null);
          setUser(null);
          setIsAuthenticated(false);
          setProfile(PRESET_PERSONAS.anonymous);
        } else if (newSession?.user) {
          try {
            if (isLiveMode) {
              const { data: userData, error: userError } = await supabase.auth.getUser();
              if (userError || !userData?.user) {
                await invalidateSession({ redirect: true });
                return;
              }
            }

            const resolved = await fetchRealProfileAndRole(newSession);
            if (!resolved) {
              await invalidateSession({ redirect: true });
              return;
            }
            if (isMounted) {
              setSession(newSession);
              setUser(newSession.user);
              setProfile(resolved);
              setIsAuthenticated(true);
              if (!isLiveMode) {
                localStorage.setItem(LOCAL_STORAGE_ACTIVE_PROFILE, JSON.stringify(resolved));
                localStorage.setItem(LOCAL_STORAGE_AUTHENTICATED, 'true');
              }
            }
          } catch (err) {
            console.warn('onAuthStateChange profile fetch error:', err);
            if (isLiveMode) {
              await invalidateSession({ redirect: true });
            }
          }
        } else {
          setIsAuthenticated(getStoredAuthentication());
        }
      });

      return () => {
        isMounted = false;
        subscription?.unsubscribe();
      };
    } else {
      setIsLoading(false);
    }
  }, [invalidateSession]);

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
          if (!resolved) {
            await invalidateSession({ redirect: false });
            setIsLoading(false);
            return { success: false, error: 'Profil pengguna tidak ditemukan di database.' };
          }
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
          if (resolved) {
            setProfile(resolved);
          }
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
      district: undefined,
      isVerified: false,
      bio: undefined,
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
    try {
      if (isSupabaseConfigured) {
        try {
          await supabase.auth.signOut();
        } catch (err) {
          console.warn('Remote sign-out error:', err);
        }
        try {
          await supabase.auth.signOut({ scope: 'local' });
        } catch {
          // Ignore local signOut error
        }
      }
    } finally {
      clearAllAuthStorage();
      setUser(null);
      setSession(null);
      setProfile(PRESET_PERSONAS.anonymous);
      setIsAuthenticated(false);
      try {
        await clearPersistedReports();
      } catch (e) {
        console.warn('Error clearing persisted reports on sign out:', e);
      }
    }
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
        invalidateSession,
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
