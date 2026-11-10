import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { UserProfile } from '../types/domain';

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
/** When the current login began. A login lasts SESSION_MAX_AGE_MS from this moment, no matter how active the user is. */
export const LOCAL_STORAGE_SESSION_STARTED = 'titik_session_started_v1';
/** sessionStorage flag so /login can explain why the user was signed out. Not cleared with the auth keys. */
export const SESSION_EXPIRED_NOTICE_KEY = 'titik_notice_session_expired';
export const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;
export const freshSignupUserIds = new Set<string>();

export const isLiveMode = true;

/**
 * A failure that says nothing about whether the session is valid: the network dropped, the
 * server answered 5xx or 429, or a profile read could not complete. Treating these as "invalid
 * session" signed people out whenever a laptop woke up or a tab regained focus on a bad connection.
 */
export class TransientAuthError extends Error {
  readonly original: unknown;

  constructor(message: string, original?: unknown) {
    super(message);
    this.name = 'TransientAuthError';
    this.original = original;
  }
}

const NETWORK_FAILURE_PATTERN = /failed to fetch|networkerror|network request failed|load failed|fetch failed|timed? ?out/i;

export function isTransientAuthFailure(error: unknown): boolean {
  if (!error) return false;
  if (error instanceof TransientAuthError) return true;
  const e = error as { name?: string; status?: number; message?: string };
  if (e.name === 'AuthRetryableFetchError') return true;
  if (typeof e.status === 'number' && (e.status === 0 || e.status === 429 || e.status >= 500)) return true;
  return NETWORK_FAILURE_PATTERN.test(e.message || '');
}

function getLocalStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
    if (typeof localStorage !== 'undefined') return localStorage;
  } catch {
    // Storage blocked
  }
  return null;
}

export function getSessionStartedAt(): number | null {
  try {
    const raw = getLocalStorage()?.getItem(LOCAL_STORAGE_SESSION_STARTED);
    const value = raw ? Number(raw) : NaN;
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

/** Records the start of a login. Without `force` an existing start time is kept (focus events re-emit SIGNED_IN). */
export function markSessionStarted(force = false, now = Date.now()): void {
  try {
    const storage = getLocalStorage();
    if (!storage) return;
    if (!force && getSessionStartedAt() !== null) return;
    storage.setItem(LOCAL_STORAGE_SESSION_STARTED, String(now));
  } catch {
    // Ignore storage errors: expiry then simply cannot be enforced on this device
  }
}

export function isSessionExpired(now = Date.now()): boolean {
  const startedAt = getSessionStartedAt();
  return startedAt !== null && now - startedAt >= SESSION_MAX_AGE_MS;
}

export function flagSessionExpiredNotice(): void {
  try {
    if (typeof window !== 'undefined') window.sessionStorage.setItem(SESSION_EXPIRED_NOTICE_KEY, '1');
  } catch {
    // Notice is a courtesy only
  }
}

/** True when the user was just signed out by the 24-hour limit. Reading does not clear it (safe under StrictMode). */
export function peekSessionExpiredNotice(): boolean {
  try {
    return typeof window !== 'undefined' && window.sessionStorage.getItem(SESSION_EXPIRED_NOTICE_KEY) === '1';
  } catch {
    return false;
  }
}

export function clearSessionExpiredNotice(): void {
  try {
    if (typeof window !== 'undefined') window.sessionStorage.removeItem(SESSION_EXPIRED_NOTICE_KEY);
  } catch {
    // Nothing to clear
  }
}

export const ANONYMOUS_PROFILE: UserProfile = {
  id: 'usr-anon-00',
  username: 'warga.anonim',
  displayName: 'Warga Anonim',
  email: '',
  avatarUrl: '',
  role: 'citizen',
  district: 'Kota Bogor',
  isVerified: false,
  bio: 'Identitas dilindungi token satu arah.',
};

export function getStoredAuthentication(): boolean {
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
      if (savedProfile && savedProfile.id && !savedProfile.id.startsWith('usr-anon')) {
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
  const raw = getStoredProfileRaw();
  if (raw) return raw;
  return ANONYMOUS_PROFILE;
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
          key.startsWith('titik_session_started') ||
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

  if (typeof indexedDB !== 'undefined') {
    try {
      indexedDB.deleteDatabase('titik_reports_db');
    } catch {
      // Ignore database cleanup error
    }
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
  currentSession: Session
): Promise<UserProfile | null> {
  const currentUserId = currentSession.user.id;
  const userEmail = currentSession.user.email || '';
  const userMeta = currentSession.user.user_metadata || {};

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
        status === 401 ||
        status === 403 ||
        error.code === 'PGRST301' ||
        error.code === 'PGRST116'
      ) {
        return null;
      }
      // Anything else (network, 5xx, timeout) says nothing about the account: do not sign out for it
      throw new TransientAuthError('Profil belum dapat dimuat.', error);
    }

    if (data) {
      if (data.is_demo === true) {
        return null;
      }
      if (data.role === 'admin') {
        role = 'admin';
      }
      const rawBio = typeof data.bio === 'string' ? data.bio.trim() : '';
      const rawDistrict = typeof data.district === 'string' ? data.district.trim() : '';

      dbProfile = {
        displayName: data.display_name,
        username: data.username,
        avatarUrl: data.avatar_url || '',
        bio: rawBio || undefined,
        district: rawDistrict || undefined,
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
    if (err instanceof TransientAuthError) throw err;
    throw new TransientAuthError('Profil belum dapat dimuat.', err);
  }

  // In pure live mode, if database profile row is missing, return null
  if (!dbProfile) {
    return null;
  }

  const resolvedProfile: UserProfile = {
    id: currentUserId,
    email: userEmail,
    displayName:
      dbProfile.displayName ||
      userMeta.display_name ||
      userMeta.full_name ||
      (userEmail ? userEmail.split('@')[0] : 'Warga'),
    username:
      dbProfile.username ||
      userMeta.username ||
      (userEmail ? userEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9_.]/g, '') : 'warga'),
    avatarUrl: dbProfile.avatarUrl || userMeta.avatar_url || '',
    role,
    district: dbProfile.district || userMeta.district || undefined,
    isVerified: dbProfile.isVerified ?? false,
    bio: dbProfile.bio || undefined,
    verifiedAgency: dbProfile.verifiedAgency,
    bannerUrl: dbProfile.bannerUrl || userMeta.banner_url || undefined,
    backgroundTheme: dbProfile.backgroundTheme || userMeta.background_theme || 'editorial_forest',
    websiteUrl: dbProfile.websiteUrl || userMeta.website_url || undefined,
    customStatus: dbProfile.customStatus || userMeta.custom_status || undefined,
    createdAt: dbProfile.createdAt || undefined,
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

  let initialSession: Session | null = null;
  try {
    ({ data: { session: initialSession } } = await deps.supabase.auth.getSession());

    if (initialSession?.user) {
      // A login lasts 24 hours from sign-in. Sessions that predate this rule start counting now.
      if (isSessionExpired()) {
        flagSessionExpiredNotice();
        await deps.invalidateSession({ redirect: true });
        return;
      }
      markSessionStarted();

      // 1. Live server validation with Supabase Auth
      const { data: userData, error: userError } = await deps.supabase.auth.getUser();
      if (userError && isTransientAuthFailure(userError)) {
        throw userError;
      }
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
      const staleFound = hasStaleAuthStorage();
      deps.setSession(null);
      deps.setUser(null);
      deps.setIsAuthenticated(false);
      deps.setProfile(ANONYMOUS_PROFILE);
      if (staleFound) {
        await deps.invalidateSession({ redirect: true });
        return;
      }
    }
  } catch (err) {
    if (isTransientAuthFailure(err)) {
      // Offline or the server hiccuped: keep the saved session and profile, validate on the next event
      console.warn('Session check postponed, connection problem:', err);
      if (initialSession?.user && deps.getStoredAuth()) {
        deps.setSession(initialSession);
        deps.setUser(initialSession.user);
        deps.setIsAuthenticated(true);
      }
    } else {
      console.error('Session retrieval failed:', err);
      await deps.invalidateSession({ redirect: false });
    }
  } finally {
    deps.setIsLoading(false);
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile>(getStoredProfile);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(getStoredAuthentication);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const invalidateSession = useCallback(async (options?: { redirect?: boolean }) => {
    await invalidateSessionStorageAndRedirect(options);

    setUser(null);
    setSession(null);
    setProfile(ANONYMOUS_PROFILE);
    setIsAuthenticated(false);
    setIsLoading(false);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session) {
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError && isTransientAuthFailure(userError)) return;
        if (userError || !userData?.user) {
          await invalidateSession({ redirect: true });
          return;
        }
        const refreshed = await fetchRealProfileAndRole(session);
        if (refreshed) {
          setProfile(refreshed);
          try {
            localStorage.setItem(LOCAL_STORAGE_ACTIVE_PROFILE, JSON.stringify(refreshed));
          } catch {
            // Ignore storage set errors
          }
        } else {
          await invalidateSession({ redirect: true });
        }
      } catch (err) {
        // A dropped connection must not end the session; the next refresh will try again
        if (!isTransientAuthFailure(err)) throw err;
        console.warn('Profile refresh postponed, connection problem:', err);
      }
    }
  }, [session, invalidateSession]);

  // The user id the app currently trusts. A repeat SIGNED_IN for the same id is a tab regaining focus, not a new login.
  const knownUserIdRef = useRef<string | null>(null);
  useEffect(() => {
    knownUserIdRef.current = user?.id ?? null;
  }, [user]);

  // A login lasts 24 hours. Checked on a timer and whenever the tab wakes up, because timers pause while a device sleeps.
  useEffect(() => {
    if (!isAuthenticated) return;
    const enforceSessionAge = () => {
      if (!isSessionExpired()) return;
      flagSessionExpiredNotice();
      void invalidateSession({ redirect: true });
    };
    enforceSessionAge();
    const timer = window.setInterval(enforceSessionAge, 60_000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') enforceSessionAge();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', enforceSessionAge);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', enforceSessionAge);
    };
  }, [isAuthenticated, invalidateSession]);

  // Realtime subscription to profiles table for live avatar and profile synchronization
  useEffect(() => {
    if (!user?.id || !isSupabaseConfigured) return;

    const channel = supabase
      .channel(`profile-realtime:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        async () => {
          await refreshProfile();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, refreshProfile]);

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
        if (event === 'INITIAL_SESSION') return;

        if (event === 'SIGNED_OUT' || !newSession) {
          setSession(null);
          setUser(null);
          setIsAuthenticated(false);
          setProfile(ANONYMOUS_PROFILE);
        } else if (newSession?.user) {
          // Token rotation (hourly) and a tab regaining focus re-emit events for the same user.
          // Nothing about the account changed, so keep the new tokens and skip the network round trips.
          const isSameUserRefresh =
            event === 'TOKEN_REFRESHED' ||
            (event === 'SIGNED_IN' && knownUserIdRef.current === newSession.user.id);
          if (isSameUserRefresh) {
            setSession(newSession);
            markSessionStarted();
            return;
          }

          try {
            const isFreshSignup = freshSignupUserIds.has(newSession.user.id);

            if (!isFreshSignup) {
              const { data: userData, error: userError } = await supabase.auth.getUser();
              if (userError && isTransientAuthFailure(userError)) return;
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
            }
          } catch (err) {
            console.warn('onAuthStateChange profile fetch error:', err);
            // A connection problem keeps the current session; only a definite failure ends it
            if (isTransientAuthFailure(err)) return;
            const isFreshSignup = newSession?.user && freshSignupUserIds.has(newSession.user.id);
            if (!isFreshSignup) {
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

  // Standard Email & Password Login strictly against Supabase
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
        normalizedEmail = 'admin@titik.com';
      }
    }

    // Dynamic resolution of username to email from Supabase public.profiles
    if (isSupabaseConfigured && !normalizedEmail.includes('@')) {
      const cleanUser = normalizedEmail.replace(/^@+/, '').trim().toLowerCase();
      let resolvedEmail: string | null = null;

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
      } else {
        setIsLoading(false);
        return {
          success: false,
          error: `Username "${cleanUser}" tidak ditemukan. Pastikan username sudah benar atau masuk menggunakan email.`,
        };
      }
    }

    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return {
        success: false,
        error: 'Koneksi database Supabase belum terkonfigurasi. Periksa konfigurasi lingkungan Anda.',
      };
    }

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
        // Start the 24-hour clock before isAuthenticated flips, so a stale key can never expire a fresh login
        markSessionStarted(true);
        setSession(data.session);
        setUser(data.user);
        setIsAuthenticated(true);
        let resolved: UserProfile | null;
        try {
          resolved = await fetchRealProfileAndRole(data.session);
        } catch (profileErr) {
          if (!isTransientAuthFailure(profileErr)) throw profileErr;
          await invalidateSession({ redirect: false });
          setIsLoading(false);
          return { success: false, error: 'Koneksi terputus saat memuat profil Anda. Coba masuk lagi.' };
        }
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
  };

  // Sign Up / Registration strictly against Supabase
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

    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return {
        success: false,
        error: 'Koneksi database Supabase belum terkonfigurasi. Tidak dapat mendaftar akun baru.',
        needsEmailConfirmation: false,
      };
    }

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

      if (!userSession) {
        try {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: trimmedEmail,
            password,
          });
          if (!signInError && signInData?.session) {
            userSession = signInData.session;
          } else if (signInError) {
            try {
              await supabase.rpc('auto_confirm_user_by_email', { p_email: trimmedEmail });
              if (targetUserId) {
                await supabase.rpc('auto_confirm_user', { p_user_id: targetUserId });
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

      markSessionStarted(true);
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
  };

  const updateProfileState = useCallback((patch: Partial<UserProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(LOCAL_STORAGE_ACTIVE_PROFILE, JSON.stringify(next));
      } catch {
        // Ignore storage errors
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
      setProfile(ANONYMOUS_PROFILE);
      setIsAuthenticated(false);
      if (typeof indexedDB !== 'undefined') {
        try {
          indexedDB.deleteDatabase('titik_reports_db');
        } catch {
          // Ignore database cleanup error
        }
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
