-- Remove all dummy participants and users from the database
-- This allows you to reuse the dummy wallets in another pool

DO $$
DECLARE
  deleted_pools_count INT;
  deleted_winners_count INT;
  deleted_participants_count INT;
  deleted_burn_count INT;
  deleted_user_count INT;
BEGIN
  -- Delete any winners records for dummy users (foreign key constraint)
  DELETE FROM rain_pool_winners
  WHERE user_id IN (
    SELECT id FROM users WHERE wallet_address LIKE 'DummyWallet%'
  );

  GET DIAGNOSTICS deleted_winners_count = ROW_COUNT;

  IF deleted_winners_count > 0 THEN
    RAISE NOTICE 'Removed % dummy winners', deleted_winners_count;
  END IF;

  -- Delete all participants with dummy wallet addresses
  DELETE FROM rain_pool_participants
  WHERE wallet_address LIKE 'DummyWallet%';

  GET DIAGNOSTICS deleted_participants_count = ROW_COUNT;

  RAISE NOTICE 'Removed % dummy participants from all pools', deleted_participants_count;

  -- Remove dummy burn transactions if they exist
  DELETE FROM burn_transactions
  WHERE transaction_signature LIKE 'DummyBurnTx%';

  GET DIAGNOSTICS deleted_burn_count = ROW_COUNT;

  IF deleted_burn_count > 0 THEN
    RAISE NOTICE 'Removed % dummy burn transactions', deleted_burn_count;
  END IF;

  -- Finally, remove dummy users from users table
  DELETE FROM users
  WHERE wallet_address LIKE 'DummyWallet%';

  GET DIAGNOSTICS deleted_user_count = ROW_COUNT;

  IF deleted_user_count > 0 THEN
    RAISE NOTICE 'Removed % dummy users', deleted_user_count;
  END IF;

  IF deleted_pools_count = 0 AND deleted_winners_count = 0 AND deleted_participants_count = 0 AND deleted_burn_count = 0 AND deleted_user_count = 0 THEN
    RAISE NOTICE 'No dummy data found to remove';
  ELSE
    RAISE NOTICE 'Cleanup complete! Removed/nullified all dummy data.';
  END IF;
END $$;
