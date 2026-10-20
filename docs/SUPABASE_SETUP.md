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
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
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

### Migration 1: Normalized Civic Schema
File: `supabase/migrations/20261017000001_civic_reporting_schema.sql`
- Creates enum types: `civic_sector`, `facility_condition`, `project_status`, `report_status`, `report_severity`, `publication_status`, `acquisition_method`, `match_status`, `actor_type`, `event_type`.
- Creates core normalized tables:
  - `facilities`: Verified public facilities (schools, puskesmas, drainage, parks).
  - `budget_projects`: Verified APBD procurement projects.
  - `reports`: Citizen reports master table with concurrency-safe sequence generator (`TITIK-2026-XXXXX`).
  - `report_locations`: Separates high-precision GPS (`precise_latitude`) from generalized public coordinates (`public_latitude` rounded to 3 decimals, ~110m).
  - `report_media`: File storage paths with moderation status (`pending`, `approved`, `rejected`).
  - `report_events`: Append-only audit trail with `prevent_report_events_mutation()` trigger forbidding `UPDATE` and `DELETE`.
  - `report_relations`: Explicit relations between reports and facilities/budget projects with confidence score and match status (`suggested` vs `confirmed`).
  - `reporter_private_data`: Stores SHA-256 hash of capability follow-up token for anonymous citizen lookup.
  - `report_votes`: Community priority votes with unique constraint per voter token hash to prevent ballot-box stuffing.

### Migration 2: Storage Buckets & RLS Security
File: `supabase/migrations/20261017000002_storage_and_rls_policies.sql`
- Enables Row Level Security (RLS) on all 9 tables.
- Public read access is restricted strictly to `reports` where `publication_status = 'published'`.
- Configures two isolated storage buckets:
  - `report-evidence-private`: Incoming submissions. No public read access; accessible only to moderators or the authorized backend procedure.
  - `report-evidence-public`: Approved media files only. Public CDN read access.
- Creates atomic database procedure `submit_citizen_report(...)` with `SECURITY DEFINER` and sanitized search path to process reports in a single transactional unit.
- Creates `get_report_by_follow_up_token(...)` enabling anonymous citizens to check review status using their high-entropy token without opening arbitrary read permissions.

### Migration 3: Seed Reference Data
File: `supabase/migrations/20261017000003_seed_reference_data.sql`
- Seeds verified regional facilities across Bogor and Greater Jakarta with coordinates, responsible agencies, service capacities, and conditions.
- Seeds APBD budget projects with budget breakdowns (pagu, committed, realized, uncommitted) and source metadata.

### Migration 4: Explicit Schema Permissions & PostgREST Cache Reload
File: `supabase/migrations/20261017000004_grant_permissions_and_reload_cache.sql`
- Grants explicit `SELECT` privileges to `anon` and `authenticated` roles on all public civic tables.
- Grants `EXECUTE` on stored procedures (`submit_citizen_report`, `get_pending_reports_for_moderation`, `moderate_report`).
- Executes `NOTIFY pgrst, 'reload schema'` to signal the PostgREST API gateway to immediately reload its OpenAPI schema cache (eliminating `Could not find the table 'public.reports' in the schema cache`).

---

## 4. Applying Migrations (Project `oetnxbovjwovaddivmwf`)

### Option A: Via Supabase Dashboard SQL Editor (Quickest)

1. Open your Supabase Dashboard:
   `https://supabase.com/dashboard/project/oetnxbovjwovaddivmwf/sql/new`
2. Open each SQL migration file in your editor and copy the full contents into the SQL Editor:
   - **Step 1**: `supabase/migrations/20261017000001_civic_reporting_schema.sql` → Click **Run**.
   - **Step 2**: `supabase/migrations/20261017000002_storage_and_rls_policies.sql` → Click **Run**.
   - **Step 3**: `supabase/migrations/20261017000003_seed_reference_data.sql` → Click **Run**.
   - **Step 4**: `supabase/migrations/20261017000004_grant_permissions_and_reload_cache.sql` → Click **Run**.

3. **Verify Table & Data Creation**:
   Run this verification query in the SQL Editor:
   ```sql
   SELECT 
       table_name, 
       (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name) AS column_count
   FROM information_schema.tables t
   WHERE table_schema = 'public' 
     AND table_name IN ('facilities', 'budget_projects', 'reports', 'report_locations', 'report_media', 'report_events', 'report_relations', 'reporter_private_data', 'report_votes');
   ```
   You should see all 9 tables created and populated with reference facilities and APBD projects.

### Option B: Via Supabase CLI

```bash
# Link local CLI to cloud project
supabase link --project-ref oetnxbovjwovaddivmwf

# Push all migrations automatically
supabase db push
```

---

## 5. Storage Buckets Verification

In your Supabase Dashboard at `https://supabase.com/dashboard/project/oetnxbovjwovaddivmwf/storage/buckets`:

Migration 2 creates the two required buckets automatically:
1. `report-evidence-private`:
   - **Public**: `false` (Private quarantine)
   - **File size limit**: 10 MB
   - **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`
   - **Policy**: Allows anonymous/authenticated users to upload incoming evidence to `incoming/*`
2. `report-evidence-public`:
   - **Public**: `true` (Public CDN delivery for approved report evidence)
   - **File size limit**: 10 MB
   - **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`

---

## 6. Community Moderation & Audit Verification

When citizens submit reports:
1. Submissions are atomically recorded via `submit_citizen_report` RPC with `publication_status = 'pending'`.
2. Community curators/auditors can review incoming reports at `/lapor` under the **Kurasi Komunitas** tab.
3. The review screen displays:
   - Cleaned photographic evidence from the private bucket.
   - GPS coordinates and spatial acquisition method (accurate vs approximate).
   - Sector, impact level, and description.
4. Curators can:
   - **Setujui & Publikasikan**: calls `moderate_report` to change status to `published`, make media public, and append an immutable `APPROVED_PUBLISHED` audit log.
   - **Tolak Laporan**: marks report rejected with curator justification.
   - **Tandai Dalam Tinjauan**: flags report for further field verification.

---

## 7. Edge Function Deployment (Optional HTTP Endpoint)

The canonical HTTP submission endpoint is defined in `supabase/functions/submit-report/index.ts`. Deploy using:

```bash
supabase functions deploy submit-report --project-ref oetnxbovjwovaddivmwf
```

*(Note: The client application supports both Edge Function calls and direct atomic RPC calls to `submit_citizen_report`, ensuring reliable submission even when Edge Functions are not deployed.)*

---

## 8. Realtime Configuration

In the Supabase Dashboard under **Database -> Publications -> supabase_realtime**:
Ensure the following tables are enabled for replication:
- `reports`
- `report_events`
- `report_votes`

This enables live real-time updates across open browser tabs as reports are submitted, moderated, or voted on.

