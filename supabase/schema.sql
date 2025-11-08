-- ============================================================================
-- RainDr0p Database Schema
-- ============================================================================
-- Complete database schema for the RainDr0p raffle platform
-- This schema includes all tables, views, functions, triggers, and indexes
--
-- To apply this schema to a new Supabase project:
-- psql "YOUR_DATABASE_CONNECTION_STRING" -f schema.sql
--
-- For setup instructions, see SETUP.md
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- -----------------------------------------------------------------------------
-- Users Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT UNIQUE NOT NULL,
  avatar TEXT,
  sol_balance DECIMAL(20, 9),
  token_balance DECIMAL(20, 9),
  is_eligible BOOLEAN DEFAULT FALSE,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE users IS 'User profiles linked to Solana wallet addresses';
COMMENT ON COLUMN users.wallet_address IS 'Unique Solana wallet public key';
COMMENT ON COLUMN users.is_eligible IS 'Whether user meets $10 minimum holdings requirement';

-- -----------------------------------------------------------------------------
-- Rain Pools Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rain_pools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  status TEXT NOT NULL CHECK (status IN ('open', 'closing', 'closed')),
  total_prize_sol DECIMAL(20, 9) NOT NULL DEFAULT 0,
  market_cap DECIMAL(20, 2),
  market_cap_updated_at TIMESTAMP WITH TIME ZONE,
  max_participants INTEGER,
  mint TEXT,
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  winner_count INTEGER,
  total_payout_sol DECIMAL(20, 9),
  winner_user_ids UUID[],
  winner_wallet_addresses TEXT[],
  proof_data JSONB,
  token_price_usd DECIMAL(20, 10),
  creator_rewards_pending_sol DECIMAL(20, 9) DEFAULT 0,
  creator_rewards_giveaway_sol DECIMAL(20, 9) DEFAULT 0,
  creator_rewards_updated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE rain_pools IS 'Rain pool instances with 30-minute duration';
COMMENT ON COLUMN rain_pools.status IS 'Current pool status: open, closing (atomic transition), or closed';
COMMENT ON COLUMN rain_pools.proof_data IS 'Proof of fairness data for winner selection';
COMMENT ON COLUMN rain_pools.creator_rewards_pending_sol IS 'Unclaimed creator fees available';
COMMENT ON COLUMN rain_pools.creator_rewards_giveaway_sol IS 'Creator fees allocated for giveaway pool';

-- -----------------------------------------------------------------------------
-- Rain Pool Participants Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rain_pool_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pool_id UUID NOT NULL REFERENCES rain_pools(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  avatar_url TEXT,
  free_tickets INTEGER NOT NULL DEFAULT 1,
  burn_boost_tickets INTEGER NOT NULL DEFAULT 0,
  twitter_bonus_tickets INTEGER DEFAULT 0,
  total_tickets INTEGER GENERATED ALWAYS AS (free_tickets + burn_boost_tickets + COALESCE(twitter_bonus_tickets, 0)) STORED,
  tier INTEGER DEFAULT 1,
  holdings_usd_at_join DECIMAL(10, 2),
  burn_transaction_signature TEXT,
  burn_amount_tokens DECIMAL(20, 9),
  burn_amount_usd DECIMAL(10, 2),
  twitter_bonus_claimed BOOLEAN DEFAULT FALSE,
  twitter_bonus_timestamp TIMESTAMP WITH TIME ZONE,
  twitter_bonus_tweet_url TEXT,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_burn_transaction UNIQUE (burn_transaction_signature)
);

COMMENT ON TABLE rain_pool_participants IS 'Users participating in each rain pool';
COMMENT ON COLUMN rain_pool_participants.total_tickets IS 'Auto-calculated total from free + burn boost + twitter bonus tickets';
COMMENT ON COLUMN rain_pool_participants.tier IS 'Holdings tier (1-5) determining free tickets';

-- -----------------------------------------------------------------------------
-- Rain Pool Winners Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rain_pool_winners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pool_id UUID NOT NULL REFERENCES rain_pools(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  reward_sol DECIMAL(20, 9) NOT NULL,
  payout_tx_sig TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE rain_pool_winners IS 'Winners of each rain pool (users can win multiple times in same pool)';

-- -----------------------------------------------------------------------------
-- Burn Transactions Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS burn_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pool_id UUID REFERENCES rain_pools(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  burn_amount_tokens DECIMAL(20, 9) NOT NULL,
  burn_amount_usd DECIMAL(10, 2) NOT NULL,
  tickets_received INTEGER NOT NULL,
  transaction_signature TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE burn_transactions IS 'Analytics and duplicate prevention for token burns';

-- -----------------------------------------------------------------------------
-- Creator Fee Claims Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS creator_fee_claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pool_id UUID REFERENCES rain_pools(id) ON DELETE CASCADE,
  claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tx_sig_claim TEXT NOT NULL UNIQUE,
  total_lamports BIGINT NOT NULL,
  deployer_lamports BIGINT NOT NULL,
  dev_lamports BIGINT NOT NULL,
  tx_sig_deployer TEXT NOT NULL,
  tx_sig_dev TEXT NOT NULL,
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'failed', 'pending')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE creator_fee_claims IS 'Tracks creator fee claims (50% deployer, 50% dev)';

-- -----------------------------------------------------------------------------
-- System Settings Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE system_settings IS 'Application-wide configuration settings';

-- -----------------------------------------------------------------------------
-- Maintenance Attempts Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS maintenance_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  locked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE maintenance_attempts IS 'Rate limiting for maintenance mode password attempts';

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Rain Pools Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_open_pool ON rain_pools (status) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_pools_status ON rain_pools (status);
CREATE INDEX IF NOT EXISTS idx_pools_created_at ON rain_pools (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rain_pools_proof_data ON rain_pools USING GIN (proof_data);

COMMENT ON INDEX idx_one_open_pool IS 'CRITICAL: Ensures only one pool can be open at a time (prevents race conditions)';

-- Rain Pool Participants Indexes
CREATE INDEX IF NOT EXISTS idx_pool_participants_pool_id ON rain_pool_participants(pool_id);
CREATE INDEX IF NOT EXISTS idx_pool_participants_user_id ON rain_pool_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_pool_participants_total_tickets ON rain_pool_participants(total_tickets);
CREATE INDEX IF NOT EXISTS idx_participants_twitter_bonus ON rain_pool_participants(twitter_bonus_claimed);

-- Rain Pool Winners Indexes
CREATE INDEX IF NOT EXISTS idx_winners_pool_id ON rain_pool_winners(pool_id);
CREATE INDEX IF NOT EXISTS idx_winners_user_id ON rain_pool_winners(user_id);
CREATE INDEX IF NOT EXISTS idx_winners_payout ON rain_pool_winners(payout_tx_sig);

-- Burn Transactions Indexes
CREATE INDEX IF NOT EXISTS idx_burn_transactions_pool_id ON burn_transactions(pool_id);
CREATE INDEX IF NOT EXISTS idx_burn_transactions_wallet ON burn_transactions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_burn_transactions_created_at ON burn_transactions(created_at DESC);

-- Creator Fee Claims Indexes
CREATE INDEX IF NOT EXISTS idx_creator_fee_claims_pool_id ON creator_fee_claims(pool_id);
CREATE INDEX IF NOT EXISTS idx_creator_fee_claims_claimed_at ON creator_fee_claims(claimed_at DESC);
CREATE INDEX IF NOT EXISTS idx_creator_fee_claims_status ON creator_fee_claims(status);
CREATE INDEX IF NOT EXISTS idx_creator_fee_claims_tx_sig_claim ON creator_fee_claims(tx_sig_claim);

-- Maintenance Attempts Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_maintenance_attempts_ip ON maintenance_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_maintenance_attempts_locked ON maintenance_attempts(locked_until) WHERE locked_until IS NOT NULL;

-- ============================================================================
-- VIEWS
-- ============================================================================

-- -----------------------------------------------------------------------------
-- Current Open Pool View
-- -----------------------------------------------------------------------------
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
  winner_wallet_addresses,
  proof_data
FROM rain_pools
WHERE status = 'open'
ORDER BY created_at DESC
LIMIT 1;

COMMENT ON VIEW current_open_pool IS 'Quick access to the currently active pool';

-- -----------------------------------------------------------------------------
-- Burn Statistics View
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW burn_statistics AS
SELECT
  DATE(created_at) as date,
  COUNT(*) as total_burns,
  SUM(burn_amount_tokens) as total_tokens_burned,
  SUM(burn_amount_usd) as total_usd_burned,
  SUM(tickets_received) as total_tickets_issued,
  AVG(burn_amount_usd) as avg_burn_usd
FROM burn_transactions
GROUP BY DATE(created_at)
ORDER BY date DESC;

COMMENT ON VIEW burn_statistics IS 'Daily aggregated burn transaction statistics';

-- -----------------------------------------------------------------------------
-- Twitter Bonus Statistics View
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW twitter_bonus_statistics AS
SELECT
  DATE(twitter_bonus_timestamp) as date,
  COUNT(*) as total_claims,
  SUM(twitter_bonus_tickets) as total_tickets_issued
FROM rain_pool_participants
WHERE twitter_bonus_claimed = TRUE
GROUP BY DATE(twitter_bonus_timestamp)
ORDER BY date DESC;

COMMENT ON VIEW twitter_bonus_statistics IS 'Daily Twitter bonus claim statistics';

-- -----------------------------------------------------------------------------
-- Creator Fee Statistics View
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW creator_fee_statistics AS
SELECT
  DATE(claimed_at) as date,
  COUNT(*) as total_claims,
  SUM(total_lamports) as total_lamports_claimed,
  SUM(deployer_lamports) as total_deployer_lamports,
  SUM(dev_lamports) as total_dev_lamports,
  COUNT(*) FILTER (WHERE status = 'completed') as successful_claims,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_claims
FROM creator_fee_claims
GROUP BY DATE(claimed_at)
ORDER BY date DESC;

COMMENT ON VIEW creator_fee_statistics IS 'Daily creator fee claim statistics';

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- -----------------------------------------------------------------------------
-- Get User Burn History
-- -----------------------------------------------------------------------------
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

COMMENT ON FUNCTION get_user_burn_history IS 'Returns burn history for a specific wallet address';

-- -----------------------------------------------------------------------------
-- Get Community Burn Stats
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_community_burn_stats()
RETURNS TABLE (
  total_burns BIGINT,
  total_tokens_burned DECIMAL(20, 9),
  total_usd_burned DECIMAL(10, 2),
  total_tickets_issued BIGINT,
  unique_burners BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_burns,
    SUM(burn_amount_tokens) as total_tokens_burned,
    SUM(burn_amount_usd) as total_usd_burned,
    SUM(tickets_received)::BIGINT as total_tickets_issued,
    COUNT(DISTINCT wallet_address)::BIGINT as unique_burners
  FROM burn_transactions;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_community_burn_stats IS 'Returns aggregate burn statistics across all pools';

-- -----------------------------------------------------------------------------
-- Can Claim Twitter Bonus
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION can_claim_twitter_bonus(
  p_wallet_address TEXT,
  p_pool_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  participant_exists BOOLEAN;
  bonus_claimed BOOLEAN;
BEGIN
  SELECT
    EXISTS(SELECT 1 FROM rain_pool_participants WHERE wallet_address = p_wallet_address AND pool_id = p_pool_id),
    COALESCE((SELECT twitter_bonus_claimed FROM rain_pool_participants WHERE wallet_address = p_wallet_address AND pool_id = p_pool_id), FALSE)
  INTO participant_exists, bonus_claimed;

  RETURN participant_exists AND NOT bonus_claimed;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION can_claim_twitter_bonus IS 'Checks if user is eligible to claim Twitter bonus for a pool';

-- -----------------------------------------------------------------------------
-- Cleanup Old Maintenance Attempts
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION cleanup_old_maintenance_attempts()
RETURNS void AS $$
BEGIN
  DELETE FROM maintenance_attempts
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_maintenance_attempts IS 'Removes maintenance attempt records older than 24 hours';

-- -----------------------------------------------------------------------------
-- Get Total Creator Fees Claimed
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_total_creator_fees_claimed()
RETURNS TABLE (
  total_claims BIGINT,
  total_sol_claimed DECIMAL(20, 9),
  total_deployer_sol DECIMAL(20, 9),
  total_dev_sol DECIMAL(20, 9)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_claims,
    (SUM(total_lamports) / 1000000000.0)::DECIMAL(20, 9) as total_sol_claimed,
    (SUM(deployer_lamports) / 1000000000.0)::DECIMAL(20, 9) as total_deployer_sol,
    (SUM(dev_lamports) / 1000000000.0)::DECIMAL(20, 9) as total_dev_sol
  FROM creator_fee_claims
  WHERE status = 'completed';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_total_creator_fees_claimed IS 'Returns aggregate statistics for all successful creator fee claims';

-- -----------------------------------------------------------------------------
-- Update Maintenance Attempts Updated At
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_maintenance_attempts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_maintenance_attempts_updated_at IS 'Trigger function to auto-update updated_at timestamp';

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at on maintenance_attempts
DROP TRIGGER IF EXISTS trigger_update_maintenance_attempts_updated_at ON maintenance_attempts;
CREATE TRIGGER trigger_update_maintenance_attempts_updated_at
  BEFORE UPDATE ON maintenance_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_maintenance_attempts_updated_at();

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Insert default system settings
INSERT INTO system_settings (key, value, description)
VALUES
  ('maintenance_mode', 'false', 'Enable/disable maintenance mode'),
  ('maintenance_message', 'Site is temporarily down for maintenance. We''ll be back soon!', 'Message to display on maintenance screen'),
  ('creator_fees_enabled', 'true', 'Enable or disable automatic creator fee claims (true/false)')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- SCHEMA VERSION
-- ============================================================================

-- Create schema version tracking table
CREATE TABLE IF NOT EXISTS schema_version (
  version TEXT PRIMARY KEY,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  description TEXT
);

-- Insert schema version
INSERT INTO schema_version (version, description)
VALUES ('1.0.0', 'Initial schema with all core tables, views, functions, and features')
ON CONFLICT (version) DO NOTHING;

-- ============================================================================
-- COMPLETION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'RainDr0p database schema v1.0.0 applied successfully!';
  RAISE NOTICE 'Tables created: 8';
  RAISE NOTICE 'Views created: 4';
  RAISE NOTICE 'Functions created: 6';
  RAISE NOTICE 'Triggers created: 1';
END $$;
