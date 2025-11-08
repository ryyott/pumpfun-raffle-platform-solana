-- Migration: Allow users to win multiple times in the same pool
-- Created: 2025-10-19
-- Purpose: Remove unique constraint so users with high ticket counts can win multiple prizes

-- Drop the unique constraint on (pool_id, user_id)
ALTER TABLE rain_pool_winners
DROP CONSTRAINT IF EXISTS rain_pool_winners_pool_id_user_id_key;

-- Add comment explaining the change
COMMENT ON TABLE rain_pool_winners IS 'Winners can appear multiple times per pool - each entry represents one prize won. Users with more tickets have proportionally higher chance on each independent draw.';
