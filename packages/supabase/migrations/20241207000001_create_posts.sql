-- Migration: Create posts table
-- Description: Creates the main posts table for storing pixel art submissions

-- Create posts table
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  pixels JSONB NOT NULL,
  is_exchanged BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT title_length CHECK (char_length(title) <= 5),
  CONSTRAINT pixels_format CHECK (
    jsonb_typeof(pixels) = 'array' 
    AND jsonb_array_length(pixels) = 16
  )
);

-- Create indexes for performance
-- Partial index for finding unexchanged posts quickly
CREATE INDEX idx_posts_is_exchanged ON posts(is_exchanged) WHERE is_exchanged = FALSE;

-- Index for sorting by creation date
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);

-- Enable Row Level Security
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can view exchanged posts (for potential future use)
CREATE POLICY "Anyone can view exchanged posts"
  ON posts
  FOR SELECT
  USING (is_exchanged = TRUE);

-- Comment on table
COMMENT ON TABLE posts IS 'Stores 4x4 pixel art submissions for exchange';
COMMENT ON COLUMN posts.id IS 'Unique identifier for the post';
COMMENT ON COLUMN posts.title IS 'Title of the artwork (max 5 characters)';
COMMENT ON COLUMN posts.pixels IS 'Array of 16 hex color codes representing the 4x4 grid';
COMMENT ON COLUMN posts.is_exchanged IS 'Whether this post has been exchanged with another user';
COMMENT ON COLUMN posts.created_at IS 'Timestamp when the post was created';
