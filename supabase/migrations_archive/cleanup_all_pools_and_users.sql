-- ============================================
-- CLEANUP SCRIPT: Delete ALL pools and users
-- ============================================
-- WARNING: This will permanently delete:
--   - All rain_pool_winners records
--   - All rain_pool_participants records
--   - All rain_pools records
--   - All burn_transactions records
--   - All users records
--
-- USE WITH CAUTION - THIS CANNOT BE UNDONE!
-- ============================================

DO $$
DECLARE
  winner_count INT;
  participant_count INT;
  pool_count INT;
  burn_count INT;
  user_count INT;
BEGIN
  -- Count records before deletion
  SELECT COUNT(*) INTO winner_count FROM rain_pool_winners;
  SELECT COUNT(*) INTO participant_count FROM rain_pool_participants;
  SELECT COUNT(*) INTO pool_count FROM rain_pools;
  SELECT COUNT(*) INTO burn_count FROM burn_transactions;
  SELECT COUNT(*) INTO user_count FROM users;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DATABASE CLEANUP - STARTING';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Records to be deleted:';
  RAISE NOTICE '  - Winners: %', winner_count;
  RAISE NOTICE '  - Participants: %', participant_count;
  RAISE NOTICE '  - Pools: %', pool_count;
  RAISE NOTICE '  - Burn Transactions: %', burn_count;
  RAISE NOTICE '  - Users: %', user_count;
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- Step 1: Delete all winners (must delete first due to foreign keys)
  RAISE NOTICE 'Step 1/5: Deleting all rain_pool_winners...';
  DELETE FROM rain_pool_winners;
  RAISE NOTICE '  ✓ Deleted % winner records', winner_count;

  -- Step 2: Delete all participants
  RAISE NOTICE 'Step 2/5: Deleting all rain_pool_participants...';
  DELETE FROM rain_pool_participants;
  RAISE NOTICE '  ✓ Deleted % participant records', participant_count;

  -- Step 3: Delete all burn transactions
  RAISE NOTICE 'Step 3/5: Deleting all burn_transactions...';
  DELETE FROM burn_transactions;
  RAISE NOTICE '  ✓ Deleted % burn transaction records', burn_count;

  -- Step 4: Delete all pools
  RAISE NOTICE 'Step 4/5: Deleting all rain_pools...';
  DELETE FROM rain_pools;
  RAISE NOTICE '  ✓ Deleted % pool records', pool_count;

  -- Step 5: Delete all users
  RAISE NOTICE 'Step 5/5: Deleting all users...';
  DELETE FROM users;
  RAISE NOTICE '  ✓ Deleted % user records', user_count;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DATABASE CLEANUP - COMPLETED';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '  Total records deleted: %', winner_count + participant_count + pool_count + burn_count + user_count;
  RAISE NOTICE '  Database is now clean and ready for fresh data';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;
