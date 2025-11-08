-- Add 25 dummy participants to the current open pool with varying ticket amounts
-- This includes users with burn boosts (different ticket counts) and users with just free tickets

DO $$
DECLARE
  current_pool_id UUID;
  dummy_wallets TEXT[] := ARRAY[
    'DummyWallet1111111111111111111111111111',
    'DummyWallet2222222222222222222222222222',
    'DummyWallet3333333333333333333333333333',
    'DummyWallet4444444444444444444444444444',
    'DummyWallet5555555555555555555555555555',
    'DummyWallet6666666666666666666666666666',
    'DummyWallet7777777777777777777777777777',
    'DummyWallet8888888888888888888888888888',
    'DummyWallet9999999999999999999999999999',
    'DummyWalletAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    'DummyWalletBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
    'DummyWalletCCCCCCCCCCCCCCCCCCCCCCCCCCCC',
    'DummyWalletDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
    'DummyWalletEEEEEEEEEEEEEEEEEEEEEEEEEEEE',
    'DummyWalletFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
    'DummyWalletGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
    'DummyWalletHHHHHHHHHHHHHHHHHHHHHHHHHHHH',
    'DummyWalletIIIIIIIIIIIIIIIIIIIIIIIIII',
    'DummyWalletJJJJJJJJJJJJJJJJJJJJJJJJJJJJ',
    'DummyWalletKKKKKKKKKKKKKKKKKKKKKKKKKKKK',
    'DummyWalletLLLLLLLLLLLLLLLLLLLLLLLLLLLL',
    'DummyWalletMMMMMMMMMMMMMMMMMMMMMMMMMMMMM',
    'DummyWalletNNNNNNNNNNNNNNNNNNNNNNNNNNNN',
    'DummyWalletOOOOOOOOOOOOOOOOOOOOOOOOOOOO',
    'DummyWalletPPPPPPPPPPPPPPPPPPPPPPPPPPPP'
  ];
  dummy_avatars TEXT[] := ARRAY[
    'raindrop_blue_smile.svg', 'raindrop_green_wink.svg', 'raindrop_yellow_open.svg',
    'raindrop_red_angry.svg', 'raindrop_purple_smile.svg', 'raindrop_blue_wink.svg',
    'raindrop_green_smile.svg', 'raindrop_yellow_angry.svg', 'raindrop_red_smile.svg',
    'raindrop_purple_open.svg', 'raindrop_blue_angry.svg', 'raindrop_green_open.svg',
    'raindrop_yellow_smile.svg', 'raindrop_red_open.svg', 'raindrop_purple_wink.svg',
    'raindrop_blue_open.svg', 'raindrop_green_angry.svg', 'raindrop_yellow_wink.svg',
    'raindrop_red_wink.svg', 'raindrop_purple_angry.svg', 'raindrop_blue_smile.svg',
    'raindrop_green_wink.svg', 'raindrop_yellow_open.svg', 'raindrop_red_angry.svg',
    'raindrop_purple_smile.svg'
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

  RAISE NOTICE 'Adding dummy participants to pool: %', current_pool_id;

  -- Add participants with varying ticket amounts
  FOREACH wallet IN ARRAY dummy_wallets
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
      dummy_avatars[idx],
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
      -- Users 1-5: Just free tickets (1 ticket each - Tier 1)
      WHEN idx BETWEEN 1 AND 5 THEN
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
          dummy_avatars[idx],
          1,
          0,
          1,
          NOW()
        );

      -- Users 6-10: Tier 2 (2 free tickets)
      WHEN idx BETWEEN 6 AND 10 THEN
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
          dummy_avatars[idx],
          2,
          0,
          2,
          75.00,
          NOW()
        );

      -- Users 11-15: Small burn boost (1 free + 3 burn = 4 total tickets)
      WHEN idx BETWEEN 11 AND 15 THEN
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
          dummy_avatars[idx],
          1,
          3,
          1,
          10.00,
          0.50,
          'DummyBurnTx' || idx || '1111111111111111111111111111',
          NOW()
        );

      -- Users 16-20: Medium burn boost (1 free + 10 burn = 11 total tickets)
      WHEN idx BETWEEN 16 AND 20 THEN
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
          dummy_avatars[idx],
          1,
          10,
          1,
          50.00,
          2.50,
          'DummyBurnTx' || idx || '2222222222222222222222222222',
          NOW()
        );

      -- Users 21-25: Large burn boost (2 free + 20 burn = 22 total tickets - Tier 2 holders who also burned)
      WHEN idx BETWEEN 21 AND 25 THEN
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
          dummy_avatars[idx],
          2,
          20,
          2,
          100.00,
          5.00,
          100.00,
          'DummyBurnTx' || idx || '3333333333333333333333333333',
          NOW()
        );
    END CASE;

    RAISE NOTICE 'Added participant % (#%)', wallet, idx;
    idx := idx + 1;
  END LOOP;

  RAISE NOTICE 'Successfully added % dummy participants', array_length(dummy_wallets, 1);
  RAISE NOTICE 'Ticket distribution:';
  RAISE NOTICE '  - 5 users with 1 ticket (Tier 1, no burn)';
  RAISE NOTICE '  - 5 users with 2 tickets (Tier 2, no burn)';
  RAISE NOTICE '  - 5 users with 4 tickets (Tier 1 + small burn)';
  RAISE NOTICE '  - 5 users with 11 tickets (Tier 1 + medium burn)';
  RAISE NOTICE '  - 5 users with 22 tickets (Tier 2 + large burn)';
  RAISE NOTICE 'Total tickets added: %', (5*1 + 5*2 + 5*4 + 5*11 + 5*22);
END $$;
