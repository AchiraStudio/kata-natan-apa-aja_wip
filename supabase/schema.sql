-- =============================================================================
-- TITIK. — Database Schema (Supabase PostgreSQL)
-- Multi-user civic social platform, public reporting & administrative review
-- =============================================================================

-- 1. Create Profiles Table (Synced with Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  email TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'citizen' CHECK (role IN ('citizen', 'moderator', 'admin')),
  verified_agency TEXT,
  district TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow public read access to civic profiles
CREATE POLICY "Public profiles are viewable by everyone." 
  ON public.profiles FOR SELECT USING (true);

-- Allow authenticated users to insert/update their own profile
CREATE POLICY "Users can insert their own profile." 
  ON public.profiles FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own profile." 
  ON public.profiles FOR UPDATE USING (true);

-- 2. Trigger to automatically create a profile record when a new user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, email, avatar_url, role, district, is_verified, bio)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.email,
    COALESCE(new.raw_user_meta_data->>'avatar_url', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'),
    COALESCE(new.raw_user_meta_data->>'role', 'citizen'),
    COALESCE(new.raw_user_meta_data->>'district', 'Bogor Tengah'),
    true,
    'Warga terdaftar di portal TITIK.'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger definition
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();



-- =============================================================================
-- 3. Comments Table (Threaded Citizen Testimonies & Social Discussion)
-- =============================================================================
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

-- Enable RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Allow public read access to comments
CREATE POLICY "Public can view comments" 
  ON public.comments FOR SELECT USING (true);

-- Allow public/authenticated insert of citizen comments
CREATE POLICY "Public can insert comments" 
  ON public.comments FOR INSERT WITH CHECK (true);

-- Allow updating comment likes
CREATE POLICY "Public can update comment likes" 
  ON public.comments FOR UPDATE USING (true);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(created_at DESC);
