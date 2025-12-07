-- Migration: Fix pixel extraction from JSONB
-- Description: Use jsonb_array_elements_text to properly extract pixel strings without JSON quotes

DROP FUNCTION IF EXISTS exchange_art(TEXT, JSONB, TEXT, INET, INT);

CREATE OR REPLACE FUNCTION exchange_art(
  new_title TEXT,
  new_pixels JSONB,
  client_fingerprint TEXT,
  client_ip INET,
  work_seconds INT DEFAULT 0
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sanitized_title TEXT;
  normalized_work INT := COALESCE(work_seconds, 0);
  normalized_pixels JSONB;
  pixel TEXT;
  is_all_white BOOLEAN := TRUE;
  existing_post RECORD;
  new_post_id UUID;
  exchanged_post RECORD;
  short_window_count INT;
  long_window_count INT;
  ng_words TEXT[] := ARRAY['badword', 'spam', 'abuse', 'violence', 'hate'];
BEGIN
  -- Title sanitize & default
  sanitized_title := btrim(regexp_replace(COALESCE(new_title, ''), '[[:cntrl:]]', '', 'g'));
  IF sanitized_title = '' THEN
    sanitized_title := 'むだい';
  END IF;

  IF char_length(sanitized_title) > 5 THEN
    RAISE EXCEPTION 'Title must be 5 characters or less'
      USING ERRCODE = '22001';
  END IF;

  -- NG word check (case-insensitive, partial)
  FOREACH pixel IN ARRAY ng_words LOOP
    IF sanitized_title ILIKE '%' || pixel || '%' THEN
      RAISE EXCEPTION 'Title contains inappropriate words'
        USING ERRCODE = '22023';
    END IF;
  END LOOP;

  -- Pixels validation: ensure array length
  IF new_pixels IS NULL OR jsonb_typeof(new_pixels) != 'array' OR jsonb_array_length(new_pixels) != 16 THEN
    RAISE EXCEPTION 'Pixels must be an array of 16 colors'
      USING ERRCODE = '22023';
  END IF;

  -- Normalize pixels: trim whitespace and rebuild as JSONB array
  -- Use jsonb_array_elements_text to get text without JSON quotes
  SELECT jsonb_agg(to_jsonb(btrim(elem)))
  INTO normalized_pixels
  FROM jsonb_array_elements_text(new_pixels) AS elem;

  -- Validate each pixel using jsonb_array_elements_text (returns text without quotes)
  FOR pixel IN SELECT elem FROM jsonb_array_elements_text(normalized_pixels) AS elem LOOP
    IF pixel !~ '^#[0-9a-fA-F]{6}$' THEN
      RAISE EXCEPTION 'Invalid pixel format: %', pixel
        USING ERRCODE = '22023';
    END IF;

    IF lower(pixel) != '#ffffff' THEN
      is_all_white := FALSE;
    END IF;
  END LOOP;

  -- Fingerprint validation
  IF client_fingerprint IS NULL OR client_fingerprint !~* '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' THEN
    RAISE EXCEPTION 'Invalid fingerprint format'
      USING ERRCODE = '22023';
  END IF;

  -- Empty canvas with no title
  IF is_all_white AND sanitized_title = 'むだい' THEN
    RAISE EXCEPTION 'Empty canvas with no title'
      USING ERRCODE = '22023';
  END IF;

  -- work_seconds normalization (5s-3600s)
  IF normalized_work < 5 THEN
    normalized_work := 0;
  END IF;
  IF normalized_work > 3600 THEN
    normalized_work := 3600;
  END IF;

  -- Rate limiting (fingerprint/IP)
  SELECT COUNT(*) INTO short_window_count
  FROM posts
  WHERE created_at >= (NOW() - INTERVAL '20 seconds')
    AND (
      (client_fingerprint IS NOT NULL AND fingerprint = client_fingerprint)
      OR (client_ip IS NOT NULL AND ip_address = client_ip)
    );

  IF short_window_count >= 3 THEN
    RAISE EXCEPTION 'Rate limit exceeded (3 posts / 20sec)'
      USING ERRCODE = '42501';
  END IF;

  SELECT COUNT(*) INTO long_window_count
  FROM posts
  WHERE created_at >= (NOW() - INTERVAL '300 seconds')
    AND (
      (client_fingerprint IS NOT NULL AND fingerprint = client_fingerprint)
      OR (client_ip IS NOT NULL AND ip_address = client_ip)
    );

  IF long_window_count >= 20 THEN
    RAISE EXCEPTION 'Rate limit exceeded (20 posts / 300sec)'
      USING ERRCODE = '42501';
  END IF;

  -- Duplicate pixel board check (use normalized pixels)
  SELECT id, title, pixels, created_at
  INTO existing_post
  FROM posts
  WHERE pixels = normalized_pixels
  LIMIT 1;

  IF existing_post.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'duplicate', TRUE,
      'id', existing_post.id,
      'title', existing_post.title,
      'pixels', existing_post.pixels::TEXT,
      'created_at', existing_post.created_at
    );
  END IF;

  -- Insert new post
  INSERT INTO posts (title, pixels, is_exchanged, fingerprint, ip_address, work_seconds)
  VALUES (sanitized_title, normalized_pixels, FALSE, client_fingerprint, client_ip, normalized_work)
  RETURNING id INTO new_post_id;

  -- Find exchange partner (exclude self and same fingerprint)
  SELECT id, title, pixels, created_at
  INTO exchanged_post
  FROM posts
  WHERE is_exchanged = FALSE
    AND id != new_post_id
    AND (fingerprint IS NULL OR fingerprint != client_fingerprint)
  ORDER BY RANDOM()
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF exchanged_post.id IS NOT NULL THEN
    UPDATE posts
    SET is_exchanged = TRUE
    WHERE id = exchanged_post.id;

    RETURN jsonb_build_object(
      'id', exchanged_post.id,
      'title', exchanged_post.title,
      'pixels', exchanged_post.pixels::TEXT,
      'created_at', exchanged_post.created_at
    );
  END IF;

  RETURN NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION exchange_art(TEXT, JSONB, TEXT, INET, INT) TO anon;
GRANT EXECUTE ON FUNCTION exchange_art(TEXT, JSONB, TEXT, INET, INT) TO authenticated;

COMMENT ON FUNCTION exchange_art(TEXT, JSONB, TEXT, INET, INT) IS 'Submits a new pixel art and exchanges it with a random unexchanged post. Returns the exchanged post, duplicate info, or NULL if no partner.';

