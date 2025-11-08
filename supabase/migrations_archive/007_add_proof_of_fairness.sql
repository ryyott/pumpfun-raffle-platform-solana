-- Migration: Add Proof of Fairness Storage
-- Created: 2025-10-21

-- Add proof_data column to rain_pools table
ALTER TABLE rain_pools
ADD COLUMN IF NOT EXISTS proof_data JSONB DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN rain_pools.proof_data IS 'Provably fair proof data including seed, timestamp, participants snapshot, and winner selection details';

-- Create index for faster queries on proof data
CREATE INDEX IF NOT EXISTS idx_rain_pools_proof_data ON rain_pools USING GIN (proof_data);
