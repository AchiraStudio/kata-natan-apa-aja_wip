import process from 'node:process';
import { createClient } from '@supabase/supabase-js';
import { MOCK_POSTS_KN, MOCK_REPORTS_KN, MOCK_FACILITIES } from '../src/data/mockCivicData';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://oetnxbovjwovaddivmwf.supabase.co';
const supabaseKey =
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ldG54Ym92andvdmFkZGl2bXdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIyMTMzMDUsImV4cCI6MjEwNzc4OTMwNX0.TrLvfg1dCPs_Vuiw-En739SS83w3gxNkNiAL73oRGYM';

export async function seedSupabaseFull() {
  console.log('Connecting to Supabase at:', supabaseUrl);
  const client = createClient(supabaseUrl, supabaseKey);

  // 1. Seed Facilities
  console.log('Seeding facilities...');
  const facilityRows = MOCK_FACILITIES.map((f) => ({
    id: f.id,
    name: f.name,
    category: f.category,
    address: f.address,
    latitude: f.latitude,
    longitude: f.longitude,
    responsible_agency: f.responsibleAgency,
    active_reports_count: 0,
    resolved_reports_count: f.resolvedReportsCount || 0,
  }));

  const { error: facError } = await client.from('facilities').upsert(facilityRows);
  if (facError) {
    console.warn('Facility upsert error (table may need creation):', facError.message);
  } else {
    console.log(`Successfully seeded ${facilityRows.length} facilities!`);
  }

  // 2. Seed Reports (with 0 support count)
  console.log('Seeding reports (clean with 0 count)...');
  const reportRows = MOCK_REPORTS_KN.map((r) => ({
    id: r.id,
    public_reference: r.publicReference,
    reporter_user_id: r.reporterUserId || null,
    secret_follow_up_token_hash: r.secretFollowUpTokenHash || null,
    title: r.title,
    description: r.description,
    category: r.category,
    severity: r.severity,
    status: r.status,
    publication_status: r.publicationStatus,
    location: r.location,
    facility_name: r.facilityName || null,
    responsible_agency: r.responsibleAgency,
    media_urls: r.mediaUrls,
    reporter_type: r.reporterType,
    reporter_display_name: r.reporterDisplayName,
    support_count: 0,
    budget_context: r.budgetContext,
    events: r.events,
    created_at: r.createdAt,
    updated_at: r.updatedAt,
  }));

  const { error: repError } = await client.from('reports').upsert(reportRows);
  if (repError) {
    console.warn('Reports upsert error (table may need creation):', repError.message);
  } else {
    console.log(`Successfully seeded ${reportRows.length} reports!`);
  }

  // 3. Seed Posts (with 0 counts)
  console.log('Seeding posts (clean with 0 counts)...');
  const postRows = MOCK_POSTS_KN.map((p) => ({
    id: p.id,
    author_id: p.author.id,
    author_username: p.author.username,
    author_display_name: p.author.displayName,
    author_avatar_url: p.author.avatarUrl,
    author_role: p.author.role,
    body: p.body,
    post_type: p.postType,
    media: p.media,
    location_tag: p.locationTag,
    related_report_id: p.relatedReportId || null,
    support_count: 0,
    likes_count: 0,
    saves_count: 0,
    comments_count: 0,
    shares_count: 0,
    created_at: p.createdAt,
  }));

  const { error: postError } = await client.from('posts').upsert(postRows);
  if (postError) {
    console.warn('Posts upsert error (table may need creation):', postError.message);
  } else {
    console.log(`Successfully seeded ${postRows.length} posts!`);
  }

  console.log('\nSeed execution finished. If tables are not yet created in Supabase:');
  console.log('Run supabase/schema.sql in your Supabase project SQL Editor!');
}

seedSupabaseFull().catch((err) => {
  console.error('Seed script failed:', err);
});

