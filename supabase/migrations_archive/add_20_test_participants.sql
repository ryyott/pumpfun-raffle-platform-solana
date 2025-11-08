-- Add 20 test participants to the current open pool with varying ticket amounts and holdings
-- This simulates a realistic distribution of participants with different tiers and burn boosts

DO $$
DECLARE
  current_pool_id UUID;
  test_wallets TEXT[] := ARRAY[
    'Test1WaLLeTaDDrEsS111111111111111111111',
    'Test2WaLLeTaDDrEsS222222222222222222222',
    'Test3WaLLeTaDDrEsS333333333333333333333',
    'Test4WaLLeTaDDrEsS444444444444444444444',
    'Test5WaLLeTaDDrEsS555555555555555555555',
    'Test6WaLLeTaDDrEsS666666666666666666666',
    'Test7WaLLeTaDDrEsS777777777777777777777',
    'Test8WaLLeTaDDrEsS888888888888888888888',
    'Test9WaLLeTaDDrEsS999999999999999999999',
    'TestAWaLLeTaDDrEsSAAAAAAAAAAAAAAAAAAAAAAA',
    'TestBWaLLeTaDDrEsSBBBBBBBBBBBBBBBBBBBBBBB',
    'TestCWaLLeTaDDrEsSCCCCCCCCCCCCCCCCCCCCCCC',
    'TestDWaLLeTaDDrEsSDDDDDDDDDDDDDDDDDDDDDDD',
    'TestEWaLLeTaDDrEsSEEEEEEEEEEEEEEEEEEEEEEE',
    'TestFWaLLeTaDDrEsSFFFFFFFFFFFFFFFFFFFFFFF',
    'TestGWaLLeTaDDrEsSGGGGGGGGGGGGGGGGGGGGGGG',
    'TestHWaLLeTaDDrEsSHHHHHHHHHHHHHHHHHHHHHHH',
    'TestIWaLLeTaDDrEsSIIIIIIIIIIIIIIIIIIIIIII',
    'TestJWaLLeTaDDrEsSJJJJJJJJJJJJJJJJJJJJJJJ',
    'TestKWaLLeTaDDrEsSKKKKKKKKKKKKKKKKKKKKKKK'
  ];
  test_avatars TEXT[] := ARRAY[
    'raindrop_blue_smile.svg',
    'raindrop_green_wink.svg',
    'raindrop_yellow_open.svg',
    'raindrop_red_angry.svg',
    'raindrop_purple_happy.svg',
    'raindrop_blue_smile.svg',
    'raindrop_green_wink.svg',
    'raindrop_yellow_open.svg',
    'raindrop_red_angry.svg',
    'raindrop_purple_happy.svg',
    'raindrop_blue_smile.svg',
    'raindrop_green_wink.svg',
    'raindrop_yellow_open.svg',
    'raindrop_red_angry.svg',
    'raindrop_purple_happy.svg',
    'raindrop_blue_smile.svg',
    'raindrop_green_wink.svg',
    'raindrop_yellow_open.svg',
    'raindrop_red_angry.svg',
    'raindrop_purple_happy.svg'
  ];
  wallet TEXT;
  user_uuid UUID;
  idx INT := 1;
  total_tickets INT := 0;
BEGIN
  -- Get the current open pool
  SELECT id INTO current_pool_id
  FROM current_open_pool
  LIMIT 1;

  IF current_pool_id IS NULL THEN
    RAISE EXCEPTION 'No current open pool found. Please start a pool first.';
  END IF;

  RAISE NOTICE 'Adding 20 test participants to pool: %', current_pool_id;

  -- Add participants with varying scenarios
  FOREACH wallet IN ARRAY test_wallets
  LOOP
    -- Create or get the user
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
      test_avatars[idx],
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

    IF user_uuid IS NULL THEN
      SELECT id INTO user_uuid FROM users WHERE wallet_address = wallet;
    END IF;

    -- Different scenarios based on index
    CASE
      -- Users 1-5: Tier 1 only (1 ticket each) - 5 tickets total
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
          test_avatars[idx],
          1,
          0,
          1,
          NOW()
        );
        total_tickets := total_tickets + 1;
        RAISE NOTICE 'Added participant % - 1 ticket (Tier 1)', idx;

      -- Users 6-10: Tier 2 only (2 tickets each) - 10 tickets total
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
          test_avatars[idx],
          2,
          0,
          2,
          (idx - 5) * 15.0,  -- $15, $30, $45, $60, $75
          NOW()
        );
        total_tickets := total_tickets + 2;
        RAISE NOTICE 'Added participant % - 2 tickets (Tier 2, $% holdings)', idx, (idx - 5) * 15.0;

      -- Users 11-13: Tier 1 with small burns (1 free + 2-5 burn) - 12 tickets total
      WHEN idx BETWEEN 11 AND 13 THEN
        DECLARE
          burn_tickets INT := (idx - 10) + 1;  -- 2, 3, 4 burn tickets
        BEGIN
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
            test_avatars[idx],
            1,
            burn_tickets,
            1,
            burn_tickets * 5.0,
            burn_tickets * 0.25,
            'TestBurnTx' || idx || LPAD('1', 32, '1'),
            NOW()
          );
          total_tickets := total_tickets + 1 + burn_tickets;
          RAISE NOTICE 'Added participant % - % tickets (1 free + % burn)', idx, 1 + burn_tickets, burn_tickets;
        END;

      -- Users 14-16: Tier 2 with medium burns (2 free + 5-10 burn) - 27 tickets total
      WHEN idx BETWEEN 14 AND 16 THEN
        DECLARE
          burn_tickets INT := (idx - 13) * 2 + 3;  -- 5, 7, 9 burn tickets
          holdings_val NUMERIC := (idx - 13) * 20.0 + 40.0;  -- $60, $80, $100
        BEGIN
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
            test_avatars[idx],
            2,
            burn_tickets,
            2,
            burn_tickets * 8.0,
            burn_tickets * 0.40,
            holdings_val,
            'TestBurnTx' || idx || LPAD('2', 32, '2'),
            NOW()
          );
          total_tickets := total_tickets + 2 + burn_tickets;
          RAISE NOTICE 'Added participant % - % tickets (2 free + % burn, $% holdings)', idx, 2 + burn_tickets, burn_tickets, holdings_val;
        END;

      -- Users 17-18: Tier 2 with large burns (2 free + 15-20 burn) - 41 tickets total
      WHEN idx BETWEEN 17 AND 18 THEN
        DECLARE
          burn_tickets INT := 15 + (idx - 17) * 5;  -- 15, 20 burn tickets
          holdings_val NUMERIC := 100.0 + (idx - 17) * 50.0;  -- $100, $150
        BEGIN
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
            test_avatars[idx],
            2,
            burn_tickets,
            2,
            burn_tickets * 12.0,
            burn_tickets * 0.60,
            holdings_val,
            'TestBurnTx' || idx || LPAD('3', 32, '3'),
            NOW()
          );
          total_tickets := total_tickets + 2 + burn_tickets;
          RAISE NOTICE 'Added participant % - % tickets (2 free + % burn, $% holdings)', idx, 2 + burn_tickets, burn_tickets, holdings_val;
        END;

      -- Users 19-20: Whale participants (2 free + 30-50 burn) - 84 tickets total
      WHEN idx BETWEEN 19 AND 20 THEN
        DECLARE
          burn_tickets INT := 30 + (idx - 19) * 20;  -- 30, 50 burn tickets
          holdings_val NUMERIC := 200.0 + (idx - 19) * 100.0;  -- $200, $300
        BEGIN
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
            test_avatars[idx],
            2,
            burn_tickets,
            2,
            burn_tickets * 15.0,
            burn_tickets * 0.75,
            holdings_val,
            'TestBurnTx' || idx || LPAD('4', 32, '4'),
            NOW()
          );
          total_tickets := total_tickets + 2 + burn_tickets;
          RAISE NOTICE 'Added participant % - % tickets (2 free + % burn, $% holdings)', idx, 2 + burn_tickets, burn_tickets, holdings_val;
        END;
    END CASE;

    idx := idx + 1;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Successfully added 20 test participants';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Distribution summary:';
  RAISE NOTICE '  - 5 users: Tier 1 only (1 ticket each) = 5 tickets';
  RAISE NOTICE '  - 5 users: Tier 2 only (2 tickets each) = 10 tickets';
  RAISE NOTICE '  - 3 users: Tier 1 + small burn (3-5 tickets) = 12 tickets';
  RAISE NOTICE '  - 3 users: Tier 2 + medium burn (7-11 tickets) = 27 tickets';
  RAISE NOTICE '  - 2 users: Tier 2 + large burn (17-22 tickets) = 41 tickets';
  RAISE NOTICE '  - 2 users: Whales (32-52 tickets) = 84 tickets';
  RAISE NOTICE '----------------------------------------';
  RAISE NOTICE 'Total tickets in pool: %', total_tickets;
  RAISE NOTICE '========================================';
END $$;
