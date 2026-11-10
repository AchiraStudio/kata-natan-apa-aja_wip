import { useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTitik } from '../../context/useTitik';
import { getUnreadMessageCount, subscribeToUnreadChanges } from '../../services/messagesService';

const BASE_TITLE_KEY = 'titikBaseTitle';

/**
 * Keeps the unread badge truthful on every page, not only inside /pesan:
 * counts on sign-in, refreshes on realtime changes, and mirrors the count in the tab title.
 */
export const UnreadMessagesSync = () => {
  const { profile, isAuthenticated } = useAuth();
  const { setUnreadMessagesCount, unreadMessagesCount } = useTitik();
  const userId = isAuthenticated ? profile?.id : undefined;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!userId) {
      setUnreadMessagesCount?.(0);
      return;
    }
    let active = true;
    const refresh = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        const count = await getUnreadMessageCount(userId);
        if (active) setUnreadMessagesCount?.(count);
      }, 250);
    };

    refresh();
    const sub = subscribeToUnreadChanges(userId, refresh);
    window.addEventListener('titik-unread-refresh', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      active = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      sub.unsubscribe();
      window.removeEventListener('titik-unread-refresh', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [userId, setUnreadMessagesCount]);

  useEffect(() => {
    const root = document.documentElement;
    if (!root.dataset[BASE_TITLE_KEY]) root.dataset[BASE_TITLE_KEY] = document.title.replace(/^\(\d+\+?\)\s*/, '');
    const base = root.dataset[BASE_TITLE_KEY] ?? document.title;
    const count = unreadMessagesCount ?? 0;
    document.title = count > 0 ? `(${count > 99 ? '99+' : count}) ${base}` : base;
  }, [unreadMessagesCount]);

  return null;
};
