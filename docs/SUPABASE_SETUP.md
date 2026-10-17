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

---

## 4. Applying Migrations

### Option A: Via Supabase CLI (Recommended)

```bash
# Link to your Supabase cloud project
supabase link --project-ref your-project-ref

# Push all migrations
supabase db push
```

### Option B: Via Supabase Dashboard SQL Editor

Open the Supabase Dashboard, navigate to the **SQL Editor**, and execute the three migration files in numerical order:
1. `20261017000001_civic_reporting_schema.sql`
2. `20261017000002_storage_and_rls_policies.sql`
3. `20261017000003_seed_reference_data.sql`

---

## 5. Storage Buckets Verification

Verify in the Supabase Dashboard under **Storage**:
1. `report-evidence-private`: `public = false`. File size limit: 10MB. Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`.
2. `report-evidence-public`: `public = true`. File size limit: 10MB. Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`.

---

## 6. Edge Function Deployment

The canonical HTTP submission endpoint is defined in `supabase/functions/submit-report/index.ts`. Deploy using:

```bash
supabase functions deploy submit-report
```

---

## 7. Realtime Configuration

In the Supabase Dashboard under **Database -> Publications**:
Ensure `supabase_realtime` publication includes:
- `reports`
- `report_events`
- `report_votes`

This powers real-time reactive updates on the map and observatorium list when reports are published, audited, or upvoted.

