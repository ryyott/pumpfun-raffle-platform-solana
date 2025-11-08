-- Migration: Add Creator Fee Tracking and Automation
-- Created: 2025-10-28
-- Purpose: Track creator fee claims from Pump.fun and automate RainPool funding

-- 1. Ensure rain_pools has creator rewards columns
ALTER TABLE rain_pools
ADD COLUMN IF NOT EXISTS creator_rewards_pending_sol DECIMAL(20, 9) DEFAULT 0,
ADD COLUMN IF NOT EXISTS creator_rewards_giveaway_sol DECIMAL(20, 9) DEFAULT 0,
ADD COLUMN IF NOT EXISTS creator_rewards_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- 2. Create creator_fee_claims table to track all fee collection transactions
CREATE TABLE IF NOT EXISTS creator_fee_claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pool_id UUID REFERENCES rain_pools(id) ON DELETE CASCADE,

  -- Claim transaction details
  claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tx_sig_claim TEXT NOT NULL UNIQUE,
  total_lamports BIGINT NOT NULL,

  -- Split transaction details
  deployer_lamports BIGINT NOT NULL,
  dev_lamports BIGINT NOT NULL,
  tx_sig_deployer TEXT NOT NULL,
  tx_sig_dev TEXT NOT NULL,

  -- Status tracking
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'failed', 'pending')),
  error_message TEXT DEFAULT NULL,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_creator_fee_claims_pool_id ON creator_fee_claims(pool_id);
CREATE INDEX IF NOT EXISTS idx_creator_fee_claims_claimed_at ON creator_fee_claims(claimed_at DESC);
CREATE INDEX IF NOT EXISTS idx_creator_fee_claims_status ON creator_fee_claims(status);
CREATE INDEX IF NOT EXISTS idx_creator_fee_claims_tx_sig_claim ON creator_fee_claims(tx_sig_claim);

-- 4. Add comments for documentation
COMMENT ON TABLE creator_fee_claims IS 'Tracks all creator fee claims from Pump.fun and their 50/50 splits';
COMMENT ON COLUMN creator_fee_claims.tx_sig_claim IS 'Solana transaction signature for PumpPortal collectCreatorFee action';
COMMENT ON COLUMN creator_fee_claims.total_lamports IS 'Total lamports collected from creator fees';
COMMENT ON COLUMN creator_fee_claims.deployer_lamports IS 'Lamports sent to Deployer Wallet (funds RainPool giveaways)';
COMMENT ON COLUMN creator_fee_claims.dev_lamports IS 'Lamports sent to Dev Wallet (operations/marketing)';
COMMENT ON COLUMN creator_fee_claims.tx_sig_deployer IS 'Transaction signature for transfer to Deployer Wallet';
COMMENT ON COLUMN creator_fee_claims.tx_sig_dev IS 'Transaction signature for transfer to Dev Wallet';

COMMENT ON COLUMN rain_pools.creator_rewards_pending_sol IS 'Unclaimed creator fees available for collection (SOL)';
COMMENT ON COLUMN rain_pools.creator_rewards_giveaway_sol IS 'Creator fees allocated to giveaway pool (SOL)';
COMMENT ON COLUMN rain_pools.creator_rewards_updated_at IS 'Last time creator rewards were updated';

-- 5. Create view for creator fee statistics
CREATE OR REPLACE VIEW creator_fee_statistics AS
SELECT
  DATE_TRUNC('day', claimed_at) as claim_date,
  COUNT(*) as total_claims,
  SUM(total_lamports) / 1000000000.0 as total_sol_claimed,
  SUM(deployer_lamports) / 1000000000.0 as total_deployer_sol,
  SUM(dev_lamports) / 1000000000.0 as total_dev_sol,
  AVG(total_lamports) / 1000000000.0 as avg_claim_sol,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_claims
FROM creator_fee_claims
GROUP BY DATE_TRUNC('day', claimed_at)
ORDER BY claim_date DESC;

-- 6. Create function to get total creator fees claimed
CREATE OR REPLACE FUNCTION get_total_creator_fees_claimed()
RETURNS TABLE (
  total_claims BIGINT,
  total_sol_claimed DECIMAL,
  total_deployer_sol DECIMAL,
  total_dev_sol DECIMAL,
  last_claim_at TIMESTAMP WITH TIME ZONE,
  last_24h_claims BIGINT,
  last_24h_sol DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_claims,
    SUM(total_lamports) / 1000000000.0 as total_sol_claimed,
    SUM(deployer_lamports) / 1000000000.0 as total_deployer_sol,
    SUM(dev_lamports) / 1000000000.0 as total_dev_sol,
    MAX(claimed_at) as last_claim_at,
    COUNT(*) FILTER (WHERE claimed_at >= NOW() - INTERVAL '24 hours')::BIGINT as last_24h_claims,
    SUM(total_lamports) FILTER (WHERE claimed_at >= NOW() - INTERVAL '24 hours') / 1000000000.0 as last_24h_sol
  FROM creator_fee_claims
  WHERE status = 'completed';
END;
$$ LANGUAGE plpgsql;
