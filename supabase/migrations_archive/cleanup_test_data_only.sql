-- ============================================
-- CLEANUP SCRIPT: Delete ONLY test data
-- ============================================
-- This will only delete:
--   - Test participants (wallets starting with 'Test')
--   - Test users (wallets starting with 'Test')
--   - Test burn transactions
--   - Pools will be preserved
-- ============================================

DO $$
DECLARE
  test_participant_count INT;
  test_user_count INT;
  test_burn_count INT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TEST DATA CLEANUP - STARTING';
  RAISE NOTICE '========================================';

  -- Count test records
  SELECT COUNT(*) INTO test_participant_count
  FROM rain_pool_participants
  WHERE wallet_address LIKE 'Test%';

  SELECT COUNT(*) INTO test_burn_count
  FROM burn_transactions
  WHERE wallet_address LIKE 'Test%';

  SELECT COUNT(*) INTO test_user_count
  FROM users
  WHERE wallet_address LIKE 'Test%';

  RAISE NOTICE 'Test records to be deleted:';
  RAISE NOTICE '  - Test Participants: %', test_participant_count;
  RAISE NOTICE '  - Test Burn Transactions: %', test_burn_count;
  RAISE NOTICE '  - Test Users: %', test_user_count;
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- Step 1: Delete test participants
  RAISE NOTICE 'Step 1/3: Deleting test participants...';
  DELETE FROM rain_pool_participants WHERE wallet_address LIKE 'Test%';
  RAISE NOTICE '  ✓ Deleted % test participant records', test_participant_count;

  -- Step 2: Delete test burn transactions
  RAISE NOTICE 'Step 2/3: Deleting test burn transactions...';
  DELETE FROM burn_transactions WHERE wallet_address LIKE 'Test%';
  RAISE NOTICE '  ✓ Deleted % test burn transaction records', test_burn_count;

  -- Step 3: Delete test users
  RAISE NOTICE 'Step 3/3: Deleting test users...';
  DELETE FROM users WHERE wallet_address LIKE 'Test%';
  RAISE NOTICE '  ✓ Deleted % test user records', test_user_count;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TEST DATA CLEANUP - COMPLETED';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '  Total test records deleted: %', test_participant_count + test_burn_count + test_user_count;
  RAISE NOTICE '  Real user data and pools preserved';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;
