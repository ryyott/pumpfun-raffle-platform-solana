-- Migration: Add Tiered Entry System with Burn Boost
-- Created: 2025-10-07

-- 1. Update rain_pool_participants table to add ticket columns
ALTER TABLE rain_pool_participants
ADD COLUMN IF NOT EXISTS free_tickets INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS burn_boost_tickets INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_tickets INTEGER GENERATED ALWAYS AS (free_tickets + burn_boost_tickets) STORED,
ADD COLUMN IF NOT EXISTS burn_transaction_signature TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS burn_amount_tokens DECIMAL(20, 9) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS burn_amount_usd DECIMAL(10, 2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS holdings_usd_at_join DECIMAL(10, 2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS tier INTEGER DEFAULT 1;

-- Add unique constraint on burn transaction signature to prevent reuse
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_burn_transaction'
  ) THEN
    ALTER TABLE rain_pool_participants
    ADD CONSTRAINT unique_burn_transaction UNIQUE (burn_transaction_signature);
  END IF;
END $$;

-- 2. Create burn_transactions table for analytics
CREATE TABLE IF NOT EXISTS burn_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pool_id UUID REFERENCES rain_pools(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  burn_amount_tokens DECIMAL(20, 9) NOT NULL,
  burn_amount_usd DECIMAL(10, 2) NOT NULL,
  tickets_received INTEGER NOT NULL,
  transaction_signature TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(transaction_signature)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_burn_transactions_pool_id ON burn_transactions(pool_id);
CREATE INDEX IF NOT EXISTS idx_burn_transactions_wallet ON burn_transactions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_burn_transactions_created_at ON burn_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pool_participants_total_tickets ON rain_pool_participants(total_tickets);

-- 3. Add comments for documentation
COMMENT ON COLUMN rain_pool_participants.free_tickets IS 'Number of free tickets based on holdings tier';
COMMENT ON COLUMN rain_pool_participants.burn_boost_tickets IS 'Number of extra tickets from burning tokens';
COMMENT ON COLUMN rain_pool_participants.total_tickets IS 'Total tickets (free + burn boost) - auto-calculated';
COMMENT ON COLUMN rain_pool_participants.burn_transaction_signature IS 'Solana transaction signature for burn verification';
COMMENT ON COLUMN rain_pool_participants.burn_amount_tokens IS 'Amount of RAINDR0P tokens burned';
COMMENT ON COLUMN rain_pool_participants.burn_amount_usd IS 'USD value of burned tokens at time of burn';
COMMENT ON COLUMN rain_pool_participants.holdings_usd_at_join IS 'USD value of holdings when joining pool';
COMMENT ON COLUMN rain_pool_participants.tier IS 'Tier level (1-4) based on holdings';

-- 4. Create view for burn statistics
CREATE OR REPLACE VIEW burn_statistics AS
SELECT
  DATE_TRUNC('day', created_at) as burn_date,
  COUNT(*) as total_burns,
  SUM(burn_amount_tokens) as total_tokens_burned,
  SUM(burn_amount_usd) as total_usd_burned,
  SUM(tickets_received) as total_tickets_issued,
  AVG(burn_amount_usd) as avg_burn_usd,
  COUNT(DISTINCT wallet_address) as unique_burners
FROM burn_transactions
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY burn_date DESC;

-- 5. Create function to get user burn history
CREATE OR REPLACE FUNCTION get_user_burn_history(user_wallet TEXT)
RETURNS TABLE (
  pool_id UUID,
  burn_amount_tokens DECIMAL(20, 9),
  burn_amount_usd DECIMAL(10, 2),
  tickets_received INTEGER,
  transaction_signature TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    bt.pool_id,
    bt.burn_amount_tokens,
    bt.burn_amount_usd,
    bt.tickets_received,
    bt.transaction_signature,
    bt.created_at
  FROM burn_transactions bt
  WHERE bt.wallet_address = user_wallet
  ORDER BY bt.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 6. Create function to get community burn stats
CREATE OR REPLACE FUNCTION get_community_burn_stats()
RETURNS TABLE (
  total_burns BIGINT,
  total_tokens_burned DECIMAL,
  total_usd_burned DECIMAL,
  unique_burners BIGINT,
  avg_burn_usd DECIMAL,
  last_24h_burns BIGINT,
  last_24h_tokens_burned DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_burns,
    SUM(burn_amount_tokens) as total_tokens_burned,
    SUM(burn_amount_usd) as total_usd_burned,
    COUNT(DISTINCT wallet_address)::BIGINT as unique_burners,
    AVG(burn_amount_usd) as avg_burn_usd,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours')::BIGINT as last_24h_burns,
    SUM(burn_amount_tokens) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as last_24h_tokens_burned
  FROM burn_transactions;
END;
$$ LANGUAGE plpgsql;
