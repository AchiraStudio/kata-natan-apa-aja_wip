# TITIK. — Supabase Setup & Architecture Guide

This guide describes how to configure, migrate, and deploy the Supabase backend for TITIK. (Multimedia In Action 2026).

---

## 1. Prerequisites

- A Supabase project (hosted on [supabase.com](https://supabase.com) or local via Supabase CLI).
- Node.js 18+ and npm.
- Supabase CLI installed (`npm install -g supabase` or `brew install supabase/tap/supabase`).

---

## 2. Environment Configuration

Copy `.env.example` to `.env` in the repository root:

```bash
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> **Security Rule:**
> Never place the Supabase `service_role` secret in frontend `.env` files or commit it to version control. The client app operates exclusively through the `anon` key, constrained by Row Level Security (RLS) policies and `SECURITY DEFINER` stored procedures.

To start the frontend locally after configuring `.env`, install dependencies and run the Vite development server:

```bash
npm install
npm run dev
```

### Seeding Demo Reports

The deterministic seed pipeline creates 30 demo reports from multiple demo citizen profiles, along with demo profiles, facilities, posts, and comments. Configure a locally available Supabase key with permission to write seed data, then run:

```bash
npm run seed:all
```

Keep any service-role key in a local `.env.seed` file and never commit it. The optional `--reset-demo` flag deletes existing rows marked `is_demo = true` before reseeding.

---

## 3. Database Migrations Execution

Execute the SQL migration files located in `supabase/migrations/` in sequential order:

- Forward-only security hardening migration: `supabase/migrations/20261028000001_security_hardening.sql`
- Saved-report bookmarks: `supabase/migrations/20261030000001_add_report_saves.sql`
- User follow relationships: `supabase/migrations/20261110000002_user_follows.sql`
- Per-user message deletion, delete-for-everyone, and starred messages: `supabase/migrations/20261110000010_message_controls.sql`
- Report attachment storage compatibility: `supabase/migrations/20261110000003_add_report_private_supporting_documents.sql`
- Allow reporters to delete their own reports: `supabase/migrations/20261110000004_allow_reporter_delete_own_report.sql`
- Allow QuickTime report evidence: `supabase/migrations/20261110000005_allow_quicktime_post_media.sql`
- Remove linked feed posts when deleting reports: `supabase/migrations/20261110000006_delete_linked_feed_post_with_report.sql`
- Or use `supabase/schema.sql` for a clean full setup.

### Option A: Via Supabase Dashboard SQL Editor (Quickest)

1. Open your Supabase Dashboard:
   `https://supabase.com/dashboard/project/<your-project-ref>/sql/new`
2. For an existing installation, run pending migrations in order, including user-follows and message-controls migrations. For a clean setup, run `supabase/schema.sql`.

### Option B: Via Supabase CLI

```bash
# Link local CLI to cloud project
supabase link --project-ref <your-project-ref>

# Push all migrations automatically
supabase db push
```

---

## 4. Storage Buckets Verification

In your Supabase Dashboard at `https://supabase.com/dashboard/project/<your-project-ref>/storage/buckets`:

The migrations configure the following buckets:
1. `post-media`:
   - **Public**: `true`
   - **File size limit**: 10 MB
   - **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`, `video/mp4`, `video/webm`, `video/quicktime`
2. `avatars`:
   - **Public**: `true`
   - **File size limit**: 2 MB
   - **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`
3. `report-evidence-private`:
   - **Public**: `false` (Private citizen evidence quarantine)
   - **File size limit**: 20 MB
   - **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`, `video/mp4`, `video/webm`, `application/pdf`
   - **Policy**: Folder-isolated access (`{auth.uid()}/...`) ensuring reporters and admins can view private submissions.

---

## 5. Security & Access Rules

1. **Privilege Elevation Defense**: `public.user_roles` maintains elevated roles (`admin`). Client-side role claims in user metadata are rejected.
2. **Profiles**: Public profiles view `public.public_profiles` masks citizen emails.
3. **Anonymity**: Anonymous reports completely omit `reporter_user_id`.
4. **Follow-up Token**: Hashed using `crypt(token, gen_salt('bf', 8))` and verified via constant-time RPC `public.get_report_by_follow_up_token`.
