-- Migration: Initial schema setup with RLS policies
-- Run this migration after setting up your Supabase project

-- Enable Row Level Security
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- Sessions table policies
-- Authenticated users can read any session (for joining)
CREATE POLICY "Authenticated users can read sessions" ON sessions
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only session owners can update sessions
CREATE POLICY "Session owners can update sessions" ON sessions
  FOR UPDATE USING (auth.uid() = owner_id);

-- Only session owners can delete sessions
CREATE POLICY "Session owners can delete sessions" ON sessions
  FOR DELETE USING (auth.uid() = owner_id);

-- Stories table policies
-- Authenticated users can read stories from sessions they can access
CREATE POLICY "Authenticated users can read stories" ON stories
  FOR SELECT USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM sessions 
      WHERE sessions.id = stories.session_id
    )
  );

-- Authenticated users can insert stories
CREATE POLICY "Authenticated users can insert stories" ON stories
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Authenticated users can update stories
CREATE POLICY "Authenticated users can update stories" ON stories
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Authenticated users can delete stories
CREATE POLICY "Authenticated users can delete stories" ON stories
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create indexes for better performance
CREATE INDEX idx_sessions_code ON sessions(code);
CREATE INDEX idx_sessions_owner_id ON sessions(owner_id);
CREATE INDEX idx_stories_session_id ON stories(session_id);
CREATE INDEX idx_stories_is_anchor ON stories(is_anchor);

-- Create a function to handle user creation/update
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, users.name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create/update user records
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
