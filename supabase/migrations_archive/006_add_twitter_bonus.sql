-- Migration: Add Twitter Bonus Feature
-- Created: 2025-10-20
-- Description: Add columns to track Twitter share bonus tickets (one-time per pool)

-- 1. Add Twitter bonus columns to rain_pool_participants
ALTER TABLE rain_pool_participants
ADD COLUMN IF NOT EXISTS twitter_bonus_claimed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS twitter_bonus_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS twitter_bonus_tweet_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS twitter_bonus_tickets INTEGER DEFAULT 0;

-- 2. Update total_tickets calculation to include twitter bonus
-- Drop existing generated column and recreate with twitter bonus
ALTER TABLE rain_pool_participants
DROP COLUMN IF EXISTS total_tickets;

ALTER TABLE rain_pool_participants
ADD COLUMN total_tickets INTEGER GENERATED ALWAYS AS (free_tickets + burn_boost_tickets + twitter_bonus_tickets) STORED;

-- 3. Create index for twitter bonus queries
CREATE INDEX IF NOT EXISTS idx_participants_twitter_bonus ON rain_pool_participants(twitter_bonus_claimed);

-- 4. Add comments for documentation
COMMENT ON COLUMN rain_pool_participants.twitter_bonus_claimed IS 'Whether user has claimed Twitter share bonus for this pool (one-time only)';
COMMENT ON COLUMN rain_pool_participants.twitter_bonus_timestamp IS 'When the user claimed their Twitter share bonus';
COMMENT ON COLUMN rain_pool_participants.twitter_bonus_tweet_url IS 'URL of the promotional tweet shared by user';
COMMENT ON COLUMN rain_pool_participants.twitter_bonus_tickets IS 'Number of bonus tickets from Twitter share (0 or 1)';

-- 5. Create view for Twitter bonus statistics
CREATE OR REPLACE VIEW twitter_bonus_statistics AS
SELECT
  DATE_TRUNC('day', twitter_bonus_timestamp) as bonus_date,
  COUNT(*) as total_claims,
  COUNT(DISTINCT wallet_address) as unique_claimers,
  COUNT(*) FILTER (WHERE twitter_bonus_tweet_url IS NOT NULL) as claims_with_url
FROM rain_pool_participants
WHERE twitter_bonus_claimed = TRUE
GROUP BY DATE_TRUNC('day', twitter_bonus_timestamp)
ORDER BY bonus_date DESC;

-- 6. Create function to check if user can claim Twitter bonus
CREATE OR REPLACE FUNCTION can_claim_twitter_bonus(
  p_wallet_address TEXT,
  p_pool_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_already_claimed BOOLEAN;
BEGIN
  -- Check if user already claimed bonus for this pool
  SELECT twitter_bonus_claimed INTO v_already_claimed
  FROM rain_pool_participants
  WHERE wallet_address = p_wallet_address
    AND pool_id = p_pool_id;

  -- If no record found, user hasn't joined pool yet
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- User can claim if they haven't claimed yet
  RETURN NOT COALESCE(v_already_claimed, FALSE);
END;
$$ LANGUAGE plpgsql;
