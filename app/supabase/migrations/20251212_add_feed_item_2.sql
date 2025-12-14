ALTER TABLE kami_profiles 
ADD COLUMN IF NOT EXISTS feed_item_id_2 INTEGER DEFAULT NULL;

COMMENT ON COLUMN kami_profiles.feed_item_id_2 IS 'Fallback item ID to feed when primary feed_item_id is exhausted';
