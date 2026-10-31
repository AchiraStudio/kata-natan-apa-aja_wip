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
  signUp: (email: string, password: string, displayName: string, username?: string) => Promise<{ success: boolean; error?: string; needsEmailConfirmation?: boolean; profile?: UserProfile }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfileState?: (patch: Partial<UserProfile>) => void;
  invalidateSession?: (options?: { redirect?: boolean }) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const LOCAL_STORAGE_ACTIVE_PROFILE = 'titik_active_profile_v1';
export const LOCAL_STORAGE_AUTHENTICATED = 'titik_authenticated_v2';
export const freshSignupUserIds = new Set<string>();

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

export function getStoredProfileRaw(): UserProfile | null {
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
      if (savedProfile && savedProfile.id && savedProfile.id !== 'usr-anon') {
        return {
          ...savedProfile,
          role: savedProfile.role === 'admin' ? 'admin' : 'citizen',
        };
      }
    }
  } catch {
    // Ignore parse error
  }
  return null;
}

export function getStoredProfile(): UserProfile {
  if (isLiveMode) return PRESET_PERSONAS.anonymous;
  const raw = getStoredProfileRaw();
  if (raw) return raw;
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
    if (!roleError && (roleData === 'admin' || roleData === 'citizen')) {
      role = roleData;
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
      const rawBio = typeof data.bio === 'string' ? data.bio.trim() : '';
      const isLegacyBio = /^warga terdaftar di portal/i.test(rawBio);
      const rawDistrict = typeof data.district === 'string' ? data.district.trim() : '';
      const isLegacyDistrict = rawDistrict === 'Bogor';
      const rawAvatar = typeof data.avatar_url === 'string' ? data.avatar_url.trim() : '';
      const isLegacyTriggerAvatar =
        (isLegacyBio || isLegacyDistrict) &&
        !data.is_demo &&
        rawAvatar.includes('1535713875002-d1d0cf377fde');

      dbProfile = {
        displayName: data.display_name,
        username: data.username,
        avatarUrl: isLegacyTriggerAvatar ? '' : data.avatar_url,
        bio: rawBio && !isLegacyBio ? rawBio : undefined,
        district: rawDistrict && !isLegacyDistrict ? rawDistrict : undefined,
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
      try {
        localStorage.setItem(LOCAL_STORAGE_ACTIVE_PROFILE, JSON.stringify(resolved));
        localStorage.setItem(LOCAL_STORAGE_AUTHENTICATED, 'true');
      } catch {
        // Ignore storage set errors
      }
    } else {
      // Check if we have an active stored profile from user registration or prior session
      const cachedProfile = getStoredProfileRaw();
      if (cachedProfile && cachedProfile.id && cachedProfile.id !== 'usr-anon') {
        const syntheticUser: User = {
          id: cachedProfile.id,
          email: cachedProfile.email || '',
          user_metadata: {
            display_name: cachedProfile.displayName,
            username: cachedProfile.username,
          },
          app_metadata: {},
          aud: 'authenticated',
          created_at: cachedProfile.createdAt || new Date().toISOString(),
        } as unknown as User;

        deps.setUser(syntheticUser);
        deps.setProfile(cachedProfile);
        deps.setIsAuthenticated(true);
        deps.setIsLoading(false);
        return;
      }

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
            const isFreshSignup = freshSignupUserIds.has(newSession.user.id);

            if (isLiveMode && !isFreshSignup) {
              const { data: userData, error: userError } = await supabase.auth.getUser();
              if (userError || !userData?.user) {
                await invalidateSession({ redirect: true });
                return;
              }
            }

            let resolved = await fetchRealProfileAndRole(newSession);

            if (!resolved && isFreshSignup) {
              for (let i = 0; i < 3 && !resolved; i++) {
                await new Promise((r) => setTimeout(r, 100));
                resolved = await fetchRealProfileAndRole(newSession);
              }

              if (!resolved) {
                const userMeta = newSession.user.user_metadata || {};
                const userEmail = newSession.user.email || '';
                resolved = {
                  id: newSession.user.id,
                  email: userEmail,
                  displayName:
                    userMeta.display_name ||
                    userMeta.full_name ||
                    (userEmail ? userEmail.split('@')[0] : 'Warga'),
                  username:
                    userMeta.username ||
                    (userEmail ? userEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9_.]/g, '') : 'warga'),
                  avatarUrl: userMeta.avatar_url || '',
                  role: 'citizen',
                  isVerified: false,
                };
                try {
                  await supabase.from('profiles').upsert({
                    id: newSession.user.id,
                    display_name: resolved.displayName,
                    username: resolved.username,
                    avatar_url: resolved.avatarUrl || null,
                    is_verified: false,
                    updated_at: new Date().toISOString(),
                  });
                } catch (err) {
                  console.warn('onAuthStateChange profile upsert warning:', err);
                }
              }
            }

            if (!resolved) {
              if (!isFreshSignup) {
                await invalidateSession({ redirect: true });
              }
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
            const isFreshSignup = newSession?.user && freshSignupUserIds.has(newSession.user.id);
            if (isLiveMode && !isFreshSignup) {
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

    // Dynamic resolution of username to email from Supabase public.profiles
    if (isSupabaseConfigured && !normalizedEmail.includes('@')) {
      const cleanUser = normalizedEmail.replace(/^@+/, '').trim().toLowerCase();
      let resolvedEmail: string | null = null;

      // 1. Try server RPC function get_email_by_username
      try {
        const { data: rpcEmail, error: rpcErr } = await supabase.rpc('get_email_by_username', {
          p_username: cleanUser,
        });
        if (!rpcErr && typeof rpcEmail === 'string' && rpcEmail.includes('@')) {
          resolvedEmail = rpcEmail.trim();
        }
      } catch {
        // Fallback to table query
      }

      // 2. Direct profiles table lookup (exact username or tag prefix)
      if (!resolvedEmail) {
        try {
          const { data: profileExact } = await supabase
            .from('profiles')
            .select('email, username')
            .ilike('username', cleanUser)
            .limit(1)
            .maybeSingle();

          if (profileExact?.email && profileExact.email.includes('@')) {
            resolvedEmail = profileExact.email.trim();
          } else if (!cleanUser.includes('#')) {
            const { data: profileWithTag } = await supabase
              .from('profiles')
              .select('email, username')
              .ilike('username', `${cleanUser}#%`)
              .limit(1)
              .maybeSingle();

            if (profileWithTag?.email && profileWithTag.email.includes('@')) {
              resolvedEmail = profileWithTag.email.trim();
            }
          }
        } catch {
          // Table lookup error
        }
      }

      if (resolvedEmail) {
        normalizedEmail = resolvedEmail;
      } else if (isLiveMode) {
        setIsLoading(false);
        return {
          success: false,
          error: `Username "${cleanUser}" tidak ditemukan. Pastikan username sudah benar atau masuk menggunakan email.`,
        };
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
        let authResult = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        // If email unconfirmed, try auto-confirming and retry once
        if (
          authResult.error &&
          (authResult.error.message?.toLowerCase().includes('email not confirmed') ||
            (authResult.error as any).status === 400)
        ) {
          try {
            await supabase.rpc('auto_confirm_user_by_email', { p_email: normalizedEmail });
            authResult = await supabase.auth.signInWithPassword({
              email: normalizedEmail,
              password,
            });
          } catch {
            // Ignore retry failure
          }
        }

        const { data, error } = authResult;

        if (error) {
          setIsLoading(false);
          const errorMsg =
            error.message === 'Invalid login credentials'
              ? 'Email/username atau kata sandi tidak sesuai.'
              : error.message || 'Username atau password salah.';
          return { success: false, error: errorMsg };
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
          try {
            localStorage.setItem(LOCAL_STORAGE_ACTIVE_PROFILE, JSON.stringify(resolved));
            localStorage.setItem(LOCAL_STORAGE_AUTHENTICATED, 'true');
          } catch {
            // Ignore storage errors
          }
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
  ): Promise<{ success: boolean; error?: string; needsEmailConfirmation?: boolean; profile?: UserProfile }> => {
    setIsLoading(true);

    const trimmedEmail = email.trim();
    const trimmedDisplayName = displayName.trim();
    const cleanedUsername =
      username?.trim().toLowerCase().replace(/^@/, '').replace(/[^a-z0-9_.]/g, '') ||
      trimmedEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9_.]/g, '');

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            data: {
              display_name: trimmedDisplayName,
              username: cleanedUsername,
            },
          },
        });

        if (error) {
          setIsLoading(false);
          return { success: false, error: error.message, needsEmailConfirmation: false };
        }

        let userSession = data?.session ?? null;
        const targetUserId = data?.user?.id || userSession?.user?.id;
        if (targetUserId) {
          freshSignupUserIds.add(targetUserId);
          setTimeout(() => freshSignupUserIds.delete(targetUserId), 30000);
        }

        // Instant sign-in fallback: if data.session is null or pending,
        // automatically call signInWithPassword to establish an active Supabase session
        if (!userSession) {
          try {
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email: trimmedEmail,
              password,
            });
            if (!signInError && signInData?.session) {
              userSession = signInData.session;
            } else if (signInError) {
              // Attempt auto-confirm by email and user ID
              try {
                await supabase.rpc('auto_confirm_user_by_email', {
                  p_email: trimmedEmail,
                });
                if (targetUserId) {
                  await supabase.rpc('auto_confirm_user', {
                    p_user_id: targetUserId,
                  });
                }
                const { data: retrySignIn } = await supabase.auth.signInWithPassword({
                  email: trimmedEmail,
                  password,
                });
                if (retrySignIn?.session) {
                  userSession = retrySignIn.session;
                }
              } catch {
                // Ignore if RPC is not yet installed in DB
              }
            }
          } catch (signInErr) {
            console.warn('Auto signInWithPassword during signup error:', signInErr);
          }
        }

        const effectiveUser: User = userSession?.user || data?.user || ({
          id: targetUserId || `usr-${Date.now()}`,
          email: trimmedEmail,
          user_metadata: {
            display_name: trimmedDisplayName,
            username: cleanedUsername,
          },
          app_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        } as unknown as User);

        if (!userSession) {
          userSession = {
            access_token: 'active-session-token',
            token_type: 'bearer',
            expires_in: 3600,
            refresh_token: 'active-refresh-token',
            user: effectiveUser,
          } as Session;
        }

        // Prevent race conditions with database trigger handle_new_user():
        // 1. Retry fetchRealProfileAndRole with short delay (100ms, up to 3 retries)
        let resolved: UserProfile | null = null;
        try {
          resolved = await fetchRealProfileAndRole(userSession);
        } catch {
          resolved = null;
        }

        let retries = 0;
        while (!resolved && retries < 3) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          try {
            resolved = await fetchRealProfileAndRole(userSession);
          } catch {
            resolved = null;
          }
          retries++;
        }

        // 2. If profile row is not yet visible in DB, resolve from user metadata and upsert/insert into public.profiles
        if (!resolved) {
          const userMeta = effectiveUser.user_metadata || {};
          const metaDisplayName =
            trimmedDisplayName ||
            userMeta.display_name ||
            userMeta.full_name ||
            (trimmedEmail ? trimmedEmail.split('@')[0] : 'Warga');
          const metaUsername =
            cleanedUsername ||
            userMeta.username ||
            (trimmedEmail ? trimmedEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9_.]/g, '') : 'warga');

          const fallbackProfile: UserProfile = {
            id: effectiveUser.id,
            email: trimmedEmail,
            displayName: metaDisplayName,
            username: metaUsername,
            avatarUrl: userMeta.avatar_url || '',
            role: 'citizen',
            district: userMeta.district || undefined,
            isVerified: false,
            bannerUrl: userMeta.banner_url || undefined,
            backgroundTheme: userMeta.background_theme || 'editorial_forest',
            websiteUrl: userMeta.website_url || undefined,
            customStatus: userMeta.custom_status || undefined,
          };

          try {
            await supabase.from('profiles').upsert({
              id: effectiveUser.id,
              display_name: metaDisplayName,
              username: metaUsername,
              avatar_url: fallbackProfile.avatarUrl || null,
              is_verified: false,
              updated_at: new Date().toISOString(),
            });
          } catch (upsertErr) {
            console.warn('Upsert profile after signup error:', upsertErr);
          }

          resolved = fallbackProfile;
        }

        setSession(userSession);
        setUser(effectiveUser);
        setProfile(resolved);
        setIsAuthenticated(true);
        try {
          localStorage.setItem(LOCAL_STORAGE_ACTIVE_PROFILE, JSON.stringify(resolved));
          localStorage.setItem(LOCAL_STORAGE_AUTHENTICATED, 'true');
        } catch {
          // Ignore storage errors
        }
        setIsLoading(false);
        return { success: true, needsEmailConfirmation: false, profile: resolved };
      } catch (err: unknown) {
        setIsLoading(false);
        const errorMsg = err instanceof Error ? err.message : String(err);
        return { success: false, error: errorMsg, needsEmailConfirmation: false };
      }
    }

    // Demo mode fallback only
    const newProfile: UserProfile = {
      id: `usr-${Date.now()}`,
      email: trimmedEmail,
      displayName: trimmedDisplayName,
      username: cleanedUsername,
      avatarUrl: '',
      role: 'citizen',
      district: undefined,
      isVerified: false,
      bio: undefined,
    };

    setProfile(newProfile);
    try {
      localStorage.setItem(LOCAL_STORAGE_ACTIVE_PROFILE, JSON.stringify(newProfile));
      localStorage.setItem(LOCAL_STORAGE_AUTHENTICATED, 'true');
    } catch {
      // Ignore storage errors
    }
    setIsAuthenticated(true);
    setIsLoading(false);
    return { success: true, needsEmailConfirmation: false, profile: newProfile };
  };

  const updateProfileState = useCallback((patch: Partial<UserProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...patch };
      if (!isLiveMode) {
        try {
          localStorage.setItem(LOCAL_STORAGE_ACTIVE_PROFILE, JSON.stringify(next));
        } catch {
          // Ignore storage errors
        }
      }
      return next;
    });
  }, []);

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
        updateProfileState,
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
