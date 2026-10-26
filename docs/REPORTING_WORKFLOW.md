# TITIK. — Civic Reporting Architecture & Workflow

This document details the architecture, threat model, and verification mechanisms governing the citizen reporting system in TITIK. (Multimedia In Action 2026).

---

## 1. Product Mission & Value Proposition

**See the issue. Trace the budget. Track the impact.**

TITIK. enables ordinary citizens to report public infrastructure defects and service failures, attach verifiable evidence, define accurate locations, and monitor public spending without requiring technical budget knowledge or mandatory account registration.

### The Central Civic Journey

```
Citizen Observation
      ↓
Photo + Video Evidence (Explicit AI Metadata Marker Screening)
      ↓
Explicit Location (User-Initiated GPS / Map Pin)
      ↓
Moderation Review (Private Ingest Quarantine)
      ↓
Public Record & Reference (e.g. TITIK-2026-00042)
      ↓
Algorithmic & Confirmed Budget Tracing (APBD Linkage)
      ↓
Append-Only Civic Audit Trail (report_events)
      ↓
Citizen Follow-up via Capability Secret Token
```

---

## 2. Core Integrity Principles

### 2.1 Anonymity by Default with Capability Follow-Up Tokens
- Citizens are never forced to provide National IDs (NIK), phone numbers, or social media accounts.
- When a report is submitted, the client generates a high-entropy 64-character hexadecimal secret.
- The SHA-256 hash of this token is stored in the database (`reporter_private_data`).
- The plain secret remains solely with the citizen (saved in browser local storage and displayed for manual backup).
- To inspect private draft or review status before publication, the citizen provides the token. The database procedure `get_report_by_follow_up_token()` validates the hash via `SECURITY DEFINER` without granting arbitrary table read permissions.

### 2.2 Physical Evidence & AI Metadata Screening
- The report form requires at least one JPEG, PNG, or WebP photo and one MP4, WebM, or MOV video, each up to 10MB.
- The client and submission endpoint reject files whose readable metadata explicitly names a known generative AI tool.
- Metadata checks cannot establish that media is genuine: metadata can be removed or changed, and generated media may contain no AI marker. Human evidence review remains necessary.
- In the configured Supabase workflow, uploads land in the private quarantine bucket `report-evidence-private`; only approved media is made public.

### 2.3 Spatial Precision vs Public Privacy
- Coordinates are captured through user-initiated HTML5 Geolocation (`navigator.geolocation`) or intentional map pin placement.
- When a report is marked as approximate or concerns a sensitive location, the system derives generalized coordinates (`public_latitude`, `public_longitude`) rounded to 3 decimal places (~110m accuracy) to prevent pinpointing private residences while retaining geographic utility for public works.

### 2.4 Append-Only Civic Audit Trail
- Fabricated, auto-advancing 6-step progress bars have been eliminated.
- All status transitions, official notes, and verified actions are recorded in `report_events`.
- A PostgreSQL database trigger `prevent_report_events_mutation()` actively prevents `UPDATE` or `DELETE` operations on `report_events`, ensuring an immutable public ledger.
- If an official department has not responded, the UI truthfully states that no official response has been registered.

### 2.5 Suggested vs Confirmed Correlations
TITIK. maintains an explicit ontological boundary:
- **Citizen Observation**: What the user saw and photographed.
- **Suggested Match**: Algorithmic heuristic matching based on geographic proximity, sector classification, and open APBD datasets (`match_status = 'suggested'`).
- **Confirmed Match**: Manually verified by an authorized community auditor, ombudsman, or public official (`match_status = 'confirmed'`).

---

## 3. The 3-Step Canonical Workflow Component

Both `/lapor` and the quick-report modal use `ReportWorkflowForm.tsx`:

### Step 1: Issue & Real Media
- Title (min 5 characters) and description (min 10 characters).
- Sector classification (Pendidikan, Kesehatan, Lingkungan & Drainase, Infrastruktur Jalan, etc.).
- Severity assessment (Rendah, Sedang, Kritis).
- The report form offers a clearly labeled simulated example to help citizens describe an observed issue; example details must be replaced with firsthand facts.
- At least one real photo (JPEG, PNG, or WebP) and one real video (MP4, WebM, or MOV), each up to 10 MB, are required before submission.
- The client and submission endpoint reject files whose readable metadata explicitly names a known generative AI tool. This is only a metadata-marker check, not a reliable authenticity detector; files without such markers may still be generated or manipulated and require human review.

### Step 2: Location & Spatial Calibration
- User-initiated GPS geolocation button with accuracy indicator.
- Interactive map coordinate verification.
- Approximate location toggle for domestic/sensitive locations.
- Proximity check: detects existing citizen reports within 600 meters in the same sector to prevent duplicate fragmentation.

### Step 3: Review, Budget Context, & Submission
- Preview of suggested responsible agency and linked APBD project.
- Community Priority Support option for nearby duplicates.
- Privacy mode confirmation (Anonymous vs Verified Handle).
- Realtime progress feedback during photo upload and database persistence.
- Post-submission receipt displaying public reference (`TITIK-2026-XXXXX`), follow-up secret token, copy button, and navigation links.

## 4. Navigation & Interface Architecture (`/lapor`)

The civic reporting center at `/lapor` is organized into three distinct workflows:

- **Laporan Saya (`/laporan-saya`)**: Authenticated users can view only reports whose `reporterUserId` matches their active account. Each report shows its latest status and the admin action history, including the note, actor, and timestamp. In demo/offline mode, status changes and their audit events are stored with the report in that browser's IndexedDB.
- When rejecting a report, an administrator must provide actionable correction guidance. The report owner sees this guidance in a warning on **Laporan Saya**, can edit the report details, and resubmit the same report/reference. Resubmission preserves the rejection audit event and adds a citizen resubmission event.
- Administrators can permanently remove an unclear or invalid report with **Hapus Permanen** after confirming the action. The report and its linked feed post are removed from the local demo data and are excluded after reload.

1. **Daftar Kasus Warga (`ALL_REPORTS`)**:
   - Searchable, filterable directory of all published citizen observations.
   - Distinct badges for suggested vs confirmed agency/APBD project linkages.
   - Community upvoting with SHA-256 voter token deduplication.
   - Direct link to individual report audit records (`/lapor/:id`).

2. **+ Buat Laporan Baru (`NEW_REPORT`)**:
   - The canonical 3-step reporting workflow (`ReportWorkflowForm.tsx`).
   - Requires real image files with client-side EXIF sanitization before storage upload.
   - User-initiated GPS geolocation or explicit map pin placement.
   - Automatic nearby duplicate detection (< 600m in same category).
   - Follow-up secret token generation with local backup.

3. **Kurasi Komunitas (`MODERATION`)**:
   - Review portal for incoming quarantined submissions (`publication_status = 'pending'`).
   - Displays uploaded evidence from `report-evidence-private`.
   - Displays spatial acquisition method (accurate vs approximate ~110m).
   - Provides 3 one-click curator actions backed by `moderate_report` RPC:
     - **Setujui & Publikasikan**: Marks report as `published`, moves media to public visibility, and appends an immutable `APPROVED_PUBLISHED` event with curator justification notes.
     - **Tolak Laporan**: Marks report as `rejected` and appends `REJECTED` event.
     - **Tandai Dalam Tinjauan**: Marks report as `under_review` for further field inspection.

---

## 5. Truthful Fallback Mode

When `VITE_SUPABASE_URL` is omitted or unconfigured:
- Submitted demo reports and evidence are persisted in browser IndexedDB, with media stored as blobs to avoid the small `localStorage` quota.
- This fallback is limited to the same browser profile and device; clearing site data removes local submissions, and it does not publish them to other users.
- A successful local submission means browser storage completed, not that a government agency received or verified the report.
