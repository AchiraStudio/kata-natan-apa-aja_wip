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

---

## 3. Database Migrations Execution

Execute the SQL migration files located in `supabase/migrations/` in sequential order:

- Forward-only security hardening migration: `supabase/migrations/20261028000001_security_hardening.sql`
- Or use `supabase/schema.sql` for a clean full setup.

### Option A: Via Supabase Dashboard SQL Editor (Quickest)

1. Open your Supabase Dashboard:
   `https://supabase.com/dashboard/project/<your-project-ref>/sql/new`
2. Open `supabase/migrations/20261028000001_security_hardening.sql` (or `supabase/schema.sql`) and run the script in the SQL editor.

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
   - **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`, `video/mp4`, `video/webm`
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
