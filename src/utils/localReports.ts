/**
 * Anonymous reports are stored on the server without any account id, so the server
 * cannot list them under "Laporan Saya". The submitter receives a reference and a secret
 * follow-up token; this module keeps that pair on the device that submitted it, per account,
 * so the page can look the report up again through the token-verified tracking call.
 */
const KEY = 'titik_anon_reports_v1';

export interface LocalAnonymousReport {
  reference: string;
  token: string;
  savedAt: string;
}

type Store = Record<string, LocalAnonymousReport[]>;

function readStore(): Store {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? (parsed as Store) : {};
  } catch {
    return {};
  }
}

export function getLocalAnonymousReports(userId: string): LocalAnonymousReport[] {
  const list = readStore()[userId];
  return Array.isArray(list) ? list.filter((item) => item?.reference && item?.token) : [];
}

export function rememberAnonymousReport(userId: string, reference: string, token: string): void {
  if (!userId || !reference || !token) return;
  try {
    const store = readStore();
    const current = (store[userId] ?? []).filter((item) => item.reference !== reference);
    store[userId] = [{ reference, token, savedAt: new Date().toISOString() }, ...current].slice(0, 50);
    window.localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    // Storage can be blocked; the report itself is already saved on the server.
  }
}

export function forgetAnonymousReport(userId: string, reference: string): void {
  try {
    const store = readStore();
    store[userId] = (store[userId] ?? []).filter((item) => item.reference !== reference);
    window.localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    // Nothing to clean up when storage is unavailable.
  }
}
