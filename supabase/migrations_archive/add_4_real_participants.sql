-- Add 4 real participants to the current open pool with varying ticket amounts
-- This includes users with burn boosts (different ticket counts) and users with just free tickets

DO $$
DECLARE
  current_pool_id UUID;
  real_wallets TEXT[] := ARRAY[
    '2xtavWc2NfYoFD3s8NXsFCc15RXS6Ef7XsUX8591nzmC',
    '5guNvnfGSB4VjoThBRfaMCsnYy2AgekxRnmXU2gBoXYc',
    'HAwwk8fWLWkMbVEg3DE9NNsiALgM85WkcPu4z8V2GFpa',
    'FRH1RhB3oJGz2WQ51aWubhKirnYy4hw2rFs6eZqkmsby'
  ];
  real_avatars TEXT[] := ARRAY[
    'raindrop_blue_smile.svg',
    'raindrop_green_wink.svg',
    'raindrop_yellow_open.svg',
    'raindrop_red_angry.svg'
  ];
  wallet TEXT;
  user_uuid UUID;
  idx INT := 1;
BEGIN
  -- Get the current open pool
  SELECT id INTO current_pool_id
  FROM current_open_pool
  LIMIT 1;

  IF current_pool_id IS NULL THEN
    RAISE EXCEPTION 'No current open pool found. Please start a pool first.';
  END IF;

  RAISE NOTICE 'Adding 4 real participants to pool: %', current_pool_id;

  -- Add participants with varying ticket amounts
  FOREACH wallet IN ARRAY real_wallets
  LOOP
    -- First, create or get the user
    INSERT INTO users (
      wallet_address,
      avatar,
      token_balance,
      sol_balance,
      is_eligible,
      last_seen,
      created_at,
      updated_at
    ) VALUES (
      wallet,
      real_avatars[idx],
      100.0,
      1.0,
      true,
      NOW(),
      NOW(),
      NOW()
    )
    ON CONFLICT (wallet_address) DO UPDATE
    SET last_seen = NOW()
    RETURNING id INTO user_uuid;

    -- If the user already existed, get their ID
    IF user_uuid IS NULL THEN
      SELECT id INTO user_uuid FROM users WHERE wallet_address = wallet;
    END IF;

    -- Different scenarios based on index
    CASE
      -- User 1: Just free ticket (1 ticket - Tier 1)
      WHEN idx = 1 THEN
        INSERT INTO rain_pool_participants (
          user_id,
          pool_id,
          wallet_address,
          avatar_url,
          free_tickets,
          burn_boost_tickets,
          tier,
          joined_at
        ) VALUES (
          user_uuid,
          current_pool_id,
          wallet,
          real_avatars[idx],
          1,
          0,
          1,
          NOW()
        );
        RAISE NOTICE 'Added participant % (#%) - 1 ticket (Tier 1)', wallet, idx;

      -- User 2: Tier 2 (2 free tickets)
      WHEN idx = 2 THEN
        INSERT INTO rain_pool_participants (
          user_id,
          pool_id,
          wallet_address,
          avatar_url,
          free_tickets,
          burn_boost_tickets,
          tier,
          holdings_usd_at_join,
          joined_at
        ) VALUES (
          user_uuid,
          current_pool_id,
          wallet,
          real_avatars[idx],
          2,
          0,
          2,
          75.00,
          NOW()
        );
        RAISE NOTICE 'Added participant % (#%) - 2 tickets (Tier 2)', wallet, idx;

      -- User 3: Small burn boost (1 free + 3 burn = 4 total tickets)
      WHEN idx = 3 THEN
        INSERT INTO rain_pool_participants (
          user_id,
          pool_id,
          wallet_address,
          avatar_url,
          free_tickets,
          burn_boost_tickets,
          tier,
          burn_amount_tokens,
          burn_amount_usd,
          burn_transaction_signature,
          joined_at
        ) VALUES (
          user_uuid,
          current_pool_id,
          wallet,
          real_avatars[idx],
          1,
          3,
          1,
          10.00,
          0.50,
          'RealBurnTx' || idx || '1111111111111111111111111111111',
          NOW()
        );
        RAISE NOTICE 'Added participant % (#%) - 4 tickets (1 free + 3 burn)', wallet, idx;

      -- User 4: Large burn boost (2 free + 20 burn = 22 total tickets - Tier 2 holder who also burned)
      WHEN idx = 4 THEN
        INSERT INTO rain_pool_participants (
          user_id,
          pool_id,
          wallet_address,
          avatar_url,
          free_tickets,
          burn_boost_tickets,
          tier,
          burn_amount_tokens,
          burn_amount_usd,
          holdings_usd_at_join,
          burn_transaction_signature,
          joined_at
        ) VALUES (
          user_uuid,
          current_pool_id,
          wallet,
          real_avatars[idx],
          2,
          20,
          2,
          100.00,
          5.00,
          100.00,
          'RealBurnTx' || idx || '3333333333333333333333333333333',
          NOW()
        );
        RAISE NOTICE 'Added participant % (#%) - 22 tickets (2 free + 20 burn)', wallet, idx;
    END CASE;

    idx := idx + 1;
  END LOOP;

  RAISE NOTICE 'Successfully added 4 real participants';
  RAISE NOTICE 'Ticket distribution:';
  RAISE NOTICE '  - User 1: 1 ticket (Tier 1, no burn)';
  RAISE NOTICE '  - User 2: 2 tickets (Tier 2, no burn)';
  RAISE NOTICE '  - User 3: 4 tickets (Tier 1 + small burn)';
  RAISE NOTICE '  - User 4: 22 tickets (Tier 2 + large burn)';
  RAISE NOTICE 'Total tickets added: %', (1 + 2 + 4 + 22);
END $$;
