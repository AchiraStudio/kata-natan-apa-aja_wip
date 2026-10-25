import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { MOCK_COMMENTS } from '../src/data/mockCivicData';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to escape single quotes for SQL string literals
function sqlEscape(str: string): string {
  return str.replace(/'/g, "''");
}

// Generates randomized ISO timestamps
// Parents are placed in the past (e.g., 1 to 30 hours ago)
// Replies are placed strictly after their respective parent
function generateCommentTimestamps() {
  const timestampMap: Record<string, string> = {};
  const parentTimeMap: Record<string, number> = {};

  const now = Date.now();

  // First pass: assign timestamps to top-level comments
  for (const [postId, comments] of Object.entries(MOCK_COMMENTS)) {
    const topLevel = comments.filter((c) => !c.parentId);
    const totalTop = topLevel.length;

    topLevel.forEach((c, idx) => {
      // Distribute timestamps from 30 hours ago down to 15 minutes ago
      // idx 0 is most recent or oldest depending on ordering
      const hoursAgo = Math.max(0.25, (totalTop - idx) * 1.5 + (Math.random() * 0.8 - 0.4));
      const commentTimeMs = now - Math.floor(hoursAgo * 60 * 60 * 1000);
      timestampMap[c.id] = new Date(commentTimeMs).toISOString();
      parentTimeMap[c.id] = commentTimeMs;
    });

    // Second pass: assign timestamps to replies (must be after parent)
    const replies = comments.filter((c) => c.parentId);
    replies.forEach((r, rIdx) => {
      const parentMs = parentTimeMap[r.parentId!] || (now - 2 * 60 * 60 * 1000);
      // Reply happens 5 to 45 minutes after the parent comment
      const jitterMs = Math.floor((5 + rIdx * 8 + Math.random() * 12) * 60 * 1000);
      const replyTimeMs = Math.min(now - 60 * 1000, parentMs + jitterMs);
      timestampMap[r.id] = new Date(replyTimeMs).toISOString();
    });
  }

  return timestampMap;
}

export async function generateSqlSeedAndPush() {
  console.log('Generating Supabase Comments Schema and Seed SQL...');
  const timestamps = generateCommentTimestamps();

  // Prepare SQL statements
  const sqlHeader = `-- =============================================================================
-- TITIK. — Supabase Comments Schema & Seed Migration
-- Table: public.comments (Threaded citizen testimonies & social discussions)
-- Generated: ${new Date().toISOString()}
-- =============================================================================

-- 1. Create Comments Table
CREATE TABLE IF NOT EXISTS public.comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  avatar_url TEXT,
  body TEXT NOT NULL,
  parent_id TEXT REFERENCES public.comments(id) ON DELETE CASCADE,
  likes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Indexes for High-Traffic Queries
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(created_at DESC);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
DROP POLICY IF EXISTS "Public can view comments" ON public.comments;
CREATE POLICY "Public can view comments"
  ON public.comments FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public can insert comments" ON public.comments;
CREATE POLICY "Public can insert comments"
  ON public.comments FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public can update comment likes" ON public.comments;
CREATE POLICY "Public can update comment likes"
  ON public.comments FOR UPDATE
  USING (true);

-- 5. Seed Comments with Realistic Random Timestamps & Threaded Replies
`;

  const topLevelInserts: string[] = [];
  const replyInserts: string[] = [];

  const allRecordsToPush: Array<{
    id: string;
    post_id: string;
    author_name: string;
    avatar_url: string;
    body: string;
    parent_id: string | null;
    likes: number;
    created_at: string;
  }> = [];

  for (const [postId, comments] of Object.entries(MOCK_COMMENTS)) {
    for (const c of comments) {
      const createdAt = timestamps[c.id] || new Date().toISOString();
      const parentIdSql = c.parentId ? `'${sqlEscape(c.parentId)}'` : 'NULL';
      const record = {
        id: c.id,
        post_id: postId,
        author_name: c.authorName,
        avatar_url: c.avatarUrl,
        body: c.body,
        parent_id: c.parentId || null,
        likes: c.likes || 0,
        created_at: createdAt,
      };

      allRecordsToPush.push(record);

      const sqlLine = `('${sqlEscape(c.id)}', '${sqlEscape(postId)}', '${sqlEscape(c.authorName)}', '${sqlEscape(c.avatarUrl)}', '${sqlEscape(c.body)}', ${parentIdSql}, ${c.likes || 0}, '${createdAt}')`;

      if (c.parentId) {
        replyInserts.push(sqlLine);
      } else {
        topLevelInserts.push(sqlLine);
      }
    }
  }

  const sqlBody = `
-- Insert Top-Level Comments
INSERT INTO public.comments (id, post_id, author_name, avatar_url, body, parent_id, likes, created_at)
VALUES
${topLevelInserts.join(',\n')}
ON CONFLICT (id) DO UPDATE SET
  body = EXCLUDED.body,
  likes = EXCLUDED.likes,
  created_at = EXCLUDED.created_at;

-- Insert Threaded Sub-Replies
INSERT INTO public.comments (id, post_id, author_name, avatar_url, body, parent_id, likes, created_at)
VALUES
${replyInserts.join(',\n')}
ON CONFLICT (id) DO UPDATE SET
  body = EXCLUDED.body,
  likes = EXCLUDED.likes,
  created_at = EXCLUDED.created_at;
`;

  const fullSql = sqlHeader + sqlBody;

  // Write migration file
  const migrationPath = path.resolve(__dirname, '../supabase/migrations/20261025000001_comments_schema_and_seed.sql');
  fs.writeFileSync(migrationPath, fullSql, 'utf-8');
  console.log(`Saved migration to: ${migrationPath} (${topLevelInserts.length + replyInserts.length} comments seeded)`);

  // Check if live Supabase credentials are configured in environment
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey && supabaseUrl.startsWith('http')) {
    console.log(`Attempting live push to Supabase at: ${supabaseUrl}`);
    const client = createClient(supabaseUrl, supabaseKey);

    // Push top level comments first
    const topRecords = allRecordsToPush.filter((r) => r.parent_id === null);
    const replyRecords = allRecordsToPush.filter((r) => r.parent_id !== null);

    const { error: topErr } = await client.from('comments').upsert(topRecords);
    if (topErr) {
      console.warn('Live push for top-level comments failed:', topErr.message);
      console.log('You can run the generated SQL migration in your Supabase SQL Editor.');
    } else {
      console.log(`Successfully seeded ${topRecords.length} top-level comments to live Supabase!`);

      const { error: repErr } = await client.from('comments').upsert(replyRecords);
      if (repErr) {
        console.warn('Live push for replies failed:', repErr.message);
      } else {
        console.log(`Successfully seeded ${replyRecords.length} replies to live Supabase!`);
      }
    }
  } else {
    console.log('No live Supabase credentials in process.env. Migration file is ready to execute in Supabase dashboard or CLI.');
  }

  return { totalComments: allRecordsToPush.length, migrationPath };
}

// Execute directly when executed
generateSqlSeedAndPush()
  .then((res) => {
    console.log(`Done! Total comments generated: ${res.totalComments}`);
  })
  .catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
  });
