-- Migration: Clean bot accounts and old accounts before 10 November 2026
-- Date: 2026-11-10
-- Purpose: Permanently remove demo/bot accounts (@demo.titik.id, usr-kn-*) and pre-Nov 10 accounts from public.profiles

DELETE FROM public.report_saves
WHERE user_id IN (
  SELECT id FROM public.profiles
  WHERE (
    email ILIKE '%@demo.titik.id'
    OR email ILIKE '%bot%'
    OR id LIKE 'usr-kn-%'
    OR username ILIKE '%demo%'
    OR username ILIKE '%bot%'
    OR created_at < '2026-11-10 00:00:00+00'
  )
  AND role != 'admin'
);

DELETE FROM public.post_likes
WHERE user_id IN (
  SELECT id FROM public.profiles
  WHERE (
    email ILIKE '%@demo.titik.id'
    OR email ILIKE '%bot%'
    OR id LIKE 'usr-kn-%'
    OR username ILIKE '%demo%'
    OR username ILIKE '%bot%'
    OR created_at < '2026-11-10 00:00:00+00'
  )
  AND role != 'admin'
);

DELETE FROM public.user_follows
WHERE follower_id IN (
  SELECT id FROM public.profiles
  WHERE (
    email ILIKE '%@demo.titik.id'
    OR email ILIKE '%bot%'
    OR id LIKE 'usr-kn-%'
    OR username ILIKE '%demo%'
    OR username ILIKE '%bot%'
    OR created_at < '2026-11-10 00:00:00+00'
  )
  AND role != 'admin'
)
OR following_id IN (
  SELECT id FROM public.profiles
  WHERE (
    email ILIKE '%@demo.titik.id'
    OR email ILIKE '%bot%'
    OR id LIKE 'usr-kn-%'
    OR username ILIKE '%demo%'
    OR username ILIKE '%bot%'
    OR created_at < '2026-11-10 00:00:00+00'
  )
  AND role != 'admin'
);

DELETE FROM public.conversation_members
WHERE user_id IN (
  SELECT id FROM public.profiles
  WHERE (
    email ILIKE '%@demo.titik.id'
    OR email ILIKE '%bot%'
    OR id LIKE 'usr-kn-%'
    OR username ILIKE '%demo%'
    OR username ILIKE '%bot%'
    OR created_at < '2026-11-10 00:00:00+00'
  )
  AND role != 'admin'
);

-- Delete target profiles
DELETE FROM public.profiles
WHERE (
  email ILIKE '%@demo.titik.id'
  OR email ILIKE '%bot%'
  OR id LIKE 'usr-kn-%'
  OR username ILIKE '%demo%'
  OR username ILIKE '%bot%'
  OR created_at < '2026-11-10 00:00:00+00'
)
AND role != 'admin';
