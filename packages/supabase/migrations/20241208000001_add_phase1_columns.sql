-- Migration: Phase 1 column additions for posts
-- Description: Adds Phase 1 columns and supporting indexes.

ALTER TABLE posts
    ADD COLUMN IF NOT EXISTS user_id UUID,
    ADD COLUMN IF NOT EXISTS likes_count INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS report_count INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS ip_address INET,
    ADD COLUMN IF NOT EXISTS fingerprint TEXT,
    ADD COLUMN IF NOT EXISTS work_seconds INT NOT NULL DEFAULT 0;

-- Indexes for Phase 1 features
CREATE INDEX IF NOT EXISTS idx_posts_fingerprint ON posts(fingerprint);
CREATE INDEX IF NOT EXISTS idx_posts_pixels ON posts USING HASH (pixels);
