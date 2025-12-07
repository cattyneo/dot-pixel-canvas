-- Seed data for development/testing
-- This file is run when using `supabase db reset`

-- Insert some sample posts for testing the exchange functionality
INSERT INTO posts (title, pixels, is_exchanged, created_at) VALUES
(
  'ハート',
  '["#ffffff", "#ff6b6b", "#ff6b6b", "#ffffff", "#ff6b6b", "#ff6b6b", "#ff6b6b", "#ff6b6b", "#ff6b6b", "#ff6b6b", "#ff6b6b", "#ff6b6b", "#ffffff", "#ff6b6b", "#ff6b6b", "#ffffff"]'::jsonb,
  FALSE,
  NOW() - INTERVAL '1 day'
),
(
  'そら',
  '["#87ceeb", "#87ceeb", "#ffffff", "#87ceeb", "#87ceeb", "#87ceeb", "#87ceeb", "#87ceeb", "#87ceeb", "#87ceeb", "#87ceeb", "#87ceeb", "#87ceeb", "#ffffff", "#87ceeb", "#87ceeb"]'::jsonb,
  FALSE,
  NOW() - INTERVAL '2 days'
),
(
  'きのこ',
  '["#ffffff", "#ff0000", "#ff0000", "#ffffff", "#ff0000", "#ffffff", "#ffffff", "#ff0000", "#ffffff", "#f5deb3", "#f5deb3", "#ffffff", "#ffffff", "#f5deb3", "#f5deb3", "#ffffff"]'::jsonb,
  FALSE,
  NOW() - INTERVAL '3 days'
);
