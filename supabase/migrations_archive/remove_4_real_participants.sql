-- Remove 4 specific real participants from any pool
-- This allows you to clean up test data for these specific wallets

DO $$
DECLARE
  deleted_winners_count INT;
  deleted_participants_count INT;
  deleted_burn_count INT;
  deleted_user_count INT;
  deleted_pools_count INT;
  real_wallets TEXT[] := ARRAY[
    '2xtavWc2NfYoFD3s8NXsFCc15RXS6Ef7XsUX8591nzmC',
    '5guNvnfGSB4VjoThBRfaMCsnYy2AgekxRnmXU2gBoXYc',
    'HAwwk8fWLWkMbVEg3DE9NNsiALgM85WkcPu4z8V2GFpa',
    'FRH1RhB3oJGz2WQ51aWubhKirnYy4hw2rFs6eZqkmsby'
  ];
BEGIN
  -- Delete any winners records for these users (foreign key constraint)
  DELETE FROM rain_pool_winners
  WHERE user_id IN (
    SELECT id FROM users WHERE wallet_address = ANY(real_wallets)
  );

  GET DIAGNOSTICS deleted_winners_count = ROW_COUNT;

  IF deleted_winners_count > 0 THEN
    RAISE NOTICE 'Removed % winner records', deleted_winners_count;
  END IF;

  -- Delete all participants with these wallet addresses
  DELETE FROM rain_pool_participants
  WHERE wallet_address = ANY(real_wallets);

  GET DIAGNOSTICS deleted_participants_count = ROW_COUNT;

  RAISE NOTICE 'Removed % participant records from all pools', deleted_participants_count;

  -- Remove burn transactions if they exist
  DELETE FROM burn_transactions
  WHERE transaction_signature LIKE 'RealBurnTx%';

  GET DIAGNOSTICS deleted_burn_count = ROW_COUNT;

  IF deleted_burn_count > 0 THEN
    RAISE NOTICE 'Removed % burn transactions', deleted_burn_count;
  END IF;

  -- Finally, remove users from users table
  DELETE FROM users
  WHERE wallet_address = ANY(real_wallets);

  GET DIAGNOSTICS deleted_user_count = ROW_COUNT;

  IF deleted_user_count > 0 THEN
    RAISE NOTICE 'Removed % users', deleted_user_count;
  END IF;

  IF deleted_pools_count = 0 AND deleted_winners_count = 0 AND deleted_participants_count = 0 AND deleted_burn_count = 0 AND deleted_user_count = 0 THEN
    RAISE NOTICE 'No data found to remove for these wallets';
  ELSE
    RAISE NOTICE 'Cleanup complete for 4 real participant wallets!';
  END IF;
END $$;
