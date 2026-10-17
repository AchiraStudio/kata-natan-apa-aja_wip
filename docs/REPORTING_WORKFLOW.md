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
Genuine Evidence (Client-side EXIF Sanitization)
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

### 2.2 Genuine Physical Evidence & Privacy Protection
- Random Unsplash presets and stock photography are strictly eliminated.
- Uploaded files are restricted to JPEG, PNG, and WebP formats up to 10MB each.
- **Client-Side EXIF Stripping**: Files are re-rendered through an HTML5 canvas element before upload. This removes hidden camera serial numbers, device signatures, and embedded GPS metadata, ensuring all spatial data originates from the citizen's conscious selection.
- All uploads land in the private quarantine bucket `report-evidence-private`. Only approved media is moved to `report-evidence-public`.

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
- Real camera snapshot or file upload with instant client-side thumbnail rendering.

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

---

## 4. Truthful Fallback Mode

When `VITE_SUPABASE_URL` is omitted, the application operates in transparent simulation mode:
- Reports receive mock references formatted as `TITIK-DEMO-XXXX`.
- Visual badges clearly state "Mode Simulasi (Supabase Belum Terhubung)" rather than falsifying real database persistence.

