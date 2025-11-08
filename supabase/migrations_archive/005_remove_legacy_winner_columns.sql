-- Migration: Remove legacy single-winner columns
-- Created: 2025-10-19
-- Purpose: Clean up deprecated winner_user_id and winner_wallet_address columns
--          All winner data is now stored in winner_user_ids/winner_wallet_addresses arrays
--          and the rain_pool_winners table

-- Drop dependent view first if it exists
DROP VIEW IF EXISTS current_open_pool CASCADE;

-- Drop the legacy single-winner columns
ALTER TABLE rain_pools
DROP COLUMN IF EXISTS winner_user_id,
DROP COLUMN IF EXISTS winner_wallet_address;

-- Recreate the view without the legacy columns (if it was a view)
-- If current_open_pool is actually a table, this will be skipped
CREATE OR REPLACE VIEW current_open_pool AS
SELECT
  id,
  total_prize_sol,
  status,
  max_participants,
  starts_at,
  ends_at,
  created_at,
  updated_at,
  winner_count,
  total_payout_sol,
  completed_at,
  market_cap,
  market_cap_updated_at,
  mint,
  creator_rewards_pending_sol,
  creator_rewards_giveaway_sol,
  creator_rewards_updated_at,
  token_price_usd,
  winner_user_ids,
  winner_wallet_addresses
FROM rain_pools
WHERE status = 'open'
ORDER BY created_at DESC
LIMIT 1;

-- Add comments explaining the change
COMMENT ON COLUMN rain_pools.winner_user_ids IS 'Array of all winner user IDs for this pool (supports multiple winners)';
COMMENT ON COLUMN rain_pools.winner_wallet_addresses IS 'Array of all winner wallet addresses for this pool (supports multiple winners)';
