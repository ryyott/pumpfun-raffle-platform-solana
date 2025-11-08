-- ============================================
-- DIAGNOSTIC SCRIPT: Check Creator Rewards Status
-- ============================================
-- This will show you:
--   1. If creator fees are enabled
--   2. All creator fee claims (successful and failed)
--   3. Total SOL claimed and distributed
--   4. Current pool prize from creator rewards
--   5. Recent pool creator reward updates
-- ============================================

DO $$
DECLARE
  is_enabled TEXT;
  total_claims INT;
  successful_claims INT;
  failed_claims INT;
  total_sol_claimed NUMERIC;
  total_sol_to_deployer NUMERIC;
  total_sol_to_dev NUMERIC;
  current_pool_prize NUMERIC;
  current_pool_creator_rewards NUMERIC;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'CREATOR REWARDS STATUS CHECK';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- Check if creator fees are enabled
  SELECT value INTO is_enabled
  FROM system_settings
  WHERE key = 'creator_fees_enabled';

  RAISE NOTICE '1. CREATOR FEES SETTING';
  RAISE NOTICE '   Status: %', COALESCE(is_enabled, 'NOT SET (disabled by default)');
  RAISE NOTICE '';

  -- Get claim statistics
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'completed'),
    COUNT(*) FILTER (WHERE status = 'failed')
  INTO total_claims, successful_claims, failed_claims
  FROM creator_fee_claims;

  RAISE NOTICE '2. CLAIM STATISTICS';
  RAISE NOTICE '   Total claims: %', COALESCE(total_claims, 0);
  RAISE NOTICE '   Successful: %', COALESCE(successful_claims, 0);
  RAISE NOTICE '   Failed: %', COALESCE(failed_claims, 0);
  RAISE NOTICE '';

  -- Get financial summary
  SELECT
    SUM(total_lamports) / 1000000000.0,
    SUM(deployer_lamports) / 1000000000.0,
    SUM(dev_lamports) / 1000000000.0
  INTO total_sol_claimed, total_sol_to_deployer, total_sol_to_dev
  FROM creator_fee_claims
  WHERE status = 'completed';

  RAISE NOTICE '3. FINANCIAL SUMMARY';
  RAISE NOTICE '   Total SOL claimed: % SOL', COALESCE(total_sol_claimed, 0);
  RAISE NOTICE '   To Deployer (pool prize): % SOL', COALESCE(total_sol_to_deployer, 0);
  RAISE NOTICE '   To Dev wallet: % SOL', COALESCE(total_sol_to_dev, 0);
  RAISE NOTICE '';

  -- Get current pool info
  SELECT total_prize_sol, creator_rewards_giveaway_sol
  INTO current_pool_prize, current_pool_creator_rewards
  FROM rain_pools
  WHERE status = 'open'
  ORDER BY created_at DESC
  LIMIT 1;

  IF current_pool_prize IS NOT NULL THEN
    RAISE NOTICE '4. CURRENT OPEN POOL';
    RAISE NOTICE '   Total prize: % SOL', current_pool_prize;
    RAISE NOTICE '   From creator rewards: % SOL', COALESCE(current_pool_creator_rewards, 0);
    RAISE NOTICE '';
  ELSE
    RAISE NOTICE '4. CURRENT OPEN POOL';
    RAISE NOTICE '   No open pool found';
    RAISE NOTICE '';
  END IF;

  -- Show recent claims
  RAISE NOTICE '5. RECENT CLAIMS (Last 10)';
  RAISE NOTICE '========================================';

  FOR rec IN
    SELECT
      id,
      created_at,
      status,
      (total_lamports / 1000000000.0) as total_sol,
      (deployer_lamports / 1000000000.0) as deployer_sol,
      (dev_lamports / 1000000000.0) as dev_sol,
      tx_sig_claim,
      error_message
    FROM creator_fee_claims
    ORDER BY created_at DESC
    LIMIT 10
  LOOP
    RAISE NOTICE '';
    RAISE NOTICE 'Claim ID: %', rec.id;
    RAISE NOTICE '  Time: %', rec.created_at;
    RAISE NOTICE '  Status: %', rec.status;
    RAISE NOTICE '  Total: % SOL', rec.total_sol;
    RAISE NOTICE '  Deployer: % SOL', rec.deployer_sol;
    RAISE NOTICE '  Dev: % SOL', rec.dev_sol;
    RAISE NOTICE '  TX: %', LEFT(rec.tx_sig_claim, 20) || '...';
    IF rec.error_message IS NOT NULL THEN
      RAISE NOTICE '  Error: %', rec.error_message;
    END IF;
  END LOOP;

  IF total_claims = 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE 'No claims found in database';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'END OF REPORT';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- Show helpful tips
  RAISE NOTICE 'TROUBLESHOOTING TIPS:';
  RAISE NOTICE '';
  IF is_enabled IS NULL OR is_enabled != 'true' THEN
    RAISE NOTICE '⚠️  Creator fees are DISABLED. Enable them with:';
    RAISE NOTICE '   INSERT INTO system_settings (key, value) VALUES (''creator_fees_enabled'', ''true'')';
    RAISE NOTICE '   ON CONFLICT (key) DO UPDATE SET value = ''true'';';
  END IF;

  IF total_claims = 0 THEN
    RAISE NOTICE '⚠️  No claims found. This could mean:';
    RAISE NOTICE '   1. The claim-creator-fee function hasn''t been called yet';
    RAISE NOTICE '   2. The cron job isn''t set up';
    RAISE NOTICE '   3. There are no fees to claim (no trades on Pump.fun)';
    RAISE NOTICE '';
    RAISE NOTICE '   To manually test claiming, call the function:';
    RAISE NOTICE '   curl -X POST https://your-project.supabase.co/functions/v1/claim-creator-fee \';
    RAISE NOTICE '     -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \';
    RAISE NOTICE '     -H "Content-Type: application/json" \';
    RAISE NOTICE '     -d ''{"mint":"4RB9s6anCqR9bwA5NBYPZdsY3pdkS43r9bGLJjBYpump"}''';
  END IF;

  IF failed_claims > 0 THEN
    RAISE NOTICE '⚠️  % failed claims detected. Check error messages above.', failed_claims;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE 'View claims on Solscan: https://solscan.io/tx/[TX_SIGNATURE]';
  RAISE NOTICE '';
END $$;
