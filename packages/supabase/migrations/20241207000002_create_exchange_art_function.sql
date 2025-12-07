-- Migration: Create exchange_art RPC function
-- Description: Handles the art exchange logic with concurrency control

CREATE OR REPLACE FUNCTION exchange_art(
  new_title TEXT,
  new_pixels JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_post_id UUID;
  exchanged_post RECORD;
  result JSONB;
BEGIN
  -- Input validation
  IF new_title IS NULL OR char_length(new_title) = 0 THEN
    new_title := 'むだい';
  END IF;

  IF char_length(new_title) > 5 THEN
    RAISE EXCEPTION 'Title must be 5 characters or less'
      USING ERRCODE = '22001';
  END IF;

  IF new_pixels IS NULL OR jsonb_typeof(new_pixels) != 'array' OR jsonb_array_length(new_pixels) != 16 THEN
    RAISE EXCEPTION 'Pixels must be an array of 16 colors'
      USING ERRCODE = '22023';
  END IF;

  -- Insert the new post
  INSERT INTO posts (title, pixels, is_exchanged)
  VALUES (new_title, new_pixels, FALSE)
  RETURNING id INTO new_post_id;

  -- Find a random unexchanged post (not the one we just created)
  -- Using FOR UPDATE SKIP LOCKED to prevent race conditions
  SELECT id, title, pixels, created_at
  INTO exchanged_post
  FROM posts
  WHERE is_exchanged = FALSE
    AND id != new_post_id
  ORDER BY RANDOM()
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  -- If we found a post to exchange with
  IF exchanged_post.id IS NOT NULL THEN
    -- Mark the found post as exchanged
    UPDATE posts
    SET is_exchanged = TRUE
    WHERE id = exchanged_post.id;

    -- Build the result JSON
    -- Note: pixels is stored as JSONB but we return it as a string for compatibility
    result := jsonb_build_object(
      'id', exchanged_post.id,
      'title', exchanged_post.title,
      'pixels', exchanged_post.pixels::TEXT,
      'created_at', exchanged_post.created_at
    );

    RETURN result;
  END IF;

  -- No exchange partner found, return NULL
  RETURN NULL;
END;
$$;

-- Grant execute permission to anonymous users
GRANT EXECUTE ON FUNCTION exchange_art(TEXT, JSONB) TO anon;
GRANT EXECUTE ON FUNCTION exchange_art(TEXT, JSONB) TO authenticated;

-- Comment on function
COMMENT ON FUNCTION exchange_art IS 'Submits a new pixel art and exchanges it with a random unexchanged post. Returns the exchanged post or NULL if no exchange partner is available.';
