-- Migration: Add winner arrays to rain_pools table
-- Created: 2025-10-15
-- Purpose: Store all winner user IDs and wallet addresses for multiple winner scenarios

-- Add columns to store arrays of winners
ALTER TABLE rain_pools
ADD COLUMN IF NOT EXISTS winner_user_ids UUID[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS winner_wallet_addresses TEXT[] DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN rain_pools.winner_user_ids IS 'Array of all winner user IDs (for multiple winner scenarios)';
COMMENT ON COLUMN rain_pools.winner_wallet_addresses IS 'Array of all winner wallet addresses (for multiple winner scenarios)';

-- Note: Existing winner_user_id and winner_wallet_address columns remain for backwards compatibility and single-winner scenarios
